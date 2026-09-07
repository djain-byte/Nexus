"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface AIPanelProps {
  isVisible: boolean;
  responseText: string;
  status: "idle" | "listening" | "thinking" | "speaking" | "error";
  onClose: () => void;
}

export function AIPanel({ isVisible, responseText, status, onClose }: AIPanelProps) {
  const [displayText, setDisplayText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  useEffect(() => {
    if (!responseText) {
      setDisplayText("");
      return;
    }

    let index = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      if (index < responseText.length) {
        setDisplayText(responseText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [responseText]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayText]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto w-[480px] max-w-[90vw]">
      <div
        className="relative rounded-2xl border overflow-hidden"
        style={{
          background: "rgba(8, 8, 24, 0.85)",
          borderColor: "rgba(59, 130, 246, 0.25)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(59, 130, 246, 0.1), inset 0 0 60px rgba(5, 5, 16, 0.5)",
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: "rgba(59, 130, 246, 0.15)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            <span className="text-[10px] tracking-[0.15em] text-[#64748B] font-mono uppercase">
              NEXUS AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-white transition-colors text-xs font-mono"
          >
            [ESC]
          </button>
        </div>

        {/* Content area */}
        <div
          ref={containerRef}
          className="px-5 py-4 max-h-[300px] overflow-y-auto scrollbar-thin"
        >
          {status === "thinking" && !displayText && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[10px] tracking-[0.15em] text-[#8B5CF6] font-mono">
                PROCESSING
              </span>
            </div>
          )}

          {displayText && (
            <div className="text-sm text-[#CBD5E1] font-mono leading-relaxed whitespace-pre-wrap">
              {displayText}
              {status === "speaking" && (
                <span
                  className="inline-block w-[2px] h-[14px] ml-0.5 align-middle"
                  style={{
                    backgroundColor: "#06B6D4",
                    opacity: cursorVisible ? 1 : 0,
                  }}
                />
              )}
            </div>
          )}

          {status === "error" && (
            <div className="text-xs text-[#EF4444] font-mono py-1">
              Connection error. Please try again.
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: "rgba(59, 130, 246, 0.1)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  status === "thinking"
                    ? "#8B5CF6"
                    : status === "speaking"
                    ? "#06B6D4"
                    : status === "error"
                    ? "#EF4444"
                    : "#3B82F6",
              }}
            />
            <span className="text-[9px] tracking-[0.2em] text-[#475569] font-mono uppercase">
              {status === "thinking"
                ? "ANALYZING"
                : status === "speaking"
                ? "RESPONSE"
                : status === "error"
                ? "OFFLINE"
                : "READY"}
            </span>
          </div>
          <span className="text-[9px] text-[#334155] font-mono">
            {displayText.length > 0 ? `${displayText.length} chars` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
