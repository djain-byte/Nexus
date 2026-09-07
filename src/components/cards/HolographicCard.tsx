"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { CardModule, CardState } from "@/types";
import { useGestureStore } from "@/stores/useGestureStore";
import { useAppStore } from "@/stores/useAppStore";
import { useSpringAnimation } from "@/hooks/useSpringAnimation";
import { COLORS } from "@/utils/constants";

interface HolographicCardProps {
  module: CardModule;
  index: number;
  totalCards: number;
  carouselAngle: number;
  isCenter: boolean;
  onPinch?: () => void;
  onRelease?: () => void;
  onSelect?: () => void;
}

export function HolographicCard({
  module: mod,
  index,
  totalCards,
  carouselAngle,
  isCenter,
  onPinch,
  onRelease,
  onSelect,
}: HolographicCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerGlowRef = useRef<THREE.Mesh>(null);

  const [cardState, setCardState] = useState<CardState>("idle");
  const { currentGesture } = useGestureStore();
  const { setActiveModule, expandedCard, setExpandedCard } = useAppStore();

  const springX = useSpringAnimation({ tension: 120, friction: 20 });
  const springY = useSpringAnimation({ tension: 80, friction: 15 });
  const springZ = useSpringAnimation({ tension: 120, friction: 20 });
  const springScale = useSpringAnimation({ tension: 200, friction: 20 });
  const springGlow = useSpringAnimation({ tension: 100, friction: 18 });
  const springExpand = useSpringAnimation({ tension: 150, friction: 22 });

  const cardColor = useMemo(() => new THREE.Color(mod.color), [mod.color]);
  const isExpanded = expandedCard === mod.id;

  // Handle pinch to expand
  useEffect(() => {
    if (isCenter && currentGesture.type === "pinch_start") {
      onPinch?.();
    }
    if (currentGesture.type === "pinch_release" && isExpanded) {
      onRelease?.();
      setExpandedCard(null);
      setCardState("focused");
    }
  }, [currentGesture, isCenter, isExpanded, onPinch, onRelease, setExpandedCard]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const angle = (index / totalCards) * Math.PI * 2 + carouselAngle;
    const radius = isExpanded ? 2 : 5;

    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const targetY = isExpanded ? 0.5 : Math.sin(t * 0.5 + index * 0.7) * 0.08;

    springX.setTarget(targetX);
    springY.setTarget(targetY);
    springZ.setTarget(targetZ);

    let targetScale = 0.9;
    if (isExpanded) targetScale = 1.4;
    else if (isCenter) targetScale = 1.15;
    springScale.setTarget(targetScale);

    const targetGlow = isExpanded ? 1.5 : isCenter ? 1 : 0.3;
    springGlow.setTarget(targetGlow);

    springExpand.setTarget(isExpanded ? 1 : 0);

    const x = springX.update(delta);
    const y = springY.update(delta);
    const z = springZ.update(delta);
    const scale = springScale.update(delta);
    const glow = springGlow.update(delta);

    groupRef.current.position.set(x, y, z);
    groupRef.current.scale.setScalar(scale);
    groupRef.current.lookAt(0, y, 0);

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + glow * 0.5;
    }

    if (innerGlowRef.current) {
      const mat = innerGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.05 + glow * 0.15;
    }
  });

  const handleClick = useCallback(() => {
    setActiveModule(mod.id);
    onSelect?.();
    if (isExpanded) {
      setCardState("selected");
      setExpandedCard(null);
    } else {
      setCardState("expanded");
      setExpandedCard(mod.id);
    }
  }, [mod.id, setActiveModule, isExpanded, setExpandedCard, onSelect]);

  const borderColor = isExpanded
    ? COLORS.WARNING_ORANGE
    : isCenter
    ? "#FFD700"
    : mod.color;

  return (
    <group ref={groupRef}>
      {/* Card body */}
      <RoundedBox
        args={[2.2, 1.4, 0.06]}
        radius={0.08}
        smoothness={4}
        onClick={handleClick}
        onPointerOver={() => setCardState("hovered")}
        onPointerOut={() => setCardState(isExpanded ? "expanded" : "idle")}
      >
        <meshStandardMaterial
          color="#1a1a3e"
          emissive={cardColor}
          emissiveIntensity={isExpanded ? 0.5 : isCenter ? 0.3 : 0.1}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* Inner glow */}
      <mesh ref={innerGlowRef} position={[0, 0, 0.035]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshBasicMaterial
          color={cardColor}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} position={[0, 0, -0.06]}>
        <planeGeometry args={[2.8, 1.8]} />
        <meshBasicMaterial
          color={cardColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Border lines */}
      {[
        [0, 0.7, 2.2, 0.008],
        [0, -0.7, 2.2, 0.008],
        [-1.1, 0, 0.008, 1.4],
        [1.1, 0, 0.008, 1.4],
      ].map(([bx, by, bw, bh], i) => (
        <mesh key={i} position={[bx, by, 0.035]}>
          <planeGeometry args={[bw, bh]} />
          <meshBasicMaterial
            color={borderColor}
            transparent
            opacity={isExpanded ? 0.95 : isCenter ? 0.8 : 0.5}
          />
        </mesh>
      ))}

      {/* Module icon */}
      <Text position={[0, 0.2, 0.04]} fontSize={0.35} anchorX="center" anchorY="middle">
        {mod.icon}
      </Text>

      {/* Module title */}
      <Text
        position={[0, -0.15, 0.04]}
        fontSize={0.14}
        color="#E2E8F0"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        {mod.title.toUpperCase()}
      </Text>

      {/* Module subtitle */}
      <Text
        position={[0, -0.35, 0.04]}
        fontSize={0.07}
        color="#94A3B8"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        {mod.subtitle.toUpperCase()}
      </Text>

      {/* Top accent */}
      <mesh position={[0, 0.55, 0.036]}>
        <planeGeometry args={[1.6, 0.003]} />
        <meshBasicMaterial
          color={isExpanded ? COLORS.WARNING_ORANGE : isCenter ? "#FFD700" : mod.accentColor}
          transparent
          opacity={isExpanded ? 0.95 : isCenter ? 0.9 : 0.6}
        />
      </mesh>

      {/* Corner dots */}
      {[[-1.05, 0.65], [1.05, 0.65], [-1.05, -0.65], [1.05, -0.65]].map(
        ([cx, cy], i) => (
          <mesh key={i} position={[cx, cy, 0.036]}>
            <circleGeometry args={[0.02, 16]} />
            <meshBasicMaterial
              color={borderColor}
              transparent
              opacity={0.8}
            />
          </mesh>
        )
      )}

      {/* Expanded state: extra info panel */}
      {isExpanded && (
        <group position={[0, -0.8, 0.04]}>
          <mesh>
            <planeGeometry args={[1.8, 0.3]} />
            <meshBasicMaterial
              color="#0f0f23"
              transparent
              opacity={0.8}
            />
          </mesh>
          <Text
            position={[0, 0.05, 0.01]}
            fontSize={0.05}
            color="#64748B"
            anchorX="center"
            anchorY="middle"
          >
            {`MODULE: ${mod.id.toUpperCase()} | STATUS: ACTIVE`}
          </Text>
          <Text
            position={[0, -0.05, 0.01]}
            fontSize={0.04}
            color="#475569"
            anchorX="center"
            anchorY="middle"
          >
            CLICK TO COLLAPSE
          </Text>
        </group>
      )}
    </group>
  );
}
