import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { useMemo, useCallback } from 'react';
import { IdentityService } from '../services/identity.service';
import { getAuth0Config } from '~/features/auth/services/auth0.service';
import type { UserProfile } from '../schemas/username.schema';

export function useCurrentUserProfile() {
  const { user: auth0User, getAccessTokenSilently } = useAuth0();
  const sub = auth0User?.sub;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['profile', sub], [sub]);

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery<UserProfile | null>({
    queryKey,
    queryFn: async () => {
      if (!sub) return null;
      let token = '';
      const audience = getAuth0Config().audience;
      try {
        const t = await getAccessTokenSilently(
          audience
            ? {
                authorizationParams: {
                  audience,
                },
              }
            : undefined
        );
        if (t) token = t;
      } catch (err) {
        console.warn(
          '[useCurrentUserProfile] getAccessTokenSilently error:',
          err
        );
        if (IdentityService.isDevOrTest()) {
          token = sub;
        }
      }
      if (!token) return null;
      return IdentityService.getProfile(token);
    },
    enabled: Boolean(sub),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getEffectiveToken = useCallback(async (): Promise<string> => {
    if (!sub) throw new Error('AUTH_REQUIRED');
    const audience = getAuth0Config().audience;
    try {
      const token = await getAccessTokenSilently(
        audience
          ? {
              authorizationParams: {
                audience,
              },
            }
          : undefined
      );
      if (token) return token;
    } catch {}
    if (IdentityService.isDevOrTest()) return sub;
    throw new Error('AUTH_TOKEN_REQUIRED');
  }, [sub, getAccessTokenSilently]);

  const updateFullNameMutation = useMutation({
    mutationFn: async (fullName: string) => {
      const token = await getEffectiveToken();
      return IdentityService.updateProfile(
        { fullName: fullName.trim() },
        token
      );
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (args: {
      newUsername: string;
      challengeId: string;
      challengeCode: string;
    }) => {
      const token = await getEffectiveToken();
      return IdentityService.updateUsername(args, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (args: {
      newEmail: string;
      challengeId: string;
      challengeCode: string;
    }) => {
      const token = await getEffectiveToken();
      return IdentityService.updateEmail(args, token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const token = await getEffectiveToken();
      return IdentityService.deleteAvatar(token);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Display Name derivation
  const displayName = useMemo(() => {
    if (profile?.fullName?.trim()) return profile.fullName.trim();
    if (profile?.preferredName?.trim()) return profile.preferredName.trim();
    if (profile?.username) return `@${profile.username}`;
    if (auth0User?.name) return auth0User.name;
    return 'Operator';
  }, [profile, auth0User?.name]);

  // Initials derivation (e.g. "PL" or "O")
  const initials = useMemo(() => {
    if (profile?.fullName?.trim()) {
      const parts = profile.fullName.trim().split(/\s+/).filter(Boolean);
      const first = parts[0] || '';
      const second = parts[1] || '';
      const firstChar = first.charAt(0);
      const secondChar = second.charAt(0);
      if (firstChar && secondChar) {
        return (firstChar + secondChar).toUpperCase();
      }
      return first.slice(0, 2).toUpperCase() || 'OP';
    }
    if (profile?.preferredName?.trim()) {
      return profile.preferredName.trim().slice(0, 2).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    return 'OP';
  }, [profile]);

  // Avatar URL resolution with proper fallback chain
  const effectiveAvatarUrl = useMemo(() => {
    if (profile?.avatarUrl) return profile.avatarUrl;
    if (auth0User?.picture) return auth0User.picture;
    return undefined;
  }, [profile?.avatarUrl, auth0User?.picture]);

  return {
    profile: profile ?? null,
    isLoading,
    sub,
    username: profile?.username || auth0User?.nickname || 'operator',
    fullName: profile?.fullName || '',
    email: profile?.email || auth0User?.email || '',
    displayName,
    initials,
    avatarUrl: effectiveAvatarUrl,
    hasCustomAvatar: Boolean(profile?.avatarKey || profile?.avatarUrl),
    refetch,
    updateFullName: updateFullNameMutation.mutateAsync,
    updateUsername: updateUsernameMutation.mutateAsync,
    updateEmail: updateEmailMutation.mutateAsync,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    isUpdatingFullName: updateFullNameMutation.isPending,
    isUpdatingUsername: updateUsernameMutation.isPending,
    isUpdatingEmail: updateEmailMutation.isPending,
  };
}
