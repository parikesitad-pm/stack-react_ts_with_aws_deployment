import { useState, useEffect } from 'react';
import { BrandLogo } from '~/components/atoms/BrandLogo';

export type StartupStage = 'boot' | 'storage' | 'engine' | 'indexing' | 'ready';

interface StartupLoaderProps {
  onReady?: () => void;
  minDurationMs?: number;
  slowThresholdMs?: number;
}

export function StartupLoader({
  onReady,
  minDurationMs = 650,
  slowThresholdMs = 4000,
}: StartupLoaderProps) {
  const [stage, setStage] = useState<StartupStage>('boot');
  const [isSlow, setIsSlow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    // Stage progression
    const t1 = setTimeout(() => setStage('storage'), 150);
    const t2 = setTimeout(() => setStage('engine'), 350);
    const t3 = setTimeout(() => setStage('indexing'), 520);
    const tReady = setTimeout(() => setStage('ready'), minDurationMs);

    // Timeout indicator for slow connections
    const tSlow = setTimeout(() => {
      setIsSlow(true);
    }, slowThresholdMs);

    // Complete loader after minDuration
    const tComplete = setTimeout(() => {
      setIsFadingOut(true);
      const tEnd = setTimeout(() => {
        onReady?.();
      }, 250);
      return () => clearTimeout(tEnd);
    }, minDurationMs + 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tReady);
      clearTimeout(tSlow);
      clearTimeout(tComplete);
    };
  }, [minDurationMs, slowThresholdMs, onReady]);

  const getSubStageCopy = (currentStage: StartupStage) => {
    switch (currentStage) {
      case 'boot':
      case 'storage':
        return 'Restoring your notes…';
      case 'engine':
        return 'Starting Markdown engine…';
      case 'indexing':
        return 'Indexing your stack…';
      case 'ready':
        return 'Workspace ready.';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-stack-bg font-mono transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Brand Logo with subtle pulse ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-2 rounded-2xl bg-stack-red-muted/20 blur-sm animate-pulse" />
          <div className="relative border border-stack-metal/90 rounded-xl bg-stack-surface p-2 shadow-2xl">
            <BrandLogo size="xl" />
          </div>
        </div>

        {/* Brand Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs text-stack-steel uppercase tracking-widest">
            <span className="font-bold text-stack-bone">STACK</span>
            <span>·</span>
            <span>A Modula Project</span>
          </div>

          <h2 className="text-lg font-bold tracking-tight text-stack-bone">
            {isSlow
              ? 'Still preparing your workspace…'
              : 'Preparing your workspace'}
          </h2>
        </div>

        {/* Linear progress track */}
        <div className="w-48 h-1 bg-stack-surface rounded-full overflow-hidden border border-stack-metal/60">
          <div
            className="h-full bg-stack-red-slate transition-all duration-300 ease-out"
            style={{
              width:
                stage === 'boot'
                  ? '15%'
                  : stage === 'storage'
                    ? '40%'
                    : stage === 'engine'
                      ? '70%'
                      : stage === 'indexing'
                        ? '90%'
                        : '100%',
            }}
          />
        </div>

        {/* Stage copy / Slow network reassurance */}
        <div className="space-y-1">
          <p className="text-xs text-stack-silver transition-all duration-200">
            {getSubStageCopy(stage)}
          </p>
          {isSlow && (
            <p className="text-[11px] text-stack-steel animate-fade-in">
              Local notes remain available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
