import type { UserProfile } from '../schemas/username.schema';
import { normalizeUsername, usernameSchema } from '../schemas/username.schema';

export interface OnboardingPayload {
  username: string;
  dateOfBirth?: string;
}

export interface UsernameAvailabilityResult {
  available: boolean;
  normalizedUsername: string;
  suggestions?: string[];
}

/**
 * Storage key for simulated DynamoDB partition tables when VITE_API_BASE_URL is not set.
 * In a fully deployed AWS environment, these operations execute inside an AWS Lambda behind
 * an HTTP API Gateway with JWT Authorizer verifying Auth0 tokens.
 */
const DYNAMODB_SIMULATED_STORE_KEY = 'stack_identity_dynamo_items';

interface DynamoItem {
  PK: string; // e.g. "USER#auth0|xxx" or "USERNAME#luca"
  SK: string; // e.g. "PROFILE" or "CLAIM"
  data: Record<string, unknown>;
  createdAt: string;
}

export class IdentityService {
  private static getApiBaseUrl(): string {
    return (
      (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_API_BASE_URL) ||
      ''
    );
  }

  /**
   * Generates alternative suggestions if a username is claimed
   */
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

  /**
   * Check username availability (advisory check)
   */
  static async checkAvailability(
    rawUsername: string,
    token?: string
  ): Promise<UsernameAvailabilityResult> {
    const normalized = normalizeUsername(rawUsername);
    const validation = usernameSchema.safeParse(normalized);
    if (!validation.success) {
      return { available: false, normalizedUsername: normalized };
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      try {
        const res = await fetch(
          `${apiBase}/usernames/${encodeURIComponent(normalized)}/availability`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (res.ok) {
          const data = await res.json();
          return {
            available: Boolean(data.available),
            normalizedUsername: normalized,
            suggestions: data.available
              ? undefined
              : this.suggestAlternatives(normalized),
          };
        }
      } catch {
        // Fallback to local partition table
      }
    }

    // Local DynamoDB simulated conditional check
    const items = this.loadDynamoItems();
    const claimPk = `USERNAME#${normalized}`;
    const isTaken = items.some((item) => item.PK === claimPk);

    return {
      available: !isTaken,
      normalizedUsername: normalized,
      suggestions: isTaken ? this.suggestAlternatives(normalized) : undefined,
    };
  }

  /**
   * Retrieve current user profile by Auth0 sub
   */
  static async getProfile(
    sub: string,
    token?: string
  ): Promise<UserProfile | null> {
    const apiBase = this.getApiBaseUrl();
    if (apiBase && token) {
      try {
        const res = await fetch(`${apiBase}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return (await res.json()) as UserProfile;
        }
        if (res.status === 404) return null;
      } catch {
        // Fallback
      }
    }

    const items = this.loadDynamoItems();
    const userPk = `USER#${sub}`;
    const userItem = items.find(
      (item) => item.PK === userPk && item.SK === 'PROFILE'
    );
    if (userItem) {
      return userItem.data as unknown as UserProfile;
    }
    return null;
  }

  /**
   * Atomically claims username and completes onboarding.
   *
   * AWS DynamoDB Semantic Invariant:
   * Uses conditional write: `attribute_not_exists(PK)` on `USERNAME#{normalizedUsername}`.
   * If collision occurs, raises USERNAME_TAKEN atomically.
   */
  static async claimOnboarding(
    sub: string,
    payload: OnboardingPayload,
    email?: string,
    token?: string
  ): Promise<UserProfile> {
    const normalized = normalizeUsername(payload.username);
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Invalid username');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase && token) {
      const res = await fetch(`${apiBase}/me/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: normalized,
          dateOfBirth: payload.dateOfBirth,
        }),
      });

      if (res.status === 409) {
        throw new Error('USERNAME_TAKEN');
      }
      if (!res.ok) {
        throw new Error('Failed to complete onboarding on server');
      }
      return (await res.json()) as UserProfile;
    }

    // Local DynamoDB simulated atomic conditional transaction
    const items = this.loadDynamoItems();
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

    // Update items atomically
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

    this.saveDynamoItems(filtered);
    return userProfile;
  }

  private static memoryStore: DynamoItem[] = [];

  private static loadDynamoItems(): DynamoItem[] {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(DYNAMODB_SIMULATED_STORE_KEY);
        return raw ? JSON.parse(raw) : this.memoryStore;
      } catch {
        return this.memoryStore;
      }
    }
    return this.memoryStore;
  }

  private static saveDynamoItems(items: DynamoItem[]): void {
    this.memoryStore = [...items];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          DYNAMODB_SIMULATED_STORE_KEY,
          JSON.stringify(items)
        );
      } catch {
        // quota or private mode fallback
      }
    }
  }

  /**
   * Test fixture helper to reset memory items
   */
  static resetForTesting(): void {
    this.memoryStore = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(DYNAMODB_SIMULATED_STORE_KEY);
      } catch {}
    }
  }
}
