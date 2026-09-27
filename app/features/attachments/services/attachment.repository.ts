/**
 * Attachment Repository
 * Strictly scoped per-user binary Blob storage in IndexedDB (stack_user_{subHash}).
 * Supports local-first offline storage of images and documents.
 */
import {
  userWorkspaceStorage,
  buildAttachmentKey,
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
   * Persist attachment record and binary blob strictly scoped to user sub and note boundary
   */
  async putAttachment(
    sub: string,
    attachment: Attachment,
    blob: Blob
  ): Promise<void> {
    const key = buildAttachmentKey(attachment.noteId, attachment.logicalPath);
    await userWorkspaceStorage.saveAttachment(
      sub,
      key,
      blob,
      attachment.mimeType,
      attachment
    );
  },

  /**
   * Retrieve stored attachment blob and metadata scoped to note boundary: (sub, noteId, logicalPath)
   */
  async getAttachmentByPath(
    sub: string,
    noteId: string,
    logicalPath: string
  ): Promise<{ blob: Blob; mimeType: string; attachment?: Attachment } | null> {
    return await userWorkspaceStorage.getAttachmentByNoteAndPath(
      sub,
      noteId,
      logicalPath
    );
  },

  /**
   * Retrieve binary blob scoped to note boundary: (sub, noteId, logicalPath)
   * Also supports legacy single-argument invocation with activeUserSub.
   */
  async getAttachmentBlob(
    subOrPath: string,
    noteId?: string,
    logicalPath?: string
  ): Promise<Blob | null> {
    if (noteId && logicalPath) {
      const result = await this.getAttachmentByPath(subOrPath, noteId, logicalPath);
      return result ? result.blob : null;
    }

    if (noteId && !logicalPath) {
      // Called as (noteId, logicalPath) with active sub
      const sub = activeUserSub;
      if (!sub) return null;
      const result = await this.getAttachmentByPath(sub, subOrPath, noteId);
      return result ? result.blob : null;
    }

    // Legacy single-argument path lookup
    const sub = activeUserSub;
    if (!sub) return null;
    const result = await this.getAttachment(subOrPath, sub);
    return result ? result.blob : null;
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
    const noteId = attachment?.noteId || 'default';
    const key = buildAttachmentKey(noteId, path);
    await userWorkspaceStorage.saveAttachment(
      sub,
      key,
      blob,
      mimeType,
      attachment
    );
  },

  /**
   * Retrieve stored attachment blob, mimeType, and metadata (with fallback across user's attachments)
   */
  async getAttachment(
    path: string,
    subOverride?: string
  ): Promise<{ blob: Blob; mimeType: string; attachment?: Attachment } | null> {
    const sub = subOverride || activeUserSub;
    if (!sub) return null;

    if (path.includes('::')) {
      return await userWorkspaceStorage.getAttachment(sub, path);
    }

    const all = await userWorkspaceStorage.getAllAttachments(sub);
    const normalized = path.startsWith('./') ? path : `./${path}`;
    const alt = normalized.replace(/^\.\//, '');

    const found = all.find(
      (a) =>
        a.attachment?.logicalPath === normalized ||
        a.attachment?.logicalPath === alt ||
        a.path === normalized ||
        a.path.endsWith(`::${normalized}`) ||
        a.path.endsWith(`::${alt}`)
    );

    return found
      ? { blob: found.blob, mimeType: found.mimeType, attachment: found.attachment }
      : null;
  },

  /**
   * Find attachment metadata by logical path and noteId
   */
  async findByLogicalPath(
    noteId: string,
    logicalPath: string,
    subOverride?: string
  ): Promise<Attachment | null> {
    const sub = subOverride || activeUserSub;
    if (!sub) return null;
    const result = await this.getAttachmentByPath(sub, noteId, logicalPath);
    return result?.attachment ?? null;
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
   * Delete an attachment by noteId and logicalPath (or legacy single path)
   */
  async deleteAttachment(
    subOrPath: string,
    noteIdOrSubOverride?: string,
    logicalPath?: string
  ): Promise<void> {
    if (logicalPath && noteIdOrSubOverride) {
      await userWorkspaceStorage.deleteAttachmentByNoteAndPath(
        subOrPath,
        noteIdOrSubOverride,
        logicalPath
      );
      return;
    }

    const sub = noteIdOrSubOverride || activeUserSub;
    if (!sub) return;
    await userWorkspaceStorage.deleteAttachment(sub, subOrPath);
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
      const logical = item.attachment?.logicalPath || item.path;
      if (!referencedPaths.has(logical) && item.attachment) {
        orphans.push(item.attachment);
      }
    }
    return orphans;
  },
};
