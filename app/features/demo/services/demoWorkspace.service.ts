import type { Note, Folder } from '~/features/notes/types/note.types';
import type { ExtendedAuthUser } from '~/features/auth/hooks/useAuthSession';
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';

export const DEMO_SUB = 'demo';

export const DEMO_USER: ExtendedAuthUser = {
  sub: DEMO_SUB,
  email: 'demo@stack-md.online',
  emailVerified: true,
  username: 'demo_operator',
  preferredName: 'Demo Operator',
  picture: undefined,
  isSocial: false,
  provider: 'demo',
  hasCompletedOnboarding: true,
};

export const INITIAL_DEMO_FOLDERS: Folder[] = [
  {
    id: 'folder-getting-started',
    name: 'Getting Started',
    parentId: null,
    order: 0,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  {
    id: 'folder-projects',
    name: 'Projects',
    parentId: null,
    order: 1,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  {
    id: 'folder-ideas',
    name: 'Ideas',
    parentId: null,
    order: 2,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
];

export const INITIAL_DEMO_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to STACK',
    content: `# Welcome to STACK

**Markdown notes without the noise.**

STACK is a distraction-free, local-first markdown workspace built for high-focus engineering and technical writing.

![STACK Logo](/brand/stack-logo.webp)

## Quick Highlights

- **Local-First & Offline**: Your notes are saved locally in your browser.
- **Pure Markdown**: Raw Markdown text is the authoritative source of truth.
- **Keyboard-First**: Formatting commands, slash commands, and hotkeys.
- **Organization**: Drag & drop folders, nested hierarchies, and tags.

> *Nothing you write here is saved to a server account while in Demo Mode.*

Try opening the **Markdown Playground** note or typing \`/\` on an empty line to trigger the Slash Command palette!`,
    folderId: 'folder-getting-started',
    tags: ['markdown', 'local-first', 'demo'],
    isPinned: true,
    archivedAt: null,
    deletedAt: null,
    syncStatus: 'saved_locally',
    order: 0,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  {
    id: 'note-markdown-playground',
    title: 'Markdown Playground',
    content: `# Markdown Playground

Test out STACK's markdown formatting capabilities below.

## Text Formatting

- **Bold text** with \`Ctrl+B\` or \`**bold**\`
- *Italic text* with \`Ctrl+I\` or \`*italic*\`
- ~~Strikethrough~~ with \`~~strike~~\`
- \`Inline code\` with backticks

## Task Lists

- [x] Initial setup and orientation
- [x] Test slash command palette (\`/\`)
- [ ] Try Split mode vs Read mode
- [ ] Reorganize folders with drag & drop

## Code Block

\`\`\`typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
}
\`\`\`

## Data Table

| Feature | Local-First Demo | Cloud Auth Account |
| :--- | :--- | :--- |
| Writing & Editing | Instant | Instant |
| Local Storage | \`stack_demo_workspace\` | \`stack_user_{sub}\` |
| Multi-Device Cloud Sync | Not active | Available |

> Pro-tip: Press \`Ctrl+S\` at any time to trigger an instant save flush.`,
    folderId: 'folder-getting-started',
    tags: ['markdown', 'demo'],
    isPinned: false,
    archivedAt: null,
    deletedAt: null,
    syncStatus: 'saved_locally',
    order: 1,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  {
    id: 'note-local-first',
    title: 'Local-First Notes',
    content: `# Local-First Architecture

STACK puts user privacy and data ownership first.

## Why Local-First?

1. **Instant Response**: Zero network latency when typing, saving, or navigating notes.
2. **Offline-Resilient**: Keep writing on planes, subways, or offline environments.
3. **Data Boundary**: Notes stay securely partitioned in your browser's private storage.

In **Demo Mode**, state is kept strictly inside an isolated \`stack_demo_workspace\` partition. You can click **Reset Demo** at any time to restore this initial sample workspace.`,
    folderId: 'folder-projects',
    tags: ['local-first'],
    isPinned: false,
    archivedAt: null,
    deletedAt: null,
    syncStatus: 'saved_locally',
    order: 0,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
  {
    id: 'note-keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: `# Keyboard Shortcuts

Master STACK with keyboard-driven controls.

## Formatting Commands

- \`Ctrl/Cmd + B\`: Toggle Bold
- \`Ctrl/Cmd + I\`: Toggle Italic
- \`Ctrl/Cmd + Shift + X\`: Toggle Strikethrough
- \`Ctrl/Cmd + K\`: Insert Link
- \`Ctrl/Cmd + E\`: Inline Code
- \`Ctrl/Cmd + S\`: Force Save

## Navigation & Tools

- \`/\` at line start: Slash Command Palette
- \`Ctrl/Cmd + P\`: Command Palette & Quick Search
- \`Esc\`: Close open modal / dialog
- \`Ctrl/Cmd + Z\`: Undo document changes
- \`Ctrl/Cmd + Shift + Z\`: Redo document changes`,
    folderId: 'folder-ideas',
    tags: ['demo'],
    isPinned: false,
    archivedAt: null,
    deletedAt: null,
    syncStatus: 'saved_locally',
    order: 0,
    createdAt: '2026-09-27T00:00:00.000Z',
    updatedAt: '2026-09-27T00:00:00.000Z',
  },
];

export const demoWorkspaceService = {
  isDemoSub(sub: string): boolean {
    return sub === DEMO_SUB;
  },

  async isDemoSeeded(): Promise<boolean> {
    const notes = await userWorkspaceStorage.getNotes(DEMO_SUB);
    return notes.length > 0;
  },

  async seedDemoWorkspace(force = false): Promise<void> {
    if (!force) {
      const alreadySeeded = await this.isDemoSeeded();
      if (alreadySeeded) return;
    }

    // Reset demo storage cleanly without touching authenticated user databases
    await userWorkspaceStorage.clearUserData(DEMO_SUB);

    // Save initial folders and notes
    await userWorkspaceStorage.saveFolders(DEMO_SUB, INITIAL_DEMO_FOLDERS);
    await userWorkspaceStorage.saveNotes(DEMO_SUB, INITIAL_DEMO_NOTES);

    // Seed default layout settings
    userWorkspaceStorage.saveLayoutSettings(DEMO_SUB, {
      sidebarMode: 'expanded',
      sidebarWidth: 260,
      expandedFolderIds: ['folder-getting-started'],
    });
  },

  async resetDemoWorkspace(): Promise<void> {
    await this.seedDemoWorkspace(true);
  },
};
