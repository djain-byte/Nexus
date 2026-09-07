"use client";

import { useRef, useCallback } from "react";

interface SpringConfig {
  tension: number;
  friction: number;
}

interface SpringState {
  value: number;
  velocity: number;
}

export function useSpringAnimation(config: SpringConfig = { tension: 120, friction: 20 }) {
  const stateRef = useRef<SpringState>({ value: 0, velocity: 0 });
  const targetRef = useRef(0);

  const update = useCallback(
    (dt: number): number => {
      const state = stateRef.current;
      const target = targetRef.current;

      const springForce = -config.tension * (state.value - target);
      const dampingForce = -config.friction * state.velocity;
      const acceleration = springForce + dampingForce;

      state.velocity += acceleration * dt;
      state.value += state.velocity * dt;

      return state.value;
    },
    [config]
  );

  const setTarget = useCallback((target: number) => {
    targetRef.current = target;
  }, []);

  const setImmediate = useCallback((value: number) => {
    stateRef.current = { value, velocity: 0 };
  }, []);

  const reset = useCallback(() => {
    stateRef.current = { value: 0, velocity: 0 };
    targetRef.current = 0;
  }, []);

  return {
    update,
    setTarget,
    setImmediate,
    reset,
    getState: () => stateRef.current,
  };
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
