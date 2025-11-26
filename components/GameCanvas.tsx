
import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, Player, Obstacle, Powerup, DataLog, Particle, ParticleType, PowerupType, Entity, BackgroundLayer, DialogueLine, GameMode, Landmark, DebugCommand, ScorePopup, ObstacleType
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
    id: 0, x: 100, y: 300, width: 90, height: 40, markedForDeletion: false,
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
  const snowRef = useRef<{x:number, y:number, size:number, speed:number, swing: number}[]>([]); 
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '#0f172a', speedModifier: 0.1, offset: 0 }, 
    { points: [], color: '#1e293b', speedModifier: 0.3, offset: 0 },  
    { points: [], color: '#334155', speedModifier: 0.6, offset: 0 },  
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
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.RUNE, 50, '#00ff00');
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
      createParticles(playerRef.current.x, playerRef.current.y, ParticleType.GLOW, 30, '#bc13fe');
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
       else pressedKeysRef.current.add('ShiftLeft'); 
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

    const genLandscape = (count: number, minH: number, maxH: number) => {
        const pts = [];
        for (let i = 0; i < count; i++) {
             pts.push({ height: minH + Math.random() * (maxH - minH), type: Math.floor(Math.random() * 5) });
        }
        return pts;
    };

    if (bgLayersRef.current[0].points.length === 0) {
        bgLayersRef.current[0].points = genLandscape(100, 150, 400);
        bgLayersRef.current[1].points = genLandscape(100, 80, 200);
        bgLayersRef.current[2].points = genLandscape(100, 40, 100);
        
        snowRef.current = [];
        for(let i=0; i<150; i++) {
            snowRef.current.push({ 
                x: Math.random()*CANVAS_WIDTH, 
                y: Math.random()*CANVAS_HEIGHT, 
                size: Math.random()*2 + 1, 
                speed: Math.random() * 2 + 1,
                swing: Math.random() * Math.PI * 2
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
          id: 0, x: 100, y: 300, width: 90, height: 40, markedForDeletion: false, vy: 0, integrity: 100, energy: 100, maxEnergy: 100, 
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
              createParticles(player.x - 20, player.y + 15, ParticleType.THRUST, 1, '#60a5fa'); 
          } else {
              player.isThrusting = false;
          }
          
          // Spirit Form Logic
          const wantsToPhase = (pressedKeysRef.current.has('ShiftLeft') || pressedKeysRef.current.has('ShiftRight') || pressedKeysRef.current.has('KeyZ'));
          
          if (wantsToPhase && player.energy > 0) {
              if (player.energy > PHASE_MIN_ACTIVATION || player.isPhasing) {
                 player.isPhasing = true;
                 if (!player.godMode) player.energy -= PHASE_DRAIN_RATE * dt;
                 createParticles(player.x + Math.random()*player.width, player.y + Math.random()*player.height, ParticleType.SPIRIT_TRAIL, 1, '#bfdbfe');
              } else {
                 player.isPhasing = false; 
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
          player.isPhasing = true; 
          player.godMode = true;
          soundManager.playEndingMusic();

          const ringExists = landmarksRef.current.some(l => l.type === 'CHRONOS_SNOWFLAKE');
          if (!ringExists) {
             landmarksRef.current.push({
                 id: Date.now(), x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT/2, width: 300, height: 300,
                 type: 'CHRONOS_SNOWFLAKE', name: 'The Chronos Snowflake', markedForDeletion: false
             });
             triggeredEventsRef.current.add('CHRONOS_SNOWFLAKE');
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
          // Obstacles - Biome specific
          const spawnChance = 0.02 * level.spawnRate * timeScale;
          if (Math.random() < spawnChance && level.allowedObstacles.length > 0) {
              const types = level.allowedObstacles;
              let type = types[Math.floor(Math.random() * types.length)];
              
              let y = Math.random() * (CANVAS_HEIGHT - 100);
              let w = 40; let h = 40;
              let score = 100;
              
              if (type === 'RUSTED_PINE') {
                  y = CANVAS_HEIGHT - 200; w = 60; h = 200; score = 500;
              } else if (type === 'FROST_WALL') {
                  h = 150; y = Math.random() * (CANVAS_HEIGHT - h); w = 30; score = 200;
              } else if (type === 'ICE_SHARD') {
                  w = 50; h = 50; score = 50;
              } else if (type === 'CORRUPTED_ELF') {
                  score = 150;
              } else if (type === 'WATCHER_EYE') {
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
             if (progressRatio >= lm.progress && !triggeredEventsRef.current.has(lm.type) && lm.type !== 'CHRONOS_SNOWFLAKE') {
                 triggeredEventsRef.current.add(lm.type);
                 landmarksRef.current.push({
                     id: Date.now(), x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT/2, width: 300, height: 300,
                     type: lm.type, name: lm.name, markedForDeletion: false
                 });
             }
         });
      }

      // 4. Collisions
      
      obstaclesRef.current.forEach(obs => {
          obs.x -= currentSpeed * level.obstacleSpeed * timeScale;
          if (obs.x < -100) obs.markedForDeletion = true;
          if (obs.type === 'CORRUPTED_ELF' || obs.type === 'ICE_SHARD') obs.rotation! += 0.05 * timeScale;
          
          if (obs.type === 'WATCHER_EYE') {
              obs.y += (player.y - obs.y) * 0.01 * timeScale;
          }

          // Player vs Obstacle Collision
          if (!obs.markedForDeletion && checkCollision(player, obs)) {
              if (player.isPhasing || player.godMode) {
                  // Spirit Form Through
                  if (!obs.scanned) {
                      obs.scanned = true;
                      soundManager.playScanSuccess();
                      createParticles(obs.x + obs.width/2, obs.y + obs.height/2, ParticleType.RUNE, 8, '#bfdbfe');
                      
                      // Reward
                      player.energy = Math.min(player.maxEnergy, player.energy + PHASE_SCAN_REWARD);
                      
                      player.combo = Math.min(50, player.combo + 1);
                      player.comboTimer = COMBO_DECAY;
                      const val = obs.scoreValue * player.combo;
                      scoreRef.current += val;
                      createScorePopup(player.x, player.y - 20, val, `SPIRIT ${player.combo}x`);
                  }
              } else {
                  // Collision Damage
                  player.integrity -= 20;
                  soundManager.playDamage();
                  shakeRef.current = 20;
                  obs.markedForDeletion = true;
                  // Reset Combo
                  if (player.combo > 1) {
                      createScorePopup(player.x, player.y - 20, 0, "CHAIN BROKEN");
                      player.combo = 1;
                  }
                  createParticles(player.x + 20, player.y + 10, ParticleType.SPARK, 15, '#f87171');
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
              createParticles(p.x, p.y, ParticleType.GLOW, 10, POWERUP_COLORS[p.type]);
              if (p.type === PowerupType.CHARGE) player.energy = Math.min(player.maxEnergy, player.energy + 50);
              if (p.type === PowerupType.REPAIR) player.integrity = Math.min(100, player.integrity + 30);
              if (p.type === PowerupType.MEMORY) scoreRef.current += 1000;
              if (p.type === PowerupType.INVULNERABILITY) player.energy = player.maxEnergy; 
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
          if (p.type === ParticleType.SPIRIT_TRAIL) {
              p.x -= currentSpeed * timeScale * 0.5; 
          }
      });
      
      // Score Popups
      scorePopupsRef.current.forEach(p => {
          p.life -= dt;
          p.y -= 1 * timeScale; // Float up
      });

      // Snow
      snowRef.current.forEach(s => {
          s.y += s.speed * timeScale * 0.5;
          s.x -= currentSpeed * timeScale * 0.2; // Parallax with speed
          s.x += Math.sin(s.swing + now * 0.001) * 0.5;
          if (s.y > CANVAS_HEIGHT) s.y = -10;
          if (s.x < 0) s.x = CANVAS_WIDTH;
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
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(30px)'; 
      ctx.globalAlpha = 0.4; 
      const t = now * 0.0005;
      
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

        // Moon (Shattered)
        ctx.save();
        ctx.fillStyle = "#e2e8f0"; 
        ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(CANVAS_WIDTH - 200, 150, 40, 0, Math.PI*2); ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH-220, 150); ctx.lineTo(CANVAS_WIDTH-160, 140); ctx.lineTo(CANVAS_WIDTH-180, 160); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // 3. Parallax
        bgLayersRef.current.forEach((layer, i) => {
            ctx.save();
            ctx.fillStyle = layer.color;
            
            const blockWidth = 50 + i * 30; 
            const points = layer.points as any[];
            if (!points || points.length === 0) { ctx.restore(); return; }

            const totalWidth = points.length * blockWidth;
            const scrollPos = (distanceRef.current * layer.speedModifier) % totalWidth;
            const startIndex = Math.floor(scrollPos / blockWidth);
            const offset = scrollPos % blockWidth;

            ctx.beginPath();
            ctx.moveTo(-blockWidth, CANVAS_HEIGHT);
            
            for (let j = 0; j < Math.ceil(CANVAS_WIDTH / blockWidth) + 2; j++) {
                const idx = (startIndex + j) % points.length;
                const b = points[idx]; 
                if (!b) continue;

                const x = j * blockWidth - offset;
                const h = b.height;
                // Smooth terrain
                ctx.lineTo(x, CANVAS_HEIGHT - h);
            }
            ctx.lineTo(CANVAS_WIDTH + blockWidth, CANVAS_HEIGHT);
            ctx.fill();
            ctx.restore();
        });

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

        // Snow Overlay
        ctx.save();
        ctx.fillStyle = "white";
        snowRef.current.forEach(s => {
            ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        });
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
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 20px Cinzel';
        ctx.fillText(s.text || `+${s.value}`, s.x, s.y);
        ctx.restore();
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        if (p.type === ParticleType.SPIRIT_TRAIL) {
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI*2); ctx.fill();
        } else if (p.type === ParticleType.SPARK || p.type === ParticleType.THRUST) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        } else if (p.type === ParticleType.GLOW) {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius*2, 0, Math.PI*2); ctx.fill();
        } else if (p.type === ParticleType.RUNE) {
            ctx.fillStyle = '#bfdbfe';
            ctx.font = '10px serif';
            ctx.fillText('✴', p.x, p.y);
        }
        ctx.restore();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
        
        // Krampus - The Seeker
        // Spirit Mode Visuals
        if (p.isPhasing) {
             ctx.globalAlpha = 0.6;
             ctx.shadowColor = "#bfdbfe"; ctx.shadowBlur = 40;
        } else {
             ctx.globalAlpha = 1.0;
             ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
        }

        // Sleigh Body (Ancient Wood & Iron)
        ctx.fillStyle = "#3f2c2c"; // Dark Wood
        if (p.isPhasing) ctx.fillStyle = "#1e3a8a"; // Ghostly Blue
        
        ctx.beginPath(); 
        // Sleigh Shape
        ctx.moveTo(40, -5); 
        ctx.quadraticCurveTo(20, 20, -30, 10);
        ctx.lineTo(-40, 0);
        ctx.quadraticCurveTo(-20, -15, 40, -5);
        ctx.fill();
        
        // Gold Trim
        ctx.strokeStyle = p.isPhasing ? "#93c5fd" : "#d97706"; ctx.lineWidth = 2;
        ctx.stroke();

        // Krampus Silhouette
        ctx.fillStyle = p.isPhasing ? "#dbeafe" : "#0f172a"; 
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI*2); // Head
        ctx.fill();
        // Horns
        ctx.beginPath();
        ctx.moveTo(-5, -15); ctx.quadraticCurveTo(-10, -25, -2, -28);
        ctx.moveTo(5, -15); ctx.quadraticCurveTo(10, -25, 2, -28);
        ctx.stroke();

        // Red Scarf (The connection to Santa)
        const t = Date.now() / 150;
        ctx.strokeStyle = p.isPhasing ? "#ffffff" : "#dc2626"; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.shadowColor = "#dc2626"; ctx.shadowBlur = p.isPhasing ? 0 : 10;
        ctx.beginPath(); 
        ctx.moveTo(-5, -8); 
        ctx.quadraticCurveTo(-25, -12 + Math.sin(t)*5, -55 - (p.vy*2), -8 + Math.cos(t)*5); 
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Magic Thruster
        if (p.isThrusting) {
            ctx.fillStyle = "#60a5fa";
            ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.ellipse(-40, 5, 8, 4, 0, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle, now: number) => {
        ctx.save(); ctx.translate(o.x + o.width/2, o.y + o.height/2);
        
        if (o.scanned) {
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = "#ffffff";
        } else {
            ctx.globalAlpha = 1;
        }

        if (o.type === 'WATCHER_EYE') {
            const hover = Math.sin(now * 0.005) * 5;
            ctx.translate(0, hover);
            
            // Eye Bot
            ctx.fillStyle = "#1e293b";
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            
            // Glowing Red Eye
            ctx.fillStyle = "#ef4444"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            // Wings
            ctx.strokeStyle = "#94a3b8";
            ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-30, -10);
            ctx.moveTo(15, 0); ctx.lineTo(30, -10);
            ctx.stroke();

        } else if (o.type === 'RUSTED_PINE') {
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            // Dead Tree
            ctx.fillStyle = "#292524"; 
            ctx.beginPath();
            ctx.moveTo(w/2, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();
            // Dead Branches
            ctx.strokeStyle = "#44403c";
            ctx.beginPath(); ctx.moveTo(w/2, h*0.3); ctx.lineTo(w, h*0.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w/2, h*0.6); ctx.lineTo(0, h*0.7); ctx.stroke();
            
        } else if (o.type === 'FROST_WALL') {
             // Giant Icicles
            const w = o.width; const h = o.height;
            ctx.translate(-w/2, -h/2);
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#dbeafe"); grad.addColorStop(1, "#60a5fa");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w/2, h); ctx.fill();
            
        } else if (o.type === 'CORRUPTED_ELF') {
            // Broken Toy Elf
            ctx.rotate(o.rotation || 0);
            ctx.fillStyle = "#166534"; // Green Coat
            ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = "#ef4444"; // Red Hat
            ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, -15); ctx.lineTo(0, -35); ctx.fill();
            // X Eyes
            ctx.strokeStyle = "white"; ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(-8, -5); ctx.lineTo(-2, 5); ctx.moveTo(-2, -5); ctx.lineTo(-8, 5);
            ctx.moveTo(2, -5); ctx.lineTo(8, 5); ctx.moveTo(8, -5); ctx.lineTo(2, 5);
            ctx.stroke();
        } else {
            // Ice Shard
            ctx.rotate(o.rotation || 0);
            ctx.fillStyle = "#cbd5e1";
            ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(15, 0); ctx.lineTo(0, 25); ctx.lineTo(-15, 0); ctx.fill();
        }
        ctx.restore();
    };

    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
        ctx.save(); ctx.translate(lm.x, lm.y - 150);
        if (lm.type === 'CHRONOS_SNOWFLAKE') {
            ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 60;
            ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 4;
            
            // Giant Snowflake
            const t = Date.now() / 3000;
            ctx.rotate(t);
            for(let i=0; i<6; i++) {
                ctx.rotate(Math.PI/3);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 150); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(30, 120); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 100); ctx.lineTo(-30, 120); ctx.stroke();
            }
            
            // Center Core
            ctx.fillStyle = "#60a5fa"; ctx.beginPath(); ctx.arc(0,0, 20, 0, Math.PI*2); ctx.fill();
            
        } else if (lm.type === 'GIANT_TREE') {
            // Giant Dead Christmas Tree
            ctx.fillStyle = "#0f172a"; 
            ctx.beginPath(); 
            ctx.moveTo(0, 300); ctx.lineTo(100, 300); ctx.lineTo(0, -100); ctx.lineTo(-100, 300);
            ctx.fill();
            // Faint lights
            ctx.fillStyle = "rgba(252, 211, 77, 0.2)";
            ctx.beginPath(); ctx.arc(-20, 100, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(30, 200, 5, 0, Math.PI*2); ctx.fill();

        } else if (lm.type === 'RUINED_WORKSHOP') {
            ctx.fillStyle = "#27272a";
            ctx.fillRect(-150, 100, 300, 200);
            // Factory Chimneys
            ctx.fillRect(-120, 0, 40, 100); ctx.fillRect(50, 20, 40, 80);
            // Snow on roof
            ctx.fillStyle = "#e2e8f0";
            ctx.beginPath(); ctx.moveTo(-160, 100); ctx.lineTo(160, 100); ctx.lineTo(160, 110); ctx.lineTo(-160, 110); ctx.fill();
        }
        ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
        const color = POWERUP_COLORS[p.type] || '#ffffff';
        const cx = p.x + p.width/2; 
        const cy = p.y + p.height/2 + Math.sin(p.floatOffset)*5;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.shadowColor = color; ctx.shadowBlur = 30;
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        
        if (p.type === PowerupType.CHARGE) {
            // Spirit Orb
            ctx.fillStyle = "rgba(96, 165, 250, 0.3)";
            ctx.beginPath(); ctx.arc(0,0, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        } else if (p.type === PowerupType.REPAIR) {
            // Green Cross
            ctx.fillStyle = color;
            ctx.fillRect(-5, -15, 10, 30); ctx.fillRect(-15, -5, 30, 10);
        } else if (p.type === PowerupType.MEMORY) {
            // Gold Star
            ctx.fillStyle = color;
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*15, -Math.sin((18+i*72)/180*Math.PI)*15);
                ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*7, -Math.sin((54+i*72)/180*Math.PI)*7);
            }
            ctx.closePath();
            ctx.fill();
        } else {
             // Invulnerability Shield
             ctx.strokeStyle = "#f472b6";
             ctx.beginPath(); ctx.arc(0,0, 15, 0, Math.PI*2); ctx.stroke();
             ctx.beginPath(); ctx.arc(0,0, 10, 0, Math.PI*2); ctx.stroke();
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
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-700 shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden bg-[#020617] rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full" />
      <UIOverlay {...hudState} currentLevelName={LEVELS[hudState.levelIndex].name} currentLevelSub={LEVELS[hudState.levelIndex].subtext} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(15,23,42,0.8) 100%)' }}></div>
    </div>
  );
};
export default GameCanvas;