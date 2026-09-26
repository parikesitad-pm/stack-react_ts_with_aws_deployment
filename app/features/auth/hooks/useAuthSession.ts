import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useQueryClient } from '@tanstack/react-query';
import { IdentityService } from '~/features/profile/services/identity.service';
import type { UserProfile } from '~/features/profile/schemas/username.schema';
import { logoutCleanupService } from '../services/logoutCleanup.service';
import { attachmentRepository } from '~/features/attachments/services/attachment.repository';

export interface ExtendedAuthUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  username: string;
  preferredName: string;
  dateOfBirth?: string;
  picture?: string;
  isSocial: boolean;
  provider?: string;
  hasCompletedOnboarding: boolean;
}

export function useAuthSession() {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading: isAuth0Loading,
    loginWithRedirect,
    logout,
    getIdTokenClaims,
    getAccessTokenSilently,
  } = useAuth0();

  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [claimsVerified, setClaimsVerified] = useState<boolean | null>(null);

  // Load token silently when authenticated
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && auth0User?.sub) {
      attachmentRepository.setActiveSub(auth0User.sub);

      getAccessTokenSilently()
        .then((t) => {
          if (isMounted) setToken(t || null);
        })
        .catch(() => {
          // Token retrieval failed or no audience configured
          if (isMounted) setToken(null);
        });

      setIsProfileLoading(true);
      IdentityService.getProfile(auth0User.sub)
        .then((p) => {
          if (isMounted) {
            setProfile(p);
            setIsProfileLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsProfileLoading(false);
        });
    } else {
      attachmentRepository.setActiveSub(null);
      setProfile(null);
      setToken(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, auth0User?.sub, getAccessTokenSilently]);

  const isSocial = useMemo(() => {
    if (!auth0User?.sub) return false;
    return !auth0User.sub.startsWith('auth0|');
  }, [auth0User?.sub]);

  const provider = useMemo(() => {
    if (!auth0User?.sub) return 'auth0';
    return auth0User.sub.split('|')[0] || 'auth0';
  }, [auth0User?.sub]);

  const emailVerified = useMemo(() => {
    if (claimsVerified !== null) return claimsVerified;
    return Boolean(auth0User?.email_verified);
  }, [claimsVerified, auth0User?.email_verified]);

  const hasCompletedOnboarding = useMemo(() => {
    return Boolean(profile?.onboardingCompletedAt);
  }, [profile?.onboardingCompletedAt]);

  const user: ExtendedAuthUser | null = useMemo(() => {
    if (!auth0User?.sub) return null;
    const username =
      profile?.username ||
      auth0User.nickname ||
      auth0User.name?.toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      'operator';

    return {
      sub: auth0User.sub,
      email: auth0User.email || '',
      emailVerified,
      username,
      preferredName: profile?.preferredName || profile?.username || auth0User.name || username,
      dateOfBirth: profile?.dateOfBirth,
      picture: auth0User.picture,
      isSocial,
      provider,
      hasCompletedOnboarding,
    };
  }, [auth0User, profile, emailVerified, isSocial, provider, hasCompletedOnboarding]);

  const loginWithGoogle = useCallback(
    async (returnTo?: string) => {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
        },
        appState: { returnTo: returnTo || '/app' },
      });
    },
    [loginWithRedirect]
  );

  const loginWithGitHub = useCallback(
    async (returnTo?: string) => {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'github',
        },
        appState: { returnTo: returnTo || '/app' },
      });
    },
    [loginWithRedirect]
  );

  const loginWithEmail = useCallback(
    async (returnTo?: string) => {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'Username-Password-Authentication',
        },
        appState: { returnTo: returnTo || '/app' },
      });
    },
    [loginWithRedirect]
  );

  const loginWithProvider = useCallback(
    (providerName: 'google-oauth2' | 'github' | 'email', _email?: string) => {
      if (providerName === 'google-oauth2') return loginWithGoogle();
      if (providerName === 'github') return loginWithGitHub();
      return loginWithEmail();
    },
    [loginWithGoogle, loginWithGitHub, loginWithEmail]
  );

  const signUp = useCallback(
    async (returnTo?: string) => {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
        },
        appState: { returnTo: returnTo || '/app' },
      });
    },
    [loginWithRedirect]
  );

  const checkEmailVerified = useCallback(async (): Promise<boolean> => {
    try {
      const claims = await getIdTokenClaims();
      const verified = claims?.email_verified === true;
      setClaimsVerified(verified);
      return verified;
    } catch {
      return false;
    }
  }, [getIdTokenClaims]);

  const claimUsername = useCallback(
    async (
      username: string,
      dateOfBirth?: string
    ): Promise<UserProfile> => {
      if (!auth0User?.sub) {
        throw new Error('AUTH_REQUIRED');
      }
      const newProfile = await IdentityService.claimOnboarding(
        auth0User.sub,
        { username, dateOfBirth },
        auth0User.email,
        token || undefined
      );
      setProfile(newProfile);
      return newProfile;
    },
    [auth0User?.sub, auth0User?.email, token]
  );

  const completeOnboarding = useCallback(
    (
      _preferredName: string,
      username: string,
      dateOfBirth: string
    ) => {
      return claimUsername(username, dateOfBirth);
    },
    [claimUsername]
  );

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      if (profile) {
        const updated = { ...profile, ...partial, updatedAt: new Date().toISOString() };
        setProfile(updated);
        return updated;
      }
      return null;
    },
    [profile]
  );

  const signOut = useCallback(
    async (returnTo?: string) => {
      await logoutCleanupService.execute({
        sub: auth0User?.sub,
        queryClient,
        onCompleteAuth0Logout: () => {
          logout({
            logoutParams: {
              returnTo:
                returnTo ||
                (typeof window !== 'undefined'
                  ? window.location.origin
                  : 'https://stack-md.online'),
            },
          });
        },
      });
    },
    [auth0User?.sub, queryClient, logout]
  );

  return {
    isAuthenticated,
    isLoading: isAuth0Loading || (isAuthenticated && isProfileLoading),
    user,
    auth0User,
    token,
    hasCompletedOnboarding,
    isSocial,
    emailVerified,
    loginWithGoogle,
    loginWithGitHub,
    loginWithEmail,
    loginWithProvider,
    signUp,
    checkEmailVerified,
    claimUsername,
    completeOnboarding,
    updateProfile,
    signOut,
  };
}
