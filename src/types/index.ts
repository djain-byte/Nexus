export type GestureType =
  | "none"
  | "idle"
  | "swipe_left"
  | "swipe_right"
  | "swipe_up"
  | "swipe_down"
  | "slow_scroll_left"
  | "slow_scroll_right"
  | "fast_scroll_left"
  | "fast_scroll_right"
  | "pinch_start"
  | "pinch_hold"
  | "pinch_release"
  | "pull_toward"
  | "push_away"
  | "palm_still"
  | "open_hand"
  | "closed_fist"
  | "point"
  | "two_hand_zoom"
  | "thumbs_up"
  | "victory"
  | "iloveyou"
  | "circle";

export type CardState = "idle" | "hovered" | "selected" | "expanded" | "focused" | "dragging";

export type TrackingStatus = "initializing" | "active" | "inactive" | "error";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureData {
  type: GestureType;
  confidence: number;
  velocity: { x: number; y: number };
  speed: number;
  pinchDistance: number;
  handOpenness: number;
  palmPosition: { x: number; y: number; z: number };
  depth: number;
  isHolding: boolean;
  timestamp: number;
}

export interface CardModule {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  accentColor: string;
}

export interface AppState {
  initialized: boolean;
  booting: boolean;
  activeModule: string | null;
  focusedCard: string | null;
  expandedCard: string | null;
  carouselAngle: number;
  targetAngle: number;
  quality: "high" | "medium" | "low";
  fps: number;
  gpuInfo: string;
}

export interface GestureState {
  tracking: TrackingStatus;
  currentGesture: GestureData;
  lastGesture: GestureData | null;
  handDetected: boolean;
  landmarks: HandLandmark[];
  confidence: number;
}

export type AIStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "offline"
  | "streaming";

export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  moduleContext?: string;
}

export interface SceneState {
  cameraDrift: boolean;
  ambientMotion: number;
  particleDensity: number;
  fogDensity: number;
  lightIntensity: number;
  environmentPreset: "night" | "dark" | "midnight";
}
