import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.45; 
export const JUMP_STRENGTH = -8.5;
export const FLIGHT_LIFT = -0.6;
export const BASE_SPEED = 8; // Faster, spin-off is more action-oriented

// Powerup Colors (Neon Palette)
export const POWERUP_COLORS: Record<PowerupType, string> = {
  [PowerupType.SPEED]: '#f472b6',     // Pink Neon
  [PowerupType.SNOWBALLS]: '#22d3ee', // Cyan Neon
  [PowerupType.BLAST]: '#facc15',     // Gold Neon
  [PowerupType.HEALING]: '#4ade80',   // Green Neon
  [PowerupType.LIFE]: '#c084fc',      // Violet Neon
};

// 5-Act Structure
export const LEVEL_THRESHOLDS = [0, 25, 50, 75, 95];

export const LEVELS: LevelConfig[] = [
  {
    name: "Sector 7: The Perimeter", 
    description: "Infiltration started. Avoid detection.",
    backgroundGradient: ['#0f172a', '#0f172a'], // Stealth Black/Blue
    obstacleSpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    weatherIntensity: 1,
  },
  {
    name: "Sector 5: Logic Gates", 
    description: "Processing speed increasing.",
    backgroundGradient: ['#020617', '#312e81'], // Indigo
    obstacleSpeedMultiplier: 1.2,
    spawnRateMultiplier: 1.1,
    weatherIntensity: 2,
  },
  {
    name: "Sector 3: The Data Stream", 
    description: "Riding the fiber optics.",
    backgroundGradient: ['#0c4a6e', '#0891b2'], // Cyan Flow
    obstacleSpeedMultiplier: 1.4,
    spawnRateMultiplier: 0.9, 
    weatherIntensity: 1, 
  },
  {
    name: "Sector 1: The Black Box", 
    description: "Highly classified zone. Lethal countermeasures.",
    backgroundGradient: ['#2e0202', '#7f1d1d'], // Danger Red
    obstacleSpeedMultiplier: 1.7,
    spawnRateMultiplier: 1.6,
    weatherIntensity: 5, 
  },
  {
    name: "Core Overload", 
    description: "Injection complete. Get out of there, kid!",
    backgroundGradient: ['#4c1d95', '#a855f7'], // Victory Purple
    obstacleSpeedMultiplier: 0, 
    spawnRateMultiplier: 0,
    weatherIntensity: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 720; 
export const VICTORY_DISTANCE = 300000; 

// --- Narrative Content ---

export const WISHES = [
  "FILE: SANTA_ROUTE.enc",
  "KEY: NAUGHTY_LIST_BACKDOOR",
  "ALGORITHM: JOY_OVERRIDE",
  "PROTOCOL: SILENT_NIGHT",
  "TARGET: FIREWALL_HEX",
  "STATUS: UNDETECTED"
];

export const NARRATIVE_LETTERS = [
    { progress: 0.30, message: "Vixen: Santa's sleigh is heavy. Your MK-V is built for speed. Use it." },
    { progress: 0.60, message: "Komet: This code is messy. KRAMPUS needs a defrag." },
    { progress: 0.85, message: "Vixen: Don't get cocky, rookie. Bring it home." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  // Act I
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'KOMET', text: "MK-V Systems green. I'm dropping in." } },
  { progress: 0.03, dialogue: { id: 'act1_vixen', speaker: 'VIXEN', text: "Copy that, Komet. The Big Guy is busy delivering. We need this path clear." } },
  
  // Act II
  { progress: 0.25, dialogue: { id: 'act2_start', speaker: 'KOMET', text: "Whoa! The logic gates are shifting. It knows I'm here." } },
  { progress: 0.40, dialogue: { id: 'act2_krampus', speaker: 'KRAMPUS_AI', text: "INTRUDER DETECTED. SIGNATURE: UNKNOWN." } },

  // Act III
  { progress: 0.50, dialogue: { id: 'act3_start', speaker: 'VIXEN', text: "You're hitting the main stream. Velocity is spiking." } },
  
  // Act IV
  { progress: 0.75, dialogue: { id: 'act4_start', speaker: 'KRAMPUS_AI', text: "DELETE. DELETE. DELETE." } },
  { progress: 0.78, dialogue: { id: 'act4_komet', speaker: 'KOMET', text: "Not today, bucket-head! Eat plasma!" } },

  // Act V
  { progress: 0.95, dialogue: { id: 'act5_start', speaker: 'KOMET', text: "Virus uploaded! The network is turning... festive?" } },
  { progress: 0.97, dialogue: { id: 'act5_vixen', speaker: 'VIXEN', text: "Good work, kid. You might just make the main team someday." } }
];

export const LANDMARKS = [
    { progress: 0.35, type: 'SERVER_TOWER', name: "Node Alpha" },
    { progress: 0.55, type: 'MAIN_HUB', name: "Data Citadel" },
    { progress: 0.99, type: 'CORE_REACTOR', name: "Master CPU" }
] as const;