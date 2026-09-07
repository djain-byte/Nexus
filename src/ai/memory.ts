export interface MemoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  moduleContext?: string;
}

export class ConversationMemory {
  private entries: MemoryEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 20) {
    this.maxEntries = maxEntries;
  }

  add(entry: MemoryEntry) {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  getHistory(): MemoryEntry[] {
    return [...this.entries];
  }

  getContextSummary(): string {
    if (this.entries.length === 0) return "No prior conversation.";

    const recent = this.entries.slice(-5);
    return recent
      .map((e) => `${e.role}: ${e.content.slice(0, 100)}`)
      .join("\n");
  }

  clear() {
    this.entries = [];
  }
}
