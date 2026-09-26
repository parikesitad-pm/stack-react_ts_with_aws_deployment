import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';
import type { AuthUser } from '~/features/auth/types/auth.types';
import type { LoginInput } from '~/features/auth/schemas/login.schema';
import type {
  RegisterInput,
  VerifyEmailInput,
} from '~/features/auth/schemas/register.schema';

const MOCK_STORAGE_KEY = 'stack:mock_session';

export class AuthService {
  /**
   * Check if AWS Cognito is configured in client environment
   */
  static isCognitoConfigured(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
      (window as unknown as { __AMPLIFY_CONFIGURED__?: boolean })
        .__AMPLIFY_CONFIGURED__
    );
  }

  /**
   * Get current authenticated user session
   */
  static async getCurrentSession(): Promise<AuthUser | null> {
    if (this.isCognitoConfigured()) {
      try {
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const sub = session.userSub || user.userId;
        return {
          sub,
          email: user.signInDetails?.loginId || '',
          emailVerified: true,
          username: user.username,
        };
      } catch {
        return null;
      }
    }

    // Mock session for UI mockup evaluation
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as AuthUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Sign In via Cognito User Pool or Mock Session
   */
  static async login(input: LoginInput): Promise<AuthUser> {
    if (this.isCognitoConfigured()) {
      const res = await signIn({
        username: input.email,
        password: input.password,
      });
      if (res.isSignedIn) {
        const session = await this.getCurrentSession();
        if (session) return session;
      }
      throw new Error('Additional sign-in step required');
    }

    // Interactive mockup authentication
    const mockUser: AuthUser = {
      sub: `usr_${btoa(input.email).slice(0, 10).toLowerCase()}`,
      email: input.email,
      emailVerified: true,
      username: input.email.split('@')[0] || 'operator',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  }

  /**
   * Sign Up new account
   */
  static async register(
    input: RegisterInput
  ): Promise<{ isComplete: boolean; nextStep: string }> {
    if (this.isCognitoConfigured()) {
      const res = await signUp({
        username: input.email,
        password: input.password,
        options: {
          userAttributes: {
            email: input.email,
          },
        },
      });
      return {
        isComplete: res.isSignUpComplete,
        nextStep: res.nextStep.signUpStep,
      };
    }

    return {
      isComplete: false,
      nextStep: 'CONFIRM_SIGN_UP_STEP',
    };
  }

  /**
   * Confirm sign up with 6-digit email code
   */
  static async verifyEmail(input: VerifyEmailInput): Promise<boolean> {
    if (this.isCognitoConfigured()) {
      const res = await confirmSignUp({
        username: input.email,
        confirmationCode: input.code,
      });
      return res.isSignUpComplete;
    }
    return true;
  }

  /**
   * Sign Out and clear all local credentials
   */
  static async logout(): Promise<void> {
    if (this.isCognitoConfigured()) {
      try {
        await signOut({ global: false });
      } catch (err) {
        console.error('Cognito sign-out error', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  }

  /**
   * Advisory sanitization of preferred name to @username
   */
  static sanitizeUsername(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);
  }

  /**
   * Authoritative backend API: POST /profile/username/check
   */
  static async checkUsernameAvailability(username: string): Promise<boolean> {
    const normalized = this.sanitizeUsername(username);
    if (!normalized || normalized.length < 3) return false;

    // Simulate authoritative backend DynamoDB conditional check:
    // In production backend: attribute_not_exists(PK) where PK = `USERNAME#${normalized}`
    const takenUsernames = new Set([
      'admin',
      'root',
      'stack',
      'modula',
      'system',
      'support',
      'help',
    ]);
    if (typeof window !== 'undefined') {
      const claimedKey = `stack_claimed_usernames`;
      const claimed = JSON.parse(
        localStorage.getItem(claimedKey) || '[]'
      ) as string[];
      claimed.forEach((u) => takenUsernames.add(u));
    }
    return !takenUsernames.has(normalized);
  }

  /**
   * Authoritative backend API: POST /profile/username/claim
   * Uses DynamoDB atomic conditional write:
   * PK: USERNAME#<lowercase>, SK: CLAIM
   * ConditionExpression: attribute_not_exists(PK)
   */
  static async claimUsername(
    username: string,
    userSub: string
  ): Promise<{
    success: boolean;
    error?: 'USERNAME_TAKEN' | 'INVALID_FORMAT';
  }> {
    const normalized = this.sanitizeUsername(username);
    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'INVALID_FORMAT' };
    }

    const isAvailable = await this.checkUsernameAvailability(normalized);
    if (!isAvailable) {
      return { success: false, error: 'USERNAME_TAKEN' };
    }

    // Atomic conditional write simulation
    if (typeof window !== 'undefined') {
      const claimedKey = `stack_claimed_usernames`;
      const claimed = JSON.parse(
        localStorage.getItem(claimedKey) || '[]'
      ) as string[];
      if (claimed.includes(normalized)) {
        return { success: false, error: 'USERNAME_TAKEN' };
      }
      claimed.push(normalized);
      localStorage.setItem(claimedKey, JSON.stringify(claimed));
    }

    return { success: true };
  }

  /**
   * Suggest alternatives if chosen username is taken
   */
  static suggestAlternatives(base: string): string[] {
    const clean = this.sanitizeUsername(base) || 'operator';
    return [`@${clean}13`, `@${clean}pm`, `@${clean}_dev`];
  }
}
