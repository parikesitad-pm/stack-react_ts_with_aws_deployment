import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Shield,
  ArrowRight,
  User,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { useAuthSession } from '../hooks/useAuthSession';

export function Auth0LoginForm() {
  const navigate = useNavigate();
  const { loginWithProvider } = useAuthSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderLogin = (provider: 'google-oauth2' | 'github') => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      loginWithProvider(provider);
      navigate('/auth/callback?provider=' + provider);
    } catch {
      setError('Authentication failed. Please retry.');
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!identifier.trim() || !password) {
      setError('Incorrect username/email or password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Authenticate via Auth0 flow
      loginWithProvider(
        'email',
        identifier.includes('@') ? identifier : undefined
      );
      navigate('/auth/callback?provider=database');
    } catch {
      // Generic error: never disclose whether username/email exists
      setError('Incorrect username/email or password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5 font-mono text-xs">
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
          onClick={() => handleProviderLogin('google-oauth2')}
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleProviderLogin('github')}
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Continue with GitHub</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-stack-metal/60" />
        <span className="absolute px-3 text-[10px] text-stack-steel uppercase bg-stack-surface">
          or
        </span>
      </div>

      {/* Username or Email + Password Form */}
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        <div>
          <label className="block mb-1 text-[11px] font-bold text-stack-silver">
            Username or email
          </label>
          <div className="relative">
            <User className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-stack-steel" />
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com or @username"
              className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-stack-silver">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-[10px] text-stack-steel hover:text-stack-silver underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-stack-steel" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full justify-center mt-1"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-2 border-t border-stack-metal/40">
        <span className="text-stack-steel text-[11px]">
          Don't have an account?{' '}
        </span>
        <Link
          to="/auth/register"
          className="text-[11px] text-stack-bone hover:underline font-bold"
        >
          Create an account
        </Link>
      </div>

      {/* Auth0 Trust Guarantee */}
      <div className="pt-1 flex items-start gap-2 text-[10px] text-stack-steel leading-relaxed">
        <Shield className="w-3.5 h-3.5 text-stack-red-hover shrink-0 mt-0.5" />
        <span>
          Passwords are never stored by STACK. All identity credentials
          authorize through Auth0 protocols.
        </span>
      </div>
    </div>
  );
}
