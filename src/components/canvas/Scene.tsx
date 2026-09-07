"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { Environment } from "@react-three/drei";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";
import { VolumetricFog } from "./VolumetricFog";
import { LightBeams } from "./LightBeams";
import { CameraDrift } from "./CameraDrift";
import { Effects } from "./Effects";
import { GroundGrid } from "./GroundGrid";
import { CardOrbit } from "../cards/CardOrbit";
import { useAppStore } from "@/stores/useAppStore";

interface SceneProps {
  onSwipe?: () => void;
  onPinch?: () => void;
  onRelease?: () => void;
  onSelect?: () => void;
}

function SceneContent({ onSwipe, onPinch, onRelease, onSelect }: SceneProps) {
  const setInitialized = useAppStore((s) => s.setInitialized);

  useEffect(() => {
    const timer = setTimeout(() => setInitialized(true), 500);
    return () => clearTimeout(timer);
  }, [setInitialized]);

  return (
    <>
      <CameraDrift />
      <Lighting />
      <Particles count={2000} />
      <VolumetricFog />
      <LightBeams />
      <GroundGrid />
      <CardOrbit
        onSwipe={onSwipe}
        onPinch={onPinch}
        onRelease={onRelease}
        onSelect={onSelect}
      />
      <Effects />
      <Environment preset="night" />
    </>
  );
}

export function Scene({ onSwipe, onPinch, onRelease, onSelect }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 7], fov: 55, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: 3,
        toneMappingExposure: 1.5,
      }}
      dpr={[1, 2]}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#050510"]} />
      <Suspense fallback={null}>
        <SceneContent
          onSwipe={onSwipe}
          onPinch={onPinch}
          onRelease={onRelease}
          onSelect={onSelect}
        />
      </Suspense>
    </Canvas>
  );
}
