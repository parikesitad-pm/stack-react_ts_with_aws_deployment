import { useState } from 'react';
import {
  Undo,
  Redo,
  Save,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  CloudOff,
} from 'lucide-react';
import type { SaveState } from '../types/editor.types';

export interface EditorStickyActionsProps {
  saveState: SaveState;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onCopyAll: () => Promise<boolean>;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
  className?: string;
}

export function EditorStickyActions({
  saveState,
  onUndo,
  onRedo,
  onSave,
  onCopyAll,
  canUndo = true,
  canRedo = true,
  disabled = false,
  className = '',
}: EditorStickyActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopyAll();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderStatusBadge = () => {
    switch (saveState.status) {
      case 'saving-local':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stack-steel animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin text-stack-silver" />
            <span className="hidden sm:inline">Saving locally…</span>
          </span>
        );
      case 'saved-local':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Saved locally</span>
          </span>
        );
      case 'offline-local':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <CloudOff className="h-3 w-3 text-amber-400" />
            <span className="hidden sm:inline">Offline — saved locally</span>
          </span>
        );
      case 'local-error':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-mono text-red-400 font-bold"
            title={saveState.error}
          >
            <AlertCircle className="h-3 w-3 text-red-400" />
            <span>Couldn't save locally</span>
          </span>
        );
      case 'dirty':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-stack-steel/80">
            <span className="h-1.5 w-1.5 rounded-full bg-stack-steel" />
            <span className="hidden sm:inline">Unsaved</span>
          </span>
        );
      case 'idle':
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center gap-1 bg-stack-surface-raised/90 backdrop-blur-xs border border-stack-metal/80 rounded px-1.5 py-1 shadow-md select-none font-mono text-xs ${className}`}
    >
      {/* Truthful Save Status Indicator */}
      <div className="mr-1 px-1 flex items-center" aria-live="polite">
        {renderStatusBadge()}
      </div>

      <div className="h-3.5 w-px bg-stack-metal/60 mx-0.5" />

      {/* Undo */}
      <button
        type="button"
        disabled={disabled || !canUndo}
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>

      {/* Redo */}
      <button
        type="button"
        disabled={disabled || !canRedo}
        onClick={onRedo}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>

      <div className="h-3.5 w-px bg-stack-metal/60 mx-0.5" />

      {/* Explicit Save */}
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        title="Save (Ctrl+S)"
        aria-label="Save document"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/50 transition-colors text-[11px]"
      >
        <Save className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Save</span>
      </button>

      {/* Copy All Raw Markdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleCopy}
        title="Copy all raw Markdown"
        aria-label="Copy all raw Markdown"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/50 transition-colors text-[11px]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Copy all</span>
          </>
        )}
      </button>
    </div>
  );
}
