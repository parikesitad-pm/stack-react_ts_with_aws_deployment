export interface Auth0User {
  sub: string;
  email: string;
  name: string;
  preferredName?: string;
  dateOfBirth?: string;
  picture?: string;
  provider: 'google-oauth2' | 'github' | 'email';
  emailVerified: boolean;
  createdAt: string;
}

export interface Auth0Session {
  isAuthenticated: boolean;
  user: Auth0User | null;
  token: string | null;
  hasCompletedOnboarding: boolean;
}
