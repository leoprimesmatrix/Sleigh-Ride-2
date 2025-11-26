
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
  CHARGE = 'CHARGE',       // Restores Spirit
  REPAIR = 'REPAIR',       // Restores Sleigh Hull
  MEMORY = 'MEMORY',       // Score Boost
  INVULNERABILITY = 'INVULNERABILITY' // Eternal Spirit
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
  energy: number;       // Spirit Energy
  maxEnergy: number;
  isPhasing: boolean;   // "Spirit Form"
  phaseCooldown: number;
  angle: number; 
  isThrusting: boolean; 
  godMode?: boolean;
  
  combo: number;
  comboTimer: number;
}

export type ObstacleType = 'ICE_SHARD' | 'CORRUPTED_ELF' | 'RUSTED_PINE' | 'FROST_WALL' | 'WATCHER_EYE';

export interface Obstacle extends Entity {
  type: ObstacleType;
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
  type: 'GIANT_TREE' | 'RUINED_WORKSHOP' | 'CHRONOS_SNOWFLAKE';
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
  SPARK,      // Magic sparks
  SNOW,       // Background snow
  GLOW,       // Soft light
  THRUST,     // Magic exhaust
  RUNE,       // Magical symbols
  SPIRIT_TRAIL // Blue trail
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
    ground: string;
    fog: string;
    aurora: string; 
  };
  obstacleSpeed: number;
  spawnRate: number;
  allowedObstacles: ObstacleType[];
}

export interface BackgroundLayer {
  points: {height: number, type: number}[];
  color: string;
  speedModifier: number;
  offset: number;
}

export interface DialogueLine {
  id: string;
  speaker: 'KRAMPUS' | 'ECHO' | 'RED_SAINT';
  text: string;
}

export type DebugCommand = 'SKIP_TO_ENDING' | 'TOGGLE_GOD_MODE' | 'INCREASE_SPEED' | 'TOGGLE_HYPER_PROGRESS' | null;