import type { Folder, Note } from '../../notes/types/note.types';
import { folderTreeService } from '../../notes/services/folderTree.service';

export const workspaceMoveService = {
  /**
   * Move a note into a folder (or root workspace if targetFolderId is null).
   */
  moveNoteToFolder(
    noteId: string,
    targetFolderId: string | null,
    notes: Note[]
  ): Note[] {
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) {
      throw new Error(`Note with id "${noteId}" not found.`);
    }

    if (targetNote.folderId === targetFolderId) {
      return notes;
    }

    const now = new Date().toISOString();
    return notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            folderId: targetFolderId,
            updatedAt: now,
          }
        : note
    );
  },

  /**
   * Move a folder into another folder (or root if targetParentId is null).
   * Validates cycle prevention and sibling name collision.
   */
  moveFolder(
    folderId: string,
    targetParentId: string | null,
    folders: Folder[]
  ): Folder[] {
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!targetFolder) {
      throw new Error(`Folder with id "${folderId}" not found.`);
    }

    if (targetFolder.parentId === targetParentId) {
      return folders;
    }

    if (folderTreeService.wouldCreateCycle(folderId, targetParentId, folders)) {
      throw new Error('Cannot move folder into itself or one of its descendants.');
    }

    const validation = folderTreeService.validateFolderName(
      targetFolder.name,
      targetParentId,
      folders,
      folderId
    );
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid destination folder name.');
    }

    const siblings = folders.filter((f) => f.parentId === targetParentId && f.id !== folderId);
    const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order ?? 0), 0);
    const newOrder = maxOrder + 100;
    const now = new Date().toISOString();

    return folders.map((folder) =>
      folder.id === folderId
        ? {
            ...folder,
            parentId: targetParentId,
            order: newOrder,
            updatedAt: now,
          }
        : folder
    );
  },

  /**
   * Retrieve direct notes and immediate child folders of a folder.
   */
  getFolderContents(
    folderId: string,
    folders: Folder[],
    notes: Note[]
  ): { directNotes: Note[]; childFolders: Folder[] } {
    const directNotes = notes.filter((n) => n.folderId === folderId);
    const childFolders = folders.filter((f) => f.parentId === folderId);
    return { directNotes, childFolders };
  },

  /**
   * Safe folder deletion helper that preserves hierarchy:
   * Reparents ONLY direct notes and immediate child folders to destinationFolderId.
   * NEVER flattens descendants.
   * Throws if destinationFolderId is inside the folder's subtree.
   * Removes the deleted folder from the returned folders array.
   */
  reparentFolderContents(
    folderId: string,
    destinationFolderId: string | null,
    folders: Folder[],
    notes: Note[]
  ): { updatedNotes: Note[]; updatedFolders: Folder[] } {
    if (destinationFolderId !== null) {
      const subtreeIds = folderTreeService.getFolderSubtreeIds(folderId, folders);
      if (subtreeIds.has(destinationFolderId)) {
        throw new Error(
          'Destination cannot be inside the deleted folder or its subfolders.'
        );
      }
    }

    const now = new Date().toISOString();

    // 1. Reparent only direct notes
    const updatedNotes = notes.map((note) =>
      note.folderId === folderId
        ? {
            ...note,
            folderId: destinationFolderId,
            updatedAt: now,
          }
        : note
    );

    // 2. Reparent only immediate child folders, leaving grandchildren untouched under their respective parents
    const updatedFolders = folders
      .filter((f) => f.id !== folderId)
      .map((folder) =>
        folder.parentId === folderId
          ? {
              ...folder,
              parentId: destinationFolderId,
              updatedAt: now,
            }
          : folder
      );

    return { updatedNotes, updatedFolders };
  },
};
