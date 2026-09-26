import { useNavigate, useSearchParams } from 'react-router';
import { EmailVerificationGate } from '~/features/auth/components/EmailVerificationGate';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';

export function meta() {
  return [
    { title: 'Verify Email — STACK' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, checkEmailVerified, signOut } = useAuthSession();
  const email = user?.email || searchParams.get('email') || '';

  return (
    <EmailVerificationGate
      email={email}
      onRefreshSession={async () => {
        const ok = await checkEmailVerified();
        if (ok) {
          navigate('/app', { replace: true });
        }
        return ok;
      }}
      onResendVerification={async () => {}}
      onSignOut={() => {
        signOut();
        navigate('/auth/login', { replace: true });
      }}
    />
  );
}
