# STACK — A Modula Project

> Markdown notes without the noise.

- **Canonical site**: [https://stack-md.online](https://stack-md.online)
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
```

---

## Security Invariants

- **Never commit secrets**: Never commit `.env`, OAuth provider secrets, Auth0 Client Secret, AWS credentials, or SES SMTP credentials.
- **Client password invariant**: STACK never stores, logs, or transmits raw user passwords. Password authentication delegates directly to Auth0 Universal Login via PKCE.
- **Identity invariant**: User identity is derived strictly from the validated Auth0 JWT `sub`. Username is a public profile handle and never an authorization key.
