import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Pin,
  FileText,
  Search,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sliders,
  Download,
  UploadCloud,
} from 'lucide-react';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Button } from '~/components/atoms/Button';
import {
  StatusIndicator,
  type SyncState,
} from '~/components/atoms/StatusIndicator';
import { SearchBar } from '~/components/molecules/SearchBar';
import { NoteListItem } from '~/features/notes/components/NoteListItem';
import { FolderTree } from '~/features/notes/components/FolderTree';
import type {
  Note,
  Folder,
  NoteFilter,
} from '~/features/notes/types/note.types';
import type { AuthUser } from '~/features/auth/types/auth.types';
import { useCurrentUserProfile } from '~/features/profile/hooks/useCurrentUserProfile';

export type SidebarLayoutMode = 'expanded' | 'compact' | 'zen';

export interface AppSidebarProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenImportExport?: () => void;
  onOpenCommandPalette: () => void;
  syncState: SyncState;
  activeFilter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  layoutMode: SidebarLayoutMode;
  onLayoutModeChange: (mode: SidebarLayoutMode) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
  onReorderNote: (sourceNoteId: string, targetNoteId: string) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  user?: AuthUser | null;
  onSignOut?: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  className?: string;
}

const DEFAULT_WIDTH = 300;
const MIN_WIDTH = 240;
const MAX_WIDTH = 480;

