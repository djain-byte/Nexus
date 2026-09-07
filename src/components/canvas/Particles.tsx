"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "@/stores/useSceneStore";

export function Particles({ count = 2000 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const ambientMotion = useSceneStore((s) => s.ambientMotion);

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 1.5 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (Math.random() - 0.5) * 6;
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      velocities[i3] = (Math.random() - 0.5) * 0.003;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.001;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;

      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        // Blue
        colors[i3] = 0.3;
        colors[i3 + 1] = 0.55;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.8) {
        // Cyan
        colors[i3] = 0.1;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 0.95;
      } else {
        // Violet
        colors[i3] = 0.6;
        colors[i3 + 1] = 0.4;
        colors[i3 + 2] = 1.0;
      }
    }

    return { positions, velocities, colors };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const posAttr = meshRef.current.geometry.getAttribute("position");
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const arr = posAttr.array as Float32Array;

      arr[i3] += velocities[i3] * ambientMotion;
      arr[i3 + 1] += Math.sin(time * 0.3 + i * 0.1) * 0.0008 * ambientMotion;
      arr[i3 + 2] += velocities[i3 + 2] * ambientMotion;

      const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 1] ** 2 + arr[i3 + 2] ** 2);
      if (dist > 14) {
        const scale = 1.5 / dist;
        arr[i3] *= scale;
        arr[i3 + 1] *= scale;
        arr[i3 + 2] *= scale;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
