"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function VolumetricFog() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#0a0a2e") },
          uOpacity: { value: 0.15 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vPosition;

          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = noise(i);
            float b = noise(i + vec2(1.0, 0.0));
            float c = noise(i + vec2(0.0, 1.0));
            float d = noise(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
            float total = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 4; i++) {
              total += smoothNoise(p) * amplitude;
              p *= 2.0;
              amplitude *= 0.5;
            }
            return total;
          }

          void main() {
            vec2 uv = vUv;
            float n = fbm(uv * 3.0 + uTime * 0.05);
            float n2 = fbm(uv * 5.0 - uTime * 0.03);

            float fog = n * 0.5 + n2 * 0.3;
            fog = smoothstep(0.2, 0.8, fog);

            float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
            edge *= smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

            float alpha = fog * uOpacity * edge;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[40, 40, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
