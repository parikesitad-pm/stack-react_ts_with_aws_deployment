import { useState } from 'react';
import { User, Calendar, Shield, ArrowRight, Check } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { BrandLogo } from '~/components/atoms/BrandLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onComplete: (preferredName: string, dateOfBirth: string) => void;
}

export function OnboardingModal({
  isOpen,
  initialEmail,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preferredName, setPreferredName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredName.trim()) {
      setError('Please provide a preferred name or callsign.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) {
      setError('Please provide your date of birth.');
      return;
    }
    setError(null);
    setStep(3);

    // After brief welcome flash, complete onboarding
    setTimeout(() => {
      onComplete(preferredName.trim(), dateOfBirth);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/80 backdrop-blur-sm font-mono text-stack-bone animate-fade-in">
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
                STEP 01 OF 02
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
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Date of Birth */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] text-stack-red-hover font-bold">
                STEP 02 OF 02
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
                onClick={() => setStep(1)}
                className="text-xs text-stack-steel hover:text-stack-bone underline"
              >
                Back
              </button>
              <Button type="submit" variant="primary" size="md">
                <span>Complete Setup</span>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Welcome Flash */}
        {step === 3 && (
          <div className="text-center py-6 space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full border border-stack-red-slate/60 bg-stack-red-muted/30 flex items-center justify-center mx-auto text-stack-bone">
              <Check className="w-6 h-6 text-stack-red-hover" />
            </div>
            <h3 className="text-base font-bold text-stack-bone">
              Welcome to STACK, {preferredName}.
            </h3>
            <p className="text-xs text-stack-steel">
              Launching your isolated local workspace…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
