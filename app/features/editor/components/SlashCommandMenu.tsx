import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Heading1,
  Heading2,
  Quote,
  SquareCode,
  CheckSquare,
  List,
  ListOrdered,
  Table,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
} from 'lucide-react';
import type { MarkdownCommand, SlashCommandItem, SlashContext } from '../types/editor.types';

export interface SlashCommandMenuProps {
  context: SlashContext | null;
  onSelectCommand: (command: MarkdownCommand, context: SlashContext) => void;
  onClose: () => void;
}

const COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'heading-1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'Heading1',
    shortcut: '#',
    keywords: ['heading', 'h1', 'title', 'large'],
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    description: 'Medium sub-section heading',
    icon: 'Heading2',
    shortcut: '##',
    keywords: ['heading', 'h2', 'subtitle', 'section'],
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Blockquote callout',
    icon: 'Quote',
    shortcut: '>',
    keywords: ['quote', 'blockquote', 'callout'],
  },
  {
    id: 'code-block',
    label: 'Code block',
    description: 'Fenced code snippet',
    icon: 'SquareCode',
    shortcut: '```',
    keywords: ['code', 'block', 'snippet', 'syntax'],
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Interactive todo item',
    icon: 'CheckSquare',
    shortcut: '- [ ]',
    keywords: ['check', 'todo', 'task', 'list'],
  },
  {
    id: 'bullet-list',
    label: 'Bulleted list',
    description: 'Simple bulleted list',
    icon: 'List',
    shortcut: '-',
    keywords: ['bullet', 'list', 'unordered'],
  },
  {
    id: 'numbered-list',
    label: 'Numbered list',
    description: 'Ordered sequence list',
    icon: 'ListOrdered',
    shortcut: '1.',
    keywords: ['number', 'ordered', 'sequence', 'list'],
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Markdown data table',
    icon: 'Table',
    keywords: ['table', 'grid', 'columns', 'rows'],
  },
  {
    id: 'link',
    label: 'Link',
    description: 'Hyperlink to external or internal resource',
    icon: 'LinkIcon',
    shortcut: 'Ctrl+K',
    keywords: ['link', 'url', 'href'],
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Markdown image syntax',
    icon: 'ImageIcon',
    keywords: ['image', 'photo', 'picture', 'figure'],
  },
  {
    id: 'horizontal-rule',
    label: 'Divider',
    description: 'Horizontal divider rule',
    icon: 'Minus',
    shortcut: '---',
    keywords: ['divider', 'hr', 'line', 'separator'],
  },
];

const ICON_MAP = {
  Heading1,
  Heading2,
  Quote,
  SquareCode,
  CheckSquare,
  List,
  ListOrdered,
  Table,
  LinkIcon,
  ImageIcon,
  Minus,
};

export function SlashCommandMenu({
  context,
  onSelectCommand,
  onClose,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const query = context?.query.toLowerCase().trim() ?? '';

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    if (!query) return true;
    return (
      item.label.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.keywords.some((k) => k.includes(query))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: SlashCommandItem) => {
      if (context) {
        onSelectCommand(item.id, context);
      }
    },
    [context, onSelectCommand]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!context) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredItems.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const target = filteredItems[selectedIndex] ?? filteredItems[0];
          if (target) handleSelect(target);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [context, filteredItems, selectedIndex, handleSelect, onClose]);

  if (!context || filteredItems.length === 0) {
    return null;
  }

  // Calculate coordinates with viewport clamping
  const coords = context.coords;
  let top = coords ? coords.bottom + 6 : 100;
  let left = coords ? coords.left : 40;

  // Viewport clamping
  if (typeof window !== 'undefined') {
    const menuWidth = 260;
    const menuHeight = 280;
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12);
    }
    if (top + menuHeight > window.innerHeight - 12 && coords) {
      top = Math.max(12, coords.top - menuHeight - 6);
    }
  }

  return (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Slash commands"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
      }}
      className="z-50 w-64 max-h-72 overflow-y-auto rounded bg-stack-surface-raised border border-stack-metal shadow-2xl p-1 font-mono text-xs text-stack-bone animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2 py-1 text-[10px] text-stack-steel tracking-wider uppercase border-b border-stack-metal/40 mb-1">
        Commands {query ? `matching "/${query}"` : ''}
      </div>

      <div className="space-y-0.5">
        {filteredItems.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? Minus;

          return (
            <button
              key={item.id}
              role="option"
              aria-selected={isSelected}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-stack-metal text-stack-bone font-medium'
                  : 'text-stack-silver hover:bg-stack-metal/50 hover:text-stack-bone'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 text-stack-steel shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] text-stack-steel/80 truncate">
                    {item.description}
                  </span>
                </div>
              </div>

              {item.shortcut && (
                <span className="text-[9px] text-stack-steel font-mono px-1 py-0.5 rounded bg-stack-surface border border-stack-metal shrink-0">
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
