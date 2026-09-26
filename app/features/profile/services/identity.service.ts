import type { UserProfile } from '../schemas/username.schema';
import { normalizeUsername, usernameSchema } from '../schemas/username.schema';
import { DevMockIdentityAdapter } from './identityMock.service';

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
    return (
      (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_API_BASE_URL) ||
      ''
    );
  }

  static hasBackendApi(): boolean {
    return Boolean(this.getApiBaseUrl());
  }

  static isDevOrTest(): boolean {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    return Boolean(
      typeof import.meta !== 'undefined' && import.meta.env?.DEV
    );
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
        const res = await fetch(`${apiBase}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return (await res.json()) as UserProfile;
        }
        if (res.status === 404) return null;
      } catch (err) {
        console.error('[IdentityService] Failed to fetch /me:', err);
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
        throw new Error('Failed to complete onboarding on authoritative server');
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

    const res = await fetch(`${apiBase}/me/resend-verification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('FAILED_TO_RESEND_VERIFICATION');
    }

    return true;
  }

  /**
   * Helper for dev/test adapter to resolve identity key from mock token
   */
  private static extractSubFromTokenOrFallback(token: string): string {
    if (token.startsWith('auth0|') || token.startsWith('google-oauth2|') || token.startsWith('github|')) {
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
