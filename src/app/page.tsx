"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { BootOverlay } from "@/components/hud/BootOverlay";
import { HUD } from "@/components/hud/HUD";
import { MouseFallback } from "@/components/hand/MouseFallback";
import { HandTrackingController } from "@/components/hand/HandTrackingController";
import { useAudio } from "@/components/hud/AudioManager";
import { AIPanel } from "@/components/hud/AIPanel";
import { AIStatusIndicator } from "@/components/hud/AIStatus";
import { useNexusAI } from "@/hooks/useNexusAI";
import { useAIStore } from "@/stores/useAIStore";

const Scene = dynamic(
  () =>
    import("@/components/canvas/Scene").then((mod) => ({ default: mod.Scene })),
  { ssr: false }
);

export default function Home() {
  const [booted, setBooted] = useState(false);
  const { playSwipe, playPinch, playRelease, playSelect } = useAudio();
  const { activate, deactivate } = useNexusAI();
  const aiStatus = useAIStore((s) => s.status);
  const aiPanelVisible = useAIStore((s) => s.panelVisible);
  const setAIPanelVisible = useAIStore((s) => s.setPanelVisible);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setAIPanelVisible(!aiPanelVisible);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiPanelVisible, setAIPanelVisible]);

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
          <AIPanel
            isVisible={aiPanelVisible}
            onClose={() => setAIPanelVisible(false)}
            onActivate={() => {
              if (
                aiStatus === "idle" &&
                useAIStore.getState().apiKey
              ) {
                activate();
              } else {
                deactivate();
              }
            }}
          />
          <AIStatusIndicator />
        </>
      )}
    </main>
  );
}
