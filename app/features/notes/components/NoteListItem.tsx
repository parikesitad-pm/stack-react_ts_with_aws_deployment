import { useEffect, useRef, useState } from 'react';
import { Pin, GripVertical } from 'lucide-react';
import { Badge } from '~/components/atoms/Badge';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export interface NoteItemData {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags: string[];
  isPinned?: boolean;
  folderId?: string | null;
}

export interface NoteListItemProps {
  note: NoteItemData;
  isActive: boolean;
  onSelect: (id: string) => void;
  onReorderNote?: (sourceNoteId: string, targetNoteId: string) => void;
  className?: string;
}

export function NoteListItem({
  note,
  isActive,
  onSelect,
  onReorderNote,
  className = '',
}: NoteListItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source }) => {
        setIsDraggedOver(false);
        if (source.data.type === 'note' && onReorderNote) {
          onReorderNote(source.data.noteId as string, note.id);
        }
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [note.id, onReorderNote]);

  return (
    <div
      ref={ref}
      onClick={() => onSelect(note.id)}
      className={`group relative flex flex-col gap-1.5 rounded border p-2.5 transition-all cursor-pointer select-none text-left ${
        isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
      } ${
        isDraggedOver
          ? 'border-stack-silver bg-stack-metal/40 shadow-md ring-1 ring-stack-silver/50'
          : isActive
            ? 'border-stack-steel/50 bg-stack-surface-raised shadow-inner'
            : 'border-stack-metal/30 bg-stack-surface/60 hover:border-stack-metal/80 hover:bg-stack-surface'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="h-3 w-3 text-stack-steel/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab active:cursor-grabbing" />
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
        {note.isPinned && (
          <Pin className="h-3 w-3 shrink-0 text-stack-red-hover rotate-45" />
        )}
      </div>

      <p className="line-clamp-2 font-mono text-[11px] leading-relaxed text-stack-steel">
        {note.excerpt}
      </p>

      <div className="mt-1 flex items-center justify-between gap-1.5 pt-1 border-t border-stack-metal/20">
        <span className="font-mono text-[10px] text-stack-steel/70">
          {note.updatedAt}
        </span>
        <div className="flex items-center gap-1 overflow-hidden">
          {note.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant={isActive ? 'active' : 'default'}>
              #{tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="font-mono text-[10px] text-stack-steel">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
