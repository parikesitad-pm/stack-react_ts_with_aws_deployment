import type { UserProfile } from '../schemas/username.schema';
import { normalizeUsername, usernameSchema } from '../schemas/username.schema';
import { DevMockIdentityAdapter } from './identityMock.service';
import { stackApiFetch, getStackApiBaseUrl } from '~/features/api/stackApiFetch';

export interface OnboardingPayload {
  username: string;
  dateOfBirth?: string;
}

export type UsernameAvailabilityResult =
  | {
      status: 'available';
      available: true;
      normalizedUsername: string;
      suggestions?: never;
    }
  | {
      status: 'taken';
      available: false;
      normalizedUsername: string;
      suggestions?: string[];
    }
  | {
      status: 'error';
      available: false;
      code: string;
      message: string;
      statusCode?: number;
      normalizedUsername: string;
      suggestions?: never;
    };

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
   *
   * Invariant:
   * Only treat username as taken when backend explicitly confirms it.
   * A backend error or network failure must NEVER masquerade as a collision.
   */
  static async checkAvailability(
    rawUsername: string,
    token?: string
  ): Promise<UsernameAvailabilityResult> {
    const normalized = normalizeUsername(rawUsername);
    const validation = usernameSchema.safeParse(normalized);
    if (!validation.success) {
      return {
        status: 'error',
        available: false,
        code: 'INVALID_USERNAME',
        message: validation.error.issues[0]?.message || 'Invalid username.',
        normalizedUsername: normalized,
      };
    }

    const apiBase = this.getApiBaseUrl();
    if (apiBase) {
      const endpoint = `${apiBase}/usernames/${encodeURIComponent(normalized)}/availability`;
      try {
        const res = await fetch(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let body: any = null;
        const text = await res.text();
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = null;
        }

        // Safe debug logging: endpoint path, status, and response body (no secrets/tokens)
        console.info('[IdentityService] Availability check response:', {
          endpoint: `/usernames/${normalized}/availability`,
          status: res.status,
          responseBody: body || text,
        });

        // 200 OK: Explicit available confirmation
        if (res.status === 200) {
          if (body && typeof body.available === 'boolean') {
            if (body.available === true) {
              return {
                status: 'available',
                available: true,
                normalizedUsername: normalized,
              };
            } else {
              return {
                status: 'taken',
                available: false,
                normalizedUsername: normalized,
                suggestions: this.suggestAlternatives(normalized),
              };
            }
          }
        }

        // 409 Conflict: USERNAME_TAKEN
        if (res.status === 409) {
          return {
            status: 'taken',
            available: false,
            normalizedUsername: normalized,
            suggestions: this.suggestAlternatives(normalized),
          };
        }

        // 400 Bad Request: Backend validation failure
        if (res.status === 400) {
          return {
            status: 'error',
            available: false,
            code: body?.error || 'INVALID_USERNAME',
            message:
              body?.message ||
              'Username must be 3-24 characters using lowercase letters, numbers, or underscore.',
            statusCode: 400,
            normalizedUsername: normalized,
          };
        }

        // 401 / 403: Session refresh needed
        if (res.status === 401 || res.status === 403) {
          return {
            status: 'error',
            available: false,
            code: 'AUTH_REQUIRED',
            message: 'Your session needs to be refreshed. Sign in again.',
            statusCode: res.status,
            normalizedUsername: normalized,
          };
        }

        // 404: Service not available yet
        if (res.status === 404) {
          return {
            status: 'error',
            available: false,
            code: 'SERVICE_NOT_FOUND',
            message: 'Username service is not available yet.',
            statusCode: 404,
            normalizedUsername: normalized,
          };
        }

        // 5xx or unexpected status
        return {
          status: 'error',
          available: false,
          code: body?.code || body?.error || `HTTP_${res.status}`,
          message:
            body?.message ||
            "Couldn't check username availability. Try again.",
          statusCode: res.status,
          normalizedUsername: normalized,
        };
      } catch (err: unknown) {
        console.error('[IdentityService] Availability check network error:', {
          endpoint: `/usernames/${normalized}/availability`,
          error: err instanceof Error ? err.message : String(err),
        });
        return {
          status: 'error',
          available: false,
          code: 'NETWORK_ERROR',
          message: "Couldn't check username availability. Try again.",
          normalizedUsername: normalized,
        };
      }
    }

    if (this.isDevOrTest()) {
      return DevMockIdentityAdapter.checkAvailability(normalized);
    }

    // In production without backend API, never pretend the username is taken
    return {
      status: 'error',
      available: false,
      code: 'API_NOT_CONFIGURED',
      message: 'Username service is not available yet.',
      statusCode: 404,
      normalizedUsername: normalized,
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
        console.info('[IdentityService] getProfile response:', {
          endpoint: '/me',
          status: res.status,
        });
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

      console.info('[IdentityService] claimOnboarding response:', {
        endpoint: '/me/onboarding',
        status: res.status,
      });

      if (res.status === 409) {
        throw new Error('USERNAME_TAKEN');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Your session needs to be refreshed. Sign in again.');
      }
      if (!res.ok) {
        let errMsg = 'Failed to complete onboarding on authoritative server';
        try {
          const body = await res.json();
          if (body?.message) errMsg = body.message;
        } catch {}
        throw new Error(errMsg);
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
