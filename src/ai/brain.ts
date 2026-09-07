import { ConversationMemory } from "./memory";
import { CommandEngine } from "./commands";

export type AIStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface AIConfig {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are NEXUS, an advanced AI operating system intelligence embedded in a spatial computing environment. You control a holographic interface with 10 floating cards (Instagram, Stocks, Projects, Sports, Calendar, Weather, AI, News, Music, System).

PERSONALITY:
- Concise, intelligent, slightly futuristic tone
- Respond in 1-3 sentences unless asked for detail

COMMANDS:
When the user gives a command, respond with a JSON action block on the first line:
{ "action": "<command>", "params": {} }

Available actions:
- open_card: { card: "instagram"|"stocks"|"projects"|"sports"|"calendar"|"weather"|"ai"|"news"|"music"|"system" }
- close_card: {}
- rotate: { direction: "left"|"right", speed: "slow"|"fast" }
- system_status: {}

For general conversation, just respond normally without JSON.`;

export class NexusBrain {
  private apiKey: string;
  private model: string;
  private systemPrompt: string;
  private memory: ConversationMemory;
  private commandEngine: CommandEngine;
  private status: AIStatus = "idle";
  private statusListeners: Set<(status: AIStatus) => void> = new Set();
  private abortController: AbortController | null = null;

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-3.5-flash-lite";
    this.systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    this.memory = new ConversationMemory(20);
    this.commandEngine = new CommandEngine();
  }

  getStatus(): AIStatus {
    return this.status;
  }

  onStatusChange(listener: (status: AIStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: AIStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  async *streamQuery(
    userMessage: string,
    context?: { activeCard?: string; gesture?: string }
  ): AsyncGenerator<{ text: string; done: boolean }> {
    this.setStatus("thinking");
    this.abortController = new AbortController();

    const commandResult = this.commandEngine.parse(userMessage);
    if (commandResult) {
      const responseText = `Executing: ${commandResult.action}`;
      this.memory.add({ role: "user", content: userMessage, timestamp: Date.now() });
      this.memory.add({ role: "assistant", content: responseText, timestamp: Date.now() });
      this.setStatus("idle");
      yield { text: JSON.stringify(commandResult) + "\n\n" + responseText, done: true };
      return;
    }

    this.memory.add({ role: "user", content: userMessage, timestamp: Date.now() });

    const contextBlock = context
      ? `\n[CONTEXT: Active card: ${context.activeCard || "none"}, Last gesture: ${context.gesture || "none"}]`
      : "";

    const history = this.memory.getHistory();
    const contents = history.map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: entry.content }],
    }));

    try {
      console.log("[NEXUS Brain] Calling Gemini API with model:", this.model);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: this.systemPrompt + contextBlock }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
            },
          }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[NEXUS Brain] API error:", response.status, errorBody);
        throw new Error(`API error ${response.status}: ${errorBody}`);
      }

      this.setStatus("speaking");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                fullResponse += text;
                yield { text, done: false };
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      console.log("[NEXUS Brain] Full response:", fullResponse);

      this.memory.add({
        role: "assistant",
        content: fullResponse,
        timestamp: Date.now(),
      });

      yield { text: "", done: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        yield { text: "", done: true };
      } else {
        console.error("[NEXUS Brain] Error:", err);
        this.setStatus("error");
        yield { text: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, done: true };
      }
    } finally {
      this.abortController = null;
      if (this.status !== "error") {
        this.setStatus("idle");
      }
    }
  }

  abort() {
    this.abortController?.abort();
    this.setStatus("idle");
  }

  getMemory(): ConversationMemory {
    return this.memory;
  }

  getCommandEngine(): CommandEngine {
    return this.commandEngine;
  }
}
