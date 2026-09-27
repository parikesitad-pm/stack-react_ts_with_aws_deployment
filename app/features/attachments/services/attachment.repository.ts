/**
 * Attachment Repository
 * Strictly scoped per-user binary Blob storage in IndexedDB (stack_user_{subHash}).
 * Supports local-first offline storage of images and documents.
 */
import {
  userWorkspaceStorage,
  type StoredAttachment,
} from '~/features/workspace/services/userWorkspaceStorage';
import type { Attachment } from '../types/attachment.types';

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

  /**
   * Persist attachment record and binary blob strictly scoped to user sub
   */
  async putAttachment(
    sub: string,
    attachment: Attachment,
    blob: Blob
  ): Promise<void> {
    await userWorkspaceStorage.saveAttachment(
      sub,
      attachment.logicalPath,
      blob,
      attachment.mimeType,
      attachment
    );
  },

  /**
   * Legacy & quick helper: save attachment with active sub
   */
  async saveAttachment(
    path: string,
    blob: Blob,
    mimeType: string,
    subOverride?: string,
    attachment?: Attachment
  ): Promise<void> {
    const sub = subOverride || activeUserSub;
    if (!sub) {
      console.warn('Cannot save attachment: no active user sub established.');
      return;
    }
    await userWorkspaceStorage.saveAttachment(
      sub,
      path,
      blob,
      mimeType,
      attachment
    );
  },

  /**
   * Retrieve stored attachment blob, mimeType, and metadata by logical path
   */
  async getAttachment(
    path: string,
    subOverride?: string
  ): Promise<{ blob: Blob; mimeType: string; attachment?: Attachment } | null> {
    const sub = subOverride || activeUserSub;
    if (!sub) return null;
    return await userWorkspaceStorage.getAttachment(sub, path);
  },

  /**
   * Retrieve binary blob directly
   */
  async getAttachmentBlob(
    path: string,
    subOverride?: string
  ): Promise<Blob | null> {
    const result = await this.getAttachment(path, subOverride);
    return result ? result.blob : null;
  },

  /**
   * Find attachment metadata by logical path and noteId
   */
  async findByLogicalPath(
    noteId: string,
    logicalPath: string,
    subOverride?: string
  ): Promise<Attachment | null> {
    const result = await this.getAttachment(logicalPath, subOverride);
    if (!result || !result.attachment) return null;
    if (result.attachment.noteId !== noteId) return null;
    return result.attachment;
  },

  /**
   * List all attachment records belonging to a note
   */
  async findByNoteId(
    noteId: string,
    subOverride?: string
  ): Promise<Attachment[]> {
    const sub = subOverride || activeUserSub;
    if (!sub) return [];
    const stored = await userWorkspaceStorage.getAttachmentsByNoteId(
      sub,
      noteId
    );
    return stored
      .map((s) => s.attachment)
      .filter((a): a is Attachment => a !== undefined);
  },

  /**
   * Delete an attachment by path
   */
  async deleteAttachment(path: string, subOverride?: string): Promise<void> {
    const sub = subOverride || activeUserSub;
    if (!sub) return;
    await userWorkspaceStorage.deleteAttachment(sub, path);
  },

  /**
   * Delete all attachments belonging to a note
   */
  async deleteAttachmentsByNoteId(
    noteId: string,
    subOverride?: string
  ): Promise<void> {
    const sub = subOverride || activeUserSub;
    if (!sub) return;
    await userWorkspaceStorage.deleteAttachmentsByNote(sub, noteId);
  },

  /**
   * Scan for orphaned attachments not referenced in provided logical paths
   */
  async listOrphans(
    referencedPaths: Set<string>,
    subOverride?: string
  ): Promise<Attachment[]> {
    const sub = subOverride || activeUserSub;
    if (!sub) return [];
    const all = await userWorkspaceStorage.getAllAttachments(sub);
    const orphans: Attachment[] = [];
    for (const item of all) {
      if (!referencedPaths.has(item.path) && item.attachment) {
        orphans.push(item.attachment);
      }
    }
    return orphans;
  },
};
