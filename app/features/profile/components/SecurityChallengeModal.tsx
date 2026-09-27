import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import {
  SecurityChallengeService,
  type ChallengePurpose,
} from '../services/securityChallenge.service';

interface SecurityChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  purpose: ChallengePurpose;
  title?: string;
  description?: string;
  token: string;
  onVerified: (challengeId: string, code: string) => Promise<void>;
}

export function SecurityChallengeModal({
  isOpen,
  onClose,
  purpose,
  title = 'Email Verification Code Required',
  description,
  token,
  onVerified,
}: SecurityChallengeModalProps) {
  const [challengeId, setChallengeId] = useState<string>('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const inputRef = useRef<HTMLInputElement>(null);

  // Request challenge when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && token) {
      setIsRequesting(true);
      setError(null);
      setCode('');
      SecurityChallengeService.requestChallenge(purpose, token)
        .then((res) => {
          if (!isMounted) return;
          setChallengeId(res.challengeId);
          if (res.devCode) {
            setDevCode(res.devCode);
          }
          setRemainingSeconds(600);
          setTimeout(() => inputRef.current?.focus(), 50);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || 'Failed to request security challenge.');
        })
        .finally(() => {
          if (isMounted) setIsRequesting(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, purpose, token]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, remainingSeconds]);

  // Keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    if (!challengeId) {
      setError('Challenge session not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onVerified(challengeId, code.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed.';
      if (msg === 'INVALID_CHALLENGE_CODE') {
        setError('Incorrect verification code. Please check your email.');
      } else if (msg === 'CHALLENGE_MAX_ATTEMPTS_EXCEEDED') {
        setError('Maximum attempts exceeded. This challenge is now invalid.');
      } else if (msg === 'CHALLENGE_EXPIRED') {
        setError('Verification code expired. Please request a new one.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/85 backdrop-blur-sm"
    >
      <div className="w-full max-w-md border border-stack-metal bg-stack-surface p-6 shadow-2xl font-mono text-stack-bone relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-stack-steel hover:text-stack-bone transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 text-stack-red-hover mb-3">
          <ShieldAlert className="w-5 h-5" />
          <h3
            id="challenge-dialog-title"
            className="font-semibold text-sm tracking-tight text-stack-bone"
          >
            {title}
          </h3>
        </div>

        <p className="text-xs text-stack-silver mb-4 leading-relaxed">
          {description ||
            'Enter the 6-digit security code sent to your registered email address to authorize this sensitive action.'}
        </p>

        {devCode && (
          <div className="mb-4 p-2.5 bg-stack-bg border border-stack-metal text-[11px] text-stack-steel">
            <span className="text-stack-bone font-bold">[Dev Mode Code]:</span>{' '}
            <span className="text-amber-400 font-mono tracking-widest text-xs">
              {devCode}
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 p-2.5 bg-red-950/40 border border-red-800 text-xs text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center text-[11px] text-stack-steel mb-1.5">
              <label
                htmlFor="challenge-code-input"
                className="uppercase tracking-wider"
              >
                6-Digit Security Code
              </label>
              <span
                className={
                  remainingSeconds < 60
                    ? 'text-stack-red-hover'
                    : 'text-stack-steel'
                }
              >
                Expires in {timeFormatted}
              </span>
            </div>

            <input
              ref={inputRef}
              id="challenge-code-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              disabled={isRequesting || isLoading}
              value={code}
              onChange={(e) => {
                const numericOnly = e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6);
                setCode(numericOnly);
              }}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-lg font-mono bg-stack-bg border border-stack-metal px-3 py-2 text-stack-bone focus:outline-none focus:border-stack-steel focus:ring-1 focus:ring-stack-steel"
              autoComplete="one-time-code"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={code.length !== 6 || isLoading || isRequesting}
              className="bg-stack-red-slate hover:bg-stack-red-hover text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Verifying…
                </>
              ) : (
                <>
                  Confirm
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
