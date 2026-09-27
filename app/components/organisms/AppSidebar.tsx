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
  Archive,
  Trash2,
} from 'lucide-react';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Button } from '~/components/atoms/Button';
import {
  StatusIndicator,
  type SyncState,
} from '~/components/atoms/StatusIndicator';
import { SearchBar } from '~/components/molecules/SearchBar';
import { NoteListItem, type NoteItemData } from '~/features/notes/components/NoteListItem';
import { FolderTree } from '~/features/notes/components/FolderTree';
import { TagList } from '~/features/tags/components/TagList';
import {
  SafeDeleteFolderModal,
} from '~/features/notes/components/SafeDeleteFolderModal';
import {
  MoveItemModal,
  type MoveItemTarget,
} from '~/features/notes/components/MoveItemModal';
import type {
  Note,
  Folder,
  NoteFilter,
} from '~/features/notes/types/note.types';
import type { AuthUser } from '~/features/auth/types/auth.types';
import { useCurrentUserProfile } from '~/features/profile/hooks/useCurrentUserProfile';
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';
import { noteOrganizationService } from '~/features/notes/services/noteOrganization.service';
import { tagService } from '~/features/tags/services/tag.service';

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
  onReorderNote: (
    sourceNoteId: string,
    targetNoteId: string,
    edge: 'before' | 'after'
  ) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onReorderFolder?: (
    sourceFolderId: string,
    targetFolderId: string,
    edge: 'before' | 'after'
  ) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onSafeDeleteFolder: (
    folderId: string,
    destinationFolderId: string | null
  ) => void;
  onTogglePin?: (noteId: string) => void;
  onArchiveNote?: (noteId: string) => void;
  onUnarchiveNote?: (noteId: string) => void;
  onTrashNote?: (noteId: string) => void;
  onRestoreNote?: (noteId: string) => void;
  onPermanentDeleteNote?: (noteId: string) => void;
  onEmptyTrash?: () => void;
  user?: AuthUser | null;
  onSignOut?: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  className?: string;
}

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

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
  onReorderFolder,
  onCreateFolder,
  onRenameFolder,
  onSafeDeleteFolder,
  onTogglePin,
  onArchiveNote,
  onUnarchiveNote,
  onTrashNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onEmptyTrash,
  user,
  onSignOut,
  onInstallPwa,
  canInstallPwa,
  className = '',
}: AppSidebarProps) {
  // Scoped layout settings
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (!user?.sub) return DEFAULT_WIDTH;
    const settings = userWorkspaceStorage.getLayoutSettings(user.sub);
    return settings.sidebarWidth;
  });

  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(() => {
    if (!user?.sub) return [];
    const settings = userWorkspaceStorage.getLayoutSettings(user.sub);
    return settings.expandedFolderIds;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [safeDeleteFolderTarget, setSafeDeleteFolderTarget] = useState<Folder | null>(null);
  const [moveModalTarget, setMoveModalTarget] = useState<MoveItemTarget | null>(null);

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

  // Toggle folder expansion and persist to user layout
  const handleToggleExpandFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId];
      if (user?.sub) {
        userWorkspaceStorage.saveLayoutSettings(user.sub, {
          expandedFolderIds: next,
        });
      }
      return next;
    });
  };

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
      if (user?.sub) {
        userWorkspaceStorage.saveLayoutSettings(user.sub, {
          sidebarWidth,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, sidebarWidth, user?.sub]);

  // Counts and tags
  const activeNotes = noteOrganizationService.getActiveNotes(notes);
  const pinnedNotes = noteOrganizationService.getPinnedNotes(notes);
  const archivedNotes = noteOrganizationService.getArchivedNotes(notes);
  const trashedNotes = noteOrganizationService.getTrashedNotes(notes);
  const activeTags = tagService.extractActiveTags(notes);

  // Filter notes according to activeFilter
  let displayNotes: Note[] = [];
  if (activeFilter === 'all') {
    // Show active unfiled notes in the notes section (folders show their own)
    displayNotes = activeNotes.filter((n) => !n.folderId);
  } else if (activeFilter === 'pinned') {
    displayNotes = pinnedNotes;
  } else if (activeFilter === 'archive') {
    displayNotes = archivedNotes;
  } else if (activeFilter === 'trash') {
    displayNotes = trashedNotes;
  } else {
    // Tag filter
    displayNotes = noteOrganizationService.getNotesByTag(notes, activeFilter);
  }

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
            onClick={() => onFilterChange('all')}
            title="All Notes"
            className={`p-2 rounded transition-colors ${
              activeFilter === 'all'
                ? 'bg-stack-metal text-stack-bone'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
            }`}
          >
            <FileText className="h-4 w-4" />
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

          <button
            onClick={() => onFilterChange('archive')}
            title="Archive"
            className={`p-2 rounded transition-colors ${
              activeFilter === 'archive'
                ? 'bg-stack-metal text-stack-bone'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
            }`}
          >
            <Archive className="h-4 w-4" />
          </button>

          <button
            onClick={() => onFilterChange('trash')}
            title="Trash"
            className={`p-2 rounded transition-colors ${
              activeFilter === 'trash'
                ? 'bg-stack-metal text-stack-bone'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal'
            }`}
          >
            <Trash2 className="h-4 w-4" />
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
            {effectiveInitials}
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Mode with Pointer Resizer
  return (
    <>
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
              title="Enter Zen Mode (Esc or Ctrl+\ to exit)"
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

        {/* Filter Navigation Roster */}
        <div className="px-2 py-1.5 border-b border-stack-metal/40 space-y-0.5 text-xs font-mono shrink-0">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`flex items-center justify-between w-full px-2 py-1 rounded transition-colors ${
              activeFilter === 'all'
                ? 'bg-stack-metal text-stack-bone font-medium'
                : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-stack-steel" />
              <span>All Notes</span>
            </span>
            <span className="text-[10px] text-stack-steel font-mono">
              {activeNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('pinned')}
            className={`flex items-center justify-between w-full px-2 py-1 rounded transition-colors ${
              activeFilter === 'pinned'
                ? 'bg-stack-metal text-stack-bone font-medium'
                : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-stack-red-hover" />
              <span>Pinned</span>
            </span>
            <span className="text-[10px] text-stack-steel font-mono">
              {pinnedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('archive')}
            className={`flex items-center justify-between w-full px-2 py-1 rounded transition-colors ${
              activeFilter === 'archive'
                ? 'bg-stack-metal text-stack-bone font-medium'
                : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5 text-stack-steel" />
              <span>Archive</span>
            </span>
            <span className="text-[10px] text-stack-steel font-mono">
              {archivedNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('trash')}
            className={`flex items-center justify-between w-full px-2 py-1 rounded transition-colors ${
              activeFilter === 'trash'
                ? 'bg-stack-metal text-stack-bone font-medium'
                : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span>Trash</span>
            </span>
            <span className="text-[10px] text-stack-steel font-mono">
              {trashedNotes.length}
            </span>
          </button>
        </div>

        {/* Scrollable Middle: Folders + Tags + Notes List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
          {/* Folders Section (Only visible in All Notes view) */}
          {activeFilter === 'all' && (
            <FolderTree
              folders={folders}
              notes={notes}
              activeNoteId={activeNoteId}
              expandedFolderIds={expandedFolderIds}
              onToggleExpand={handleToggleExpandFolder}
              onSelectNote={onSelectNote}
              onMoveNoteToFolder={onMoveNoteToFolder}
              onMoveFolder={onMoveFolder}
              onReorderFolder={onReorderFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={(folder) => setSafeDeleteFolderTarget(folder)}
              onMoveFolderModal={(folder) =>
                setMoveModalTarget({
                  type: 'folder',
                  id: folder.id,
                  name: folder.name,
                  currentFolderId: folder.parentId,
                })
              }
            />
          )}

          {/* Tags Section */}
          <TagList
            tags={activeTags}
            activeFilter={activeFilter}
            onSelectTag={(tag) => onFilterChange(tag)}
          />

          {/* Notes Roster Section */}
          <div className="pt-2 border-t border-stack-metal/30">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-mono tracking-wider text-stack-steel uppercase">
              <span>
                {activeFilter === 'pinned'
                  ? 'Pinned Notes'
                  : activeFilter === 'archive'
                    ? 'Archived Notes'
                    : activeFilter === 'trash'
                      ? 'Trash'
                      : activeFilter === 'all'
                        ? 'Unfiled Notes'
                        : `#${activeFilter}`}
              </span>

              {activeFilter === 'trash' && trashedNotes.length > 0 && onEmptyTrash && (
                <button
                  type="button"
                  onClick={onEmptyTrash}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase"
                >
                  Empty Trash
                </button>
              )}
            </div>

            <div className="space-y-1">
              {displayNotes.length === 0 ? (
                <div className="p-3 text-center text-xs font-mono text-stack-steel/70">
                  {activeFilter === 'trash'
                    ? 'Trash is empty'
                    : activeFilter === 'archive'
                      ? 'Archive is empty'
                      : 'No notes found'}
                </div>
              ) : (
                displayNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={{
                      id: note.id,
                      title: note.title,
                      excerpt: note.content.slice(0, 100).replace(/[#*`_]/g, ''),
                      updatedAt: note.updatedAt,
                      tags: note.tags || [],
                      isPinned: note.isPinned,
                      folderId: note.folderId,
                      archivedAt: note.archivedAt,
                      deletedAt: note.deletedAt,
                    }}
                    isActive={note.id === activeNoteId}
                    onSelect={onSelectNote}
                    onReorderNote={onReorderNote}
                    onMoveTo={(item) =>
                      setMoveModalTarget({
                        type: 'note',
                        id: item.id,
                        name: item.title,
                        currentFolderId: item.folderId ?? null,
                      })
                    }
                    onTogglePin={onTogglePin}
                    onArchive={onArchiveNote}
                    onUnarchive={onUnarchiveNote}
                    onTrash={onTrashNote}
                    onRestore={onRestoreNote}
                    onPermanentDelete={onPermanentDeleteNote}
                    isArchivedView={activeFilter === 'archive'}
                    isTrashView={activeFilter === 'trash'}
                  />
                ))
              )}
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

      {/* Modals rendered inside portal/context */}
      <SafeDeleteFolderModal
        isOpen={Boolean(safeDeleteFolderTarget)}
        folder={safeDeleteFolderTarget}
        allFolders={folders}
        notes={notes}
        onConfirm={(destinationFolderId) => {
          if (safeDeleteFolderTarget) {
            onSafeDeleteFolder(safeDeleteFolderTarget.id, destinationFolderId);
            setSafeDeleteFolderTarget(null);
          }
        }}
        onCancel={() => setSafeDeleteFolderTarget(null)}
      />

      <MoveItemModal
        isOpen={Boolean(moveModalTarget)}
        target={moveModalTarget}
        allFolders={folders}
        onConfirm={(destFolderId) => {
          if (moveModalTarget) {
            if (moveModalTarget.type === 'note') {
              onMoveNoteToFolder(moveModalTarget.id, destFolderId);
            } else {
              onMoveFolder(moveModalTarget.id, destFolderId);
            }
            setMoveModalTarget(null);
          }
        }}
        onCancel={() => setMoveModalTarget(null)}
      />
    </>
  );
}
