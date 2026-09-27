/**
 * Object URL Cache Service
 * Provides reference-counted browser object URL lifecycle management.
 * Guarantees URLs are shared between consumers (e.g. Split and Read modes)
 * and only revoked when refCount reaches 0.
 */

export interface CacheEntry {
  url: string;
  refCount: number;
  sub: string;
}

export class ObjectUrlCacheService {
  private cache = new Map<string, CacheEntry>();

  /**
   * Acquire a browser object URL for a given cache key.
   * If already cached, increments the reference count.
   * Otherwise calls creator to generate `URL.createObjectURL(blob)`.
   */
  acquire(key: string, sub: string, createUrlFn: () => string): string {
    const existing = this.cache.get(key);
    if (existing) {
      existing.refCount += 1;
      return existing.url;
    }

    const url = createUrlFn();
    this.cache.set(key, {
      url,
      refCount: 1,
      sub,
    });
    return url;
  }

  /**
   * Release an acquired URL.
   * Decrements refCount. Revokes object URL when refCount reaches 0.
   */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    entry.refCount -= 1;
    if (entry.refCount <= 0) {
      try {
        if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(entry.url);
        }
      } catch {}
      this.cache.delete(key);
    }
  }

  /**
   * Get entry details for testing or inspection.
   */
  get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  getRefCount(key: string): number {
    return this.cache.get(key)?.refCount ?? 0;
  }

  getUrl(key: string): string | null {
    return this.cache.get(key)?.url ?? null;
  }

  /**
   * Clear and revoke all cached URLs belonging to a specific user sub.
   * Executed on logout, account switch, or account deletion.
   */
  clearUser(sub: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.sub === sub) {
        try {
          if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
            URL.revokeObjectURL(entry.url);
          }
        } catch {}
        this.cache.delete(key);
      }
    }
  }

  /**
   * Full cache teardown (used for tests and global reset).
   */
  clearAll(): void {
    for (const entry of this.cache.values()) {
      try {
        if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
          URL.revokeObjectURL(entry.url);
        }
      } catch {}
    }
    this.cache.clear();
  }

  /**
   * Number of active cached URLs.
   */
  size(): number {
    return this.cache.size;
  }
}

export const objectUrlCache = new ObjectUrlCacheService();
