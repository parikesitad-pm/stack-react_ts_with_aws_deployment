import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';

export default function AuthLogoutRoute() {
  const navigate = useNavigate();
  const { signOut } = useAuthSession();

  useEffect(() => {
    signOut();
    const timer = setTimeout(() => {
      navigate('/auth/login', { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen bg-stack-bg flex items-center justify-center p-4 font-mono text-stack-bone text-xs">
      <div className="border border-stack-metal bg-stack-surface p-6 rounded text-center space-y-2">
        <p className="font-bold">Signing out of STACK…</p>
        <p className="text-stack-steel text-[11px]">
          Clearing local session and authenticated caches.
        </p>
      </div>
    </div>
  );
}
