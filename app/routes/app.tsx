import { useState, useMemo, useEffect, useRef } from 'react';
import { initialNotes } from '~/features/notes/data/mockNotes';
import type { Note, NoteFilter } from '~/features/notes/types/note.types';
import type { SyncState } from '~/components/atoms/StatusIndicator';
import type { EditorMode } from '~/components/molecules/EditorModeSwitcher';
import { AppSidebar } from '~/components/organisms/AppSidebar';
import { AppHeader } from '~/components/organisms/AppHeader';
import { MarkdownPreview } from '~/features/editor/components/MarkdownPreview';
import { CodeMirrorEditor } from '~/features/editor/components/CodeMirrorEditor';
import { CommandPaletteModal } from '~/features/search/components/CommandPaletteModal';
import { SettingsModal } from '~/features/settings/components/SettingsModal';

export default function AppPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>('note-1');
  const [editorMode, setEditorMode] = useState<EditorMode>('split');
  const [syncState, setSyncState] = useState<SyncState>('saved_locally');
  const [activeFilter, setActiveFilter] = useState<NoteFilter>('all');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeNote = useMemo(() => {
    return (
      notes.find((n) => n.id === activeNoteId) || notes[0] || initialNotes[0]
    );
  }, [notes, activeNoteId]);

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
    setActiveNoteId(remaining[0]?.id || '');
  };

  const handleCreateNote = () => {
    const newId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      title: 'New Note',
      content: `# New Note\n\nBegin typing Markdown here...`,
      tags: ['draft'],
      isPinned: false,
      isArchived: false,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      syncStatus: 'saved_locally',
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setEditorMode('write');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stack-bg font-sans text-stack-bone">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <AppSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          syncState={syncState}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80">
          <div className="w-80 max-w-[85vw] h-full shadow-2xl">
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
              onOpenCommandPalette={() => {
                setIsCommandPaletteOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              syncState={syncState}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>
          <div
            className="flex-1"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden bg-stack-bg">
        <AppHeader
          title={activeNote?.title || ''}
          onTitleChange={handleTitleChange}
          tags={activeNote?.tags || []}
          isPinned={activeNote?.isPinned || false}
          onTogglePin={handleTogglePin}
          onDeleteNote={handleDeleteNote}
          editorMode={editorMode}
          onModeChange={setEditorMode}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          syncState={syncState}
          wordCount={wordCount}
          charCount={charCount}
        />

        {/* Workspace Body depending on mode */}
        <div className="flex-1 flex overflow-hidden">
          {/* Write Mode */}
          {editorMode === 'write' && (
            <div className="flex-1 h-full overflow-hidden">
              <CodeMirrorEditor
                value={activeNote?.content || ''}
                onChange={handleContentChange}
              />
            </div>
          )}

          {/* Split Mode: CodeMirror on left, rendered preview on right */}
          {editorMode === 'split' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              <div className="flex-1 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-stack-metal/70 overflow-hidden">
                <CodeMirrorEditor
                  value={activeNote?.content || ''}
                  onChange={handleContentChange}
                />
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
      />
    </div>
  );
}
