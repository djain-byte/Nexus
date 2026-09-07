import { create } from "zustand";

export type AIStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "offline"
  | "streaming";

interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIStore {
  status: AIStatus;
  setStatus: (status: AIStatus) => void;

  isListening: boolean;
  setIsListening: (v: boolean) => void;
  wakeWordActive: boolean;
  setWakeWordActive: (v: boolean) => void;
  interimTranscript: string;
  setInterimTranscript: (text: string) => void;

  responseText: string;
  setResponseText: (text: string) => void;
  streamingText: string;
  setStreamingText: (text: string) => void;
  appendStreamingText: (chunk: string) => void;

  history: ConversationEntry[];
  addToHistory: (entry: ConversationEntry) => void;
  clearHistory: () => void;

  activeModuleContext: string | null;
  setActiveModuleContext: (module: string | null) => void;

  apiKey: string;
  setApiKey: (key: string) => void;

  panelVisible: boolean;
  setPanelVisible: (v: boolean) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),

  isListening: false,
  setIsListening: (isListening) => set({ isListening }),
  wakeWordActive: false,
  setWakeWordActive: (wakeWordActive) => set({ wakeWordActive }),
  interimTranscript: "",
  setInterimTranscript: (interimTranscript) => set({ interimTranscript }),

  responseText: "",
  setResponseText: (responseText) => set({ responseText }),
  streamingText: "",
  setStreamingText: (streamingText) => set({ streamingText }),
  appendStreamingText: (chunk) =>
    set((s) => ({ streamingText: s.streamingText + chunk })),

  history: [],
  addToHistory: (entry) =>
    set((s) => ({
      history: [...s.history.slice(-19), entry],
    })),
  clearHistory: () => set({ history: [] }),

  activeModuleContext: null,
  setActiveModuleContext: (activeModuleContext) => set({ activeModuleContext }),

  apiKey: "",
  setApiKey: (apiKey) => set({ apiKey }),

  panelVisible: false,
  setPanelVisible: (panelVisible) => set({ panelVisible }),
}));
