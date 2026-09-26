# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-27

### Added

- **Startup Workspace Loader**: Cold-start initialization sequence with custom stage copy ("Preparing your workspace", "Restoring your notes", "Starting Markdown engine", "Indexing your stack", "Workspace ready"), presentation smoothing (approx 650ms), and slow connection recovery warning ("Still preparing your workspace… Local notes remain available.").
- **Auth0 Multi-User Authentication**: Branded post-war industrial login entry point with Google OAuth (`google-oauth2|...`), GitHub OAuth (`github|...`), and Email. Simulated callback verification route (`/auth/callback`) and logout route (`/auth/logout`) enforcing JWT `sub` as the canonical user partition key.
- **First-Login Onboarding Modal**: Two-step lightweight onboarding sequence for preferred operator name and private date of birth with privacy guarantee and welcome banner.
- **Route-Aware Profile Dialog (`/profile`)**: Comprehensive 7-tab configuration panel (Profile, Preferences, Appearance, Editor, Storage & Sync, Security, About) with keyboard dismissal (`Esc`), accessible focus trapping, and Auth0 token claims inspector.
- **Native Canvas 512×512 WebP Avatar Editor**: In-browser square crop and WebP compression supporting drag & drop, file selection, clipboard paste, and avatar removal without external heavy crop dependencies.
- **Attachment Engine & Portable Markdown Paths**: Support for pasting screenshots (`Ctrl+V`) and dragging files into editor, with automatic browser Canvas optimization to WebP, generation of portable relative paths (`./assets/screenshot-YYYYMMDD-HHMMSS.webp` and `./attachments/filename.pdf`), and interactive attachment drawer tray.
- **PWA Desktop Installation Engine**: Runtime `beforeinstallprompt` interception, contextual `Install STACK` button, standalone display mode detection, OS-specific install instructions dialog (Chrome, Edge, Safari), and dedicated "STACK on your desktop" landing page showcase section.
- **Prerendering Configuration**: Selective prerendering for public routes (`/`, `/docs`, `/help`, `/changelog`) and client-side SPA fallback for workspace (`/app/*`), profile (`/profile`), and auth (`/auth/*`).
- **Auth0 Environment Config**: Added `.env.example` with required Auth0 domain, client ID, and audience variables.

## [0.1.0] - 2026-09-27

### Added

- Initial STACK application foundation.
- React Router Framework Mode with Vite.
- Static prerendering for public routes and CSR workspace under `/app`.
- Atomic UI architecture and STACK industrial design system.
- Optimized AVIF/WebP brand assets and PWA shell.
- Dual deployment configurations (AWS Amplify Hosting ap-southeast-1 and Vercel preview).
