"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnergyPulseProps {
  active: boolean;
  color: string;
  position: [number, number, number];
}

export function EnergyPulse({ active, color, position }: EnergyPulseProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!ringRef.current || !materialRef.current) return;

    if (active) {
      scaleRef.current += delta * 3;
      const s = 1 + scaleRef.current;
      ringRef.current.scale.set(s, s, 1);
      materialRef.current.opacity = Math.max(0, 1 - scaleRef.current / 2);

      if (scaleRef.current > 2) {
        scaleRef.current = 0;
      }
    } else {
      scaleRef.current = 0;
      ringRef.current.scale.set(0, 0, 0);
      materialRef.current.opacity = 0;
    }
  });

  return (
    <mesh ref={ringRef} position={position}>
      <torusGeometry args={[0.8, 0.02, 8, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