export function AppSidebar({
  notes,
  folders,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onOpenSettings,
  onOpenProfile,
  onOpenImportExport,
  onOpenCommandPalette,
  syncState,
  activeFilter,
  onFilterChange,
  layoutMode,
  onLayoutModeChange,
  onMoveNoteToFolder,
  onReorderNote,
  onMoveFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  user,
  onSignOut,
  onInstallPwa,
  canInstallPwa,
  className = '',
}: AppSidebarProps) {
  // Width state with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = localStorage.getItem('stack_sidebar_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const {
    displayName: canonicalDisplayName,
    username: canonicalUsername,
    avatarUrl: canonicalAvatarUrl,
    initials: canonicalInitials,
  } = useCurrentUserProfile();

  const effectiveDisplayName =
    canonicalDisplayName || user?.preferredName || 'Operator';
  const effectiveUsername =
    canonicalUsername ||
    user?.username ||
    (user?.email ? user.email.split('@')[0] : 'user');
  const effectiveAvatarUrl = canonicalAvatarUrl || user?.picture;
  const effectiveInitials =
    canonicalInitials ||
    (user?.preferredName || user?.email || 'U')[0]?.toUpperCase() ||
    'U';

  // Close account menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setShowAccountMenu(false);
      }
    };
    if (showAccountMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () =>
        document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showAccountMenu]);

  // Pointer event resize handling
  const startResizing = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setSidebarWidth(newWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      localStorage.setItem('stack_sidebar_width', sidebarWidth.toString());
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, sidebarWidth]);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (activeFilter === 'pinned') return n.isPinned;
    if (activeFilter === 'all') return true;
    return n.tags.includes(activeFilter);
  });

  // If in zen mode, sidebar is hidden
  if (layoutMode === 'zen') {
    return null;
  }

  // Compact Rail Mode (~56px)
  if (layoutMode === 'compact') {
    return (
      <aside
        className={`flex h-full w-14 flex-col items-center justify-between border-r border-stack-metal/80 bg-stack-surface py-3 select-none z-20 ${className}`}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <BrandLogo size="sm" showWordmark={false} />

          <button
            onClick={() => onLayoutModeChange('expanded')}
            title="Expand Sidebar"
            className="p-1.5 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="w-8 h-px bg-stack-metal/60 my-1" />

          <button
            onClick={onCreateNote}
            title="New Note"
            className="p-2 rounded bg-stack-metal hover:bg-stack-steel/20 text-stack-bone transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenCommandPalette}
            title="Search (Ctrl+K)"
            className="p-2 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={() => onFilterChange('pinned')}
            title="Pinned Notes"
            className={`p-2 rounded transition-colors ${
              activeFilter === 'pinned'
                ? 'bg-stack-metal text-stack-bone'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
            }`}
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => onLayoutModeChange('zen')}
            title="Zen Mode (Fullscreen)"
            className="p-2 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenProfile}
            title="Profile"
            className="w-8 h-8 rounded-full bg-stack-metal flex items-center justify-center text-stack-bone font-mono text-xs border border-stack-steel/30 hover:border-stack-silver transition-colors"
          >
            {(user?.preferredName || user?.email || 'U')[0]?.toUpperCase() ||
              'U'}
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Mode with Pointer Resizer
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className={`relative flex h-full flex-col border-r border-stack-metal/80 bg-stack-surface select-none shrink-0 z-20 ${className}`}
    >
      {/* Top Header with Brand & Mode Controls */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-stack-metal/70 bg-stack-surface-raised shrink-0">
        <BrandLogo size="sm" showWordmark={true} />

        <div className="flex items-center gap-1">
          <button
            onClick={() => onLayoutModeChange('compact')}
            title="Collapse Sidebar"
            className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onLayoutModeChange('zen')}
            title="Enter Zen Mode (Esc to exit)"
            className="rounded p-1.5 text-stack-steel hover:text-stack-bone hover:bg-stack-metal transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary Actions & Search */}
      <div className="p-3 space-y-2 border-b border-stack-metal/40 shrink-0">
        <Button
          variant="primary"
          size="md"
          onClick={onCreateNote}
          className="w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </Button>
        <SearchBar onOpenPalette={onOpenCommandPalette} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-stack-metal/40 overflow-x-auto text-[11px] font-mono shrink-0">
        <button
          onClick={() => onFilterChange('all')}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeFilter === 'all'
              ? 'bg-stack-metal text-stack-bone font-medium'
              : 'text-stack-steel hover:text-stack-silver'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>All ({notes.length})</span>
        </button>
        <button
          onClick={() => onFilterChange('pinned')}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            activeFilter === 'pinned'
              ? 'bg-stack-metal text-stack-bone font-medium'
              : 'text-stack-steel hover:text-stack-silver'
          }`}
        >
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </button>
      </div>

      {/* Scrollable Middle: Folders Tree + Notes List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
        {/* Folders Section */}
        <FolderTree
          folders={folders}
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={onSelectNote}
          onMoveNoteToFolder={onMoveNoteToFolder}
          onMoveFolder={onMoveFolder}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />

        {/* Unfiled / All Notes Section */}
        <div className="pt-2 border-t border-stack-metal/30">
          <div className="px-1 pb-1 text-[11px] font-mono tracking-wider text-stack-steel uppercase">
            {activeFilter === 'pinned' ? 'Pinned Notes' : 'Notes'}
          </div>
          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={{
                  id: note.id,
                  title: note.title,
                  excerpt: note.content.slice(0, 100).replace(/[#*`_]/g, ''),
                  updatedAt: note.updatedAt,
                  tags: note.tags,
                  isPinned: note.isPinned,
                  folderId: note.folderId,
                }}
                isActive={note.id === activeNoteId}
                onSelect={onSelectNote}
                onReorderNote={onReorderNote}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Identity Card with Account Menu */}
      <div
        ref={accountMenuRef}
        className="relative border-t border-stack-metal/60 bg-stack-surface font-mono shrink-0"
      >
        {showAccountMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 rounded-lg bg-stack-surface-raised border border-stack-metal/80 shadow-2xl py-1 text-xs z-30 animate-in fade-in slide-in-from-bottom-2">
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  onOpenProfile();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Profile (/profile)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowAccountMenu(false);
                onOpenSettings();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Preferences</span>
            </button>
            {onOpenImportExport && (
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  onOpenImportExport();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone transition-colors"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Import / Export</span>
              </button>
            )}
            {canInstallPwa && onInstallPwa && (
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  onInstallPwa();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install STACK</span>
              </button>
            )}
            <div className="my-1 border-t border-stack-metal/40" />
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  onSignOut();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-red-400 hover:bg-stack-metal transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}

        {/* User Card Trigger */}
        <div
          onClick={() => setShowAccountMenu((prev) => !prev)}
          className="flex items-center justify-between px-3 py-2.5 hover:bg-stack-metal/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-stack-metal flex items-center justify-center text-stack-bone font-mono text-xs border border-stack-steel/30 shrink-0 overflow-hidden">
              {effectiveAvatarUrl ? (
                <img
                  src={effectiveAvatarUrl}
                  alt={effectiveDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                effectiveInitials
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-stack-bone truncate group-hover:text-stack-silver">
                {effectiveDisplayName}
              </span>
              <span className="text-[10px] text-stack-steel truncate">
                @{effectiveUsername}
              </span>
            </div>
          </div>
          <ChevronRight
            className={`h-3.5 w-3.5 text-stack-steel transition-transform ${
              showAccountMenu ? '-rotate-90' : ''
            }`}
          />
        </div>
      </div>

      {/* Bottom Status / Local Engine Bar */}
      <div className="flex h-8 items-center justify-between px-3 border-t border-stack-metal/70 bg-stack-surface-raised font-mono text-[10px] shrink-0">
        <StatusIndicator status={syncState} />
        <span className="text-stack-steel/80">
          stack:user:{user?.sub ? user.sub.slice(0, 8) : 'isolated'}
        </span>
      </div>

      {/* Draggable Resizer Handle on right border */}
      <div
        onPointerDown={startResizing}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-stack-silver/50 transition-colors z-30 ${
          isResizing ? 'bg-stack-silver' : 'bg-transparent'
        }`}
      />
    </aside>
  );
}
