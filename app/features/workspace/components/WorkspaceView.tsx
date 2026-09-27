import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { Archive, Trash2, RotateCcw } from 'lucide-react';
import type {
  Note,
  Folder,
  NoteFilter,
} from '~/features/notes/types/note.types';
import { folderTreeService } from '~/features/notes/services/folderTree.service';
import { workspaceMoveService } from '~/features/workspace/services/workspaceMove.service';
import { workspaceOrderService } from '~/features/workspace/services/workspaceOrder.service';
import { noteOrganizationService } from '~/features/notes/services/noteOrganization.service';
import { tagService } from '~/features/tags/services/tag.service';
import type { SyncState } from '~/components/atoms/StatusIndicator';
import type { EditorMode } from '~/components/molecules/EditorModeSwitcher';
import {
  AppSidebar,
  type SidebarLayoutMode,
} from '~/components/organisms/AppSidebar';
import { AppHeader } from '~/components/organisms/AppHeader';
import { NoteTagEditor } from '~/features/tags/components/NoteTagEditor';
import { MarkdownPreview } from '~/features/editor/components/MarkdownPreview';
import { CommandPaletteModal } from '~/features/search/components/CommandPaletteModal';
import { SettingsModal } from '~/features/settings/components/SettingsModal';
import { ProfileModal } from '~/features/profile/components/ProfileModal';
import { AttachmentDrawer } from '~/features/attachments/components/AttachmentDrawer';
import { attachmentService } from '~/features/attachments/services/attachment.service';
import { attachmentRepository } from '~/features/attachments/services/attachment.repository';
import type { Attachment } from '~/features/attachments/types/attachment.types';
import { DocumentOutline } from '~/features/editor/components/DocumentOutline';
import { RecoveryDraftBanner } from '~/features/editor/components/RecoveryDraftBanner';
import { ImportExportModal } from '~/features/import-export/components/ImportExportModal';
import { WorkspaceEmptyState } from '~/features/workspace/components/WorkspaceEmptyState';
import { CoachMarkTour } from '~/features/workspace/components/CoachMarkTour';
import { ZenModeExitButton } from '~/features/workspace/components/ZenModeExitButton';
import { usePwaInstall } from '~/features/pwa/hooks/usePwaInstall';
import { InstallInstructionsDialog } from '~/features/pwa/components/InstallInstructionsDialog';
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';
import type { ExtendedAuthUser } from '~/features/auth/hooks/useAuthSession';

const CodeMirrorEditor = lazy(() =>
  import('~/features/editor/components/CodeMirrorEditor').then((m) => ({
    default: m.CodeMirrorEditor,
  }))
);

export interface WorkspaceViewProps {
  user: ExtendedAuthUser;
  token?: string | null;
  onSignOut: () => void;
}

