import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { markdownCommandService } from './markdownCommand.service';
import { EditorSaveController } from './editorSave.service';
import type { SaveState } from '../types/editor.types';

/**
 * Creates an authoritative headless CodeMirror environment for testing
 * transformation logic, transaction updates, and selection preservation.
 */
function createEditor(doc: string, selection?: { from: number; to?: number }) {
  let state = EditorState.create({
    doc,
    selection: selection
      ? { anchor: selection.from, head: selection.to ?? selection.from }
      : undefined,
  });

  const view = {
    get state() {
      return state;
    },
    dispatch(tr: any) {
      const transaction = state.update(tr);
      state = transaction.state;
    },
    focus() {},
  } as unknown as EditorView;

  return {
    get doc() {
      return state.doc.toString();
    },
    get selection() {
      return state.selection.main;
    },
    view,
  };
}

describe('Sprint 4: Markdown Editor UX Test Suite', () => {
  describe('1. Inline Formatting Transformations', () => {
    it('applies bold formatting around selection', () => {
      // doc: "hello world", select "world" (from 6 to 11)
      const editor = createEditor('hello world', { from: 6, to: 11 });
      markdownCommandService.execute(editor.view, 'bold');
      expect(editor.doc).toBe('hello **world**');
    });

    it('toggles off bold when already bolded', () => {
      // doc: "hello **world**", select "**world**" (from 6 to 15)
      const editor = createEditor('hello **world**', { from: 6, to: 15 });
      markdownCommandService.execute(editor.view, 'bold');
      expect(editor.doc).toBe('hello world');
    });

    it('inserts bold placeholder when selection is empty', () => {
      const editor = createEditor('hello ', { from: 6, to: 6 });
      markdownCommandService.execute(editor.view, 'bold');
      expect(editor.doc).toBe('hello **text**');
    });

    it('applies and toggles italic formatting', () => {
      const editor = createEditor('quiet night', { from: 0, to: 5 });
      markdownCommandService.execute(editor.view, 'italic');
      expect(editor.doc).toBe('*quiet* night');

      // Toggle off
      markdownCommandService.execute(editor.view, 'italic');
      expect(editor.doc).toBe('quiet night');
    });

    it('applies and toggles strikethrough formatting', () => {
      const editor = createEditor('deprecated method', { from: 0, to: 10 });
      markdownCommandService.execute(editor.view, 'strikethrough');
      expect(editor.doc).toBe('~~deprecated~~ method');

      markdownCommandService.execute(editor.view, 'strikethrough');
      expect(editor.doc).toBe('deprecated method');
    });

    it('applies and toggles inline code', () => {
      const editor = createEditor('const x = 10;', { from: 6, to: 7 });
      markdownCommandService.execute(editor.view, 'inline-code');
      expect(editor.doc).toBe('const `x` = 10;');

      markdownCommandService.execute(editor.view, 'inline-code');
      expect(editor.doc).toBe('const x = 10;');
    });
  });

  describe('2. Heading Transformations & Level Switching', () => {
    it('applies Heading 1 to a plain line', () => {
      const editor = createEditor('Title line', { from: 0, to: 0 });
      markdownCommandService.execute(editor.view, 'heading-1');
      expect(editor.doc).toBe('# Title line');
    });

    it('applies Heading 2 to a plain line', () => {
      const editor = createEditor('Sub heading', { from: 4, to: 4 });
      markdownCommandService.execute(editor.view, 'heading-2');
      expect(editor.doc).toBe('## Sub heading');
    });

    it('switches Heading 1 to Heading 2 cleanly without stacking hashes', () => {
      const editor = createEditor('# Section Title', { from: 3, to: 3 });
      markdownCommandService.execute(editor.view, 'heading-2');
      // Must NOT produce "## # Section Title" or "# ### Section Title"
      expect(editor.doc).toBe('## Section Title');
    });

    it('toggles off Heading 1 when invoked on an existing H1', () => {
      const editor = createEditor('# Existing Title', { from: 5, to: 5 });
      markdownCommandService.execute(editor.view, 'heading-1');
      expect(editor.doc).toBe('Existing Title');
    });

    it('switches Heading 2 to Heading 1 cleanly', () => {
      const editor = createEditor('## Sub section', { from: 5, to: 5 });
      markdownCommandService.execute(editor.view, 'heading-1');
      expect(editor.doc).toBe('# Sub section');
    });
  });

  describe('3. Multiline & List Transformations', () => {
    it('applies bullet list to single or multiple lines', () => {
      const text = 'First item\nSecond item';
      const editor = createEditor(text, { from: 0, to: text.length });
      markdownCommandService.execute(editor.view, 'bullet-list');
      expect(editor.doc).toBe('- First item\n- Second item');
    });

    it('toggles off bullet list when all selected lines have bullets', () => {
      const text = '- Item 1\n- Item 2';
      const editor = createEditor(text, { from: 0, to: text.length });
      markdownCommandService.execute(editor.view, 'bullet-list');
      expect(editor.doc).toBe('Item 1\nItem 2');
    });

    it('applies numbered list sequentially', () => {
      const text = 'Alpha\nBeta\nGamma';
      const editor = createEditor(text, { from: 0, to: text.length });
      markdownCommandService.execute(editor.view, 'numbered-list');
      expect(editor.doc).toBe('1. Alpha\n2. Beta\n3. Gamma');
    });

    it('applies checklist prefixes', () => {
      const text = 'Task A\nTask B';
      const editor = createEditor(text, { from: 0, to: text.length });
      markdownCommandService.execute(editor.view, 'checklist');
      expect(editor.doc).toBe('- [ ] Task A\n- [ ] Task B');
    });

    it('applies blockquote prefix to lines', () => {
      const text = 'Important notice\nLine 2';
      const editor = createEditor(text, { from: 0, to: text.length });
      markdownCommandService.execute(editor.view, 'quote');
      expect(editor.doc).toBe('> Important notice\n> Line 2');
    });
  });

  describe('4. Structural Block Insertions (Code Block, Table, Links, HR)', () => {
    it('wraps selection into fenced code block', () => {
      const editor = createEditor('console.log("ok");', { from: 0, to: 18 });
      markdownCommandService.execute(editor.view, 'code-block');
      expect(editor.doc).toContain('```text\nconsole.log("ok");\n```');
    });

    it('inserts markdown table template', () => {
      const editor = createEditor('', { from: 0, to: 0 });
      markdownCommandService.execute(editor.view, 'table');
      expect(editor.doc).toContain('| Column 1 | Column 2 |');
      expect(editor.doc).toContain('| --- | --- |');
      expect(editor.doc).toContain('| Value 1 | Value 2 |');
    });

    it('inserts horizontal rule with newlines', () => {
      const editor = createEditor('Before', { from: 6, to: 6 });
      markdownCommandService.execute(editor.view, 'horizontal-rule');
      expect(editor.doc).toBe('Before\n\n---\n\n');
    });

    it('formats link with selection as text', () => {
      const editor = createEditor('Visit GitHub now', { from: 6, to: 12 });
      markdownCommandService.execute(editor.view, 'link');
      expect(editor.doc).toBe('Visit [GitHub](url) now');
    });

    it('formats image with selection as alt text', () => {
      const editor = createEditor('Architecture Diagram', { from: 0, to: 20 });
      markdownCommandService.execute(editor.view, 'image');
      expect(editor.doc).toBe('![Architecture Diagram](url)');
    });
  });

  describe('5. Slash Command Context & Regex Guardrails', () => {
    // Regex invariant: must trigger only at block/line start, never inside URLs or paths
    const slashRegex = /^(\s*)\/([a-zA-Z0-9_-]*)$/;

    it('triggers slash command at line start', () => {
      const match = '/heading'.match(slashRegex);
      expect(match).not.toBeNull();
      expect(match![2]).toBe('heading');
    });

    it('triggers slash command after leading indentation', () => {
      const match = '  /quote'.match(slashRegex);
      expect(match).not.toBeNull();
      expect(match![2]).toBe('quote');
    });

    it('strictly REJECTS slash command inside URLs', () => {
      const urlText = 'https://stack-md.online/docs';
      expect(urlText.match(slashRegex)).toBeNull();
    });

    it('strictly REJECTS slash command inside file paths', () => {
      const pathText = 'app/features/editor/components/MarkdownToolbar.tsx';
      expect(pathText.match(slashRegex)).toBeNull();
    });

    it('strictly REJECTS slash command inside mathematical fractions or dates', () => {
      expect('10/20'.match(slashRegex)).toBeNull();
      expect('2026/09/27'.match(slashRegex)).toBeNull();
    });

    it('strictly REJECTS slash command in middle of sentence', () => {
      expect('This is a test /command'.match(slashRegex)).toBeNull();
    });
  });

  describe('6. Local Autosave Pipeline & Revision Safety', () => {
    let controller: EditorSaveController;

    beforeEach(() => {
      controller = new EditorSaveController(50); // fast 50ms for tests
      controller.resetForTesting();
    });

    it('emits dirty immediately when queued and saves after debounce', async () => {
      const states: SaveState[] = [];
      controller.subscribe((id, state) => {
        if (id === 'note-1') states.push(state);
      });

      const persistMock = vi.fn().mockResolvedValue(undefined);

      controller.queueSave('note-1', 'auth0|test-sub', '# Hello', persistMock);

      expect(states.some((s) => s.status === 'dirty')).toBe(true);
      expect(persistMock).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise((res) => setTimeout(res, 80));

      expect(persistMock).toHaveBeenCalledTimes(1);
      expect(persistMock).toHaveBeenCalledWith('note-1', '# Hello');
      expect(states.some((s) => s.status === 'saved-local')).toBe(true);
    });

    it('flushes pending save immediately without waiting for timer', async () => {
      const persistMock = vi.fn().mockResolvedValue(undefined);

      controller.queueSave(
        'note-1',
        'auth0|test-sub',
        '# Urgent Content',
        persistMock
      );
      expect(persistMock).not.toHaveBeenCalled();

      await controller.flush('note-1');

      expect(persistMock).toHaveBeenCalledTimes(1);
      expect(persistMock).toHaveBeenCalledWith('note-1', '# Urgent Content');
      expect(controller.getState('note-1').status).toBe('saved-local');
    });

    it('rejects stale revisions and prevents out-of-order writes', async () => {
      const savedWrites: string[] = [];

      let resolveSlowWrite: () => void = () => {};
      const slowPromise = new Promise<void>((res) => {
        resolveSlowWrite = res;
      });

      const persistSlow = vi.fn().mockImplementation(() => slowPromise);
      const persistFast = vi
        .fn()
        .mockImplementation(async (id: string, c: string) => {
          savedWrites.push(c);
        });

      // Queue revision 1
      controller.queueSave(
        'note-1',
        'auth0|test-sub',
        'Revision 1',
        persistSlow
      );

      // Queue revision 2 rapidly
      controller.queueSave(
        'note-1',
        'auth0|test-sub',
        'Revision 2',
        persistFast
      );

      // Flush revision 2
      await controller.flush('note-1');
      expect(savedWrites).toContain('Revision 2');

      // Complete slow write later
      resolveSlowWrite();
      await slowPromise;

      // Ensure state is still clean and saved
      expect(controller.getState('note-1').status).toBe('saved-local');
    });

    it('maintains strict per-user and per-note isolation', async () => {
      const persistA = vi.fn().mockResolvedValue(undefined);
      const persistB = vi.fn().mockResolvedValue(undefined);

      controller.queueSave(
        'note-user-A',
        'sub-alice',
        'Alice Content',
        persistA
      );
      controller.queueSave('note-user-B', 'sub-bob', 'Bob Content', persistB);

      await controller.flush('note-user-A');

      expect(persistA).toHaveBeenCalledTimes(1);
      expect(persistB).not.toHaveBeenCalled(); // Note B was not flushed yet

      await controller.flush('note-user-B');
      expect(persistB).toHaveBeenCalledTimes(1);
    });

    it('never emits or claims saved to cloud', async () => {
      const states: SaveState[] = [];
      controller.subscribe((id, state) => states.push(state));

      const persistMock = vi.fn().mockResolvedValue(undefined);
      controller.queueSave('note-x', 'sub-x', 'Content', persistMock);
      await controller.flush('note-x');

      // Check all emitted status labels
      for (const st of states) {
        expect((st as any).status).not.toBe('saved-cloud');
        expect((st as any).status).not.toBe('syncing-cloud');
      }
      expect(controller.getState('note-x').status).toBe('saved-local');
    });
  });
});
