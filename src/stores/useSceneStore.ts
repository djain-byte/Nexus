import { create } from "zustand";
import { SceneState } from "@/types";

interface SceneStore extends SceneState {
  setCameraDrift: (v: boolean) => void;
  setAmbientMotion: (v: number) => void;
  setParticleDensity: (v: number) => void;
  setFogDensity: (v: number) => void;
  setLightIntensity: (v: number) => void;
  setEnvironmentPreset: (p: "night" | "dark" | "midnight") => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  cameraDrift: true,
  ambientMotion: 1.0,
  particleDensity: 1.0,
  fogDensity: 1.0,
  lightIntensity: 1.0,
  environmentPreset: "night",

  setCameraDrift: (v) => set({ cameraDrift: v }),
  setAmbientMotion: (v) => set({ ambientMotion: v }),
  setParticleDensity: (v) => set({ particleDensity: v }),
  setFogDensity: (v) => set({ fogDensity: v }),
  setLightIntensity: (v) => set({ lightIntensity: v }),
  setEnvironmentPreset: (p) => set({ environmentPreset: p }),
}));
