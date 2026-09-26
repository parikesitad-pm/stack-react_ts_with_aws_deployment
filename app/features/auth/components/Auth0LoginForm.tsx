import { useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import {
  Shield,
  ArrowRight,
  Mail,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { useAuthSession } from '../hooks/useAuthSession';

interface Auth0LoginFormProps {
  mode?: 'login' | 'register';
}

export function Auth0LoginForm({ mode = 'login' }: Auth0LoginFormProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/app';

  const {
    loginWithGoogle,
    loginWithGitHub,
    loginWithEmail,
    signUp,
    isLoading: isSessionLoading,
  } = useAuthSession();

  const [activeAction, setActiveAction] = useState<
    'google' | 'github' | 'email' | 'signup' | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    if (activeAction) return;
    setActiveAction('google');
    setError(null);
    try {
      await loginWithGoogle(returnTo);
    } catch {
      setError("We couldn't reach STACK. Try again.");
      setActiveAction(null);
    }
  };

  const handleGitHub = async () => {
    if (activeAction) return;
    setActiveAction('github');
    setError(null);
    try {
      await loginWithGitHub(returnTo);
    } catch {
      setError("We couldn't reach STACK. Try again.");
      setActiveAction(null);
    }
  };

  const handleEmailAuth = async () => {
    if (activeAction) return;
    setActiveAction(mode === 'register' ? 'signup' : 'email');
    setError(null);
    try {
      if (mode === 'register') {
        await signUp(returnTo);
      } else {
        await loginWithEmail(returnTo);
      }
    } catch {
      setError("We couldn't reach STACK. Try again.");
      setActiveAction(null);
    }
  };

  const isBusy = Boolean(activeAction || isSessionLoading);

  return (
    <div className="w-full space-y-5 font-mono text-xs select-none">
      {error && (
        <div className="flex items-center gap-2 p-3 border rounded bg-stack-red-muted/30 border-stack-red-slate/40 text-stack-bone animate-fade-in">
          <AlertCircle className="w-4 h-4 text-stack-red-hover shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Social OAuth Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isBusy}
          aria-busy={activeAction === 'google'}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeAction === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin text-stack-bone" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
          )}
          <span>
            {activeAction === 'google'
              ? 'Connecting to Google…'
              : 'Continue with Google'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleGitHub}
          disabled={isBusy}
          aria-busy={activeAction === 'github'}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeAction === 'github' ? (
            <Loader2 className="w-4 h-4 animate-spin text-stack-bone" />
          ) : (
            <svg
              className="w-4 h-4 fill-current text-stack-bone"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>
            {activeAction === 'github'
              ? 'Connecting to GitHub…'
              : 'Continue with GitHub'}
          </span>
        </button>
      </div>

      {/* Industrial Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-stack-metal/70 w-full" />
        <span className="bg-stack-surface px-3 text-[10px] text-stack-steel uppercase tracking-widest absolute">
          OR EMAIL AUTH
        </span>
      </div>

      {/* Email / Password Universal Login CTA */}
      <div className="space-y-3 pt-1">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleEmailAuth}
          disabled={isBusy}
          className="w-full justify-center shadow-lg"
        >
          {activeAction === 'email' || activeAction === 'signup' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              <span>
                {mode === 'register'
                  ? 'Opening registration…'
                  : 'Opening secure login…'}
              </span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-1.5" />
              <span>
                {mode === 'register'
                  ? 'Continue with Email'
                  : 'Continue with Email & Password'}
              </span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>

        <p className="text-[11px] text-stack-steel text-center leading-relaxed">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="text-stack-silver hover:text-stack-bone underline decoration-stack-metal"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to STACK?{' '}
              <Link
                to="/auth/register"
                className="text-stack-silver hover:text-stack-bone underline decoration-stack-metal"
              >
                Create account
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Security notice */}
      <div className="p-3 bg-stack-bg/80 border border-stack-metal/60 rounded text-[11px] text-stack-steel space-y-1">
        <div className="flex items-center gap-1.5 text-stack-bone font-bold">
          <Shield className="w-3.5 h-3.5 text-stack-red-hover" />
          <span>Strict Security Contract</span>
        </div>
        <p>
          STACK never stores or accesses your raw password. All identity and
          tokens are brokered exclusively through Auth0 with PKCE and
          cryptographic JWT verification.
        </p>
      </div>
    </div>
  );
}
