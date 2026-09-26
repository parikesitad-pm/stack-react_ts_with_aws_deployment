import { X, Laptop, Monitor, Download } from 'lucide-react';
import { Button } from '~/components/atoms/Button';

interface InstallInstructionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallInstructionsDialog({
  isOpen,
  onClose,
}: InstallInstructionsDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stack-bg/80 backdrop-blur-sm font-mono text-stack-bone animate-fade-in"
    >
      <div className="w-full max-w-lg border border-stack-metal bg-stack-surface p-6 rounded-lg shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-stack-metal/60 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-stack-red-hover" />
            <h3 className="font-bold text-sm text-stack-bone">
              Install STACK on Desktop
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stack-steel hover:text-stack-bone"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-stack-silver leading-relaxed">
          <p>
            STACK runs directly on your operating system without app store
            gatekeepers or background bloat. Choose your browser method below:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised space-y-1">
              <h4 className="font-bold text-stack-bone flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-stack-red-hover" />
                <span>Google Chrome & Brave (Windows / Linux / macOS)</span>
              </h4>
              <p className="text-[11px] text-stack-steel">
                Click the <strong>Install</strong> icon in the address bar
                (right side, next to the bookmark star) or open Menu (⋮) →{' '}
                <strong>Save and share</strong> → <strong>Install STACK</strong>.
              </p>
            </div>

            <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised space-y-1">
              <h4 className="font-bold text-stack-bone flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-stack-red-hover" />
                <span>Microsoft Edge (Windows & Linux)</span>
              </h4>
              <p className="text-[11px] text-stack-steel">
                Click the <strong>App available</strong> icon in the address bar
                or Menu (…) → <strong>Apps</strong> →{' '}
                <strong>Install STACK</strong>.
              </p>
            </div>

            <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised space-y-1">
              <h4 className="font-bold text-stack-bone flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-stack-silver" />
                <span>Safari (macOS Sonoma+)</span>
              </h4>
              <p className="text-[11px] text-stack-steel">
                Click <strong>File</strong> in menu bar →{' '}
                <strong>Add to Dock…</strong> to run STACK in its own standalone window.
              </p>
            </div>

            <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised space-y-1">
              <h4 className="font-bold text-stack-bone flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-stack-steel" />
                <span>Mozilla Firefox</span>
              </h4>
              <p className="text-[11px] text-stack-steel">
                Firefox desktop runs STACK with full offline IndexedDB caching. Bookmark this tab (Ctrl+D / Cmd+D) for immediate access anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-stack-metal/60">
          <Button variant="primary" size="md" onClick={onClose}>
            <span>Understood</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
