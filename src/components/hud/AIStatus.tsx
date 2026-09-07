"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

export type AIStatusType = "idle" | "listening" | "thinking" | "speaking" | "error";

interface AIStatusProps {
  status: AIStatusType;
  text?: string;
}

const STATUS_CONFIG: Record<AIStatusType, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "NEXUS IDLE", color: "#3B82F6", pulse: false },
  listening: { label: "LISTENING", color: "#00D4AA", pulse: true },
  thinking: { label: "THINKING", color: "#8B5CF6", pulse: true },
  speaking: { label: "SPEAKING", color: "#06B6D4", pulse: false },
  error: { label: "ERROR", color: "#EF4444", pulse: false },
};

export function AIStatus({ status, text }: AIStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className="relative">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          {config.pulse && (
            <div
              className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: config.color, opacity: 0.4 }}
            />
          )}
        </div>

        {/* Status label */}
        <span
          className="text-[10px] tracking-[0.2em] font-mono uppercase"
          style={{ color: config.color }}
        >
          {config.label}
        </span>

        {/* Interim text */}
        {text && status === "listening" && (
          <span className="text-[10px] tracking-wider font-mono text-white/40 max-w-[200px] truncate">
            &quot;{text}&quot;
          </span>
        )}
      </div>
    </div>
  );
}
