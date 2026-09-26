import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  KeyRound,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { useAuthSession } from '../hooks/useAuthSession';

export function VerifyEmailForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawEmail = searchParams.get('email') || 'operator@example.com';
  const { loginWithProvider } = useAuthSession();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mask email: l***@example.com
  const maskedEmail = useMemo(() => {
    const parts = rawEmail.split('@');
    if (parts.length !== 2) return rawEmail;
    const name = parts[0] || '';
    const domain = parts[1] || '';
    const visible = name.slice(0, 1);
    return `${visible}***@${domain}`;
  }, [rawEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!code.trim() || code.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate verifying email code
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`stack_pending_verify_${rawEmail.toLowerCase()}`);
      }
      // Log in and route to onboarding/app
      loginWithProvider('email', rawEmail);
      navigate('/app', { replace: true });
    } catch {
      setError('Invalid or expired verification code.');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setResendMessage(null);

    try {
      // Simulate dispatching OTP via email
      await new Promise((r) => setTimeout(r, 600));
      setResendCooldown(60);
      setResendMessage(`New verification code sent to ${maskedEmail}`);
      setTimeout(() => setResendMessage(null), 5000);
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-stack-metal bg-stack-surface p-6 sm:p-8 shadow-2xl font-mono text-xs select-none">
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo size="md" showWordmark={true} />
        </Link>
        <div className="text-[10px] text-stack-steel uppercase tracking-widest pt-2">
          <span>STACK</span>
          <span className="mx-1">·</span>
          <span>A Modula Project</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-stack-bone">
          Verify your email
        </h2>
        <p className="text-xs text-stack-steel leading-relaxed">
          We sent a verification code to:{' '}
          <span className="text-stack-silver font-bold">{maskedEmail}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-stack-red-slate/50 bg-stack-red-muted/30 p-3 text-xs text-stack-bone animate-fade-in">
          <AlertCircle className="h-4 w-4 text-stack-red-hover shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {resendMessage && (
        <div
          aria-live="polite"
          className="mb-4 flex items-center gap-2 rounded border border-green-500/40 bg-green-500/10 p-3 text-xs text-green-300 animate-fade-in"
        >
          <Check className="h-4 w-4 text-green-400 shrink-0" />
          <span>{resendMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] font-bold">
            Verification code
          </label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="text"
              autoFocus
              required
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="123456"
              className="w-full rounded border border-stack-metal bg-stack-surface-raised py-2.5 pl-9 pr-3 text-center tracking-widest text-lg font-bold text-stack-bone placeholder:text-stack-steel/50 focus:border-stack-steel focus:outline-none transition-colors uppercase"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || code.length < 6}
          aria-busy={isLoading}
          className="w-full justify-center mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              <span>Verifying…</span>
            </>
          ) : (
            <>
              <span>Verify email</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      {/* Resend with Cooldown & Live Feedback */}
      <div className="mt-4 pt-3 border-t border-stack-metal/40 flex items-center justify-between text-xs text-stack-steel">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendCooldown > 0 || isResending}
          aria-busy={isResending}
          className="inline-flex items-center gap-1.5 text-stack-silver hover:text-stack-bone disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Resending code…</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'}
              </span>
            </>
          )}
        </button>

        <Link
          to="/auth/register"
          className="text-stack-silver hover:text-stack-bone underline"
        >
          Use another email
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link
          to="/auth/login"
          className="text-[11px] text-stack-steel hover:text-stack-bone"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
