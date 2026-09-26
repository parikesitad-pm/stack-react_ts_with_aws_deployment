import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import type {
  Note,
  Folder,
  NoteFilter,
} from '~/features/notes/types/note.types';
import { folderTreeService } from '~/features/notes/services/folderTree.service';
import type { SyncState } from '~/components/atoms/StatusIndicator';
import type { EditorMode } from '~/components/molecules/EditorModeSwitcher';
import {
  AppSidebar,
  type SidebarLayoutMode,
} from '~/components/organisms/AppSidebar';
import { AppHeader } from '~/components/organisms/AppHeader';
import { MarkdownPreview } from '~/features/editor/components/MarkdownPreview';
import { CommandPaletteModal } from '~/features/search/components/CommandPaletteModal';
import { SettingsModal } from '~/features/settings/components/SettingsModal';
import { ProfileModal } from '~/features/profile/components/ProfileModal';
import { AttachmentDrawer } from '~/features/attachments/components/AttachmentDrawer';
import { attachmentService } from '~/features/attachments/services/attachment.service';
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
    const saved = localStorage.getItem('stack_sidebar_layout_mode');
    if (saved === 'expanded' || saved === 'compact' || saved === 'zen') {
      return saved;
    }
    return 'expanded';
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

  // Load user-scoped notes and folders from isolated IndexedDB
  useEffect(() => {
    // Purge legacy global un-scoped items from localStorage so they never leak
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stack_notes');
      localStorage.removeItem('stack_folders');
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

        if (savedNotes && savedNotes.length > 0) {
          const savedActive = sessionStorage.getItem('stack_active_note_id');
          if (savedActive && savedNotes.some((n) => n.id === savedActive)) {
            setActiveNoteId(savedActive);
          } else {
            setActiveNoteId(savedNotes[0]?.id || '');
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

  // Persist notes to user-scoped IndexedDB
  useEffect(() => {
    if (isDataLoaded) {
      userWorkspaceStorage.saveNotes(user.sub, notes);
    }
  }, [notes, isDataLoaded, user.sub]);

  // Persist folders to user-scoped IndexedDB
  useEffect(() => {
    if (isDataLoaded) {
      userWorkspaceStorage.saveFolders(user.sub, folders);
    }
  }, [folders, isDataLoaded, user.sub]);

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

  // Track layout mode in local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stack_sidebar_layout_mode', layoutMode);
    }
  }, [layoutMode]);

  // Check tour completion for new user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tourDone = localStorage.getItem(`stack_tour_completed_${user.sub}`);
    if (!tourDone && isDataLoaded && notes.length === 0) {
      setIsTourOpen(true);
    }
  }, [user.sub, isDataLoaded, notes.length]);

  const activeNote = useMemo((): Note | null => {
    if (notes.length === 0) return null;
    const found = notes.find((n) => n.id === activeNoteId);
    return found || notes[0] || null;
  }, [notes, activeNoteId]);

  const currentAttachments = useMemo(() => {
    if (!activeNoteId) return [];
    return attachments[activeNoteId] || [];
  }, [attachments, activeNoteId]);

  const { wordCount, charCount } = useMemo(() => {
    const text = activeNote?.content || '';
    const words = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
    return { wordCount: words, charCount: text.length };
  }, [activeNote?.content]);

  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Crash recovery check
  useEffect(() => {
    if (typeof window === 'undefined' || !activeNoteId) return;
    try {
      const raw = localStorage.getItem(`stack_draft_recovery_${activeNoteId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          content: string;
          timestamp: number;
        };
        if (parsed.content && parsed.content !== activeNote?.content) {
          const diffSec = Math.max(
            1,
            Math.round((Date.now() - parsed.timestamp) / 1000)
          );
          setRecoveryDraft({
            content: parsed.content,
            timeDiffSeconds: diffSec,
          });
        }
      }
    } catch {}
  }, [activeNoteId, activeNote?.content]);

  const handleUpdateNote = (
    updatedFields: Partial<Omit<Note, 'id' | 'createdAt'>>
  ) => {
    if (!activeNote) return;

    setSyncState('syncing');

    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id === activeNote.id) {
          const updated = {
            ...note,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `stack_draft_recovery_${note.id}`,
              JSON.stringify({
                content: updated.content,
                timestamp: Date.now(),
              })
            );
          }
          return updated;
        }
        return note;
      })
    );

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSyncState('saved_locally');
      if (typeof window !== 'undefined' && activeNote) {
        localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
      }
    }, 700);
  };

  const handleCreateNote = (targetFolderId?: string) => {
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing Markdown notes without the noise…',
      tags: [],
      folderId: targetFolderId || null,
      order: notes.length,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'saved_locally',
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (noteId?: string) => {
    const idToDelete = noteId || activeNote?.id;
    if (!idToDelete) return;
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== idToDelete);
      if (activeNoteId === idToDelete) {
        setActiveNoteId(filtered[0]?.id || '');
      }
      return filtered;
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${idToDelete}`);
    }
  };

  const handleTogglePin = (noteId?: string) => {
    const idToPin = noteId || activeNote?.id;
    if (!idToPin) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === idToPin ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleMoveNoteToFolder = (noteId: string, folderId: string | null) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, folderId } : n
      )
    );
  };

  const handleReorderNote = (sourceNoteId: string, targetNoteId: string) => {
    setNotes((prev) => {
      const sourceIndex = prev.findIndex((n) => n.id === sourceNoteId);
      const targetIndex = prev.findIndex((n) => n.id === targetNoteId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const items = [...prev];
      const [moved] = items.splice(sourceIndex, 1);
      if (!moved) return prev;

      items.splice(targetIndex, 0, moved);
      return items;
    });
  };

  const handleMoveFolder = (folderId: string, targetParentId: string | null) => {
    if (folderTreeService.wouldCreateCycle(folderId, targetParentId, folders)) {
      return;
    }
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f))
    );
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'New Folder',
      parentId,
      order: folders.length,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleRenameFolder = (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: name.trim() || f.name } : f
      )
    );
  };

  const handleDeleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id && f.parentId !== id));
    setNotes((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: null } : n))
    );
  };

  const handleImportNotes = (imported: Note[]) => {
    if (!imported.length) return;
    setNotes((prev) => [...imported, ...prev]);
    setActiveNoteId(imported[0]?.id || '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

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
      setSyncState('offline');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreDraft = () => {
    if (!recoveryDraft || !activeNote) return;
    handleUpdateNote({ content: recoveryDraft.content });
    setRecoveryDraft(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
    }
  };

  const handleDiscardDraft = () => {
    setRecoveryDraft(null);
    if (typeof window !== 'undefined' && activeNote) {
      localStorage.removeItem(`stack_draft_recovery_${activeNote.id}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stack-bg font-sans text-stack-bone select-none antialiased">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Sidebar (Desktop) */}
      <AppSidebar
        notes={notes}
        folders={folders}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        syncState={syncState}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        onMoveNoteToFolder={handleMoveNoteToFolder}
        onReorderNote={handleReorderNote}
        onMoveFolder={handleMoveFolder}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
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
              onFilterChange={setActiveFilter}
              layoutMode="expanded"
              onLayoutModeChange={() => {}}
              onMoveNoteToFolder={handleMoveNoteToFolder}
              onReorderNote={handleReorderNote}
              onMoveFolder={handleMoveFolder}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
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
          <ZenModeExitButton onExit={() => setLayoutMode('expanded')} />
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
              onDeleteNote={() => handleDeleteNote(activeNote.id)}
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
        activeNote={activeNote}
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
