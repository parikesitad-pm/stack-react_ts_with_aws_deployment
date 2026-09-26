import { describe, it, expect, beforeEach } from 'vitest';
import { userWorkspaceStorage, hashSub } from './userWorkspaceStorage';
import type { Note, Folder } from '~/features/notes/types/note.types';

describe('Strict Per-User Workspace Storage Isolation', () => {
  beforeEach(() => {
    userWorkspaceStorage.resetMemoryForTesting();
  });

  it('hashes Auth0 sub into stable and unique database names', () => {
    const dbA = userWorkspaceStorage.getWorkspaceDbName('auth0|user_alpha');
    const dbB = userWorkspaceStorage.getWorkspaceDbName('google-oauth2|user_beta');
    const dbA2 = userWorkspaceStorage.getWorkspaceDbName('auth0|user_alpha');

    expect(dbA).not.toBe(dbB);
    expect(dbA).toBe(dbA2);
    expect(dbA.startsWith('stack_user_')).toBe(true);
  });

  it('guarantees Account A notes are invisible to Account B', async () => {
    const subA = 'auth0|user_a_123';
    const subB = 'google-oauth2|user_b_456';

    const noteA: Note = {
      id: 'note_a',
      title: 'PRIVATE NOTE A',
      content: 'Confidential thoughts from Account A',
      tags: ['secret'],
      folderId: null,
      order: 0,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'saved_locally',
    };

    // User A saves note
    await userWorkspaceStorage.saveNotes(subA, [noteA]);

    // User A retrieves note
    const notesA = await userWorkspaceStorage.getNotes(subA);
    expect(notesA).toHaveLength(1);
    expect(notesA[0]?.title).toBe('PRIVATE NOTE A');

    // User B opens their workspace
    const notesB = await userWorkspaceStorage.getNotes(subB);
    expect(notesB).toHaveLength(0); // Account B is clean & empty!
  });

  it('guarantees Account B creating notes does not alter Account A', async () => {
    const subA = 'auth0|user_a_123';
    const subB = 'google-oauth2|user_b_456';

    const noteA: Note = {
      id: 'note_a',
      title: 'PRIVATE NOTE A',
      content: 'Content A',
      tags: [],
      folderId: null,
      order: 0,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'saved_locally',
    };

    const noteB: Note = {
      id: 'note_b',
      title: 'PRIVATE NOTE B',
      content: 'Content B',
      tags: [],
      folderId: null,
      order: 0,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'saved_locally',
    };

    await userWorkspaceStorage.saveNotes(subA, [noteA]);
    await userWorkspaceStorage.saveNotes(subB, [noteB]);

    // Verify A only sees note A
    const notesA = await userWorkspaceStorage.getNotes(subA);
    expect(notesA).toHaveLength(1);
    expect(notesA[0]?.id).toBe('note_a');

    // Verify B only sees note B
    const notesB = await userWorkspaceStorage.getNotes(subB);
    expect(notesB).toHaveLength(1);
    expect(notesB[0]?.id).toBe('note_b');
  });

  it('guarantees folders and attachments are strictly partitioned by sub', async () => {
    const subA = 'auth0|user_a';
    const subB = 'github|user_b';

    const folderA: Folder = {
      id: 'folder_a',
      name: 'User A Folder',
      parentId: null,
      order: 0,
    };

    await userWorkspaceStorage.saveFolders(subA, [folderA]);

    expect(await userWorkspaceStorage.getFolders(subA)).toHaveLength(1);
    expect(await userWorkspaceStorage.getFolders(subB)).toHaveLength(0);

    // Attachments
    const mockBlob = new Blob(['sample-binary-data'], { type: 'text/plain' });
    await userWorkspaceStorage.saveAttachment(
      subA,
      './assets/private-doc.txt',
      mockBlob,
      'text/plain'
    );

    const attA = await userWorkspaceStorage.getAttachment(
      subA,
      './assets/private-doc.txt'
    );
    const attB = await userWorkspaceStorage.getAttachment(
      subB,
      './assets/private-doc.txt'
    );

    expect(attA).not.toBeNull();
    expect(attB).toBeNull();
  });
});
