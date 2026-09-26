import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { keymap } from '@codemirror/view';

export interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
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

export function CodeMirrorEditor({
  value,
  onChange,
  className = '',
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        industrialTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
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
  }, []);

  // Update doc if changed externally (e.g. switching active note)
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
}
