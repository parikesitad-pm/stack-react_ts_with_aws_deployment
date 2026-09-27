import type { UserProfile } from '../schemas/username.schema';
import { normalizeUsername, usernameSchema } from '../schemas/username.schema';
import type { OnboardingPayload, UsernameAvailabilityResult } from './identity.service';

/**
 * Storage key for local development simulation when VITE_API_BASE_URL is not set.
 *
 * IMPORTANT: This mock store is for local development and test fixtures ONLY.
 * It does NOT guarantee global uniqueness across devices or tenants.
 */
const DEV_MOCK_STORAGE_KEY = 'stack_identity_dev_mock_items';

interface MockDynamoItem {
  PK: string; // e.g. "USER#auth0|xxx" or "USERNAME#luca"
  SK: string; // e.g. "PROFILE" or "CLAIM"
  data: Record<string, unknown>;
  createdAt: string;
}

export class DevMockIdentityAdapter {
  private static memoryStore: MockDynamoItem[] = [];

  static suggestAlternatives(base: string): string[] {
    const clean = normalizeUsername(base);
    const year = new Date().getFullYear();
    const candidates = [
      `${clean}.${year.toString().slice(-2)}`,
      `${clean}_pm`,
      `${clean}-notes`,
      `${clean}.stack`,
      `${clean}01`,
    ];
    return candidates.filter((c) => usernameSchema.safeParse(c).success);
  }

  static checkAvailability(rawUsername: string): UsernameAvailabilityResult {
    const normalized = normalizeUsername(rawUsername);
    const validation = usernameSchema.safeParse(normalized);
    if (!validation.success) {
      return { available: false, normalizedUsername: normalized };
    }

    const items = this.loadItems();
    const claimPk = `USERNAME#${normalized}`;
    const isTaken = items.some((item) => item.PK === claimPk);

    return {
      available: !isTaken,
      normalizedUsername: normalized,
      suggestions: isTaken ? this.suggestAlternatives(normalized) : undefined,
    };
  }

  static getProfile(sub: string): UserProfile | null {
    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (userItem) {
      return userItem.data as unknown as UserProfile;
    }
    return null;
  }

  static claimOnboarding(
    sub: string,
    payload: OnboardingPayload,
    email?: string
  ): UserProfile {
    const normalized = normalizeUsername(payload.username);
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Invalid username');
    }

    const items = this.loadItems();
    const claimPk = `USERNAME#${normalized}`;
    const existingClaim = items.find((i) => i.PK === claimPk);

    // Conditional check: attribute_not_exists(PK)
    if (existingClaim && existingClaim.data.ownerSub !== sub) {
      throw new Error('USERNAME_TAKEN');
    }

    const now = new Date().toISOString();
    const userProfile: UserProfile = {
      sub,
      username: normalized,
      email,
      dateOfBirth: payload.dateOfBirth,
      onboardingCompletedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const filtered = items.filter(
      (i) => i.PK !== `USER#${sub}` && i.PK !== claimPk
    );
    filtered.push({
      PK: `USER#${sub}`,
      SK: 'PROFILE',
      data: userProfile as unknown as Record<string, unknown>,
      createdAt: now,
    });
    filtered.push({
      PK: claimPk,
      SK: 'CLAIM',
      data: { ownerSub: sub, username: normalized },
      createdAt: now,
    });

    this.saveItems(filtered);
    return userProfile;
  }

  static updateProfile(
    sub: string,
    partial: { fullName?: string; avatarKey?: string; avatarVersion?: string }
  ): UserProfile {
    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (!userItem) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const currentProfile = userItem.data as unknown as UserProfile;
    const updated: UserProfile = {
      ...currentProfile,
      fullName: partial.fullName !== undefined ? partial.fullName : currentProfile.fullName,
      avatarKey: partial.avatarKey !== undefined ? partial.avatarKey : currentProfile.avatarKey,
      avatarVersion: partial.avatarVersion !== undefined ? partial.avatarVersion : currentProfile.avatarVersion,
      updatedAt: new Date().toISOString(),
    };

    userItem.data = updated as unknown as Record<string, unknown>;
    this.saveItems(items);
    return updated;
  }

