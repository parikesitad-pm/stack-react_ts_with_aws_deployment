import { describe, it, expect, beforeEach } from 'vitest';
import { IdentityService } from './identity.service';
import { DevMockIdentityAdapter } from './identityMock.service';
import {
  SecurityChallengeService,
  MockSecurityChallengeAdapter,
} from './securityChallenge.service';
import { DeviceLockService } from './deviceLock.service';
import {
  userWorkspaceStorage,
  getWorkspaceDbName,
} from '~/features/workspace/services/userWorkspaceStorage';
import type { Note } from '~/features/notes/types/note.types';

function createTestNote(id: string, title: string, content: string): Note {
  return {
    id,
    title,
    content,
    tags: [],
    folderId: null,
    order: 0,
    isPinned: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'saved_locally',
  };
}

describe('Sprint 2: Profile, Account & Security Contracts', () => {
  const SUB_ALICE = 'auth0|operator_alice_999';
  const SUB_BOB = 'github|developer_bob_888';

  beforeEach(async () => {
    IdentityService.resetForTesting();
    SecurityChallengeService.resetForTesting();
    DeviceLockService.resetForTesting();
    userWorkspaceStorage.resetMemoryForTesting();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('1. Full Name & Profile Attributes', () => {
    it('allows updating and clearing optional full name without a security challenge', async () => {
      // 1. Initial onboarding
      await IdentityService.claimOnboarding(
        { username: 'alice', dateOfBirth: '1995-04-12' },
        SUB_ALICE
      );

      // 2. Set full name
      const updated = await IdentityService.updateProfile(
        { fullName: 'Alice Liddell' },
        SUB_ALICE
      );
      expect(updated.fullName).toBe('Alice Liddell');
      expect(updated.username).toBe('alice');

      // 3. Verify fetched profile has updated name
      const profile = await IdentityService.getProfile(SUB_ALICE);
      expect(profile?.fullName).toBe('Alice Liddell');

      // 4. Clear full name
      const cleared = await IdentityService.updateProfile(
        { fullName: '' },
        SUB_ALICE
      );
      expect(cleared.fullName).toBe('');
    });
  });

  describe('2. Atomic Username Update & Invariants', () => {
    it('updates username via atomic transaction with email challenge, releases old handle, and preserves workspace storage DB name', async () => {
      // Setup notes in Alice's isolated workspace
      const dbBefore = getWorkspaceDbName(SUB_ALICE);
      await userWorkspaceStorage.saveNotes(SUB_ALICE, [
        createTestNote('note_1', 'Top Secret Notes', '# Confidential\nDo not share.'),
      ]);

      // Claim original username
      await IdentityService.claimOnboarding({ username: 'alice' }, SUB_ALICE);

      // Verify Bob cannot claim 'alice'
      const availAlice = await IdentityService.checkAvailability('alice', SUB_BOB);
      expect(availAlice.available).toBe(false);

      // Request email challenge for changing username
      const challenge = await SecurityChallengeService.requestChallenge(
        'change-username',
        SUB_ALICE
      );
      expect(challenge.challengeId).toBeDefined();
      expect(challenge.devCode).toBeDefined();

      // Alice updates handle to 'alice_renamed'
      const updatedProfile = await IdentityService.updateUsername(
        {
          newUsername: 'alice_renamed',
          challengeId: challenge.challengeId,
          challengeCode: challenge.devCode!,
        },
        SUB_ALICE
      );
      expect(updatedProfile.username).toBe('alice_renamed');

      // INVARIANT 1: Old handle 'alice' must be released and available again
      const availOld = await IdentityService.checkAvailability('alice', SUB_BOB);
      expect(availOld.available).toBe(true);

      // Bob claims released handle 'alice'
      const bobProfile = await IdentityService.claimOnboarding(
        { username: 'alice' },
        SUB_BOB
      );
      expect(bobProfile.username).toBe('alice');

      // INVARIANT 2: Storage partition key (stack_user_{hash(sub)}) and notes MUST NOT change
      const dbAfter = getWorkspaceDbName(SUB_ALICE);
      expect(dbAfter).toBe(dbBefore);

      const aliceNotes = await userWorkspaceStorage.getNotes(SUB_ALICE);
      expect(aliceNotes.length).toBe(1);
      expect(aliceNotes[0]?.title).toBe('Top Secret Notes');
    });

    it('rejects username update if new handle is already claimed', async () => {
      await IdentityService.claimOnboarding({ username: 'alice' }, SUB_ALICE);
      await IdentityService.claimOnboarding({ username: 'bob' }, SUB_BOB);

      const challenge = await SecurityChallengeService.requestChallenge(
        'change-username',
        SUB_ALICE
      );

      await expect(
        IdentityService.updateUsername(
          {
            newUsername: 'bob',
            challengeId: challenge.challengeId,
            challengeCode: challenge.devCode!,
          },
          SUB_ALICE
        )
      ).rejects.toThrow('USERNAME_TAKEN');
    });
  });

  describe('3. Security Challenge Protocol & Digest Security', () => {
    it('enforces purpose binding, single-use, max attempts, and keyed digests', async () => {
      const challenge = await MockSecurityChallengeAdapter.createChallenge(
        SUB_ALICE,
        'change-username'
      );

      // 1. Wrong purpose rejects
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          challenge.devCode!,
          'delete-account',
          SUB_ALICE
        )
      ).rejects.toThrow('INVALID_CHALLENGE_PURPOSE');

      // 2. Wrong code increments attempts and fails
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          '000000',
          'change-username',
          SUB_ALICE
        )
      ).rejects.toThrow('INVALID_CHALLENGE_CODE');

      // 3. Second wrong attempt
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          '111111',
          'change-username',
          SUB_ALICE
        )
      ).rejects.toThrow('INVALID_CHALLENGE_CODE');

      // 4. Third wrong attempt
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          '222222',
          'change-username',
          SUB_ALICE
        )
      ).rejects.toThrow('INVALID_CHALLENGE_CODE');

      // 5. Exceeded max attempts burns the challenge even if correct code is entered
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          challenge.devCode!,
          'change-username',
          SUB_ALICE
        )
      ).rejects.toThrow('CHALLENGE_MAX_ATTEMPTS_EXCEEDED');
    });

    it('rejects replay attacks once a code is consumed', async () => {
      const challenge = await MockSecurityChallengeAdapter.createChallenge(
        SUB_ALICE,
        'change-email'
      );

      const firstUse = await MockSecurityChallengeAdapter.verifyAndConsume(
        challenge.challengeId,
        challenge.devCode!,
        'change-email',
        SUB_ALICE
      );
      expect(firstUse).toBe(true);

      // Attempting to consume again fails
      await expect(
        MockSecurityChallengeAdapter.verifyAndConsume(
          challenge.challengeId,
          challenge.devCode!,
          'change-email',
          SUB_ALICE
        )
      ).rejects.toThrow('CHALLENGE_ALREADY_USED');
    });
  });

  describe('4. Device PIN & Local Session Lock', () => {
    it('hashes 6-digit PIN with PBKDF2/SHA-256 and handles session lock/unlock', async () => {
      await DeviceLockService.setPin(SUB_ALICE, '123456', 5);
      const cfg = DeviceLockService.getConfig(SUB_ALICE);
      expect(cfg.enabled).toBe(true);
      expect(cfg.hashHex).toBeDefined();
      expect(cfg.saltHex).toBeDefined();
      expect(cfg.hashHex).not.toBe('123456');

      // Lock session
      DeviceLockService.lockSession(SUB_ALICE);
      expect(DeviceLockService.isSessionLocked(SUB_ALICE)).toBe(true);

      // Rejects wrong PIN
      await expect(DeviceLockService.verifyPin(SUB_ALICE, '999999')).rejects.toThrow(
        'Incorrect PIN.'
      );
      expect(DeviceLockService.isSessionLocked(SUB_ALICE)).toBe(true);

      // Unlocks with correct PIN
      const unlocked = await DeviceLockService.verifyPin(SUB_ALICE, '123456');
      expect(unlocked).toBe(true);
      expect(DeviceLockService.isSessionLocked(SUB_ALICE)).toBe(false);
    });

    it('enforces lockout cooldown after 5 failed attempts', async () => {
      await DeviceLockService.setPin(SUB_ALICE, '654321', 5);

      for (let i = 0; i < 4; i++) {
        await expect(DeviceLockService.verifyPin(SUB_ALICE, '000000')).rejects.toThrow(
          'Incorrect PIN.'
        );
      }

      // 5th failed attempt triggers temporary cooldown
      await expect(DeviceLockService.verifyPin(SUB_ALICE, '000000')).rejects.toThrow(
        'Incorrect PIN.'
      );

      // Next attempt is blocked by cooldown timer
      await expect(DeviceLockService.verifyPin(SUB_ALICE, '654321')).rejects.toThrow(
        /Device temporarily locked/
      );
    });

    it('allows safe PIN reset via reauthentication without destroying workspace notes', async () => {
      await userWorkspaceStorage.saveNotes(SUB_ALICE, [
        createTestNote('persistent_note', 'Preserved Note', 'This note must survive PIN resets.'),
      ]);

      await DeviceLockService.setPin(SUB_ALICE, '112233');
      DeviceLockService.lockSession(SUB_ALICE);
      expect(DeviceLockService.isSessionLocked(SUB_ALICE)).toBe(true);

      // Simulate "Forgot PIN? Sign in again" Auth0 reset
      DeviceLockService.resetAfterReauthentication(SUB_ALICE);

      const cfgAfter = DeviceLockService.getConfig(SUB_ALICE);
      expect(cfgAfter.enabled).toBe(false);
      expect(DeviceLockService.isSessionLocked(SUB_ALICE)).toBe(false);

      // Note is preserved
      const notes = await userWorkspaceStorage.getNotes(SUB_ALICE);
      expect(notes.length).toBe(1);
      expect(notes[0]?.title).toBe('Preserved Note');
    });
  });

  describe('5. Danger Zone & Account Deletion', () => {
    it('deletes user profile, releases username, and wipes local DB partition upon verified challenge + confirmation', async () => {
      // 1. Setup Alice and Bob
      await IdentityService.claimOnboarding({ username: 'alice' }, SUB_ALICE);
      await IdentityService.claimOnboarding({ username: 'bob' }, SUB_BOB);

      await userWorkspaceStorage.saveNotes(SUB_ALICE, [
        createTestNote('alice_note', "Alice's Note", 'To be deleted'),
      ]);

      await userWorkspaceStorage.saveNotes(SUB_BOB, [
        createTestNote('bob_note', "Bob's Note", 'Must remain intact'),
      ]);

      // 2. Request challenge for deletion
      const challenge = await SecurityChallengeService.requestChallenge(
        'delete-account',
        SUB_ALICE
      );

      // 3. Rejects if confirmed username does not match
      await expect(
        IdentityService.deleteAccount(
          {
            confirmedUsername: 'wrong_username',
            challengeId: challenge.challengeId,
            challengeCode: challenge.devCode!,
          },
          SUB_ALICE
        )
      ).rejects.toThrow('USERNAME_CONFIRMATION_MISMATCH');

      // 4. Delete with correct confirmation and code
      const deleted = await IdentityService.deleteAccount(
        {
          confirmedUsername: '@alice',
          challengeId: challenge.challengeId,
          challengeCode: challenge.devCode!,
        },
        SUB_ALICE
      );
      expect(deleted).toBe(true);

      // 5. Profile is gone and handle is released
      const aliceProfile = await IdentityService.getProfile(SUB_ALICE);
      expect(aliceProfile).toBeNull();

      const availAlice = await IdentityService.checkAvailability('alice');
      expect(availAlice.available).toBe(true);

      // 6. Wipe Alice's local workspace
      await userWorkspaceStorage.clearUserData(SUB_ALICE);
      const aliceNotes = await userWorkspaceStorage.getNotes(SUB_ALICE);
      expect(aliceNotes.length).toBe(0);

      // 7. INVARIANT: Bob's notes and profile remain completely untouched
      const bobProfile = await IdentityService.getProfile(SUB_BOB);
      expect(bobProfile?.username).toBe('bob');

      const bobNotes = await userWorkspaceStorage.getNotes(SUB_BOB);
      expect(bobNotes.length).toBe(1);
      expect(bobNotes[0]?.title).toBe("Bob's Note");
    });
  });
});
