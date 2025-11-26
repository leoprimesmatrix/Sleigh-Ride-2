
import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, Player, Obstacle, Powerup, DataLog, Particle, ParticleType, PowerupType, Entity, BackgroundLayer, DialogueLine, GameMode, Landmark, DebugCommand, ScorePopup
} from '../types.ts';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, THRUST_POWER, MAX_FALL_SPEED, BASE_SPEED, 
  LEVELS, LEVEL_THRESHOLDS, POWERUP_COLORS, TOTAL_GAME_TIME_SECONDS, VICTORY_DISTANCE, 
  PHASE_DRAIN_RATE, PHASE_RECHARGE_RATE, PHASE_MIN_ACTIVATION, PHASE_SCAN_REWARD, COMBO_DECAY,
  STORY_MOMENTS, LANDMARKS
} from '../constants.ts';
import UIOverlay from './UIOverlay.tsx';
import { soundManager } from '../audio.ts';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onWin: () => void;
  gameMode: GameMode;
  debugCommand?: DebugCommand;
  onDebugCommandHandled?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, onWin, gameMode, debugCommand, onDebugCommandHandled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Entities
  const playerRef = useRef<Player>({
    id: 0, x: 100, y: 300, width: 80, height: 35, markedForDeletion: false,
    vy: 0, integrity: 100, energy: 100, maxEnergy: 100,
    isPhasing: false, phaseCooldown: 0, angle: 0, isThrusting: false, godMode: false,
    combo: 1, comboTimer: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const logsRef = useRef<DataLog[]>([]);
  const landmarksRef = useRef<Landmark[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  
  // Visuals
  const starsRef = useRef<{x:number, y:number, size:number, opacity:number, blinkSpeed: number}[]>([]); 
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '#0f172a', speedModifier: 0.05, offset: 0 }, 
    { points: [], color: '#1e293b', speedModifier: 0.2, offset: 0 },  
    { points: [], color: '#334155', speedModifier: 0.5, offset: 0 },  
  ]);

  // Logic
  const shakeRef = useRef(0);
  const isEndingSequenceRef = useRef(false);
  const endingTimerRef = useRef(0);

  // Debug Modifiers
  const speedMultiplierRef = useRef(1.0);
  const progressMultiplierRef = useRef(1.0);

  // State Sync
  const activeDialogueRef = useRef<DialogueLine | null>(null);
  const activeLogRef = useRef<string | null>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(TOTAL_GAME_TIME_SECONDS);
  const lastFrameTimeRef = useRef(0);
  const lastLevelIndexRef = useRef(0); 
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const [hudState, setHudState] = useState({
    integrity: 100, energy: 100, progress: 0, timeLeft: TOTAL_GAME_TIME_SECONDS, 
    levelIndex: 0, score: 0, combo: 1,
    activeDialogue: null as DialogueLine | null, activeLog: null as string | null,
    isPhasing: false
  });

  // Handle Debug Commands
  useEffect(() => {
    if (!debugCommand) return;
    
    if (debugCommand === 'SKIP_TO_ENDING') {
      distanceRef.current = VICTORY_DISTANCE * 0.96; 
      obstaclesRef.current = [];
      scoreRef.current += 5000;
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.GLITCH, 50, '#00ff00');
    } 
    else if (debugCommand === 'TOGGLE_GOD_MODE') {
      playerRef.current.godMode = !playerRef.current.godMode;
      playerRef.current.energy = 100;
      playerRef.current.integrity = 100;
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.SPARK, 30, '#ffd700');
    }
    else if (debugCommand === 'INCREASE_SPEED') {
      speedMultiplierRef.current += 0.2;
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.THRUST, 30, '#00f3ff');
    }
    else if (debugCommand === 'TOGGLE_HYPER_PROGRESS') {
      progressMultiplierRef.current = progressMultiplierRef.current > 1 ? 1.0 : 10.0;
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.GLITCH, 30, '#bc13fe');
    }

    if (onDebugCommandHandled) onDebugCommandHandled();
  }, [debugCommand]);

  const createParticles = (x:number, y:number, type:ParticleType, count:number, color:string) => {
    for(let i=0; i<count; i++) {
        const speed = type === ParticleType.THRUST ? 4 : 6;
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

  const createScorePopup = (x: number, y: number, value: number, text: string) => {
     scorePopupsRef.current.push({
         id: Math.random(), x, y, value, text, life: 1.0, color: '#facc15'
     });
  };

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      
      if (gameState === GameState.MENU) soundManager.init();
      pressedKeysRef.current.add(e.code);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.code);
    };
    const handleTouchStart = (e: TouchEvent) => {
       if (gameState === GameState.MENU) soundManager.init();
       const touchX = e.touches[0].clientX;
       if (touchX > window.innerWidth * 0.5) pressedKeysRef.current.add('Space');
       else pressedKeysRef.current.add('ShiftLeft'); // Phase touch area
    };
    const handleTouchEnd = () => {
       pressedKeysRef.current.clear();
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
      playerRef.current = { 
          id: 0, x: 100, y: 300, width: 80, height: 35, markedForDeletion: false, vy: 0, integrity: 100, energy: 100, maxEnergy: 100, 
          isPhasing: false, phaseCooldown: 0, angle: 0, isThrusting: false, godMode: false,
          combo: 1, comboTimer: 0
      };
      obstaclesRef.current = []; powerupsRef.current = []; logsRef.current = []; landmarksRef.current = []; particlesRef.current = []; scorePopupsRef.current = [];
      distanceRef.current = 0; scoreRef.current = 0; timeRef.current = TOTAL_GAME_TIME_SECONDS;
      triggeredEventsRef.current.clear(); isEndingSequenceRef.current = false; endingTimerRef.current = 0;
      lastLevelIndexRef.current = 0;
      speedMultiplierRef.current = 1.0; progressMultiplierRef.current = 1.0;
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
              createParticles(player.x - 10, player.y + 15, ParticleType.THRUST, 1, '#00f3ff'); 
          } else {
              player.isThrusting = false;
          }
          
          // Phase Shift Logic
          const wantsToPhase = (pressedKeysRef.current.has('ShiftLeft') || pressedKeysRef.current.has('ShiftRight') || pressedKeysRef.current.has('KeyZ'));
          
          if (wantsToPhase && player.energy > 0) {
              if (player.energy > PHASE_MIN_ACTIVATION || player.isPhasing) {
                 player.isPhasing = true;
                 if (!player.godMode) player.energy -= PHASE_DRAIN_RATE * dt;
                 createParticles(player.x + Math.random()*player.width, player.y + Math.random()*player.height, ParticleType.PHASE_RESIDUAL, 1, '#bc13fe');
              } else {
                 player.isPhasing = false; // Not enough energy to start
              }
          } else {
              player.isPhasing = false;
              player.energy = Math.min(player.maxEnergy, player.energy + PHASE_RECHARGE_RATE * dt);
          }
          if (player.energy <= 0) player.isPhasing = false;

          soundManager.setPhaseVolume(player.isPhasing);

          player.vy += GRAVITY * timeScale;
          player.vy = Math.min(player.vy, MAX_FALL_SPEED);
          player.y += player.vy * timeScale;
          
          const targetAngle = player.vy * 0.05;
          player.angle += (targetAngle - player.angle) * 0.1 * timeScale;

          // Bounds
          if (player.y < 0) { player.y = 0; player.vy = 0; }
          if (player.y > CANVAS_HEIGHT - 60) { player.y = CANVAS_HEIGHT - 60; player.vy = 0; }
      }

      // Combo Decay
      if (player.combo > 1) {
          player.comboTimer -= dt;
          if (player.comboTimer <= 0) {
              player.combo = 1; 
          }
      }

      // 2. Progression
      const speedMult = speedMultiplierRef.current;
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
          player.isPhasing = true; // Auto phase for ending
          player.godMode = true;
          soundManager.playEndingMusic();

          const ringExists = landmarksRef.current.some(l => l.type === 'FROZEN_TIME_MACHINE');
          if (!ringExists) {
             landmarksRef.current.push({
                 id: Date.now(), x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT/2, width: 300, height: 300,
                 type: 'FROZEN_TIME_MACHINE', name: 'The Chronos Engine', markedForDeletion: false
             });
             triggeredEventsRef.current.add('FROZEN_TIME_MACHINE');
          }
      }

      if (isEndingSequenceRef.current) {
          player.y += (CANVAS_HEIGHT/2 - player.y) * 0.05 * timeScale;
          endingTimerRef.current += dt;
          if (endingTimerRef.current > 4.0) {
               setGameState(GameState.VICTORY); onWin();
          }
      } else {
          const distanceGain = currentSpeed * timeScale * progressMultiplierRef.current;
          distanceRef.current += distanceGain;
          scoreRef.current += distanceGain * 0.1 * player.combo;
          timeRef.current -= dt;
      }

      // 3. Spawning
      if (!isEndingSequenceRef.current) {
          // Obstacles
          if (Math.random() < 0.02 * level.spawnRate * timeScale && levelIndex !== 4) {
              const types: Obstacle['type'][] = ['DEBRIS', 'DRONE', 'SERVER_TOWER', 'ENERGY_BARRIER', 'WATCHER'];
              let type = types[0];
              const r = Math.random();
              if (r < 0.3) type = 'DEBRIS';
              else if (r < 0.55) type = 'DRONE';
              else if (r < 0.75) type = 'ENERGY_BARRIER';
              else if (r < 0.9) type = 'SERVER_TOWER';
              else type = 'WATCHER';

              let y = Math.random() * (CANVAS_HEIGHT - 100);
              let w = 40; let h = 40;
              let score = 100;
              
              if (type === 'SERVER_TOWER') {
                  y = CANVAS_HEIGHT - 200; w = 60; h = 200; score = 500;
              } else if (type === 'ENERGY_BARRIER') {
                  h = 150; y = Math.random() * (CANVAS_HEIGHT - h); w = 30; score = 200;
              } else if (type === 'DEBRIS') {
                  w = 50; h = 50; score = 50;
              } else if (type === 'DRONE') {
                  score = 150;
              } else if (type === 'WATCHER') {
                  w = 50; h = 40; score = 300;
              }

              obstaclesRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH + 50, y, width: w, height: h,
                  type, markedForDeletion: false, rotation: Math.random() * Math.PI * 2,
                  scoreValue: score, scanned: false
              });
          }
          if (Math.random() < 0.005 * timeScale) {
              const types = Object.values(PowerupType);
              powerupsRef.current.push({
                  id: Date.now(), x: CANVAS_WIDTH, y: Math.random()*(CANVAS_HEIGHT-100), width: 40, height: 40,
                  type: types[Math.floor(Math.random()*types.length)], floatOffset: 0, markedForDeletion: false
              });
          }
      }

      // Narrative Spawning
      if (gameMode === GameMode.STORY) {
         STORY_MOMENTS.forEach(m => {
             if (progressRatio >= m.progress && !triggeredEventsRef.current.has(m.dialogue.id)) {
                 triggeredEventsRef.current.add(m.dialogue.id);
                 activeDialogueRef.current = m.dialogue;
                 setTimeout(() => { if (activeDialogueRef.current?.id === m.dialogue.id) activeDialogueRef.current = null; }, 6000);
             }
         });
         LANDMARKS.forEach(lm => {
             if (progressRatio >= lm.progress && !triggeredEventsRef.current.has(lm.type) && lm.type !== 'FROZEN_TIME_MACHINE') {
                 triggeredEventsRef.current.add(lm.type);
                 landmarksRef.current.push({
                     id: Date.now(), x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT/2, width: 300, height: 300,
                     type: lm.type, name: lm.name, markedForDeletion: false
                 });
             }
         });
      }

      // 4. Collisions (Logic Updated: Phase Passing)
      
      // Obstacle Updates
      obstaclesRef.current.forEach(obs => {
          obs.x -= currentSpeed * level.obstacleSpeed * timeScale;
          if (obs.x < -100) obs.markedForDeletion = true;
          if (obs.type === 'DRONE' || obs.type === 'DEBRIS') obs.rotation! += 0.05 * timeScale;
          
          if (obs.type === 'WATCHER') {
              // Slowly moves towards player Y
              obs.y += (player.y - obs.y) * 0.01 * timeScale;
          }

          // Player vs Obstacle Collision
          if (!obs.markedForDeletion && checkCollision(player, obs)) {
              if (player.isPhasing || player.godMode) {
                  // Phase Through Logic
                  if (!obs.scanned) {
                      obs.scanned = true;
                      soundManager.playScanSuccess();
                      createParticles(obs.x + obs.width/2, obs.y + obs.height/2, ParticleType.DATA, 8, '#00f3ff');
                      
                      // Reward
                      player.energy = Math.min(player.maxEnergy, player.energy + PHASE_SCAN_REWARD);
                      
                      player.combo = Math.min(50, player.combo + 1);
                      player.comboTimer = COMBO_DECAY;
                      const val = obs.scoreValue * player.combo;
                      scoreRef.current += val;
                      createScorePopup(player.x, player.y - 20, val, `DATA ${player.combo}x`);
                  }
              } else {
                  // Collision Damage
                  player.integrity -= 20;
                  soundManager.playDamage();
                  shakeRef.current = 20;
                  obs.markedForDeletion = true;
                  // Reset Combo
                  if (player.combo > 1) {
                      createScorePopup(player.x, player.y - 20, 0, "SYNC LOST");
                      player.combo = 1;
                  }
                  createParticles(player.x + 20, player.y + 10, ParticleType.SPARK, 15, '#f59e0b');
              }
          }
      });

      // Powerups
      powerupsRef.current.forEach(p => {
          p.x -= currentSpeed * timeScale;
          p.floatOffset += 0.05 * timeScale;
          if (checkCollision(player, p)) {
              p.markedForDeletion = true;
              soundManager.playCollectData();
              createParticles(p.x, p.y, ParticleType.SPARK, 10, POWERUP_COLORS[p.type]);
              if (p.type === PowerupType.CHARGE) player.energy = Math.min(player.maxEnergy, player.energy + 50);
              if (p.type === PowerupType.REPAIR) player.integrity = Math.min(100, player.integrity + 30);
              if (p.type === PowerupType.DATA_CACHE) scoreRef.current += 1000;
              if (p.type === PowerupType.INVULNERABILITY) player.energy = player.maxEnergy; // Full recharge
              createScorePopup(p.x, p.y, 500, p.type);
          }
      });

      // Environment
      landmarksRef.current.forEach(l => { l.x -= currentSpeed * timeScale; });

      // Particles
      particlesRef.current.forEach(p => {
          p.life -= dt;
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          if (p.type === ParticleType.PHASE_RESIDUAL) {
              p.x -= currentSpeed * timeScale * 0.5; // Trail effect
          }
      });
      
      // Score Popups
      scorePopupsRef.current.forEach(p => {
          p.life -= dt;
          p.y -= 1 * timeScale; // Float up
      });

      // Cleanup
      obstaclesRef.current = obstaclesRef.current.filter(e => !e.markedForDeletion);
      powerupsRef.current = powerupsRef.current.filter(e => !e.markedForDeletion);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      scorePopupsRef.current = scorePopupsRef.current.filter(p => p.life > 0);

      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      if (now % 100 < 20) {
          setHudState({ 
            integrity: player.integrity, energy: player.energy, isPhasing: player.isPhasing,
            progress: progressPercent, timeLeft: timeRef.current, levelIndex, score: scoreRef.current,
            activeDialogue: activeDialogueRef.current, activeLog: activeLogRef.current,
            combo: player.combo
          });
      }
    };

    const drawAurora = (ctx: CanvasRenderingContext2D, color: string, now: number) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(40px)'; 
      ctx.globalAlpha = 0.6; 
      const t = now * 0.001;
      
      const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(0, 100);
      for(let x=0; x<=CANVAS_WIDTH; x+=50) {
         const y = 80 + Math.sin(x*0.005 + t) * 60 + Math.sin(x*0.01 + t*1.5) * 40;
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

        if (level.colors.aurora) drawAurora(ctx, level.colors.aurora, now);

        // Sun / Moon / Digital Horizon
        ctx.save();
        ctx.fillStyle = level.colors.grid; 
        ctx.shadowColor = level.colors.grid; ctx.shadowBlur = 100;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH - 200, 150, 70, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 2. Stars
        starsRef.current.forEach(s => {
            const flicker = Math.sin(now * 0.005 + s.x) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * flicker})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        });

        // 3. Parallax
        bgLayersRef.current.forEach((layer, i) => {
            ctx.save();
            ctx.fillStyle = layer.color;
            ctx.strokeStyle = level.colors.grid || "#00f3ff";
            ctx.shadowColor = level.colors.grid;
            ctx.shadowBlur = i === 0 ? 10 : 0;
            ctx.lineWidth = i === 0 ? 2 : 1;
            
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
                
                ctx.fillRect(x, CANVAS_HEIGHT - h, blockWidth + 1, h);
                
                if (i >= 0) {
                     ctx.globalAlpha = 0.4;
                     ctx.beginPath(); ctx.moveTo(x, CANVAS_HEIGHT); ctx.lineTo(x, CANVAS_HEIGHT-h); ctx.lineTo(x+blockWidth, CANVAS_HEIGHT-h); ctx.stroke();
                     ctx.globalAlpha = 1.0;
                     ctx.fillStyle = layer.color;
                }
            }
            ctx.restore();
        });

        // 4. Cyber Grid
        ctx.save();
        ctx.strokeStyle = level.colors.grid;
        ctx.lineWidth = 2;
        ctx.shadowColor = level.colors.grid;
        ctx.shadowBlur = 20; 
        ctx.globalAlpha = 0.8;
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
        gradGround.addColorStop(0, "rgba(0,0,0,0.8)");
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

        drawPlayer(ctx, playerRef.current);
        
        particlesRef.current.forEach(p => drawParticle(ctx, p));
        scorePopupsRef.current.forEach(p => drawScorePopup(ctx, p));

        ctx.restore();

        // Fog
        if (lastLevelIndexRef.current < 4) {
            const gradFog = ctx.createLinearGradient(0, CANVAS_HEIGHT-200, 0, CANVAS_HEIGHT);
            gradFog.addColorStop(0, "rgba(0,0,0,0)");
            gradFog.addColorStop(1, level.colors.fog);
            ctx.fillStyle = gradFog;
            ctx.fillRect(0, CANVAS_HEIGHT-200, CANVAS_WIDTH, 200);
        }
    };

    const drawScorePopup = (ctx: CanvasRenderingContext2D, s: ScorePopup) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 0;
        ctx.font = 'bold 20px Orbitron';
        ctx.fillText(s.text || `+${s.value}`, s.x, s.y);
        ctx.restore();
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        if (p.type === ParticleType.PHASE_RESIDUAL) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.radius * 20, p.radius * 8); // Digital trail shape
        } else if (p.type === ParticleType.SPARK || p.type === ParticleType.THRUST) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        } else if (p.type === ParticleType.GLITCH) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 10;
            ctx.fillRect(p.x, p.y, p.radius, p.radius);
        } else if (p.type === ParticleType.DATA) {
            ctx.fillStyle = '#fff';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', p.x, p.y);
        }
        ctx.restore();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
        
        if (p.isPhasing) {
             // Ghost Mode
             ctx.globalAlpha = 0.4 + Math.random() * 0.2;
             ctx.shadowColor = "#bc13fe"; ctx.shadowBlur = 50;
             // Scanlines over player
             ctx.strokeStyle = "#bc13fe";
             ctx.lineWidth = 1;
             for(let i=-20; i<20; i+=4) {
                 ctx.beginPath(); ctx.moveTo(-40, i); ctx.lineTo(40, i); ctx.stroke();
             }
        } else {
             ctx.globalAlpha = 1.0;
        }

        // MK-V Sleigh Body
        ctx.shadowColor = p.isPhasing ? "#bc13fe" : "#00f3ff"; ctx.shadowBlur = 30;
        ctx.fillStyle = "#020617"; 
        ctx.beginPath(); 
        ctx.moveTo(35, 5); ctx.lineTo(-20, -12); ctx.lineTo(-40, 0); ctx.lineTo(-20, 15); ctx.lineTo(35, 5); 
        ctx.fill();
        
        // Neon Trim
        ctx.strokeStyle = p.isPhasing ? "#bc13fe" : "#00f3ff"; ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-45, -8, 20, 16);
        
        // Thruster Glow
        ctx.fillStyle = p.isThrusting ? "#00f3ff" : "#1e293b"; 
        ctx.shadowColor = p.isThrusting ? "#00f3ff" : "none"; ctx.shadowBlur = p.isThrusting ? 40 : 0;
        ctx.beginPath(); ctx.ellipse(-48, 0, 4, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Cockpit
        ctx.fillStyle = p.isPhasing ? "#fff" : "#bc13fe"; 
        ctx.shadowColor = "#bc13fe"; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.ellipse(5, -5, 15, 8, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Scarf/Trail
        const t = Date.now() / 150;
        ctx.strokeStyle = p.isPhasing ? "#ffffff" : "#ff00ff"; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 20;
        ctx.beginPath(); 
        ctx.moveTo(-10, -8); 
        ctx.quadraticCurveTo(-25, -12 + Math.sin(t)*3, -45 - (p.vy), -8 + Math.cos(t)*3); 
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle, now: number) => {
        ctx.save(); ctx.translate(o.x + o.width/2, o.y + o.height/2);
        
        // Scanned Effect (Translucent green)
        if (o.scanned) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "#00ff41";
            ctx.shadowColor = "#00ff41";
            ctx.shadowBlur = 20;
        } else {
            ctx.globalAlpha = 1;
        }

        if (o.type === 'DRONE' || o.type === 'WATCHER') {
            const hover = Math.sin(now * 0.005) * 5;
            ctx.translate(0, hover);
            
            ctx.fillStyle = o.type === 'WATCHER' ? "#991b1b" : "#ff3d00";
            if (!o.scanned) {
                ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 25;
            }
            ctx.beginPath(); ctx.arc(0, 0, o.type==='WATCHER' ? 12 : 8, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
            
            ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, o.type==='WATCHER' ? 20 : 14, 0, Math.PI*2); ctx.stroke();
            
            // Watcher Eye
            if (o.type === 'WATCHER') {
                ctx.fillStyle = "#ef4444";
                ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
                // Scanning beam
                if (!o.scanned) {
                    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
                    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-100, 40); ctx.lineTo(-100, -40); ctx.fill();
                }
            } else {
                ctx.rotate(now * 0.01);
                ctx.fillStyle = "#cbd5e1";
                ctx.fillRect(-22, -2, 10, 4); ctx.fillRect(12, -2, 10, 4);
                ctx.fillRect(-2, -22, 4, 10); ctx.fillRect(-2, 12, 4, 10);
            }

        } else if (o.type === 'SERVER_TOWER') {
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            ctx.fillStyle = "#020617"; ctx.fillRect(0,0,w,h);
            ctx.strokeStyle = o.scanned ? "#22c55e" : "#ff3d00";
            ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 15;
            ctx.strokeRect(0,0,w,h);
            for(let i=10; i<h-10; i+=15) {
                const on = Math.sin(now * 0.01 + i) > 0;
                ctx.fillStyle = on ? (o.scanned ? "#22c55e" : "#ff3d00") : "#1e293b";
                ctx.fillRect(5, i, w-10, 4);
            }
        } else if (o.type === 'ENERGY_BARRIER') {
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            ctx.fillStyle = "#334155";
            ctx.fillRect(0, 0, w, 15); ctx.fillRect(0, h-15, w, 15);
            if (!o.scanned) {
                ctx.strokeStyle = "#0047ff"; ctx.lineWidth = 3;
                ctx.shadowColor = "#0047ff"; ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.moveTo(w/2, 15);
                for(let i=15; i<h-15; i+=5) {
                    ctx.lineTo(w/2 + (Math.random()-0.5)*15, i);
                }
                ctx.lineTo(w/2, h-15);
                ctx.stroke(); ctx.shadowBlur = 0;
            }
        } else {
            ctx.rotate(o.rotation || 0);
            ctx.fillStyle = "#334155";
            ctx.shadowColor = "#94a3b8"; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(15, 0); ctx.lineTo(5, 20); ctx.lineTo(-15, 10); ctx.fill();
        }
        ctx.restore();
    };

    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
        ctx.save(); ctx.translate(lm.x, lm.y - 150);
        if (lm.type === 'FROZEN_TIME_MACHINE') {
            // Updated Visual: A giant frozen clock/ring
            ctx.shadowColor = "#00f3ff"; ctx.shadowBlur = 60;
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Ice crystals
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            for(let i=0; i<8; i++) {
                ctx.save(); ctx.rotate(i * (Math.PI/4));
                ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(20, 160); ctx.lineTo(-20, 160); ctx.fill();
                ctx.restore();
            }

            const t = Date.now()/2000; // Slow movement (frozen)
            ctx.strokeStyle = "rgba(0, 243, 255, 0.5)"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, t*0.1, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, -t*0.1, 0, Math.PI*2); ctx.stroke();
        } else if (lm.type === 'HOLO_TREE') {
            ctx.strokeStyle = "#00ff41"; ctx.shadowColor = "#00ff41"; ctx.shadowBlur = 40;
            ctx.lineWidth = 3;
            ctx.beginPath(); 
            ctx.moveTo(0, 300); ctx.lineTo(0, 250);
            ctx.moveTo(-60, 250); ctx.lineTo(60, 250); ctx.lineTo(0, 150); ctx.lineTo(-60, 250);
            ctx.moveTo(-50, 150); ctx.lineTo(50, 150); ctx.lineTo(0, 70); ctx.lineTo(-50, 150);
            ctx.stroke(); ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = "#000510"; 
            ctx.strokeStyle = "#bc13fe"; ctx.lineWidth = 2;
            ctx.shadowColor = "#bc13fe"; ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.rect(-100, 100, 200, 200); ctx.fill(); ctx.stroke();
            ctx.fillRect(-80, 0, 30, 100); ctx.fillRect(20, 20, 30, 80);
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#bc13fe";
            for(let i=0; i<200; i+=40) ctx.fillRect(-100+i, 110, 20, 10);
        }
        ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
        const color = POWERUP_COLORS[p.type] || '#ffffff';
        const cx = p.x + p.width/2; 
        const cy = p.y + p.height/2 + Math.sin(p.floatOffset)*5;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = color; ctx.shadowBlur = 40;
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = color;
        if (p.type === PowerupType.CHARGE) {
            // Lightning Bolt
            ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.lineTo(-2, 2); ctx.lineTo(4, 2); ctx.lineTo(-3, 10); ctx.lineTo(0, 2); ctx.lineTo(-6, 2); ctx.fill();
        } else if (p.type === PowerupType.REPAIR) {
            ctx.fillRect(-4, -10, 8, 20); ctx.fillRect(-10, -4, 20, 8);
        } else if (p.type === PowerupType.INVULNERABILITY) {
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(10, 5, 10, -5); ctx.lineTo(-10, -5); ctx.quadraticCurveTo(-10, 5, 0, 10); ctx.fill();
        } else {
            // Data Block
            ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = "#fff"; ctx.fillRect(-4, -4, 8, 8);
        }
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
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-900 shadow-[0_0_50px_rgba(0,243,255,0.3)] overflow-hidden bg-[#00020a] rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full" />
      <UIOverlay {...hudState} currentLevelName={LEVELS[hudState.levelIndex].name} currentLevelSub={LEVELS[hudState.levelIndex].subtext} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,2,10,0.9) 100%)' }}></div>
      {/* Scanline Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 243, 255, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 6px 100%' }}></div>
    </div>
  );
};
export default GameCanvas;
