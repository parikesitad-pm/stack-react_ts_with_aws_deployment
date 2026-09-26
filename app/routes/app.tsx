import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { initialNotes } from '~/features/notes/data/mockNotes';
import type { Note, NoteFilter } from '~/features/notes/types/note.types';
import type { SyncState } from '~/components/atoms/StatusIndicator';
import type { EditorMode } from '~/components/molecules/EditorModeSwitcher';
import { AppSidebar } from '~/components/organisms/AppSidebar';
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

const CodeMirrorEditor = lazy(() =>
  import('~/features/editor/components/CodeMirrorEditor').then((m) => ({
    default: m.CodeMirrorEditor,
  }))
);

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

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>('note-1');
  const [editorMode, setEditorMode] = useState<EditorMode>('split');
  const [syncState, setSyncState] = useState<SyncState>('saved_locally');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = useState(false);

  // Attachments per note
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({
    'note-1': [
      {
        id: 'att-sample-1',
        ownerSub: user?.sub || 'isolated',
        noteId: 'note-1',
        name: 'screenshot-20260927-010212.webp',
        mimeType: 'image/webp',
        size: 84200,
        localPath: './assets/screenshot-20260927-010212.webp',
        createdAt: '2026-09-27T01:02:12.000Z',
        syncStatus: 'synced',
      },
    ],
  });

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Protected route guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth/login', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const activeNote = useMemo(() => {
    return (
      notes.find((n) => n.id === activeNoteId) || notes[0] || initialNotes[0]
    );
  }, [notes, activeNoteId]);

  const currentAttachments = useMemo(() => {
    return attachments[activeNoteId] || [];
  }, [attachments, activeNoteId]);

  // Compute word and char counts
  const { wordCount, charCount } = useMemo(() => {
    const text = activeNote?.content || '';
    const words = text.trim().length > 0 ? text.trim().split(/\s+/).length : 0;
    return { wordCount: words, charCount: text.length };
  }, [activeNote?.content]);

  // Global key bindings: Ctrl+K, Ctrl+N, Ctrl+1/2/3
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleContentChange = (newContent: string) => {
    setSyncState('syncing');

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
    }, 450);
  };

  const handleTitleChange = (newTitle: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId
          ? { ...n, title: newTitle, updatedAt: 'Just now' }
          : n
      )
    );
  };

  const handleTogglePin = () => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === activeNoteId ? { ...n, isPinned: !n.isPinned } : n
      )
    );
  };

  const handleDeleteNote = () => {
    if (notes.length <= 1) return;
    const remaining = notes.filter((n) => n.id !== activeNoteId);
    setNotes(remaining);
    if (remaining.length > 0 && remaining[0]) {
      setActiveNoteId(remaining[0].id);
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
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newId);
  };

  // Image paste handler (Ctrl+V)
  const handleEditorPaste = async (e: React.ClipboardEvent) => {
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
        onComplete={(name, dob) => completeOnboarding(name, dob)}
      />

      {/* Desktop Sidebar */}
      <AppSidebar
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        syncState={syncState}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        user={user}
        onSignOut={() => {
          signOut();
          navigate('/auth/login', { replace: true });
        }}
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
              onOpenCommandPalette={() => {
                setIsCommandPaletteOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              syncState={syncState}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              user={user}
              onSignOut={() => {
                signOut();
                navigate('/auth/login', { replace: true });
              }}
              className="flex w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title={activeNote?.title || 'Untitled'}
          onTitleChange={handleTitleChange}
          tags={activeNote?.tags || []}
          isPinned={activeNote?.isPinned || false}
          onTogglePin={handleTogglePin}
          onDeleteNote={handleDeleteNote}
          editorMode={editorMode}
          onModeChange={setEditorMode}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleAttachments={() =>
            setIsAttachmentDrawerOpen((prev) => !prev)
          }
          onOpenProfile={() => setIsProfileOpen(true)}
          attachmentCount={currentAttachments.length}
          syncState={syncState}
          wordCount={wordCount}
          charCount={charCount}
        />

        {/* Viewport Modes */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* Write Mode: CodeMirror editor only */}
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
                  value={activeNote?.content || ''}
                  onChange={handleContentChange}
                />
              </Suspense>
            </div>
          )}

          {/* Split Mode: CodeMirror on left, rendered preview on right */}
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
                    value={activeNote?.content || ''}
                    onChange={handleContentChange}
                  />
                </Suspense>
              </div>
              <div className="flex-1 h-1/2 md:h-full overflow-y-auto bg-stack-surface/30">
                <MarkdownPreview content={activeNote?.content || ''} />
              </div>
            </div>
          )}

          {/* Read Mode: Formatted Preview only */}
          {editorMode === 'read' && (
            <div className="flex-1 h-full overflow-y-auto bg-stack-surface/20">
              <div className="mx-auto max-w-4xl py-6">
                <MarkdownPreview content={activeNote?.content || ''} />
              </div>
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
      </div>

      {/* Modals */}
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
    </div>
  );
}
