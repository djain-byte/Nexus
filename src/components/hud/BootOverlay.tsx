"use client";

import { useState, useEffect } from "react";
import { useGestureStore } from "@/stores/useGestureStore";

interface BootOverlayProps {
  onComplete: () => void;
}

export function BootOverlay({ onComplete }: BootOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"init" | "loading" | "ready">("init");
  const [lines, setLines] = useState<string[]>([]);
  const { tracking } = useGestureStore();

  const bootMessages = [
    "NEXUS OS INITIALIZING...",
    "LOADING RENDER ENGINE...",
    "GPU ACCELERATION: ACTIVE",
    "PARTICLE SYSTEM: READY",
    "SCENE GRAPH: BUILT",
    "GESTURE ENGINE: STANDBY",
    "HOLOGRAPHIC DISPLAY: ON",
    "SYSTEM READY",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(timer);
          setPhase("ready");
          setTimeout(onComplete, 800);
          return 100;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const msgIndex = Math.floor((progress / 100) * bootMessages.length);
    if (msgIndex < bootMessages.length) {
      const msg = bootMessages[msgIndex];
      setLines((prev) => {
        if (prev[prev.length - 1] === msg) return prev;
        return [...prev.slice(-5), msg];
      });
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md w-full px-8">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-[0.5em] text-blue-400/90">
            NEXUS
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-slate-600">
            SPATIAL OPERATING SYSTEM
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-px bg-slate-800 w-full">
            <div
              className="h-full bg-gradient-to-r from-blue-500/80 to-cyan-400/80 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-slate-600 tracking-widest">
              {progress}%
            </span>
            <span className="text-[9px] text-blue-400/50 tracking-widest">
              {phase === "ready" ? "COMPLETE" : "LOADING"}
            </span>
          </div>
        </div>

        {/* Boot messages */}
        <div className="space-y-1 text-left">
          {lines.map((line, i) => (
            <div
              key={i}
              className="text-[10px] tracking-wider"
              style={{
                color:
                  i === lines.length - 1
                    ? "rgba(59,130,246,0.7)"
                    : "rgba(100,116,139,0.5)",
                opacity: 0.3 + (i / lines.length) * 0.7,
              }}
            >
              {">"} {line}
            </div>
          ))}
        </div>
      </div>

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.03) 2px, rgba(59,130,246,0.03) 4px)",
        }}
      />
    </div>
  );
}
