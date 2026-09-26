export interface Auth0User {
  sub: string;
  email: string;
  name: string;
  preferredName?: string;
  username?: string; // e.g. "luca", displayed with @ prefix
  dateOfBirth?: string;
  picture?: string;
  provider: 'google-oauth2' | 'github' | 'email';
  emailVerified: boolean;
  createdAt: string;
  onboardingCompletedAt?: string;
}

export interface Auth0Session {
  isAuthenticated: boolean;
  user: Auth0User | null;
  token: string | null;
  hasCompletedOnboarding: boolean;
}
