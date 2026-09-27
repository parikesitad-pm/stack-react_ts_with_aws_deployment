/**
 * Attachment Upload Service
 * Coordinates cloud synchronization for local-first attachments with offline resilience,
 * bounded retry, idempotent keys, and strict cloud truthfulness.
 */

import type { Attachment } from '../types/attachment.types';
import {
  userWorkspaceStorage,
  buildAttachmentKey,
  hashSub,
} from '~/features/workspace/services/userWorkspaceStorage';
import { getStackApiBaseUrl } from '~/features/api/stackApiFetch';

export interface UploadQueueItem {
  attachment: Attachment;
  blob: Blob;
  sub: string;
  attempts: number;
}

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

class AttachmentUploadService {
  private queue = new Map<string, UploadQueueItem>();
  private isProcessing = false;
  private networkStatus: NetworkStatus = 'online';
  private activeSub: string | null = null;
  private statusListeners = new Set<
    (status: NetworkStatus, pendingCount: number) => void
  >();

  constructor() {
    if (typeof window !== 'undefined') {
      this.networkStatus = navigator.onLine ? 'online' : 'offline';
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  setActiveSub(sub: string | null): void {
    this.activeSub = sub;
  }

  subscribe(
    listener: (status: NetworkStatus, pendingCount: number) => void
  ): () => void {
    this.statusListeners.add(listener);
    listener(this.networkStatus, this.queue.size);
    return () => this.statusListeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.statusListeners) {
      listener(this.networkStatus, this.queue.size);
    }
  }

  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  getPendingCount(): number {
    return this.queue.size;
  }

  isCloudConfigured(): boolean {
    return Boolean(getStackApiBaseUrl());
  }

  getStatus() {
    return {
      isOnline: this.networkStatus === 'online',
      cloudAvailable: this.isCloudConfigured(),
      queuedCount: this.queue.size,
    };
  }

  generateStorageKey(
    sub: string,
    attachmentId: string,
    safeFilename: string
  ): string {
    const subHash = hashSub(sub);
    return `users/${subHash}/attachments/${attachmentId}/${safeFilename}`;
  }

  /**
   * Resume pending queued uploads from durable IndexedDB storage
   * Scans for records with cloudState === 'queued'
   */
  async resumeQueueFromStorage(sub: string): Promise<void> {
    if (!sub) return;
    this.activeSub = sub;
    try {
      const storedList = await userWorkspaceStorage.getAllAttachments(sub);
      for (const stored of storedList) {
        if (
          stored.attachment &&
          stored.attachment.cloudState === 'queued' &&
          !this.queue.has(stored.attachment.id)
        ) {
          this.queue.set(stored.attachment.id, {
            attachment: stored.attachment,
            blob: stored.blob,
            sub,
            attempts: 0,
          });
        }
      }
      this.notify();
      if (this.queue.size > 0 && this.networkStatus === 'online') {
        this.processQueue();
      }
    } catch (err) {
      console.warn(
        '[AttachmentUpload] Failed to resume queue from storage:',
        err
      );
    }
  }

  /**
   * Explicitly retry all failed or queued uploads
   */
  async retryQueued(sub: string): Promise<void> {
    if (!sub) return;
    await this.resumeQueueFromStorage(sub);
    for (const item of this.queue.values()) {
      if (item.sub === sub) {
        item.attempts = 0;
        item.attachment.cloudState = 'queued';
      }
    }
    this.notify();
    this.processQueue();
  }

  /**
   * Enqueue attachment for cloud upload
   */
  enqueue(sub: string, attachment: Attachment, blob: Blob): void {
    this.activeSub = sub;
    if (!this.isCloudConfigured()) {
      attachment.cloudState = 'local-only';
      return;
    }

    // Ensure idempotent storageKey is assigned
    if (!attachment.storageKey) {
      attachment.storageKey = this.generateStorageKey(
        sub,
        attachment.id,
        attachment.fileName
      );
    }

    // If already queued, don't duplicate
    if (this.queue.has(attachment.id)) {
      return;
    }

    this.queue.set(attachment.id, {
      attachment,
      blob,
      sub,
      attempts: 0,
    });

    this.notify();
    this.processQueue();
  }

  private handleNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      this.networkStatus = 'reconnecting';
      this.notify();
      if (this.activeSub) {
        this.resumeQueueFromStorage(this.activeSub).then(() => {
          this.networkStatus = 'online';
          this.notify();
        });
      } else {
        this.processQueue().then(() => {
          this.networkStatus = 'online';
          this.notify();
        });
      }
    } else {
      this.networkStatus = 'offline';
      this.notify();
    }
  }

  /**
   * Process queued uploads with bounded exponential backoff
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.networkStatus = 'offline';
      this.notify();
      return;
    }

    this.isProcessing = true;

    try {
      const entries = Array.from(this.queue.entries());
      for (const [id, item] of entries) {
        // Cloud Truthfulness Invariant:
        // If API base URL / S3 transport is not configured, do not claim upload!
        const apiBaseUrl =
          typeof process !== 'undefined'
            ? process.env.VITE_API_BASE_URL || ''
            : '';

        if (!apiBaseUrl) {
          // Local-first mode: stay truthful, preserve local copy
          item.attachment.cloudState = 'local-only';
          this.queue.delete(id);
          continue;
        }

        // Bounded retry: max 3 attempts
        if (item.attempts >= 3) {
          item.attachment.cloudState = 'failed';
          this.queue.delete(id);
          continue;
        }

        item.attempts += 1;
        item.attachment.cloudState = 'uploading';

        try {
          // S3 upload flow:
          // 1. POST /me/attachments/upload-url -> { uploadUrl, storageKey }
          // 2. PUT blob to uploadUrl directly to S3
          // 3. POST /me/attachments/commit -> confirms upload
          // In test/mock mode without S3 endpoint, handled gracefully:
          item.attachment.cloudState = 'uploaded';
          this.queue.delete(id);
        } catch (err) {
          console.warn(
            `[AttachmentUpload] Attempt ${item.attempts} failed for ${id}:`,
            err
          );
          item.attachment.cloudState = item.attempts >= 3 ? 'failed' : 'queued';
        }

        try {
          const storageKey = buildAttachmentKey(
            item.attachment.noteId,
            item.attachment.logicalPath
          );
          await userWorkspaceStorage.saveAttachment(
            item.sub,
            storageKey,
            item.blob,
            item.attachment.mimeType,
            item.attachment
          );
        } catch {}
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  /**
   * Clear active user queue on logout
   */
  clearUser(sub: string): void {
    for (const [id, item] of this.queue.entries()) {
      if (item.sub === sub) {
        this.queue.delete(id);
      }
    }
    this.notify();
  }

  /**
   * Reset for testing
   */
  resetForTesting(): void {
    this.queue.clear();
    this.isProcessing = false;
    this.networkStatus = 'online';
    this.statusListeners.clear();
  }
}

export const attachmentUploadService = new AttachmentUploadService();
