"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useGestureStore } from "@/stores/useGestureStore";

export function HUD() {
  const { fps, quality } = useAppStore();
  const { currentGesture, handDetected, tracking: trackStatus } = useGestureStore();
  const [time, setTime] = useState(new Date());
  const [systemLog, setSystemLog] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentGesture.type !== "none" && currentGesture.type !== "idle") {
      setSystemLog((prev) => {
        const next = [
          `[${time.toLocaleTimeString()}] ${currentGesture.type} (${Math.round(currentGesture.confidence * 100)}%) spd:${currentGesture.speed.toFixed(2)}`,
          ...prev,
        ];
        return next.slice(0, 6);
      });
    }
  }, [currentGesture, time]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const gestureLabel = (type: string) => {
    const labels: Record<string, string> = {
      swipe_left: "SWIPE LEFT",
      swipe_right: "SWIPE RIGHT",
      slow_scroll_left: "SCROLL SLOW LEFT",
      slow_scroll_right: "SCROLL SLOW RIGHT",
      fast_scroll_left: "SCROLL FAST LEFT",
      fast_scroll_right: "SCROLL FAST RIGHT",
      pinch_start: "PINCH",
      pinch_hold: "HOLDING PINCH",
      pinch_release: "RELEASED",
      pull_toward: "PULL TOWARD",
      push_away: "PUSH AWAY",
      palm_still: "PALM STILL",
      open_hand: "OPEN HAND",
      closed_fist: "FIST",
      point: "POINTING",
      thumbs_up: "THUMBS UP",
      victory: "VICTORY",
      iloveyou: "I LOVE YOU",
      idle: "TRACKING",
    };
    return labels[type] || type.toUpperCase();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 font-mono text-xs select-none">
      {/* Top Left - System Status */}
      <div className="absolute top-4 left-4 space-y-1">
        <div className="flex items-center gap-2 text-blue-400/70">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="tracking-widest text-[10px]">NEXUS OS v0.1.0</span>
        </div>
        <div className="text-slate-500 text-[10px] tracking-wider">
          FPS: <span className="text-blue-400/80">{fps}</span>
        </div>
        <div className="text-slate-500 text-[10px] tracking-wider">
          TRACKING:{" "}
          <span
            className={
              trackStatus === "active"
                ? "text-emerald-400/80"
                : trackStatus === "initializing"
                ? "text-amber-400/80"
                : "text-red-400/60"
            }
          >
            {trackStatus.toUpperCase()}
          </span>
        </div>
        <div className="text-slate-500 text-[10px] tracking-wider">
          GPU: <span className="text-blue-400/60">{quality.toUpperCase()}</span>
        </div>
      </div>

      {/* Top Right - Clock & Date */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-blue-400/80 text-lg tracking-[0.2em] font-light">
          {formatTime(time)}
        </div>
        <div className="text-slate-500 text-[10px] tracking-widest mt-0.5">
          {formatDate(time).toUpperCase()}
        </div>
      </div>

      {/* Bottom Right - Active Gesture */}
      <div className="absolute bottom-4 right-4 text-right space-y-1">
        {handDetected && currentGesture.type !== "none" && (
          <>
            <div className="text-cyan-400/80 text-[10px] tracking-widest">
              {gestureLabel(currentGesture.type)}
            </div>
            <div className="text-slate-500 text-[10px] tracking-wider">
              CONF: <span className="text-cyan-400/60">{Math.round(currentGesture.confidence * 100)}%</span>
            </div>
            {currentGesture.speed > 0 && (
              <div className="text-slate-500 text-[10px] tracking-wider">
                SPD: <span className="text-cyan-400/60">{currentGesture.speed.toFixed(2)}</span>
              </div>
            )}
            <div className="text-slate-500 text-[10px] tracking-wider">
              DEPTH: <span className="text-cyan-400/60">{currentGesture.depth.toFixed(3)}</span>
            </div>
          </>
        )}
        {handDetected && currentGesture.type === "idle" && (
          <div className="text-emerald-400/50 text-[10px] tracking-widest">
            TRACKING
          </div>
        )}
        {!handDetected && (
          <div className="text-slate-600 text-[10px] tracking-widest">
            AWAITING INPUT
          </div>
        )}
      </div>

      {/* Bottom Left - System Log */}
      <div className="absolute bottom-4 left-4 space-y-0.5 max-w-xs">
        {systemLog.map((log, i) => (
          <div
            key={i}
            className="text-slate-600 text-[9px] tracking-wider"
            style={{ opacity: 1 - i * 0.15 }}
          >
            {log}
          </div>
        ))}
      </div>

      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 border border-blue-400/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-blue-400/30 rounded-full" />
      </div>

      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.015) 2px, rgba(59,130,246,0.015) 4px)",
        }}
      />
    </div>
  );
}
