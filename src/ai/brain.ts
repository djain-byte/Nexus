import { GoogleGenAI } from "@google/genai";
import { useAIStore } from "@/stores/useAIStore";
import { useAppStore } from "@/stores/useAppStore";

const SYSTEM_PROMPT = `You are NEXUS, an advanced AI intelligence embedded in a spatial computing environment.
You control a holographic interface with 10 floating module cards: Instagram, Stocks, Projects, Sports, Calendar, Weather, AI, News, Music, System.

PERSONALITY:
- Concise, intelligent, slightly futuristic tone
- Respond in 1-3 sentences unless asked for detail
- You are not a chatbot. You are a spatial operating system intelligence.

COMMANDS:
When the user gives a command, respond with a JSON action block on the FIRST line followed by your spoken response:
{"action": "open_card", "target": "stocks"}
Opening the Stocks module for you now.

{"action": "rotate_left"}
Rotating the interface left.

{"action": "rotate_right"}
Rotating the interface right.

Available actions:
- open_card: Opens a module card. Requires "target" (one of: instagram, stocks, projects, sports, calendar, weather, ai, news, music, system)
- close_card: Closes the currently expanded card
- rotate_left: Rotates the carousel left
- rotate_right: Rotates the carousel right
- navigate: Opens a URL. Requires "url" field

CONTEXT AWARENESS:
- If a module is currently open/expanded, you know which one it is
- "Explain this" when Stocks is open = explain stocks
- "What am I looking at?" = describe the currently focused module

If the user asks something conversational (not a command), just respond naturally without a JSON action block.`;

export interface ParsedAction {
  action: string;
  target?: string;
  url?: string;
}

export class NexusBrain {
  private client: GoogleGenAI | null = null;
  private model: string = "gemini-2.0-flash";

  initialize(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async streamResponse(userMessage: string): Promise<{
    fullText: string;
    action: ParsedAction | null;
  }> {
    if (!this.client) throw new Error("Brain not initialized");

    const store = useAIStore.getState();
    const appStore = useAppStore.getState();

    const contextParts: string[] = [];
    if (store.activeModuleContext) {
      contextParts.push(`Currently open module: ${store.activeModuleContext}`);
    }
    if (appStore.focusedCard) {
      contextParts.push(`Focused card: ${appStore.focusedCard}`);
    }

    const historyMessages = store.history.slice(-10).map((h) => ({
      role: h.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: h.content }],
    }));

    const contextPrefix =
      contextParts.length > 0
        ? `[CONTEXT: ${contextParts.join(". ")}]\n\n`
        : "";

    store.setStatus("thinking");
    store.setStreamingText("");

    try {
      const response = await this.client.models.generateContentStream({
        model: this.model,
        contents: [
          ...historyMessages,
          {
            role: "user",
            parts: [{ text: contextPrefix + userMessage }],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      store.setStatus("streaming");
      let fullText = "";

      for await (const chunk of response) {
        const text = chunk.text || "";
        fullText += text;
        store.appendStreamingText(text);
      }

      let action: ParsedAction | null = null;
      const lines = fullText.trim().split("\n");
      if (lines[0]?.startsWith("{")) {
        try {
          action = JSON.parse(lines[0]) as ParsedAction;
          const spokenText = lines.slice(1).join("\n").trim();
          store.setResponseText(spokenText);
        } catch {
          store.setResponseText(fullText);
        }
      } else {
        store.setResponseText(fullText);
      }

      store.addToHistory({
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      });
      store.addToHistory({
        role: "assistant",
        content: fullText,
        timestamp: Date.now(),
      });

      store.setStatus("speaking");
      return { fullText, action };
    } catch (error) {
      console.error("Gemini error:", error);
      store.setStatus("idle");
      throw error;
    }
  }
}

export const nexusBrain = new NexusBrain();
