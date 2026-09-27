import { useState } from 'react';
import { Tag as TagIcon, ChevronRight, ChevronDown } from 'lucide-react';
import type { TagSummary } from '../services/tag.service';

export interface TagListProps {
  tags: TagSummary[];
  activeFilter: string;
  onSelectTag: (tag: string) => void;
  className?: string;
}

export function TagList({
  tags,
  activeFilter,
  onSelectTag,
  className = '',
}: TagListProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`py-1 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-1 text-[11px] font-mono tracking-wider text-stack-steel uppercase hover:text-stack-silver transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <TagIcon className="h-3 w-3" />
          <span>Tags</span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-0.5 px-2">
          {tags.map(({ tag, count }) => {
            const isSelected = activeFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(tag)}
                className={`flex items-center justify-between w-full px-2 py-1 rounded text-xs font-mono transition-colors ${
                  isSelected
                    ? 'bg-stack-metal text-stack-bone font-medium'
                    : 'text-stack-silver hover:bg-stack-metal/40 hover:text-stack-bone'
                }`}
              >
                <span className="truncate">#{tag}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-stack-surface text-stack-bone'
                      : 'bg-stack-metal/60 text-stack-steel'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
