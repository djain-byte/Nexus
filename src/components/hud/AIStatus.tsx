"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAIStore } from "@/stores/useAIStore";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; pulse: boolean }
> = {
  idle: { label: "NEXUS IDLE", color: "#3B82F6", pulse: false },
  listening: { label: "LISTENING", color: "#00D4AA", pulse: true },
  thinking: { label: "THINKING", color: "#8B5CF6", pulse: true },
  speaking: { label: "SPEAKING", color: "#06B6D4", pulse: true },
  streaming: { label: "STREAMING", color: "#00D4AA", pulse: true },
  interrupted: { label: "INTERRUPTED", color: "#F59E0B", pulse: false },
  offline: { label: "OFFLINE", color: "#EF4444", pulse: false },
};

export function AIStatusIndicator() {
  const status = useAIStore((s) => s.status);
  const interimTranscript = useAIStore((s) => s.interimTranscript);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: "rgba(15, 15, 35, 0.8)",
              border: "1px solid rgba(100, 150, 255, 0.2)",
              borderRadius: "12px",
              padding: "8px 16px",
              color: "#E2E8F0",
              fontSize: "14px",
              fontFamily: "var(--font-geist-mono)",
              maxWidth: "400px",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            {interimTranscript}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          boxShadow: config.pulse
            ? [
                `0 0 10px ${config.color}40`,
                `0 0 25px ${config.color}60`,
                `0 0 10px ${config.color}40`,
              ]
            : `0 0 10px ${config.color}20`,
        }}
        transition={
          config.pulse ? { duration: 1.5, repeat: Infinity } : {}
        }
        style={{
          background: "rgba(15, 15, 35, 0.9)",
          border: `1px solid ${config.color}50`,
          borderRadius: "20px",
          padding: "6px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: config.color,
            boxShadow: `0 0 6px ${config.color}`,
          }}
        />
        <span
          style={{
            color: config.color,
            fontSize: "11px",
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "2px",
            fontWeight: 600,
          }}
        >
          {config.label}
        </span>
      </motion.div>
    </motion.div>
  );
}
