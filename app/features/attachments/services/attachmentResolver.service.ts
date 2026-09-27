/**
 * Shared Attachment Resolver Service
 * Resolves logical Markdown paths (./assets/...) to renderable URLs.
 * Integrates with objectUrlCache for strict reference-counted lifecycle management.
 */

import { attachmentRepository } from './attachment.repository';
import { objectUrlCache } from './objectUrlCache.service';

export interface ResolvedAttachment {
  url: string;
  isExternal: boolean;
  mimeType?: string;
  fileName?: string;
}

export class AttachmentResolverService {
  /**
   * Acquire a browser-safe URL for a given attachment path.
   * Increments the reference count in objectUrlCache.
   */
  async acquire(path: string, subOverride?: string): Promise<string> {
    if (!path) return '';

    // Direct HTTP/HTTPS or data URLs don't need object URL wrapping
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {
      return path;
    }

    const sub = subOverride || attachmentRepository.getActiveSub();
    if (!sub) {
      throw new Error(
        `Cannot resolve attachment without active user session: ${path}`
      );
    }

    // Normalize path (ensure leading ./)
    const normalizedPath = path.startsWith('./') ? path : `./${path}`;
    const cacheKey = `${sub}:${normalizedPath}`;

    // Query IndexedDB local Blob
    const stored = await attachmentRepository.getAttachment(
      normalizedPath,
      sub
    );
    if (stored && stored.blob) {
      return objectUrlCache.acquire(cacheKey, sub, () => {
        return URL.createObjectURL(stored.blob);
      });
    }

    // Try without leading ./ if needed
    const altPath = path.replace(/^\.\//, '');
    const storedAlt = await attachmentRepository.getAttachment(altPath, sub);
    if (storedAlt && storedAlt.blob) {
      return objectUrlCache.acquire(cacheKey, sub, () => {
        return URL.createObjectURL(storedAlt.blob);
      });
    }

    throw new Error(`Attachment not found: ${path}`);
  }

  /**
   * Release an acquired attachment URL.
   * Decrements the reference count and revokes when refCount is 0.
   */
  release(path: string, subOverride?: string): void {
    if (!path) return;

    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {
      return;
    }

    const sub = subOverride || attachmentRepository.getActiveSub();
    if (!sub) return;

    const normalizedPath = path.startsWith('./') ? path : `./${path}`;
    const cacheKey = `${sub}:${normalizedPath}`;

    objectUrlCache.release(cacheKey);
  }

  /**
   * Check if a path represents an internal local attachment reference
   */
  isLocalAttachmentPath(path: string): boolean {
    if (!path) return false;
    return (
      path.startsWith('./assets/') ||
      path.startsWith('./attachments/') ||
      path.startsWith('assets/') ||
      path.startsWith('attachments/')
    );
  }

  clearUser(sub: string): void {
    objectUrlCache.clearUser(sub);
  }

  clearAll(): void {
    objectUrlCache.clearAll();
  }
}

export const attachmentResolver = new AttachmentResolverService();
