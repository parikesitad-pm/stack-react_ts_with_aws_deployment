import { VerifyEmailForm } from '~/features/auth/components/VerifyEmailForm';
import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <VerifyEmailForm />
      </main>
      <PublicFooter />
    </div>
  );
}
