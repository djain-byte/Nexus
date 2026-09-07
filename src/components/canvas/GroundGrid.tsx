"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function GroundGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (!gridRef.current) return;
    const t = state.clock.elapsedTime;
    if (Array.isArray(gridRef.current.material)) {
      (gridRef.current.material[0] as THREE.LineBasicMaterial).opacity =
        0.08 + Math.sin(t * 0.3) * 0.02;
    }
  });

  const gridMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: "#3B82F6",
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <group position={[0, -2.5, 0]}>
      <gridHelper
        ref={gridRef}
        args={[40, 40, "#1a3a6e", "#0d1f3c"]}
        material={gridMaterial}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[3, 64]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
