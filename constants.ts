
import { LevelConfig, PowerupType, DialogueLine } from './types.ts';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.45; 
export const JUMP_STRENGTH = -8.5;
export const FLIGHT_LIFT = -0.6;
export const BASE_SPEED = 7; // Increased base speed for sequel

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
    name: "Zone 1: Neon Outskirts", 
    description: "Systems Online. The grid is quiet.",
    backgroundGradient: ['#0f172a', '#1e3a8a'], // Midnight Blue to Royal Blue
    obstacleSpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    weatherIntensity: 1,
  },
  {
    name: "Zone 2: Fiber-Optic Forest", 
    description: "Bio-digital jazz, man.",
    backgroundGradient: ['#020617', '#4c1d95'], // Black to Deep Purple
    obstacleSpeedMultiplier: 1.2,
    spawnRateMultiplier: 1.1,
    weatherIntensity: 2,
  },
  {
    name: "Zone 3: The Data Stream", 
    description: "Entering high-velocity transfer.",
    backgroundGradient: ['#0c4a6e', '#0891b2'], // Deep Ocean to Cyan
    obstacleSpeedMultiplier: 1.4,
    spawnRateMultiplier: 0.9, 
    weatherIntensity: 1, 
  },
  {
    name: "Zone 4: The Firewall", 
    description: "Security protocols active. Dodge the lasers.",
    backgroundGradient: ['#450a0a', '#be123c'], // Deep Red to Crimson (Laser theme)
    obstacleSpeedMultiplier: 1.6,
    spawnRateMultiplier: 1.5,
    weatherIntensity: 5, 
  },
  {
    name: "System Reboot", 
    description: "Upload Complete. Welcome to the future.",
    backgroundGradient: ['#4c1d95', '#f472b6'], // Synthwave Sunrise (Purple to Pink)
    obstacleSpeedMultiplier: 0, 
    spawnRateMultiplier: 0,
    weatherIntensity: 0,
  }
];

export const TOTAL_GAME_TIME_SECONDS = 720; 
export const VICTORY_DISTANCE = 300000; 

// --- Narrative Content ---

export const WISHES = [
  "Packet: JOY_v2.0",
  "Encrypted Wish: HOPE",
  "Download: PEACE.exe",
  "Fragment: CHILDHOOD_MEM",
  "Restoring Holiday Protocol...",
  "Bypassing Cynicism Firewall...",
  "Signal Strength: 100%",
  "Spirit Drive: CHARGING"
];

export const NARRATIVE_LETTERS = [
    { progress: 0.30, message: "Log 1: Magic isn't gone. It just upgraded to fiber optics." },
    { progress: 0.60, message: "Log 2: K.R.A.M.P.U.S. is just a buggy algorithm. We are the patch." },
    { progress: 0.85, message: "Log 3: The source code of Christmas is unhackable." }
];

export const STORY_MOMENTS: { progress: number; dialogue: DialogueLine }[] = [
  // Act I
  { progress: 0.01, dialogue: { id: 'act1_start', speaker: 'Rudolph', text: "Visor check. Thrusters check. Let's ride." } },
  
  // Act II
  { progress: 0.25, dialogue: { id: 'act2_start', speaker: 'Rudolph', text: "Entering the Forest. The trees are made of light!" } },
  { progress: 0.27, dialogue: { id: 'act2_santa', speaker: 'Santa', text: "Beautiful. But watch your heads." } },
  { progress: 0.40, dialogue: { id: 'act2_clock', speaker: 'KRAMPUS_AI', text: "UNAUTHORIZED FLIGHT PATH DETECTED." } },

  // Act III
  { progress: 0.50, dialogue: { id: 'act3_start', speaker: 'Rudolph', text: "We're in the stream! I feel... faster!" } },
  
  // Act IV
  { progress: 0.75, dialogue: { id: 'act4_start', speaker: 'KRAMPUS_AI', text: "ENGAGING FINAL FIREWALL. GOODBYE, SANTA." } },
  { progress: 0.78, dialogue: { id: 'act4_santa', speaker: 'Santa', text: "You can't delete the Christmas Spirit, you glorified toaster!" } },

  // Act V
  { progress: 0.95, dialogue: { id: 'act5_start', speaker: 'Rudolph', text: "We're through! The sun... it's never looked so bright." } },
  { progress: 0.97, dialogue: { id: 'act5_santa', speaker: 'Santa', text: "Mission accomplished. Initiate Joy Protocol." } }
];

export const LANDMARKS = [
    { progress: 0.35, type: 'SERVER_TOWER', name: "Node Alpha" },
    { progress: 0.55, type: 'MAIN_HUB', name: "Data Citadel" },
    { progress: 0.99, type: 'CORE_REACTOR', name: "The Source" }
] as const;
