"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAIStore } from "@/stores/useAIStore";

export function WakeAnimation() {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const status = useAIStore((s) => s.status);
  const prevStatus = useRef<string>("idle");
  const waveProgress = useRef(0);
  const isAnimating = useRef(false);

  const shaderMaterial = useRef(
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color("#3B82F6") },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float ring = smoothstep(0.45, 0.48, length(vUv - 0.5)) * smoothstep(0.52, 0.48, length(vUv - 0.5));
          gl_FragColor = vec4(uColor, ring * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  useFrame((_, delta) => {
    if (!ringRef.current || !materialRef.current) return;

    if (status === "listening" && prevStatus.current === "idle") {
      isAnimating.current = true;
      waveProgress.current = 0;
    }
    prevStatus.current = status;

    if (isAnimating.current) {
      waveProgress.current += delta * 1.5;
      const s = 1 + waveProgress.current * 8;
      ringRef.current.scale.set(s, s, 1);
      materialRef.current.uniforms.uOpacity.value = Math.max(
        0,
        1 - waveProgress.current
      );

      if (waveProgress.current >= 1) {
        isAnimating.current = false;
        ringRef.current.scale.set(0, 0, 0);
      }
    }
  });

  return (
    <mesh
      ref={ringRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      scale={[0, 0, 0]}
    >
      <planeGeometry args={[4, 4]} />
      <primitive
        object={shaderMaterial.current}
        ref={materialRef}
        attach="material"
      />
    </mesh>
  );
}
