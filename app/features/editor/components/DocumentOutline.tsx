import { useMemo } from 'react';
import { List, Hash, ChevronRight } from 'lucide-react';

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  line: number;
}

interface DocumentOutlineProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectHeading?: (text: string) => void;
}

export function DocumentOutline({
  content,
  isOpen,
  onClose,
  onSelectHeading,
}: DocumentOutlineProps) {
  const headings = useMemo<HeadingItem[]>(() => {
    const lines = content.split(/\r?\n/);
    const result: HeadingItem[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match && match[1] && match[2]) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[#*`_]/g, '');
        result.push({
          id: `heading-${idx}-${text.toLowerCase().replace(/\s+/g, '-')}`,
          level,
          text,
          line: idx + 1,
        });
      }
    });

    return result;
  }, [content]);

  if (!isOpen) return null;

  return (
    <div className="w-56 border-l border-stack-metal/70 bg-stack-surface-raised/95 backdrop-blur-sm p-3 font-mono text-xs flex flex-col shrink-0 select-none animate-fade-in">
      <div className="flex items-center justify-between border-b border-stack-metal/60 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-stack-bone font-bold text-[11px]">
          <List className="w-3.5 h-3.5 text-stack-red-hover" />
          <span>OUTLINE ({headings.length})</span>
        </div>
        <button
          onClick={onClose}
          className="text-stack-steel hover:text-stack-bone text-[11px]"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {headings.length === 0 ? (
          <p className="text-[10px] text-stack-steel py-4 text-center">
            No headings found. Add #, ##, or ### to structure your notes.
          </p>
        ) : (
          headings.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelectHeading?.(h.text)}
              className={`flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded hover:bg-stack-metal/40 transition-colors group ${
                h.level === 1
                  ? 'text-stack-bone font-bold'
                  : h.level === 2
                    ? 'text-stack-silver pl-3 text-[11px]'
                    : 'text-stack-steel pl-5 text-[10px]'
              }`}
            >
              <Hash className="w-3 h-3 text-stack-steel group-hover:text-stack-red-hover shrink-0" />
              <span className="truncate">{h.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
