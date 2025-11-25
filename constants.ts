import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.45; 
export const JUMP_STRENGTH = -8.5;
export const FLIGHT_LIFT = -0.6;
export const BASE_SPEED = 8; 

// Desolate/Ancient Palette
export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.SPEED]: '#cbd5e1',     // Pale Silver
  [PowerupType.SNOWBALLS]: '#93c5fd', // Spirit Blue
  [PowerupType.BLAST]: '#fde047',     // Lantern Yellow
  [PowerupType.HEALING]: '#86efac',   // Pale Green
  [PowerupType.LIFE]: '#fda4af',      // Fading Red
};

export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 95];

export const LEVELS: LevelConfig[] = [
  {
    name: "The Silent Cities", 
    description: "Where the lights went out centuries ago.",
    backgroundGradient: ['#0f172a', '#334155'], // Dark Slate to Grey
    obstacleSpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    weatherIntensity: 1,
  },
  {
    name: "The Whispering Woods", 
    description: "Nature has reclaimed the path.",
    backgroundGradient: ['#022c22', '#14532d'], // Deep Swamp Green
    obstacleSpeedMultiplier: 1.2,
    spawnRateMultiplier: 1.1,
    weatherIntensity: 2,
  },
  {
    name: "The Ruined Workshop", 
    description: "Halls of rust and silence.",
    backgroundGradient: ['#451a03', '#78350f'], // Rust/Iron
    obstacleSpeedMultiplier: 1.4,
    spawnRateMultiplier: 1.3, 
    weatherIntensity: 1, 
  },
  {
    name: "The Frozen Throne", 
    description: "The center of the anomaly.",
    backgroundGradient: ['#1e293b', '#94a3b8'], // Cold Blue-Grey
    obstacleSpeedMultiplier: 1.6,
    spawnRateMultiplier: 1.5,
    weatherIntensity: 3, 
  },
  {
    name: "Chronos Chamber", 
    description: "The beginning of the end.",
    backgroundGradient: ['#000000', '#1e1b4b'], // Void to Deep Indigo
    obstacleSpeedMultiplier: 0, 
    spawnRateMultiplier: 0,
    weatherIntensity: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 720; 
export const VICTORY_DISTANCE = 300000; 

// --- Narrative Content ---

export const ARTIFACTS = [
  "ITEM: A Rusted Bell",
  "ITEM: Tatters of Red Cloth",
  "LOG: 'Efficiency Protocol 7'",
  "ITEM: A Child's Drawing (Faded)",
  "LOG: 'Subject: Santa. Status: Departed'"
];

export const NARRATIVE_LETTERS = [
    { progress: 0.20, message: "Krampus: The city... it remembers nothing. Just cold metal." },
    { progress: 0.50, message: "Krampus: These machines... they were made to build toys? Why?" },
    { progress: 0.80, message: "Krampus: I feel... a warmth. A memory not my own." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  // Act I - The City
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'KRAMPUS', text: "The legend says he vanished here. I must know why." } },
  { progress: 0.10, dialogue: { id: 'act1_echo', speaker: 'ECHO', text: "Systems... failing... Belief levels... critical..." } },
  
  // Act II - The Woods
  { progress: 0.25, dialogue: { id: 'act2_start', speaker: 'KRAMPUS', text: "Statues of beasts... Reindeer? They look like guardians." } },
  
  // Act III - The Workshop
  { progress: 0.50, dialogue: { id: 'act3_start', speaker: 'KRAMPUS', text: "The Great Forge. Cold. Dead. Did he abandon them?" } },
  { progress: 0.60, dialogue: { id: 'act3_sys', speaker: 'ARCHIVE_SYSTEM', text: "ERROR: PURPOSE NOT FOUND. INITIATING SHUTDOWN." } },

  // Act IV - The Throne
  { progress: 0.75, dialogue: { id: 'act4_start', speaker: 'KRAMPUS', text: "The storm is strongest here. The heart of the world." } },
  { progress: 0.85, dialogue: { id: 'act4_rev', speaker: 'KRAMPUS', text: "He didn't die. He left. He chose to fade away." } },

  // Act V - The Machine
  { progress: 0.95, dialogue: { id: 'act5_start', speaker: 'ARCHIVE_SYSTEM', text: "TEMPORAL ENGINE DETECTED. AWAITING INPUT." } },
  { progress: 0.98, dialogue: { id: 'act5_end', speaker: 'KRAMPUS', text: "I understand now. To save it... we must go back to the start." } }
];

export const LANDMARKS = [
    { progress: 0.35, type: 'REINDEER_STATUE', name: "The Forgotten Guide" },
    { progress: 0.60, type: 'FACTORY_RUINS', name: "The Great Forge" },
    { progress: 0.99, type: 'CHRONOS_MACHINE', name: "The Time Engine" }
] as const;