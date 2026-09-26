import {
  Menu,
  Pin,
  Trash2,
  Command,
  Tag,
  Paperclip,
  User,
  List,
  ArrowDownUp,
} from 'lucide-react';
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
  onToggleAttachments?: () => void;
  onToggleOutline?: () => void;
  isOutlineOpen?: boolean;
  onOpenImportExport?: () => void;
  onOpenProfile?: () => void;
  attachmentCount?: number;
  syncState: SyncState;
  wordCount: number;
  charCount: number;
  readingTimeMinutes?: number;
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
  onToggleAttachments,
  onToggleOutline,
  isOutlineOpen = false,
  onOpenImportExport,
  onOpenProfile,
  attachmentCount = 0,
  syncState,
  wordCount,
  charCount,
  readingTimeMinutes,
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
            {readingTimeMinutes !== undefined && readingTimeMinutes > 0 ? (
              <>
                <span>·</span>
                <span>{readingTimeMinutes} min read</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <EditorModeSwitcher mode={editorMode} onModeChange={onModeChange} />

        <div className="hidden sm:flex items-center gap-1 border-l border-stack-metal/60 pl-3">
          {onToggleOutline && (
            <button
              onClick={onToggleOutline}
              title={isOutlineOpen ? 'Close Outline' : 'Open Outline'}
              className={`rounded p-1.5 transition-colors ${
                isOutlineOpen
                  ? 'bg-stack-red-muted/40 text-stack-red-hover border border-stack-red-slate/40'
                  : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          )}

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
            onClick={onToggleAttachments}
            title="Note Attachments & Files"
            className="relative rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {attachmentCount && attachmentCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stack-red-slate text-[9px] font-bold text-stack-bone">
                {attachmentCount}
              </span>
            ) : null}
          </button>

          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              title="Import / Export Vault & Notes"
              className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
            </button>
          )}

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

          <button
            onClick={onOpenProfile}
            title="Operator Profile (/profile)"
            className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors ml-1 border-l border-stack-metal/60 pl-2"
          >
            <User className="h-3.5 w-3.5 text-stack-silver" />
          </button>
        </div>
      </div>
    </header>
  );
}
