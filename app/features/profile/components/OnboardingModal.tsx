import { useState } from 'react';
import {
  User,
  Calendar,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import {
  normalizeUsername,
  usernameSchema,
  type UserProfile,
} from '../schemas/username.schema';
import { IdentityService } from '../services/identity.service';

interface OnboardingModalProps {
  isOpen: boolean;
  email?: string;
  isSocial?: boolean;
  token?: string;
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingModal({
  isOpen,
  email,
  isSocial = false,
  token,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawInput, setRawInput] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalized = normalizeUsername(rawInput);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsernameSuggestions([]);

    if (rawInput.includes(' ')) {
      setError('Spaces are not allowed in usernames.');
      return;
    }

    const validation = usernameSchema.safeParse(normalized);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const avail = await IdentityService.checkAvailability(normalized, token);
      if (!avail.available) {
        setError(`@${normalized} is already taken.`);
        setUsernameSuggestions(
          avail.suggestions || IdentityService.suggestAlternatives(normalized)
        );
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      setStep(2);
    } catch {
      setIsSubmitting(false);
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) {
      setError('Please provide your date of birth.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Atomic claim with server / DynamoDB conditional write
      const profile = await IdentityService.claimOnboarding(
        {
          username: normalized,
          dateOfBirth,
        },
        token || 'dev-token'
      );

      setStep(3);
      setTimeout(() => {
        onComplete(profile);
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      if (msg === 'USERNAME_TAKEN') {
        setError(`That username is already taken.`);
        setUsernameSuggestions(IdentityService.suggestAlternatives(normalized));
        setStep(1);
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/90 backdrop-blur-sm font-mono text-stack-bone animate-fade-in select-none">
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

        {/* Step 1: What should I call you? */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 01 OF 02
              </span>
              <h3 className="text-sm font-bold text-stack-bone">
                What should I call you?
              </h3>
              <p className="text-xs text-stack-steel leading-relaxed">
                {isSocial ? (
                  <>
                    This will become your STACK username and profile handle:{' '}
                    <span className="text-stack-silver font-semibold">
                      @{normalized || 'username'}
                    </span>
                    . You'll continue signing in with your connected provider.
                  </>
                ) : (
                  <>
                    This will become your STACK username and profile handle:{' '}
                    <span className="text-stack-silver font-semibold">
                      @{normalized || 'username'}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stack-steel">
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={rawInput}
                  onChange={(e) => {
                    setRawInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="luca"
                  maxLength={32}
                  className="w-full pl-8 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-xs text-stack-bone placeholder-stack-steel/50 focus:outline-none focus:border-stack-steel"
                />
              </div>

              {normalized && (
                <div className="flex items-center gap-1.5 text-[11px] text-stack-steel truncate">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>Public handle: </span>
                  <span className="text-stack-silver truncate">
                    https://stack-md.online/@{normalized}
                  </span>
                </div>
              )}

              <p className="text-[10px] text-stack-steel/80">
                3–32 characters. Use lowercase letters, numbers, dot, underscore, or hyphen.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-stack-red-muted/20 border border-stack-red-slate/40 text-stack-bone text-xs">
                <AlertCircle className="w-4 h-4 text-stack-red-hover shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {usernameSuggestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-stack-steel">
                  Suggested alternatives:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {usernameSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setRawInput(sug);
                        setError(null);
                        setUsernameSuggestions([]);
                      }}
                      className="px-2 py-0.5 rounded border border-stack-metal bg-stack-surface-raised hover:border-stack-steel text-stack-silver hover:text-stack-bone text-[11px]"
                    >
                      @{sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || !rawInput.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Checking availability…</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Date of Birth */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 02 OF 02
              </span>
              <h3 className="text-sm font-bold text-stack-bone">
                When were you born?
              </h3>
              <p className="text-xs text-stack-steel leading-relaxed">
                This stays private and is used for your account profile.
              </p>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stack-steel" />
              <input
                type="date"
                autoFocus
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-xs text-stack-bone focus:outline-none focus:border-stack-steel [color-scheme:dark]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-stack-red-muted/20 border border-stack-red-slate/40 text-stack-bone text-xs">
                <AlertCircle className="w-4 h-4 text-stack-red-hover shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
              >
                Back
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || !dateOfBirth}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Claiming username…</span>
                  </>
                ) : (
                  <>
                    <span>Complete setup</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-stack-green/20 border border-stack-green/40 flex items-center justify-center text-stack-green">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stack-bone">
              Identity Initialized
            </h3>
            <p className="text-xs text-stack-silver">
              Welcome to STACK, @{normalized}. Initializing your clean
              workspace…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
