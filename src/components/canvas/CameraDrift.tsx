"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSceneStore } from "@/stores/useSceneStore";
import * as THREE from "three";

export function CameraDrift() {
  const { camera } = useThree();
  const cameraDrift = useSceneStore((s) => s.cameraDrift);
  const ambientMotion = useSceneStore((s) => s.ambientMotion);
  const basePosition = useRef(new THREE.Vector3(0, 0.5, 7));
  const baseLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    if (!cameraDrift) return;

    const t = state.clock.elapsedTime;
    const motion = ambientMotion;

    const driftX = Math.sin(t * 0.08) * 0.15 * motion;
    const driftY = Math.sin(t * 0.12) * 0.08 * motion + 0.5;
    const driftZ = 7 + Math.sin(t * 0.06) * 0.2 * motion;

    camera.position.x = basePosition.current.x + driftX;
    camera.position.y = driftY;
    camera.position.z = driftZ;

    camera.lookAt(
      baseLookAt.current.x + Math.sin(t * 0.1) * 0.05 * motion,
      baseLookAt.current.y,
      baseLookAt.current.z
    );
  });

  return null;
}
