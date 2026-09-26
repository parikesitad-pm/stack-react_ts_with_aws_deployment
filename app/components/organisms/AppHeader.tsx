import { Menu, Pin, Trash2, Command, Tag } from 'lucide-react';
import {
  EditorModeSwitcher,
  type EditorMode,
} from '~/components/molecules/EditorModeSwitcher';
import {
  StatusIndicator,
  type SyncState,
} from '~/components/atoms/StatusIndicator';

export interface AppHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  tags: string[];
  isPinned: boolean;
  onTogglePin: () => void;
  onDeleteNote: () => void;
  editorMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onToggleMobileSidebar: () => void;
  onOpenCommandPalette: () => void;
  syncState: SyncState;
  wordCount: number;
  charCount: number;
}

export function AppHeader({
  title,
  onTitleChange,
  tags,
  isPinned,
  onTogglePin,
  onDeleteNote,
  editorMode,
  onModeChange,
  onToggleMobileSidebar,
  onOpenCommandPalette,
  syncState,
  wordCount,
  charCount,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-stack-metal/80 bg-stack-surface-raised px-4 select-none">
      {/* Left Title and Mobile Toggle */}
      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex flex-col overflow-hidden max-w-lg">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="w-full bg-transparent font-mono text-sm font-bold text-stack-bone placeholder:text-stack-steel focus:outline-none truncate"
          />
          <div className="flex items-center gap-2 font-mono text-[10px] text-stack-steel">
            <StatusIndicator status={syncState} />
            <span>·</span>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <EditorModeSwitcher mode={editorMode} onModeChange={onModeChange} />

        <div className="hidden sm:flex items-center gap-1 border-l border-stack-metal/60 pl-3">
          <button
            onClick={onTogglePin}
            title={isPinned ? 'Unpin document' : 'Pin document'}
            className={`rounded p-1.5 transition-colors ${
              isPinned
                ? 'bg-stack-red-muted/40 text-stack-red-hover border border-stack-red-slate/40'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
            }`}
          >
            <Pin className="h-3.5 w-3.5 rotate-45" />
          </button>

          <button
            onClick={onDeleteNote}
            title="Delete document"
            className="rounded p-1.5 text-stack-steel hover:text-stack-red-hover hover:bg-stack-metal transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onOpenCommandPalette}
            title="Command Palette (Ctrl+K)"
            className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <Command className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
