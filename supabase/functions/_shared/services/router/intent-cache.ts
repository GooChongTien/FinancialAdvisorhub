/**
 * Intent Classification Cache
 *
 * Caches intent classification results to reduce LLM API calls for repeated queries.
 * Uses in-memory Map with TTL expiration.
 *
 * Cache key format: `${userMessage}:${context.module}:${context.page}`
 * TTL: 5 minutes (configurable)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class IntentCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private ttlMs: number;
  private maxSize: number;
  private cleanupIntervalId?: number;

  constructor(options: { ttlMs?: number; maxSize?: number; cleanupIntervalMs?: number } = {}) {
    this.cache = new Map();
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000; // Default: 5 minutes
    this.maxSize = options.maxSize ?? 1000; // Default: 1000 entries

    // Set up periodic cleanup
    const cleanupIntervalMs = options.cleanupIntervalMs ?? 60 * 1000; // Default: 1 minute
    if (cleanupIntervalMs > 0) {
      this.cleanupIntervalId = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  /**
   * Generate a cache key from user message and context
   */
  static generateKey(userMessage: string, context?: { module?: string; page?: string }): string {
    const normalizedMessage = userMessage.trim().toLowerCase();
    const module = context?.module || "unknown";
    const page = context?.page || "unknown";
    return `${normalizedMessage}:${module}:${page}`;
  }

  /**
   * Get a value from the cache
   * Returns undefined if key doesn't exist or has expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache with TTL
   */
  set(key: string, value: T, customTtlMs?: number): void {
    const ttl = customTtlMs ?? this.ttlMs;
    const expiresAt = Date.now() + ttl;

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    // Remove the first 10% of entries (FIFO)
    const toRemove = Math.max(1, Math.floor(this.maxSize * 0.1));
    const keys = Array.from(this.cache.keys());

    for (let i = 0; i < toRemove && i < keys.length; i++) {
      this.cache.delete(keys[i]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    };
  }

  /**
   * Destroy the cache and stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupIntervalId !== undefined) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
    this.clear();
  }
}

/**
 * Singleton instance for intent classification caching
 */
let intentCacheInstance: IntentCache<unknown> | null = null;

export function getIntentCache<T = unknown>(): IntentCache<T> {
  if (!intentCacheInstance) {
    intentCacheInstance = new IntentCache<T>({
      ttlMs: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupIntervalMs: 60 * 1000, // Cleanup every minute
    });
  }
  return intentCacheInstance as IntentCache<T>;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetIntentCache(): void {
  if (intentCacheInstance) {
    intentCacheInstance.destroy();
    intentCacheInstance = null;
  }
}

export default IntentCache;
