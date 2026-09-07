import { create } from "zustand";
import { AIStatus } from "@/ai/brain";

interface AIState {
  status: AIStatus;
  panelVisible: boolean;
  responseText: string;
  interimText: string;
  isListening: boolean;
  wakeWordActive: boolean;
  apiKey: string;
  setStatus: (status: AIStatus) => void;
  setPanelVisible: (visible: boolean) => void;
  setResponseText: (text: string) => void;
  setInterimText: (text: string) => void;
  setIsListening: (listening: boolean) => void;
  setWakeWordActive: (active: boolean) => void;
  setApiKey: (key: string) => void;
}

export const useAIStore = create<AIState>((set) => ({
  status: "idle",
  panelVisible: false,
  responseText: "",
  interimText: "",
  isListening: false,
  wakeWordActive: true,
  apiKey: "",

  setStatus: (status) => set({ status }),
  setPanelVisible: (visible) => set({ panelVisible: visible }),
  setResponseText: (text) => set({ responseText: text }),
  setInterimText: (text) => set({ interimText: text }),
  setIsListening: (listening) => set({ isListening: listening }),
  setWakeWordActive: (active) => set({ wakeWordActive: active }),
  setApiKey: (key) => set({ apiKey: key }),
}));
