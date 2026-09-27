import { describe, it, expect, beforeEach } from 'vitest';
import {
  demoWorkspaceService,
  DEMO_SUB,
  DEMO_USER,
  INITIAL_DEMO_FOLDERS,
  INITIAL_DEMO_NOTES,
} from './demoWorkspace.service';
import {
  userWorkspaceStorage,
  getWorkspaceDbName,
  getLayoutStorageKey,
} from '~/features/workspace/services/userWorkspaceStorage';
import {
  CANONICAL_USERNAME_REGEX,
  usernameSchema,
} from '~/features/profile/schemas/username.schema';

describe('Canonical Username Contract & Demo Workspace Isolation', () => {
  beforeEach(() => {
    userWorkspaceStorage.resetMemoryForTesting();
  });

  describe('1. Canonical Username Contract Alignment', () => {
    it('matches exact canonical regex ^[a-z0-9._-]{3,32}$', () => {
      expect(CANONICAL_USERNAME_REGEX.test('luca')).toBe(true);
      expect(CANONICAL_USERNAME_REGEX.test('luca_pm')).toBe(true);
      expect(CANONICAL_USERNAME_REGEX.test('luca.sena')).toBe(true);
      expect(CANONICAL_USERNAME_REGEX.test('luca-notes-2026')).toBe(true);
      expect(CANONICAL_USERNAME_REGEX.test('a'.repeat(32))).toBe(true);

      // Rejections
      expect(CANONICAL_USERNAME_REGEX.test('lu')).toBe(false); // < 3 chars
      expect(CANONICAL_USERNAME_REGEX.test('a'.repeat(33))).toBe(false); // > 32 chars
      expect(CANONICAL_USERNAME_REGEX.test('Luca')).toBe(false); // uppercase
      expect(CANONICAL_USERNAME_REGEX.test('luca sena')).toBe(false); // spaces
      expect(CANONICAL_USERNAME_REGEX.test('luca@pm')).toBe(false); // arbitrary symbol
      expect(CANONICAL_USERNAME_REGEX.test('luca!123')).toBe(false); // arbitrary symbol
    });

    it('rejects leading/trailing dots and spaces via usernameSchema', () => {
      expect(usernameSchema.safeParse('.luca').success).toBe(false);
      expect(usernameSchema.safeParse('luca.').success).toBe(false);
      expect(usernameSchema.safeParse('luca sena').success).toBe(false);
    });
  });

  describe('2. Demo Workspace Isolation & Namespace Guarantee', () => {
    it('maps demo sub to stack_demo_workspace and never stack_user_{sub}', () => {
      const demoDb = getWorkspaceDbName('demo');
      expect(demoDb).toBe('stack_demo_workspace');

      const realUserDb = getWorkspaceDbName('auth0|66f5c8192a');
      expect(realUserDb).toMatch(/^stack_user_/);
      expect(realUserDb).not.toBe('stack_demo_workspace');
    });

    it('maps demo layout storage key to stack_demo_layout', () => {
      const demoLayoutKey = getLayoutStorageKey('demo');
      expect(demoLayoutKey).toBe('stack_demo_layout');

      const realLayoutKey = getLayoutStorageKey('auth0|66f5c8192a');
      expect(realLayoutKey).toMatch(/^stack_layout_/);
      expect(realLayoutKey).not.toBe('stack_demo_layout');
    });

    it('seeds demo workspace with initial folders and notes without touching authenticated databases', async () => {
      // 1. Seed demo
      await demoWorkspaceService.seedDemoWorkspace();

      const demoNotes = await userWorkspaceStorage.getNotes(DEMO_SUB);
      expect(demoNotes.length).toBe(INITIAL_DEMO_NOTES.length);
      expect(demoNotes.map((n) => n.title)).toContain('Welcome to STACK');
      expect(demoNotes.map((n) => n.title)).toContain('Markdown Playground');

      const demoFolders = await userWorkspaceStorage.getFolders(DEMO_SUB);
      expect(demoFolders.length).toBe(INITIAL_DEMO_FOLDERS.length);
      expect(demoFolders.map((f) => f.name)).toContain('Getting Started');

      // 2. Real user partition remains completely empty
      const realUserNotes = await userWorkspaceStorage.getNotes(
        'auth0|operator_alice'
      );
      expect(realUserNotes.length).toBe(0);
    });

    it('resetDemoWorkspace restores original seeded state and never wipes authenticated user data', async () => {
      // 1. Authenticated user has notes
      const AUTH_SUB = 'auth0|operator_alice';
      await userWorkspaceStorage.saveNotes(AUTH_SUB, [
        {
          id: 'alice-note-1',
          title: "Alice's Secret Note",
          content: '# Private Content',
          tags: ['private'],
          folderId: null,
          isPinned: false,
          archivedAt: null,
          deletedAt: null,
          syncStatus: 'saved_locally',
          order: 0,
          createdAt: '2026-09-27T00:00:00.000Z',
          updatedAt: '2026-09-27T00:00:00.000Z',
        },
      ]);

      // 2. Demo is seeded, then modified
      await demoWorkspaceService.seedDemoWorkspace();
      const currentDemoNotes = await userWorkspaceStorage.getNotes(DEMO_SUB);
      await userWorkspaceStorage.saveNotes(DEMO_SUB, [
        ...currentDemoNotes,
        {
          id: 'demo-user-scratch',
          title: 'Visitor Scratchpad',
          content: 'Random thoughts in demo mode',
          tags: ['scratch'],
          folderId: null,
          isPinned: false,
          archivedAt: null,
          deletedAt: null,
          syncStatus: 'saved_locally',
          order: 99,
          createdAt: '2026-09-27T00:00:00.000Z',
          updatedAt: '2026-09-27T00:00:00.000Z',
        },
      ]);

      const demoNotesBeforeReset =
        await userWorkspaceStorage.getNotes(DEMO_SUB);
      expect(demoNotesBeforeReset.length).toBe(INITIAL_DEMO_NOTES.length + 1);

      // 3. User clicks Reset Demo
      await demoWorkspaceService.resetDemoWorkspace();

      // 4. Demo is restored to initial sample notes only
      const demoNotesAfterReset = await userWorkspaceStorage.getNotes(DEMO_SUB);
      expect(demoNotesAfterReset.length).toBe(INITIAL_DEMO_NOTES.length);
      expect(
        demoNotesAfterReset.some((n) => n.id === 'demo-user-scratch')
      ).toBe(false);

      // 5. INVARIANT: Authenticated user notes are completely untouched!
      const aliceNotes = await userWorkspaceStorage.getNotes(AUTH_SUB);
      expect(aliceNotes.length).toBe(1);
      expect(aliceNotes[0]?.title).toBe("Alice's Secret Note");
    });

    it('DEMO_USER identity constants never provide real credentials or tokens', () => {
      expect(DEMO_USER.sub).toBe('demo');
      expect(DEMO_USER.provider).toBe('demo');
      expect(DEMO_USER.isSocial).toBe(false);
      expect(DEMO_USER.hasCompletedOnboarding).toBe(true);
    });
  });
});