  static async updateUsername(
    sub: string,
    newUsernameRaw: string,
    challengeId: string,
    challengeCode: string
  ): Promise<UserProfile> {
    const { MockSecurityChallengeAdapter } = await import('./securityChallenge.service');
    // 1. Verify and consume the email security challenge
    await MockSecurityChallengeAdapter.verifyAndConsume(
      challengeId,
      challengeCode,
      'change-username',
      sub
    );

    const normalized = normalizeUsername(newUsernameRaw);
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Invalid username');
    }

    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (!userItem) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    const currentProfile = userItem.data as unknown as UserProfile;

    if (currentProfile.username === normalized) {
      return currentProfile; // No-op if same
    }

    const newClaimPk = `USERNAME#${normalized}`;
    const existingClaim = items.find((i) => i.PK === newClaimPk);
    if (existingClaim && existingClaim.data.ownerSub !== sub) {
      throw new Error('USERNAME_TAKEN');
    }

    // Atomic transaction: Delete old claim, put new claim, update profile
    const oldClaimPk = `USERNAME#${currentProfile.username}`;
    const now = new Date().toISOString();
    const updatedProfile: UserProfile = {
      ...currentProfile,
      username: normalized,
      updatedAt: now,
    };

    // Filter out old claim and user profile
    const filtered = items.filter(
      (i) => i.PK !== oldClaimPk && i.PK !== userPk && i.PK !== newClaimPk
    );

    // Add updated profile
    filtered.push({
      PK: userPk,
      SK: 'PROFILE',
      data: updatedProfile as unknown as Record<string, unknown>,
      createdAt: userItem.createdAt,
    });

    // Add new claim
    filtered.push({
      PK: newClaimPk,
      SK: 'CLAIM',
      data: { ownerSub: sub, username: normalized },
      createdAt: now,
    });

    this.saveItems(filtered);
    return updatedProfile;
  }

  static async updateEmail(
    sub: string,
    newEmail: string,
    challengeId: string,
    challengeCode: string
  ): Promise<UserProfile> {
    const { MockSecurityChallengeAdapter } = await import('./securityChallenge.service');
    await MockSecurityChallengeAdapter.verifyAndConsume(
      challengeId,
      challengeCode,
      'change-email',
      sub
    );

    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (!userItem) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const currentProfile = userItem.data as unknown as UserProfile;
    const updated: UserProfile = {
      ...currentProfile,
      email: newEmail.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    };

    userItem.data = updated as unknown as Record<string, unknown>;
    this.saveItems(items);
    return updated;
  }

  static deleteAvatar(sub: string): UserProfile {
    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (!userItem) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const currentProfile = userItem.data as unknown as UserProfile;
    const { avatarKey, avatarVersion, avatarUrl, ...rest } = currentProfile;
    const updated: UserProfile = {
      ...rest,
      updatedAt: new Date().toISOString(),
    };

    userItem.data = updated as unknown as Record<string, unknown>;
    this.saveItems(items);
    return updated;
  }

  static async deleteAccount(
    sub: string,
    confirmedUsername: string,
    challengeId: string,
    challengeCode: string
  ): Promise<boolean> {
    const items = this.loadItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (!userItem) {
      throw new Error('PROFILE_NOT_FOUND');
    }

    const currentProfile = userItem.data as unknown as UserProfile;
    const normalizedConfirmed = normalizeUsername(confirmedUsername);
    if (normalizedConfirmed !== currentProfile.username) {
      throw new Error('USERNAME_CONFIRMATION_MISMATCH');
    }

    const { MockSecurityChallengeAdapter } = await import('./securityChallenge.service');
    await MockSecurityChallengeAdapter.verifyAndConsume(
      challengeId,
      challengeCode,
      'delete-account',
      sub
    );

    const claimPk = `USERNAME#${currentProfile.username}`;
    // Remove profile and username claim
    const remaining = items.filter(
      (i) => i.PK !== userPk && i.PK !== claimPk
    );
    this.saveItems(remaining);
    return true;
  }


  private static loadItems(): MockDynamoItem[] {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(DEV_MOCK_STORAGE_KEY);
        return raw ? JSON.parse(raw) : this.memoryStore;
      } catch {
        return this.memoryStore;
      }
    }
    return this.memoryStore;
  }

  private static saveItems(items: MockDynamoItem[]): void {
    this.memoryStore = [...items];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(DEV_MOCK_STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }

  static resetForTesting(): void {
    this.memoryStore = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(DEV_MOCK_STORAGE_KEY);
      } catch {}
    }
  }
}
