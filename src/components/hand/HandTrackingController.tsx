"use client";

import { useEffect, useRef } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useGestureStore } from "@/stores/useGestureStore";

export function HandTrackingController() {
  const { startTracking, stopTracking, cameraReady } = useHandTracking();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Auto-start hand tracking after a short delay
    const timer = setTimeout(() => {
      startTracking();
    }, 2000);

    return () => {
      clearTimeout(timer);
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  return null;
}
