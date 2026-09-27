import type { Folder, Note } from '../../notes/types/note.types';
import { folderTreeService } from '../../notes/services/folderTree.service';

export const workspaceOrderService = {
  /**
   * Reorders a note relative to a target note ('before' or 'after').
   * If sourceNote was in a different folder, it adopts targetNote's folderId.
   */
  reorderNotes(
    sourceNoteId: string,
    targetNoteId: string,
    edge: 'before' | 'after',
    notes: Note[]
  ): Note[] {
    if (sourceNoteId === targetNoteId) {
      return notes;
    }

    const sourceNote = notes.find((n) => n.id === sourceNoteId);
    const targetNote = notes.find((n) => n.id === targetNoteId);

    if (!sourceNote || !targetNote) {
      throw new Error('Source or target note not found.');
    }

    const targetFolderId = targetNote.folderId;
    const siblings = notes
      .filter((n) => n.folderId === targetFolderId && n.id !== sourceNoteId)
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const targetIndex = siblings.findIndex((n) => n.id === targetNoteId);
    if (targetIndex === -1) {
      throw new Error('Target note not found in siblings.');
    }

    const insertIndex = edge === 'before' ? targetIndex : targetIndex + 1;
    const now = new Date().toISOString();
    const updatedSource: Note = {
      ...sourceNote,
      folderId: targetFolderId,
      updatedAt: now,
    };

    siblings.splice(insertIndex, 0, updatedSource);

    // Normalize sibling orders by steps of 100
    const orderMap = new Map<string, number>();
    siblings.forEach((note, index) => {
      orderMap.set(note.id, (index + 1) * 100);
    });

    const updatedNotes = notes.map((n) => {
      const newOrder = orderMap.get(n.id);
      if (newOrder !== undefined) {
        return {
          ...n,
          folderId: targetFolderId,
          order: newOrder,
          updatedAt: n.id === sourceNoteId ? updatedSource.updatedAt : n.updatedAt,
        };
      }
      return n;
    });

    return updatedNotes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  /**
   * Reorders a folder relative to a target folder ('before' or 'after').
   * Enforces cycle check if target has different parent.
   */
  reorderFolders(
    sourceFolderId: string,
    targetFolderId: string,
    edge: 'before' | 'after',
    folders: Folder[]
  ): Folder[] {
    if (sourceFolderId === targetFolderId) {
      return folders;
    }

    const sourceFolder = folders.find((f) => f.id === sourceFolderId);
    const targetFolder = folders.find((f) => f.id === targetFolderId);

    if (!sourceFolder || !targetFolder) {
      throw new Error('Source or target folder not found.');
    }

    const targetParentId = targetFolder.parentId;

    if (sourceFolder.parentId !== targetParentId) {
      if (folderTreeService.wouldCreateCycle(sourceFolderId, targetParentId, folders)) {
        throw new Error('Cannot move folder into itself or one of its descendants.');
      }
      const validation = folderTreeService.validateFolderName(
        sourceFolder.name,
        targetParentId,
        folders,
        sourceFolderId
      );
      if (!validation.valid) {
        throw new Error(validation.error ?? 'Invalid destination folder name.');
      }
    }

    const siblings = folders
      .filter((f) => f.parentId === targetParentId && f.id !== sourceFolderId)
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const targetIndex = siblings.findIndex((f) => f.id === targetFolderId);
    if (targetIndex === -1) {
      throw new Error('Target folder not found in siblings.');
    }

    const insertIndex = edge === 'before' ? targetIndex : targetIndex + 1;
    const now = new Date().toISOString();
    const updatedSource: Folder = {
      ...sourceFolder,
      parentId: targetParentId,
      updatedAt: now,
    };

    siblings.splice(insertIndex, 0, updatedSource);

    const orderMap = new Map<string, number>();
    siblings.forEach((folder, index) => {
      orderMap.set(folder.id, (index + 1) * 100);
    });

    const updatedFolders = folders.map((f) => {
      const newOrder = orderMap.get(f.id);
      if (newOrder !== undefined) {
        return {
          ...f,
          parentId: targetParentId,
          order: newOrder,
          updatedAt: f.id === sourceFolderId ? updatedSource.updatedAt : f.updatedAt,
        };
      }
      return f;
    });

    return updatedFolders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
};
