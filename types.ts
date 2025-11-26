
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
  OVERCLOCK = 'OVERCLOCK', // Fire Rate Boost
  SHIELD = 'SHIELD',        // Invincibility
  GOD_MODE = 'GOD_MODE'    // Debug only
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
  energy: number;       // Dash Resource
  maxEnergy: number;
  isShielded: boolean;
  shieldTimer: number;
  overclockTimer: number; // Rapid Fire
  angle: number; 
  isThrusting: boolean; 
  isDashing: boolean;   // New: Phase Dash state
  dashTimer: number;
  godMode?: boolean;
  
  // Combat stats
  weaponCooldown: number;
  combo: number;
  comboTimer: number;
}

export interface Obstacle extends Entity {
  type: 'DEBRIS' | 'DRONE' | 'SERVER_TOWER' | 'ENERGY_BARRIER' | 'HUNTER';
  isDisabled: boolean; 
  rotation?: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  canShoot: boolean;
  shootCooldown?: number;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  isEnemy: boolean;
  damage: number;
  color: string;
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
  DATA,      // Binary 0/1
  EXPLOSION  // Orange/Red
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
  speaker: 'KRAMPUS' | 'SYSTEM' | 'UNKNOWN';
  text: string;
}

export type DebugCommand = 'SKIP_TO_ENDING' | 'TOGGLE_GOD_MODE' | 'INCREASE_SPEED' | 'TOGGLE_HYPER_PROGRESS' | null;
