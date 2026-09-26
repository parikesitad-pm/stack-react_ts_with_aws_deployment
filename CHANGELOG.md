# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-09-27

### Added

- Real production Auth0 integration via `@auth0/auth0-react` supporting Google, GitHub, and email/password Universal Login.
- Email verification gate (`EmailVerificationGate`) blocking private workspace access until Auth0 reports `email_verified === true`.
- First-run STACK identity onboarding (`"What should I call you?"`) with strict username normalization and availability checks.
- Server-side atomic username claim contract using DynamoDB conditional write semantics (`attribute_not_exists(PK)`).
- Hard per-user IndexedDB workspace partitioning (`stack_user_{hash(sub)}`) ensuring complete isolation of notes, folders, and attachments.
- Auth-scoped TanStack Query cache keys (`[entity, sub]`) preventing cross-account query cache poisoning.
- Comprehensive 10-step logout cleanup protocol (`logoutCleanupService`) that cancels queries, clears caches, closes IndexedDB connections, and revokes attachment URLs.
- Automated test suite for username validation, atomic identity claims, auth redirects, and storage isolation.

### Changed

- Deprecated and eliminated production mock authentication service as a source of truth.
- Scoped all active note selection, editor recovery, and tour completion state strictly per-user.
- Updated public navigation and landing page hero CTA to display `Hi, @username` and `Workspace →` for authenticated users.
- Updated `README.md` with current Auth0 architecture and local setup.

### Fixed

- Fixed critical release blocker where logging out of Account A and logging into Account B displayed Account A's private workspace and notes.
- Fixed auth redirection to properly preserve intended deep links (`returnTo`) across login and callback cycles.
- Fixed empty workspace state to start with 0 seeded demo notes for fresh users.

## [0.3.0] - 2026-09-27

### Added

- Production custom domain cutover to `https://stack-md.online` with canonical SEO origin, robots.txt, and sitemap.xml.
- Edge redirection rule in `vercel.json` permanently forwarding `www.stack-md.online` to apex `stack-md.online`.
- Production environment template in `.env.example` documenting `VITE_PUBLIC_APP_URL` and Auth0 production endpoints.
- Authoritative backend `@username` uniqueness model using DynamoDB atomic conditional write (`PK = USERNAME#<lowercase>`, `SK = CLAIM`, condition `attribute_not_exists(PK)`).
- Strict password security architecture ensuring passwords are never stored, cached, or transmitted outside Auth0 authentication flows.
- Claim-based OTP bypass strictly validating `email_verified === true` claim from IDP tokens.
- Three sidebar layout modes: expanded with pointer-event mouse drag resizer and localStorage width persistence, compact rail, and zen fullscreen.
- Dedicated `ZenModeExitButton` and keyboard shortcuts (`Escape`, `Ctrl+\`) to exit Zen mode.
- Zod `folderSchema` with recursion and cycle prevention (`folderTreeService.wouldCreateCycle`).
- Modular `@atlaskit/pragmatic-drag-and-drop` integration for note and folder reordering and nesting.
- Empty workspace state (`Hi, {preferredName}. Your stack is empty.`) with no seeded demo notes for fresh users.
- Dismissible 4-step coach marks tour persisted per user identity.
- IndexedDB binary blob repository (`attachmentRepository`) and canonical reference-counted attachment resolver (`acquire`/`release`) to preserve image lifecycles between Split and Read modes.
- Shared canonical `MarkdownRenderer` using `react-markdown` and `remark-gfm` across preview and presentation modes.
- Cross-browser PWA capability detection across Chromium, Safari, Firefox, and Linux distros.

### Changed

- Migrated all public route metadata, Open Graph cards, Twitter metadata, and JSON-LD structured data to `https://stack-md.online`.
- Updated PWA Web App Manifest (`start_url: "/app"`, `scope: "/"`, canonical product branding).
- Updated desktop PWA installation copy on landing page to standard non-noise specification.
- Removed redundant System Configuration gear icon from sidebar header; centralized preferences in user profile and settings modal.
- Updated public navbar and landing hero CTA to dynamically reflect authenticated session state (`Go to workspace →` vs `Get started →`).
- Updated email verification flow (`/auth/verify`) with masked destination email, OTP inputs, resend cooldown timer, and `aria-live` feedback.
- Pinned package manager to `pnpm@10.6.1` and Node engine to Node 22 (`.nvmrc`).
- Added `noExternal: [/@atlaskit/]` to Vite SSR config to enable seamless prerender compilation.

### Fixed

- Fixed AWS Amplify build pipeline by eliminating swallowed errors and asserting post-build generation of all static HTML routes.
- Fixed premature object URL revocation bug when switching between Split preview and Read mode.

## [0.1.0] - 2026-09-27

### Added

- Initial STACK application foundation.
- React Router Framework Mode with CSR workspace under `/app`.
- Static prerendering for public routes (`/`, `/docs`, `/help`, `/changelog`).
- STACK industrial design system and PWA configuration.
- AWS Amplify and Vercel preview deployment configurations.
