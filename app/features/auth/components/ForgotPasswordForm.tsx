import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Badge } from '~/components/atoms/Badge';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-stack-metal bg-stack-surface p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <BrandLogo size="md" showWordmark={true} />
        <div className="pt-2">
          <Badge variant="default">CREDENTIAL RECOVERY</Badge>
        </div>
        <h2 className="font-mono text-xl font-bold tracking-tight text-stack-bone pt-1">
          Reset Passphrase
        </h2>
        <p className="font-mono text-xs text-stack-steel">
          Submit your account email to dispatch a cryptographic reset code.
        </p>
      </div>

      {isSubmitted ? (
        <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-4 font-mono text-xs text-emerald-400 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Reset Instructions Dispatched</span>
          </div>
          <p className="text-stack-silver text-[11px] leading-relaxed">
            If an account exists for{' '}
            <span className="text-stack-bone">{email}</span>, a reset token has
            been transmitted to your inbox.
          </p>
          <div className="pt-2">
            <Link to="/auth/login">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center"
              >
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-stack-silver text-[11px] uppercase tracking-wider">
              Account Email
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            className="w-full justify-center mt-2"
          >
            <span>{isLoading ? 'Dispatching...' : 'Transmit Reset Code'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-stack-metal/40 flex items-center justify-between font-mono text-xs text-stack-steel">
        <span>Remember your credentials?</span>
        <Link
          to="/auth/login"
          className="text-stack-silver hover:text-stack-bone font-medium underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
