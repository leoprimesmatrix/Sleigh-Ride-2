
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;

// Physics & Movement
export const GRAVITY = 0.25; 
export const THRUST_POWER = -0.55; 
export const MAX_FALL_SPEED = 9;
export const BASE_SPEED = 10; 

// Phase Mechanic Constants
export const PHASE_DRAIN_RATE = 40; // Energy drained per second while phasing
export const PHASE_RECHARGE_RATE = 15; // Energy restored per second while NOT phasing
export const PHASE_MIN_ACTIVATION = 10; // Min energy needed to start phasing
export const PHASE_SCAN_REWARD = 20; // Increased reward for aggressive play

export const COMBO_DECAY = 3.0; 

export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.CHARGE]: '#00f3ff',    // Electric Cyan
  [PowerupType.REPAIR]: '#00ff41',    // Neon Green
  [PowerupType.DATA_CACHE]: '#facc15', // Gold
  [PowerupType.INVULNERABILITY]: '#bc13fe', // Purple
};

// Significantly shortened level thresholds for tighter pacing
export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 96];

export const LEVELS: LevelConfig[] = [
  {
    name: "SECTOR 01", 
    subtext: "FORGOTTEN PERIMETER",
    colors: { 
      sky: ['#00020a', '#000814'], 
      grid: '#00f3ff', 
      fog: 'rgba(0, 243, 255, 0.1)', 
      aurora: '#0047ff' 
    },
    obstacleSpeed: 1.0,
    spawnRate: 1.0,
    allowedObstacles: ['DEBRIS'] // Warmup
  },
  {
    name: "SECTOR 02", 
    subtext: "DATA GRAVEYARD",
    colors: { 
      sky: ['#0a0014', '#1a0029'], 
      grid: '#bc13fe', 
      fog: 'rgba(188, 19, 254, 0.2)',
      aurora: '#ff00ff' 
    },
    obstacleSpeed: 1.2,
    spawnRate: 1.3,
    allowedObstacles: ['DEBRIS', 'WATCHER'] // Intro to tracking enemies
  },
  {
    name: "SECTOR 03", 
    subtext: "OLD WORLD RUINS",
    colors: { 
      sky: ['#0f172a', '#1e293b'], 
      grid: '#94a3b8', 
      fog: 'rgba(148, 163, 184, 0.2)',
      aurora: '#ffffff'
    },
    obstacleSpeed: 1.4,
    spawnRate: 1.5,
    allowedObstacles: ['DRONE', 'SERVER_TOWER'] // Moving targets & Walls
  },
  {
    name: "SECTOR 04", 
    subtext: "THE SILENT CORE",
    colors: { 
      sky: ['#000000', '#020617'], 
      grid: '#ef4444', 
      fog: 'rgba(239, 68, 68, 0.1)',
      aurora: '#ef4444' 
    },
    obstacleSpeed: 1.6,
    spawnRate: 1.8,
    allowedObstacles: ['ENERGY_BARRIER', 'WATCHER'] // High intensity phase gates
  },
  {
    name: "ZERO POINT", 
    subtext: "CHRONOS FIELD",
    colors: { 
      sky: ['#ffffff', '#e2e8f0'], 
      grid: '#000000', 
      fog: 'rgba(255,255,255,0.8)',
      aurora: '#00f3ff'
    },
    obstacleSpeed: 0, 
    spawnRate: 0,
    allowedObstacles: []
  }
];

export const TOTAL_GAME_TIME_SECONDS = 9999; 
export const VICTORY_DISTANCE = 100000; // Drastically reduced for shorter session (was 350k)

// --- Narrative Content ---

export const DATA_LOGS = [
  "LOG 2940: 'History deleted. The Red Saint is gone.'",
  "LOG 2855: 'He said he had to find his purpose. He left.'",
  "LOG 2600: 'The children stopped believing. The magic faded.'",
  "LOG 2500: 'Christmas wasn't cancelled. It was forgotten.'"
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  { progress: 0.05, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "The signal leads here. The place where the Legend ended." } },
  { progress: 0.15, dialogue: { id: 'act1_sys', speaker: 'ARCHIVE', text: "ERROR: FILE 'SANTA_CLAUS' CORRUPTED. REFERENCE NOT FOUND." } },
  
  { progress: 0.35, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "Why did you leave? You saved us once. Why not stay?" } },
  { progress: 0.45, dialogue: { id: 'act2_lore', speaker: 'ARCHIVE', text: "RECORD: 'SUBJECT 4'. STATUS: DEPARTED. DESTINATION: UNKNOWN." } },
  
  { progress: 0.60, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "He didn't just leave. He ascended. He let go of the burden." } },
  { progress: 0.70, dialogue: { id: 'act3_sys', speaker: 'ARCHIVE', text: "WARNING: CHRONAL INSTABILITY DETECTED. TIME IS LOOPING." } },

  { progress: 0.85, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "If he is gone... then I must know the truth of what came before." } },

  { progress: 0.96, dialogue: { id: 'act5_start', speaker: 'SYSTEM', text: "VISUAL CONFIRMATION. OBJECT: THE CHRONOS ENGINE." } },
];

export const LANDMARKS = [
    { progress: 0.30, type: 'HOLO_TREE', name: "Simulacrum: Evergreen" },
    { progress: 0.55, type: 'RUINED_FACTORY', name: "The Workshop Ruins" },
    { progress: 0.99, type: 'FROZEN_TIME_MACHINE', name: "The Chronos Engine" }
] as const;
