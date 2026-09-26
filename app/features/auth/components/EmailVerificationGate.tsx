import { useState, useMemo, useEffect } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Button } from '~/components/atoms/Button';

interface EmailVerificationGateProps {
  email: string;
  onRefreshSession: () => Promise<boolean>;
  onResendVerification: () => Promise<void>;
  onSignOut: () => void;
}

export function EmailVerificationGate({
  email,
  onRefreshSession,
  onResendVerification,
  onSignOut,
}: EmailVerificationGateProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maskedEmail = useMemo(() => {
    if (!email) return 'your email address';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0] || '';
    const domain = parts[1] || '';
    const visible = name.slice(0, 1);
    return `${visible}***@${domain}`;
  }, [email]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerifyCheck = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const isVerified = await onRefreshSession();
      if (!isVerified) {
        setErrorMessage(
          'Email not yet verified. Please click the link sent to your inbox, then try again.'
        );
      }
    } catch {
      setErrorMessage(
        'Unable to refresh verification status. Please retry shortly.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await onResendVerification();
      setResendCooldown(60);
      setInfoMessage(`Verification email resent to ${maskedEmail}.`);
    } catch {
      setErrorMessage('Failed to request resend. Please check your inbox or retry in a minute.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col justify-center items-center p-4 sm:p-6 font-mono select-none">
      <div className="relative w-full max-w-md border border-stack-metal bg-stack-surface p-6 sm:p-8 rounded-lg shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo size="md" showWordmark={true} />
          
          <div className="w-12 h-12 rounded-full bg-stack-surface-raised border border-stack-metal flex items-center justify-center text-stack-bone mt-2">
            <Mail className="w-5 h-5 text-stack-red-hover" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-stack-bone pt-1">
            Check your inbox
          </h1>

          <div className="space-y-1 text-xs text-stack-steel">
            <p>We sent a verification link to:</p>
            <p className="font-semibold text-stack-bone text-sm">{maskedEmail}</p>
          </div>

          <p className="text-xs text-stack-silver leading-relaxed max-w-xs">
            Verify your email to continue to STACK.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded bg-stack-red-muted/20 border border-stack-red-slate/40 text-stack-bone text-xs">
            <AlertCircle className="w-4 h-4 text-stack-red-hover shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="flex items-center gap-2 p-3 rounded bg-stack-green/10 border border-stack-green/40 text-stack-green text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleVerifyCheck}
            disabled={isRefreshing}
            className="w-full justify-center shadow-lg"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Checking verification status…</span>
              </>
            ) : (
              <span>I've verified my email</span>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full justify-center text-xs"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Resending…</span>
              </>
            ) : resendCooldown > 0 ? (
              <span>Resend verification email ({resendCooldown}s)</span>
            ) : (
              <span>Resend verification email</span>
            )}
          </Button>
        </div>

        <div className="text-center pt-2 border-t border-stack-metal/40">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-xs text-stack-steel hover:text-stack-bone transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
