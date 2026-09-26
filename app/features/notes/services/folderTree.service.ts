import type { Folder } from '../types/note.types';

export const folderTreeService = {
  /**
   * Check if setting `targetParentId` as parent of `folderId` would introduce a cycle.
   * e.g., Folder A -> Folder B -> Folder A is strictly prevented.
   */
  wouldCreateCycle(
    folderId: string,
    targetParentId: string | null,
    folders: Folder[]
  ): boolean {
    if (!targetParentId) return false;
    if (folderId === targetParentId) return true;

    const folderMap = new Map<string, Folder>();
    folders.forEach((f) => folderMap.set(f.id, f));

    let currentId: string | null = targetParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === folderId) {
        return true; // Cycle detected!
      }
      if (visited.has(currentId)) {
        return true; // Malformed tree loop detected
      }
      visited.add(currentId);

      const parent = folderMap.get(currentId);
      currentId = parent?.parentId ?? null;
    }

    return false;
  },

  /**
   * Recursively retrieve all descendant folder IDs for a given folder.
   */
  getFolderDescendants(folderId: string, folders: Folder[]): string[] {
    const descendants: string[] = [];
    const children = folders.filter((f) => f.parentId === folderId);

    for (const child of children) {
      descendants.push(child.id);
      descendants.push(...this.getFolderDescendants(child.id, folders));
    }

    return descendants;
  },

  /**
   * Sort folders hierarchically by order and name.
   */
  getSortedRootFolders(folders: Folder[]): Folder[] {
    return folders
      .filter((f) => f.parentId === null)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  },

  /**
   * Get sorted children of a specific folder.
   */
  getFolderChildren(folderId: string, folders: Folder[]): Folder[] {
    return folders
      .filter((f) => f.parentId === folderId)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  },

  /**
   * Calculate breadcrumb display path for a folder (e.g. "Projects / STACK").
   */
  getFolderPath(folderId: string, folders: Folder[]): string {
    const folderMap = new Map<string, Folder>();
    folders.forEach((f) => folderMap.set(f.id, f));

    const pathSegments: string[] = [];
    let current: Folder | undefined = folderMap.get(folderId);

    while (current) {
      pathSegments.unshift(current.name);
      current = current.parentId ? folderMap.get(current.parentId) : undefined;
    }

    return pathSegments.join(' / ');
  },
};
