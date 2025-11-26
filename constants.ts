
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;

// Physics & Movement
export const GRAVITY = 0.25; 
export const THRUST_POWER = -0.55; 
export const MAX_FALL_SPEED = 9;
export const BASE_SPEED = 10; 

// Combat Constants
export const PROJECTILE_SPEED = 18;
export const ENEMY_PROJECTILE_SPEED = 8;
export const FIRE_RATE_DEFAULT = 12; // Frames between shots
export const FIRE_RATE_OVERCLOCK = 5;
export const DASH_COST = 35; // Cost to dash
export const DASH_DURATION = 0.4; // Seconds
export const DASH_SPEED_MULT = 2.5;

export const EMP_COST = 50; 
export const EMP_RADIUS = 350;
export const ENERGY_RECHARGE_RATE = 0.15; // Faster recharge to encourage dashing

export const COMBO_DECAY = 2.5; // Seconds before combo drops

export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.CHARGE]: '#00f3ff',    // Electric Cyan
  [PowerupType.REPAIR]: '#00ff41',    // Neon Green
  [PowerupType.OVERCLOCK]: '#ff0040', // Red/Pink (Now Fire Rate)
  [PowerupType.SHIELD]: '#bc13fe',    // Neon Purple
  [PowerupType.GOD_MODE]: '#ffd700',  // Gold
};

export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 96];

export const LEVELS: LevelConfig[] = [
  {
    name: "SECTOR 01", 
    subtext: "NEON WASTELANDS",
    colors: { 
      sky: ['#00020a', '#000814'], 
      grid: '#00f3ff', 
      fog: 'rgba(0, 243, 255, 0.2)', 
      aurora: '#0047ff' 
    },
    obstacleSpeed: 1.0,
    spawnRate: 1.0,
  },
  {
    name: "SECTOR 02", 
    subtext: "SYNTHWAVE CITY",
    colors: { 
      sky: ['#0a0014', '#1a0029'], 
      grid: '#bc13fe', 
      fog: 'rgba(188, 19, 254, 0.3)',
      aurora: '#ff00ff' 
    },
    obstacleSpeed: 1.2,
    spawnRate: 1.2,
  },
  {
    name: "SECTOR 03", 
    subtext: "INDUSTRIAL CORE",
    colors: { 
      sky: ['#140000', '#290000'], 
      grid: '#ff3d00', 
      fog: 'rgba(255, 61, 0, 0.2)',
      aurora: '#ff9100'
    },
    obstacleSpeed: 1.4,
    spawnRate: 1.4, 
  },
  {
    name: "SECTOR 04", 
    subtext: "THE MATRIX VOID",
    colors: { 
      sky: ['#001405', '#00290a'], 
      grid: '#00ff41', 
      fog: 'rgba(0, 255, 65, 0.2)',
      aurora: '#00ff9d' 
    },
    obstacleSpeed: 1.6,
    spawnRate: 1.6,
  },
  {
    name: "CHRONOS", 
    subtext: "TEMPORAL GATE",
    colors: { 
      sky: ['#000000', '#ffffff'], 
      grid: '#ffffff', 
      fog: 'rgba(255,255,255,0.4)',
      aurora: '#00f3ff'
    },
    obstacleSpeed: 0, 
    spawnRate: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 9999; // Essentially endless until distance reached
export const VICTORY_DISTANCE = 350000; 

// --- Narrative Content ---

export const DATA_LOGS = [
  "LOG 0492: 'Target practice active.'",
  "LOG 1102: 'They built the drones to hunt us.'",
  "LOG 2931: 'Phase tech allows matter passthrough.'",
  "LOG 4401: 'Santa was a warrior king once.'"
];

export const NARRATIVE_FRAGMENTS = [
    { progress: 0.15, message: "Krampus: Defense grids active. Engaging." },
    { progress: 0.45, message: "Krampus: They are trying to slow me down." },
    { progress: 0.85, message: "Krampus: Almost at the source." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "Weapons systems online. Phase Dash ready. Let's ride." } },
  { progress: 0.10, dialogue: { id: 'act1_sys', speaker: 'SYSTEM', text: "THREAT DETECTED. DEPLOYING HUNTER KILLERS." } },
  
  { progress: 0.30, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "Holographic forests... decent cover for a firefight." } },
  
  { progress: 0.55, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "Found the factory. It's churning out war machines." } },
  { progress: 0.65, dialogue: { id: 'act3_sys', speaker: 'SYSTEM', text: "LETHAL FORCE AUTHORIZED." } },

  { progress: 0.80, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "Nothing stops the signal. Nothing stops me." } },

  { progress: 0.96, dialogue: { id: 'act5_start', speaker: 'SYSTEM', text: "CRITICAL ERROR. TIMELINE COLLAPSE IMMINENT." } },
];

export const LANDMARKS = [
    { progress: 0.35, type: 'HOLO_TREE', name: "Project: Evergreen" },
    { progress: 0.60, type: 'RUINED_FACTORY', name: "Sector 12: Workshop" },
    { progress: 0.99, type: 'CHRONOS_RING', name: "The Time Machine" }
] as const;
