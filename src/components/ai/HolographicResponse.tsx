"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useAIStore } from "@/stores/useAIStore";

export function HolographicResponse() {
  const groupRef = useRef<THREE.Group>(null);
  const streamingText = useAIStore((s) => s.streamingText);
  const status = useAIStore((s) => s.status);
  const [displayText, setDisplayText] = useState("");
  const targetOpacity = useRef(0);
  const currentOpacity = useRef(0);
  const opacityRef = useRef(0);

  useEffect(() => {
    if (status === "streaming" || status === "speaking") {
      targetOpacity.current = 1;
      setDisplayText(streamingText);
    } else if (status === "idle") {
      targetOpacity.current = 0;
      const timer = setTimeout(() => setDisplayText(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [streamingText, status]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    currentOpacity.current +=
      (targetOpacity.current - currentOpacity.current) * delta * 3;
    opacityRef.current = currentOpacity.current;

    groupRef.current.position.y =
      2.5 + Math.sin(Date.now() * 0.001) * 0.05;

    groupRef.current.lookAt(0, 2.5, 7);
  });

  const visibleText = useMemo(() => {
    if (displayText.length > 200) {
      return "..." + displayText.slice(-200);
    }
    return displayText;
  }, [displayText]);

  if (!visibleText) return null;

  return (
    <group ref={groupRef} position={[0, 2.5, 0]}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[4, 1.5]} />
        <meshBasicMaterial
          color="#0a0a2e"
          transparent
          opacity={opacityRef.current * 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[4.05, 1.55]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={opacityRef.current * 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Text
        fontSize={0.09}
        maxWidth={3.5}
        lineHeight={1.5}
        textAlign="left"
        anchorX="center"
        anchorY="middle"
        color="#E2E8F0"
        fillOpacity={opacityRef.current}
      >
        {visibleText}
      </Text>

      <Text
        position={[-1.7, 0.65, 0]}
        fontSize={0.06}
        color={status === "streaming" ? "#00D4AA" : "#3B82F6"}
        fillOpacity={opacityRef.current * 0.7}
      >
        {status === "streaming"
          ? "● STREAMING"
          : status === "speaking"
            ? "● SPEAKING"
            : "NEXUS"}
      </Text>
    </group>
  );
}
