import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Code,
  SquareCode,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Minus,
} from 'lucide-react';
import type { ActiveFormattingState, MarkdownCommand } from '../types/editor.types';

export interface MarkdownToolbarProps {
  onExecuteCommand: (command: MarkdownCommand) => void;
  activeFormatting?: ActiveFormattingState;
  disabled?: boolean;
  className?: string;
}

interface ToolbarItem {
  id: MarkdownCommand;
  label: string;
  icon: typeof Bold;
  shortcut?: string;
  isActive?: (active: ActiveFormattingState) => boolean;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    id: 'heading-1',
    label: 'Heading 1',
    icon: Heading1,
    shortcut: '#',
    isActive: (a) => a.heading1,
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    icon: Heading2,
    shortcut: '##',
    isActive: (a) => a.heading2,
  },
  {
    id: 'bold',
    label: 'Bold',
    icon: Bold,
    shortcut: 'Ctrl+B',
    isActive: (a) => a.bold,
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: Italic,
    shortcut: 'Ctrl+I',
    isActive: (a) => a.italic,
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    icon: Strikethrough,
    shortcut: '~~',
    isActive: (a) => a.strikethrough,
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: Quote,
    shortcut: '>',
    isActive: (a) => a.quote,
  },
  {
    id: 'inline-code',
    label: 'Inline Code',
    icon: Code,
    shortcut: '`',
    isActive: (a) => a.inlineCode,
  },
  {
    id: 'code-block',
    label: 'Code Block',
    icon: SquareCode,
    shortcut: '```',
    isActive: (a) => a.codeBlock,
  },
  {
    id: 'bullet-list',
    label: 'Bulleted List',
    icon: List,
    shortcut: '-',
    isActive: (a) => a.bulletList,
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    icon: ListOrdered,
    shortcut: '1.',
    isActive: (a) => a.numberedList,
  },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: CheckSquare,
    shortcut: '- [ ]',
    isActive: (a) => a.checklist,
  },
  {
    id: 'link',
    label: 'Link',
    icon: LinkIcon,
    shortcut: 'Ctrl+K',
  },
  {
    id: 'image',
    label: 'Image Markdown',
    icon: ImageIcon,
    shortcut: '![',
  },
  {
    id: 'table',
    label: 'Table',
    icon: Table,
  },
  {
    id: 'horizontal-rule',
    label: 'Divider',
    icon: Minus,
    shortcut: '---',
  },
];

export function MarkdownToolbar({
  onExecuteCommand,
  activeFormatting = {
    bold: false,
    italic: false,
    strikethrough: false,
    inlineCode: false,
    codeBlock: false,
    quote: false,
    bulletList: false,
    numberedList: false,
    checklist: false,
    heading1: false,
    heading2: false,
  },
  disabled = false,
  className = '',
}: MarkdownToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Markdown formatting toolbar"
      className={`flex items-center gap-0.5 px-2 py-1 bg-stack-surface border-b border-stack-metal/70 overflow-x-auto no-scrollbar select-none shrink-0 ${className}`}
    >
      {TOOLBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.isActive ? item.isActive(activeFormatting) : false;
        const tooltip = item.shortcut ? `${item.label} (${item.shortcut})` : item.label;

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onExecuteCommand(item.id)}
            title={tooltip}
            aria-label={tooltip}
            aria-pressed={active}
            className={`flex items-center justify-center p-1.5 rounded transition-colors ${
              active
                ? 'bg-stack-metal text-stack-bone border border-stack-steel/50 shadow-xs'
                : 'text-stack-steel hover:text-stack-bone hover:bg-stack-metal/40 border border-transparent'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
