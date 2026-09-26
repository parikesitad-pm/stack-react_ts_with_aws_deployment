import { useState, useEffect } from 'react';
import {
  User,
  AtSign,
  Calendar,
  Shield,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { AuthService } from '~/features/auth/services/auth.service';

interface OnboardingModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onComplete: (
    preferredName: string,
    username: string,
    dateOfBirth: string
  ) => void;
}

export function OnboardingModal({
  isOpen,
  initialEmail,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [preferredName, setPreferredName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = preferredName.trim();
    if (!cleanName) {
      setError('Please provide a preferred name or callsign.');
      return;
    }
    setError(null);
    // Derive initial advisory username suggestion
    const suggested = AuthService.sanitizeUsername(cleanName) || 'operator';
    setUsername(suggested);
    setStep(2);
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = AuthService.sanitizeUsername(username);
    if (!cleanUser || cleanUser.length < 3) {
      setError('Username must contain at least 3 alphanumeric characters.');
      return;
    }

    setIsCheckingUsername(true);
    setError(null);

    try {
      const isAvailable =
        await AuthService.checkUsernameAvailability(cleanUser);
      if (!isAvailable) {
        setError(`@${cleanUser} is taken.`);
        setUsernameSuggestions(AuthService.suggestAlternatives(cleanUser));
        setIsCheckingUsername(false);
        return;
      }

      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
      setStep(3);
    } catch {
      setIsCheckingUsername(false);
      setStep(3);
    }
  };

  const handleNextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) {
      setError('Please provide your date of birth.');
      return;
    }
    setError(null);
    setStep(4);

    // After brief welcome confirmation, trigger completion
    setTimeout(() => {
      onComplete(
        preferredName.trim(),
        username.replace(/^@+/, '').toLowerCase(),
        dateOfBirth
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/85 backdrop-blur-sm font-mono text-stack-bone animate-fade-in select-none">
      <div className="w-full max-w-md border border-stack-metal bg-stack-surface p-6 sm:p-8 rounded-lg shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="flex items-center gap-3 border-b border-stack-metal/60 pb-4">
          <BrandLogo size="md" />
          <div>
            <div className="text-[10px] text-stack-steel uppercase tracking-widest">
              INITIAL SETUP · OPERATOR ONBOARDING
            </div>
            <h2 className="text-base font-bold text-stack-bone">
              Configure Your Profile
            </h2>
          </div>
        </div>

        {/* Step 1: Preferred Name */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 01 OF 03
              </span>
              <h3 className="text-sm font-bold text-stack-bone">
                What should STACK call you?
              </h3>
              <p className="text-xs text-stack-steel leading-relaxed">
                Your preferred display name inside the workspace and notes.
              </p>
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stack-steel" />
              <input
                type="text"
                autoFocus
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Luca, Alex, Commander"
                className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-xs text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel"
              />
            </div>

            {error && <p className="text-xs text-stack-red-hover">{error}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md">
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Unique Username */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 02 OF 03
              </span>
              <h3 className="text-sm font-bold text-stack-bone">
                Your STACK username
              </h3>
              <p className="text-xs text-stack-steel leading-relaxed">
                For email/password accounts, you can use this username to sign
                in.
              </p>
            </div>

            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stack-steel" />
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/^@+/, ''));
                  setError(null);
                }}
                placeholder="username"
                className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-xs text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel lowercase"
              />
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-xs text-stack-red-hover flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
                {usernameSuggestions.length > 0 && (
                  <div className="text-[11px] text-stack-steel">
                    <span>Available suggestions: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {usernameSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setUsername(sug.replace(/^@+/, ''));
                            setError(null);
                          }}
                          className="px-2 py-0.5 rounded border border-stack-metal bg-stack-surface-raised text-stack-silver hover:text-stack-bone hover:border-stack-steel transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-stack-steel hover:text-stack-bone underline"
              >
                Back
              </button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isCheckingUsername}
              >
                {isCheckingUsername ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Checking availability…</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Username</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Date of Birth */}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 03 OF 03
              </span>
              <h3 className="text-sm font-bold text-stack-bone">
                When were you born?
              </h3>
              <p className="text-xs text-stack-steel leading-relaxed">
                Used for your profile and future personalization.
              </p>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stack-steel" />
              <input
                type="date"
                autoFocus
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-xs text-stack-bone focus:outline-none focus:border-stack-steel"
              />
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded bg-stack-surface-raised border border-stack-metal/60 text-[10px] text-stack-steel">
              <Shield className="w-3.5 h-3.5 text-stack-red-hover shrink-0 mt-0.5" />
              <span>
                Privacy Guarantee: Your date of birth is stored exclusively as
                private profile metadata. It is never exposed publicly or
                shared.
              </span>
            </div>

            {error && <p className="text-xs text-stack-red-hover">{error}</p>}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-stack-steel hover:text-stack-bone underline"
              >
                Back
              </button>
              <Button type="submit" variant="primary" size="md">
                <span>Complete Setup</span>
                <Check className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Welcome Flash */}
        {step === 4 && (
          <div className="text-center py-6 space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full border border-stack-red-slate/60 bg-stack-red-muted/30 flex items-center justify-center mx-auto text-stack-bone">
              <Check className="w-6 h-6 text-stack-red-hover" />
            </div>
            <h3 className="text-base font-bold text-stack-bone">
              Welcome to STACK, {preferredName}.
            </h3>
            <p className="text-xs text-stack-steel">
              Registered handle: @{username.replace(/^@+/, '')} · Launching
              workspace…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
