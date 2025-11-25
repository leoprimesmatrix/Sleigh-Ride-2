
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
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '#0f172a', speedModifier: 0.1, offset: 0 }, // Distant Skyline
    { points: [], color: '#1e293b', speedModifier: 0.25, offset: 0 }, // Mid-range Ruins
  ]);

  // Logic
  const shakeRef = useRef(0);
  const isEndingSequenceRef = useRef(false);
  const endingTimerRef = useRef(0);
  const endingMusicTriggeredRef = useRef(false);

  // State Sync
  const activeDialogueRef = useRef<DialogueLine | null>(null);
  const activeLogRef = useRef<string | null>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(TOTAL_GAME_TIME_SECONDS);
  const lastFrameTimeRef = useRef(0);
  const lastLevelIndexRef = useRef(-1);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const [hudState, setHudState] = useState({
    integrity: 100, energy: 100, progress: 0, timeLeft: TOTAL_GAME_TIME_SECONDS, 
    levelIndex: 0, score: 0,
    activeDialogue: null as DialogueLine | null, activeLog: null as string | null,
    isShielded: false
  });

  const createParticles = (x:number, y:number, type:ParticleType, count:number, color:string) => {
    for(let i=0; i<count; i++) {
        particlesRef.current.push({ 
            id:Math.random(), 
            type, 
            x, 
            y, 
            radius: type === ParticleType.THRUST ? Math.random()*4+2 : Math.random()*3+1, 
            vx: type === ParticleType.THRUST ? -Math.random()*5 - 2 : (Math.random()-0.5)*10, 
            vy: type === ParticleType.THRUST ? (Math.random()-0.5)*2 : (Math.random()-0.5)*10, 
            alpha:1, 
            color, 
            life: type === ParticleType.THRUST ? 0.3 : 0.8, 
            maxLife: type === ParticleType.THRUST ? 0.3 : 0.8 
        });
    }
  };

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Init Procedural Backgrounds
  useEffect(() => {
    // Generate jagged city skylines
    const genCityscape = (width: number, variance: number, minH: number) => {
        const pts = [];
        let h = minH;
        for (let x = 0; x <= width + 400; x += 40) {
            if (Math.random() < 0.3) h = minH + Math.random() * variance; // Change height
            pts.push(h);
        }
        return pts;
    };

    bgLayersRef.current[0].points = genCityscape(CANVAS_WIDTH, 150, 100);
    bgLayersRef.current[1].points = genCityscape(CANVAS_WIDTH, 100, 50);
    
    starsRef.current = [];
    for(let i=0; i<100; i++) {
        starsRef.current.push({ 
            x: Math.random()*CANVAS_WIDTH, 
            y: Math.random()*CANVAS_HEIGHT, 
            size: Math.random()*2 + 0.5, 
            opacity: Math.random(),
            blinkSpeed: Math.random() * 0.05
        });
    }
    
    soundManager.init(); soundManager.reset();
    return () => { soundManager.stopEndingMusic(); soundManager.stopBgm(); };
  }, []);

  // Main Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.INTRO) return;

    let animId: number;
    const ctx = canvasRef.current?.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resetGame = () => {
      playerRef.current = { id: 0, x: 100, y: 300, width: 80, height: 35, markedForDeletion: false, vy: 0, integrity: 100, energy: 100, maxEnergy: 100, isShielded: false, shieldTimer: 0, overclockTimer: 0, angle: 0, isThrusting: false };
      obstaclesRef.current = []; powerupsRef.current = []; logsRef.current = []; landmarksRef.current = []; empsRef.current = []; particlesRef.current = [];
      distanceRef.current = 0; scoreRef.current = 0; timeRef.current = TOTAL_GAME_TIME_SECONDS;
      triggeredEventsRef.current.clear(); isEndingSequenceRef.current = false; endingTimerRef.current = 0; endingMusicTriggeredRef.current = false;
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
              // High-frequency particle emission for smooth trail
              createParticles(player.x - 10, player.y + 15, ParticleType.THRUST, 2, '#3b82f6'); 
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
      const level = LEVELS[levelIndex];

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
              const type = types[Math.floor(Math.random() * types.length)];
              obstaclesRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH + 50, 
                  y: type === 'DRONE' ? Math.random() * (CANVAS_HEIGHT-200) : (type === 'SERVER_TOWER' ? CANVAS_HEIGHT - 150 : Math.random() * (CANVAS_HEIGHT-100)),
                  width: type === 'SERVER_TOWER' ? 60 : 40, height: type === 'SERVER_TOWER' ? 150 : 40,
                  type, isDisabled: false, markedForDeletion: false
              });
          }
          if (Math.random() < 0.005 * timeScale) {
              const types = Object.values(PowerupType);
              powerupsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-100), width: 25, height: 25,
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

      // Obstacles
      obstaclesRef.current.forEach(obs => {
          obs.x -= currentSpeed * level.obstacleSpeed * timeScale;
          if (obs.x < -100) obs.markedForDeletion = true;
          
          if (!player.isShielded && !obs.isDisabled && checkCollision(player, obs)) {
              player.integrity -= 20;
              soundManager.playDamage();
              shakeRef.current = 15;
              player.shieldTimer = 1.0; 
              createParticles(player.x + 20, player.y + 10, ParticleType.SPARK, 15, '#f59e0b');
              createParticles(player.x + 20, player.y + 10, ParticleType.SMOKE, 8, '#94a3b8');
          }
      });

      powerupsRef.current.forEach(p => {
          p.x -= currentSpeed * timeScale;
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

      // Particle Physics
      particlesRef.current.forEach(p => {
          p.life -= dt;
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          
          if (p.type === ParticleType.SPARK) {
              p.vy += 0.5 * timeScale; // Gravity
              p.vx *= 0.95; // Friction
          } else if (p.type === ParticleType.SMOKE) {
              p.vy -= 0.1 * timeScale; // Smoke Rises
              p.radius += 0.2 * timeScale; // Smoke Expands
              p.alpha -= 0.02 * timeScale;
          } else if (p.type === ParticleType.THRUST) {
              p.radius *= 0.9; // Shrink
          }
      });

      // Cleanup
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

    const draw = (ctx: CanvasRenderingContext2D, now: number) => {
        const level = LEVELS[hudState.levelIndex];
        
        // 1. Dynamic Sky Gradient
        const grad = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT);
        grad.addColorStop(0, level.colors.sky[0]); grad.addColorStop(1, level.colors.sky[1]);
        ctx.fillStyle = grad; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

        // 2. Stars with Twinkle
        starsRef.current.forEach(s => {
            const flicker = Math.sin(now * 0.005 + s.x) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(200, 230, 255, ${s.opacity * flicker})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        });

        // 3. Parallax Skylines
        bgLayersRef.current.forEach((layer, i) => {
            // Silhouette color calculation
            ctx.fillStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            
            // Draw skyline points
            for(let j=0; j<layer.points.length; j++) {
                // Calculate scrolling X position
                const realX = (j*40) - (distanceRef.current * layer.speedModifier) % 40;
                // Calculate wrapping index for infinite scroll feel
                const index = (j + Math.floor(distanceRef.current * layer.speedModifier / 40)) % layer.points.length;
                const h = layer.points[index] || 50; 
                
                ctx.lineTo(j*40 - (distanceRef.current * layer.speedModifier)%40, CANVAS_HEIGHT - h);
                // Boxy city shapes
                ctx.lineTo((j+1)*40 - (distanceRef.current * layer.speedModifier)%40, CANVAS_HEIGHT - h);
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fill();
        });

        // 4. Cyber Grid Floor
        ctx.save();
        ctx.strokeStyle = level.colors.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        // Horizontal lines (perspective)
        for(let i=0; i<5; i++) {
             const y = CANVAS_HEIGHT - 100 + (i*25);
             ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
        }
        // Vertical lines (moving)
        const gridOffset = (distanceRef.current * 0.8) % 100;
        for(let x=0; x<CANVAS_WIDTH + 100; x+=100) {
            ctx.moveTo(x - gridOffset, CANVAS_HEIGHT - 100);
            ctx.lineTo((x - gridOffset - CANVAS_WIDTH/2)*3 + CANVAS_WIDTH/2, CANVAS_HEIGHT);
        }
        ctx.stroke();
        ctx.restore();

        // 5. Scanlines Overlay (Subtle)
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        for(let i=0; i<CANVAS_HEIGHT; i+=4) ctx.fillRect(0, i, CANVAS_WIDTH, 1);

        ctx.save();
        // Screen Shake
        const dx = (Math.random()-0.5)*shakeRef.current; const dy = (Math.random()-0.5)*shakeRef.current;
        ctx.translate(dx, dy);

        // Entities
        landmarksRef.current.forEach(l => drawLandmark(ctx, l));
        obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
        powerupsRef.current.forEach(p => drawPowerup(ctx, p));
        logsRef.current.forEach(l => drawLog(ctx, l));

        // EMP Effects
        empsRef.current.forEach(emp => {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 4;
            ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = "rgba(14, 165, 233, 0.1)"; ctx.fill();
            ctx.restore();
        });

        drawPlayer(ctx, playerRef.current);
        
        // Advanced Particle Rendering
        particlesRef.current.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            
            if (p.type === ParticleType.SPARK || p.type === ParticleType.THRUST) {
                // Glow effect for energy particles
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
            } else if (p.type === ParticleType.SMOKE) {
                // Alpha blend for smoke
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
            } else if (p.type === ParticleType.GLITCH) {
                // Pixelated glitch
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.radius, p.radius);
            }
            ctx.restore();
        });

        // Fog Overlay
        if (hudState.levelIndex < 4) {
            const gradFog = ctx.createLinearGradient(0, CANVAS_HEIGHT-100, 0, CANVAS_HEIGHT);
            gradFog.addColorStop(0, "rgba(0,0,0,0)");
            gradFog.addColorStop(1, level.colors.fog);
            ctx.fillStyle = gradFog;
            ctx.fillRect(0, CANVAS_HEIGHT-100, CANVAS_WIDTH, 100);
        }

        ctx.restore();
    };

    // --- Draw Helpers ---
    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
        
        if (p.isShielded) {
            ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100)*0.2;
            ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
        }

        // MK-V Sleigh - Detailed Drawing
        // Chassis
        ctx.fillStyle = "#334155"; 
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-30, -10); ctx.lineTo(-40, 10); ctx.lineTo(20, 15); ctx.fill();
        
        // Engine
        ctx.fillStyle = "#64748b"; ctx.fillRect(-45, -5, 15, 20);
        // Engine Vent
        ctx.fillStyle = p.isThrusting ? "#f59e0b" : "#1e293b"; 
        ctx.fillRect(-48, 0, 5, 10);

        // Cockpit
        ctx.fillStyle = "#0ea5e9"; ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.ellipse(0, -8, 15, 8, 0, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        
        // Krampus Silhouette
        ctx.fillStyle = "#000"; 
        ctx.beginPath(); ctx.arc(0, -8, 5, 0, Math.PI*2); ctx.fill();
        
        // Scarf (Red Tatter) - Physics based animation
        const t = Date.now() / 150;
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); 
        ctx.moveTo(-5, -10); 
        ctx.quadraticCurveTo(-20, -15 + Math.sin(t)*5, -35 - (p.vy*2), -10 + Math.cos(t)*5); 
        ctx.stroke();

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.globalAlpha = o.isDisabled ? 0.3 : 1;
        
        if (o.type === 'DRONE') {
            ctx.fillStyle = o.isDisabled ? "#22c55e" : "#ef4444";
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(20, 20, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
            // Rings
            ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(20, 20, 18, 0, Math.PI*2); ctx.stroke();
        } else if (o.type === 'SERVER_TOWER') {
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0,0,o.width,o.height);
            // Server Rack Lights
            for(let i=0; i<o.height; i+=20) {
                 ctx.fillStyle = Math.random() > 0.8 ? "#22c55e" : "#0f172a";
                 ctx.fillRect(10, i + 10, o.width - 20, 4);
            }
        } else {
            // Debris (Jagged Rock)
            ctx.fillStyle = "#44403c";
            ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(o.width, 20); ctx.lineTo(20, o.height); ctx.lineTo(0, 30); ctx.fill();
        }
        ctx.restore();
    };

    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
        ctx.save(); ctx.translate(lm.x, lm.y - 150);
        if (lm.type === 'CHRONOS_RING') {
            // Big Glowing Ring
            ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 30;
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;
            // Inner Spinning Rings
            const t = Date.now()/1000;
            ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, t, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, -t, 0, Math.PI*2); ctx.stroke();
        } else if (lm.type === 'HOLO_TREE') {
            ctx.strokeStyle = "#22c55e"; ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            // Digital Tree shape
            ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(60, 200); ctx.lineTo(20, 200); ctx.lineTo(80, 80); ctx.lineTo(0, 0); ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Factory
            ctx.fillStyle = "#27272a"; 
            ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(0,100); ctx.lineTo(50,50); ctx.lineTo(100,100); ctx.lineTo(150,50); ctx.lineTo(200,100); ctx.lineTo(200,300); ctx.fill();
            // Windows
            ctx.fillStyle = "#fbbf24"; ctx.globalAlpha = 0.2;
            ctx.fillRect(20, 150, 30, 50); ctx.fillRect(80, 150, 30, 50);
        }
        ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
        const color = POWERUP_COLORS[p.type];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15;
        // Rotating Cube Effect
        const t = Date.now() / 500;
        const size = p.width;
        ctx.translate(p.x + size/2, p.y + size/2);
        ctx.rotate(t);
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.strokeRect(-size/1.5, -size/1.5, size*1.33, size*1.33);
        ctx.restore();
    };
    
    const drawLog = (ctx: CanvasRenderingContext2D, l: DataLog) => {
        ctx.fillStyle = l.isCoreMemory ? "#f59e0b" : "#94a3b8";
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
        ctx.fillRect(l.x, l.y, 20, 20);
        ctx.shadowBlur = 0;
    };

    const checkCollision = (r1: Entity, r2: Entity) => (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
    
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-800 shadow-2xl overflow-hidden bg-black rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full" />
      {/* HUD Overlay via React Component */}
      <UIOverlay {...hudState} currentLevelName={LEVELS[hudState.levelIndex].name} currentLevelSub={LEVELS[hudState.levelIndex].subtext} />
      {/* CRT Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)' }}></div>
    </div>
  );
};
export default GameCanvas;
