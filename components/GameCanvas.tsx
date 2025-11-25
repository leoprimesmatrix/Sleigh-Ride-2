
import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, Player, Obstacle, Powerup, DataLog, EMPBurst, Particle, ParticleType, PowerupType, Entity, BackgroundLayer, DialogueLine, GameMode, Landmark
} from '../types.ts';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, THRUST_POWER, MAX_FALL_SPEED, BASE_SPEED, 
  LEVELS, LEVEL_THRESHOLDS, POWERUP_COLORS, TOTAL_GAME_TIME_SECONDS, VICTORY_DISTANCE, 
  EMP_COST, EMP_RADIUS, ENERGY_RECHARGE_RATE,
  DATA_LOGS, NARRATIVE_FRAGMENTS, STORY_MOMENTS, LANDMARKS
} from '../constants.ts';
import UIOverlay from './UIOverlay.tsx';
import { soundManager } from '../audio.ts';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onWin: () => void;
  gameMode: GameMode;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, onWin, gameMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Entities
  const playerRef = useRef<Player>({
    id: 0, x: 100, y: 300, width: 80, height: 35, markedForDeletion: false,
    vy: 0, integrity: 100, energy: 100, maxEnergy: 100,
    isShielded: false, shieldTimer: 0, overclockTimer: 0, angle: 0, isThrusting: false
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const logsRef = useRef<DataLog[]>([]);
  const landmarksRef = useRef<Landmark[]>([]);
  const empsRef = useRef<EMPBurst[]>([]); 
  const particlesRef = useRef<Particle[]>([]);
  
  // Visuals
  const starsRef = useRef<{x:number, y:number, size:number, opacity:number, blinkSpeed: number}[]>([]); 
  
  // Background layers now store seed data for procedural generation consistency
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '#0f172a', speedModifier: 0.05, offset: 0 }, // Distant Mega-Structures
    { points: [], color: '#1e293b', speedModifier: 0.2, offset: 0 },  // Mid-range Skyline
    { points: [], color: '#334155', speedModifier: 0.5, offset: 0 },  // Foreground Ruins
  ]);

  // Logic
  const shakeRef = useRef(0);
  const isEndingSequenceRef = useRef(false);
  const endingTimerRef = useRef(0);

  // State Sync
  const activeDialogueRef = useRef<DialogueLine | null>(null);
  const activeLogRef = useRef<string | null>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(TOTAL_GAME_TIME_SECONDS);
  const lastFrameTimeRef = useRef(0);
  const lastLevelIndexRef = useRef(0); // Set to 0 to avoid -1 issues
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const [hudState, setHudState] = useState({
    integrity: 100, energy: 100, progress: 0, timeLeft: TOTAL_GAME_TIME_SECONDS, 
    levelIndex: 0, score: 0,
    activeDialogue: null as DialogueLine | null, activeLog: null as string | null,
    isShielded: false
  });

  const createParticles = (x:number, y:number, type:ParticleType, count:number, color:string) => {
    for(let i=0; i<count; i++) {
        const speed = type === ParticleType.THRUST ? 4 : 8;
        particlesRef.current.push({ 
            id:Math.random(), 
            type, 
            x, 
            y, 
            radius: type === ParticleType.THRUST ? Math.random()*3+1 : Math.random()*3+1, 
            vx: type === ParticleType.THRUST ? -Math.random()*speed - 2 : (Math.random()-0.5)*speed, 
            vy: type === ParticleType.THRUST ? (Math.random()-0.5)*1 : (Math.random()-0.5)*speed, 
            alpha:1, 
            color, 
            life: type === ParticleType.THRUST ? 0.4 : 1.0, 
            maxLife: type === ParticleType.THRUST ? 0.4 : 1.0 
        });
    }
  };

  const triggerEMP = () => {
      if (playerRef.current.energy >= EMP_COST) {
          playerRef.current.energy -= EMP_COST;
          soundManager.playEMP();
          empsRef.current.push({
              id: Date.now(), x: playerRef.current.x + 40, y: playerRef.current.y + 20,
              radius: 10, maxRadius: EMP_RADIUS, markedForDeletion: false
          });
          shakeRef.current = 15;
          createParticles(playerRef.current.x + 40, playerRef.current.y + 20, ParticleType.GLITCH, 20, '#0ea5e9');
      } else {
          soundManager.playLowEnergy();
      }
  };

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling
      if(['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      
      if (gameState === GameState.MENU) soundManager.init();
      pressedKeysRef.current.add(e.code);
      
      if (gameState === GameState.PLAYING && (e.code === 'KeyZ' || e.code === 'Enter')) {
        triggerEMP();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.code);
    };
    const handleTouchStart = (e: TouchEvent) => {
       if (gameState === GameState.MENU) soundManager.init();
       const touchX = e.touches[0].clientX;
       if (touchX < window.innerWidth / 2) pressedKeysRef.current.add('Space');
       else triggerEMP();
    };
    const handleTouchEnd = () => {
       pressedKeysRef.current.delete('Space');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => { 
        window.removeEventListener('keydown', handleKeyDown); 
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState]);

  // Main Game Loop & Init
  useEffect(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.INTRO) return;

    // --- Background Initialization (Guaranteed to run before render loop) ---
    const genSkyline = (count: number, minH: number, maxH: number) => {
        const pts = [];
        for (let i = 0; i < count; i++) {
             pts.push({ height: minH + Math.random() * (maxH - minH), type: Math.floor(Math.random() * 5) });
        }
        return pts;
    };

    if (bgLayersRef.current[0].points.length === 0) {
        bgLayersRef.current[0].points = genSkyline(100, 150, 400) as any;
        bgLayersRef.current[1].points = genSkyline(100, 80, 200) as any;
        bgLayersRef.current[2].points = genSkyline(100, 40, 100) as any;
        
        starsRef.current = [];
        for(let i=0; i<80; i++) {
            starsRef.current.push({ 
                x: Math.random()*CANVAS_WIDTH, 
                y: Math.random()*CANVAS_HEIGHT, 
                size: Math.random()*1.5 + 0.5, 
                opacity: Math.random(),
                blinkSpeed: Math.random() * 0.03 + 0.01
            });
        }
    }

    try {
        soundManager.init();
        soundManager.reset();
    } catch(e) { console.warn("Audio init warning", e); }

    let animId: number;
    const ctx = canvasRef.current?.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resetGame = () => {
      playerRef.current = { id: 0, x: 100, y: 300, width: 80, height: 35, markedForDeletion: false, vy: 0, integrity: 100, energy: 100, maxEnergy: 100, isShielded: false, shieldTimer: 0, overclockTimer: 0, angle: 0, isThrusting: false };
      obstaclesRef.current = []; powerupsRef.current = []; logsRef.current = []; landmarksRef.current = []; empsRef.current = []; particlesRef.current = [];
      distanceRef.current = 0; scoreRef.current = 0; timeRef.current = TOTAL_GAME_TIME_SECONDS;
      triggeredEventsRef.current.clear(); isEndingSequenceRef.current = false; endingTimerRef.current = 0;
      lastLevelIndexRef.current = 0;
      soundManager.stopBgm();
    };

    if (gameState === GameState.INTRO || playerRef.current.integrity <= 0) resetGame();
    lastFrameTimeRef.current = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;
      update(dt, now);
      draw(ctx, now);

      if (gameState === GameState.INTRO) { animId = requestAnimationFrame(render); return; }

      if (playerRef.current.integrity > 0) {
          animId = requestAnimationFrame(render);
      } else {
          setGameState(GameState.GAME_OVER);
      }
    };

    const update = (dt: number, now: number) => {
      const player = playerRef.current;
      const timeScale = dt * 60;

      // 1. Inputs & Physics
      if (!isEndingSequenceRef.current) {
          if (pressedKeysRef.current.has('Space') || pressedKeysRef.current.has('ArrowUp')) {
              player.vy += THRUST_POWER * timeScale; 
              player.isThrusting = true;
              createParticles(player.x - 10, player.y + 15, ParticleType.THRUST, 1, '#3b82f6'); 
          } else {
              player.isThrusting = false;
          }
          player.vy += GRAVITY * timeScale;
          player.vy = Math.min(player.vy, MAX_FALL_SPEED);
          player.y += player.vy * timeScale;
          
          const targetAngle = player.vy * 0.05;
          player.angle += (targetAngle - player.angle) * 0.1 * timeScale;

          if (player.y < 0) { player.y = 0; player.vy = 0; }
          if (player.y > CANVAS_HEIGHT - 60) { player.y = CANVAS_HEIGHT - 60; player.vy = 0; }
      }

      // 2. Progression
      const speedMult = player.overclockTimer > 0 ? 1.5 : 1.0;
      let progressRatio = distanceRef.current / VICTORY_DISTANCE;
      if (gameMode === GameMode.STORY) progressRatio = Math.min(1.02, progressRatio);

      const currentSpeed = isEndingSequenceRef.current ? BASE_SPEED * 0.5 : BASE_SPEED * speedMult;
      
      soundManager.setEnginePitch(player.isThrusting ? 0.8 : 0.2);

      let levelIndex = 0;
      const progressPercent = progressRatio * 100;
      for (let i = LEVELS.length - 1; i >= 0; i--) { if (progressPercent >= LEVEL_THRESHOLDS[i]) { levelIndex = i; break; }}
      
      if (levelIndex !== lastLevelIndexRef.current) {
          soundManager.playLevelBgm(levelIndex);
          lastLevelIndexRef.current = levelIndex;
      }
      const level = LEVELS[levelIndex] || LEVELS[0];

      if (gameMode === GameMode.STORY && progressRatio >= 0.96 && !isEndingSequenceRef.current) {
          isEndingSequenceRef.current = true;
          player.isShielded = true;
          soundManager.playEndingMusic();
      }
      if (isEndingSequenceRef.current) {
          player.y += (CANVAS_HEIGHT/2 - player.y) * 0.05 * timeScale;
          endingTimerRef.current += dt;
          if (endingTimerRef.current > 4.0 && landmarksRef.current.some(l => l.type === 'CHRONOS_RING' && l.x < 300)) {
               setGameState(GameState.VICTORY); onWin();
          }
      } else {
          distanceRef.current += currentSpeed * timeScale;
          scoreRef.current += currentSpeed * 0.1 * timeScale;
          timeRef.current -= dt;
      }

      // 3. Spawning
      if (!isEndingSequenceRef.current) {
          if (Math.random() < 0.015 * level.spawnRate * timeScale && levelIndex !== 4) {
              const types: Obstacle['type'][] = ['DEBRIS', 'DRONE', 'SERVER_TOWER', 'ENERGY_BARRIER'];
              let type = types[0];
              const r = Math.random();
              if (r < 0.3) type = 'DEBRIS';
              else if (r < 0.6) type = 'DRONE';
              else if (r < 0.85) type = 'ENERGY_BARRIER';
              else type = 'SERVER_TOWER';

              let y = Math.random() * (CANVAS_HEIGHT - 100);
              let w = 40; let h = 40;
              
              if (type === 'SERVER_TOWER') {
                  y = CANVAS_HEIGHT - 200; w = 60; h = 200;
              } else if (type === 'ENERGY_BARRIER') {
                  h = 150; y = Math.random() * (CANVAS_HEIGHT - h); w = 30;
              } else if (type === 'DEBRIS') {
                  w = 50; h = 50;
              }

              obstaclesRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH + 50, y, width: w, height: h,
                  type, isDisabled: false, markedForDeletion: false, rotation: Math.random() * Math.PI * 2
              });
          }
          if (Math.random() < 0.005 * timeScale) {
              const types = Object.values(PowerupType);
              powerupsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-100), width: 40, height: 40,
                  type: types[Math.floor(Math.random()*types.length)], floatOffset: 0, markedForDeletion: false
              });
          }
          if (Math.random() < 0.003 * timeScale && gameMode === GameMode.STORY) {
              logsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-200), width: 30, height: 20,
                  message: DATA_LOGS[Math.floor(Math.random() * DATA_LOGS.length)], floatOffset: 0, markedForDeletion: false
              });
          }
      }

      // Narrative
      if (gameMode === GameMode.STORY) {
         STORY_MOMENTS.forEach(m => {
             if (progressRatio >= m.progress && !triggeredEventsRef.current.has(m.dialogue.id)) {
                 triggeredEventsRef.current.add(m.dialogue.id);
                 activeDialogueRef.current = m.dialogue;
                 setTimeout(() => { if (activeDialogueRef.current?.id === m.dialogue.id) activeDialogueRef.current = null; }, 6000);
             }
         });
         NARRATIVE_FRAGMENTS.forEach(nf => {
             const key = `frag_${nf.progress}`;
             if (progressRatio >= nf.progress && !triggeredEventsRef.current.has(key)) {
                 triggeredEventsRef.current.add(key);
                 logsRef.current.push({
                     id: Date.now(), x: CANVAS_WIDTH + 100, y: 100 + Math.random()*300, width: 30, height: 20,
                     message: nf.message, floatOffset: 0, markedForDeletion: false, isCoreMemory: true
                 });
             }
         });
         LANDMARKS.forEach(lm => {
             if (progressRatio >= lm.progress && !triggeredEventsRef.current.has(lm.type)) {
                 triggeredEventsRef.current.add(lm.type);
                 landmarksRef.current.push({
                     id: Date.now(), x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT/2, width: 300, height: 300,
                     type: lm.type, name: lm.name, markedForDeletion: false
                 });
             }
         });
      }

      // 4. Updates & Physics
      empsRef.current.forEach(emp => {
          emp.radius += 15 * timeScale;
          if (emp.radius > emp.maxRadius) emp.markedForDeletion = true;
          obstaclesRef.current.forEach(obs => {
             const dx = (obs.x + obs.width/2) - emp.x; const dy = (obs.y + obs.height/2) - emp.y;
             if (Math.sqrt(dx*dx + dy*dy) < emp.radius && !obs.isDisabled) {
                 obs.isDisabled = true;
                 createParticles(obs.x + obs.width/2, obs.y + obs.height/2, ParticleType.GLITCH, 10, '#22c55e');
                 scoreRef.current += 50;
             }
          });
      });

      player.energy = Math.min(player.maxEnergy, player.energy + ENERGY_RECHARGE_RATE * timeScale);
      if (player.shieldTimer > 0) player.shieldTimer -= dt;
      if (player.overclockTimer > 0) player.overclockTimer -= dt;
      player.isShielded = player.shieldTimer > 0 || isEndingSequenceRef.current;

      obstaclesRef.current.forEach(obs => {
          obs.x -= currentSpeed * level.obstacleSpeed * timeScale;
          if (obs.x < -100) obs.markedForDeletion = true;
          if (obs.type === 'DRONE' || obs.type === 'DEBRIS') obs.rotation! += 0.05 * timeScale;
          
          if (!player.isShielded && !obs.isDisabled && checkCollision(player, obs)) {
              player.integrity -= 20;
              soundManager.playDamage();
              shakeRef.current = 20;
              player.shieldTimer = 1.0; 
              createParticles(player.x + 20, player.y + 10, ParticleType.SPARK, 15, '#f59e0b');
              createParticles(player.x + 20, player.y + 10, ParticleType.SMOKE, 8, '#94a3b8');
          }
      });

      powerupsRef.current.forEach(p => {
          p.x -= currentSpeed * timeScale;
          p.floatOffset += 0.05 * timeScale;
          if (checkCollision(player, p)) {
              p.markedForDeletion = true;
              soundManager.playCollectData();
              createParticles(p.x, p.y, ParticleType.SPARK, 10, POWERUP_COLORS[p.type]);
              if (p.type === PowerupType.CHARGE) player.energy = player.maxEnergy;
              if (p.type === PowerupType.REPAIR) player.integrity = Math.min(100, player.integrity + 30);
              if (p.type === PowerupType.SHIELD) player.shieldTimer = 5.0;
              if (p.type === PowerupType.OVERCLOCK) player.overclockTimer = 8.0;
          }
      });

      logsRef.current.forEach(l => {
          l.x -= currentSpeed * timeScale;
          l.floatOffset += 0.03 * timeScale;
          if (checkCollision(player, l)) {
              l.markedForDeletion = true;
              soundManager.playCollectData();
              activeLogRef.current = l.message;
              setTimeout(() => { if (activeLogRef.current === l.message) activeLogRef.current = null; }, 4000);
          }
      });

      landmarksRef.current.forEach(l => {
          l.x -= currentSpeed * timeScale;
      });

      particlesRef.current.forEach(p => {
          p.life -= dt;
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          
          if (p.type === ParticleType.SPARK) {
              p.vy += 0.5 * timeScale; 
              p.vx *= 0.95; 
          } else if (p.type === ParticleType.SMOKE) {
              p.vy -= 0.1 * timeScale; 
              p.radius += 0.2 * timeScale; 
              p.alpha -= 0.02 * timeScale;
          } else if (p.type === ParticleType.THRUST) {
              p.radius *= 0.9;
          }
      });

      obstaclesRef.current = obstaclesRef.current.filter(e => !e.markedForDeletion);
      powerupsRef.current = powerupsRef.current.filter(e => !e.markedForDeletion);
      logsRef.current = logsRef.current.filter(e => !e.markedForDeletion);
      empsRef.current = empsRef.current.filter(e => !e.markedForDeletion);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      if (now % 100 < 20) {
          setHudState({ 
            integrity: player.integrity, energy: player.energy, isShielded: player.isShielded,
            progress: progressPercent, timeLeft: timeRef.current, levelIndex, score: scoreRef.current,
            activeDialogue: activeDialogueRef.current, activeLog: activeLogRef.current
          });
      }
    };

    const drawAurora = (ctx: CanvasRenderingContext2D, color: string, now: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(20px)';
      ctx.globalAlpha = 0.3;
      const t = now * 0.001;
      
      const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, 100);
      for(let x=0; x<=CANVAS_WIDTH; x+=50) {
         const y = 100 + Math.sin(x*0.005 + t) * 50 + Math.sin(x*0.01 + t*1.5) * 30;
         ctx.lineTo(x, y);
      }
      ctx.lineTo(CANVAS_WIDTH, 0);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
    };

    const draw = (ctx: CanvasRenderingContext2D, now: number) => {
        const levelIndex = Math.max(0, lastLevelIndexRef.current);
        const level = LEVELS[levelIndex] || LEVELS[0];
        
        // 1. Dynamic Sky Gradient
        const grad = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT);
        grad.addColorStop(0, level.colors.sky[0]); grad.addColorStop(1, level.colors.sky[1]);
        ctx.fillStyle = grad; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

        // Cyber Aurora
        if (level.colors.aurora) {
          drawAurora(ctx, level.colors.aurora, now);
        }

        // Sun / Moon / Digital Horizon
        ctx.save();
        ctx.fillStyle = level.colors.grid; 
        ctx.shadowColor = level.colors.grid; ctx.shadowBlur = 60; // Increased glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH - 200, 150, 60, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 2. Stars
        starsRef.current.forEach(s => {
            const flicker = Math.sin(now * 0.005 + s.x) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * flicker})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        });

        // 3. Procedural Skylines (Parallax)
        bgLayersRef.current.forEach((layer, i) => {
            ctx.save();
            ctx.fillStyle = layer.color;
            // Add a neon rim light to buildings
            ctx.strokeStyle = i === 0 ? "transparent" : (level.colors.grid || "#0ea5e9");
            ctx.lineWidth = 1;
            
            const blockWidth = 60 + i * 20; 
            const points = layer.points as any[];
            if (!points || points.length === 0) { ctx.restore(); return; }

            const totalWidth = points.length * blockWidth;
            const scrollPos = (distanceRef.current * layer.speedModifier) % totalWidth;
            const startIndex = Math.floor(scrollPos / blockWidth);
            const offset = scrollPos % blockWidth;

            for (let j = 0; j < Math.ceil(CANVAS_WIDTH / blockWidth) + 1; j++) {
                const idx = (startIndex + j) % points.length;
                const b = points[idx]; 
                if (!b) continue;

                const x = j * blockWidth - offset;
                const h = b.height;
                
                // Draw Building
                ctx.fillRect(x, CANVAS_HEIGHT - h, blockWidth + 1, h);
                
                // Neon Trim
                if (i > 0) {
                     ctx.globalAlpha = 0.3;
                     ctx.beginPath(); ctx.moveTo(x, CANVAS_HEIGHT); ctx.lineTo(x, CANVAS_HEIGHT-h); ctx.lineTo(x+blockWidth, CANVAS_HEIGHT-h); ctx.stroke();
                     ctx.globalAlpha = 1.0;

                     // Windows
                     ctx.fillStyle = i === 1 ? "#334155" : "#475569"; 
                     const windowSize = i === 1 ? 4 : 6;
                     const seed = (idx * 1337) % 100;
                     if (seed % 3 === 0) {
                        ctx.fillRect(x + 10, CANVAS_HEIGHT - h + 10, 5, h - 20);
                     } else if (seed % 3 === 1) {
                        for (let wy = CANVAS_HEIGHT - h + 10; wy < CANVAS_HEIGHT; wy += windowSize * 3) {
                            for (let wx = x + 5; wx < x + blockWidth - 5; wx += windowSize * 2) {
                                if ((wx + wy) % 5 !== 0) {
                                  // Random lit windows
                                  ctx.fillStyle = Math.random() > 0.9 ? "#fbbf24" : (i===1?"#334155":"#475569"); 
                                  if (Math.random() > 0.95) ctx.fillStyle = "#0ea5e9"; // Occasional blue data window
                                  ctx.fillRect(wx, wy, windowSize, windowSize);
                                }
                            }
                        }
                     }
                     ctx.fillStyle = layer.color;
                }
            }
            ctx.restore();
        });

        // 4. Cyber Grid Floor
        ctx.save();
        ctx.strokeStyle = level.colors.grid;
        ctx.lineWidth = 2;
        ctx.shadowColor = level.colors.grid;
        ctx.shadowBlur = 10; // Glowy Grid
        ctx.globalAlpha = 0.6;
        const horizonY = CANVAS_HEIGHT - 50;
        
        ctx.beginPath();
        for(let x = -CANVAS_WIDTH; x < CANVAS_WIDTH * 2; x += 100) {
            ctx.moveTo(x, horizonY);
            const xDist = x - CANVAS_WIDTH/2;
            ctx.lineTo(CANVAS_WIDTH/2 + xDist * 4, CANVAS_HEIGHT);
        }
        
        const moveZ = (distanceRef.current * 1.5) % 100;
        for (let i = 0; i < 10; i++) {
             const yPos = horizonY + Math.pow(i, 2.5) + (moveZ * (i/10)); 
             if (yPos > CANVAS_HEIGHT) continue;
             ctx.moveTo(0, yPos); ctx.lineTo(CANVAS_WIDTH, yPos);
        }
        ctx.stroke();
        
        const gradGround = ctx.createLinearGradient(0, horizonY, 0, CANVAS_HEIGHT);
        gradGround.addColorStop(0, "rgba(0,0,0,0.5)");
        gradGround.addColorStop(1, level.colors.grid);
        ctx.fillStyle = gradGround;
        ctx.fillRect(0, horizonY, CANVAS_WIDTH, CANVAS_HEIGHT - horizonY);
        ctx.restore();

        // 5. Entities
        ctx.save();
        const dx = (Math.random()-0.5)*shakeRef.current; const dy = (Math.random()-0.5)*shakeRef.current;
        ctx.translate(dx, dy);

        landmarksRef.current.forEach(l => drawLandmark(ctx, l));
        obstaclesRef.current.forEach(o => drawObstacle(ctx, o, now));
        powerupsRef.current.forEach(p => drawPowerup(ctx, p));
        logsRef.current.forEach(l => drawLog(ctx, l));
        empsRef.current.forEach(e => drawEMP(ctx, e));

        drawPlayer(ctx, playerRef.current);
        
        particlesRef.current.forEach(p => drawParticle(ctx, p));
        ctx.restore();

        if (lastLevelIndexRef.current < 4) {
            const gradFog = ctx.createLinearGradient(0, CANVAS_HEIGHT-150, 0, CANVAS_HEIGHT);
            gradFog.addColorStop(0, "rgba(0,0,0,0)");
            gradFog.addColorStop(1, level.colors.fog);
            ctx.fillStyle = gradFog;
            ctx.fillRect(0, CANVAS_HEIGHT-150, CANVAS_WIDTH, 150);
        }
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        if (p.type === ParticleType.SPARK || p.type === ParticleType.THRUST) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        } else if (p.type === ParticleType.GLITCH) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.radius, p.radius);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    };

    const drawEMP = (ctx: CanvasRenderingContext2D, emp: EMPBurst) => {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = "rgba(14, 165, 233, 0.2)"; ctx.fill();
        ctx.restore();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
        
        if (p.isShielded) {
            ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2; 
            ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100)*0.2;
            ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI*2); ctx.stroke(); 
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }

        // MK-V Sleigh Body
        ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 15;
        ctx.fillStyle = "#334155"; 
        ctx.beginPath(); 
        ctx.moveTo(35, 5); ctx.lineTo(-20, -12); ctx.lineTo(-40, 0); ctx.lineTo(-20, 15); ctx.lineTo(35, 5); 
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#475569";
        ctx.fillRect(-45, -8, 20, 16);
        
        // Thruster Glow
        ctx.fillStyle = p.isThrusting ? "#3b82f6" : "#1e293b"; 
        ctx.shadowColor = p.isThrusting ? "#3b82f6" : "none"; ctx.shadowBlur = p.isThrusting ? 30 : 0;
        ctx.beginPath(); ctx.ellipse(-48, 0, 4, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Cockpit
        ctx.fillStyle = "#0ea5e9"; 
        ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(5, -5, 15, 8, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); ctx.ellipse(8, -7, 8, 3, -0.2, 0, Math.PI*2); ctx.fill();

        // Scarf/Trail
        const t = Date.now() / 150;
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 10;
        ctx.beginPath(); 
        ctx.moveTo(-10, -8); 
        ctx.quadraticCurveTo(-25, -12 + Math.sin(t)*3, -45 - (p.vy), -8 + Math.cos(t)*3); 
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle, now: number) => {
        ctx.save(); ctx.translate(o.x + o.width/2, o.y + o.height/2);
        ctx.globalAlpha = o.isDisabled ? 0.3 : 1;
        
        if (o.type === 'DRONE') {
            const hover = Math.sin(now * 0.005) * 5;
            ctx.translate(0, hover);
            
            ctx.fillStyle = o.isDisabled ? "#22c55e" : "#ef4444";
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
            
            ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.stroke();
            
            ctx.rotate(now * 0.01);
            ctx.fillStyle = "#475569";
            ctx.fillRect(-22, -2, 10, 4); ctx.fillRect(12, -2, 10, 4);
            ctx.fillRect(-2, -22, 4, 10); ctx.fillRect(-2, 12, 4, 10);
        } else if (o.type === 'SERVER_TOWER') {
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = "#334155"; ctx.fillRect(0,0,4,h); ctx.fillRect(w-4,0,4,h);
            for(let i=10; i<h-10; i+=15) {
                const on = Math.sin(now * 0.01 + i) > 0;
                ctx.fillStyle = on ? (o.isDisabled ? "#22c55e" : "#f59e0b") : "#0f172a";
                ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = on ? 10 : 0;
                ctx.fillRect(10, i, w-20, 6);
                ctx.shadowBlur = 0;
            }
        } else if (o.type === 'ENERGY_BARRIER') {
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            ctx.fillStyle = "#64748b";
            ctx.fillRect(0, 0, w, 15); ctx.fillRect(0, h-15, w, 15);
            if (!o.isDisabled) {
                ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
                ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(w/2, 15);
                for(let i=15; i<h-15; i+=5) {
                    ctx.lineTo(w/2 + (Math.random()-0.5)*10, i);
                }
                ctx.lineTo(w/2, h-15);
                ctx.stroke(); ctx.shadowBlur = 0;
            }
        } else {
            ctx.rotate(o.rotation || 0);
            ctx.fillStyle = "#44403c";
            ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(15, 0); ctx.lineTo(5, 20); ctx.lineTo(-15, 10); ctx.fill();
            ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.arc(5, 5, 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    };

    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
        ctx.save(); ctx.translate(lm.x, lm.y - 150);
        if (lm.type === 'CHRONOS_RING') {
            ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 40;
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;
            const t = Date.now()/1000;
            ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, t, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, -t, 0, Math.PI*2); ctx.stroke();
        } else if (lm.type === 'HOLO_TREE') {
            ctx.strokeStyle = "#22c55e"; ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 30;
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            ctx.moveTo(0, 300); ctx.lineTo(0, 250);
            ctx.moveTo(-60, 250); ctx.lineTo(60, 250); ctx.lineTo(0, 150); ctx.lineTo(-60, 250);
            ctx.moveTo(-50, 150); ctx.lineTo(50, 150); ctx.lineTo(0, 70); ctx.lineTo(-50, 150);
            ctx.stroke(); ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = "#0f172a"; 
            ctx.beginPath(); ctx.rect(-100, 100, 200, 200); ctx.fill();
            ctx.fillRect(-80, 0, 30, 100); ctx.fillRect(20, 20, 30, 80);
            ctx.fillStyle = "#f59e0b";
            for(let i=0; i<200; i+=40) ctx.fillRect(-100+i, 110, 20, 10);
        }
        ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
        const color = POWERUP_COLORS[p.type];
        const cx = p.x + p.width/2; 
        const cy = p.y + p.height/2 + Math.sin(p.floatOffset)*5;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = color; ctx.shadowBlur = 30;
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = color;
        if (p.type === PowerupType.CHARGE) {
            ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.lineTo(-2, 2); ctx.lineTo(4, 2); ctx.lineTo(-3, 10); ctx.lineTo(0, 2); ctx.lineTo(-6, 2); ctx.fill();
        } else if (p.type === PowerupType.REPAIR) {
            ctx.fillRect(-4, -10, 8, 20); ctx.fillRect(-10, -4, 20, 8);
        } else if (p.type === PowerupType.SHIELD) {
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(10, 5, 10, -5); ctx.lineTo(-10, -5); ctx.quadraticCurveTo(-10, 5, 0, 10); ctx.fill();
        } else {
            ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = "#fff"; ctx.fillRect(-4, -4, 8, 8);
        }
        ctx.restore();
    };
    
    const drawLog = (ctx: CanvasRenderingContext2D, l: DataLog) => {
        const y = l.y + Math.sin(l.floatOffset)*5;
        ctx.save(); ctx.translate(l.x, y);
        
        ctx.shadowColor = l.isCoreMemory ? "#f59e0b" : "#94a3b8"; ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0, 30, 20);
        ctx.strokeStyle = l.isCoreMemory ? "#f59e0b" : "#94a3b8"; ctx.lineWidth = 2; ctx.strokeRect(0,0,30,20);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fillRect(5, 5, 20, 2); ctx.fillRect(5, 10, 15, 2); ctx.fillRect(5, 15, 10, 2);
        
        ctx.restore();
    };

    const checkCollision = (r1: Entity, r2: Entity) => (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
    
    animId = requestAnimationFrame(render);
    return () => { 
        cancelAnimationFrame(animId);
        soundManager.stopBgm();
    };
  }, [gameState]);

  return (
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-800 shadow-[0_0_50px_rgba(14,165,233,0.3)] overflow-hidden bg-black rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full" />
      <UIOverlay {...hudState} currentLevelName={LEVELS[hudState.levelIndex].name} currentLevelSub={LEVELS[hudState.levelIndex].subtext} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)' }}></div>
      {/* Scanline Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%' }}></div>
    </div>
  );
};
export default GameCanvas;
