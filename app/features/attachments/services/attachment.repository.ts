/**
 * Attachment Repository
 * Strictly scoped per-user binary Blob storage in IndexedDB (stack_user_{subHash}).
 * Supports local-first offline storage of images and documents.
 */
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';

export interface StoredAttachment {
  path: string; // e.g. './assets/screenshot-20260927-010212.webp'
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

let activeUserSub: string | null = null;

export const attachmentRepository = {
  /**
   * Set the active user sub for attachment operations
   */
  setActiveSub(sub: string | null): void {
    activeUserSub = sub;
  },

  getActiveSub(): string | null {
    return activeUserSub;
  },

  async saveAttachment(
    path: string,
    blob: Blob,
    mimeType: string,
    subOverride?: string
  ): Promise<void> {
    const sub = subOverride || activeUserSub;
    if (!sub) {
      console.warn('Cannot save attachment: no active user sub established.');
      return;
    }
    await userWorkspaceStorage.saveAttachment(sub, path, blob, mimeType);
  },

  async getAttachment(
    path: string,
    subOverride?: string
  ): Promise<{ blob: Blob; mimeType: string } | null> {
    const sub = subOverride || activeUserSub;
    if (!sub) return null;
    return await userWorkspaceStorage.getAttachment(sub, path);
  },

  async deleteAttachment(path: string, subOverride?: string): Promise<void> {
    const sub = subOverride || activeUserSub;
    if (!sub) return;
    await userWorkspaceStorage.deleteAttachment(sub, path);
  },
};
