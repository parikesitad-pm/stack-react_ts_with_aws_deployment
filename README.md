# STACK — A Modula Project

> **Markdown-First, Local-Friendly Note Engine for Desktop & Web (PWA)**  
> Engineered for zero latency on keystrokes, strict local persistence via IndexedDB, and pure UTF-8 Markdown storage.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-stack--13.vercel.app-black?logo=vercel)](https://stack-13.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-parikesitad--pm%2Fstack-181717?logo=github)](https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## 1. Overview

STACK is an industrial-grade note-taking engine built with a post-war military and avionics aesthetic (worn steel, slate, and bone white with signal-red accents). Keystrokes commit to local memory and IndexedDB immediately with zero wire latency.

- **Production Live URL**: [https://stack-13.vercel.app](https://stack-13.vercel.app)
- **Repository**: [https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment](https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment)

---

## 2. Tech Stack & Architecture

- **Core**: React 19, TypeScript (strict), React Router Framework Mode (`ssr: false`), Vite.
- **Styling**: Tailwind CSS v4, Lucide icons, custom industrial design tokens.
- **Editor**: CodeMirror 6 (lazy-loaded with React `Suspense` boundary in `/app`).
- **Markdown**: Pure `react-markdown` + `remark-gfm` (safe, no raw HTML execution).
- **Storage**: Browser IndexedDB scoped per authenticated user (`stack:user:{sub}`).
- **Authentication**: AWS Cognito User Pool with JWT authorizer (`PK = USER#{sub}`, `SK = NOTE#{noteId}`).
- **PWA**: `vite-plugin-pwa` for standalone install on Windows and Linux desktop environments.
- **Selective Prerendering**:
  - `/`, `/docs`, `/help`, `/changelog`, `/auth/*` → Static pre-rendered HTML.
  - `/app/*` → Client-side rendered (CSR) via `__spa-fallback.html`.

---

## 3. Getting Started

### Prerequisites
- Node.js >= 22
- pnpm >= 9

### Installation & Local Development
```bash
# Clone the repository
git clone https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment.git
cd stack-react_ts_with_aws_deployment

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) for the landing page or [http://localhost:5173/app](http://localhost:5173/app) for the note workspace.

### Production Build & Typecheck
```bash
# Type check and build
pnpm run typecheck
pnpm run build
```
Static client output is generated in `build/client/`.

---

## 4. Console Utilities & Helpers

STACK includes console functions for operational guidance and real-time customization:

### Terminal Console (CLI)
```bash
# Display operational guide, keyboard shortcuts, and architecture summary
pnpm run how-to-use

# Update landing page configuration programmatically
pnpm run update-landing -- --headline="OFFLINE FIRST" --subheadline="YOUR DATA STAYS LOCAL"
```

### Browser DevTools Console (F12)
Open Developer Tools on [stack-13.vercel.app](https://stack-13.vercel.app) and run in the console:

```javascript
// Display interactive formatted ASCII guide and shortcuts
stack.howToUse();

// Update landing page copy live in the browser session
stack.updateLandingPage({
  headline: "MARKDOWN-FIRST.",
  subheadline: "ZERO LATENCY ON THE WIRE.",
  badge: "STACK v0.1.0 · A Modula Project"
});

// Reset landing page copy to original defaults
stack.resetLandingPage();

// Inspect telemetry and session info
stack.status();
```

---

## 5. Keyboard Navigation Reference

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Command Palette | Instant jump list for notes, tags, and theme |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | New Document | Creates a new plain text markdown note |
| <kbd>Ctrl</kbd> + <kbd>1</kbd> | Write Mode | Full editor focus without distractions |
| <kbd>Ctrl</kbd> + <kbd>2</kbd> | Split Mode | Side-by-side CodeMirror editor and rendered markdown |
| <kbd>Ctrl</kbd> + <kbd>3</kbd> | Read Mode | Clean rendered document view |

---

## 6. Dual Deployment Strategy

- **Production Target (AWS)**: AWS Amplify Hosting (`ap-southeast-1`) on branch `main` using `build/client`.
- **Preview & Review Target (Vercel)**: Vercel connected to branch `main` and preview branches at [https://stack-13.vercel.app](https://stack-13.vercel.app).

---

## 7. License & Attribution

STACK · A Modula Project · MIT License 2026 - crafted with &lt;3 by [parikesitad-pm](https://github.com/parikesitad-pm).  
Copyright (c) 2026 parikesitad-pm.
