import type { Auth0User, Auth0Session } from '../types/auth0.types';

const SESSION_KEY = 'stack_auth0_session';

export const DEFAULT_AUTH0_USER: Auth0User = {
  sub: 'github|84912034',
  email: 'operator@modula.dev',
  name: 'STACK Operator',
  preferredName: 'Luca',
  dateOfBirth: '1998-04-12',
  picture: '',
  provider: 'github',
  emailVerified: true,
  createdAt: '2026-09-27T01:00:00.000Z',
};

export const auth0MockService = {
  getSession(): Auth0Session {
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: true,
        user: DEFAULT_AUTH0_USER,
        token: 'mock-jwt-token-sub-github|84912034',
        hasCompletedOnboarding: true,
      };
    }

    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      // Default to initial authenticated operator for smooth development/demo
      const initialSession: Auth0Session = {
        isAuthenticated: true,
        user: DEFAULT_AUTH0_USER,
        token: `mock-jwt-token-${DEFAULT_AUTH0_USER.sub}`,
        hasCompletedOnboarding: true,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(initialSession));
      return initialSession;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        hasCompletedOnboarding: false,
      };
    }
  },

  setSession(session: Auth0Session): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(
      new CustomEvent('stack:auth-change', { detail: session })
    );
  },

  loginWithProvider(
    provider: 'google-oauth2' | 'github' | 'email',
    emailInput?: string
  ): Auth0User {
    const isGoogle = provider === 'google-oauth2';
    const isGithub = provider === 'github';

    const sub = isGoogle
      ? `google-oauth2|${Math.floor(10000000 + Math.random() * 90000000)}`
      : isGithub
        ? `github|${Math.floor(10000000 + Math.random() * 90000000)}`
        : `email|${Math.floor(10000000 + Math.random() * 90000000)}`;

    const email =
      emailInput ||
      (isGoogle
        ? 'developer@gmail.com'
        : isGithub
          ? 'engineer@github.com'
          : 'user@modula.tools');

    const name = isGoogle
      ? 'Google Operator'
      : isGithub
        ? 'GitHub Engineer'
        : 'STACK User';

    const newUser: Auth0User = {
      sub,
      email,
      name,
      preferredName: undefined,
      dateOfBirth: undefined,
      picture: '',
      provider,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    const session: Auth0Session = {
      isAuthenticated: true,
      user: newUser,
      token: `auth0-jwt-${sub}-${Date.now()}`,
      hasCompletedOnboarding: false, // Triggers Step 1 & 2 onboarding
    };

    this.setSession(session);
    return newUser;
  },

  completeOnboarding(preferredName: string, dateOfBirth: string): Auth0User {
    const current = this.getSession();
    if (!current.user) throw new Error('No active session');

    const updatedUser: Auth0User = {
      ...current.user,
      preferredName,
      dateOfBirth,
    };

    this.setSession({
      ...current,
      user: updatedUser,
      hasCompletedOnboarding: true,
    });

    return updatedUser;
  },

  updateProfile(partial: Partial<Auth0User>): Auth0User {
    const current = this.getSession();
    if (!current.user) throw new Error('No active session');

    const updatedUser: Auth0User = {
      ...current.user,
      ...partial,
    };

    this.setSession({
      ...current,
      user: updatedUser,
    });

    return updatedUser;
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(
      new CustomEvent('stack:auth-change', {
        detail: {
          isAuthenticated: false,
          user: null,
          token: null,
          hasCompletedOnboarding: false,
        },
      })
    );
  },
};
