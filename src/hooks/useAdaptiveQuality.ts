"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAppStore } from "@/stores/useAppStore";

export function useAdaptiveQuality() {
  const setQuality = useAppStore((s) => s.setQuality);
  const setFps = useAppStore((s) => s.setFps);
  const frameTimesRef = useRef<number[]>([]);
  const lastCheckRef = useRef(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const delta = state.clock.getDelta();
    const fps = 1 / Math.max(delta, 0.001);

    frameTimesRef.current.push(fps);

    if (now - lastCheckRef.current < 2) return;
    lastCheckRef.current = now;

    const samples = frameTimesRef.current;
    const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
    frameTimesRef.current = [];

    setFps(Math.round(avgFps));

    if (avgFps < 30) {
      setQuality("low");
    } else if (avgFps < 50) {
      setQuality("medium");
    } else {
      setQuality("high");
    }
  });

  return null;
}
