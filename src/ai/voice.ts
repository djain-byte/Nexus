/* eslint-disable @typescript-eslint/no-explicit-any */
export type VoiceStatus = "idle" | "listening" | "processing" | "speaking" | "error";

export interface VoiceConfig {
  wakeWord?: string;
  language?: string;
  continuous?: boolean;
}

interface VoiceCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onWakeWord?: () => void;
  onStatusChange?: (status: VoiceStatus) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceManager {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private wakeWord: string;
  private language: string;
  private continuous: boolean;
  private status: VoiceStatus = "idle";
  private callbacks: VoiceCallbacks = {};
  private isListening = false;
  private wakeWordMode = true;

  constructor(config: VoiceConfig = {}) {
    this.wakeWord = config.wakeWord || "nexus";
    this.language = config.language || "en-US";
    this.continuous = config.continuous !== false;

    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis;
    }
  }

  onCallbacks(cb: VoiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  private setStatus(status: VoiceStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  isSupported(): boolean {
    return !!(
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  start() {
    if (!this.isSupported()) {
      this.callbacks.onError?.("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const fullText = (finalText || interimText).toLowerCase().trim();

      if (this.wakeWordMode) {
        if (fullText.includes(this.wakeWord)) {
          this.wakeWordMode = false;
          this.callbacks.onWakeWord?.();
          this.setStatus("listening");
          const cleaned = fullText.replace(this.wakeWord, "").trim();
          if (cleaned) {
            this.callbacks.onTranscript?.(cleaned, !!finalText);
          }
        }
        return;
      }

      if (interimText) {
        this.callbacks.onTranscript?.(interimText, false);
      }

      if (finalText) {
        this.callbacks.onTranscript?.(finalText, true);
        this.wakeWordMode = true;
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return;
      if (event.error === "aborted") return;
      this.callbacks.onError?.(`Speech error: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition?.start();
        } catch {
          // already started
        }
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      this.setStatus("listening");
    } catch {
      this.callbacks.onError?.("Failed to start speech recognition");
    }
  }

  stop() {
    this.isListening = false;
    this.wakeWordMode = true;
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
    this.setStatus("idle");
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      utterance.rate = options?.rate || 1.05;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 0.9;

      const voices = this.synthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.lang.startsWith("en")
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => this.setStatus("speaking");
      utterance.onend = () => {
        this.setStatus("idle");
        resolve();
      };
      utterance.onerror = () => {
        this.setStatus("error");
        reject(new Error("Speech synthesis error"));
      };

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    this.synthesis?.cancel();
    this.setStatus("idle");
  }

  getStatus(): VoiceStatus {
    return this.status;
  }

  setWakeWordMode(enabled: boolean) {
    this.wakeWordMode = enabled;
  }

  isWakeWordMode(): boolean {
    return this.wakeWordMode;
  }
}
