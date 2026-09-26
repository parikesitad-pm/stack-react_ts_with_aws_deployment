import { ShieldAlert, RotateCcw, X } from 'lucide-react';
import { Button } from '~/components/atoms/Button';

interface RecoveryDraftBannerProps {
  isVisible: boolean;
  timeDiffSeconds: number;
  onRestore: () => void;
  onDiscard: () => void;
}

export function RecoveryDraftBanner({
  isVisible,
  timeDiffSeconds,
  onRestore,
  onDiscard,
}: RecoveryDraftBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-stack-red-muted/40 border-b border-stack-red-slate/60 font-mono text-xs text-stack-bone animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-stack-red-hover shrink-0" />
        <div>
          <span className="font-bold text-stack-bone">
            Unsaved recovery available
          </span>
          <span className="mx-2 text-stack-steel">·</span>
          <span className="text-stack-silver text-[11px]">
            Recovered {timeDiffSeconds} seconds of writing from local draft.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onRestore}>
          <RotateCcw className="w-3 h-3" />
          <span>Restore</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onDiscard}>
          <X className="w-3 h-3" />
          <span>Discard</span>
        </Button>
      </div>
    </div>
  );
}
