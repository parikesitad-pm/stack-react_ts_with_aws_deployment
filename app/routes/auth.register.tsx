import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { RegisterForm } from '~/features/auth/components/RegisterForm';
import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';

export default function RegisterPage() {
  const { isAuthenticated } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <RegisterForm />
      </main>
      <PublicFooter />
    </div>
  );
}
