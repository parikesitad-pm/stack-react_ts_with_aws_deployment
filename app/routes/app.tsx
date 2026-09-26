import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { initialNotes } from '~/features/notes/data/mockNotes';
import type { Note, Folder, NoteFilter } from '~/features/notes/types/note.types';
import { folderTreeService } from '~/features/notes/services/folderTree.service';
import type { SyncState } from '~/components/atoms/StatusIndicator';
import type { EditorMode } from '~/components/molecules/EditorModeSwitcher';
import { AppSidebar, type SidebarLayoutMode } from '~/components/organisms/AppSidebar';
import { AppHeader } from '~/components/organisms/AppHeader';
import { MarkdownPreview } from '~/features/editor/components/MarkdownPreview';
import { CommandPaletteModal } from '~/features/search/components/CommandPaletteModal';
import { SettingsModal } from '~/features/settings/components/SettingsModal';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';
import { StartupLoader } from '~/features/workspace/components/StartupLoader';
import { OnboardingModal } from '~/features/profile/components/OnboardingModal';
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

const CodeMirrorEditor = lazy(() =>
  import('~/features/editor/components/CodeMirrorEditor').then((m) => ({
    default: m.CodeMirrorEditor,
  }))
);

export function meta() {
  return [
    { title: 'Workspace — STACK' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function AppPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    hasCompletedOnboarding,
    completeOnboarding,
    signOut,
  } = useAuthSession();

  const {
    isInstallable,
    triggerInstall,
    isDialogOpen: isInstallDialogOpen,
    setIsDialogOpen: setIsInstallDialogOpen,
  } = usePwaInstall();

  // Cold start loader state (session-persisted so it only triggers on cold boot/reload)
  const [isStartupLoading, setIsStartupLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasBooted = sessionStorage.getItem('stack_app_cold_boot');
    if (!hasBooted) {
      sessionStorage.setItem('stack_app_cold_boot', 'true');
      return true;
    }
    return false;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === 'undefined') return initialNotes;
    try {
      const saved = localStorage.getItem('stack_notes');
      return saved ? JSON.parse(saved) : initialNotes;
    } catch {
      return initialNotes;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('stack_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('stack_active_note_id') || (initialNotes[0]?.id ?? '');
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

  // Attachments per note
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist notes & folders
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stack_notes', JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stack_folders', JSON.stringify(folders));
    }
  }, [folders]);

  useEffect(() => {
    if (typeof window !== 'undefined' && activeNoteId) {
      localStorage.setItem('stack_active_note_id', activeNoteId);
    }
  }, [activeNoteId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stack_sidebar_layout_mode', layoutMode);
    }
  }, [layoutMode]);

  // Protected route guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // Check tour completion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sub = user?.sub || 'local';
    const tourDone = localStorage.getItem(`stack_tour_completed_${sub}`);
    if (!tourDone && notes.length === 0) {
      setIsTourOpen(true);
    }
  }, [user?.sub, notes.length]);

  const activeNote = useMemo((): Note | null => {
    if (notes.length === 0) return null;
    const found = notes.find((n) => n.id === activeNoteId);
    return found || notes[0] || null;
  }, [notes, activeNoteId]);

  const currentAttachments = useMemo(() => {
    if (!activeNoteId) return [];
    return attachments[activeNoteId] || [];
  }, [attachments, activeNoteId]);

  // Compute word and char counts
  const { wordCount, charCount } = useMemo(() => {
    const text = activeNote?.content || '';
    const words = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
    return { wordCount: words, charCount: text.length };
  }, [activeNote?.content]);

  // Reading time at ~200 wpm
  const readingTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Check for unsaved crash recovery draft
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
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    setRecoveryDraft(null);
  }, [activeNoteId, activeNote?.content]);

  // Global key bindings: Ctrl+K, Ctrl+N, Ctrl+1/2/3, Escape (exit zen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setEditorMode('write');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setEditorMode('split');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setEditorMode('read');
      }
      if (e.key === 'Escape' && layoutMode === 'zen') {
        e.preventDefault();
        setLayoutMode('expanded');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setLayoutMode((prev) => (prev === 'zen' ? 'expanded' : 'zen'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode]);

  const handleContentChange = (newContent: string) => {
    if (!activeNoteId) return;
    setSyncState('syncing');

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `stack_draft_recovery_${activeNoteId}`,
          JSON.stringify({ content: newContent, timestamp: Date.now() })
        );
      } catch {
        // Ignore quota limitations
      }
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId
          ? { ...n, content: newContent, updatedAt: 'Just now' }
          : n
      )
    );

    saveTimerRef.current = setTimeout(() => {
      setSyncState('saved_locally');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`stack_draft_recovery_${activeNoteId}`);
      }
    }, 450);
  };

  const handleRestoreDraft = () => {
    if (!recoveryDraft) return;
    handleContentChange(recoveryDraft.content);
    setRecoveryDraft(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${activeNoteId}`);
    }
  };

  const handleDiscardDraft = () => {
    setRecoveryDraft(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`stack_draft_recovery_${activeNoteId}`);
    }
  };

  const handleSelectHeading = (headingText: string) => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const el of headings) {
      if (
        el.textContent
          ?.trim()
          .toLowerCase()
          .includes(headingText.trim().toLowerCase())
      ) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };

  const handleImportNotes = (newNotes: Note[]) => {
    setNotes((prevNotes) => {
      const importedIds = new Set(newNotes.map((n) => n.id));
      const kept = prevNotes.filter((n) => !importedIds.has(n.id));
      return [...newNotes, ...kept];
    });
    if (newNotes.length > 0 && newNotes[0]) {
      setActiveNoteId(newNotes[0].id);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!activeNoteId) return;
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId
          ? { ...n, title: newTitle, updatedAt: 'Just now' }
          : n
      )
    );
  };

  const handleTogglePin = () => {
    if (!activeNoteId) return;
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId ? { ...n, isPinned: !n.isPinned } : n
      )
    );
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    const remaining = notes.filter((n) => n.id !== activeNoteId);
    setNotes(remaining);
    if (remaining.length > 0 && remaining[0]) {
      setActiveNoteId(remaining[0].id);
    } else {
      setActiveNoteId('');
    }
  };

  const handleCreateNote = () => {
    const newId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      title: 'Untitled Document',
      content:
        '# Untitled Document\n\nBegin typing Markdown here. Your keystrokes commit directly to local storage.\n',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      tags: ['draft'],
      isPinned: false,
      isArchived: false,
      syncStatus: 'saved_locally',
      folderId: null,
      order: notes.length,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newId);
  };

  // Folder Operations
  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      order: folders.length,
      isExpanded: true,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    // Collect all descendants
    const descendants = folderTreeService.getFolderDescendants(folderId, folders);
    const doomedFolderIds = new Set([folderId, ...descendants]);

    // Unfile any notes inside deleted folders
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.folderId && doomedFolderIds.has(n.folderId)
          ? { ...n, folderId: null }
          : n
      )
    );

    // Remove folders
    setFolders((prev) => prev.filter((f) => !doomedFolderIds.has(f.id)));
  };

  const handleMoveFolder = (folderId: string, targetParentId: string | null) => {
    if (folderTreeService.wouldCreateCycle(folderId, targetParentId, folders)) {
      return;
    }
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, parentId: targetParentId } : f
      )
    );
  };

  const handleMoveNoteToFolder = (
    noteId: string,
    targetFolderId: string | null
  ) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === noteId ? { ...n, folderId: targetFolderId } : n
      )
    );
  };

  const handleReorderNote = (sourceNoteId: string, targetNoteId: string) => {
    setNotes((prevNotes) => {
      const sourceIndex = prevNotes.findIndex((n) => n.id === sourceNoteId);
      const targetIndex = prevNotes.findIndex((n) => n.id === targetNoteId);
      if (sourceIndex === -1 || targetIndex === -1) return prevNotes;

      const updated = [...prevNotes];
      const [moved] = updated.splice(sourceIndex, 1);
      if (moved) {
        updated.splice(targetIndex, 0, moved);
      }
      return updated;
    });
  };

  // Image paste handler (Ctrl+V)
  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    if (!activeNoteId) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const { attachment, markdownSyntax } =
            await attachmentService.processFile(
              file,
              activeNoteId,
              user?.sub || 'isolated'
            );

          setAttachments((prev) => ({
            ...prev,
            [activeNoteId]: [...(prev[activeNoteId] || []), attachment],
          }));

          const updatedContent =
            (activeNote?.content || '') + '\n\n' + markdownSyntax + '\n';
          handleContentChange(updatedContent);
          setIsAttachmentDrawerOpen(true);
          break;
        }
      }
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeNoteId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const { attachment, markdownSyntax } =
        await attachmentService.processFile(
          file,
          activeNoteId,
          user?.sub || 'isolated'
        );

      setAttachments((prev) => ({
        ...prev,
        [activeNoteId]: [...(prev[activeNoteId] || []), attachment],
      }));

      const updatedContent =
        (activeNote?.content || '') + '\n\n' + markdownSyntax + '\n';
      handleContentChange(updatedContent);
    }

    setIsAttachmentDrawerOpen(true);
    e.target.value = '';
  };

  return (
    <div
      onPaste={handleEditorPaste}
      className="flex h-screen w-screen overflow-hidden bg-stack-bg text-stack-bone selection:bg-stack-red-muted selection:text-stack-bone"
    >
      {/* Hidden file input for manual attachments */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Startup Workspace Loader */}
      {isStartupLoading && (
        <StartupLoader onReady={() => setIsStartupLoading(false)} />
      )}

      {/* First-login Onboarding Modal */}
      <OnboardingModal
        isOpen={isAuthenticated && !hasCompletedOnboarding}
        initialEmail={user?.email}
        onComplete={(name, username, dob) =>
          completeOnboarding(name, username, dob)
        }
      />

      {/* Zen Mode Exit Button */}
      {layoutMode === 'zen' && (
        <ZenModeExitButton onExit={() => setLayoutMode('expanded')} />
      )}

      {/* Desktop Sidebar */}
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
        onSignOut={() => {
          signOut();
          navigate('/auth/login', { replace: true });
        }}
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
              onSignOut={() => {
                signOut();
                navigate('/auth/login', { replace: true });
              }}
              canInstallPwa={isInstallable}
              onInstallPwa={triggerInstall}
              className="flex w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {notes.length > 0 && activeNote ? (
          <>
            <AppHeader
              title={activeNote.title || 'Untitled'}
              onTitleChange={handleTitleChange}
              tags={activeNote.tags || []}
              isPinned={activeNote.isPinned || false}
              onTogglePin={handleTogglePin}
              onDeleteNote={handleDeleteNote}
              editorMode={editorMode}
              onModeChange={setEditorMode}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleAttachments={() => setIsAttachmentDrawerOpen((prev) => !prev)}
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

            {/* Recovery Draft Alert Banner */}
            {recoveryDraft && (
              <RecoveryDraftBanner
                isVisible={true}
                timeDiffSeconds={recoveryDraft.timeDiffSeconds}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
              />
            )}

            {/* Viewport Modes */}
            <div className="flex flex-1 overflow-hidden relative">
              <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Write Mode */}
                {editorMode === 'write' && (
                  <div className="flex-1 h-full overflow-hidden">
                    <Suspense
                      fallback={
                        <div className="flex h-full w-full items-center justify-center font-mono text-xs text-stack-steel">
                          Initializing Editor Engine...
                        </div>
                      }
                    >
                      <CodeMirrorEditor
                        value={activeNote.content || ''}
                        onChange={handleContentChange}
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
                            Initializing Editor Engine...
                          </div>
                        }
                      >
                        <CodeMirrorEditor
                          value={activeNote.content || ''}
                          onChange={handleContentChange}
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

                {/* Attachment Drawer */}
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
                onSelectHeading={handleSelectHeading}
              />
            </div>
          </>
        ) : (
          /* Empty Workspace State */
          <div className="flex flex-1 items-center justify-center bg-stack-surface/10">
            <WorkspaceEmptyState
              preferredName={user?.preferredName || 'Operator'}
              onCreateNote={handleCreateNote}
              onImportMarkdown={() => setIsImportExportOpen(true)}
              onStartTour={() => setIsTourOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Modals & Tours */}
      <CoachMarkTour
        isOpen={isTourOpen}
        userSub={user?.sub || 'local'}
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
