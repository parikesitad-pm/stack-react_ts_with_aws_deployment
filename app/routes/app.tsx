import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';
import { IdentityService } from '~/features/profile/services/identity.service';
import { DeviceLockService } from '~/features/profile/services/deviceLock.service';
import { DeviceLockOverlay } from '~/features/profile/components/DeviceLockOverlay';
import { StartupLoader } from '~/features/workspace/components/StartupLoader';
import { EmailVerificationGate } from '~/features/auth/components/EmailVerificationGate';
import { OnboardingModal } from '~/features/profile/components/OnboardingModal';
import { WorkspaceView } from '~/features/workspace/components/WorkspaceView';

export function meta() {
  return [
    { title: 'Workspace — STACK' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function AppPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    token,
    hasCompletedOnboarding,
    checkEmailVerified,
    resendVerificationEmail,
    updateProfile,
    signOut,
  } = useAuthSession();

  const [isLocked, setIsLocked] = useState(() =>
    user?.sub ? DeviceLockService.isSessionLocked(user.sub) : false
  );

  useEffect(() => {
    if (user?.sub) {
      setIsLocked(DeviceLockService.isSessionLocked(user.sub));
    }
  }, [user?.sub]);

  useEffect(() => {
    if (!user?.sub || isLocked) return;
    const config = DeviceLockService.getConfig(user.sub);
    if (!config.enabled) return;

    const timeoutMs = (config.autoLockMinutes || 5) * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        DeviceLockService.lockSession(user.sub);
        setIsLocked(true);
      }, timeoutMs);
    };

    resetTimer();
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true })
    );

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, [user?.sub, isLocked]);

  // Protected route guard: preserve return target
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const returnTo = location.pathname + location.search;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('stack_redirect_after_login', returnTo);
      }
      navigate(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
    }
  }, [isAuthenticated, isAuthLoading, navigate, location]);

  // Loading state during Auth0 boot / session resolution
  if (isAuthLoading) {
    return <StartupLoader onReady={() => {}} />;
  }

  // Unauthenticated fallback
  if (!isAuthenticated || !user?.sub) {
    return null;
  }

  // Device Lock Overlay
  if (isLocked) {
    return (
      <DeviceLockOverlay
        sub={user.sub}
        onUnlocked={() => setIsLocked(false)}
        onForgotPin={() => {
          DeviceLockService.resetAfterReauthentication(user.sub);
          signOut();
        }}
      />
    );
  }

  // Email verification gate
  if (user.emailVerified === false) {
    return (
      <EmailVerificationGate
        email={user.email}
        onRefreshSession={checkEmailVerified}
        isResendSupported={IdentityService.hasBackendApi()}
        onResendVerification={
          IdentityService.hasBackendApi()
            ? async () => {
                await resendVerificationEmail();
              }
            : undefined
        }
        onSignOut={signOut}
      />
    );
  }

  // First-run STACK username & DOB onboarding gate
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingModal
        isOpen={true}
        email={user.email}
        isSocial={user.isSocial}
        token={token || undefined}
        onComplete={(newProfile) => {
          updateProfile(newProfile);
        }}
      />
    );
  }

  // Strictly partitioned per-user workspace
  return (
    <WorkspaceView
      key={user.sub}
      user={user}
      token={token}
      onSignOut={signOut}
    />
  );
}
