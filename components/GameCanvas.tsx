import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, Player, Obstacle, Powerup, Letter, Projectile, Particle, ParticleType, PowerupType, Entity, BackgroundLayer, DialogueLine, GameMode, Landmark
} from '../types.ts';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_STRENGTH, LEVELS, LEVEL_THRESHOLDS, POWERUP_COLORS, TOTAL_GAME_TIME_SECONDS, VICTORY_DISTANCE, BASE_SPEED, ARTIFACTS, NARRATIVE_LETTERS, STORY_MOMENTS, LANDMARKS
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
  
  // Debug & Modes
  const [cinematicMode, setCinematicMode] = useState(false);

  // Entities
  const playerRef = useRef<Player>({
    id: 0, x: 150, y: 300, width: 90, height: 40, markedForDeletion: false,
    vy: 0, lives: 3, snowballs: 0, isInvincible: false, invincibleTimer: 0,
    healingTimer: 0, speedTimer: 0, angle: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const lettersRef = useRef<Letter[]>([]);
  const landmarksRef = useRef<Landmark[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Visuals
  const starsRef = useRef<{x:number, y:number, size:number, speed:number}[]>([]); 
  const bgStructuresRef = useRef<boolean[][]>([[], [], []]); 
  
  // Logic
  const flashTimerRef = useRef(0); 
  const shakeRef = useRef(0);
  const isEndingSequenceRef = useRef(false);
  const joyRideModeRef = useRef(false); 
  const joyRideTimerRef = useRef(0);
  const masterGiftDroppedRef = useRef(false);
  const endingMusicTriggeredRef = useRef(false);

  // State
  const collectedPowerupsRef = useRef<{ id: number; type: PowerupType }[]>([]);
  const activeDialogueRef = useRef<DialogueLine | null>(null);
  const activeWishRef = useRef<string | null>(null);
  const triggeredLandmarksRef = useRef<Set<string>>(new Set());
  const triggeredLettersRef = useRef<Set<string>>(new Set());
  const triggeredStoryMomentsRef = useRef<Set<string>>(new Set());
  
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(TOTAL_GAME_TIME_SECONDS);
  const lastFrameTimeRef = useRef(0);
  const lastLevelIndexRef = useRef(-1);
  
  // Parallax Layers
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '', speedModifier: 0.1, offset: 0 }, 
    { points: [], color: '', speedModifier: 0.3, offset: 0 }, 
    { points: [], color: '', speedModifier: 0.6, offset: 0 }, 
  ]);

  // Init
  useEffect(() => {
    // Generate Jagged, Ruined Terrain
    const generateTerrain = (amplitude: number, frequency: number) => {
        const points = [];
        for (let i = 0; i <= CANVAS_WIDTH + 200; i += 20) {
            points.push(Math.sin(i * frequency) * amplitude + (Math.random() * 5));
        }
        return points;
    };

    bgLayersRef.current[0].points = generateTerrain(150, 0.005); 
    bgLayersRef.current[1].points = generateTerrain(80, 0.01);  
    bgLayersRef.current[2].points = generateTerrain(30, 0.02);  

    // Structures (Ruins)
    bgStructuresRef.current[1] = bgLayersRef.current[1].points.map(() => Math.random() < 0.05); 
    bgStructuresRef.current[2] = bgLayersRef.current[2].points.map(() => Math.random() < 0.03);

    starsRef.current = [];
    for (let i = 0; i < 40; i++) { 
        starsRef.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
  }, []);
  
  const [hudState, setHudState] = useState({
    lives: 3, snowballs: 0, progress: 0, timeLeft: TOTAL_GAME_TIME_SECONDS, levelIndex: 0, score: 0,
    activeSpeed: 0, activeHealing: 0, collectedPowerups: [] as { id: number; type: PowerupType }[],
    activeDialogue: null as DialogueLine | null, activeWish: null as string | null
  });

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === GameState.MENU) soundManager.init();
      if (gameState !== GameState.PLAYING) return;
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        if (!isEndingSequenceRef.current) {
            playerRef.current.vy = JUMP_STRENGTH;
            soundManager.playJump();
            createParticles(playerRef.current.x, playerRef.current.y + 35, ParticleType.EMBER, 8, '#fbbf24'); 
        }
      }

      if (e.code === 'KeyZ' || e.code === 'Enter') {
        e.preventDefault();
        if (!isEndingSequenceRef.current) {
            shootProjectile();
        }
      }
    };
    
    const handleTouch = (e: TouchEvent) => {
       if (gameState === GameState.MENU) soundManager.init();
       if (gameState === GameState.PLAYING && !isEndingSequenceRef.current) {
          playerRef.current.vy = JUMP_STRENGTH;
          soundManager.playJump();
          createParticles(playerRef.current.x, playerRef.current.y + 35, ParticleType.EMBER, 8, '#fbbf24');
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('touchstart', handleTouch); };
  }, [gameState]);

  useEffect(() => {
    soundManager.init(); soundManager.reset(); 
    return () => { soundManager.stopEndingMusic(); soundManager.stopBgm(); };
  }, []);

  const shootProjectile = () => {
    if (playerRef.current.snowballs > 0) {
      playerRef.current.snowballs--;
      soundManager.playShoot();
      projectilesRef.current.push({
        id: Date.now(),
        x: playerRef.current.x + playerRef.current.width,
        y: playerRef.current.y + playerRef.current.height / 2,
        width: 15, height: 15, vx: 20, markedForDeletion: false, trail: []
      });
    }
  };

  // Main Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.INTRO) { soundManager.setSleighVolume(0); return; }

    let animationFrameId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    const resetGame = () => {
      playerRef.current = {
        id: 0, x: 150, y: 300, width: 90, height: 40, markedForDeletion: false,
        vy: 0, lives: 3, snowballs: 0, isInvincible: false, invincibleTimer: 0,
        healingTimer: 0, speedTimer: 0, angle: 0
      };
      obstaclesRef.current = []; powerupsRef.current = []; lettersRef.current = []; landmarksRef.current = [];
      projectilesRef.current = []; particlesRef.current = []; collectedPowerupsRef.current = [];
      activeDialogueRef.current = null; activeWishRef.current = null;
      triggeredStoryMomentsRef.current.clear(); triggeredLandmarksRef.current.clear(); triggeredLettersRef.current.clear();
      endingMusicTriggeredRef.current = false; flashTimerRef.current = 0; 
      
      distanceRef.current = 0; scoreRef.current = 0; timeRef.current = TOTAL_GAME_TIME_SECONDS;
      shakeRef.current = 0; 
      isEndingSequenceRef.current = false; joyRideModeRef.current = false;
      joyRideTimerRef.current = 0; masterGiftDroppedRef.current = false;
      lastLevelIndexRef.current = -1; soundManager.stopBgm();
    };

    if (gameState === GameState.INTRO || (gameState === GameState.PLAYING && playerRef.current.lives <= 0)) resetGame();
    lastFrameTimeRef.current = performance.now();

    const render = (timestamp: number) => {
      const dt = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = timestamp;
      update(dt, timestamp);
      draw(ctx, timestamp);

      if (gameState === GameState.INTRO) { animationFrameId = requestAnimationFrame(render); return; }

      if (playerRef.current.lives > 0) {
          if (gameMode === GameMode.STORY && joyRideTimerRef.current < 0 && joyRideModeRef.current) {
             // Wait for end
          } else if (gameMode === GameMode.STORY && timeRef.current <= 0 && !isEndingSequenceRef.current) {
             setGameState(GameState.GAME_OVER);
          } else {
              animationFrameId = requestAnimationFrame(render);
          }
      } else {
          setGameState(GameState.GAME_OVER);
      }
    };

    const update = (dt: number, timestamp: number) => {
      const player = playerRef.current;
      const timeScale = dt * 60;

      if (gameState === GameState.INTRO) {
          player.y = 300 + Math.sin(timestamp / 800) * 20;
          return;
      }

      if (!joyRideModeRef.current) timeRef.current -= dt;
      if (flashTimerRef.current > 0) flashTimerRef.current -= dt;
      
      const speedMultiplier = player.speedTimer > 0 ? 1.5 : 1.0; 
      let progressRatio = distanceRef.current / VICTORY_DISTANCE;
      if (gameMode === GameMode.STORY) progressRatio = Math.min(1.02, progressRatio);

      const currentSpeedFrame = (BASE_SPEED + (Math.min(progressRatio, 3.0) * 6)); 
      let currentSpeed = isEndingSequenceRef.current ? currentSpeedFrame * 0.5 : currentSpeedFrame * speedMultiplier; 

      // ENDING
      if (gameMode === GameMode.STORY && progressRatio >= 0.90 && !endingMusicTriggeredRef.current) {
          endingMusicTriggeredRef.current = true;
          soundManager.playEndingMusic(0, 10);
      }

      if (gameMode === GameMode.STORY && progressRatio >= 0.99 && !isEndingSequenceRef.current) {
          isEndingSequenceRef.current = true;
          player.isInvincible = true;
      }

      if (isEndingSequenceRef.current) {
          soundManager.setSleighVolume(0);
          if (joyRideModeRef.current) {
              // TIME JUMP
              joyRideTimerRef.current -= dt;
              // Screen fade to white then black handled in draw
              if (joyRideTimerRef.current <= 0) { setGameState(GameState.VICTORY); onWin(); }
          } else {
              // Approaching Machine
              player.vy = 0; player.y += (350 - player.y) * 0.05 * timeScale;
              currentSpeed *= 0.95; // Slow to stop
              
              if (!masterGiftDroppedRef.current && landmarksRef.current.some(l => l.type === 'CHRONOS_MACHINE' && l.x < CANVAS_WIDTH/2)) {
                  masterGiftDroppedRef.current = true;
                  createExplosion(player.x + 200, player.y, '#ffffff'); // Activation flash
                  flashTimerRef.current = 2.0; 
                  setTimeout(() => { joyRideModeRef.current = true; joyRideTimerRef.current = 4.0; }, 1000);
              }
          }
      } else {
           soundManager.setSleighVolume(currentSpeed);
      }

      if (gameMode === GameMode.STORY && timeRef.current < 30 && Math.floor(timeRef.current) !== Math.floor(timeRef.current + dt) && !isEndingSequenceRef.current) {
         soundManager.playTimeWarning();
      }

      if (!joyRideModeRef.current || joyRideTimerRef.current > 2.0) {
         distanceRef.current += currentSpeed * timeScale;
         scoreRef.current += currentSpeed * 0.1 * timeScale;
      }

      // Level Management
      let levelIndex = 0;
      let effectiveProgress = progressRatio * 100;
      if (gameMode === GameMode.ENDLESS && progressRatio > 1) effectiveProgress = (progressRatio % 1) * 100;
      else if (gameMode === GameMode.STORY) effectiveProgress = Math.min(100, effectiveProgress);

      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (effectiveProgress >= LEVEL_THRESHOLDS[i]) { levelIndex = i; break; }
      }
      if (levelIndex !== lastLevelIndexRef.current) {
          soundManager.playLevelBgm(levelIndex);
          lastLevelIndexRef.current = levelIndex;
      }
      const level = LEVELS[levelIndex];

      // Story & Spawning
      if (gameMode === GameMode.STORY) {
          STORY_MOMENTS.forEach(moment => {
            if (progressRatio >= moment.progress && !triggeredStoryMomentsRef.current.has(moment.dialogue.id)) {
              triggeredStoryMomentsRef.current.add(moment.dialogue.id);
              activeDialogueRef.current = moment.dialogue;
              setTimeout(() => { if (activeDialogueRef.current?.id === moment.dialogue.id) activeDialogueRef.current = null; }, 5000);
            }
          });
          LANDMARKS.forEach(lm => {
              if (progressRatio >= lm.progress && !triggeredLandmarksRef.current.has(lm.type)) {
                  triggeredLandmarksRef.current.add(lm.type);
                  landmarksRef.current.push({
                      id: Date.now(), x: CANVAS_WIDTH + 200, y: CANVAS_HEIGHT - 350,
                      width: 250, height: 350, markedForDeletion: false, type: lm.type, name: lm.name
                  });
              }
          });
          NARRATIVE_LETTERS.forEach(nl => {
              const key = `letter_${nl.progress}`;
              if (progressRatio >= nl.progress && !triggeredLettersRef.current.has(key)) {
                  triggeredLettersRef.current.add(key);
                  lettersRef.current.push({
                      id: Date.now(), x: CANVAS_WIDTH + 100, y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
                      width: 30, height: 30, floatOffset: 0, markedForDeletion: false, message: nl.message, isGolden: true
                  });
              }
          });
      }

      // Physics
      if (!isEndingSequenceRef.current) {
          player.vy += GRAVITY * timeScale;
          player.y += player.vy * timeScale;
          player.angle += ((Math.min(Math.max(player.vy * 0.05, -0.2), 0.2)) - player.angle) * 0.1 * timeScale;
          // Lantern Sway particles
          if(Math.random() < 0.2) createParticles(player.x + 80, player.y + 10, ParticleType.EMBER, 1, '#fbbf24'); 
      }
      
      if (player.y + player.height > CANVAS_HEIGHT - 50) { player.y = CANVAS_HEIGHT - 50 - player.height; player.vy = 0; }
      if (player.y < 0) { player.y = 0; player.vy = 0; }
      if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
      if (player.speedTimer > 0) player.speedTimer -= dt;
      if (player.healingTimer > 0) {
        player.healingTimer -= dt;
        if (Math.random() < 0.2) createParticles(player.x, player.y, ParticleType.GLOW, 1, '#86efac');
        if (player.healingTimer <= 0 && player.lives < 3) { player.lives++; soundManager.playHeal(); }
      }
      player.isInvincible = player.invincibleTimer > 0;

      // Parallax
      bgLayersRef.current.forEach((layer, index) => {
          layer.offset -= currentSpeed * layer.speedModifier * timeScale;
          if (layer.offset <= -20) {
              layer.offset += 20;
              layer.points.shift();
              layer.points.push(Math.sin((distanceRef.current * 0.01) + index) * 20 + (Math.random()*10)); // Rugged terrain
              
              if (bgStructuresRef.current[index]) {
                  bgStructuresRef.current[index].shift();
                  const chance = index === 1 ? 0.05 : 0.02;
                  bgStructuresRef.current[index].push(Math.random() < chance);
              }
          }
      });
      starsRef.current.forEach(star => {
          star.x -= (star.speed + currentSpeed * 0.5) * timeScale;
          if (star.x < 0) { star.x = CANVAS_WIDTH; star.y = Math.random() * CANVAS_HEIGHT; }
      });

      // Spawning
      if (!isEndingSequenceRef.current && Math.random() < 0.015 * level.spawnRateMultiplier * timeScale) {
        const obsTypes: Obstacle['type'][] = ['RUIN_PILLAR', 'RUSTED_DRONE', 'FROZEN_BEAM'];
        let available = obsTypes;
        if (levelIndex === 4) available = []; 
        
        if (available.length > 0) {
            const type = available[Math.floor(Math.random() * available.length)];
            obstaclesRef.current.push({
              id: Date.now() + Math.random(),
              x: CANVAS_WIDTH + 100,
              y: type === 'RUSTED_DRONE' ? Math.random() * (CANVAS_HEIGHT - 200) : CANVAS_HEIGHT - 100,
              width: 50,
              height: type === 'RUIN_PILLAR' ? 120 : 50,
              type: type, markedForDeletion: false, rotation: 0
            });
        }
      }
      
      if (!isEndingSequenceRef.current && Math.random() < 0.005 * timeScale && levelIndex !== 4) {
          const pTypes = Object.values(PowerupType);
          powerupsRef.current.push({
            id: Date.now(), x: CANVAS_WIDTH + 100, y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
            width: 30, height: 30, type: pTypes[Math.floor(Math.random() * pTypes.length)], floatOffset: 0, markedForDeletion: false
          });
      }

      if (!isEndingSequenceRef.current && Math.random() < ((gameMode === GameMode.STORY && levelIndex === 4) ? 0.02 : 0.003) * timeScale) {
          const msg = ARTIFACTS[Math.floor(Math.random() * ARTIFACTS.length)];
          const isGolden = (gameMode === GameMode.STORY && levelIndex === 4);
          lettersRef.current.push({
              id: Date.now(), x: CANVAS_WIDTH + 100, y: Math.random() * (CANVAS_HEIGHT - 250) + 50,
              width: 30, height: 20, floatOffset: 0, markedForDeletion: false, message: msg, isGolden
          });
      }

      // Collisions
      obstaclesRef.current.forEach(obs => {
        obs.x -= currentSpeed * level.obstacleSpeedMultiplier * timeScale;
        if (obs.type === 'RUSTED_DRONE') { obs.y += Math.sin(timestamp / 500 + obs.id) * 2; }
        if (obs.x + obs.width < -100) obs.markedForDeletion = true;
        
        if (!cinematicMode && !player.isInvincible && checkCollision(player, obs)) {
          if (gameMode === GameMode.STORY && levelIndex === 4) {} 
          else {
              player.lives--; soundManager.playCrash(); player.invincibleTimer = 2.0; shakeRef.current = 15;
              createExplosion(player.x, player.y, '#9ca3af'); // Grey/Dust explosion
          }
        }
      });
      
      powerupsRef.current.forEach(pup => {
        pup.x -= currentSpeed * timeScale;
        if (checkCollision(player, pup)) {
          pup.markedForDeletion = true; applyPowerup(pup.type); soundManager.playPowerup(pup.type);
          createParticles(pup.x, pup.y, ParticleType.GLOW, 20, POWERUP_COLORS[pup.type]);
          collectedPowerupsRef.current.push({ id: Date.now(), type: pup.type });
        }
      });
      
      landmarksRef.current.forEach(lm => {
         lm.x -= currentSpeed * timeScale;
         if (lm.x < -300) lm.markedForDeletion = true;
      });

      lettersRef.current.forEach(l => {
         l.x -= currentSpeed * timeScale;
         if (checkCollision(player, l)) {
             l.markedForDeletion = true; soundManager.playCollectWish();
             activeWishRef.current = l.message;
             setTimeout(() => { if (activeWishRef.current === l.message) activeWishRef.current = null; }, 4000);
         }
      });

      projectilesRef.current.forEach(p => {
        p.x += p.vx * timeScale;
        if (p.x > CANVAS_WIDTH) p.markedForDeletion = true;
        obstaclesRef.current.forEach(obs => {
            if (!obs.markedForDeletion && checkCollision(p, obs)) {
                obs.markedForDeletion = true; p.markedForDeletion = true;
                soundManager.playCrash(); createExplosion(obs.x, obs.y, '#93c5fd'); scoreRef.current += 100;
            }
        });
      });

      particlesRef.current.forEach(p => {
        p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.life -= dt; p.alpha = p.life / p.maxLife;
        if (p.type === ParticleType.ASH) { p.y += 1 * timeScale; p.x += Math.sin(timestamp/500)*0.5; } 
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      obstaclesRef.current = obstaclesRef.current.filter(e => !e.markedForDeletion);
      powerupsRef.current = powerupsRef.current.filter(e => !e.markedForDeletion);
      lettersRef.current = lettersRef.current.filter(e => !e.markedForDeletion);
      landmarksRef.current = landmarksRef.current.filter(e => !e.markedForDeletion);
      projectilesRef.current = projectilesRef.current.filter(e => !e.markedForDeletion);

      if (shakeRef.current > 0) shakeRef.current *= 0.9;
      if (Math.floor(timestamp / 100) > Math.floor((timestamp - dt * 1000) / 100)) {
        const newPowerups = collectedPowerupsRef.current; collectedPowerupsRef.current = [];
        setHudState({ lives: player.lives, snowballs: player.snowballs, progress: progressRatio * 100, timeLeft: timeRef.current, levelIndex, score: scoreRef.current, activeSpeed: player.speedTimer, activeHealing: player.healingTimer, collectedPowerups: newPowerups, activeDialogue: activeDialogueRef.current, activeWish: activeWishRef.current });
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, timestamp: number) => {
      const level = LEVELS[hudState.levelIndex];
      // Background Gradient - Desolate
      const grad = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT);
      grad.addColorStop(0, level.backgroundGradient[0]); 
      grad.addColorStop(1, level.backgroundGradient[1]); 
      ctx.fillStyle = grad;
      ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars/Snow - Ash
      ctx.fillStyle = "#cbd5e1";
      starsRef.current.forEach(s => {
          ctx.globalAlpha = Math.random() * 0.2 + 0.1;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.size/2, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Parallax Hills - Silhouette Ruins
      drawParallaxLayer(ctx, bgLayersRef.current[0], CANVAS_HEIGHT - 120, "#020617", timestamp); 
      drawParallaxLayer(ctx, bgLayersRef.current[1], CANVAS_HEIGHT - 80, "#0f172a", timestamp, bgStructuresRef.current[1]); 
      
      ctx.save();
      const dx = (Math.random() - 0.5) * shakeRef.current; 
      const dy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(dx, dy);

      drawParallaxLayer(ctx, bgLayersRef.current[2], CANVAS_HEIGHT - 40, "#1e293b", timestamp, bgStructuresRef.current[2]); 

      landmarksRef.current.forEach(lm => drawLandmark(ctx, lm));
      powerupsRef.current.forEach(p => drawPowerup(ctx, p));
      lettersRef.current.forEach(l => drawLetter(ctx, l));
      obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
      
      // Projectiles (Spirit Orbs)
      projectilesRef.current.forEach(p => {
          ctx.fillStyle = "#93c5fd"; 
          ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;
      });

      drawPlayer(ctx, playerRef.current);

      particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
          if (p.type === ParticleType.EMBER || p.type === ParticleType.GLOW) { 
              ctx.globalCompositeOperation = 'lighter'; 
              ctx.shadowColor = p.color; ctx.shadowBlur = 10;
          }
          ctx.fillRect(p.x, p.y, p.radius, p.radius); 
          ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
      });

      if (flashTimerRef.current > 0) {
          ctx.fillStyle = `rgba(255,255,255,${flashTimerRef.current})`; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
      }
      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, gameMode]);

  // --- Rendering Helpers ---

  const checkCollision = (r1: Entity, r2: Entity) => (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
  
  const createParticles = (x: number, y: number, type: ParticleType, count: number, color: string) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              id: Math.random(), type, x, y, radius: Math.random()*4+1,
              vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, alpha: 1, color, life: 1, maxLife: 1, growth: 0
          });
      }
  };

  const createExplosion = (x: number, y: number, color: string) => {
      createParticles(x, y, ParticleType.EMBER, 10, color);
      createParticles(x, y, ParticleType.DUST, 15, '#475569');
  };

  const applyPowerup = (type: PowerupType) => {
      const p = playerRef.current;
      if (type === PowerupType.SPEED) p.speedTimer = 8;
      if (type === PowerupType.SNOWBALLS) p.snowballs += 10;
      if (type === PowerupType.BLAST) { obstaclesRef.current = []; createExplosion(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, '#fff'); }
      if (type === PowerupType.HEALING) p.healingTimer = 5;
      if (type === PowerupType.LIFE) p.lives = Math.min(3, p.lives+1);
  };

  const drawParallaxLayer = (ctx: CanvasRenderingContext2D, layer: BackgroundLayer, baseY: number, color: string, timestamp: number, structs?: boolean[]) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT);
      for (let i = 0; i < layer.points.length - 1; i++) {
          const x = (i * 20) + layer.offset; const y = baseY + layer.points[i];
          const nextX = ((i + 1) * 20) + layer.offset; const nextY = baseY + layer.points[i+1];
          ctx.lineTo(x, y); ctx.lineTo(nextX, nextY);
      }
      ctx.lineTo(CANVAS_WIDTH + 200, CANVAS_HEIGHT); ctx.fill();
      
      // Ruins / Pillars
      if (structs) {
          ctx.shadowColor = "#000"; ctx.shadowBlur = 5;
          for(let i=0; i<layer.points.length; i++) {
              if (structs[i]) {
                  const x = (i * 20) + layer.offset; const y = baseY + layer.points[i];
                  // Broken Pillar
                  ctx.fillStyle = color; // Same as ground but taller
                  ctx.fillRect(x, y - 60, 10, 60);
                  // Crumbling top
                  ctx.beginPath(); ctx.moveTo(x, y-60); ctx.lineTo(x+10, y-60); ctx.lineTo(x+5, y-70); ctx.fill();
              }
          }
          ctx.shadowBlur = 0;
      }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
      ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
      if (p.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) { ctx.restore(); return; }
      
      // KRAMPUS'S SLEIGH (Scavenged)
      
      // Runners (Rusted Metal)
      ctx.strokeStyle = "#78350f"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-30, 20); ctx.lineTo(30, 20); ctx.quadraticCurveTo(40, 15, 35, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(-20, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(20, 10); ctx.stroke();

      // Body (Old Wood)
      ctx.fillStyle = "#451a03"; 
      ctx.fillRect(-35, 0, 70, 15);
      
      // Krampus Figure
      ctx.fillStyle = "#1e293b"; // Dark Cloak
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(0, -25); ctx.fill(); // Body
      
      // Head & Horns
      ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.arc(0, -25, 6, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(-8, -40); ctx.stroke(); // Left Horn
      ctx.beginPath(); ctx.moveTo(4, -30); ctx.lineTo(8, -40); ctx.stroke(); // Right Horn

      // The Lantern (Hanging from back)
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-40, 5); ctx.stroke();
      
      // Lantern Glow
      ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 20;
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(-40, 10, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
      ctx.save(); ctx.translate(o.x, o.y);
      
      if (o.type === 'RUIN_PILLAR') {
          ctx.fillStyle = "#334155"; 
          ctx.fillRect(0,0,o.width, o.height);
          // Cracks
          ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(20, 40); ctx.lineTo(10, 60); ctx.stroke();
      } else if (o.type === 'RUSTED_DRONE') {
          ctx.fillStyle = "#78350f"; 
          ctx.beginPath(); ctx.arc(o.width/2, o.height/2, 15, 0, Math.PI*2); ctx.fill();
          // Red Eye (Fading)
          ctx.fillStyle = "#dc2626"; ctx.shadowColor = "#dc2626"; ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(o.width/2, o.height/2, 4, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;
      } else {
          // Frozen Beam
          ctx.fillStyle = "#64748b"; 
          ctx.fillRect(0,0,o.width, o.height);
          ctx.fillStyle = "#94a3b8"; ctx.fillRect(5, 0, 5, o.height); // Ice streak
      }
      ctx.restore();
  };

  const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
      ctx.save(); ctx.translate(p.x, p.y);
      const color = POWERUP_COLORS[p.type];
      ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0,p.width,p.height); 
      ctx.strokeRect(0,0,p.width,p.height);
      
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "16px monospace";
      const icon = p.type === 'SPEED' ? '⚡' : (p.type === 'SNOWBALLS' ? '✦' : (p.type === 'HEALING' ? '+' : '♥'));
      ctx.fillText(icon, p.width/2, p.height/2);
      ctx.restore();
  };

  const drawLetter = (ctx: CanvasRenderingContext2D, l: Letter) => {
      ctx.save(); ctx.translate(l.x, l.y);
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "#fde047"; ctx.shadowBlur = 10;
      // Scroll shape
      ctx.fillRect(0, 5, 30, 15);
      ctx.fillStyle = "#451a03"; ctx.fillRect(2, 8, 26, 2); ctx.fillRect(2, 12, 20, 2);
      ctx.restore();
  };

  const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
      ctx.save(); ctx.translate(lm.x, lm.y);
      ctx.fillStyle = "#0f172a";
      
      if (lm.type === 'CHRONOS_MACHINE') {
          // Big circular gate
          ctx.beginPath(); ctx.arc(lm.width/2, lm.height/2, 100, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.stroke();
          // Glow center
          ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 50;
          ctx.beginPath(); ctx.arc(lm.width/2, lm.height/2, 20, 0, Math.PI*2); ctx.fill();
      } else if (lm.type === 'REINDEER_STATUE') {
          // Blocky statue
          ctx.fillRect(0, lm.height-100, 100, 100); // Base
          ctx.beginPath(); ctx.moveTo(20, lm.height-100); ctx.lineTo(50, lm.height-200); ctx.lineTo(80, lm.height-100); ctx.fill(); // Body
      } else {
          // Ruin
          ctx.fillRect(0,0, lm.width, lm.height);
      }
      ctx.restore();
  };

  return (
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-900 shadow-2xl rounded-sm overflow-hidden bg-black">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-cover" />
      {gameState !== GameState.INTRO && !cinematicMode && !isEndingSequenceRef.current && (
        <UIOverlay 
          lives={hudState.lives} snowballs={hudState.snowballs} progress={hudState.progress} timeLeft={hudState.timeLeft}
          activePowerups={hudState.activeSpeed + hudState.activeHealing} currentLevelName={LEVELS[hudState.levelIndex].name}
          score={hudState.score} collectedPowerups={hudState.collectedPowerups} activeDialogue={hudState.activeDialogue} activeWish={hudState.activeWish}
        />
      )}
      <div className="absolute inset-0 flex md:hidden z-40 pointer-events-auto">
        <div className="w-1/2 h-full" onTouchStart={(e) => { e.preventDefault(); if(!isEndingSequenceRef.current) {playerRef.current.vy = JUMP_STRENGTH; soundManager.playJump();} }} />
        <div className="w-1/2 h-full" onTouchStart={(e) => { e.preventDefault(); if(!isEndingSequenceRef.current) {shootProjectile();} }} />
      </div>
    </div>
  );
};
export default GameCanvas;