export function WorkspaceView({ user, onSignOut }: WorkspaceViewProps) {
  const {
    isInstallable,
    triggerInstall,
    isDialogOpen: isInstallDialogOpen,
    setIsDialogOpen: setIsInstallDialogOpen,
  } = usePwaInstall();

  // Strict user-scoped storage initialization: zero seeded demo notes!
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('stack_active_note_id') || '';
  });

  const [editorMode, setEditorMode] = useState<EditorMode>('split');
  const [layoutMode, setLayoutMode] = useState<SidebarLayoutMode>(() => {
    if (typeof window === 'undefined') return 'expanded';
    return userWorkspaceStorage.getLayoutSettings(user.sub).sidebarMode;
  });

  const [syncState, setSyncState] = useState<SyncState>('saved_locally');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const [recoveryDraft, setRecoveryDraft] = useState<{
    content: string;
    timeDiffSeconds: number;
  } | null>(null);

  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>(
    {}
  );

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user-scoped notes, folders, and layout settings from isolated storage
  useEffect(() => {
    // Purge legacy global un-scoped items from localStorage so they never leak
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stack_notes');
      localStorage.removeItem('stack_folders');
      localStorage.removeItem('stack_sidebar_layout_mode');
    }

    let isMounted = true;
    Promise.all([
      userWorkspaceStorage.getNotes(user.sub),
      userWorkspaceStorage.getFolders(user.sub),
    ]).then(([savedNotes, savedFolders]) => {
      if (isMounted) {
        setNotes(savedNotes || []);
        setFolders(savedFolders || []);
        setIsDataLoaded(true);

        const settings = userWorkspaceStorage.getLayoutSettings(user.sub);
        setLayoutMode(settings.sidebarMode);

        if (savedNotes && savedNotes.length > 0) {
          const savedActive = sessionStorage.getItem('stack_active_note_id');
          if (savedActive && savedNotes.some((n) => n.id === savedActive)) {
            setActiveNoteId(savedActive);
          } else {
            // Prefer active note over trash/archive
            const activeOnly = savedNotes.filter(
              (n) => !n.deletedAt && !n.archivedAt
            );
            setActiveNoteId(activeOnly[0]?.id || savedNotes[0]?.id || '');
          }
        } else {
          setActiveNoteId('');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user.sub]);

  // Track active note in session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeNoteId) {
        sessionStorage.setItem('stack_active_note_id', activeNoteId);
      } else {
        sessionStorage.removeItem('stack_active_note_id');
      }
    }
  }, [activeNoteId]);

  // Zen Mode Keyboard Shortcuts: Ctrl+\ or Cmd+\ toggles, Esc exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setLayoutMode((prev) => {
          const next = prev === 'zen' ? 'expanded' : 'zen';
          userWorkspaceStorage.saveLayoutSettings(user.sub, { sidebarMode: next });
          return next;
        });
      } else if (e.key === 'Escape' && layoutMode === 'zen') {
        setLayoutMode('expanded');
        userWorkspaceStorage.saveLayoutSettings(user.sub, { sidebarMode: 'expanded' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode, user.sub]);

  const handleLayoutModeChange = (mode: SidebarLayoutMode) => {
    setLayoutMode(mode);
    userWorkspaceStorage.saveLayoutSettings(user.sub, { sidebarMode: mode });
  };

  // Find currently active note
  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  const isNoteTrashed = activeNote ? noteOrganizationService.isNoteTrashed(activeNote) : false;
  const isNoteArchived = activeNote ? noteOrganizationService.isNoteArchived(activeNote) : false;

  // Extract all known active tags for auto-completion
  const allKnownTags = useMemo(
    () => tagService.extractActiveTags(notes).map((t) => t.tag),
    [notes]
  );

  // Set active user sub for attachments
  useEffect(() => {
    attachmentRepository.setActiveSub(user.sub);
  }, [user.sub]);

  // Draft recovery check
  useEffect(() => {
    if (!activeNote || typeof window === 'undefined') return;

    const draftKey = `stack_draft_recovery_${activeNote.id}`;
    const saved = localStorage.getItem(draftKey);
    if (!saved) {
      setRecoveryDraft(null);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed.content && parsed.content !== activeNote.content) {
        const timeDiff = Math.round((Date.now() - parsed.timestamp) / 1000);
        setRecoveryDraft({
          content: parsed.content,
          timeDiffSeconds: timeDiff,
        });
      } else {
        setRecoveryDraft(null);
      }
    } catch {
      localStorage.removeItem(draftKey);
      setRecoveryDraft(null);
    }
  }, [activeNote?.id]);

  const handleRestoreDraft = () => {
    if (!recoveryDraft || !activeNote) return;
    handleUpdateNote({ content: recoveryDraft.content });
    setRecoveryDraft(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
    }
  };

  const handleDiscardDraft = () => {
    if (!activeNote) return;
    setRecoveryDraft(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
    }
  };

  // Atomic Persistence Helpers with Optimistic Rollback
  const applyNotesMutation = async (nextNotes: Note[]) => {
    const prevNotes = notes;
    setNotes(nextNotes);
    try {
      await userWorkspaceStorage.saveNotes(user.sub, nextNotes);
    } catch (err) {
      setNotes(prevNotes);
      console.error('Notes mutation failed, rolling back:', err);
      alert('Failed to save changes locally. Reverting to previous state.');
    }
  };

  const applyFoldersMutation = async (nextFolders: Folder[]) => {
    const prevFolders = folders;
    setFolders(nextFolders);
    try {
      await userWorkspaceStorage.saveFolders(user.sub, nextFolders);
    } catch (err) {
      setFolders(prevFolders);
      console.error('Folders mutation failed, rolling back:', err);
      alert('Failed to save folders locally. Reverting to previous state.');
    }
  };

  const applyWorkspaceMutation = async (
    nextNotes: Note[],
    nextFolders: Folder[]
  ) => {
    const prevNotes = notes;
    const prevFolders = folders;
    setNotes(nextNotes);
    setFolders(nextFolders);
    try {
      await Promise.all([
        userWorkspaceStorage.saveNotes(user.sub, nextNotes),
        userWorkspaceStorage.saveFolders(user.sub, nextFolders),
      ]);
    } catch (err) {
      setNotes(prevNotes);
      setFolders(prevFolders);
      console.error('Workspace mutation failed, rolling back:', err);
      alert('Failed to save workspace changes. Reverting to previous state.');
    }
  };

  // Editor Note Updates with debounced auto-save
  const handleUpdateNote = (updatedFields: Partial<Note>) => {
    if (!activeNote || isNoteTrashed) return;

    const nextNotes = notes.map((n) =>
      n.id === activeNote.id
        ? {
            ...n,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          }
        : n
    );

    setNotes(nextNotes);
    setSyncState('syncing');

    if (typeof window !== 'undefined' && updatedFields.content !== undefined) {
      localStorage.setItem(
        `stack_draft_recovery_${activeNote.id}`,
        JSON.stringify({
          content: updatedFields.content,
          timestamp: Date.now(),
        })
      );
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await userWorkspaceStorage.saveNotes(user.sub, nextNotes);
        setSyncState('saved_locally');
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
        }
      } catch (err) {
        console.error('Failed to auto-save note:', err);
        setSyncState('offline');
      }
    }, 700);
  };

  const handleCreateNote = (targetFolderId?: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing Markdown notes without the noise…',
      tags: [],
      folderId: targetFolderId || null,
      order: (notes.length + 1) * 100,
      isPinned: false,
      archivedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'saved_locally',
    };
    applyNotesMutation([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    if (activeFilter === 'trash' || activeFilter === 'archive') {
      setActiveFilter('all');
    }
  };

  const handleTogglePin = (noteId?: string) => {
    const idToPin = noteId || activeNote?.id;
    if (!idToPin) return;
    const nextNotes = notes.map((n) =>
      n.id === idToPin
        ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() }
        : n
    );
    applyNotesMutation(nextNotes);
  };

  const handleMoveNoteToFolder = (noteId: string, folderId: string | null) => {
    try {
      const nextNotes = workspaceMoveService.moveNoteToFolder(noteId, folderId, notes);
      applyNotesMutation(nextNotes);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to move note');
    }
  };

  const handleReorderNote = (
    sourceNoteId: string,
    targetNoteId: string,
    edge: 'before' | 'after'
  ) => {
    try {
      const nextNotes = workspaceOrderService.reorderNotes(
        sourceNoteId,
        targetNoteId,
        edge,
        notes
      );
      applyNotesMutation(nextNotes);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to reorder notes');
    }
  };

  const handleMoveFolder = (folderId: string, targetParentId: string | null) => {
    try {
      const nextFolders = workspaceMoveService.moveFolder(
        folderId,
        targetParentId,
        folders
      );
      applyFoldersMutation(nextFolders);
    } catch (err: unknown) {
      alert((err as Error).message || 'Cannot move folder');
    }
  };

  const handleReorderFolder = (
    sourceFolderId: string,
    targetFolderId: string,
    edge: 'before' | 'after'
  ) => {
    try {
      const nextFolders = workspaceOrderService.reorderFolders(
        sourceFolderId,
        targetFolderId,
        edge,
        folders
      );
      applyFoldersMutation(nextFolders);
    } catch (err: unknown) {
      alert((err as Error).message || 'Cannot reorder folder');
    }
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const validation = folderTreeService.validateFolderName(name, parentId, folders);
    if (!validation.valid) {
      alert(validation.error || 'Invalid folder name');
      return;
    }

    const now = new Date().toISOString();
    const newFolder: Folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      parentId,
      order: (folders.length + 1) * 100,
      createdAt: now,
      updatedAt: now,
    };
    applyFoldersMutation([...folders, newFolder]);
  };

  const handleRenameFolder = (id: string, name: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return;
    const validation = folderTreeService.validateFolderName(
      name,
      folder.parentId,
      folders,
      id
    );
    if (!validation.valid) {
      alert(validation.error || 'Invalid folder name');
      return;
    }
    const nextFolders = folders.map((f) =>
      f.id === id
        ? { ...f, name: name.trim(), updatedAt: new Date().toISOString() }
        : f
    );
    applyFoldersMutation(nextFolders);
  };

  // Safe Folder Deletion preserving hierarchy: Reparents only direct notes and immediate children
  const handleSafeDeleteFolder = (
    folderId: string,
    destinationFolderId: string | null
  ) => {
    try {
      const { updatedNotes, updatedFolders } =
        workspaceMoveService.reparentFolderContents(
          folderId,
          destinationFolderId,
          folders,
          notes
        );
      applyWorkspaceMutation(updatedNotes, updatedFolders);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete folder');
    }
  };

  // Lifecycle transitions: Archive, Trash, Restore, Delete Forever
  const handleArchiveNote = (noteId: string) => {
    const nextNotes = noteOrganizationService.archiveNote(noteId, notes);
    applyNotesMutation(nextNotes);
    if (activeNoteId === noteId && activeFilter !== 'archive') {
      const remaining = noteOrganizationService.getActiveNotes(nextNotes);
      setActiveNoteId(remaining[0]?.id || '');
    }
  };

  const handleUnarchiveNote = (noteId: string) => {
    const nextNotes = noteOrganizationService.unarchiveNote(noteId, notes);
    applyNotesMutation(nextNotes);
  };

  const handleMoveToTrash = (noteId: string) => {
    const nextNotes = noteOrganizationService.moveToTrash(noteId, notes);
    applyNotesMutation(nextNotes);
    if (activeNoteId === noteId && activeFilter !== 'trash') {
      const remaining = noteOrganizationService.getActiveNotes(nextNotes);
      setActiveNoteId(remaining[0]?.id || '');
    }
  };

  const handleRestoreFromTrash = (noteId: string) => {
    const nextNotes = noteOrganizationService.restoreFromTrash(noteId, notes);
    applyNotesMutation(nextNotes);
  };

  const handlePermanentDelete = (noteId: string) => {
    const nextNotes = noteOrganizationService.permanentlyDeleteNote(noteId, notes);
    applyNotesMutation(nextNotes);
    if (activeNoteId === noteId) {
      const remaining =
        activeFilter === 'trash'
          ? noteOrganizationService.getTrashedNotes(nextNotes)
          : noteOrganizationService.getActiveNotes(nextNotes);
      setActiveNoteId(remaining[0]?.id || '');
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${noteId}`);
    }
  };

  const handleEmptyTrash = () => {
    if (
      confirm(
        'Permanently delete all notes in the trash? This action cannot be undone.'
      )
    ) {
      const nextNotes = noteOrganizationService.emptyTrash(notes);
      applyNotesMutation(nextNotes);
      if (activeNote?.deletedAt != null) {
        setActiveNoteId('');
      }
    }
  };

  // Tag mutation handlers
  const handleAddTag = (noteId: string, rawTag: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    try {
      const updated = tagService.addTagToNote(note, rawTag);
      const nextNotes = notes.map((n) => (n.id === noteId ? updated : n));
      applyNotesMutation(nextNotes);
    } catch (err: unknown) {
      alert((err as Error).message || 'Invalid tag');
    }
  };

  const handleRemoveTag = (noteId: string, rawTag: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const updated = tagService.removeTagFromNote(note, rawTag);
    const nextNotes = notes.map((n) => (n.id === noteId ? updated : n));
    applyNotesMutation(nextNotes);
  };

  const handleImportNotes = (imported: Note[]) => {
    if (!imported.length) return;
    const nextNotes = [...imported, ...notes];
    applyNotesMutation(nextNotes);
    setActiveNoteId(imported[0]?.id || '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote || isNoteTrashed) return;

    try {
      setSyncState('syncing');
      const { attachment, markdownSyntax } =
        await attachmentService.processFile(file, activeNote.id, user.sub);
      setAttachments((prev) => ({
        ...prev,
        [activeNote.id]: [...(prev[activeNote.id] || []), attachment],
      }));

      handleUpdateNote({
        content: (activeNote.content || '') + `\n\n${markdownSyntax}\n`,
      });

      setSyncState('saved_locally');
    } catch (err) {
      console.error('Failed to attach file:', err);
      setSyncState('saved_locally');
      alert('Failed to process attachment.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentAttachments = activeNote ? attachments[activeNote.id] || [] : [];
  const wordCount = activeNote?.content
    ? activeNote.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = activeNote?.content ? activeNote.content.length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stack-bg font-sans text-stack-bone">
      {/* Hidden File Input for Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Desktop Persistent Sidebar */}
      <AppSidebar
        notes={notes}
        folders={folders}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onCreateNote={() => handleCreateNote()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        syncState={syncState}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        layoutMode={layoutMode}
        onLayoutModeChange={handleLayoutModeChange}
        onMoveNoteToFolder={handleMoveNoteToFolder}
        onReorderNote={handleReorderNote}
        onMoveFolder={handleMoveFolder}
        onReorderFolder={handleReorderFolder}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onSafeDeleteFolder={handleSafeDeleteFolder}
        onTogglePin={handleTogglePin}
        onArchiveNote={handleArchiveNote}
        onUnarchiveNote={handleUnarchiveNote}
        onTrashNote={handleMoveToTrash}
        onRestoreNote={handleRestoreFromTrash}
        onPermanentDeleteNote={handlePermanentDelete}
        onEmptyTrash={handleEmptyTrash}
        user={user}
        onSignOut={onSignOut}
        canInstallPwa={isInstallable}
        onInstallPwa={triggerInstall}
        className="hidden md:flex"
      />

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stack-bg/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="w-72 h-full bg-stack-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AppSidebar
              notes={notes}
              folders={folders}
              activeNoteId={activeNoteId}
              onSelectNote={(id) => {
                setActiveNoteId(id);
                setIsMobileSidebarOpen(false);
              }}
              onCreateNote={() => {
                handleCreateNote();
                setIsMobileSidebarOpen(false);
              }}
              onOpenSettings={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenProfile={() => {
                setIsProfileOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenImportExport={() => {
                setIsImportExportOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenCommandPalette={() => {
                setIsCommandPaletteOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              syncState={syncState}
              activeFilter={activeFilter}
              onFilterChange={(f) => {
                setActiveFilter(f);
                setIsMobileSidebarOpen(false);
              }}
              layoutMode="expanded"
              onLayoutModeChange={() => {}}
              onMoveNoteToFolder={handleMoveNoteToFolder}
              onReorderNote={handleReorderNote}
              onMoveFolder={handleMoveFolder}
              onReorderFolder={handleReorderFolder}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onSafeDeleteFolder={handleSafeDeleteFolder}
              onTogglePin={handleTogglePin}
              onArchiveNote={handleArchiveNote}
              onUnarchiveNote={handleUnarchiveNote}
              onTrashNote={handleMoveToTrash}
              onRestoreNote={handleRestoreFromTrash}
              onPermanentDeleteNote={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
              user={user}
              onSignOut={onSignOut}
              canInstallPwa={isInstallable}
              onInstallPwa={triggerInstall}
              className="flex w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Zen Mode Exit Button */}
        {layoutMode === 'zen' && (
          <ZenModeExitButton onExit={() => handleLayoutModeChange('expanded')} />
        )}

        {notes.length > 0 && activeNote ? (
          <>
            {/* Header Bar */}
            <AppHeader
              title={activeNote.title || 'Untitled'}
              onTitleChange={(newTitle) => handleUpdateNote({ title: newTitle })}
              tags={activeNote.tags || []}
              isPinned={activeNote.isPinned || false}
              onTogglePin={() => handleTogglePin(activeNote.id)}
              onDeleteNote={() => handleMoveToTrash(activeNote.id)}
              editorMode={editorMode}
              onModeChange={setEditorMode}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleAttachments={() =>
                setIsAttachmentDrawerOpen((prev) => !prev)}
              onToggleOutline={() => setIsOutlineOpen((prev) => !prev)}
              isOutlineOpen={isOutlineOpen}
              onOpenImportExport={() => setIsImportExportOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              attachmentCount={currentAttachments.length}
              syncState={syncState}
              wordCount={wordCount}
              charCount={charCount}
              readingTimeMinutes={readingTimeMinutes}
            />

            {/* Note Status Banner for Archive & Trash */}
            {isNoteTrashed && (
              <div className="flex items-center justify-between bg-red-950/70 border-b border-red-800/60 px-4 py-2 font-mono text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  <span>This note is in the Trash. Editing is disabled.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreFromTrash(activeNote.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stack-metal hover:bg-stack-steel/30 text-stack-bone transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(activeNote.id)}
                    className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-medium transition-colors"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            )}

            {isNoteArchived && (
              <div className="flex items-center justify-between bg-stack-metal/40 border-b border-stack-metal/70 px-4 py-2 font-mono text-xs text-stack-silver">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-stack-steel" />
                  <span>This note is archived.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnarchiveNote(activeNote.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stack-metal hover:bg-stack-steel/30 text-stack-bone transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Unarchive</span>
                </button>
              </div>
            )}

            {/* Active Note Tag Editor Bar */}
            {!isNoteTrashed && (
              <div className="border-b border-stack-metal/40 bg-stack-surface/60 px-3 py-1 flex items-center justify-between">
                <NoteTagEditor
                  tags={activeNote.tags || []}
                  allKnownTags={allKnownTags}
                  onAddTag={(tag) => handleAddTag(activeNote.id, tag)}
                  onRemoveTag={(tag) => handleRemoveTag(activeNote.id, tag)}
                  readOnly={isNoteArchived}
                />
              </div>
            )}

            {/* Crash recovery notification */}
            {recoveryDraft && (
              <RecoveryDraftBanner
                isVisible={true}
                timeDiffSeconds={recoveryDraft.timeDiffSeconds}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
              />
            )}

            {/* Content Pane */}
            <div className="relative flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Write Mode */}
                {editorMode === 'write' && (
                  <div className="flex-1 h-full overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="flex h-full w-full items-center justify-center font-mono text-xs text-stack-steel">
                          Initializing Editor Engine…
                        </div>
                      }
                    >
                      <CodeMirrorEditor
                        value={activeNote.content || ''}
                        onChange={(content) => handleUpdateNote({ content })}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Split Mode */}
                {editorMode === 'split' && (
                  <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                    <div className="flex-1 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-stack-metal/70 overflow-hidden">
                      <Suspense
                        fallback={
                          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-stack-steel">
                            Initializing Editor Engine…
                          </div>
                        }
                      >
                        <CodeMirrorEditor
                          value={activeNote.content || ''}
                          onChange={(content) => handleUpdateNote({ content })}
                        />
                      </Suspense>
                    </div>
                    <div className="flex-1 h-1/2 md:h-full overflow-y-auto bg-stack-surface/30">
                      <MarkdownPreview content={activeNote.content || ''} />
                    </div>
                  </div>
                )}

                {/* Read Mode */}
                {editorMode === 'read' && (
                  <div className="flex-1 h-full overflow-y-auto bg-stack-surface/20">
                    <MarkdownPreview content={activeNote.content || ''} />
                  </div>
                )}

                {/* Attachments Drawer */}
                <AttachmentDrawer
                  isOpen={isAttachmentDrawerOpen}
                  onClose={() => setIsAttachmentDrawerOpen(false)}
                  attachments={currentAttachments}
                  onUploadClick={() => fileInputRef.current?.click()}
                />
              </div>

              {/* Document Outline sidebar */}
              <DocumentOutline
                content={activeNote.content || ''}
                isOpen={isOutlineOpen}
                onClose={() => setIsOutlineOpen(false)}
              />
            </div>

            {/* Footer Status Bar */}
            <footer className="flex h-6 w-full items-center justify-between border-t border-stack-metal/60 bg-stack-surface px-4 font-mono text-[10px] text-stack-steel">
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                <span>~{readingTimeMinutes} min read</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-stack-silver">
                  {activeNote.tags?.map((t) => `#${t}`).join(' ') || 'no tags'}
                </span>
                <span>·</span>
                <span>
                  Updated{' '}
                  {new Date(activeNote.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </footer>
          </>
        ) : (
          /* Empty Workspace State */
          <div className="flex flex-1 items-center justify-center bg-stack-surface/10">
            <WorkspaceEmptyState
              preferredName={`@${user.username}`}
              onCreateNote={() => handleCreateNote()}
              onImportMarkdown={() => setIsImportExportOpen(true)}
              onStartTour={() => setIsTourOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CoachMarkTour
        isOpen={isTourOpen}
        userSub={user.sub}
        onClose={() => setIsTourOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        noteCount={notes.length}
        user={user}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        activeNote={activeNote ?? null}
        allNotes={notes}
        allAttachments={Object.values(attachments).flat()}
        onImportNotes={handleImportNotes}
      />

      <InstallInstructionsDialog
        isOpen={isInstallDialogOpen}
        onClose={() => setIsInstallDialogOpen(false)}
      />
    </div>
  );
}
