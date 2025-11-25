
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
  CHARGE = 'CHARGE',       // Restores Energy
  REPAIR = 'REPAIR',       // Restores Hull
  OVERCLOCK = 'OVERCLOCK', // Speed Boost
  SHIELD = 'SHIELD'        // Invincibility
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
  integrity: number;    // Was Lives
  energy: number;       // Was Snowballs (0-100)
  maxEnergy: number;
  isShielded: boolean;
  shieldTimer: number;
  overclockTimer: number; // Speed
  angle: number; 
  isThrusting: boolean; // Visual state
}

export interface Obstacle extends Entity {
  type: 'DEBRIS' | 'DRONE' | 'SERVER_TOWER' | 'ENERGY_BARRIER';
  isDisabled: boolean; // If hit by EMP
  rotation?: number; 
}

export interface Landmark extends Entity {
  type: 'HOLO_TREE' | 'RUINED_FACTORY' | 'CHRONOS_RING';
  name: string;
}

export interface Powerup extends Entity {
  type: PowerupType;
  floatOffset: number;
}

export interface DataLog extends Entity {
  message: string;
  floatOffset: number;
  isCoreMemory?: boolean; 
}

// Replaces Projectile - Area of Effect
export interface EMPBurst {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  markedForDeletion: boolean;
}

export enum ParticleType {
  SPARK,     // Electric blue
  SMOKE,     // Grey/Black
  GLITCH,    // Green/Pink blocks
  THRUST,    // Engine exhaust
  DATA       // Binary 0/1
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
    aurora: string; // Added for visual flair
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
  speaker: 'KRAMPUS' | 'SYSTEM' | 'UNKNOWN';
  text: string;
}
