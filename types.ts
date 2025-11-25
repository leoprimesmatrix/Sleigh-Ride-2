
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
  SPEED = 'SPEED',         // Red (Overclock)
  SNOWBALLS = 'SNOWBALLS', // Cyan (Plasma)
  BLAST = 'BLAST',         // Gold (EMP)
  HEALING = 'HEALING',     // Green (Repair)
  LIFE = 'LIFE'            // Pink (Backup Battery)
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
  // New Sci-Fi Types
  type: 'PIPE' | 'DRONE' | 'TRAP' | 'TOWER' | 'DATA_BLOCK';
  rotation?: number; 
}

export interface Landmark extends Entity {
  // New Landmarks
  type: 'FACTORY_GATE' | 'SMOG_EMITTER' | 'SERVER_TOWER' | 'CORE_REACTOR' | 'MAIN_HUB';
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
  SNOW,      // Now Digital Rain / Ash
  SPARKLE,   // Electric Sparks
  DEBRIS,    // Metal parts
  SMOKE,     // Smog
  GLOW,      // Neon Glow
  SHOCKWAVE,
  FIRE,      // Jet exhaust
  LIFE
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
  speaker: 'Santa' | 'Rudolph' | 'KRAMPUS_AI';
  text: string;
}
