import type { Note } from '~/features/notes/types/note.types';
import type { Attachment } from '~/features/attachments/types/attachment.types';

export interface StackManifest {
  version: number;
  exportedAt: string;
  notes: number;
  attachments: number;
  engine: string;
}

export interface CollisionDecision {
  note: Note;
  action: 'rename' | 'overwrite' | 'skip';
}
