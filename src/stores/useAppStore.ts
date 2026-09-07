import { create } from "zustand";
import { AppState } from "@/types";

interface AppStore extends AppState {
  setInitialized: (v: boolean) => void;
  setBooting: (v: boolean) => void;
  setActiveModule: (id: string | null) => void;
  setFocusedCard: (id: string | null) => void;
  setExpandedCard: (id: string | null) => void;
  setCarouselAngle: (angle: number) => void;
  setTargetAngle: (angle: number) => void;
  setQuality: (q: "high" | "medium" | "low") => void;
  setFps: (fps: number) => void;
  setGpuInfo: (info: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  initialized: false,
  booting: true,
  activeModule: null,
  focusedCard: null,
  expandedCard: null,
  carouselAngle: 0,
  targetAngle: 0,
  quality: "high",
  fps: 60,
  gpuInfo: "Unknown",

  setInitialized: (v) => set({ initialized: v, booting: false }),
  setBooting: (v) => set({ booting: v }),
  setActiveModule: (id) => set({ activeModule: id }),
  setFocusedCard: (id) => set({ focusedCard: id }),
  setExpandedCard: (id) => set({ expandedCard: id }),
  setCarouselAngle: (angle) => set({ carouselAngle: angle }),
  setTargetAngle: (angle) => set({ targetAngle: angle }),
  setQuality: (q) => set({ quality: q }),
  setFps: (fps) => set({ fps }),
  setGpuInfo: (info) => set({ gpuInfo: info }),
}));
