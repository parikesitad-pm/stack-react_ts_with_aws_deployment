import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { useAuthSession } from '../hooks/useAuthSession';

export function Auth0LoginForm() {
  const navigate = useNavigate();
  const { loginWithProvider } = useAuthSession();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderLogin = (
    provider: 'google-oauth2' | 'github' | 'email'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      loginWithProvider(provider, provider === 'email' ? email : undefined);
      // Navigate to callback or directly to app
      navigate('/auth/callback?provider=' + provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    handleProviderLogin('email');
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs border rounded bg-stack-red-muted/30 border-stack-red-slate/40 text-stack-bone">
          <AlertCircle className="w-4 h-4 text-stack-red-hover shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Social OAuth Buttons */}
      <div className="space-y-3 font-mono">
        <button
          type="button"
          onClick={() => handleProviderLogin('github')}
          disabled={isLoading}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 text-xs font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>Continue with GitHub</span>
        </button>

        <button
          type="button"
          onClick={() => handleProviderLogin('google-oauth2')}
          disabled={isLoading}
          className="flex items-center justify-center w-full gap-3 px-4 py-2.5 text-xs font-semibold text-stack-bone transition-all bg-stack-surface-raised border border-stack-metal rounded hover:border-stack-steel hover:bg-stack-metal/60 shadow-sm"
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
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-stack-metal/60" />
        <span className="absolute px-3 font-mono text-[10px] text-stack-steel uppercase bg-stack-surface">
          or continue with email
        </span>
      </div>

      {/* Email Form */}
      <form
        onSubmit={handleEmailSubmit}
        className="space-y-3 font-mono text-xs"
      >
        <div>
          <label className="block mb-1.5 font-bold text-stack-silver">
            Work or Personal Email
          </label>
          <div className="relative">
            <Mail className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-stack-steel" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@modula.tools"
              className="w-full pl-9 pr-3 py-2 bg-stack-surface border border-stack-metal rounded text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel focus:ring-1 focus:ring-stack-steel transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full justify-center"
          disabled={isLoading}
        >
          <span>Authenticate via Auth0</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </form>

      {/* Auth0 Trust Guarantee */}
      <div className="pt-2 border-t border-stack-metal/40 flex items-start gap-2 text-[10px] font-mono text-stack-steel leading-relaxed">
        <Shield className="w-3.5 h-3.5 text-stack-red-hover shrink-0 mt-0.5" />
        <span>
          Passwords are never processed or stored by STACK. All identity
          authorizations redirect securely through Auth0 with JWT claim
          validation.
        </span>
      </div>
    </div>
  );
}
