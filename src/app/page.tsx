"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { BootOverlay } from "@/components/hud/BootOverlay";
import { HUD } from "@/components/hud/HUD";
import { MouseFallback } from "@/components/hand/MouseFallback";
import { HandTrackingController } from "@/components/hand/HandTrackingController";
import { useAudio } from "@/components/hud/AudioManager";
import { AIPanel } from "@/components/hud/AIPanel";
import { AIStatus, AIStatusType } from "@/components/hud/AIStatus";
import { useAIStore } from "@/stores/useAIStore";
import { useAppStore } from "@/stores/useAppStore";
import { NexusBrain, AIStatus as BrainStatus } from "@/ai/brain";
import { VoiceManager } from "@/ai/voice";

const Scene = dynamic(
  () =>
    import("@/components/canvas/Scene").then((mod) => ({ default: mod.Scene })),
  { ssr: false }
);

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
console.log("[NEXUS] API key loaded:", GEMINI_API_KEY ? "YES (length: " + GEMINI_API_KEY.length + ")" : "NO");

export default function Home() {
  const [booted, setBooted] = useState(false);
  const [inputText, setInputText] = useState("");
  const { playSwipe, playPinch, playRelease, playSelect } = useAudio();

  const aiStatus = useAIStore((s) => s.status);
  const panelVisible = useAIStore((s) => s.panelVisible);
  const responseText = useAIStore((s) => s.responseText);
  const interimText = useAIStore((s) => s.interimText);
  const isListening = useAIStore((s) => s.isListening);
  const setAIStatus = useAIStore((s) => s.setStatus);
  const setPanelVisible = useAIStore((s) => s.setPanelVisible);
  const setResponseText = useAIStore((s) => s.setResponseText);
  const setInterimText = useAIStore((s) => s.setInterimText);
  const setIsListening = useAIStore((s) => s.setIsListening);

  const brainRef = useRef<NexusBrain | null>(null);
  const voiceRef = useRef<VoiceManager | null>(null);
  const cleanupRef = useRef(false);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  const executeCommand = useCallback(
    (command: { action: string; params: Record<string, unknown> }) => {
      const { setExpandedCard, setActiveModule } = useAppStore.getState();

      switch (command.action) {
        case "open_card": {
          const card = command.params.card as string;
          setActiveModule(card);
          setExpandedCard(card);
          playSelect();
          break;
        }
        case "close_card": {
          setActiveModule(null);
          setExpandedCard(null);
          playRelease();
          break;
        }
        case "rotate": {
          const dir = command.params.direction as string;
          const speed = command.params.speed as string;
          const delta = dir === "left" ? 1 : -1;
          const amount = speed === "fast" ? 0.6 : 0.15;
          window.dispatchEvent(
            new CustomEvent("nexus-mouse-rotate", { detail: { delta: delta * amount } })
          );
          playSwipe();
          break;
        }
        case "system_status": {
          setResponseText("System Status: All modules operational.\nFPS: 60\nHand Tracking: Active\nAI Engine: Online");
          break;
        }
        default:
          break;
      }
    },
    [playSelect, playRelease, playSwipe, setResponseText]
  );

  // Shared query function — used by both voice and text input
  const sendQuery = useCallback(async (text: string) => {
    const brain = brainRef.current;
    const voice = voiceRef.current;
    if (!brain || !text.trim()) return;

    setPanelVisible(true);
    setResponseText("");
    setInterimText("");
    setAIStatus("thinking");

    console.log("[NEXUS] Sending query:", text);

    let fullResponse = "";
    try {
      for await (const chunk of brain.streamQuery(text, {
        activeCard: useAppStore.getState().activeModule || useAppStore.getState().expandedCard || undefined,
      })) {
        if (chunk.done) {
          try {
            const commandMatch = fullResponse.match(/^(\{[^]*?\})\n/);
            if (commandMatch) {
              const command = JSON.parse(commandMatch[1]);
              executeCommand(command);
            }
          } catch {
            // not a command
          }
        } else {
          fullResponse += chunk.text;
          setResponseText(fullResponse);
        }
      }

      const cleanResponse = fullResponse.replace(/^\{[^]*?\}\n/, "").trim();
      if (cleanResponse && voice) {
        await voice.speak(cleanResponse);
      }
    } catch (err) {
      console.error("[NEXUS] Query error:", err);
      setResponseText("Connection error. Please try again.");
    }
  }, [executeCommand, setPanelVisible, setResponseText, setInterimText, setAIStatus]);

  // Initialize AI brain and voice once on boot
  useEffect(() => {
    if (!booted || brainRef.current) return;
    if (!GEMINI_API_KEY) {
      console.warn("NEXUS: No GEMINI_API_KEY found. AI features disabled.");
      return;
    }

    const brain = new NexusBrain({ apiKey: GEMINI_API_KEY });
    brainRef.current = brain;

    const voice = new VoiceManager({ wakeWord: "nexus" });
    voiceRef.current = voice;

    brain.onStatusChange((status: BrainStatus) => {
      setAIStatus(status);
    });

    voice.onCallbacks({
      onStatusChange: (voiceStatus) => {
        if (cleanupRef.current) return;
        setIsListening(voiceStatus === "listening");
      },
      onWakeWord: () => {
        playSelect();
        setPanelVisible(true);
      },
      onTranscript: async (text, isFinal) => {
        if (!isFinal) {
          setInterimText(text);
          return;
        }
        setInterimText("");
        sendQuery(text);
      },
      onError: (error) => {
        console.warn("NEXUS Voice:", error);
      },
    });

    voice.start();

    return () => {
      cleanupRef.current = true;
      voice.stop();
      brain.abort();
      cleanupRef.current = false;
    };
  }, [booted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendQuery(inputText.trim());
      setInputText("");
    }
  }, [inputText, sendQuery]);

  const handleVoiceToggle = useCallback(() => {
    const voice = voiceRef.current;
    if (!voice) return;

    if (voice.getStatus() === "listening") {
      voice.stop();
    } else {
      voice.start();
    }
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#050510]">
      {!booted && <BootOverlay onComplete={handleBootComplete} />}
      {booted && (
        <>
          <Scene
            onSwipe={() => playSwipe()}
            onPinch={() => playPinch()}
            onRelease={() => playRelease()}
            onSelect={() => playSelect()}
          />
          <MouseFallback />
          <HandTrackingController />
          <HUD />

          <AIStatus
            status={isListening ? "listening" : aiStatus as AIStatusType}
            text={interimText}
          />

          <AIPanel
            isVisible={panelVisible}
            responseText={responseText}
            status={aiStatus as AIStatusType}
            onClose={() => setPanelVisible(false)}
          />

          {/* Text input bar */}
          <form
            onSubmit={handleInputSubmit}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[500px] max-w-[90vw]"
          >
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
              style={{
                background: "rgba(8, 8, 24, 0.85)",
                borderColor: "rgba(59, 130, 246, 0.25)",
                backdropFilter: "blur(20px)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a command or question..."
                className="flex-1 bg-transparent text-sm text-[#CBD5E1] placeholder-[#475569] font-mono outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="text-[#3B82F6] disabled:opacity-30 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>

          {/* Mic button */}
          <button
            onClick={handleVoiceToggle}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isListening ? "rgba(0, 212, 170, 0.15)" : "rgba(8, 8, 24, 0.8)",
              borderColor: isListening ? "#00D4AA" : "rgba(59, 130, 246, 0.3)",
              backdropFilter: "blur(10px)",
              boxShadow: isListening ? "0 0 20px rgba(0, 212, 170, 0.3)" : "none",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isListening ? "#00D4AA" : "#3B82F6"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
        </>
      )}
    </main>
  );
}
