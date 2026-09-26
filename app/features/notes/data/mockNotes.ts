import type { Note } from '~/features/notes/types/note.types';

/**
 * Newly created user workspaces start completely empty.
 * No seeded demo notes, no fake manifesto, shortcuts, or AWS notes.
 */
export const initialNotes: Note[] = [];
