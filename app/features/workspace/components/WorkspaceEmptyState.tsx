import { Plus, Upload, Compass } from 'lucide-react';
import { Button } from '~/components/atoms/Button';

interface WorkspaceEmptyStateProps {
  preferredName: string;
  onCreateNote: () => void;
  onImportMarkdown: () => void;
  onStartTour: () => void;
}

export function WorkspaceEmptyState({
  preferredName,
  onCreateNote,
  onImportMarkdown,
  onStartTour,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none animate-fade-in font-mono">
      <div className="max-w-md space-y-6">
        {/* Subtle accent badge */}
        <div className="inline-flex items-center gap-2 rounded border border-stack-metal/80 bg-stack-surface px-3 py-1 text-[11px] text-stack-steel uppercase tracking-widest">
          <span>WORKSPACE ACTIVE</span>
          <span>·</span>
          <span className="text-stack-silver">LOCAL REPOSITORY</span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-stack-bone tracking-tight sm:text-2xl">
            Hi, {preferredName || 'Operator'}. Your stack is empty.
          </h2>
          <p className="text-xs text-stack-silver leading-relaxed max-w-sm mx-auto">
            Zero noise, zero tracking. Write Markdown notes committed directly
            to your local storage.
          </p>
        </div>

        {/* Primary actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onCreateNote}
            className="w-full sm:w-auto justify-center shadow-lg"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create your first note</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onImportMarkdown}
            className="w-full sm:w-auto justify-center"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Import Markdown</span>
          </Button>
        </div>

        {/* Quick tour prompt */}
        <div className="pt-4 border-t border-stack-metal/40">
          <button
            onClick={onStartTour}
            className="inline-flex items-center gap-1.5 text-xs text-stack-steel hover:text-stack-bone transition-colors underline decoration-stack-steel/50 underline-offset-4"
          >
            <Compass className="w-3.5 h-3.5 text-stack-red-hover" />
            <span>Need a quick tour?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
