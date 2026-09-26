import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { useAuthSession } from '../hooks/useAuthSession';

export function AuthCallbackHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, hasCompletedOnboarding } = useAuthSession();
  const [statusMessage, setStatusMessage] = useState('Verifying Auth0 token…');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatusMessage('Extracting authenticated claims (sub)…');
    }, 300);

    const t2 = setTimeout(() => {
      setStatusMessage('Setting up local workspace boundary…');
    }, 700);

    const t3 = setTimeout(() => {
      navigate('/app', { replace: true });
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-stack-bg flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm border border-stack-metal bg-stack-surface p-8 rounded-lg shadow-2xl space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo size="lg" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-stack-steel uppercase tracking-wider">
            <span className="font-bold text-stack-bone">AUTH0</span>
            <span>·</span>
            <span>CALLBACK</span>
          </div>
          <h2 className="text-base font-bold text-stack-bone">{statusMessage}</h2>
        </div>

        <div className="w-32 h-1 bg-stack-surface-raised mx-auto rounded-full overflow-hidden border border-stack-metal/60">
          <div className="h-full bg-stack-red-slate animate-pulse w-full" />
        </div>

        <div className="p-3 bg-stack-bg rounded border border-stack-metal/70 text-[11px] text-stack-steel text-left truncate">
          <span>Identity Claim: </span>
          <span className="font-bold text-stack-bone">
            {user?.sub || 'verifying…'}
          </span>
        </div>
      </div>
    </div>
  );
}
