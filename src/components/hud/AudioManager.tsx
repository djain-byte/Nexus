"use client";

import { useCallback, useEffect, useRef } from "react";

interface AudioSound {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private initialized = false;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  initialize() {
    if (this.initialized) return;
    try {
      this.getContext();
      this.initialized = true;
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  }

  playTone(
    frequency: number,
    duration: number = 0.1,
    volume: number = 0.05,
    type: OscillatorType = "sine"
  ) {
    if (!this.initialized) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Silent fail
    }
  }

  playSwipe() {
    this.playTone(800, 0.08, 0.03, "sine");
    setTimeout(() => this.playTone(1000, 0.06, 0.02, "sine"), 30);
  }

  playPinch() {
    this.playTone(600, 0.12, 0.04, "triangle");
    setTimeout(() => this.playTone(900, 0.1, 0.03, "sine"), 50);
  }

  playRelease() {
    this.playTone(500, 0.15, 0.03, "sine");
  }

  playSelect() {
    this.playTone(1200, 0.08, 0.04, "sine");
    setTimeout(() => this.playTone(1500, 0.06, 0.03, "sine"), 40);
    setTimeout(() => this.playTone(1800, 0.05, 0.02, "sine"), 80);
  }

  playAmbientPad() {
    // Disabled — was causing continuous humming
    return undefined;
  }

  playActivation() {
    this.playTone(440, 0.15, 0.2, "sine");
    setTimeout(() => this.playTone(660, 0.15, 0.2, "sine"), 100);
    setTimeout(() => this.playTone(880, 0.1, 0.15, "sine"), 200);
  }

  playListeningBlip() {
    this.playTone(800, 0.08, 0.1, "sine");
  }

  playResponseStart() {
    this.playTone(880, 0.1, 0.15, "sine");
    setTimeout(() => this.playTone(660, 0.15, 0.1, "sine"), 80);
  }

  playWakeSound() {
    this.playTone(523, 0.1, 0.2, "sine");
    setTimeout(() => this.playTone(659, 0.1, 0.2, "sine"), 100);
    setTimeout(() => this.playTone(784, 0.15, 0.15, "sine"), 200);
  }
}

export const audioManager = new AudioManager();

export function useAudio() {
  const ambientStopRef = useRef<(() => void) | undefined>(undefined);

  const initAudio = useCallback(() => {
    audioManager.initialize();
    ambientStopRef.current = audioManager.playAmbientPad();
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      ambientStopRef.current?.();
    };
  }, [initAudio]);

  return {
    playSwipe: () => audioManager.playSwipe(),
    playPinch: () => audioManager.playPinch(),
    playRelease: () => audioManager.playRelease(),
    playSelect: () => audioManager.playSelect(),
    playActivation: () => audioManager.playActivation(),
    playWakeSound: () => audioManager.playWakeSound(),
    playResponseStart: () => audioManager.playResponseStart(),
    playListeningBlip: () => audioManager.playListeningBlip(),
  };
}
