import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  keymap,
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import {
  defaultKeymap,
  history,
  historyKeymap,
  undo as cmUndo,
  redo as cmRedo,
} from '@codemirror/commands';
import { markdownCommandService } from '../services/markdownCommand.service';
import type {
  ActiveFormattingState,
  MarkdownCommand,
  SlashContext,
} from '../types/editor.types';

export interface CodeMirrorEditorHandle {
  executeCommand: (command: MarkdownCommand) => void;
  undo: () => void;
  redo: () => void;
  getRawMarkdown: () => string;
  focus: () => void;
  replaceSlashQuery: (
    from: number,
    to: number,
    command: MarkdownCommand
  ) => void;
  insertText: (text: string) => void;
}

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onActiveFormattingChange?: (formatting: ActiveFormattingState) => void;
  onSlashContextChange?: (context: SlashContext | null) => void;
  onFilesPaste?: (files: File[]) => void;
  onFilesDrop?: (files: File[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  className?: string;
}

const industrialTheme = EditorView.theme(
  {
    '&': {
      color: '#E7E5E1',
      backgroundColor: '#090A0B',
      height: '100%',
      fontSize: '13px',
      fontFamily:
        'ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
    },
    '.cm-content': {
      caretColor: '#C4C7CA',
      padding: '16px 20px',
      lineHeight: '1.7',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#C4C7CA',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: '#51282C !important',
    },
    '.cm-gutters': {
      backgroundColor: '#090A0B',
      color: '#727981',
      borderRight: '1px solid #32373D',
      paddingRight: '8px',
    },
    '.cm-activeLine': {
      backgroundColor: '#111315',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#111315',
      color: '#C4C7CA',
    },
  },
  { dark: true }
);

export const CodeMirrorEditor = forwardRef<
  CodeMirrorEditorHandle,
  CodeMirrorEditorProps
>(function CodeMirrorEditor(
  {
    value,
    onChange,
    onSave,
    onActiveFormattingChange,
    onSlashContextChange,
    onFilesPaste,
    onFilesDrop,
    onDragStateChange,
    className = '',
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Keep callback refs fresh without resetting CodeMirror instance
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const onActiveFormattingChangeRef = useRef(onActiveFormattingChange);
  onActiveFormattingChangeRef.current = onActiveFormattingChange;

  const onSlashContextChangeRef = useRef(onSlashContextChange);
  onSlashContextChangeRef.current = onSlashContextChange;

  const onFilesPasteRef = useRef(onFilesPaste);
  onFilesPasteRef.current = onFilesPaste;

  const onFilesDropRef = useRef(onFilesDrop);
  onFilesDropRef.current = onFilesDrop;

  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;

  useImperativeHandle(
    ref,
    () => ({
      executeCommand(command: MarkdownCommand) {
        if (viewRef.current) {
          markdownCommandService.execute(viewRef.current, command);
          onActiveFormattingChangeRef.current?.(
            markdownCommandService.detectActiveFormatting(viewRef.current)
          );
        }
      },
      undo() {
        if (viewRef.current) {
          cmUndo(viewRef.current);
        }
      },
      redo() {
        if (viewRef.current) {
          cmRedo(viewRef.current);
        }
      },
      getRawMarkdown() {
        return viewRef.current?.state.doc.toString() ?? value;
      },
      focus() {
        viewRef.current?.focus();
      },
      replaceSlashQuery(from: number, to: number, command: MarkdownCommand) {
        const view = viewRef.current;
        if (!view) return;

        // Delete the /query text
        view.dispatch({
          changes: { from, to, insert: '' },
          selection: { anchor: from },
        });

        // Execute the markdown command at the cleared position
        markdownCommandService.execute(view, command);
      },
      insertText(text: string) {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
      },
    }),
    [value]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Check slash commands on cursor / document change
    const checkSlashContext = (view: EditorView) => {
      const { from, empty } = view.state.selection.main;
      if (!empty) {
        onSlashContextChangeRef.current?.(null);
        return;
      }

      const line = view.state.doc.lineAt(from);
      const textBefore = line.text.slice(0, from - line.from);

      // Match / only at start of line or after leading whitespace at block start
      const match = textBefore.match(/^(\s*)\/([a-zA-Z0-9_-]*)$/);

      if (match) {
        const whitespace = match[1] ?? '';
        const query = match[2] ?? '';
        const slashPos = line.from + whitespace.length;
        const coords = view.coordsAtPos(from);

        onSlashContextChangeRef.current?.({
          query,
          from: slashPos,
          to: from,
          coords,
        });
      } else {
        onSlashContextChangeRef.current?.(null);
      }
    };

    const editorKeymaps = [
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true; // Prevent browser default save page
        },
      },
      {
        key: 'Mod-b',
        run: (v: EditorView) => {
          markdownCommandService.execute(v, 'bold');
          onActiveFormattingChangeRef.current?.(
            markdownCommandService.detectActiveFormatting(v)
          );
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: (v: EditorView) => {
          markdownCommandService.execute(v, 'italic');
          onActiveFormattingChangeRef.current?.(
            markdownCommandService.detectActiveFormatting(v)
          );
          return true;
        },
      },
      {
        key: 'Mod-k',
        run: (v: EditorView) => {
          markdownCommandService.execute(v, 'link');
          return true;
        },
      },
    ];

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        keymap.of([...editorKeymaps, ...defaultKeymap, ...historyKeymap]),
        markdown(),
        industrialTheme,
        EditorView.domEventHandlers({
          paste(event) {
            const items = event.clipboardData?.items;
            const files: File[] = [];
            if (items) {
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item && item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) files.push(file);
                }
              }
            }
            if (files.length > 0) {
              event.preventDefault();
              onFilesPasteRef.current?.(files);
              return true;
            }
            return false;
          },
          dragover(event) {
            if (event.dataTransfer?.types?.includes('Files')) {
              event.preventDefault();
              onDragStateChangeRef.current?.(true);
              return true;
            }
            return false;
          },
          dragleave() {
            onDragStateChangeRef.current?.(false);
            return false;
          },
          drop(event) {
            if (
              event.dataTransfer?.files &&
              event.dataTransfer.files.length > 0
            ) {
              event.preventDefault();
              const files = Array.from(event.dataTransfer.files);
              onDragStateChangeRef.current?.(false);
              onFilesDropRef.current?.(files);
              return true;
            }
            return false;
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.docChanged || update.selectionSet) {
            onActiveFormattingChangeRef.current?.(
              markdownCommandService.detectActiveFormatting(update.view)
            );
            checkSlashContext(update.view);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []); // Initialized once per mount

  // Controlled update: synchronize external value when active note changes
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== value) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value },
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden font-mono ${className}`}
    />
  );
});
