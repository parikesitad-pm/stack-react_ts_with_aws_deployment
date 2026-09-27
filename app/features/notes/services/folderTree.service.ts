import type { Folder } from '../types/note.types';

export const folderTreeService = {
  /**
   * Validates a folder name according to STACK rules:
   * - 1 to 80 characters (trimmed)
   * - Prohibits '/' and control characters
   * - Prohibits duplicate sibling folder names under the same parentId
   */
  validateFolderName(
    name: string,
    parentId: string | null,
    folders: Folder[],
    currentFolderId?: string
  ): { valid: boolean; error?: string } {
    const clean = name.trim();
    if (clean.length === 0) {
      return { valid: false, error: 'Folder name cannot be empty.' };
    }
    if (clean.length > 80) {
      return { valid: false, error: 'Folder name cannot exceed 80 characters.' };
    }
    if (clean.includes('/')) {
      return { valid: false, error: "Folder name cannot contain '/'." };
    }
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001F\u007F-\u009F]/.test(clean)) {
      return { valid: false, error: 'Folder name cannot contain control characters.' };
    }

    const isDuplicate = folders.some(
      (f) =>
        f.parentId === parentId &&
        f.id !== currentFolderId &&
        f.name.toLowerCase() === clean.toLowerCase()
    );
    if (isDuplicate) {
      return {
        valid: false,
        error: `A folder named "${clean}" already exists in this location.`,
      };
    }

    return { valid: true };
  },

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
   * Returns a Set containing folderId itself plus all its descendant IDs.
   * Used to validate destinations and prevent reparenting into a deleted subtree.
   */
  getFolderSubtreeIds(folderId: string, folders: Folder[]): Set<string> {
    const subtree = new Set<string>([folderId]);
    const descendants = this.getFolderDescendants(folderId, folders);
    descendants.forEach((id) => subtree.add(id));
    return subtree;
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
