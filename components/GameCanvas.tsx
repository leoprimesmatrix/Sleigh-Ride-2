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
  const empsRef = useRef<EMPBurst[]>([]); // New EMP system
  const particlesRef = useRef<Particle[]>([]);
  
  // Visuals
  const starsRef = useRef<{x:number, y:number, size:number, opacity:number}[]>([]); 
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '', speedModifier: 0.2, offset: 0 }, 
    { points: [], color: '', speedModifier: 0.5, offset: 0 }, 
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

  // --- Controls (Thrust & EMP) ---
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
       // Simple Touch: Left side thrust, Right side EMP
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

  // EMP Mechanic
  const triggerEMP = () => {
      if (playerRef.current.energy >= EMP_COST) {
          playerRef.current.energy -= EMP_COST;
          soundManager.playEMP();
          empsRef.current.push({
              id: Date.now(), x: playerRef.current.x + 40, y: playerRef.current.y + 20,
              radius: 10, maxRadius: EMP_RADIUS, markedForDeletion: false
          });
          shakeRef.current = 10;
      } else {
          soundManager.playLowEnergy();
      }
  };

  // Init Terrain & Stars
  useEffect(() => {
    const genTerrain = (amp: number, freq: number) => {
        const pts = [];
        for (let i = 0; i <= CANVAS_WIDTH + 200; i += 40) pts.push(Math.sin(i * freq) * amp);
        return pts;
    };
    bgLayersRef.current[0].points = genTerrain(100, 0.005);
    bgLayersRef.current[1].points = genTerrain(50, 0.01);
    
    starsRef.current = [];
    for(let i=0; i<60; i++) starsRef.current.push({ x: Math.random()*CANVAS_WIDTH, y: Math.random()*CANVAS_HEIGHT, size: Math.random()*2, opacity: Math.random() });
    
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

      // 1. Inputs & Physics (Thruster Logic)
      if (!isEndingSequenceRef.current) {
          if (pressedKeysRef.current.has('Space') || pressedKeysRef.current.has('ArrowUp')) {
              player.vy += THRUST_POWER * timeScale; // Thrust up
              player.isThrusting = true;
              if (Math.random() < 0.3) createParticles(player.x, player.y + 20, ParticleType.THRUST, 1, '#3b82f6');
          } else {
              player.isThrusting = false;
          }
          player.vy += GRAVITY * timeScale;
          player.vy = Math.min(player.vy, MAX_FALL_SPEED);
          player.y += player.vy * timeScale;
          
          // Angle follows velocity
          const targetAngle = player.vy * 0.05;
          player.angle += (targetAngle - player.angle) * 0.1 * timeScale;

          // Constraints
          if (player.y < 0) { player.y = 0; player.vy = 0; }
          if (player.y > CANVAS_HEIGHT - 60) { player.y = CANVAS_HEIGHT - 60; player.vy = 0; }
      }

      // 2. Game Progress
      const speedMult = player.overclockTimer > 0 ? 1.5 : 1.0;
      let progressRatio = distanceRef.current / VICTORY_DISTANCE;
      if (gameMode === GameMode.STORY) progressRatio = Math.min(1.02, progressRatio);

      const currentSpeed = isEndingSequenceRef.current ? BASE_SPEED * 0.5 : BASE_SPEED * speedMult;
      
      // Update Sound
      soundManager.setEnginePitch(player.isThrusting ? 0.8 : 0.2);

      // Level Logic
      let levelIndex = 0;
      const progressPercent = progressRatio * 100;
      for (let i = LEVELS.length - 1; i >= 0; i--) { if (progressPercent >= LEVEL_THRESHOLDS[i]) { levelIndex = i; break; }}
      
      if (levelIndex !== lastLevelIndexRef.current) {
          soundManager.playLevelBgm(levelIndex);
          lastLevelIndexRef.current = levelIndex;
      }
      const level = LEVELS[levelIndex];

      // Ending Sequence
      if (gameMode === GameMode.STORY && progressRatio >= 0.96 && !isEndingSequenceRef.current) {
          isEndingSequenceRef.current = true;
          player.isShielded = true; // Cinematic invincibility
          soundManager.playEndingMusic();
      }
      if (isEndingSequenceRef.current) {
          player.y += (CANVAS_HEIGHT/2 - player.y) * 0.05 * timeScale; // Center player
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
          // Obstacles
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
          // Powerups
          if (Math.random() < 0.005 * timeScale) {
              const types = Object.values(PowerupType);
              powerupsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-100), width: 25, height: 25,
                  type: types[Math.floor(Math.random()*types.length)], floatOffset: 0, markedForDeletion: false
              });
          }
          // Logs
          if (Math.random() < 0.003 * timeScale && gameMode === GameMode.STORY) {
              logsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-200), width: 30, height: 20,
                  message: DATA_LOGS[Math.floor(Math.random() * DATA_LOGS.length)], floatOffset: 0, markedForDeletion: false
              });
          }
      }

      // Narrative Triggers
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

      // 4. Updates & Collisions
      
      // EMP Expansion
      empsRef.current.forEach(emp => {
          emp.radius += 15 * timeScale;
          if (emp.radius > emp.maxRadius) emp.markedForDeletion = true;
          // Disable obstacles
          obstaclesRef.current.forEach(obs => {
             const dx = (obs.x + obs.width/2) - emp.x; const dy = (obs.y + obs.height/2) - emp.y;
             if (Math.sqrt(dx*dx + dy*dy) < emp.radius && !obs.isDisabled) {
                 obs.isDisabled = true;
                 createParticles(obs.x, obs.y, ParticleType.GLITCH, 10, '#22c55e');
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
              player.shieldTimer = 1.0; // I-frames
              createParticles(player.x, player.y, ParticleType.SPARK, 15, '#ef4444');
          }
      });

      // Powerups
      powerupsRef.current.forEach(p => {
          p.x -= currentSpeed * timeScale;
          if (checkCollision(player, p)) {
              p.markedForDeletion = true;
              soundManager.playCollectData();
              if (p.type === PowerupType.CHARGE) player.energy = player.maxEnergy;
              if (p.type === PowerupType.REPAIR) player.integrity = Math.min(100, player.integrity + 30);
              if (p.type === PowerupType.SHIELD) player.shieldTimer = 5.0;
              if (p.type === PowerupType.OVERCLOCK) player.overclockTimer = 8.0;
          }
      });

      // Logs
      logsRef.current.forEach(l => {
          l.x -= currentSpeed * timeScale;
          if (checkCollision(player, l)) {
              l.markedForDeletion = true;
              soundManager.playCollectData();
              activeLogRef.current = l.message;
              setTimeout(() => { if (activeLogRef.current === l.message) activeLogRef.current = null; }, 4000);
          }
      });

      // Landmarks
      landmarksRef.current.forEach(l => {
          l.x -= currentSpeed * timeScale;
      });

      // Particles
      particlesRef.current.forEach(p => {
          p.x += p.vx * timeScale; p.y += p.vy * timeScale;
          p.life -= dt;
      });

      // Cleanup
      obstaclesRef.current = obstaclesRef.current.filter(e => !e.markedForDeletion);
      powerupsRef.current = powerupsRef.current.filter(e => !e.markedForDeletion);
      logsRef.current = logsRef.current.filter(e => !e.markedForDeletion);
      empsRef.current = empsRef.current.filter(e => !e.markedForDeletion);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      // Sync HUD
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
        
        // 1. Sky & Scanlines
        const grad = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT);
        grad.addColorStop(0, level.colors.sky[0]); grad.addColorStop(1, level.colors.sky[1]);
        ctx.fillStyle = grad; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

        // Scanline effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        for(let i=0; i<CANVAS_HEIGHT; i+=4) ctx.fillRect(0, i, CANVAS_WIDTH, 1);

        // Stars
        starsRef.current.forEach(s => {
            ctx.fillStyle = `rgba(200, 230, 255, ${s.opacity})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // 2. Parallax Grid
        bgLayersRef.current.forEach((layer, i) => {
            ctx.fillStyle = level.colors.grid;
            ctx.globalAlpha = 0.3 + (i * 0.2);
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT);
            for(let j=0; j<layer.points.length; j++) {
                ctx.lineTo((j*40) - (distanceRef.current * layer.speedModifier)%40, CANVAS_HEIGHT - 100 + layer.points[j] - (i*50));
            }
            ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.save();
        const dx = (Math.random()-0.5)*shakeRef.current; const dy = (Math.random()-0.5)*shakeRef.current;
        ctx.translate(dx, dy);

        // 3. World Entities
        landmarksRef.current.forEach(l => drawLandmark(ctx, l));
        obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
        powerupsRef.current.forEach(p => drawPowerup(ctx, p));
        logsRef.current.forEach(l => drawLog(ctx, l));

        // 4. Effects
        empsRef.current.forEach(emp => {
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = "rgba(14, 165, 233, 0.2)"; ctx.fill();
        });

        drawPlayer(ctx, playerRef.current);
        
        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, p.y, p.radius, p.radius);
        });

        // Fog Overlay
        if (hudState.levelIndex < 4) {
            ctx.fillStyle = level.colors.fog;
            ctx.fillRect(0, CANVAS_HEIGHT-50, CANVAS_WIDTH, 50);
        }

        ctx.restore();
    };

    // --- Draw Helpers ---
    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
        
        // Shield Bubble
        if (p.isShielded) {
            ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.stroke();
        }

        // Tech Sleigh (Scavenger Craft)
        // Main hull
        ctx.fillStyle = "#334155"; ctx.fillRect(-30, -10, 60, 20);
        // Engine Block
        ctx.fillStyle = "#64748b"; ctx.fillRect(-40, -5, 10, 15);
        // Cockpit Glow
        ctx.fillStyle = "#0ea5e9"; ctx.shadowColor = "#0ea5e9"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(10, -5, 8, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        // Thruster Glow
        if (p.isThrusting) {
            ctx.fillStyle = "#f59e0b"; ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.moveTo(-40, 5); ctx.lineTo(-60, 15); ctx.lineTo(-40, 20); ctx.fill(); ctx.shadowBlur = 0;
        }
        // Krampus Scarf (Red Tatter)
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(-20 - (p.vy*2), -20, -30, -15); ctx.stroke();

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
        ctx.save(); ctx.translate(o.x, o.y);
        ctx.globalAlpha = o.isDisabled ? 0.3 : 1;
        
        if (o.type === 'DRONE') {
            ctx.fillStyle = o.isDisabled ? "#22c55e" : "#ef4444";
            ctx.beginPath(); ctx.arc(20, 20, 15, 0, Math.PI*2); ctx.fill();
            // Drone Arms
            ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(40,40); ctx.moveTo(40,0); ctx.lineTo(0,40); ctx.stroke();
        } else if (o.type === 'SERVER_TOWER') {
            ctx.fillStyle = "#1e293b"; ctx.fillRect(0,0,o.width,o.height);
            // Blink lights
            ctx.fillStyle = Math.random() > 0.5 ? "#22c55e" : "#0f172a";
            ctx.fillRect(10, 10, 5, 5);
        } else {
            // Debris
            ctx.fillStyle = "#57534e";
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(o.width, 10); ctx.lineTo(10, o.height); ctx.fill();
        }
        ctx.restore();
    };

    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
        ctx.save(); ctx.translate(lm.x, lm.y - 150);
        if (lm.type === 'CHRONOS_RING') {
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI*2); ctx.stroke();
            ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI*2); ctx.stroke();
        } else if (lm.type === 'HOLO_TREE') {
            ctx.strokeStyle = "#22c55e"; ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(50, 200); ctx.lineTo(20, 200); ctx.lineTo(60, 100); ctx.lineTo(40, 100); ctx.lineTo(0, 0); ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            // Factory
            ctx.fillStyle = "#27272a"; ctx.fillRect(0,0,200,300);
        }
        ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
        const color = POWERUP_COLORS[p.type];
        ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, p.width, p.height); ctx.shadowBlur = 0;
    };
    
    const drawLog = (ctx: CanvasRenderingContext2D, l: DataLog) => {
        ctx.fillStyle = l.isCoreMemory ? "#f59e0b" : "#94a3b8";
        ctx.fillRect(l.x, l.y, 20, 20);
    };

    const checkCollision = (r1: Entity, r2: Entity) => (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
    const createParticles = (x:number, y:number, type:ParticleType, count:number, color:string) => {
        for(let i=0; i<count; i++) particlesRef.current.push({ id:Math.random(), type, x, y, radius:Math.random()*3+1, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, alpha:1, color, life:0.5, maxLife:0.5 });
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-800 shadow-2xl overflow-hidden bg-black rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>
      <UIOverlay {...hudState} currentLevelName={LEVELS[hudState.levelIndex].name} currentLevelSub={LEVELS[hudState.levelIndex].subtext} />
    </div>
  );
};
export default GameCanvas;