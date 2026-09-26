import type { Note } from '~/features/notes/types/note.types';

export const initialNotes: Note[] = [
  {
    id: 'note-1',
    title: 'STACK Manifesto — Zero Latency Markdown Engine',
    content: `# STACK — A Modula Project

> "Markdown is not an import/export convenience. Markdown is the product."

STACK is an industrial-grade, local-first note environment designed specifically for engineers, systems thinkers, and technical writers who refuse to surrender their personal notes to closed SaaS clouds.

## Core Architectural Pillars

1. **Typing Never Waits for the Wire**
   Every keystroke is committed instantaneously into local memory and persistent IndexedDB. Network calls, replication, and cloud sync operate entirely out-of-band as non-blocking background workers.

2. **Plain Text Canonical Form**
   No proprietary binary blobs or obscure block JSON models. If you inspect the raw database or export your folder, you find standard UTF-8 Markdown that will remain readable 50 years from today.

3. **Restrained Battle-Worn Industrial Aesthetic**
   - Palette: Deep gunmetal, cold slate, weathered silver, bone white.
   - Primary action: Red slate accent inspired by post-war hardware marking.
   - No distracting animations or bloated widget trays.

## Technical Specifications

| Component | Technology | Target |
| :--- | :--- | :--- |
| Core Framework | React 19 + TypeScript | Strict Mode |
| Routing Engine | React Router Framework Mode | Prerender Public / CSR App |
| Styling Tokens | Tailwind CSS v4 | Post-War Industrial Palette |
| Text Editor | CodeMirror 6 | Zero-bloat Lazy Loaded Bundle |
| Local Storage | IndexedDB | 100% Offline Capable |

---

### Implementation Verification Tasks
- [x] Initial design system and brand assets compiled
- [x] Responsive layout with Write / Split / Read modes
- [x] Interactive Command Palette (Ctrl+K)
- [ ] Local IndexedDB replication worker
- [ ] AWS cloud sync endpoint integration
`,
    tags: ['manifesto', 'architecture', 'modula'],
    isPinned: true,
    isArchived: false,
    createdAt: '2026-09-26 21:00',
    updatedAt: 'Just now',
    syncStatus: 'saved_locally',
  },
  {
    id: 'note-2',
    title: 'Keyboard Shortcuts & Operational Protocols',
    content: `# Operational Protocols & Key Bindings

STACK is optimized for keyboard-first navigation on Windows, Linux, and web environments.

## Navigation Protocols

- \`Ctrl + K\` or \`Cmd + K\` — Open Command Palette
- \`Ctrl + N\` — Initialize New Note
- \`Ctrl + S\` — Force Local Flush & Checkpoint
- \`Ctrl + Shift + F\` — Global Text & Tag Search
- \`Ctrl + 1\` — Switch to Write Mode
- \`Ctrl + 2\` — Switch to Split Mode (Editor + Preview)
- \`Ctrl + 3\` — Switch to Read Mode

\`\`\`bash
# Run local offline development verification
pnpm run dev
# Run strict type checking
pnpm run typecheck
\`\`\`

## Safety & Data Retention
All edits maintain local history checkpoints. In the event of network severance, the local indicator shifts to \`Offline\`. Any subsequent edits remain queued and are synchronized automatically once connection telemetry is re-established.
`,
    tags: ['shortcuts', 'linux', 'windows'],
    isPinned: true,
    isArchived: false,
    createdAt: '2026-09-26 20:15',
    updatedAt: '12m ago',
    syncStatus: 'synced',
  },
  {
    id: 'note-3',
    title: 'AWS Deployment & Synchronization Schema',
    content: `# Cloud Synchronization Architecture

When cloud synchronization is enabled, STACK synchronizes state using a conflict-free revision vector over AWS API Gateway and DynamoDB / S3 storage.

\`\`\`mermaid
flowchart LR
    A[CodeMirror 6 Editor] --> B[Local Memory Store]
    B --> C[(IndexedDB Cache)]
    C --> D[Sync Background Worker]
    D -.->|WebSocket / HTTPS| E[AWS Cloud Target]
\`\`\`

### Invariant Rules
- The local database is the single source of truth for immediate rendering.
- Sync operations are idempotent and chunked.
- No network timeout can freeze UI responsiveness or editor cursor position.
`,
    tags: ['aws', 'cloud', 'sync'],
    isPinned: false,
    isArchived: false,
    createdAt: '2026-09-26 19:30',
    updatedAt: '2h ago',
    syncStatus: 'synced',
  },
];
