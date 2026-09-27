import { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import { DeviceLockService } from '../services/deviceLock.service';

interface DeviceLockOverlayProps {
  sub: string;
  onUnlocked: () => void;
  onForgotPin: () => void;
}

export function DeviceLockOverlay({
  sub,
  onUnlocked,
  onForgotPin,
}: DeviceLockOverlayProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('Enter your 6-digit PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      await DeviceLockService.verifyPin(sub, pin);
      onUnlocked();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect PIN.';
      setError(msg);
      setPin('');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg text-stack-bone font-mono"
    >
      <div className="w-full max-w-sm border border-stack-metal bg-stack-surface p-6 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full border border-stack-metal bg-stack-surface-raised flex items-center justify-center text-stack-red-slate">
            <Lock className="w-5 h-5" />
          </div>
          <h2
            id="lock-title"
            className="text-base font-bold tracking-tight text-stack-bone"
          >
            DEVICE LOCKED
          </h2>
          <p className="text-xs text-stack-steel leading-relaxed">
            Enter your 6-digit device PIN to unlock this session.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-2.5 bg-red-950/40 border border-red-800 text-xs text-red-300"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="device-pin-input" className="sr-only">
              6-Digit Device PIN
            </label>
            <input
              ref={inputRef}
              id="device-pin-input"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const numericOnly = e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6);
                setPin(numericOnly);
              }}
              placeholder="••••••"
              className="w-full text-center tracking-[0.6em] text-2xl font-mono bg-stack-bg border border-stack-metal px-3 py-2 text-stack-bone focus:outline-none focus:border-stack-steel focus:ring-1 focus:ring-stack-steel"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={pin.length !== 6 || isVerifying}
            className="w-full justify-center bg-stack-red-slate hover:bg-stack-red-hover text-white"
          >
            <span>{isVerifying ? 'Verifying…' : 'Unlock Session'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-2 border-t border-stack-metal/60 flex flex-col items-center gap-2 text-center text-xs">
          <button
            type="button"
            onClick={onForgotPin}
            className="text-stack-silver hover:text-stack-bone transition-colors underline underline-offset-4 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-steel"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Forgot PIN? Sign in again</span>
          </button>
          <span className="text-[10px] text-stack-steel">
            Device PIN locks this browser only. It does not encrypt your notes.
          </span>
        </div>
      </div>
    </div>
  );
}
