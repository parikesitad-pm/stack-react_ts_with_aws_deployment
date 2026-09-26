import { Minimize2 } from 'lucide-react';

interface ZenModeExitButtonProps {
  onExit: () => void;
}

export function ZenModeExitButton({ onExit }: ZenModeExitButtonProps) {
  return (
    <div className="fixed top-3 left-3 z-50 animate-fade-in font-mono select-none">
      <button
        onClick={onExit}
        title="Exit Zen Mode (Esc or Ctrl+\)"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-stack-metal/80 bg-stack-surface-raised/90 backdrop-blur-md text-xs text-stack-silver hover:text-stack-bone hover:border-stack-steel shadow-xl transition-all group"
      >
        <Minimize2 className="w-3.5 h-3.5 text-stack-red-hover group-hover:rotate-90 transition-transform" />
        <span className="text-[11px] font-bold">Exit Zen</span>
        <span className="text-[9px] text-stack-steel border border-stack-metal/60 rounded px-1 ml-0.5">
          Esc
        </span>
      </button>
    </div>
  );
}
