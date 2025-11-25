
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;

// New Physics for "Hover/Thrust" feel
export const GRAVITY = 0.25; 
export const THRUST_POWER = -0.55; 
export const MAX_FALL_SPEED = 8;
export const BASE_SPEED = 9; 

export const EMP_COST = 20; // Cost of one pulse
export const EMP_RADIUS = 250;
export const ENERGY_RECHARGE_RATE = 0.1; // Passive recharge

export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.CHARGE]: '#0ea5e9',    // Sky Blue (Energy)
  [PowerupType.REPAIR]: '#22c55e',    // Green (Health)
  [PowerupType.OVERCLOCK]: '#f59e0b', // Amber (Speed)
  [PowerupType.SHIELD]: '#a855f7',    // Purple (Shield)
};

export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 96];

export const LEVELS: LevelConfig[] = [
  {
    name: "SECTOR 01", 
    subtext: "THE DEAD NETWORK",
    colors: { sky: ['#020617', '#0f172a'], grid: '#1e293b', fog: 'rgba(15, 23, 42, 0.8)' },
    obstacleSpeed: 1.0,
    spawnRate: 1.0,
  },
  {
    name: "SECTOR 02", 
    subtext: "BIOME DECAY",
    colors: { sky: ['#0c0a09', '#1c1917'], grid: '#292524', fog: 'rgba(28, 25, 23, 0.8)' },
    obstacleSpeed: 1.2,
    spawnRate: 1.2,
  },
  {
    name: "SECTOR 03", 
    subtext: "FABRICATION PLANT",
    colors: { sky: ['#2a0a0a', '#450a0a'], grid: '#571c1c', fog: 'rgba(69, 10, 10, 0.8)' },
    obstacleSpeed: 1.4,
    spawnRate: 1.3, 
  },
  {
    name: "SECTOR 04", 
    subtext: "THE ZERO POINT",
    colors: { sky: ['#0f172a', '#334155'], grid: '#94a3b8', fog: 'rgba(51, 65, 85, 0.8)' },
    obstacleSpeed: 1.6,
    spawnRate: 1.5,
  },
  {
    name: "CHRONOS", 
    subtext: "TEMPORAL GATE",
    colors: { sky: ['#000000', '#000000'], grid: '#ffffff', fog: 'rgba(0,0,0,0)' },
    obstacleSpeed: 0, 
    spawnRate: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 600; 
export const VICTORY_DISTANCE = 350000; 

// --- Narrative Content ---

export const DATA_LOGS = [
  "LOG 0492: 'Solar flares destroyed the grid...'",
  "LOG 1102: 'Does anyone remember the Red Man?'",
  "LOG 2931: 'Energy signature detected North...'",
  "LOG 4401: 'The gift fabrication units are rusting.'"
];

export const NARRATIVE_FRAGMENTS = [
    { progress: 0.15, message: "Krampus: This tech... it's older than the city." },
    { progress: 0.45, message: "Krampus: Why protect this path? What lies at the end?" },
    { progress: 0.85, message: "Krampus: The signal is deafening here." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "Systems online. Scavenger Unit 01 active. Locating source." } },
  { progress: 0.10, dialogue: { id: 'act1_sys', speaker: 'SYSTEM', text: "WARNING: UNAUTHORIZED SECTOR. DEPLOYING DRONES." } },
  
  { progress: 0.30, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "The forest... it's holographic? No... hard light projections." } },
  
  { progress: 0.55, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "This factory. It produced billions of units. Now silent." } },
  { progress: 0.65, dialogue: { id: 'act3_sys', speaker: 'SYSTEM', text: "ERROR: MAINFRAME 'SANTA' NOT FOUND. LAST LOGIN: 842 YEARS AGO." } },

  { progress: 0.80, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "The ice preserves everything. Even memories." } },

  { progress: 0.96, dialogue: { id: 'act5_start', speaker: 'SYSTEM', text: "TEMPORAL ANOMALY DETECTED. CHRONOS PROTOCOL ENGAGED." } },
];

export const LANDMARKS = [
    { progress: 0.35, type: 'HOLO_TREE', name: "Project: Evergreen" },
    { progress: 0.60, type: 'RUINED_FACTORY', name: "Sector 12: Workshop" },
    { progress: 0.99, type: 'CHRONOS_RING', name: "The Time Machine" }
] as const;
