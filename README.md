# STACK — A Modula Project

> Markdown notes without the noise.

- **Canonical site**: [https://stack-md.online](https://stack-md.online)
- **Modula Registry**: [https://stack-md.online/modula-project](https://stack-md.online/modula-project)
- **Repository**: [https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment.git](https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment.git)
- **Author**: parikesitad-pm
- **License**: MIT License (2026)

---

## Architecture Overview

STACK is a Markdown-first, local-first Progressive Web App built with React 19, TypeScript strict mode, React Router Framework Mode, Tailwind CSS v4, and TanStack Query v5.

```text
React (Client SPA)
  │
  ▼
Auth0 Provider (@auth0/auth0-react)
  ├── Email / Password (Auth0 Universal Login)
  ├── Google OAuth (Brokered via Auth0)
  └── GitHub OAuth (Brokered via Auth0)
  │
  ▼
Auth0 JWT Claim (sub)
  │
  ▼
Per-User Hard Workspace Boundary
  ├── IndexedDB Database: stack_user_{hash(sub)}
  │     ├── notes store
  │     ├── folders store
  │     ├── attachments store
  │     └── meta store
  └── TanStack Query Cache Scoped: [entity, sub]
```

### Strict Multi-User Workspace Isolation

- Every authenticated user's notes, folders, and attachments are partitioned into an isolated IndexedDB database (`stack_user_{hash(sub)}`).
- Logging out triggers a 10-step cleanup protocol that cancels active queries, clears caches, closes IndexedDB connections, and revokes attachment object URLs.
- Account A and Account B on the same device can never see each other's private data.
- Brand new accounts receive an empty workspace (`Hi, @username. Your stack is empty.`) with zero seeded demo notes.

---

## Local Development & Environment Setup

Copy `.env.example` to `.env` to configure public SPA keys:

```bash
cp .env.example .env
```

```env
# Public Application URL
VITE_PUBLIC_APP_URL=https://stack-md.online

# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-q17s3o8mib1dgwhd.us.auth0.com
VITE_AUTH0_CLIENT_ID=zvFH3CSBnuruw9DBcNgslKaQkhlBtdAO
VITE_AUTH0_AUDIENCE=https://api.stack.modula

# Reserved for future AWS API Gateway HTTP API
VITE_API_BASE_URL=
```

### Commands

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run dev server
pnpm run dev

# Run typecheck
pnpm run typecheck

# Run test suite
pnpm test

# Build production client
pnpm run build

# Start standalone React DevTools
pnpm run devtools
```

### Standalone React DevTools (Non-Extension Browsers)

For developers using browsers where the standard Chrome/Firefox extension is unavailable, finicky, or unwanted (e.g. **Vivaldi**, **Brave** on Manjaro Linux, or **Zen Browser**), STACK integrates standalone `react-devtools`:

1. In your first terminal, launch the standalone DevTools GUI:
   ```bash
   pnpm run devtools
   ```
2. In your second terminal, start the STACK development server:
   ```bash
   pnpm run dev
   ```
3. Open STACK in any browser (`http://localhost:5173`). The app connects automatically via the dev-only hook script (`http://localhost:8097`).

> [!NOTE]
> The DevTools connection script is guarded by `import.meta.env.DEV` in `app/root.tsx`. It is completely stripped out of production builds by Vite dead-code elimination (0 bytes and no network requests in production).

---

## Security Invariants

- **Never commit secrets**: Never commit `.env`, OAuth provider secrets, Auth0 Client Secret, AWS credentials, or SES SMTP credentials.
- **Client password invariant**: STACK never stores, logs, or transmits raw user passwords. Password authentication delegates directly to Auth0 Universal Login via PKCE.
- **Identity invariant**: User identity is derived strictly from the validated Auth0 JWT `sub`. Changing `@username` will NEVER change `sub` or rename/move the local IndexedDB database (`stack_user_{hash(sub)}`).
- **Cryptographic Challenge Hashing**: 6-digit email security challenges use server-side HMAC-SHA256 with secrets in AWS Secrets Manager (never plain SHA-256 digests).
- **Device PIN Scope**: 6-digit PIN is purely a local browser convenience lock using Web Crypto PBKDF2/SHA-256. It does not encrypt notes or replace Auth0 authentication.
- **Avatar Storage**: S3 presigned URLs are never stored in profile JSON (they expire). Profile persists `avatarKey` and `avatarVersion`, resolving URLs at runtime.

---

## Workspace Organization Invariants

- **Hierarchy Preservation**: Safe folder deletion reparents ONLY direct notes and immediate child folders to the chosen destination. Grandchildren and nested subtrees are preserved and never flattened. The destination folder cannot be within the deleted folder's subtree.
- **Note State Precedence**: `deletedAt != null` (Trash) takes absolute precedence over `archivedAt != null` (Archive). Notes in Trash or Archive are strictly excluded from All Notes, folder lists, and search queries. Restoring a note from Trash restores it to its previous state (Archive or Active).
- **Separation of Folders vs Tags**: A Folder represents "where this note lives" (0 or 1 per note). A Tag represents "what this note is about" (0 or more per note). Active tag counts are derived exclusively from active notes.
- **Partitioned User Layout**: Layout preferences (`sidebarMode`, `sidebarWidth`, `expandedFolderIds`) are isolated strictly per-user via `stack_layout_{hashSub(sub)}` with memory fallback. Unpartitioned global keys are forbidden.
- **Persistence Atomicity**: UI mutations employ optimistic updates backed by rollback on IndexedDB failure.

