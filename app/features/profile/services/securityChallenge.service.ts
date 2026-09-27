/**
 * STACK Security Challenge Service
 * Handles sensitive email verification codes (6-digit numeric tokens).
 *
 * Invariants:
 * 1. Low-entropy 6-digit codes must NEVER be persisted as plain SHA-256 digests.
 *    Backend applies HMAC-SHA256 with a server-side pepper stored in AWS Secrets Manager.
 * 2. Strict purpose binding: codes generated for one operation cannot be used for another.
 * 3. 10-minute TTL, max 3 attempts before burning, single-use consumed flag.
 */

export type ChallengePurpose =
  | 'change-username'
  | 'change-email'
  | 'change-password'
  | 'add-password'
  | 'delete-account';

import {
  stackApiFetch,
  getStackApiBaseUrl,
} from '~/features/api/stackApiFetch';

export interface SecurityChallengeRecord {
  challengeId: string;
  purpose: ChallengePurpose;
  ownerSub: string;
  digest: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  consumedAt?: number;
}

export interface CreateChallengeResult {
  challengeId: string;
  purpose: ChallengePurpose;
  expiresAt: number;
  // Dev/test only: in dev/test, mock code is returned or logged for easy testing
  devCode?: string;
}

export class MockSecurityChallengeAdapter {
  private static store: Map<string, SecurityChallengeRecord> = new Map();
  private static MOCK_PEPPER = 'stack_dev_secret_pepper_2026';

  /**
   * Helper to compute keyed HMAC-SHA256 digest in modern JS (browser & Node)
   */
  static async computeHmac(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.MOCK_PEPPER);
    const cryptoSubtle: any =
      typeof window !== 'undefined'
        ? window.crypto?.subtle
        : (await import('crypto')).webcrypto?.subtle;

    if (!cryptoSubtle) {
      // Fallback simple keyed hash if webcrypto is unavailable
      return `hmac_${code}_${this.MOCK_PEPPER}`;
    }

    const key = await cryptoSubtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await cryptoSubtle.sign(
      'HMAC',
      key,
      encoder.encode(code)
    );

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async createChallenge(
    ownerSub: string,
    purpose: ChallengePurpose
  ): Promise<CreateChallengeResult> {
    const challengeId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    // Generate 6-digit code
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const digest = await this.computeHmac(rawCode);

    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    const record: SecurityChallengeRecord = {
      challengeId,
      purpose,
      ownerSub,
      digest,
      createdAt: now,
      expiresAt,
      attempts: 0,
    };

    this.store.set(challengeId, record);

    console.info(
      `[STACK DEV CHALLENGE] [${purpose}] Code for ${ownerSub}: ${rawCode}`
    );

    return {
      challengeId,
      purpose,
      expiresAt,
      devCode: rawCode,
    };
  }

  static async verifyAndConsume(
    challengeId: string,
    code: string,
    expectedPurpose: ChallengePurpose,
    ownerSub: string
  ): Promise<boolean> {
    const record = this.store.get(challengeId);
    if (!record) {
      throw new Error('CHALLENGE_NOT_FOUND');
    }

    if (record.ownerSub !== ownerSub) {
      throw new Error('CHALLENGE_OWNER_MISMATCH');
    }

    if (record.purpose !== expectedPurpose) {
      throw new Error('INVALID_CHALLENGE_PURPOSE');
    }

    if (record.consumedAt) {
      throw new Error('CHALLENGE_ALREADY_USED');
    }

    if (Date.now() > record.expiresAt) {
      throw new Error('CHALLENGE_EXPIRED');
    }

    if (record.attempts >= 3) {
      throw new Error('CHALLENGE_MAX_ATTEMPTS_EXCEEDED');
    }

    const inputDigest = await this.computeHmac(code.trim());
    if (inputDigest !== record.digest) {
      record.attempts += 1;
      this.store.set(challengeId, record);
      throw new Error('INVALID_CHALLENGE_CODE');
    }

    // Success: mark consumed
    record.consumedAt = Date.now();
    this.store.set(challengeId, record);
    return true;
  }

  static resetForTesting(): void {
    this.store.clear();
  }
}

export class SecurityChallengeService {
  static getApiBaseUrl(): string {
    return getStackApiBaseUrl();
  }

  static isDevOrTest(): boolean {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    return Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  }

  /**
   * Requests a new 6-digit email security challenge from the backend API.
   */
  static async requestChallenge(
    purpose: ChallengePurpose,
    token: string
  ): Promise<CreateChallengeResult> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/security/challenges', token, {
        method: 'POST',
        body: JSON.stringify({ purpose }),
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_REQUEST_CHALLENGE');
      }

      return (await res.json()) as CreateChallengeResult;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromToken(token);
      return MockSecurityChallengeAdapter.createChallenge(sub, purpose);
    }

    throw new Error('SECURITY_API_UNAVAILABLE');
  }

  /**
   * Helper to extract sub from mock token
   */
  private static extractSubFromToken(token: string): string {
    if (
      token.startsWith('auth0|') ||
      token.startsWith('google-oauth2|') ||
      token.startsWith('github|')
    ) {
      return token;
    }
    try {
      const parts = token.split('.');
      if (parts.length === 3 && typeof atob !== 'undefined') {
        const payload = JSON.parse(atob(parts[1] || ''));
        if (payload?.sub) return payload.sub;
      }
    } catch {}
    return 'dev-operator';
  }

  static resetForTesting(): void {
    MockSecurityChallengeAdapter.resetForTesting();
  }
}
