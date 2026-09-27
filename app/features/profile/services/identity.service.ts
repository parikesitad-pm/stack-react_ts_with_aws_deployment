import type { UserProfile } from '../schemas/username.schema';
import { normalizeUsername, usernameSchema } from '../schemas/username.schema';
import { DevMockIdentityAdapter } from './identityMock.service';
import {
  stackApiFetch,
  getStackApiBaseUrl,
} from '~/features/api/stackApiFetch';

export interface OnboardingPayload {
  username: string;
  dateOfBirth?: string;
}

export interface UsernameAvailabilityResult {
  available: boolean;
  normalizedUsername: string;
  suggestions?: string[];
}

export class IdentityService {
  /**
   * Evaluates if the authoritative backend API is configured
   */
  static getApiBaseUrl(): string {
    return getStackApiBaseUrl();
  }

  static hasBackendApi(): boolean {
    return Boolean(this.getApiBaseUrl());
  }

  static isDevOrTest(): boolean {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    return Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  }

  /**
   * Advisory suggestions for taken usernames
   */
  static suggestAlternatives(base: string): string[] {
    return DevMockIdentityAdapter.suggestAlternatives(base);
  }

  /**
   * Advisory username availability check.
   * Production: queries GET /usernames/:username/availability
   * Dev/Test fallback: queries DevMockIdentityAdapter
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
      } catch (err) {
        console.error('[IdentityService] Availability check failed:', err);
      }
    }

    if (this.isDevOrTest()) {
      return DevMockIdentityAdapter.checkAvailability(normalized);
    }

    // In production without backend API, local cannot guarantee uniqueness
    return {
      available: false,
      normalizedUsername: normalized,
      suggestions: this.suggestAlternatives(normalized),
    };
  }

  /**
   * Retrieves profile of current authenticated user.
   *
   * Invariant: Frontend does NOT pass sub as the authority.
   * The backend Lambda extracts event.requestContext.authorizer.jwt.claims.sub from the JWT.
   */
  static async getProfile(token: string): Promise<UserProfile | null> {
    if (!token) return null;

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      try {
        const res = await stackApiFetch('/me', token);
        if (res.ok) {
          return (await res.json()) as UserProfile;
        }
        if (res.status === 404) return null;
        console.error(
          `[IdentityService] /me returned HTTP ${res.status}:`,
          await res.text()
        );
        throw new Error(`IDENTITY_API_ERROR: HTTP ${res.status}`);
      } catch (err) {
        console.error('[IdentityService] Failed to fetch /me:', err);
        throw err;
      }
    }

    // Controlled development / test fallback
    if (this.isDevOrTest()) {
      const mockSub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.getProfile(mockSub);
    }

