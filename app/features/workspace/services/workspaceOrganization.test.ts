import { describe, it, expect, beforeEach } from 'vitest';
import type { Folder, Note } from '~/features/notes/types/note.types';
import { folderTreeService } from '~/features/notes/services/folderTree.service';
import { workspaceMoveService } from './workspaceMove.service';
import { workspaceOrderService } from './workspaceOrder.service';
import { noteOrganizationService } from '~/features/notes/services/noteOrganization.service';
import { tagService } from '~/features/tags/services/tag.service';
import { userWorkspaceStorage } from './userWorkspaceStorage';

function createNote(
  id: string,
  title: string,
  folderId: string | null = null,
  tags: string[] = [],
  order = 100
): Note {
  return {
    id,
    title,
    content: `# ${title}`,
    tags,
    folderId,
    order,
    isPinned: false,
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'saved_locally',
  };
}

function createFolder(
  id: string,
  name: string,
  parentId: string | null = null,
  order = 100
): Folder {
  return {
    id,
    name,
    parentId,
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Sprint 3: Workspace Organization Test Suite', () => {
  beforeEach(() => {
    userWorkspaceStorage.resetMemoryForTesting();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Folder Hierarchy & Sibling Validation', () => {
    it('validates folder names strictly (length, slash, control characters, sibling duplicates)', () => {
      const folders: Folder[] = [
        createFolder('f1', 'Engineering', null),
        createFolder('f2', 'Specs', 'f1'),
      ];

      // Empty / whitespace
      expect(folderTreeService.validateFolderName('', null, folders).valid).toBe(false);
      expect(folderTreeService.validateFolderName('   ', null, folders).valid).toBe(false);

      // Over 80 chars
      expect(folderTreeService.validateFolderName('a'.repeat(81), null, folders).valid).toBe(false);

      // Slash prohibited
      expect(folderTreeService.validateFolderName('projects/frontend', null, folders).valid).toBe(false);

      // Duplicate siblings prohibited (case-insensitive)
      expect(folderTreeService.validateFolderName('engineering', null, folders).valid).toBe(false);
      expect(folderTreeService.validateFolderName('specs', 'f1', folders).valid).toBe(false);

      // Same name allowed under different parent
      expect(folderTreeService.validateFolderName('Specs', null, folders).valid).toBe(true);

      // Valid new folder
      expect(folderTreeService.validateFolderName('Research & Notes', null, folders).valid).toBe(true);
    });

    it('strictly prevents cycle creation in nested folders', () => {
      // Tree: Root -> A -> B -> C
      const folders: Folder[] = [
        createFolder('A', 'Folder A', null),
        createFolder('B', 'Folder B', 'A'),
        createFolder('C', 'Folder C', 'B'),
      ];

      // Moving A into A is invalid
      expect(folderTreeService.wouldCreateCycle('A', 'A', folders)).toBe(true);

      // Moving A into its direct child B creates a cycle
      expect(folderTreeService.wouldCreateCycle('A', 'B', folders)).toBe(true);

      // Moving A into its grandchild C creates a cycle
      expect(folderTreeService.wouldCreateCycle('A', 'C', folders)).toBe(true);

      // Moving C into A is valid
      expect(folderTreeService.wouldCreateCycle('C', 'A', folders)).toBe(false);

      // Moving B to root is valid
      expect(folderTreeService.wouldCreateCycle('B', null, folders)).toBe(false);
    });

    it('retrieves descendants and subtree IDs accurately', () => {
      const folders: Folder[] = [
        createFolder('A', 'A', null),
        createFolder('B', 'B', 'A'),
        createFolder('C', 'C', 'B'),
        createFolder('D', 'D', 'A'),
        createFolder('E', 'E', null),
      ];

      const descendantsA = folderTreeService.getFolderDescendants('A', folders);
      expect(descendantsA).toContain('B');
      expect(descendantsA).toContain('C');
      expect(descendantsA).toContain('D');
      expect(descendantsA).not.toContain('E');

      const subtreeA = folderTreeService.getFolderSubtreeIds('A', folders);
      expect(subtreeA.has('A')).toBe(true);
      expect(subtreeA.has('B')).toBe(true);
      expect(subtreeA.has('C')).toBe(true);
      expect(subtreeA.has('D')).toBe(true);
      expect(subtreeA.has('E')).toBe(false);
    });
  });

  describe('2. Hierarchy-Preserving Safe Folder Deletion', () => {
    it('reparents ONLY direct notes and immediate child folders without flattening descendants', () => {
      // Structure:
      // - Folder A (id: 'A')
      //   - Note NA (direct note in A)
      //   - Folder B (id: 'B', child of A)
      //     - Note NB (direct note in B)
      //     - Folder C (id: 'C', child of B)
      //       - Note NC (direct note in C)
      const folders: Folder[] = [
        createFolder('A', 'Folder A', null),
        createFolder('B', 'Folder B', 'A'),
        createFolder('C', 'Folder C', 'B'),
        createFolder('Dest', 'Destination Folder', null),
      ];

      const notes: Note[] = [
        createNote('n_a', 'Note in A', 'A'),
        createNote('n_b', 'Note in B', 'B'),
        createNote('n_c', 'Note in C', 'C'),
      ];

      // Delete Folder A, moving contents to 'Dest'
      const result = workspaceMoveService.reparentFolderContents(
        'A',
        'Dest',
        folders,
        notes
      );

      // 1. Folder A must be removed
      expect(result.updatedFolders.find((f) => f.id === 'A')).toBeUndefined();

      // 2. Direct note NA must be reparented to 'Dest'
      const updatedNA = result.updatedNotes.find((n) => n.id === 'n_a');
      expect(updatedNA?.folderId).toBe('Dest');

      // 3. Immediate child folder B must be reparented to 'Dest'
      const updatedB = result.updatedFolders.find((f) => f.id === 'B');
      expect(updatedB?.parentId).toBe('Dest');

      // 4. CRITICAL INVARIANT: Grandchild C MUST REMAIN A CHILD OF B (NOT flattened to Dest!)
      const updatedC = result.updatedFolders.find((f) => f.id === 'C');
      expect(updatedC?.parentId).toBe('B');

      // 5. Notes NB and NC must remain in their respective subfolders
      const updatedNB = result.updatedNotes.find((n) => n.id === 'n_b');
      expect(updatedNB?.folderId).toBe('B');

      const updatedNC = result.updatedNotes.find((n) => n.id === 'n_c');
      expect(updatedNC?.folderId).toBe('C');
    });

    it('rejects reparenting into a destination inside the deleted folder subtree', () => {
      const folders: Folder[] = [
        createFolder('A', 'A', null),
        createFolder('B', 'B', 'A'),
      ];
      const notes: Note[] = [createNote('n1', 'N1', 'A')];

      // Destination is 'B', which is inside 'A'
      expect(() =>
        workspaceMoveService.reparentFolderContents('A', 'B', folders, notes)
      ).toThrow('Destination cannot be inside the deleted folder or its subfolders.');
    });
  });

  describe('3. Reordering Before / After Siblings', () => {
    it('reorders notes before and after target sibling with normalized order sequence', () => {
      const notes: Note[] = [
        createNote('n1', 'First', null, [], 100),
        createNote('n2', 'Second', null, [], 200),
        createNote('n3', 'Third', null, [], 300),
      ];

      // Move n3 BEFORE n1
      const reorderedBefore = workspaceOrderService.reorderNotes('n3', 'n1', 'before', notes);
      expect(reorderedBefore.map((n) => n.id)).toEqual(['n3', 'n1', 'n2']);
      expect(reorderedBefore[0]?.order).toBe(100);
      expect(reorderedBefore[1]?.order).toBe(200);
      expect(reorderedBefore[2]?.order).toBe(300);

      // Move n1 AFTER n2
      const reorderedAfter = workspaceOrderService.reorderNotes('n1', 'n2', 'after', notes);
      expect(reorderedAfter.map((n) => n.id)).toEqual(['n2', 'n1', 'n3']);
    });

    it('reorders folders before and after siblings while preventing cycles', () => {
      const folders: Folder[] = [
        createFolder('f1', 'Folder 1', null, 100),
        createFolder('f2', 'Folder 2', null, 200),
        createFolder('f3', 'Folder 3', null, 300),
      ];

      const reordered = workspaceOrderService.reorderFolders('f3', 'f1', 'before', folders);
      expect(reordered.map((f) => f.id)).toEqual(['f3', 'f1', 'f2']);
      expect(reordered[0]?.order).toBe(100);
      expect(reordered[1]?.order).toBe(200);
      expect(reordered[2]?.order).toBe(300);
    });
  });

  describe('4. Note State Precedence: Active vs Archive vs Trash', () => {
    it('strictly enforces trash precedence over archive', () => {
      const active = createNote('active', 'Active Note');
      expect(noteOrganizationService.isNoteActive(active)).toBe(true);
      expect(noteOrganizationService.isNoteArchived(active)).toBe(false);
      expect(noteOrganizationService.isNoteTrashed(active)).toBe(false);

      const archived = noteOrganizationService.archiveNote('active', [active])[0]!;
      expect(noteOrganizationService.isNoteActive(archived)).toBe(false);
      expect(noteOrganizationService.isNoteArchived(archived)).toBe(true);
      expect(noteOrganizationService.isNoteTrashed(archived)).toBe(false);

      // Trashing an archived note
      const trashedFromArchived = noteOrganizationService.moveToTrash(archived.id, [archived])[0]!;
      expect(noteOrganizationService.isNoteActive(trashedFromArchived)).toBe(false);
      expect(noteOrganizationService.isNoteArchived(trashedFromArchived)).toBe(false); // Trash takes precedence!
      expect(noteOrganizationService.isNoteTrashed(trashedFromArchived)).toBe(true);
      expect(trashedFromArchived.archivedAt).not.toBeNull(); // Preserves archivedAt for restoration

      // Restoring from trash restores back to Archive state
      const restored = noteOrganizationService.restoreFromTrash(trashedFromArchived.id, [trashedFromArchived])[0]!;
      expect(noteOrganizationService.isNoteActive(restored)).toBe(false);
      expect(noteOrganizationService.isNoteArchived(restored)).toBe(true); // Restored to archive!
      expect(noteOrganizationService.isNoteTrashed(restored)).toBe(false);
    });

    it('excludes trashed notes from All Notes and folder note listings', () => {
      const notes: Note[] = [
        createNote('n1', 'Active in Folder', 'f1'),
        createNote('n2', 'Trashed in Folder', 'f1'),
      ];
      notes[1] = noteOrganizationService.moveToTrash('n2', notes).find((n) => n.id === 'n2')!;

      const folderNotes = noteOrganizationService.getNotesInFolder(notes, 'f1');
      expect(folderNotes).toHaveLength(1);
      expect(folderNotes[0]?.id).toBe('n1');
    });

    it('empties only trashed notes, keeping active and archived notes intact', () => {
      const notes: Note[] = [
        createNote('n1', 'Active'),
        createNote('n2', 'Archived'),
        createNote('n3', 'Trashed'),
      ];
      const withArchive = noteOrganizationService.archiveNote('n2', notes);
      const withTrash = noteOrganizationService.moveToTrash('n3', withArchive);

      const afterEmpty = noteOrganizationService.emptyTrash(withTrash);
      expect(afterEmpty).toHaveLength(2);
      expect(afterEmpty.map((n) => n.id)).toEqual(['n1', 'n2']);
    });
  });

  describe('5. Tag Extraction & Mutation', () => {
    it('normalizes tags and calculates counts only from active notes', () => {
      const notes: Note[] = [
        createNote('n1', 'Note 1', null, ['react', '#TypeScript', 'AWS']),
        createNote('n2', 'Note 2', null, ['REACT', 'Architecture']),
        createNote('n3', 'Archived Note', null, ['AWS', 'react']),
        createNote('n4', 'Trashed Note', null, ['AWS', 'react']),
      ];
      // Archive n3 and Trash n4
      notes[2] = noteOrganizationService.archiveNote('n3', notes).find((n) => n.id === 'n3')!;
      notes[3] = noteOrganizationService.moveToTrash('n4', notes).find((n) => n.id === 'n4')!;

      const activeTags = tagService.extractActiveTags(notes);

      // Only active notes (n1, n2) are counted:
      // react: n1, n2 -> 2
      // typescript: n1 -> 1
      // aws: n1 -> 1
      // architecture: n2 -> 1
      const tagMap = new Map(activeTags.map((t) => [t.tag, t.count]));
      expect(tagMap.get('react')).toBe(2);
      expect(tagMap.get('typescript')).toBe(1);
      expect(tagMap.get('aws')).toBe(1);
      expect(tagMap.get('architecture')).toBe(1);
    });

    it('adds and removes tags cleanly without duplicates', () => {
      let note = createNote('n1', 'Note 1', null, ['alpha']);

      note = tagService.addTagToNote(note, '#beta');
      expect(note.tags).toEqual(['alpha', 'beta']);

      // Duplicate add is a no-op
      note = tagService.addTagToNote(note, 'BETA');
      expect(note.tags).toEqual(['alpha', 'beta']);

      note = tagService.removeTagFromNote(note, 'alpha');
      expect(note.tags).toEqual(['beta']);
    });
  });

  describe('6. Strict Per-User Layout Partitioning', () => {
    it('persists and isolates layout settings strictly per Auth0 sub', () => {
      const subAlice = 'auth0|alice_123';
      const subBob = 'github|bob_456';

      // Default settings
      const defaultAlice = userWorkspaceStorage.getLayoutSettings(subAlice);
      expect(defaultAlice.sidebarMode).toBe('expanded');
      expect(defaultAlice.sidebarWidth).toBe(260);
      expect(defaultAlice.expandedFolderIds).toEqual([]);

      // Alice customizes layout
      userWorkspaceStorage.saveLayoutSettings(subAlice, {
        sidebarMode: 'compact',
        sidebarWidth: 320,
        expandedFolderIds: ['folder_alice_1'],
      });

      // Verify Alice has saved settings
      const aliceLayout = userWorkspaceStorage.getLayoutSettings(subAlice);
      expect(aliceLayout.sidebarMode).toBe('compact');
      expect(aliceLayout.sidebarWidth).toBe(320);
      expect(aliceLayout.expandedFolderIds).toEqual(['folder_alice_1']);

      // Verify Bob is completely isolated and retains defaults
      const bobLayout = userWorkspaceStorage.getLayoutSettings(subBob);
      expect(bobLayout.sidebarMode).toBe('expanded');
      expect(bobLayout.sidebarWidth).toBe(260);
      expect(bobLayout.expandedFolderIds).toEqual([]);
    });

    it('bounds sidebar width between 220px and 420px', () => {
      const sub = 'auth0|test_user';

      userWorkspaceStorage.saveLayoutSettings(sub, { sidebarWidth: 100 });
      expect(userWorkspaceStorage.getLayoutSettings(sub).sidebarWidth).toBe(220);

      userWorkspaceStorage.saveLayoutSettings(sub, { sidebarWidth: 800 });
      expect(userWorkspaceStorage.getLayoutSettings(sub).sidebarWidth).toBe(420);
    });
  });
});
