import { Edit3, Columns, Eye } from 'lucide-react';

export type EditorMode = 'write' | 'split' | 'read';

export interface EditorModeSwitcherProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  className?: string;
}

const modes: Array<{ id: EditorMode; label: string; icon: typeof Edit3 }> = [
  { id: 'write', label: 'Write', icon: Edit3 },
  { id: 'split', label: 'Split', icon: Columns },
  { id: 'read', label: 'Read', icon: Eye },
];

export function EditorModeSwitcher({
  mode,
  onModeChange,
  className = '',
}: EditorModeSwitcherProps) {
  return (
    <div
      className={`inline-flex rounded border border-stack-metal/70 bg-stack-surface p-0.5 ${className}`}
      role="group"
      aria-label="Editor display mode"
    >
      {modes.map((item) => {
        const Icon = item.icon;
        const isActive = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange(item.id)}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-all ${
              isActive
                ? 'bg-stack-metal text-stack-bone font-medium shadow-sm'
                : 'text-stack-steel hover:text-stack-silver hover:bg-stack-surface-raised'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
