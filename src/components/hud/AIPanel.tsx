"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIStore } from "@/stores/useAIStore";

interface AIPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onActivate: () => void;
}

export function AIPanel({ isVisible, onClose, onActivate }: AIPanelProps) {
  const apiKey = useAIStore((s) => s.apiKey);
  const setApiKey = useAIStore((s) => s.setApiKey);
  const status = useAIStore((s) => s.status);
  const history = useAIStore((s) => s.history);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            position: "fixed",
            top: "60px",
            right: "20px",
            width: "360px",
            maxHeight: "80vh",
            background: "rgba(10, 10, 30, 0.95)",
            border: "1px solid rgba(100, 150, 255, 0.2)",
            borderRadius: "16px",
            padding: "24px",
            zIndex: 200,
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#3B82F6",
                fontFamily: "var(--font-geist-mono)",
                fontSize: "13px",
                letterSpacing: "2px",
              }}
            >
              NEXUS AI
            </span>
            <button
              onClick={onClose}
              style={{
                color: "#64748B",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <label
              style={{
                color: "#94A3B8",
                fontSize: "11px",
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "1px",
              }}
            >
              GEMINI API KEY
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gemini API key..."
              style={{
                background: "rgba(15, 15, 35, 0.8)",
                border: "1px solid rgba(100, 150, 255, 0.15)",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#E2E8F0",
                fontSize: "13px",
                fontFamily: "var(--font-geist-mono)",
                outline: "none",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                background: saved ? "#00D4AA20" : "#3B82F620",
                border: `1px solid ${saved ? "#00D4AA" : "#3B82F6"}50`,
                borderRadius: "8px",
                padding: "8px",
                color: saved ? "#00D4AA" : "#3B82F6",
                fontSize: "12px",
                fontFamily: "var(--font-geist-mono)",
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              {saved ? "✓ SAVED" : "SAVE KEY"}
            </button>
          </div>

          {apiKey && (
            <button
              onClick={onActivate}
              style={{
                background:
                  status === "idle" ? "#3B82F620" : "#EF444420",
                border: `1px solid ${status === "idle" ? "#3B82F6" : "#EF4444"}50`,
                borderRadius: "8px",
                padding: "10px",
                color: status === "idle" ? "#3B82F6" : "#EF4444",
                fontSize: "12px",
                fontFamily: "var(--font-geist-mono)",
                cursor: "pointer",
                letterSpacing: "1px",
              }}
            >
              {status === "idle"
                ? "▶ ACTIVATE NEXUS VOICE"
                : "■ DEACTIVATE"}
            </button>
          )}

          {history.length > 0 && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "300px",
              }}
            >
              <span
                style={{
                  color: "#64748B",
                  fontSize: "10px",
                  fontFamily: "var(--font-geist-mono)",
                  letterSpacing: "1px",
                }}
              >
                CONVERSATION LOG
              </span>
              {history.slice(-10).map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background:
                      entry.role === "user"
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(139, 92, 246, 0.1)",
                    borderLeft: `2px solid ${entry.role === "user" ? "#3B82F6" : "#8B5CF6"}`,
                  }}
                >
                  <span
                    style={{
                      color: "#94A3B8",
                      fontSize: "9px",
                      fontFamily: "var(--font-geist-mono)",
                      letterSpacing: "1px",
                    }}
                  >
                    {entry.role === "user" ? "YOU" : "NEXUS"}
                  </span>
                  <p
                    style={{
                      color: "#E2E8F0",
                      fontSize: "12px",
                      margin: "4px 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {entry.content.slice(0, 150)}
                    {entry.content.length > 150 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
