
export enum GameState {
  MENU,
  INFO,
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
  CHARGE = 'CHARGE',       // Restores Phase Energy
  REPAIR = 'REPAIR',       // Restores Hull
  DATA_CACHE = 'DATA_CACHE', // Large Score Boost
  INVULNERABILITY = 'INVULNERABILITY' // Temporary infinite phase
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
  integrity: number;    // HP
  energy: number;       // Phase Resource
  maxEnergy: number;
  isPhasing: boolean;   // The core mechanic
  phaseCooldown: number; // Small delay after phasing
  angle: number; 
  isThrusting: boolean; 
  godMode?: boolean;
  
  combo: number;
  comboTimer: number;
}

export interface Obstacle extends Entity {
  type: 'DEBRIS' | 'DRONE' | 'SERVER_TOWER' | 'ENERGY_BARRIER' | 'WATCHER';
  rotation?: number;
  scoreValue: number;
  scanned: boolean; // Has the player phased through it?
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  text: string;
  life: number;
  color: string;
}

export interface Landmark extends Entity {
  type: 'HOLO_TREE' | 'RUINED_FACTORY' | 'FROZEN_TIME_MACHINE';
  name: string;
}

export interface Powerup extends Entity {
  type: PowerupType;
  floatOffset: number;
}

export interface DataLog extends Entity {
  message: string;
  floatOffset: number;
}

export enum ParticleType {
  SPARK,     // Electric blue
  SMOKE,     // Grey/Black
  GLITCH,    // Green/Pink blocks
  THRUST,    // Engine exhaust
  DATA,      // Binary 0/1
  PHASE_RESIDUAL // Ghostly trail
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
}

export interface LevelConfig {
  name: string;
  subtext: string;
  colors: {
    sky: [string, string];
    grid: string;
    fog: string;
    aurora: string; 
  };
  obstacleSpeed: number;
  spawnRate: number;
}

export interface BackgroundLayer {
  points: number[];
  color: string;
  speedModifier: number;
  offset: number;
}

export interface DialogueLine {
  id: string;
  speaker: 'KRAMPUS' | 'SYSTEM' | 'ARCHIVE';
  text: string;
}

export type DebugCommand = 'SKIP_TO_ENDING' | 'TOGGLE_GOD_MODE' | 'INCREASE_SPEED' | 'TOGGLE_HYPER_PROGRESS' | null;
