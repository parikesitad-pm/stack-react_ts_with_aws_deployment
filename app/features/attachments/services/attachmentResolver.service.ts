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
  private requestKeyToCacheKey = new Map<string, string>();

  /**
   * Acquire a browser-safe URL for a given attachment path.
   * Increments the reference count in objectUrlCache using canonical key `${sub}:${attachmentId}`.
   */
  async acquire(
    path: string,
    noteId?: string,
    subOverride?: string
  ): Promise<string> {
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
    const requestKey = `${sub}:${noteId || 'global'}:${normalizedPath}`;

    // 1. Query IndexedDB local Blob scoped to note boundary if noteId is available
    let stored = noteId
      ? await attachmentRepository.getAttachmentByPath(
          sub,
          noteId,
          normalizedPath
        )
      : null;

    if (!stored && noteId) {
      const altPath = normalizedPath.replace(/^\.\//, '');
      stored = await attachmentRepository.getAttachmentByPath(
        sub,
        noteId,
        altPath
      );
    }

    // Fallback: search across all attachments for this path
    if (!stored) {
      stored = await attachmentRepository.getAttachment(normalizedPath, sub);
    }

    if (stored && stored.blob) {
      const attachmentId =
        stored.attachment?.id || `file_${encodeURIComponent(normalizedPath)}`;
      const cacheKey = `${sub}:${attachmentId}`;
      this.requestKeyToCacheKey.set(requestKey, cacheKey);

      return objectUrlCache.acquire(cacheKey, sub, () => {
        return URL.createObjectURL(stored.blob);
      });
    }

    // 2. Cloud resolution fallback:
    // If local Blob is missing, but attachment has storageKey and backend API is active
    if (stored && stored.attachment?.storageKey) {
      // Invariant: Authenticated cloud download can be fetched here,
      // but NEVER persist signed download URLs into local IndexedDB.
      // If temporary cloud download fails or is unavailable, report missing fallback:
    }

    // 3. Fallback visual missing message:
    throw new Error(`This attachment isn't available on this device.`);
  }

  /**
   * Release an acquired attachment URL.
   * Decrements the reference count and revokes when refCount is 0.
   */
  release(path: string, noteId?: string, subOverride?: string): void {
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
    const requestKey = `${sub}:${noteId || 'global'}:${normalizedPath}`;

    const cacheKey = this.requestKeyToCacheKey.get(requestKey);
    if (cacheKey) {
      objectUrlCache.release(cacheKey);
      this.requestKeyToCacheKey.delete(requestKey);
    } else {
      // Fallback: try direct release by path
      objectUrlCache.release(`${sub}:${normalizedPath}`);
    }
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
