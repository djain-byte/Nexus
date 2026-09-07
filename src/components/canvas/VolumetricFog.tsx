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
          uOpacity: { value: 0.12 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;

          float hash(vec3 p) {
            p = fract(p * vec3(0.1031, 0.1030, 0.0973));
            p += dot(p, p.yxz + 33.33);
            return fract((p.x + p.y) * p.z);
          }

          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
            );
          }

          float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 4; i++) {
              value += amplitude * noise(p);
              p *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            vec3 pos = vWorldPosition * 0.15 + vec3(uTime * 0.02, uTime * 0.01, 0.0);
            float f = fbm(pos);
            float n2 = fbm(pos * 1.5 + vec3(10.0));
            float fog = f * 0.6 + n2 * 0.4;

            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = 1.0 - abs(dot(normalize(vPosition), viewDir));
            fresnel = pow(fresnel, 2.0);

            float alpha = fog * uOpacity * (0.5 + fresnel * 0.5);
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[15, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
