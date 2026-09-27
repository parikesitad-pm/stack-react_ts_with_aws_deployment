import { useEffect, useRef, useState } from 'react';
import {
  Pin,
  GripVertical,
  MoreVertical,
  FolderInput,
  Archive,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export interface NoteItemData {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string | number;
  tags: string[];
  isPinned?: boolean;
  folderId?: string | null;
  archivedAt?: string | number | null;
  deletedAt?: string | number | null;
}

export interface NoteListItemProps {
  note: NoteItemData;
  isActive: boolean;
  onSelect: (id: string) => void;
  onReorderNote?: (
    sourceNoteId: string,
    targetNoteId: string,
    edge: 'before' | 'after'
  ) => void;
  onMoveTo?: (note: NoteItemData) => void;
  onTogglePin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  isArchivedView?: boolean;
  isTrashView?: boolean;
  className?: string;
}

export function NoteListItem({
  note,
  isActive,
  onSelect,
  onReorderNote,
  onMoveTo,
  onTogglePin,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onPermanentDelete,
  isArchivedView = false,
  isTrashView = false,
  className = '',
}: NoteListItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropEdge, setDropEdge] = useState<'before' | 'after' | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showMenu]);

  useEffect(() => {
    const el = ref.current;
    if (!el || isTrashView) return;

    const cleanupDraggable = draggable({
      element: el,
      getInitialData: () => ({ type: 'note', noteId: note.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDropTarget = dropTargetForElements({
      element: el,
      getData: () => ({ type: 'note', noteId: note.id }),
      canDrop: ({ source }) => {
        const data = source.data;
        return data.type === 'note' && data.noteId !== note.id;
      },
      onDragEnter: ({ location }) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setDropEdge(location.current.input.clientY < midY ? 'before' : 'after');
      },
      onDrag: ({ location }) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setDropEdge(location.current.input.clientY < midY ? 'before' : 'after');
      },
      onDragLeave: () => setDropEdge(null),
      onDrop: ({ source, location }) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const edge = location.current.input.clientY < midY ? 'before' : 'after';
        setDropEdge(null);
        if (source.data.type === 'note' && onReorderNote) {
          onReorderNote(source.data.noteId as string, note.id, edge);
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [note.id, onReorderNote, isTrashView]);

  return (
    <div
      ref={ref}
      onClick={() => onSelect(note.id)}
      className={`group relative flex flex-col gap-1.5 rounded border p-2.5 transition-all cursor-pointer select-none text-left ${
        isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
      } ${
        isActive
          ? 'border-stack-steel/50 bg-stack-surface-raised shadow-inner'
          : 'border-stack-metal/30 bg-stack-surface/60 hover:border-stack-metal/80 hover:bg-stack-surface'
      } ${className}`}
    >
      {/* Explicit visual drop indicators for Pragmatic Drag and Drop */}
      {dropEdge === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-stack-red-slate shadow-sm z-30 pointer-events-none" />
      )}
      {dropEdge === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stack-red-slate shadow-sm z-30 pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {!isTrashView && (
            <GripVertical className="h-3 w-3 text-stack-steel/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab active:cursor-grabbing" />
          )}
          <h3
            className={`font-mono text-xs font-semibold truncate ${
              isActive
                ? 'text-stack-bone'
                : 'text-stack-silver group-hover:text-stack-bone'
            }`}
          >
            {note.title || 'Untitled Note'}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {note.isPinned && !isTrashView && (
            <Pin className="h-3 w-3 text-stack-red-hover rotate-45" />
          )}

          {/* Action Menu (Accessible Touch & Keyboard alternative) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              title="Note actions"
              className="p-1 rounded text-stack-steel opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-stack-bone hover:bg-stack-metal transition-opacity"
            >
              <MoreVertical className="h-3 w-3" />
            </button>

            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 rounded bg-stack-surface-raised border border-stack-metal shadow-xl py-1 z-40 text-xs font-mono"
              >
                {!isTrashView && onMoveTo && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onMoveTo(note);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <FolderInput className="h-3 w-3" />
                    <span>Move to…</span>
                  </button>
                )}

                {!isTrashView && onTogglePin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <Pin className="h-3 w-3" />
                    <span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                )}

                {!isTrashView && !isArchivedView && onArchive && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onArchive(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <Archive className="h-3 w-3" />
                    <span>Archive</span>
                  </button>
                )}

                {!isTrashView && isArchivedView && onUnarchive && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onUnarchive(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Unarchive</span>
                  </button>
                )}

                {!isTrashView && onTrash && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onTrash(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-red-400 hover:bg-stack-metal"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Move to Trash</span>
                  </button>
                )}

                {isTrashView && onRestore && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onRestore(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                )}

                {isTrashView && onPermanentDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onPermanentDelete(note.id);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1 text-left text-red-400 hover:bg-stack-metal"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete Forever</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {note.excerpt && (
        <p className="line-clamp-2 font-mono text-[11px] text-stack-steel/80 leading-relaxed">
          {note.excerpt}
        </p>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {note.tags.map((t) => (
            <span
              key={t}
              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stack-metal/40 text-stack-steel border border-stack-metal/30"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
