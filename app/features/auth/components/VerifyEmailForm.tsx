import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Badge } from '~/components/atoms/Badge';
import { AuthService } from '~/features/auth/services/auth.service';

export function VerifyEmailForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.verifyEmail({ email, code });
      navigate('/auth/login?verified=true', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Verification code invalid'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-stack-metal bg-stack-surface p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <BrandLogo size="md" showWordmark={true} />
        <div className="pt-2">
          <Badge variant="accent">SECURITY VERIFICATION</Badge>
        </div>
        <h2 className="font-mono text-xl font-bold tracking-tight text-stack-bone pt-1">
          Verify Email Address
        </h2>
        <p className="font-mono text-xs text-stack-steel">
          Enter the 6-digit confirmation code dispatched to your inbox.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-stack-red-slate/50 bg-stack-red-muted/30 p-3 font-mono text-xs text-stack-red-hover">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] uppercase tracking-wider">
            Registered Email
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@modula.tools"
              className="w-full rounded border border-stack-metal bg-stack-bg py-2 pl-9 pr-3 text-stack-bone placeholder:text-stack-steel focus:border-stack-steel focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] uppercase tracking-wider">
            6-Digit Code
          </label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="123456"
              className="w-full rounded border border-stack-metal bg-stack-bg py-2 pl-9 pr-3 text-center tracking-widest text-base font-bold text-stack-bone placeholder:text-stack-steel focus:border-stack-steel focus:outline-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || code.length !== 6}
          className="w-full justify-center mt-2"
        >
          <span>{isLoading ? 'Validating...' : 'Confirm & Activate'}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-stack-metal/40 flex items-center justify-between font-mono text-xs text-stack-steel">
        <span>Wrong address?</span>
        <Link
          to="/auth/register"
          className="text-stack-silver hover:text-stack-bone font-medium underline"
        >
          Back to Register
        </Link>
      </div>
    </div>
  );
}
