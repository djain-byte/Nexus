/* eslint-disable @typescript-eslint/no-explicit-any */

export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

interface VoiceCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onWakeWord: () => void;
  onStatusChange: (status: VoiceStatus) => void;
  onError: (error: string) => void;
  onSpeechEnd: () => void;
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
  private callbacks: VoiceCallbacks;
  private wakeWord: string;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor(callbacks: VoiceCallbacks, wakeWord: string = "nexus") {
    this.callbacks = callbacks;
    this.wakeWord = wakeWord.toLowerCase();

    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis;
      this.selectVoice();
    }
  }

  private selectVoice() {
    if (!this.synthesis) return;

    const pickVoice = () => {
      const voices = this.synthesis!.getVoices();
      this.preferredVoice =
        voices.find((v) => v.name.includes("Samantha")) ||
        voices.find((v) => v.name.includes("Google UK English Female")) ||
        voices.find((v) => v.name.includes("Google US English")) ||
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices[0] ||
        null;
    };

    pickVoice();
    this.synthesis.onvoiceschanged = pickVoice;
  }

  startListening(directMode: boolean = false) {
    if (this.isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.callbacks.onError(
        "Speech recognition not supported in this browser"
      );
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (
        !directMode &&
        interimTranscript.toLowerCase().includes(this.wakeWord)
      ) {
        this.callbacks.onWakeWord();
        return;
      }

      if (interimTranscript) {
        this.callbacks.onTranscript(interimTranscript, false);
      }

      if (finalTranscript) {
        if (
          !directMode &&
          finalTranscript.toLowerCase().includes(this.wakeWord)
        ) {
          this.callbacks.onWakeWord();
          const afterWake = finalTranscript
            .toLowerCase()
            .split(this.wakeWord)
            .pop()
            ?.trim();
          if (afterWake && afterWake.length > 2) {
            this.callbacks.onTranscript(afterWake, true);
          }
        } else {
          this.callbacks.onTranscript(finalTranscript, true);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        this.callbacks.onError(`Recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch {
          // Already started
        }
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      this.callbacks.onStatusChange("listening");
    } catch {
      this.callbacks.onError("Failed to start speech recognition");
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    this.callbacks.onStatusChange("idle");
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis || !text.trim()) {
        resolve();
        return;
      }

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks.onStatusChange("speaking");
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onSpeechEnd();
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.synthesis.speak(utterance);
    });
  }

  interrupt() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.callbacks.onStatusChange("idle");
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  destroy() {
    this.stopListening();
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}
