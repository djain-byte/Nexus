"use client";

import { create } from "zustand";
import { GestureState, GestureData, TrackingStatus } from "@/types";

interface GestureStore extends GestureState {
  setTracking: (status: TrackingStatus) => void;
  setCurrentGesture: (gesture: GestureData) => void;
  setLastGesture: (gesture: GestureData | null) => void;
  setHandDetected: (detected: boolean) => void;
  setLandmarks: (landmarks: HandLandmark[]) => void;
  setConfidence: (confidence: number) => void;
}

import type { HandLandmark } from "@/types";

const defaultGesture: GestureData = {
  type: "none",
  confidence: 0,
  velocity: { x: 0, y: 0 },
  speed: 0,
  pinchDistance: 1,
  handOpenness: 0,
  palmPosition: { x: 0.5, y: 0.5, z: 0 },
  depth: 0,
  isHolding: false,
  timestamp: 0,
};

export const useGestureStore = create<GestureStore>((set) => ({
  tracking: "initializing",
  currentGesture: defaultGesture,
  lastGesture: null,
  handDetected: false,
  landmarks: [],
  confidence: 0,

  setTracking: (status) => set({ tracking: status }),
  setCurrentGesture: (gesture) =>
    set((state) => ({
      currentGesture: gesture,
      lastGesture: state.currentGesture,
    })),
  setLastGesture: (gesture) => set({ lastGesture: gesture }),
  setHandDetected: (detected) => set({ handDetected: detected }),
  setLandmarks: (landmarks) => set({ landmarks }),
  setConfidence: (confidence) => set({ confidence }),
}));
