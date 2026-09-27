import type { SaveState } from '../types/editor.types';

interface PendingNoteSave {
  noteId: string;
  sub: string;
  revision: number;
  content: string;
  persistFn: (noteId: string, content: string) => Promise<void>;
  timer: NodeJS.Timeout | null;
}

export class EditorSaveController {
  private pendingSaves = new Map<string, PendingNoteSave>();
  private noteRevisions = new Map<string, number>();
  private noteStates = new Map<string, SaveState>();
  private listeners = new Set<(noteId: string, state: SaveState) => void>();
  private debounceMs = 500;

  constructor(debounceMs = 500) {
    this.debounceMs = debounceMs;
  }

  /**
   * Subscribe to save state changes for notes.
   */
  subscribe(listener: (noteId: string, state: SaveState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(noteId: string, state: SaveState): void {
    this.noteStates.set(noteId, state);
    for (const listener of this.listeners) {
      listener(noteId, state);
    }
  }

  /**
   * Get the current save state for a note.
   */
  getState(noteId: string): SaveState {
    return this.noteStates.get(noteId) ?? { status: 'idle' };
  }

  /**
   * Queue a debounced save for a note with explicit identity and revision tracking.
   */
  queueSave(
    noteId: string,
    sub: string,
    content: string,
    persistFn: (noteId: string, content: string) => Promise<void>
  ): void {
    const nextRevision = (this.noteRevisions.get(noteId) ?? 0) + 1;
    this.noteRevisions.set(noteId, nextRevision);

    // Cancel existing timer if running
    const existing = this.pendingSaves.get(noteId);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }

    this.notify(noteId, { status: 'dirty' });

    const entry: PendingNoteSave = {
      noteId,
      sub,
      revision: nextRevision,
      content,
      persistFn,
      timer: null,
    };

    entry.timer = setTimeout(() => {
      this.executeSave(noteId, entry);
    }, this.debounceMs);

    this.pendingSaves.set(noteId, entry);
  }

  /**
   * Flush pending save immediately (e.g. on Ctrl+S, note switch, route change, or logout).
   */
  async flush(noteId?: string): Promise<void> {
    if (noteId) {
      const pending = this.pendingSaves.get(noteId);
      if (pending) {
        if (pending.timer) clearTimeout(pending.timer);
        await this.executeSave(noteId, pending);
      }
    } else {
      // Flush all pending
      const entries = Array.from(this.pendingSaves.entries());
      for (const [id, pending] of entries) {
        if (pending.timer) clearTimeout(pending.timer);
        await this.executeSave(id, pending);
      }
    }
  }

  /**
   * Cancel pending save for a note.
   */
  cancel(noteId?: string): void {
    if (noteId) {
      const pending = this.pendingSaves.get(noteId);
      if (pending?.timer) clearTimeout(pending.timer);
      this.pendingSaves.delete(noteId);
    } else {
      for (const pending of this.pendingSaves.values()) {
        if (pending.timer) clearTimeout(pending.timer);
      }
      this.pendingSaves.clear();
    }
  }

  /**
   * Execute actual persistence with revision safety.
   */
  private async executeSave(
    noteId: string,
    entry: PendingNoteSave
  ): Promise<void> {
    const currentRevision = this.noteRevisions.get(noteId) ?? 0;
    if (entry.revision < currentRevision) {
      // Stale revision: a newer edit has already been queued, so do not overwrite!
      return;
    }

    this.notify(noteId, { status: 'saving-local' });

    try {
      await entry.persistFn(entry.noteId, entry.content);

      // Verify revision has not changed during async await
      const latestRev = this.noteRevisions.get(noteId) ?? 0;
      if (entry.revision === latestRev) {
        this.pendingSaves.delete(noteId);
        const isOffline =
          typeof window !== 'undefined' &&
          typeof navigator !== 'undefined' &&
          navigator.onLine === false;
        const savedAt = new Date().toISOString();

        if (isOffline) {
          this.notify(noteId, { status: 'offline-local', savedAt });
        } else {
          this.notify(noteId, { status: 'saved-local', savedAt });
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as Error)?.message || 'Failed to persist note locally';
      this.notify(noteId, { status: 'local-error', error: errorMsg });
    }
  }

  resetForTesting(): void {
    this.cancel();
    this.noteRevisions.clear();
    this.noteStates.clear();
    this.listeners.clear();
  }
}

export const editorSaveService = new EditorSaveController();
