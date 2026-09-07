export interface ParsedCommand {
  action: string;
  params: Record<string, unknown>;
  confidence: number;
}

interface CommandPattern {
  patterns: RegExp[];
  action: string;
  extractParams?: (match: RegExpMatchArray) => Record<string, unknown>;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  {
    patterns: [
      /open\s+(?:the\s+)?(?:app\s+)?(.+)/i,
      /launch\s+(?:the\s+)?(?:app\s+)?(.+)/i,
      /show\s+(?:the\s+)?(?:app\s+)?(.+)/i,
      /go\s+to\s+(?:the\s+)?(?:app\s+)?(.+)/i,
    ],
    action: "open_card",
    extractParams: (m) => ({ card: m[1].toLowerCase().trim() }),
  },
  {
    patterns: [
      /close\s+(?:the\s+)?(?:app|card|panel)/i,
      /go\s+back/i,
      /back\s+to\s+home/i,
    ],
    action: "close_card",
    extractParams: () => ({}),
  },
  {
    patterns: [
      /rotate\s+(?:to\s+)?(?:the\s+)?left/i,
      /scroll\s+left/i,
      /swipe\s+left/i,
    ],
    action: "rotate",
    extractParams: () => ({ direction: "left", speed: "slow" }),
  },
  {
    patterns: [
      /rotate\s+(?:to\s+)?(?:the\s+)?right/i,
      /scroll\s+right/i,
      /swipe\s+right/i,
    ],
    action: "rotate",
    extractParams: () => ({ direction: "right", speed: "slow" }),
  },
  {
    patterns: [
      /fast\s+(?:scroll|rotate|swipe)\s+(left|right)/i,
      /quick(?:ly)?\s+(?:scroll|rotate|swipe)\s+(left|right)/i,
    ],
    action: "rotate",
    extractParams: (m) => ({ direction: m[1].toLowerCase(), speed: "fast" }),
  },
  {
    patterns: [
      /what(?:'s| is)\s+(?:the\s+)?(?:system\s+)?status/i,
      /system\s+(?:status|info|info(?:rmation)?)/i,
      /show\s+(?:me\s+)?(?:system\s+)?status/i,
      /diagnostics/i,
    ],
    action: "system_status",
    extractParams: () => ({}),
  },
  {
    patterns: [
      /remind\s+me\s+(?:to\s+)?(.+?)(?:\s+(?:at|in|on|tomorrow|today)\s+(.+))?$/i,
      /set\s+(?:a\s+)?reminder\s+(?:for\s+)?(.+?)(?:\s+(?:at|in|on|tomorrow|today)\s+(.+))?$/i,
    ],
    action: "set_reminder",
    extractParams: (m) => ({
      text: m[1]?.trim() || "",
      time: m[2]?.trim() || "later",
    }),
  },
  {
    patterns: [
      /search\s+(?:for\s+)?(.+)/i,
      /look\s+up\s+(.+)/i,
      /find\s+(.+)/i,
    ],
    action: "search",
    extractParams: (m) => ({ query: m[1].trim() }),
  },
  {
    patterns: [
      /play\s+(?:the\s+)?(?:song|music|track)?\s*(.+)/i,
      /put\s+on\s+(.+)/i,
    ],
    action: "play_music",
    extractParams: (m) => ({ query: m[1]?.trim() || "" }),
  },
];

const CARD_ALIASES: Record<string, string> = {
  ig: "instagram",
  insta: "instagram",
  stonks: "stocks",
  stock: "stocks",
  market: "stocks",
  proj: "projects",
  project: "projects",
  work: "projects",
  sports: "sports",
  score: "sports",
  game: "sports",
  cal: "calendar",
  schedule: "calendar",
  events: "calendar",
  weather: "weather",
  forecast: "weather",
  temp: "weather",
  ai: "ai",
  assistant: "ai",
  brain: "ai",
  news: "news",
  feed: "news",
  articles: "news",
  music: "music",
  song: "music",
  player: "music",
  sys: "system",
  system: "system",
  settings: "system",
  info: "system",
};

export class CommandEngine {
  parse(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    for (const cmd of COMMAND_PATTERNS) {
      for (const pattern of cmd.patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const params = cmd.extractParams ? cmd.extractParams(match) : {};

          // Normalize card aliases
          if (params.card && typeof params.card === "string") {
            params.card = CARD_ALIASES[params.card] || params.card;
          }

          return {
            action: cmd.action,
            params,
            confidence: 0.9,
          };
        }
      }
    }

    return null;
  }

  getAvailableActions(): string[] {
    return [...new Set(COMMAND_PATTERNS.map((c) => c.action))];
  }

  getCardAliases(): Record<string, string> {
    return { ...CARD_ALIASES };
  }
}
