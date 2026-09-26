import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Plus,
  Moon,
  Settings,
  Monitor,
  Shield,
  X,
} from 'lucide-react';
import { Kbd } from '~/components/atoms/Kbd';
import type { Note } from '~/features/notes/types/note.types';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onOpenSettings: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
  onOpenSettings,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/75 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-xl rounded-lg border border-stack-metal bg-stack-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center px-4 py-3 border-b border-stack-metal/80 bg-stack-surface-raised">
          <Search className="h-4 w-4 text-stack-steel mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search notes..."
            className="w-full bg-transparent font-mono text-sm text-stack-bone placeholder:text-stack-steel focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-stack-steel hover:text-stack-bone p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-stack-steel">
            Quick Actions
          </div>
          <button
            onClick={() => {
              onCreateNote();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-left font-mono text-xs text-stack-silver hover:bg-stack-surface-raised hover:text-stack-bone transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="h-3.5 w-3.5 text-stack-red-hover" />
              <span>Create new blank note</span>
            </div>
            <Kbd>Ctrl+N</Kbd>
          </button>
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded text-left font-mono text-xs text-stack-silver hover:bg-stack-surface-raised hover:text-stack-bone transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="h-3.5 w-3.5 text-stack-steel" />
              <span>Open System Settings</span>
            </div>
            <Kbd>Ctrl+,</Kbd>
          </button>

          <div className="px-2 pt-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-stack-steel">
            Notes ({filteredNotes.length})
          </div>
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                onSelectNote(note.id);
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-left font-mono text-xs text-stack-bone hover:bg-stack-surface-raised transition-colors group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="h-3.5 w-3.5 text-stack-steel group-hover:text-stack-silver shrink-0" />
                <span className="truncate">{note.title || 'Untitled'}</span>
              </div>
              <span className="text-[10px] text-stack-steel shrink-0 ml-2">
                {note.updatedAt}
              </span>
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="px-4 py-6 text-center font-mono text-xs text-stack-steel">
              No matching notes found.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-stack-metal/60 bg-stack-bg font-mono text-[10px] text-stack-steel">
          <span>Navigate with arrows</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
