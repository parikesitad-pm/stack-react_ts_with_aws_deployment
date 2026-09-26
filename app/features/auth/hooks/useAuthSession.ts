import { useState, useEffect, useCallback } from 'react';
import { auth0MockService } from '../services/auth0Mock.service';
import type { Auth0User, Auth0Session } from '../types/auth0.types';

export function useAuthSession() {
  const [session, setSession] = useState<Auth0Session>(() =>
    auth0MockService.getSession()
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<Auth0Session>;
      if (customEvent.detail) {
        setSession(customEvent.detail);
      }
    };

    window.addEventListener('stack:auth-change', handleAuthChange);
    return () =>
      window.removeEventListener('stack:auth-change', handleAuthChange);
  }, []);

  const loginWithProvider = useCallback(
    (
      provider: 'google-oauth2' | 'github' | 'email',
      email?: string
    ): Auth0User => {
      setIsLoading(true);
      try {
        const user = auth0MockService.loginWithProvider(provider, email);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const completeOnboarding = useCallback(
    (preferredName: string, dateOfBirth: string): Auth0User => {
      return auth0MockService.completeOnboarding(preferredName, dateOfBirth);
    },
    []
  );

  const updateProfile = useCallback(
    (partial: Partial<Auth0User>): Auth0User => {
      return auth0MockService.updateProfile(partial);
    },
    []
  );

  const signOut = useCallback(() => {
    auth0MockService.logout();
  }, []);

  return {
    isAuthenticated: session.isAuthenticated,
    isLoading,
    user: session.user,
    token: session.token,
    hasCompletedOnboarding: session.hasCompletedOnboarding,
    loginWithProvider,
    completeOnboarding,
    updateProfile,
    signOut,
  };
}
