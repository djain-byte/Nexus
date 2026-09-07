"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TRAIL_COUNT = 50;

interface ParticleTrailProps {
  active: boolean;
  position: THREE.Vector3;
  color: string;
}

export function ParticleTrail({ active, position, color }: ParticleTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef(new Float32Array(TRAIL_COUNT * 3));
  const lifetimesRef = useRef(new Float32Array(TRAIL_COUNT));
  const indexRef = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const positions = positionsRef.current;
    const lifetimes = lifetimesRef.current;

    if (active) {
      const i = indexRef.current % TRAIL_COUNT;
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.1;
      lifetimes[i] = 1.0;
      indexRef.current++;
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      lifetimes[i] = Math.max(0, lifetimes[i] - delta * 2);
      positions[i * 3 + 1] += delta * 0.3;
    }

    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsRef.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.03} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}
