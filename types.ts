export enum GameState {
  MENU,
  HELP,
  INTRO,
  PLAYING,
  GAME_OVER,
  VICTORY
}

export enum GameMode {
  STORY,
  ENDLESS
}

export enum PowerupType {
  SPEED = 'SPEED',         // Aether Wind
  SNOWBALLS = 'SNOWBALLS', // Spirit Orbs
  BLAST = 'BLAST',         // Echo Blast
  HEALING = 'HEALING',     // Mending Light
  LIFE = 'LIFE'            // Resolve
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  markedForDeletion: boolean;
}

export interface Player extends Entity {
  vy: number;
  lives: number;
  snowballs: number;
  isInvincible: boolean;
  invincibleTimer: number;
  healingTimer: number;
  speedTimer: number;
  angle: number; 
}

export interface Obstacle extends Entity {
  type: 'RUIN_PILLAR' | 'RUSTED_DRONE' | 'FROZEN_BEAM' | 'ANCIENT_TREE';
  rotation?: number; 
}

export interface Landmark extends Entity {
  type: 'SILENT_SKYSCRAPER' | 'REINDEER_STATUE' | 'FACTORY_RUINS' | 'CHRONOS_MACHINE';
  name: string;
}

export interface Powerup extends Entity {
  type: PowerupType;
  floatOffset: number;
}

export interface Letter extends Entity {
  message: string;
  floatOffset: number;
  isGolden?: boolean; 
}

export interface Projectile extends Entity {
  vx: number;
  trail: {x: number, y: number}[]; 
}

export enum ParticleType {
  ASH,       // Grey snow
  EMBER,     // Fire from lantern
  DUST,      // Impact
  SPIRIT,    // Blue magic
  GLOW
}

export interface Particle {
  id: number;
  type: ParticleType;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  growth: number; 
}

export interface LevelConfig {
  name: string;
  description: string;
  backgroundGradient: [string, string];
  obstacleSpeedMultiplier: number;
  spawnRateMultiplier: number;
  weatherIntensity: number;
}

export interface BackgroundLayer {
  points: number[];
  color: string;
  speedModifier: number;
  offset: number;
}

export interface DialogueLine {
  id: string;
  speaker: 'KRAMPUS' | 'ARCHIVE_SYSTEM' | 'ECHO';
  text: string;
}