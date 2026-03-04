interface CacheEntry {
  text: string;
  timestamp: number;
}

export class CompletionCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 100, ttlMs = 30_000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  static makeKey(
    uri: string,
    line: number,
    char: number,
    lineText: string,
    prevLineText: string
  ): string {
    return `${uri}:${line}:${char}:${lineText}:${prevLineText}`;
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.text;
  }

  set(key: string, text: string): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { text, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}
