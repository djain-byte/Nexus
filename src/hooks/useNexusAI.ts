"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAIStore } from "@/stores/useAIStore";
import { useAppStore } from "@/stores/useAppStore";
import { useGestureStore } from "@/stores/useGestureStore";
import { nexusBrain } from "@/ai/brain";
import { VoiceManager } from "@/ai/voice";
import { commandEngine } from "@/ai/commands";
import { audioManager } from "@/components/hud/AudioManager";

export function useNexusAI() {
  const voiceRef = useRef<VoiceManager | null>(null);
  const isActiveRef = useRef(false);
  const processingRef = useRef(false);

  const apiKey = useAIStore((s) => s.apiKey);
  const status = useAIStore((s) => s.status);
  const setStatus = useAIStore.getState().setStatus;
  const setIsListening = useAIStore.getState().setIsListening;
  const setInterimTranscript = useAIStore.getState().setInterimTranscript;
  const setWakeWordActive = useAIStore.getState().setWakeWordActive;
  const setActiveModuleContext =
    useAIStore.getState().setActiveModuleContext;

  const activeModule = useAppStore((s) => s.activeModule);
  useEffect(() => {
    setActiveModuleContext(activeModule);
  }, [activeModule, setActiveModuleContext]);

  const gestureType = useGestureStore((s) => s.currentGesture.type);
  const prevGestureRef = useRef<string>("none");

  useEffect(() => {
    if (
      gestureType === "circle" &&
      prevGestureRef.current !== "circle" &&
      isActiveRef.current
    ) {
      handleWake();
    }
    prevGestureRef.current = gestureType || "none";
  });

  const handleWake = useCallback(() => {
    setWakeWordActive(true);
    setStatus("listening");
    audioManager.playWakeSound();
    if (voiceRef.current) {
      voiceRef.current.stopListening();
      voiceRef.current.startListening(true);
    }
    setTimeout(() => setWakeWordActive(false), 3000);
  }, [setStatus, setWakeWordActive]);

  const processUserInput = useCallback(
    async (text: string) => {
      if (processingRef.current || !text.trim()) return;
      processingRef.current = true;

      try {
        if (voiceRef.current?.getIsSpeaking()) {
          voiceRef.current.interrupt();
          setStatus("interrupted");
          await new Promise((r) => setTimeout(r, 300));
        }

        setInterimTranscript("");
        setStatus("thinking");
        audioManager.playResponseStart();

        const { action } = await nexusBrain.streamResponse(text);

        if (action) {
          commandEngine.execute(action);
        }

        const responseText = useAIStore.getState().responseText;
        if (responseText) {
          await voiceRef.current?.speak(responseText);
        }

        setStatus("idle");

        if (isActiveRef.current && voiceRef.current) {
          voiceRef.current.stopListening();
          voiceRef.current.startListening(false);
        }
      } catch (error) {
        console.error("AI processing error:", error);
        setStatus("idle");
      } finally {
        processingRef.current = false;
      }
    },
    [setStatus, setInterimTranscript]
  );

  const activate = useCallback(() => {
    if (!apiKey) return;

    nexusBrain.initialize(apiKey);
    isActiveRef.current = true;
    audioManager.playActivation();

    voiceRef.current = new VoiceManager(
      {
        onTranscript: (text, isFinal) => {
          setInterimTranscript(text);
          if (isFinal) {
            processUserInput(text);
          }
        },
        onWakeWord: () => {
          handleWake();
        },
        onStatusChange: (voiceStatus) => {
          if (voiceStatus === "listening") {
            setIsListening(true);
          } else if (voiceStatus === "idle") {
            setIsListening(false);
          }
        },
        onError: (error) => {
          console.error("Voice error:", error);
        },
        onSpeechEnd: () => {},
      },
      "nexus"
    );

    voiceRef.current.startListening(false);
    setStatus("idle");
  }, [
    apiKey,
    handleWake,
    processUserInput,
    setStatus,
    setIsListening,
    setInterimTranscript,
  ]);

  const deactivate = useCallback(() => {
    isActiveRef.current = false;
    voiceRef.current?.destroy();
    voiceRef.current = null;
    setStatus("idle");
    setIsListening(false);
    setInterimTranscript("");
  }, [setStatus, setIsListening, setInterimTranscript]);

  useEffect(() => {
    return () => {
      voiceRef.current?.destroy();
    };
  }, []);

  return {
    activate,
    deactivate,
    isActive: isActiveRef.current,
    processUserInput,
  };
}
