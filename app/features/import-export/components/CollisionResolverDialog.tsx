import { AlertTriangle, Check, Copy, SkipForward } from 'lucide-react';
import { Button } from '~/components/atoms/Button';
import type { ImportCandidate } from '../services/importEngine.service';
import type { Note } from '~/features/notes/types/note.types';

interface CollisionResolverDialogProps {
  isOpen: boolean;
  collisions: { candidate: ImportCandidate; existing: Note }[];
  onResolve: (
    resolutions: {
      candidate: ImportCandidate;
      action: 'rename' | 'overwrite' | 'skip';
    }[]
  ) => void;
  onCancel: () => void;
}

export function CollisionResolverDialog({
  isOpen,
  collisions,
  onResolve,
  onCancel,
}: CollisionResolverDialogProps) {
  if (!isOpen || collisions.length === 0) return null;

  const handleResolveAll = (action: 'rename' | 'overwrite' | 'skip') => {
    onResolve(collisions.map((c) => ({ candidate: c.candidate, action })));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/85 backdrop-blur-sm font-mono text-stack-bone animate-fade-in"
    >
      <div className="w-full max-w-lg border border-stack-metal bg-stack-surface p-6 rounded-lg shadow-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-stack-metal/60 pb-3">
          <div className="p-2 rounded bg-stack-red-muted/30 border border-stack-red-slate/40 text-stack-red-hover">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stack-bone">
              Filename Collision Detected
            </h3>
            <p className="text-[11px] text-stack-steel">
              {collisions.length} imported note(s) share titles with existing
              documents.
            </p>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded bg-stack-bg border border-stack-metal/60 text-xs">
          {collisions.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded border border-stack-metal/40 bg-stack-surface-raised"
            >
              <span className="font-bold text-stack-bone truncate">
                {c.candidate.title}
              </span>
              <span className="text-[10px] text-stack-steel">
                Existing: {c.existing.updatedAt}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-stack-silver leading-relaxed">
          STACK will never silently overwrite your documents. Choose how to
          handle duplicate notes:
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleResolveAll('rename')}
            className="flex-1 justify-center"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Keep Both (Rename)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResolveAll('skip')}
            className="flex-1 justify-center"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip Duplicates</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResolveAll('overwrite')}
            className="flex-1 justify-center text-stack-red-hover hover:border-stack-red-hover"
          >
            <span>Overwrite</span>
          </Button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onCancel}
            className="text-xs text-stack-steel hover:text-stack-bone underline"
          >
            Cancel Import
          </button>
        </div>
      </div>
    </div>
  );
}
