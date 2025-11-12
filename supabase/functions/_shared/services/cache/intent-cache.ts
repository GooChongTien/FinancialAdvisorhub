/**
 * Intent Classification Cache
 * In-memory cache for intent classifications to reduce LLM API calls
 * TTL: 5 minutes
 */

export interface CachedIntent {
  topic: string;
  subtopic: string;
  intent: string;
  confidence: number;
  timestamp: number;
}

export class IntentCache {
  private cache: Map<string, CachedIntent> = new Map();
  private ttl: number; // milliseconds
  private maxSize: number;

  constructor(ttlMinutes: number = 5, maxSize: number = 1000) {
    this.ttl = ttlMinutes * 60 * 1000;
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from user message and context
   */
  private getCacheKey(userMessage: string, module: string, page: string): string {
    // Normalize message (lowercase, trim)
    const normalized = userMessage.toLowerCase().trim();
    return `${normalized}:${module}:${page}`;
  }

  /**
   * Get cached intent classification
   */
  get(userMessage: string, module: string, page: string): CachedIntent | null {
    const key = this.getCacheKey(userMessage, module, page);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cached intent classification
   */
  set(
    userMessage: string,
    module: string,
    page: string,
    classification: { topic: string; subtopic: string; intent: string; confidence: number },
  ): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(userMessage, module, page);
    this.cache.set(key, {
      ...classification,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number; ttlMinutes: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMinutes: this.ttl / (60 * 1000),
    };
  }
}

// Singleton instance
let intentCacheInstance: IntentCache | null = null;

export function getIntentCache(): IntentCache {
  if (!intentCacheInstance) {
    intentCacheInstance = new IntentCache();

    // Run cleanup every 2 minutes
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        const cleared = intentCacheInstance!.cleanup();
        if (cleared > 0) {
          console.log(`[IntentCache] Cleaned up ${cleared} expired entries`);
        }
      }, 2 * 60 * 1000);
    }
  }

  return intentCacheInstance;
}
