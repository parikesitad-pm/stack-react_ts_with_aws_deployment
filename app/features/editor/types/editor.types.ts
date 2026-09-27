import type { ReactNode } from 'react';

export type MarkdownCommand =
  | 'heading-1'
  | 'heading-2'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'quote'
  | 'inline-code'
  | 'code-block'
  | 'link'
  | 'image'
  | 'table'
  | 'checklist'
  | 'bullet-list'
  | 'numbered-list'
  | 'horizontal-rule';

export type SaveState =
  | { status: 'idle' }
  | { status: 'dirty' }
  | { status: 'saving-local' }
  | { status: 'saved-local'; savedAt: string }
  | { status: 'offline-local'; savedAt: string }
  | { status: 'local-error'; error: string };

export interface ActiveFormattingState {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  inlineCode: boolean;
  codeBlock: boolean;
  quote: boolean;
  bulletList: boolean;
  numberedList: boolean;
  checklist: boolean;
  heading1: boolean;
  heading2: boolean;
}

export interface SlashCommandItem {
  id: MarkdownCommand;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  keywords: string[];
}

export interface SlashContext {
  query: string;
  from: number;
  to: number;
  coords: { left: number; top: number; bottom: number } | null;
}
