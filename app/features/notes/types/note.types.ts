import { z } from 'zod';

export const folderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  order: z.number().default(0),
  isExpanded: z.boolean().optional(),
});

export type Folder = z.infer<typeof folderSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  folderId: z.string().nullable().default(null),
  order: z.number().default(0),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncStatus: z
    .enum(['saved_locally', 'syncing', 'synced', 'offline', 'conflict'])
    .default('saved_locally'),
});

export type Note = z.infer<typeof NoteSchema>;

export type NoteFilter = 'all' | 'pinned' | 'archived' | string; // string for specific tag
