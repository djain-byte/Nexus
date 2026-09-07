"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Lighting() {
  const spotRef = useRef<THREE.SpotLight>(null);
  const pointRef1 = useRef<THREE.PointLight>(null);
  const pointRef2 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (spotRef.current) {
      spotRef.current.position.x = Math.sin(t * 0.1) * 2;
      spotRef.current.position.z = Math.cos(t * 0.1) * 2;
    }

    if (pointRef1.current) {
      pointRef1.current.position.x = Math.sin(t * 0.15) * 6;
      pointRef1.current.position.y = 3 + Math.sin(t * 0.2) * 0.5;
      pointRef1.current.position.z = Math.cos(t * 0.15) * 6;
    }

    if (pointRef2.current) {
      pointRef2.current.position.x = Math.cos(t * 0.12) * 5;
      pointRef2.current.position.y = -1 + Math.cos(t * 0.18) * 0.3;
      pointRef2.current.position.z = Math.sin(t * 0.12) * 5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#1a1a3e" />

      <spotLight
        ref={spotRef}
        position={[0, 8, 0]}
        angle={0.6}
        penumbra={1}
        intensity={2.0}
        color="#3B82F6"
        distance={30}
        castShadow={false}
      />

      <pointLight
        ref={pointRef1}
        position={[5, 3, 5]}
        intensity={1.2}
        color="#06B6D4"
        distance={25}
      />

      <pointLight
        ref={pointRef2}
        position={[-5, -1, 5]}
        intensity={0.8}
        color="#8B5CF6"
        distance={20}
      />

      <pointLight
        position={[0, 2, 5]}
        intensity={1.5}
        color="#3B82F6"
        distance={15}
      />

      <pointLight
        position={[0, 0, 0]}
        intensity={0.5}
        color="#60A5FA"
        distance={10}
      />

      <fog attach="fog" args={["#050510", 8, 30]} />
    </>
  );
}
