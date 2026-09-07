"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function LightBeams() {
  const groupRef = useRef<THREE.Group>(null);

  const beams = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        4 + Math.random() * 3,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      rotation: [
        0,
        0,
        (Math.random() - 0.5) * 0.3,
      ] as [number, number, number],
      scale: 0.02 + Math.random() * 0.03,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const beam = beams[i];
      if (beam) {
        child.position.x =
          beam.position[0] + Math.sin(t * beam.speed + beam.phase) * 0.5;
        child.rotation.z = beam.rotation[2] + Math.sin(t * 0.3 + beam.phase) * 0.1;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {beams.map((beam, i) => (
        <mesh key={i} position={beam.position} rotation={beam.rotation}>
          <cylinderGeometry args={[beam.scale, beam.scale * 0.3, 12, 8, 1, true]} />
          <meshBasicMaterial
            color="#3B82F6"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
