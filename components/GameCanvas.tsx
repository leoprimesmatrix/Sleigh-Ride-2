
import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, Player, Obstacle, Powerup, Letter, Projectile, Particle, ParticleType, PowerupType, Entity, BackgroundLayer, DialogueLine, GameMode, Landmark
} from '../types.ts';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_STRENGTH, LEVELS, LEVEL_THRESHOLDS, POWERUP_COLORS, TOTAL_GAME_TIME_SECONDS, VICTORY_DISTANCE, BASE_SPEED, WISHES, NARRATIVE_LETTERS, STORY_MOMENTS, LANDMARKS
} from '../constants.ts';
import UIOverlay from './UIOverlay.tsx';
import { soundManager } from '../audio.ts';
import { Eye, EyeOff, Camera, Trophy, FastForward, Skull } from 'lucide-react';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onWin: () => void;
  gameMode: GameMode;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, onWin, gameMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Debug State
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [cinematicMode, setCinematicMode] = useState(false);

  // Game Entities
  const playerRef = useRef<Player>({
    id: 0, x: 150, y: 300, width: 70, height: 35, markedForDeletion: false,
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
  const starsRef = useRef<{x:number, y:number, size:number, speed:number}[]>([]); // Digital dust
  const gridLinesRef = useRef<number[]>([]); // Cyber grid floor
  const bgStructuresRef = useRef<boolean[][]>([[], [], []]); 
  
  // Game Logic Refs
  const flashTimerRef = useRef(0); 
  const pausedTimeRef = useRef(0); 
  const saturationRef = useRef(1.0); 
  const isLightsOutRef = useRef(false);
  const flickerTimerRef = useRef(0);
  const isEndingSequenceRef = useRef(false);
  const joyRideModeRef = useRef(false); // Used for escape sequence
  const joyRideTimerRef = useRef(0);
  const masterGiftDroppedRef = useRef(false);

  // HUD & Audio Queues
  const collectedPowerupsRef = useRef<{ id: number; type: PowerupType }[]>([]);
  const activeDialogueRef = useRef<DialogueLine | null>(null);
  const activeWishRef = useRef<string | null>(null);
  const endingMusicTriggeredRef = useRef(false);
  const triggeredLandmarksRef = useRef<Set<string>>(new Set());
  const triggeredLettersRef = useRef<Set<string>>(new Set());
  const triggeredStoryMomentsRef = useRef<Set<string>>(new Set());
  
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(TOTAL_GAME_TIME_SECONDS);
  const lastFrameTimeRef = useRef(0);
  const shakeRef = useRef(0);
  const lastLevelIndexRef = useRef(-1);
  
  // Parallax Layers
  const bgLayersRef = useRef<BackgroundLayer[]>([
    { points: [], color: '', speedModifier: 0.2, offset: 0 }, 
    { points: [], color: '', speedModifier: 0.5, offset: 0 }, 
    { points: [], color: '', speedModifier: 0.8, offset: 0 }, 
  ]);

  // Init
  useEffect(() => {
    // Generate Industrial Terrain
    const generateTerrain = (amplitude: number, roughness: number) => {
        const points = [];
        let y = 0;
        for (let i = 0; i <= CANVAS_WIDTH + 200; i += 40) {
            if (Math.random() > 0.8) y += (Math.random() - 0.5) * roughness; // Sudden drops
            else y = y * 0.9; // Flatten out
            y = Math.max(Math.min(y, amplitude), -amplitude);
            points.push(y);
        }
        return points;
    };

    bgLayersRef.current[0].points = generateTerrain(150, 100); 
    bgLayersRef.current[1].points = generateTerrain(80, 50);  
    bgLayersRef.current[2].points = generateTerrain(30, 20);  

    bgStructuresRef.current[1] = bgLayersRef.current[1].points.map(() => Math.random() < 0.2); // Smokestacks
    bgStructuresRef.current[2] = bgLayersRef.current[2].points.map(() => Math.random() < 0.1); // Antennas

    starsRef.current = [];
    for (let i = 0; i < 60; i++) {
        starsRef.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 0.5
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
      if (e.code === 'Backquote') { setDebugMenuOpen(prev => !prev); return; }
      if (gameState === GameState.MENU) soundManager.init();
      if (gameState !== GameState.PLAYING) return;
      
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !isEndingSequenceRef.current) {
        playerRef.current.vy = JUMP_STRENGTH;
        soundManager.playJump();
        createParticles(playerRef.current.x, playerRef.current.y + 30, ParticleType.FIRE, 5, '#f59e0b');
      }

      if ((e.code === 'KeyZ' || e.code === 'Enter') && !isEndingSequenceRef.current) {
        shootProjectile();
      }
    };
    
    const handleTouch = () => {
       if (gameState === GameState.MENU) soundManager.init();
       if (gameState === GameState.PLAYING && !isEndingSequenceRef.current) {
          playerRef.current.vy = JUMP_STRENGTH;
          soundManager.playJump();
          createParticles(playerRef.current.x, playerRef.current.y + 30, ParticleType.FIRE, 5, '#f59e0b');
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
        width: 15, height: 6, vx: 20, markedForDeletion: false, trail: []
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
        id: 0, x: 150, y: 300, width: 70, height: 35, markedForDeletion: false,
        vy: 0, lives: 3, snowballs: 0, isInvincible: false, invincibleTimer: 0,
        healingTimer: 0, speedTimer: 0, angle: 0
      };
      obstaclesRef.current = []; powerupsRef.current = []; lettersRef.current = []; landmarksRef.current = [];
      projectilesRef.current = []; particlesRef.current = []; collectedPowerupsRef.current = [];
      activeDialogueRef.current = null; activeWishRef.current = null;
      triggeredStoryMomentsRef.current.clear(); triggeredLandmarksRef.current.clear(); triggeredLettersRef.current.clear();
      endingMusicTriggeredRef.current = false; flashTimerRef.current = 0; pausedTimeRef.current = 0;
      
      distanceRef.current = 0; scoreRef.current = 0; timeRef.current = TOTAL_GAME_TIME_SECONDS;
      shakeRef.current = 0; saturationRef.current = 1.0; flickerTimerRef.current = 0;
      isLightsOutRef.current = false; isEndingSequenceRef.current = false; joyRideModeRef.current = false;
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
      
      const speedMultiplier = player.speedTimer > 0 ? 1.8 : 1.0; // Overclock speed
      let progressRatio = distanceRef.current / VICTORY_DISTANCE;
      if (gameMode === GameMode.STORY) progressRatio = Math.min(1.02, progressRatio);

      const currentSpeedFrame = (BASE_SPEED + (Math.min(progressRatio, 3.0) * 8)); 
      let currentSpeed = isEndingSequenceRef.current ? currentSpeedFrame * 0.5 : currentSpeedFrame * speedMultiplier; 

      // ENDING LOGIC
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
              // ESCAPE SEQUENCE
              currentSpeed = BASE_SPEED * 4; 
              joyRideTimerRef.current -= dt;
              player.y = 250 + Math.sin(timestamp / 200) * 100; // Wild movement
              player.angle = Math.sin(timestamp / 200) * 0.4;
              createParticles(player.x - 20, player.y + 20, ParticleType.FIRE, 5, '#ef4444'); // Afterburners
              if (joyRideTimerRef.current <= 0) { setGameState(GameState.VICTORY); onWin(); }
          } else {
              // Pre-Escape
              player.vy = 0; player.y += (200 - player.y) * 0.05 * timeScale;
              if (!masterGiftDroppedRef.current && landmarksRef.current.some(l => l.type === 'MAIN_HUB' && l.x < CANVAS_WIDTH/2)) {
                  masterGiftDroppedRef.current = true;
                  createExplosion(player.x, player.y);
                  flashTimerRef.current = 2.0; 
                  setTimeout(() => { joyRideModeRef.current = true; joyRideTimerRef.current = 10.0; }, 500);
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

      // Level Logic
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

      // Act IV Flicker
      if (levelIndex === 3) { 
          flickerTimerRef.current -= dt;
          if (flickerTimerRef.current <= 0) {
              isLightsOutRef.current = !isLightsOutRef.current;
              flickerTimerRef.current = isLightsOutRef.current ? Math.random() * 0.2 + 0.1 : Math.random() * 2 + 0.5;
          }
      } else { isLightsOutRef.current = false; }

      // Story Events
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
                      width: 200, height: 400, markedForDeletion: false, type: lm.type, name: lm.name
                  });
              }
          });
          NARRATIVE_LETTERS.forEach(nl => {
              const key = `letter_${nl.progress}`;
              if (progressRatio >= nl.progress && !triggeredLettersRef.current.has(key)) {
                  triggeredLettersRef.current.add(key);
                  lettersRef.current.push({
                      id: Date.now(), x: CANVAS_WIDTH + 100, y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
                      width: 40, height: 30, floatOffset: 0, markedForDeletion: false, message: nl.message, isGolden: true
                  });
              }
          });
      }

      // Physics
      if (!isEndingSequenceRef.current) {
          player.vy += GRAVITY * timeScale;
          player.y += player.vy * timeScale;
          player.angle += ((Math.min(Math.max(player.vy * 0.05, -0.5), 0.5)) - player.angle) * 0.1 * timeScale;
          // Jet Trail
          createParticles(player.x, player.y + 25, ParticleType.FIRE, 2, '#3b82f6'); 
      }
      
      if (player.y + player.height > CANVAS_HEIGHT - 50) { player.y = CANVAS_HEIGHT - 50 - player.height; player.vy = 0; }
      if (player.y < 0) { player.y = 0; player.vy = 0; }
      if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
      if (player.speedTimer > 0) player.speedTimer -= dt;
      if (player.healingTimer > 0) {
        player.healingTimer -= dt;
        if (Math.random() < 0.2) createParticles(player.x, player.y, ParticleType.GLOW, 1, '#22c55e');
        if (player.healingTimer <= 0 && player.lives < 3) { player.lives++; soundManager.playHeal(); }
      }
      player.isInvincible = player.invincibleTimer > 0;

      // Parallax Updates
      bgLayersRef.current.forEach((layer, index) => {
          layer.offset -= currentSpeed * layer.speedModifier * timeScale;
          if (layer.offset <= -40) {
              layer.offset += 40;
              layer.points.shift();
              layer.points.push((Math.random() - 0.5) * (layer.speedModifier * 30));
              if (bgStructuresRef.current[index]) {
                  bgStructuresRef.current[index].shift();
                  const chance = index === 1 ? 0.3 : (index === 2 ? 0.4 : 0);
                  bgStructuresRef.current[index].push(Math.random() < chance);
              }
          }
      });
      starsRef.current.forEach(star => {
          star.x -= (star.speed + currentSpeed * 0.2) * timeScale;
          if (star.x < 0) { star.x = CANVAS_WIDTH; star.y = Math.random() * CANVAS_HEIGHT; }
      });

      // Spawning
      if (!isEndingSequenceRef.current && Math.random() < 0.015 * level.spawnRateMultiplier * timeScale) {
        const obsTypes: Obstacle['type'][] = ['PIPE', 'DRONE', 'TOWER', 'DATA_BLOCK'];
        let available = obsTypes;
        if (levelIndex === 2) available = ['DRONE', 'DATA_BLOCK']; 
        if (levelIndex === 4) available = []; 
        
        if (available.length > 0) {
            const type = available[Math.floor(Math.random() * available.length)];
            obstaclesRef.current.push({
              id: Date.now() + Math.random(),
              x: CANVAS_WIDTH + 100,
              y: type === 'DRONE' || type === 'DATA_BLOCK' ? Math.random() * (CANVAS_HEIGHT - 200) : CANVAS_HEIGHT - 120,
              width: type === 'TOWER' ? 60 : 50,
              height: type === 'TOWER' ? 120 : 50,
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
          const msg = WISHES[Math.floor(Math.random() * WISHES.length)];
          const isGolden = (gameMode === GameMode.STORY && levelIndex === 4);
          lettersRef.current.push({
              id: Date.now(), x: CANVAS_WIDTH + 100, y: Math.random() * (CANVAS_HEIGHT - 250) + 50,
              width: 30, height: 20, floatOffset: 0, markedForDeletion: false, message: msg, isGolden
          });
      }

      // Collisions & Updates
      obstaclesRef.current.forEach(obs => {
        obs.x -= currentSpeed * level.obstacleSpeedMultiplier * timeScale;
        if (obs.type === 'DRONE') { obs.y += Math.sin(timestamp / 500 + obs.id) * 2; }
        if (obs.x + obs.width < -100) obs.markedForDeletion = true;
        
        if (!cinematicMode && !player.isInvincible && checkCollision(player, obs)) {
          if (gameMode === GameMode.STORY && levelIndex === 4) {} 
          else {
              player.lives--; soundManager.playCrash(); player.invincibleTimer = 2.0; shakeRef.current = 20;
              createExplosion(player.x, player.y);
          }
        }
      });
      
      powerupsRef.current.forEach(pup => {
        pup.x -= currentSpeed * timeScale;
        if (checkCollision(player, pup)) {
          pup.markedForDeletion = true; applyPowerup(pup.type); soundManager.playPowerup(pup.type);
          createParticles(pup.x, pup.y, ParticleType.SPARKLE, 20, POWERUP_COLORS[pup.type]);
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
                soundManager.playCrash(); createExplosion(obs.x, obs.y); scoreRef.current += 100;
            }
        });
      });

      particlesRef.current.forEach(p => {
        p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.life -= dt; p.alpha = p.life / p.maxLife;
        if (p.type === ParticleType.SNOW) { p.y += 2 * timeScale; } // Digial rain falls down
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
      ctx.fillStyle = `linear-gradient(to bottom, ${level.backgroundGradient[0]}, ${level.backgroundGradient[1]})`;
      const grad = ctx.createLinearGradient(0,0,0,CANVAS_HEIGHT);
      grad.addColorStop(0, level.backgroundGradient[0]); grad.addColorStop(1, level.backgroundGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Grid (Cyber Floor)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.2)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < CANVAS_WIDTH; i+=40) {
          const x = (i - (distanceRef.current % 40));
          ctx.moveTo(x, CANVAS_HEIGHT); ctx.lineTo(x + 200, CANVAS_HEIGHT/2); // Perspective lines
      }
      ctx.stroke();

      // Digital Dust
      ctx.fillStyle = hudState.levelIndex === 2 ? "#22c55e" : "#cbd5e1";
      starsRef.current.forEach(s => {
          ctx.globalAlpha = Math.random() * 0.5 + 0.2;
          ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1;

      drawParallaxLayer(ctx, bgLayersRef.current[0], CANVAS_HEIGHT - 100, "#1e1b4b", timestamp);
      drawParallaxLayer(ctx, bgLayersRef.current[1], CANVAS_HEIGHT - 60, "#312e81", timestamp, bgStructuresRef.current[1]); 

      ctx.save();
      const dx = (Math.random() - 0.5) * shakeRef.current; const dy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(dx, dy);

      drawParallaxLayer(ctx, bgLayersRef.current[2], CANVAS_HEIGHT - 20, "#4338ca", timestamp, bgStructuresRef.current[2]); 

      landmarksRef.current.forEach(lm => drawLandmark(ctx, lm));
      powerupsRef.current.forEach(p => drawPowerup(ctx, p));
      lettersRef.current.forEach(l => drawLetter(ctx, l));
      obstaclesRef.current.forEach(o => drawObstacle(ctx, o));
      
      // Projectiles (Lasers)
      projectilesRef.current.forEach(p => {
          ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3; ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 20, p.y); ctx.stroke();
          ctx.shadowBlur = 0;
      });

      drawPlayer(ctx, playerRef.current);

      particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
          if (p.type === ParticleType.FIRE) { ctx.globalCompositeOperation = 'lighter'; }
          ctx.fillRect(p.x, p.y, p.radius, p.radius); // Square particles for digital feel
          ctx.globalCompositeOperation = 'source-over';
      });

      if (isLightsOutRef.current) {
         ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
         // Radar pulse around player
         ctx.strokeStyle = "rgba(34, 197, 94, 0.5)"; ctx.lineWidth = 2;
         ctx.beginPath(); ctx.arc(playerRef.current.x, playerRef.current.y, 100 + Math.sin(timestamp/100)*10, 0, Math.PI*2); ctx.stroke();
      }

      if (flashTimerRef.current > 0) {
          ctx.fillStyle = `rgba(255,255,255,${flashTimerRef.current})`; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
      }
      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, gameMode]);

  // --- Drawing & Helpers ---

  const checkCollision = (r1: Entity, r2: Entity) => (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
  
  const createParticles = (x: number, y: number, type: ParticleType, count: number, color: string) => {
      for(let i=0; i<count; i++) {
          particlesRef.current.push({
              id: Math.random(), type, x, y, radius: Math.random()*4+2,
              vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, alpha: 1, color, life: 1, maxLife: 1, growth: 0
          });
      }
  };

  const createExplosion = (x: number, y: number) => {
      createParticles(x, y, ParticleType.FIRE, 20, '#ef4444');
      createParticles(x, y, ParticleType.DEBRIS, 10, '#94a3b8');
  };

  const applyPowerup = (type: PowerupType) => {
      const p = playerRef.current;
      if (type === PowerupType.SPEED) p.speedTimer = 8;
      if (type === PowerupType.SNOWBALLS) p.snowballs += 10;
      if (type === PowerupType.BLAST) { obstaclesRef.current = []; createExplosion(CANVAS_WIDTH/2, CANVAS_HEIGHT/2); }
      if (type === PowerupType.HEALING) p.healingTimer = 5;
      if (type === PowerupType.LIFE) p.lives = Math.min(3, p.lives+1);
  };

  const drawParallaxLayer = (ctx: CanvasRenderingContext2D, layer: BackgroundLayer, baseY: number, color: string, timestamp: number, structs?: boolean[]) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT);
      for (let i = 0; i < layer.points.length - 1; i++) {
          const x = (i * 40) + layer.offset; const y = baseY + layer.points[i];
          const nextX = ((i + 1) * 40) + layer.offset; const nextY = baseY + layer.points[i+1];
          ctx.lineTo(x, y); ctx.lineTo(nextX, nextY);
      }
      ctx.lineTo(CANVAS_WIDTH + 200, CANVAS_HEIGHT); ctx.fill();
      
      if (structs) {
          for(let i=0; i<layer.points.length; i++) {
              if (structs[i]) {
                  const x = (i * 40) + layer.offset; const y = baseY + layer.points[i];
                  ctx.fillRect(x, y - 50, 20, 50); // Smokestack
                  // Blinking light
                  if (Math.sin(timestamp/200 + i) > 0) { ctx.fillStyle = "red"; ctx.fillRect(x+8, y-55, 4, 4); ctx.fillStyle = color; }
              }
          }
      }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
      ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); ctx.rotate(p.angle);
      if (p.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) { ctx.restore(); return; }
      
      // Cyber Sleigh
      ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#1e293b"; // Dark body
      ctx.beginPath(); ctx.moveTo(-35, 10); ctx.lineTo(35, 10); ctx.lineTo(25, -5); ctx.lineTo(-40, -5); ctx.fill();
      
      // Runners (Neon)
      ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-30, 15); ctx.lineTo(30, 15); ctx.stroke();
      
      // Santa (Visor)
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(2, -14, 8, 4); // Visor
      
      // Thruster
      ctx.fillStyle = "#64748b"; ctx.fillRect(-45, 0, 10, 10);
      
      ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
      ctx.save(); ctx.translate(o.x, o.y);
      if (o.type === 'PIPE') {
          ctx.fillStyle = "#3f6212"; ctx.fillRect(0, 0, o.width, o.height);
          ctx.fillStyle = "#65a30d"; ctx.fillRect(0, 0, o.width, 10); // Lip
      } else if (o.type === 'DRONE') {
          ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(o.width/2, o.height/2, 20, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "red"; ctx.shadowColor = "red"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(o.width/2, o.height/2, 8, 0, Math.PI*2); ctx.fill(); // Eye
      } else if (o.type === 'TOWER') {
          ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, o.width, o.height);
          ctx.fillStyle = "#0ea5e9"; // Neon strip
          ctx.fillRect(10, 10, 5, o.height - 20);
      } else { // TRAP / DATA_BLOCK
          ctx.fillStyle = "#b91c1c"; ctx.fillRect(0, 0, o.width, o.height);
          ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.strokeRect(5,5,o.width-10, o.height-10);
      }
      ctx.restore();
  };

  const drawPowerup = (ctx: CanvasRenderingContext2D, p: Powerup) => {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0,p.width,p.height);
      ctx.strokeStyle = POWERUP_COLORS[p.type]; ctx.lineWidth = 2; ctx.strokeRect(0,0,p.width,p.height);
      ctx.fillStyle = POWERUP_COLORS[p.type]; ctx.textAlign = "center"; ctx.font = "20px monospace";
      ctx.fillText(p.type === 'SPEED' ? '⚡' : '+', p.width/2, p.height/1.5);
      ctx.restore();
  };

  const drawLetter = (ctx: CanvasRenderingContext2D, l: Letter) => {
      ctx.save(); ctx.translate(l.x, l.y);
      ctx.fillStyle = l.isGolden ? "#facc15" : "#22c55e"; // Gold or Green Data Packet
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 5;
      ctx.fillRect(0,0,30,20);
      ctx.fillStyle = "#000"; ctx.fillRect(5,5,20,10); // Microchip look
      ctx.restore();
  };

  const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark) => {
      ctx.save(); ctx.translate(lm.x, lm.y);
      ctx.fillStyle = "#020617";
      // Huge structure silhouette
      ctx.fillRect(0, 0, lm.width, lm.height);
      if (lm.type === 'SERVER_TOWER') {
          ctx.fillStyle = "#1d4ed8";
          for(let y=20; y<lm.height; y+=40) ctx.fillRect(10, y, lm.width-20, 5);
      } else if (lm.type === 'SMOG_EMITTER') {
          ctx.fillStyle = "#166534";
          ctx.beginPath(); ctx.arc(lm.width/2, 50, 40, 0, Math.PI*2); ctx.fill();
      } else {
          ctx.fillStyle = "#dc2626"; // Core
          ctx.beginPath(); ctx.arc(lm.width/2, lm.height/2, 80, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
  };

  return (
    <div className="relative w-full h-full max-w-[1200px] max-h-[600px] mx-auto border-4 border-slate-700 shadow-2xl rounded-xl overflow-hidden bg-black">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-cover" />
      {gameState !== GameState.INTRO && !cinematicMode && !isEndingSequenceRef.current && (
        <UIOverlay 
          lives={hudState.lives} snowballs={hudState.snowballs} progress={hudState.progress} timeLeft={hudState.timeLeft}
          activePowerups={hudState.activeSpeed + hudState.activeHealing} currentLevelName={LEVELS[hudState.levelIndex].name}
          score={hudState.score} collectedPowerups={hudState.collectedPowerups} activeDialogue={hudState.activeDialogue} activeWish={hudState.activeWish}
        />
      )}
      {/* Mobile Controls */}
      <div className="absolute inset-0 flex md:hidden z-40 pointer-events-auto">
        <div className="w-1/2 h-full" onTouchStart={(e) => { e.preventDefault(); if(!isEndingSequenceRef.current) {playerRef.current.vy = JUMP_STRENGTH; soundManager.playJump();} }} />
        <div className="w-1/2 h-full" onTouchStart={(e) => { e.preventDefault(); if(!isEndingSequenceRef.current) {shootProjectile();} }} />
      </div>
    </div>
  );
};
export default GameCanvas;
