
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;

// Physics & Movement
export const GRAVITY = 0.25; 
export const THRUST_POWER = -0.55; 
export const MAX_FALL_SPEED = 9;
export const BASE_SPEED = 10; 

// Spirit Mechanic Constants (Rebranded Phase)
export const PHASE_DRAIN_RATE = 40; 
export const PHASE_RECHARGE_RATE = 15; 
export const PHASE_MIN_ACTIVATION = 10; 
export const PHASE_SCAN_REWARD = 20; 

export const COMBO_DECAY = 3.0; 

export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.CHARGE]: '#60a5fa',    // Ice Blue
  [PowerupType.REPAIR]: '#10b981',    // Emerald
  [PowerupType.MEMORY]: '#facc15',    // Gold
  [PowerupType.INVULNERABILITY]: '#f472b6', // Pink/Magic
};

export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 96];

export const LEVELS: LevelConfig[] = [
  {
    name: "THE WHISPERING WOODS", 
    subtext: "WHERE THE TREES FORGOT THEIR LIGHTS",
    colors: { 
      sky: ['#0f172a', '#1e293b'], // Dark Slate
      ground: '#334155', 
      fog: 'rgba(51, 65, 85, 0.4)', 
      aurora: '#10b981' // Green Aurora
    },
    obstacleSpeed: 1.0,
    spawnRate: 1.0,
    allowedObstacles: ['RUSTED_PINE'] 
  },
  {
    name: "THE RUSTY TOY-YARDS", 
    subtext: "GRAVEYARD OF UNGIVEN GIFTS",
    colors: { 
      sky: ['#2a1b1b', '#451a03'], // Rusty Red/Brown
      ground: '#78350f', 
      fog: 'rgba(120, 53, 15, 0.3)',
      aurora: '#f59e0b' // Gold Aurora
    },
    obstacleSpeed: 1.2,
    spawnRate: 1.3,
    allowedObstacles: ['RUSTED_PINE', 'CORRUPTED_ELF']
  },
  {
    name: "THE GLACIER WALL", 
    subtext: "THE BARRIER TO THE NORTH",
    colors: { 
      sky: ['#172554', '#1e3a8a'], // Deep Blue
      ground: '#bfdbfe', 
      fog: 'rgba(191, 219, 254, 0.3)',
      aurora: '#ffffff'
    },
    obstacleSpeed: 1.4,
    spawnRate: 1.5,
    allowedObstacles: ['ICE_SHARD', 'FROST_WALL'] 
  },
  {
    name: "THE VOID POLE", 
    subtext: "THE CENTER OF SILENCE",
    colors: { 
      sky: ['#020617', '#000000'], 
      ground: '#60a5fa', 
      fog: 'rgba(96, 165, 250, 0.2)',
      aurora: '#f472b6' // Magic Pink/Purple
    },
    obstacleSpeed: 1.6,
    spawnRate: 1.8,
    allowedObstacles: ['WATCHER_EYE', 'FROST_WALL']
  },
  {
    name: "ZERO POINT", 
    subtext: "THE CHRONOS ENGINE",
    colors: { 
      sky: ['#ffffff', '#e2e8f0'], 
      ground: '#000000', 
      fog: 'rgba(255,255,255,0.8)',
      aurora: '#00f3ff'
    },
    obstacleSpeed: 0, 
    spawnRate: 0,
    allowedObstacles: []
  }
];

export const TOTAL_GAME_TIME_SECONDS = 9999; 
export const VICTORY_DISTANCE = 100000; 

// --- Narrative Content ---

export const DATA_LOGS = [
  "ECHO: 'The bells stopped ringing in 2024. Why?'",
  "ECHO: 'He didn't die. He just... faded.'",
  "ECHO: 'Belief was the fuel. When it ran out, so did we.'",
  "ECHO: 'I am the shadow. He was the light. Where is the light?'"
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  { progress: 0.05, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "This sleigh... it feels heavy. Laden with ghosts." } },
  { progress: 0.15, dialogue: { id: 'act1_sys', speaker: 'ECHO', text: "DETECTED: SOUL SIGNATURE 'KRAMPUS'. WELCOME BACK, PUNISHER." } },
  
  { progress: 0.35, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "Old Friend? Are you here? The workshop is... bone." } },
  { progress: 0.45, dialogue: { id: 'act2_lore', speaker: 'ECHO', text: "ARCHIVE: THE RED SAINT DEPARTED. DESTINATION: YESTERDAY." } },
  
  { progress: 0.60, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "He didn't abandon us. He went back to fix it." } },
  { progress: 0.70, dialogue: { id: 'act3_sys', speaker: 'ECHO', text: "WARNING: TEMPORAL SNOWSTORM. TIME IS FRACTURING." } },

  { progress: 0.85, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "I see it now. The Engine. The Last Gift." } },

  { progress: 0.96, dialogue: { id: 'act5_start', speaker: 'ECHO', text: "VISUAL CONFIRMATION. OBJECT: THE CHRONOS SNOWFLAKE." } },
];

export const LANDMARKS = [
    { progress: 0.30, type: 'GIANT_TREE', name: "The Petrified Evergreen" },
    { progress: 0.55, type: 'RUINED_WORKSHOP', name: "Workshop Sector 7" },
    { progress: 0.99, type: 'CHRONOS_SNOWFLAKE', name: "The Chronos Snowflake" }
] as const;