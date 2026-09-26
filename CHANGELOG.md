# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-27

### Added
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
