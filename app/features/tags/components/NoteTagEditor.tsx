import { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, X, Plus } from 'lucide-react';
import { tagService } from '../services/tag.service';

export interface NoteTagEditorProps {
  tags: string[];
  allKnownTags?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  readOnly?: boolean;
}

export function NoteTagEditor({
  tags,
  allKnownTags = [],
  onAddTag,
  onRemoveTag,
  readOnly = false,
}: NoteTagEditorProps) {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isInputOpen) {
      inputRef.current?.focus();
    }
  }, [isInputOpen]);

  const handleAdd = () => {
    const raw = inputValue.trim();
    if (!raw) {
      setIsInputOpen(false);
      setValidationError(null);
      return;
    }

    const validation = tagService.validateTag(raw);
    if (!validation.valid) {
      setValidationError(validation.error ?? 'Invalid tag');
      return;
    }

    onAddTag(validation.normalized);
    setInputValue('');
    setValidationError(null);
    setIsInputOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsInputOpen(false);
      setInputValue('');
      setValidationError(null);
    }
  };

  const suggestions = allKnownTags.filter(
    (known) =>
      inputValue &&
      known.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((t) => t.toLowerCase() === known.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 px-1 text-xs font-mono">
      <div className="flex items-center gap-1 text-stack-steel mr-1">
        <TagIcon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wider">Tags:</span>
      </div>

      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stack-metal/60 text-stack-bone border border-stack-metal hover:border-stack-steel/40 transition-colors"
        >
          <span>#{tag}</span>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              title={`Remove tag #${tag}`}
              className="text-stack-steel hover:text-stack-red-hover p-0.5 rounded transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}

      {!readOnly && (
        <div className="relative inline-flex items-center">
          {isInputOpen ? (
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setValidationError(null);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleAdd}
                placeholder="tag-name"
                maxLength={40}
                className="w-24 px-1.5 py-0.5 rounded bg-stack-surface border border-stack-silver/50 text-stack-bone placeholder:text-stack-steel/50 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stack-silver"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 bg-stack-surface-raised border border-stack-metal rounded shadow-lg z-20 max-h-28 overflow-y-auto w-32 py-1">
                  {suggestions.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onAddTag(s);
                        setInputValue('');
                        setIsInputOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-stack-silver hover:bg-stack-metal hover:text-stack-bone"
                    >
                      #{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsInputOpen(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/40 border border-dashed border-stack-metal/60 transition-colors text-[11px]"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>Add tag</span>
            </button>
          )}
        </div>
      )}

      {validationError && (
        <span className="text-[10px] text-stack-red-hover">{validationError}</span>
      )}
    </div>
  );
}
