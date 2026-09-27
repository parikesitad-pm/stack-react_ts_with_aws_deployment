import type { EditorView } from '@codemirror/view';
import type { ActiveFormattingState, MarkdownCommand } from '../types/editor.types';

export const markdownCommandService = {
  /**
   * Execute a markdown formatting command on the given CodeMirror EditorView.
   */
  execute(view: EditorView, command: MarkdownCommand): void {
    const { from, to, empty } = view.state.selection.main;
    const doc = view.state.doc;

    switch (command) {
      case 'bold':
        this.toggleWrap(view, '**', 'text');
        break;

      case 'italic':
        this.toggleWrap(view, '*', 'text');
        break;

      case 'strikethrough':
        this.toggleWrap(view, '~~', 'text');
        break;

      case 'inline-code': {
        const text = doc.sliceString(from, to);
        if (text.includes('\n')) {
          this.execute(view, 'code-block');
        } else {
          this.toggleWrap(view, '`', 'code');
        }
        break;
      }

      case 'code-block': {
        const text = empty ? 'code' : doc.sliceString(from, to);
        const replacement = `\n\`\`\`text\n${text}\n\`\`\`\n`;
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: {
            anchor: from + 9, // cursor right at start of code content
            head: from + 9 + text.length,
          },
        });
        view.focus?.();
        break;
      }

      case 'heading-1':
        this.toggleHeading(view, 1);
        break;

      case 'heading-2':
        this.toggleHeading(view, 2);
        break;

      case 'quote':
        this.togglePrefix(view, '> ');
        break;

      case 'bullet-list':
        this.togglePrefix(view, '- ');
        break;

      case 'numbered-list':
        this.toggleNumberedList(view);
        break;

      case 'checklist':
        this.togglePrefix(view, '- [ ] ');
        break;

      case 'link': {
        if (empty) {
          const replacement = '[link text](url)';
          view.dispatch({
            changes: { from, to, insert: replacement },
            selection: { anchor: from + 1, head: from + 10 }, // selects 'link text'
          });
        } else {
          const selected = doc.sliceString(from, to);
          const replacement = `[${selected}](url)`;
          view.dispatch({
            changes: { from, to, insert: replacement },
            selection: {
              anchor: from + selected.length + 3,
              head: from + selected.length + 6, // selects 'url'
            },
          });
        }
        view.focus?.();
        break;
      }

      case 'image': {
        if (empty) {
          const replacement = '![alt text](url)';
          view.dispatch({
            changes: { from, to, insert: replacement },
            selection: { anchor: from + 2, head: from + 10 }, // selects 'alt text'
          });
        } else {
          const selected = doc.sliceString(from, to);
          const replacement = `![${selected}](url)`;
          view.dispatch({
            changes: { from, to, insert: replacement },
            selection: {
              anchor: from + selected.length + 4,
              head: from + selected.length + 7, // selects 'url'
            },
          });
        }
        view.focus?.();
        break;
      }

      case 'table': {
        const line = doc.lineAt(from);
        const prefix = line.text.trim().length === 0 ? '' : '\n\n';
        const tableTemplate = `${prefix}| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n`;
        view.dispatch({
          changes: { from, to, insert: tableTemplate },
          selection: { anchor: from + tableTemplate.length },
        });
        view.focus?.();
        break;
      }

      case 'horizontal-rule': {
        const line = doc.lineAt(from);
        const prefix = line.text.trim().length === 0 ? '' : '\n';
        const hr = `${prefix}\n---\n\n`;
        view.dispatch({
          changes: { from, to, insert: hr },
          selection: { anchor: from + hr.length },
        });
        view.focus?.();
        break;
      }
    }
  },

  /**
   * Toggle inline wrapping such as **bold**, *italic*, ~~strikethrough~~, `code`.
   */
  toggleWrap(view: EditorView, marker: string, placeholder: string): void {
    const { from, to, empty } = view.state.selection.main;
    const doc = view.state.doc;
    const mLen = marker.length;

    if (empty) {
      // Check if cursor is right inside markers: e.g. **|**
      const before = doc.sliceString(Math.max(0, from - mLen), from);
      const after = doc.sliceString(to, Math.min(doc.length, to + mLen));
      if (before === marker && after === marker) {
        // Toggle off by removing surrounding markers
        view.dispatch({
          changes: { from: from - mLen, to: to + mLen, insert: '' },
          selection: { anchor: from - mLen },
        });
        view.focus?.();
        return;
      }

      // Insert placeholder wrapped in markers and select placeholder
      const inserted = `${marker}${placeholder}${marker}`;
      view.dispatch({
        changes: { from, to, insert: inserted },
        selection: { anchor: from + mLen, head: from + mLen + placeholder.length },
      });
      view.focus?.();
      return;
    }

    const selectedText = doc.sliceString(from, to);

    // 1. Check if selection is already wrapped internally: **text**
    if (
      selectedText.length >= mLen * 2 &&
      selectedText.startsWith(marker) &&
      selectedText.endsWith(marker)
    ) {
      const unwrapped = selectedText.slice(mLen, -mLen);
      view.dispatch({
        changes: { from, to, insert: unwrapped },
        selection: { anchor: from, head: from + unwrapped.length },
      });
      view.focus?.();
      return;
    }

    // 2. Check if selection is wrapped externally by adjacent markers: **[text]**
    const before = doc.sliceString(Math.max(0, from - mLen), from);
    const after = doc.sliceString(to, Math.min(doc.length, to + mLen));
    if (before === marker && after === marker) {
      view.dispatch({
        changes: [
          { from: to, to: to + mLen, insert: '' },
          { from: from - mLen, to: from, insert: '' },
        ],
        selection: { anchor: from - mLen, head: to - mLen },
      });
      view.focus?.();
      return;
    }

    // Wrap selection
    const wrapped = `${marker}${selectedText}${marker}`;
    view.dispatch({
      changes: { from, to, insert: wrapped },
      selection: { anchor: from + mLen, head: from + mLen + selectedText.length },
    });
    view.focus?.();
  },

  /**
   * Headings: H1, H2.
   * If line is already a heading:
   * - of the same level: toggle off
   * - of a different level: switch level cleanly (never produce # ###)
   */
  toggleHeading(view: EditorView, level: 1 | 2): void {
    const { from } = view.state.selection.main;
    const doc = view.state.doc;
    const line = doc.lineAt(from);
    const targetPrefix = level === 1 ? '# ' : '## ';

    const match = line.text.match(/^(#{1,6})\s+(.*)$/);

    if (match) {
      const currentLevel = match[1]?.length;
      const content = match[2] ?? '';

      if (currentLevel === level) {
        // Toggle off: remove heading prefix
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: content },
          selection: { anchor: Math.min(line.from + content.length, view.state.selection.main.head) },
        });
      } else {
        // Switch level cleanly
        const replacement = `${targetPrefix}${content}`;
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: replacement },
          selection: { anchor: Math.min(line.from + replacement.length, view.state.selection.main.head) },
        });
      }
    } else {
      // Add heading prefix to line
      const replacement = `${targetPrefix}${line.text}`;
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: replacement },
        selection: { anchor: from + targetPrefix.length },
      });
    }
    view.focus?.();
  },

  /**
   * Multiline prefix toggling for quote, bullet list, checklist.
   */
  togglePrefix(view: EditorView, prefix: string): void {
    const { from, to } = view.state.selection.main;
    const doc = view.state.doc;
    const startLine = doc.lineAt(from);
    const endLine = doc.lineAt(to);

    const lines: { number: number; from: number; to: number; text: string }[] = [];
    for (let i = startLine.number; i <= endLine.number; i++) {
      lines.push(doc.line(i));
    }

    // Determine prefix pattern
    let regex: RegExp;
    if (prefix === '> ') {
      regex = /^>\s?/;
    } else if (prefix === '- ') {
      regex = /^[-*]\s+/;
    } else if (prefix === '- [ ] ') {
      regex = /^[-*]\s+\[[ xX]\]\s+/;
    } else {
      regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    }

    const allHavePrefix = lines.every((l) => l.text.trim().length === 0 || regex.test(l.text));

    const changes = lines.map((l) => {
      if (allHavePrefix) {
        // Remove prefix
        const newText = l.text.replace(regex, '');
        return { from: l.from, to: l.to, insert: newText };
      } else {
        // Add prefix (skip empty lines if desired, or prefix all)
        const newText = `${prefix}${l.text}`;
        return { from: l.from, to: l.to, insert: newText };
      }
    });

    view.dispatch({ changes });
    view.focus?.();
  },

  /**
   * Numbered list multiline toggling (1. 2. 3. ...).
   */
  toggleNumberedList(view: EditorView): void {
    const { from, to } = view.state.selection.main;
    const doc = view.state.doc;
    const startLine = doc.lineAt(from);
    const endLine = doc.lineAt(to);

    const lines: { number: number; from: number; to: number; text: string }[] = [];
    for (let i = startLine.number; i <= endLine.number; i++) {
      lines.push(doc.line(i));
    }

    const numRegex = /^\d+\.\s+/;
    const allHavePrefix = lines.every((l) => l.text.trim().length === 0 || numRegex.test(l.text));

    let index = 1;
    const changes = lines.map((l) => {
      if (allHavePrefix) {
        return { from: l.from, to: l.to, insert: l.text.replace(numRegex, '') };
      } else {
        const prefix = `${index}. `;
        index++;
        return { from: l.from, to: l.to, insert: `${prefix}${l.text}` };
      }
    });

    view.dispatch({ changes });
    view.focus?.();
  },

  /**
   * Detect current active formatting states based on cursor/selection.
   */
  detectActiveFormatting(view: EditorView | null): ActiveFormattingState {
    const initial: ActiveFormattingState = {
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
    };

    if (!view) return initial;

    const { from, to, empty } = view.state.selection.main;
    const doc = view.state.doc;
    const line = doc.lineAt(from);

    // Line-level detections
    const lineText = line.text;
    initial.heading1 = /^#\s+/.test(lineText);
    initial.heading2 = /^##\s+/.test(lineText);
    initial.quote = /^>\s?/.test(lineText);
    initial.checklist = /^[-*]\s+\[[ xX]\]\s+/.test(lineText);
    initial.bulletList = !initial.checklist && /^[-*]\s+/.test(lineText);
    initial.numberedList = /^\d+\.\s+/.test(lineText);

    // Code block check
    initial.codeBlock = lineText.startsWith('```');

    // Inline formatting detection
    if (!empty) {
      const selected = doc.sliceString(from, to);
      initial.bold = selected.startsWith('**') && selected.endsWith('**');
      initial.italic = (selected.startsWith('*') && selected.endsWith('*')) || (selected.startsWith('_') && selected.endsWith('_'));
      initial.strikethrough = selected.startsWith('~~') && selected.endsWith('~~');
      initial.inlineCode = selected.startsWith('`') && selected.endsWith('`');
    } else {
      // Check surrounding characters
      const before2 = doc.sliceString(Math.max(0, from - 2), from);
      const after2 = doc.sliceString(to, Math.min(doc.length, to + 2));
      if (before2 === '**' && after2 === '**') initial.bold = true;
      if (before2 === '~~' && after2 === '~~') initial.strikethrough = true;
      if (before2.endsWith('`') && after2.startsWith('`')) initial.inlineCode = true;
      if (before2.endsWith('*') && after2.startsWith('*')) initial.italic = true;
    }

    return initial;
  },
};
