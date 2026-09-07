import { CardModule } from "@/types";

export const CARD_MODULES: CardModule[] = [
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Social Analytics",
    icon: "📸",
    color: "#E1306C",
    accentColor: "#F77737",
  },
  {
    id: "stocks",
    title: "Stocks",
    subtitle: "Market Overview",
    icon: "📈",
    color: "#00D4AA",
    accentColor: "#4ECDC4",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Active Work",
    icon: "🚀",
    color: "#7B61FF",
    accentColor: "#A78BFA",
  },
  {
    id: "sports",
    title: "Sports",
    subtitle: "Live Scores",
    icon: "⚡",
    color: "#FF6B35",
    accentColor: "#F7C948",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Schedule",
    icon: "📅",
    color: "#3B82F6",
    accentColor: "#60A5FA",
  },
  {
    id: "weather",
    title: "Weather",
    subtitle: "Conditions",
    icon: "🌤",
    color: "#06B6D4",
    accentColor: "#22D3EE",
  },
  {
    id: "ai",
    title: "AI",
    subtitle: "Neural Engine",
    icon: "🧠",
    color: "#8B5CF6",
    accentColor: "#A78BFA",
  },
  {
    id: "news",
    title: "News",
    subtitle: "Feed",
    icon: "📰",
    color: "#F59E0B",
    accentColor: "#FBBF24",
  },
  {
    id: "music",
    title: "Music",
    subtitle: "Playback",
    icon: "🎵",
    color: "#1DB954",
    accentColor: "#34D399",
  },
  {
    id: "system",
    title: "System",
    subtitle: "Diagnostics",
    icon: "⚙",
    color: "#64748B",
    accentColor: "#94A3B8",
  },
];

export const ORBIT_RADIUS = 5;
export const CARD_WIDTH = 2.2;
export const CARD_HEIGHT = 1.4;
export const CARD_GAP = 0.3;
export const CAROUSEL_SPEED = 0.3;
export const FLOAT_AMPLITUDE = 0.08;
export const FLOAT_FREQUENCY = 0.5;

export const GESTURE_THRESHOLDS = {
  SWIPE_VELOCITY: 0.015,
  PINCH_DISTANCE: 0.06,
  PINCH_RELEASE: 0.1,
  HAND_OPENNESS: 0.6,
  PALM_STILL_VELOCITY: 0.002,
  PULL_PUSH_THRESHOLD: 0.03,
} as const;

export const SPRING_CONFIG = {
  GENTLE: { tension: 120, friction: 20 },
  SNAPPY: { tension: 300, friction: 24 },
  BOUNCY: { tension: 200, friction: 12 },
  HEAVY: { tension: 80, friction: 30 },
} as const;

export const COLORS = {
  BG_PRIMARY: "#050510",
  BG_SECONDARY: "#0A0A1A",
  HOLO_BLUE: "#3B82F6",
  HOLO_CYAN: "#06B6D4",
  HOLO_WHITE: "#E2E8F0",
  HOLO_VIOLET: "#8B5CF6",
  WARNING_ORANGE: "#F97316",
  GOLD: "#FFD700",
  GLOW_PRIMARY: "rgba(59, 130, 246, 0.4)",
  GLOW_SECONDARY: "rgba(6, 182, 212, 0.3)",
  GLASS_BG: "rgba(15, 15, 35, 0.6)",
  GLASS_BORDER: "rgba(100, 150, 255, 0.15)",
} as const;

export const PERFORMANCE = {
  TARGET_FPS: 60,
  LOW_FPS_THRESHOLD: 30,
  QUALITY_CHECK_INTERVAL: 2000,
  PARTICLE_COUNT_HIGH: 2000,
  PARTICLE_COUNT_MEDIUM: 1000,
  PARTICLE_COUNT_LOW: 500,
} as const;
