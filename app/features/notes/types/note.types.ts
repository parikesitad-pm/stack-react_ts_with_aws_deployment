import { z } from 'zod';

export const folderSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  parentId: z.string().nullable().default(null),
  order: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Folder = z.infer<typeof folderSchema>;

export const NoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  folderId: z.string().nullable().default(null),
  order: z.number().default(0),
  isPinned: z.boolean().default(false),
  archivedAt: z.string().nullable().default(null),
  deletedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncStatus: z
    .enum(['saved_locally', 'syncing', 'synced', 'offline', 'conflict'])
    .default('saved_locally'),
});

export type Note = z.infer<typeof NoteSchema>;

export type NoteFilter = 'all' | 'pinned' | 'archive' | 'trash' | string;

export type WorkspaceDragData =
  | { type: 'note'; noteId: string; sourceFolderId: string | null }
  | { type: 'folder'; folderId: string; sourceParentId: string | null };

export type WorkspaceDropData =
  | { type: 'folder-target'; folderId: string }
  | { type: 'root-target' }
  | {
      type: 'note-position';
      noteId: string;
      folderId: string | null;
      edge: 'before' | 'after';
    }
  | {
      type: 'folder-position';
      folderId: string;
      parentId: string | null;
      edge: 'before' | 'after';
    };
