import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";
import type { AuthUser } from "~/features/auth/types/auth.types";
import type { LoginInput } from "~/features/auth/schemas/login.schema";
import type { RegisterInput, VerifyEmailInput } from "~/features/auth/schemas/register.schema";

const MOCK_STORAGE_KEY = "stack:mock_session";

export class AuthService {
  /**
   * Check if AWS Cognito is configured in client environment
   */
  static isCognitoConfigured(): boolean {
    return Boolean(
      typeof window !== "undefined" &&
      (window as unknown as { __AMPLIFY_CONFIGURED__?: boolean }).__AMPLIFY_CONFIGURED__
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
          email: user.signInDetails?.loginId || "",
          emailVerified: true,
          username: user.username,
        };
      } catch {
        return null;
      }
    }

    // Mock session for UI mockup evaluation
    if (typeof window !== "undefined") {
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
      throw new Error("Additional sign-in step required");
    }

    // Interactive mockup authentication
    const mockUser: AuthUser = {
      sub: `usr_${btoa(input.email).slice(0, 10).toLowerCase()}`,
      email: input.email,
      emailVerified: true,
      username: input.email.split("@")[0] || "operator",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  }

  /**
   * Sign Up new account
   */
  static async register(input: RegisterInput): Promise<{ isComplete: boolean; nextStep: string }> {
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
      nextStep: "CONFIRM_SIGN_UP_STEP",
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
        console.error("Cognito sign-out error", err);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_STORAGE_KEY);
    }
  }
}
