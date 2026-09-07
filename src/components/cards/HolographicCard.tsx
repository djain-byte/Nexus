"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text, MeshTransmissionMaterial } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { CardModule, CardState } from "@/types";
import { useGestureStore } from "@/stores/useGestureStore";
import { useAppStore } from "@/stores/useAppStore";
import { COLORS } from "@/utils/constants";
import { EnergyPulse } from "./EnergyPulse";
import { ParticleTrail } from "./ParticleTrail";

const AnimatedGroup = animated.group;

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

const SPRING_CONFIGS: Record<CardState, { tension: number; friction: number }> = {
  idle: { tension: 80, friction: 20 },
  hovered: { tension: 200, friction: 18 },
  selected: { tension: 300, friction: 22 },
  expanded: { tension: 100, friction: 26 },
  focused: { tension: 160, friction: 24 },
  dragging: { tension: 400, friction: 30 },
};

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
  const borderRefs = useRef<THREE.Mesh[]>([]);

  const [cardState, setCardState] = useState<CardState>("idle");
  const gestureType = useGestureStore((s) => s.currentGesture.type);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const expandedCard = useAppStore((s) => s.expandedCard);
  const setExpandedCard = useAppStore((s) => s.setExpandedCard);

  const cardColor = useMemo(() => new THREE.Color(mod.color), [mod.color]);
  const isExpanded = expandedCard === mod.id;
  const isDragging = cardState === "dragging";
  const isSelected = cardState === "selected";

  const [springs, springApi] = useSpring(() => ({
    scale: [1, 1, 1] as [number, number, number],
    glowIntensity: 0.3,
    borderOpacity: 0.15,
    config: SPRING_CONFIGS.idle,
  }));

  useEffect(() => {
    const config = SPRING_CONFIGS[cardState];
    switch (cardState) {
      case "idle":
        springApi.start({ scale: [1, 1, 1], glowIntensity: 0.3, borderOpacity: 0.15, config });
        break;
      case "hovered":
        springApi.start({ scale: [1.05, 1.05, 1.05], glowIntensity: 0.6, borderOpacity: 0.4, config });
        break;
      case "selected":
        springApi.start({ scale: [1.1, 1.1, 1.1], glowIntensity: 0.8, borderOpacity: 0.7, config });
        break;
      case "expanded":
        springApi.start({ scale: [1.8, 1.8, 1.0], glowIntensity: 1.0, borderOpacity: 0.95, config });
        break;
      case "focused":
        springApi.start({ scale: [1.3, 1.3, 1.0], glowIntensity: 1.0, borderOpacity: 0.8, config });
        break;
      case "dragging":
        springApi.start({ scale: [0.95, 0.95, 0.95], glowIntensity: 0.9, borderOpacity: 0.6, config });
        break;
    }
  }, [cardState, springApi]);

  useEffect(() => {
    if (isCenter && gestureType === "pinch_start") {
      onPinch?.();
    }
    if (gestureType === "pinch_release" && isExpanded) {
      onRelease?.();
      setExpandedCard(null);
      setCardState("focused");
    }
  }, [gestureType, isCenter, isExpanded, onPinch, onRelease, setExpandedCard]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const angle = (index / totalCards) * Math.PI * 2 + carouselAngle;
    const radius = isExpanded ? 2 : 5;

    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const floatY = cardState === "idle" ? Math.sin(t * 0.5 + index * 0.7) * 0.05 : 0;
    const targetY = isExpanded ? 0.5 : floatY;

    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.05;

    groupRef.current.scale.set(springs.scale.get()[0], springs.scale.get()[1], springs.scale.get()[2]);
    groupRef.current.lookAt(0, groupRef.current.position.y, 0);

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + springs.glowIntensity.get() * 0.5;
    }

    if (innerGlowRef.current) {
      const mat = innerGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.05 + springs.glowIntensity.get() * 0.15;
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
    : isSelected
    ? mod.accentColor
    : isCenter
    ? "#FFD700"
    : mod.color;

  return (
    <AnimatedGroup ref={groupRef}>
      {/* Card body with glass material */}
      <RoundedBox
        args={[2.2, 1.4, 0.05]}
        radius={0.08}
        smoothness={4}
        onClick={handleClick}
        onPointerOver={() => setCardState("hovered")}
        onPointerOut={() => setCardState(isExpanded ? "expanded" : "idle")}
      >
        <MeshTransmissionMaterial
          backside
          samples={6}
          thickness={0.2}
          chromaticAberration={0.05}
          anisotropy={0.3}
          distortion={0.0}
          distortionScale={0.3}
          temporalDistortion={0.0}
          color={mod.color}
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </RoundedBox>

      {/* Inner glow */}
      <mesh ref={innerGlowRef} position={[0, 0, 0.03]}>
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
            opacity={springs.borderOpacity.get()}
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

      {/* Energy pulse on select */}
      <EnergyPulse
        active={isSelected}
        color={mod.color}
        position={[0, 0, 0.05]}
      />

      {/* Particle trail on drag */}
      <ParticleTrail
        active={isDragging}
        position={groupRef.current?.position || new THREE.Vector3()}
        color={mod.color}
      />

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
    </AnimatedGroup>
  );
}
