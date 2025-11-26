
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
export const PHASE_SCAN_REWARD = 15; // Energy restored when phasing through obstacle

export const COMBO_DECAY = 3.0; 

export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.CHARGE]: '#00f3ff',    // Electric Cyan
  [PowerupType.REPAIR]: '#00ff41',    // Neon Green
  [PowerupType.DATA_CACHE]: '#facc15', // Gold
  [PowerupType.INVULNERABILITY]: '#bc13fe', // Purple
};

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
    spawnRate: 1.2,
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
  }
];

export const TOTAL_GAME_TIME_SECONDS = 9999; 
export const VICTORY_DISTANCE = 350000; 

// --- Narrative Content ---

export const DATA_LOGS = [
  "FRAG 001: 'Subject 4: The Departure. He chose to leave.'",
  "FRAG 024: 'The spell of forgetting was absolute.'",
  "FRAG 109: 'Gifts were not the purpose. The burden was.'",
  "FRAG 332: 'They say he found peace in the void.'"
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "The signal is faint. A ghost frequency from centuries ago." } },
  { progress: 0.10, dialogue: { id: 'act1_sys', speaker: 'ARCHIVE', text: "WARNING: HISTORY FILE CORRUPTED. ACCESSING BACKUPS." } },
  
  { progress: 0.30, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "Holographic forests... ancient data suggests these were once real trees." } },
  { progress: 0.40, dialogue: { id: 'act2_lore', speaker: 'ARCHIVE', text: "QUERY: 'CHRISTMAS'. RESULT: MYTHOLOGICAL EVENT. STATUS: DELETED." } },
  
  { progress: 0.55, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "We are getting closer. The architecture here... it's from His era." } },
  { progress: 0.65, dialogue: { id: 'act3_sys', speaker: 'ARCHIVE', text: "DETECTING CHRONAL DISPLACEMENT. TIME IS UNSTABLE HERE." } },

  { progress: 0.80, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "He didn't die. He ascended. He left us to find our own way." } },

  { progress: 0.96, dialogue: { id: 'act5_start', speaker: 'SYSTEM', text: "PROXIMITY ALERT. ZERO POINT DETECTED." } },
];

export const LANDMARKS = [
    { progress: 0.35, type: 'HOLO_TREE', name: "Simulacrum: Evergreen" },
    { progress: 0.60, type: 'RUINED_FACTORY', name: "The Workshop Ruins" },
    { progress: 0.99, type: 'FROZEN_TIME_MACHINE', name: "The Chronos Engine" }
] as const;