    return null;
  }

  /**
   * Atomically claims STACK username and marks onboarding complete.
   *
   * Invariant:
   * 1. No local store may claim authoritative global uniqueness in production.
   * 2. sub is NOT in the payload; the backend authorizer verifies owner identity from the JWT.
   *
   * API Contract:
   * POST /me/onboarding
   * Body: { "username": string, "dateOfBirth"?: string }
   */
  static async claimOnboarding(
    payload: OnboardingPayload,
    token: string
  ): Promise<UserProfile> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const normalized = normalizeUsername(payload.username);
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Invalid username');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/onboarding', token, {
        method: 'POST',
        body: JSON.stringify({
          username: normalized,
          dateOfBirth: payload.dateOfBirth,
        }),
      });

      if (res.status === 409) {
        throw new Error('USERNAME_TAKEN');
      }
      if (!res.ok) {
        throw new Error(
          'Failed to complete onboarding on authoritative server'
        );
      }
      return (await res.json()) as UserProfile;
    }

    // Controlled Development / Test Mode
    if (this.isDevOrTest()) {
      const mockSub = this.extractSubFromTokenOrFallback(token);
      console.warn(
        '[STACK DEV MOCK] Claiming username locally for development. Not globally authoritative.'
      );
      return DevMockIdentityAdapter.claimOnboarding(mockSub, {
        username: normalized,
        dateOfBirth: payload.dateOfBirth,
      });
    }

    // In production without backend API, fail loud and never claim local authority
    throw new Error(
      'IDENTITY_BACKEND_UNAVAILABLE: Authoritative STACK identity API is not configured. Username cannot be claimed.'
    );
  }

  /**
   * Request programmatic resend of Auth0 verification email via trusted backend.
   *
   * Invariant:
   * Never call Auth0 Management API directly from the browser SPA.
   * The backend Lambda derives caller identity from JWT and invokes the Auth0 verification job.
   */
  static async resendVerificationEmail(token: string): Promise<boolean> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (!apiBase) {
      throw new Error('RESEND_BACKEND_UNAVAILABLE');
    }

    const res = await stackApiFetch('/me/resend-verification', token, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('FAILED_TO_RESEND_VERIFICATION');
    }

    return true;
  }

  /**
   * Updates non-sensitive profile attributes (e.g. fullName).
   * Does not require an email security challenge.
   */
  static async updateProfile(
    payload: { fullName?: string; avatarKey?: string; avatarVersion?: string },
    token: string
  ): Promise<UserProfile> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/profile', token, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_UPDATE_PROFILE');
      }

      return (await res.json()) as UserProfile;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.updateProfile(sub, payload);
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Atomically updates STACK username via single DynamoDB transaction.
   * Strictly requires a verified email security challenge.
   */
  static async updateUsername(
    payload: {
      newUsername: string;
      challengeId: string;
      challengeCode: string;
    },
    token: string
  ): Promise<UserProfile> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const normalized = normalizeUsername(payload.newUsername);
    const parsed = usernameSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Invalid username');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/username', token, {
        method: 'PATCH',
        body: JSON.stringify({
          newUsername: normalized,
          challengeId: payload.challengeId,
          code: payload.challengeCode,
        }),
      });

      if (res.status === 409) {
        throw new Error('USERNAME_TAKEN');
      }
      if (res.status === 403 || res.status === 401) {
        throw new Error('INVALID_CHALLENGE_CODE');
      }
      if (!res.ok) {
        throw new Error('FAILED_TO_UPDATE_USERNAME');
      }

      return (await res.json()) as UserProfile;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.updateUsername(
        sub,
        normalized,
        payload.challengeId,
        payload.challengeCode
      );
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Updates email address. Strictly requires a verified email security challenge.
   */
  static async updateEmail(
    payload: { newEmail: string; challengeId: string; challengeCode: string },
    token: string
  ): Promise<UserProfile> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/email', token, {
        method: 'PATCH',
        body: JSON.stringify({
          newEmail: payload.newEmail,
          challengeId: payload.challengeId,
          code: payload.challengeCode,
        }),
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_UPDATE_EMAIL');
      }

      return (await res.json()) as UserProfile;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.updateEmail(
        sub,
        payload.newEmail,
        payload.challengeId,
        payload.challengeCode
      );
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Deletes custom avatar and resets to initials/provider picture.
   */
  static async deleteAvatar(token: string): Promise<UserProfile> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/avatar', token, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_DELETE_AVATAR');
      }

      return (await res.json()) as UserProfile;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.deleteAvatar(sub);
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Requests password change ticket URL from backend for email/password users.
   */
  static async requestPasswordChange(
    token: string
  ): Promise<{ ticketUrl?: string; message: string }> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/password/change', token, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_REQUEST_PASSWORD_CHANGE');
      }

      return (await res.json()) as { ticketUrl?: string; message: string };
    }

    if (this.isDevOrTest()) {
      return {
        ticketUrl: 'https://stack-md.online/auth/login?mode=reset_password',
        message: 'Password reset link dispatched.',
      };
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Requests password setup for social users.
   * If Auth0 account linking is not configured on the tenant, reports explicit blocker.
   */
  static async requestPasswordAdd(
    token: string
  ): Promise<{ ticketUrl?: string; message: string }> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me/password/add', token, {
        method: 'POST',
      });

      if (res.status === 501) {
        throw new Error('PASSWORD_SETUP_UNAVAILABLE');
      }
      if (!res.ok) {
        throw new Error('FAILED_TO_ADD_PASSWORD');
      }

      return (await res.json()) as { ticketUrl?: string; message: string };
    }

    if (this.isDevOrTest()) {
      return {
        ticketUrl: 'https://stack-md.online/auth/login?mode=add_password',
        message: 'Account linking initiated.',
      };
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Permanently deletes account, claims, and Auth0 user.
   * Strictly requires email security challenge and typing @username confirmation.
   */
  static async deleteAccount(
    payload: {
      confirmedUsername: string;
      challengeId: string;
      challengeCode: string;
    },
    token: string
  ): Promise<boolean> {
    if (!token) {
      throw new Error('AUTH_TOKEN_REQUIRED');
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const res = await stackApiFetch('/me', token, {
        method: 'DELETE',
        body: JSON.stringify({
          confirmedUsername: payload.confirmedUsername,
          challengeId: payload.challengeId,
          code: payload.challengeCode,
        }),
      });

      if (!res.ok) {
        throw new Error('FAILED_TO_DELETE_ACCOUNT');
      }

      return true;
    }

    if (this.isDevOrTest()) {
      const sub = this.extractSubFromTokenOrFallback(token);
      return DevMockIdentityAdapter.deleteAccount(
        sub,
        payload.confirmedUsername,
        payload.challengeId,
        payload.challengeCode
      );
    }

    throw new Error('IDENTITY_BACKEND_UNAVAILABLE');
  }

  /**
   * Helper for dev/test adapter to resolve identity key from mock token
   */
  private static extractSubFromTokenOrFallback(token: string): string {
    if (
      token.startsWith('auth0|') ||
      token.startsWith('google-oauth2|') ||
      token.startsWith('github|')
    ) {
      return token;
    }
    // Attempt simple JWT payload decode if applicable
    try {
      const parts = token.split('.');
      if (parts.length === 3 && typeof atob !== 'undefined') {
        const payload = JSON.parse(atob(parts[1] || ''));
        if (payload?.sub) return payload.sub;
      }
    } catch {}
    return 'dev-mock-operator';
  }

  static resetForTesting(): void {
    DevMockIdentityAdapter.resetForTesting();
  }
}
