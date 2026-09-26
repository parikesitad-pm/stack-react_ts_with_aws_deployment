export interface AuthUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  username?: string;
  name?: string;
  preferredName?: string;
  dateOfBirth?: string;
  picture?: string;
  provider?: string;
  createdAt?: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
}

export type AuthMode = 'login' | 'register' | 'verify' | 'forgot_password';
