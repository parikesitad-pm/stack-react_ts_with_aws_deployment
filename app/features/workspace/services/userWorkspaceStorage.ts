import type { Note, Folder } from '~/features/notes/types/note.types';

export interface StoredAttachment {
  path: string;
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_FOLDERS = 'folders';
const STORE_ATTACHMENTS = 'attachments';
const STORE_META = 'meta';

/**
 * Derives a stable safe database namespace from Auth0 sub.
 * E.g. "auth0|66f5c" -> "auth0_66f5c_1a2b3c"
 */
export function hashSub(sub: string): string {
  let hash = 5381;
  for (let i = 0; i < sub.length; i++) {
    hash = (hash * 33) ^ sub.charCodeAt(i);
  }
  const cleanSub = sub.replace(/[^a-zA-Z0-9]/g, '_');
  const unsigned = (hash >>> 0).toString(36);
  return `${cleanSub.slice(0, 24)}_${unsigned}`;
}

export function getWorkspaceDbName(sub: string): string {
  return `stack_user_${hashSub(sub)}`;
}

// In-memory fallback partition store for tests and SSR
interface MemoryPartition {
  notes: Note[];
  folders: Folder[];
  attachments: Map<string, StoredAttachment>;
  meta: Map<string, unknown>;
}

const memoryPartitions = new Map<string, MemoryPartition>();

function getMemoryPartition(sub: string): MemoryPartition {
  let partition = memoryPartitions.get(sub);
  if (!partition) {
    partition = {
      notes: [],
      folders: [],
      attachments: new Map(),
      meta: new Map(),
    };
    memoryPartitions.set(sub, partition);
  }
  return partition;
}

// Active IndexedDB connection pool per user
const activeDbConnections = new Map<string, IDBDatabase>();

function openUserDb(sub: string): Promise<IDBDatabase> {
  const existing = activeDbConnections.get(sub);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const dbName = getWorkspaceDbName(sub);
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
        db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'path' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      activeDbConnections.set(sub, db);
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

export const userWorkspaceStorage = {
  getWorkspaceDbName,

  /**
   * Closes active IndexedDB connection for the user and frees handles
   */
  closeConnection(sub: string): void {
    const conn = activeDbConnections.get(sub);
    if (conn) {
      try {
        conn.close();
      } catch {}
      activeDbConnections.delete(sub);
    }
  },

  /**
   * Resets all in-memory partitions (used for unit tests)
   */
  resetMemoryForTesting(): void {
    memoryPartitions.clear();
    activeDbConnections.clear();
  },

  // -------------------------------------------------------------
  // NOTES
  // -------------------------------------------------------------
  async getNotes(sub: string): Promise<Note[]> {
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NOTES, 'readonly');
        const store = tx.objectStore(STORE_NOTES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getMemoryPartition(sub).notes;
    }
  },

  async saveNotes(sub: string, notes: Note[]): Promise<void> {
    getMemoryPartition(sub).notes = [...notes];
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NOTES, 'readwrite');
        const store = tx.objectStore(STORE_NOTES);
        store.clear();
        notes.forEach((note) => store.put(note));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory partition updated
    }
  },

  // -------------------------------------------------------------
  // FOLDERS
  // -------------------------------------------------------------
  async getFolders(sub: string): Promise<Folder[]> {
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FOLDERS, 'readonly');
        const store = tx.objectStore(STORE_FOLDERS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return getMemoryPartition(sub).folders;
    }
  },

  async saveFolders(sub: string, folders: Folder[]): Promise<void> {
    getMemoryPartition(sub).folders = [...folders];
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FOLDERS, 'readwrite');
        const store = tx.objectStore(STORE_FOLDERS);
        store.clear();
        folders.forEach((folder) => store.put(folder));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // In-memory partition updated
    }
  },

  // -------------------------------------------------------------
  // ATTACHMENTS
  // -------------------------------------------------------------
  async getAttachment(
    sub: string,
    path: string
  ): Promise<{ blob: Blob; mimeType: string } | null> {
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ATTACHMENTS, 'readonly');
        const store = tx.objectStore(STORE_ATTACHMENTS);
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
      const att = getMemoryPartition(sub).attachments.get(path);
      return att ? { blob: att.blob, mimeType: att.mimeType } : null;
    }
  },

  async saveAttachment(
    sub: string,
    path: string,
    blob: Blob,
    mimeType: string
  ): Promise<void> {
    const record: StoredAttachment = {
      path,
      blob,
      mimeType,
      updatedAt: Date.now(),
    };
    getMemoryPartition(sub).attachments.set(path, record);

    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ATTACHMENTS, 'readwrite');
        const store = tx.objectStore(STORE_ATTACHMENTS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // In-memory partition updated
    }
  },

  async deleteAttachment(sub: string, path: string): Promise<void> {
    getMemoryPartition(sub).attachments.delete(path);
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ATTACHMENTS, 'readwrite');
        const store = tx.objectStore(STORE_ATTACHMENTS);
        const req = store.delete(path);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // In-memory partition updated
    }
  },

  // -------------------------------------------------------------
  // USER METADATA (Tour completion, editor draft, ui preferences)
  // -------------------------------------------------------------
  async getMeta<T>(sub: string, key: string): Promise<T | null> {
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readonly');
        const store = tx.objectStore(STORE_META);
        const req = store.get(key);
        req.onsuccess = () =>
          resolve(req.result ? (req.result.value as T) : null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const val = getMemoryPartition(sub).meta.get(key);
      return (val as T) ?? null;
    }
  },

  async setMeta<T>(sub: string, key: string, value: T): Promise<void> {
    getMemoryPartition(sub).meta.set(key, value);
    try {
      const db = await openUserDb(sub);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_META, 'readwrite');
        const store = tx.objectStore(STORE_META);
        const req = store.put({ key, value });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // In-memory partition updated
    }
  },

  /**
   * Completely destroys all local IndexedDB data and memory partitions for a user.
   * Executed strictly during Danger Zone account deletion.
   */
  async clearUserData(sub: string): Promise<void> {
    this.closeConnection(sub);
    memoryPartitions.delete(sub);

    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const dbName = getWorkspaceDbName(sub);
      await new Promise<void>((resolve) => {
        const req = window.indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
  },
};

