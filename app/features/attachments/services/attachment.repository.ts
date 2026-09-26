/**
 * Attachment Repository
 * Persistent binary Blob storage in IndexedDB (stack_attachments_db).
 * Supports local-first offline storage of images and documents.
 */

const DB_NAME = 'stack_attachments_db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

export interface StoredAttachment {
  path: string; // e.g. './assets/screenshot-20260927-010212.webp'
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available in current environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const attachmentRepository = {
  async saveAttachment(
    path: string,
    blob: Blob,
    mimeType: string
  ): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredAttachment = {
          path,
          blob,
          mimeType,
          updatedAt: Date.now(),
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save attachment to IndexedDB:', err);
    }
  },

  async getAttachment(
    path: string
  ): Promise<{ blob: Blob; mimeType: string } | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(path);
        req.onsuccess = () => {
          if (req.result) {
            resolve({
              blob: req.result.blob,
              mimeType: req.result.mimeType,
            });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  },

  async deleteAttachment(path: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(path);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to delete attachment from IndexedDB:', err);
    }
  },

  async getAllAttachmentPaths(): Promise<string[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result as string[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },
};
