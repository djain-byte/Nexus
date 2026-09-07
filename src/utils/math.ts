import * as THREE from "three";
import { HandLandmark } from "@/types";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function getOrbitPosition(
  index: number,
  total: number,
  radius: number,
  angleOffset: number = 0
): THREE.Vector3 {
  const angle = (index / total) * Math.PI * 2 + angleOffset;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  return new THREE.Vector3(x, 0, z);
}

export function getOrbitAngle(
  index: number,
  total: number,
  angleOffset: number = 0
): number {
  return (index / total) * Math.PI * 2 + angleOffset;
}

export function calculatePinchDistance(
  index: HandLandmark,
  thumb: HandLandmark
): number {
  const dx = index.x - thumb.x;
  const dy = index.y - thumb.y;
  const dz = index.z - thumb.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateHandOpenness(landmarks: HandLandmark[]): number {
  if (landmarks.length < 21) return 0;

  const wrist = landmarks[0];
  const middleTip = landmarks[12];
  const indexTip = landmarks[8];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const palmSize = Math.sqrt(
    (wrist.x - middleTip.x) ** 2 + (wrist.y - middleTip.y) ** 2
  );

  if (palmSize < 0.01) return 0;

  const fingerSpread =
    Math.sqrt((indexTip.x - pinkyTip.x) ** 2 + (indexTip.y - pinkyTip.y) ** 2) /
    palmSize;

  const fingerExtension =
    Math.sqrt((middleTip.x - wrist.x) ** 2 + (middleTip.y - wrist.y) ** 2) /
    palmSize;

  return clamp((fingerSpread + fingerExtension) / 2, 0, 1);
}

export function calculateVelocity(
  prev: HandLandmark,
  curr: HandLandmark,
  dt: number
): { x: number; y: number } {
  if (dt <= 0) return { x: 0, y: 0 };
  return {
    x: (curr.x - prev.x) / dt,
    y: (curr.y - prev.y) / dt,
  };
}

export function exponentialSmoothing(
  current: number,
  target: number,
  alpha: number
): number {
  return current + alpha * (target - current);
}

export function springInterpolate(
  current: number,
  target: number,
  velocity: number,
  tension: number,
  friction: number,
  dt: number
): { value: number; velocity: number } {
  const springForce = -tension * (current - target);
  const dampingForce = -friction * velocity;
  const acceleration = springForce + dampingForce;
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;
  return { value: newValue, velocity: newVelocity };
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function modAngle(angle: number): number {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}
