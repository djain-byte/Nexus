export interface MemoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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

  getLast(n: number = 5): MemoryEntry[] {
    return this.entries.slice(-n);
  }

  getContextSummary(): string {
    if (this.entries.length === 0) return "No prior conversation.";

    const recent = this.entries.slice(-6);
    return recent
      .map((e) => `${e.role === "user" ? "User" : "NEXUS"}: ${e.content.slice(0, 100)}`)
      .join("\n");
  }

  clear() {
    this.entries = [];
  }

  size(): number {
    return this.entries.length;
  }
}
