import { Pin } from 'lucide-react';
import { Badge } from '~/components/atoms/Badge';

export interface NoteItemData {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags: string[];
  isPinned?: boolean;
}

export interface NoteListItemProps {
  note: NoteItemData;
  isActive: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export function NoteListItem({
  note,
  isActive,
  onSelect,
  className = '',
}: NoteListItemProps) {
  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`group relative flex flex-col gap-1.5 rounded border p-2.5 transition-all cursor-pointer select-none text-left ${
        isActive
          ? 'border-stack-steel/50 bg-stack-surface-raised shadow-inner'
          : 'border-stack-metal/30 bg-stack-surface/60 hover:border-stack-metal/80 hover:bg-stack-surface'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-mono text-xs font-semibold truncate ${
            isActive
              ? 'text-stack-bone'
              : 'text-stack-silver group-hover:text-stack-bone'
          }`}
        >
          {note.title || 'Untitled Note'}
        </h3>
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
