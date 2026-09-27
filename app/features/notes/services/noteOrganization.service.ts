import type { Note } from '../types/note.types';

export const noteOrganizationService = {
  isNoteActive(note: Note): boolean {
    return note.deletedAt == null && note.archivedAt == null;
  },

  isNoteArchived(note: Note): boolean {
    return note.deletedAt == null && note.archivedAt != null;
  },

  isNoteTrashed(note: Note): boolean {
    return note.deletedAt != null;
  },

  getActiveNotes(notes: Note[]): Note[] {
    return notes.filter((n) => this.isNoteActive(n));
  },

  getArchivedNotes(notes: Note[]): Note[] {
    return notes.filter((n) => this.isNoteArchived(n));
  },

  getTrashedNotes(notes: Note[]): Note[] {
    return notes.filter((n) => this.isNoteTrashed(n));
  },

  getPinnedNotes(notes: Note[]): Note[] {
    return notes.filter((n) => this.isNoteActive(n) && Boolean(n.isPinned));
  },

  getNotesInFolder(notes: Note[], folderId: string | null): Note[] {
    return notes.filter((n) => this.isNoteActive(n) && n.folderId === folderId);
  },

  getNotesByTag(notes: Note[], rawTag: string): Note[] {
    const cleanTag = rawTag.replace(/^#+/, '').trim().toLowerCase();
    return notes.filter(
      (n) =>
        this.isNoteActive(n) &&
        (n.tags ?? []).some((t) => t.toLowerCase() === cleanTag)
    );
  },

  archiveNote(noteId: string, notes: Note[]): Note[] {
    const now = new Date().toISOString();
    return notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            archivedAt: now,
            updatedAt: now,
          }
        : n
    );
  },

  unarchiveNote(noteId: string, notes: Note[]): Note[] {
    const now = new Date().toISOString();
    return notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            archivedAt: null,
            updatedAt: now,
          }
        : n
    );
  },

  moveToTrash(noteId: string, notes: Note[]): Note[] {
    const now = new Date().toISOString();
    return notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            deletedAt: now,
            updatedAt: now,
          }
        : n
    );
  },

  /**
   * Restores a note from trash.
   * If note was archived prior to being trashed (archivedAt != null),
   * clearing deletedAt will correctly restore it to Archive state.
   * Otherwise, it restores to Active state in its original folder.
   */
  restoreFromTrash(noteId: string, notes: Note[]): Note[] {
    const now = new Date().toISOString();
    return notes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            deletedAt: null,
            updatedAt: now,
          }
        : n
    );
  },

  permanentlyDeleteNote(noteId: string, notes: Note[]): Note[] {
    return notes.filter((n) => n.id !== noteId);
  },

  emptyTrash(notes: Note[]): Note[] {
    return notes.filter((n) => n.deletedAt == null);
  },
};
