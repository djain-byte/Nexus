"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CARD_MODULES } from "@/utils/constants";
import { HolographicCard } from "./HolographicCard";
import { useGestureStore } from "@/stores/useGestureStore";
import { useAppStore } from "@/stores/useAppStore";
import * as THREE from "three";

interface CardOrbitProps {
  onSwipe?: () => void;
  onPinch?: () => void;
  onRelease?: () => void;
  onSelect?: () => void;
}

export function CardOrbit({ onSwipe, onPinch, onRelease, onSelect }: CardOrbitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const angleRef = useRef(0);
  const lastGestureRef = useRef<string>("none");
  const lastGestureTimeRef = useRef(0);
  const [centerIndex, setCenterIndex] = useState(0);

  const gestureType = useGestureStore((s) => s.currentGesture.type);
  const gestureVelocity = useGestureStore((s) => s.currentGesture.velocity);
  const gestureSpeed = useGestureStore((s) => s.currentGesture.speed);
  const handDetected = useGestureStore((s) => s.handDetected);
  const setCarouselAngle = useAppStore((s) => s.setCarouselAngle);

  useEffect(() => {
    const handleMouseRotate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.delta) {
        velocityRef.current -= detail.delta;
      }
    };
    window.addEventListener("nexus-mouse-rotate", handleMouseRotate);
    return () => window.removeEventListener("nexus-mouse-rotate", handleMouseRotate);
  }, []);

  useEffect(() => {
    const now = performance.now();

    if (gestureType === "none" || gestureType === "idle" || gestureType === "palm_still") return;

    if (gestureType === lastGestureRef.current && now - lastGestureTimeRef.current < 200) return;

    lastGestureRef.current = gestureType;
    lastGestureTimeRef.current = now;

    if (gestureSpeed > 0) {
      const rotationForce = gestureVelocity.x * 0.8;
      velocityRef.current -= rotationForce;
      onSwipe?.();
      return;
    }

    switch (gestureType) {
      case "slow_scroll_left":
        velocityRef.current += 0.15;
        onSwipe?.();
        break;
      case "slow_scroll_right":
        velocityRef.current -= 0.15;
        onSwipe?.();
        break;
      case "fast_scroll_left":
        velocityRef.current += 0.6;
        onSwipe?.();
        break;
      case "fast_scroll_right":
        velocityRef.current -= 0.6;
        onSwipe?.();
        break;
      case "swipe_left":
        velocityRef.current += 0.35;
        onSwipe?.();
        break;
      case "swipe_right":
        velocityRef.current -= 0.35;
        onSwipe?.();
        break;
      case "swipe_up":
        velocityRef.current += 0.2;
        onSwipe?.();
        break;
      case "swipe_down":
        velocityRef.current -= 0.2;
        onSwipe?.();
        break;
    }
  }, [gestureType, gestureVelocity, gestureSpeed, onSwipe]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const damping = handDetected ? 0.94 : 0.96;
    velocityRef.current *= damping;

    if (Math.abs(velocityRef.current) < 0.00005) {
      velocityRef.current = 0;
    }

    angleRef.current += velocityRef.current;
    groupRef.current.rotation.y = angleRef.current;
    setCarouselAngle(angleRef.current);

    const cardCount = CARD_MODULES.length;
    const normalizedAngle =
      ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const closestIndex =
      Math.round(normalizedAngle / ((Math.PI * 2) / cardCount)) % cardCount;
    setCenterIndex(closestIndex);
  });

  return (
    <group ref={groupRef}>
      {CARD_MODULES.map((mod, index) => (
        <HolographicCard
          key={mod.id}
          module={mod}
          index={index}
          totalCards={CARD_MODULES.length}
          carouselAngle={0}
          isCenter={index === centerIndex}
          onPinch={onPinch}
          onRelease={onRelease}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
