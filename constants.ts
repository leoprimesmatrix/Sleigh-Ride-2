
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.45; // Slightly heavier sleigh
export const JUMP_STRENGTH = -8.5;
export const FLIGHT_LIFT = -0.6;
export const BASE_SPEED = 6; // Faster base speed

// Powerup Colors (Neon Palette)
export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.SPEED]: '#ef4444',     // Red Neon
  [PowerupType.SNOWBALLS]: '#06b6d4', // Cyan Neon
  [PowerupType.BLAST]: '#facc15',     // Yellow Neon
  [PowerupType.HEALING]: '#22c55e',   // Green Neon
  [PowerupType.LIFE]: '#d946ef',      // Purple Neon
};

// 5-Act Structure
export const LEVEL_THRESHOLDS = [0, 20, 50, 70, 90];

export const LEVELS: LevelConfig[] = [
  {
    name: "Sector 1: The Scrapyard", // Act I
    description: "Systems Online. Escape the disposal zone.",
    backgroundGradient: ['#3f2e18', '#78350f'], // Rusty Brown/Orange
    obstacleSpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    weatherIntensity: 1,
  },
  {
    name: "Sector 2: Smog City", // Act II
    description: "Visibility dropping. Toxic fumes detected.",
    backgroundGradient: ['#111827', '#064e3b'], // Dark Green/Black
    obstacleSpeedMultiplier: 1.2,
    spawnRateMultiplier: 1.1,
    weatherIntensity: 2,
  },
  {
    name: "Sector 3: The Data Stream", // Act III
    description: "Entering Cyber-Space. Watch for firewalls.",
    backgroundGradient: ['#020617', '#1e1b4b'], // Deep Indigo/Black
    obstacleSpeedMultiplier: 1.4,
    spawnRateMultiplier: 0.9, 
    weatherIntensity: 1, // Digital rain
  },
  {
    name: "Sector 4: The Core", // Act IV
    description: "K.R.A.M.P.U.S. is watching. Heat levels critical.",
    backgroundGradient: ['#450a0a', '#7f1d1d'], // Deep Red
    obstacleSpeedMultiplier: 1.6,
    spawnRateMultiplier: 1.5,
    weatherIntensity: 5, // Embers
  },
  {
    name: "System Reboot", // Act V
    description: "Upload Complete. Sun is rising.",
    backgroundGradient: ['#4c1d95', '#c026d3'], // Neon Purple/Pink Sunrise
    obstacleSpeedMultiplier: 0, 
    spawnRateMultiplier: 0,
    weatherIntensity: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 720; 
export const VICTORY_DISTANCE = 250000; 

// --- Narrative Content ---

export const WISHES = [
  "SYSTEM ERROR: JOY_NOT_FOUND",
  "Connection lost to: HOPE",
  "Plea: Send reinforcements.",
  "Requesting Holiday Protocol...",
  "Error 404: Spirit Missing",
  "Initiating encryption override...",
  "Signal weak. Do you copy?",
  "Bypassing logic gates..."
];

export const NARRATIVE_LETTERS = [
    { progress: 0.30, message: "Log 1: The Toy Factory stopped making toys. It makes bots now." },
    { progress: 0.60, message: "Log 2: We hid the backup drive in the North Star. You have to reach it." },
    { progress: 0.85, message: "Log 3: K.R.A.M.P.U.S. thinks logic rules the world. Show him magic." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  // Act I
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'Rudolph', text: "Thrusters at 100%. Target: The Mainframe." } },
  
  // Act II
  { progress: 0.20, dialogue: { id: 'act2_start', speaker: 'Rudolph', text: "The smog... sensors are jammed. Switch to thermal vision." } },
  { progress: 0.22, dialogue: { id: 'act2_santa', speaker: 'Santa', text: "No sensors needed. We fly by heart tonight." } },
  { progress: 0.35, dialogue: { id: 'act2_clock', speaker: 'KRAMPUS_AI', text: "INTRUDER DETECTED. DEPLOYING COUNTER-MEASURES." } },

  // Act III
  { progress: 0.50, dialogue: { id: 'act3_start', speaker: 'Rudolph', text: "We've breached the Data Stream! Physical laws are unstable here!" } },
  { progress: 0.55, dialogue: { id: 'act3_santa', speaker: 'Santa', text: "Steady. Magic is the original source code." } },

  // Act IV
  { progress: 0.70, dialogue: { id: 'act4_start', speaker: 'KRAMPUS_AI', text: "TERMINATION IMMINENT. HOLIDAY PROTOCOL DELETED." } },
  { progress: 0.75, dialogue: { id: 'act4_santa', speaker: 'Santa', text: "Not deleted. Just rebooting. NOW!" } },

  // Act V
  { progress: 0.90, dialogue: { id: 'act5_start', speaker: 'Rudolph', text: "Shields critical... wait... the firewall is down!" } },
  { progress: 0.92, dialogue: { id: 'act5_santa', speaker: 'Santa', text: "System restored. Merry Christmas, you rust bucket." } }
];

export const LANDMARKS = [
    { progress: 0.35, type: 'SMOG_EMITTER', name: "Smog Generator Alpha" },
    { progress: 0.55, type: 'SERVER_TOWER', name: "The Firewall" },
    { progress: 0.99, type: 'MAIN_HUB', name: "Central Processor" }
] as const;
