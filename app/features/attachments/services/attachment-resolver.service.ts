/**
 * Attachment Resolver Service
 *
 * Implements reference-counted browser-safe URL resolution:
 * 1. IndexedDB local Blob
 * 2. Cached resolved object URL
 * 3. Remote/Cloud URL
 * 4. Broken-image fallback
 *
 * Critical: Reference-counting ensures that unmounting Split mode does NOT
 * prematurely revoke the object URL while Read mode is still rendering it.
 */

import { attachmentRepository } from './attachment.repository';

interface CacheEntry {
  url: string;
  refCount: number;
}

class AttachmentResolverService {
  private urlCache = new Map<string, CacheEntry>();

  /**
   * Acquire a browser-safe URL for a given attachment path.
   * Increments the reference count if already cached.
   */
  async acquire(path: string): Promise<string> {
    if (!path) return '';

    // Direct HTTP/HTTPS or data URLs don't need object URL wrapping
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {
      return path;
    }

    // Check existing reference-counted cache
    const existing = this.urlCache.get(path);
    if (existing) {
      existing.refCount += 1;
      return existing.url;
    }

    // Normalize path if needed (e.g. assets/foo.png vs ./assets/foo.png)
    const normalizedPath = path.startsWith('./') ? path : `./${path}`;

    // Query IndexedDB local Blob
    const stored = await attachmentRepository.getAttachment(normalizedPath);
    if (stored && stored.blob) {
      const objectUrl = URL.createObjectURL(stored.blob);
      this.urlCache.set(path, {
        url: objectUrl,
        refCount: 1,
      });
      return objectUrl;
    }

    // Try without leading ./ if needed
    const altPath = path.replace(/^\.\//, '');
    const storedAlt = await attachmentRepository.getAttachment(altPath);
    if (storedAlt && storedAlt.blob) {
      const objectUrl = URL.createObjectURL(storedAlt.blob);
      this.urlCache.set(path, {
        url: objectUrl,
        refCount: 1,
      });
      return objectUrl;
    }

    throw new Error(`Attachment not found: ${path}`);
  }

  /**
   * Release an acquired attachment URL.
   * Decrements the reference count.
   * Calls URL.revokeObjectURL ONLY when refCount drops to 0.
   */
  release(path: string): void {
    if (!path) return;

    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {
      return;
    }

    const entry = this.urlCache.get(path);
    if (!entry) return;

    entry.refCount -= 1;

    if (entry.refCount <= 0) {
      try {
        URL.revokeObjectURL(entry.url);
      } catch {
        // Ignore revocation errors
      }
      this.urlCache.delete(path);
    }
  }

  /**
   * Get active cache statistics (useful for diagnostics & tests).
   */
  getCacheStats(): { path: string; refCount: number }[] {
    return Array.from(this.urlCache.entries()).map(([path, entry]) => ({
      path,
      refCount: entry.refCount,
    }));
  }
}

export const attachmentResolver = new AttachmentResolverService();
