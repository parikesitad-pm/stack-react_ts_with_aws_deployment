import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Badge } from '~/components/atoms/Badge';
import { AuthService } from '~/features/auth/services/auth.service';

export function RegisterForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email syntax validation
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  // Password requirements progressive evaluation
  const passwordRules = useMemo(() => {
    return {
      min8: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    passwordRules.min8 &&
    passwordRules.upper &&
    passwordRules.lower &&
    passwordRules.number &&
    passwordRules.symbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!isEmailValid) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check existing accounts on submission (preventing enumeration keystroke checks)
      const existingUsers = JSON.parse(
        localStorage.getItem('stack_registered_emails') || '[]'
      ) as string[];

      if (existingUsers.includes(email.trim().toLowerCase())) {
        setError('An account with this email already exists. Sign in instead.');
        setIsLoading(false);
        return;
      }

      existingUsers.push(email.trim().toLowerCase());
      localStorage.setItem(
        'stack_registered_emails',
        JSON.stringify(existingUsers)
      );

      // Store unverified registration state
      localStorage.setItem(`stack_pending_verify_${email.trim().toLowerCase()}`, 'true');

      // Navigate to verification screen with email parameter
      navigate(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError('Registration failed. Please try again.');
      setIsLoading(false);
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
          Create Account
        </h2>
        <p className="text-xs text-stack-steel">
          Markdown notes without the noise.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-stack-red-slate/50 bg-stack-red-muted/30 p-3 text-xs text-stack-bone animate-fade-in">
          <AlertCircle className="h-4 w-4 text-stack-red-hover shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] font-bold">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(true);
                setError(null);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              className="w-full rounded border border-stack-metal bg-stack-surface-raised py-2 pl-9 pr-3 text-stack-bone placeholder:text-stack-steel/50 focus:border-stack-steel focus:outline-none transition-colors"
            />
          </div>
          {/* Email live feedback (neutral until interaction) */}
          {emailTouched && email.length > 0 && (
            <div className="text-[11px]">
              {isEmailValid ? (
                <span className="text-green-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Valid email</span>
                </span>
              ) : (
                <span className="text-stack-red-hover">
                  Enter a valid email address.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] font-bold">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordTouched(true);
                setError(null);
              }}
              placeholder="••••••••••••"
              className="w-full rounded border border-stack-metal bg-stack-surface-raised py-2 pl-9 pr-3 text-stack-bone placeholder:text-stack-steel/50 focus:border-stack-steel focus:outline-none transition-colors"
            />
          </div>

          {/* Password requirements: ONLY visible after user starts typing */}
          {passwordTouched && password.length > 0 && (
            <div className="p-3 mt-2 rounded bg-stack-surface-raised border border-stack-metal/60 space-y-1.5 text-[11px] text-stack-steel animate-fade-in">
              <span className="font-bold text-stack-silver">
                Your password needs:
              </span>
              <ul className="space-y-1 pt-0.5">
                <li
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordRules.min8 ? 'text-green-400' : 'text-stack-steel'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>At least 8 characters</span>
                </li>
                <li
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordRules.upper ? 'text-green-400' : 'text-stack-steel'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>One uppercase letter</span>
                </li>
                <li
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordRules.lower ? 'text-green-400' : 'text-stack-steel'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>One lowercase letter</span>
                </li>
                <li
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordRules.number ? 'text-green-400' : 'text-stack-steel'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>One number</span>
                </li>
                <li
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordRules.symbol ? 'text-green-400' : 'text-stack-steel'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>One symbol</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
          aria-busy={isLoading}
          className="w-full justify-center mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              <span>Creating account…</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-stack-metal/40 flex items-center justify-between text-xs text-stack-steel">
        <span>Already have an account?</span>
        <Link
          to="/auth/login"
          className="text-stack-bone hover:underline font-bold"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
