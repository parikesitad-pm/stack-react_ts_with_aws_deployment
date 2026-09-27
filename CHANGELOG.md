# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-09-27

### Added

- Nested folder system supporting arbitrary depths with strict folder name validation (1–80 characters, no slashes, no control characters, unique sibling names) and cycle prevention (`wouldCreateCycle`).
- Safe folder deletion workflow (`SafeDeleteFolderModal`) that preserves folder hierarchy by reparenting only direct notes and immediate child folders to the selected destination, never flattening descendants or allowing reparenting into the deleted subtree.
- Note and folder sibling reordering with explicit visual drop indicators (restrained red-slate indicators) for `before` and `after` positioning powered by `@atlaskit/pragmatic-drag-and-drop`.
- Accessible keyboard and touch alternative "Move to…" modal (`MoveItemModal`) for moving notes and folders to cycle-safe destinations.
- Active-note tag editing UI (`NoteTagEditor`) allowing inline tag viewing, adding with auto-completion from active tags, and removal in the note pane.
- Sidebar active tag roster (`TagList`) displaying tag frequency counts derived exclusively from active notes.
- Note state lifecycle precedence: `deletedAt != null` (Trash) takes absolute precedence over `archivedAt != null` (Archive); active notes require both null.
- Trash and Archive workflows: notes in Trash or Archive are excluded from All Notes, folder listings, and search; restored notes from Trash retain their prior archive state.
- Resizable sidebar bounded between 220px and 420px with pointer drag handle and user-scoped width persistence on `pointerup`.
- Sidebar layout modes: Expanded, Compact (56px rail mode), and Zen mode with `Ctrl+\` / `Cmd+\` keyboard shortcut and floating exit button.
- User-scoped layout settings storage (`userWorkspaceStorage.saveLayoutSettings`) scoped by Auth0 `sub` (`stack_layout_{hashSub(sub)}`) for sidebar mode, width, and expanded folder IDs.
- Persistence atomicity with optimistic UI updates and rollback on IndexedDB failure.
- Sprint 3 automated test suite (`workspaceOrganization.test.ts`) covering folder hierarchy, safe deletion, cycle prevention, sibling reordering, state precedence, tags, and user layout isolation (all 45/45 tests passing).

### Changed

- Strictly separated Folder (*"Where this note lives"*, 0 or 1) from Tag (*"What this note is about"*, 0 or more).
- Migrated all unpartitioned `localStorage` layout keys to strictly user-scoped storage namespaces.

## [0.6.0] - 2026-09-27

### Added

- Canonical profile query state (`useCurrentUserProfile`) with cache key `['profile', sub]`, propagating immediate identity updates to the sidebar, public navbar, account menu, and settings modal.
- Avatar engine with client-side native canvas center-square crop, resize to max 512×512, and WebP compression with S3 persistent key model (`avatarKey`/`avatarVersion`) avoiding expired presigned URLs.
- Optional `fullName` profile attribute (1–100 characters) updated without security challenges.
- Atomic username updates (`PATCH /me/username`) guarded by 6-digit email security challenges, executing single DynamoDB conditional transactions and releasing previous handles while preserving the user's permanent workspace storage database name (`stack_user_{hash(sub)}`).
- Sensitive email security challenge protocol (`SecurityChallengeService`) with server-side HMAC-SHA256 keyed digests, purpose binding (`change-username`, `change-email`, `change-password`, `add-password`, `delete-account`), 10-minute TTL, and 3-attempt lockout burn.
- Local Device Lock (6-digit PIN) powered by Web Crypto PBKDF2/SHA-256 with 16-byte random salt, configurable auto-lock timeouts (1, 5, 15, 30 min), exponential lockout cooldown, and safe re-authentication recovery without note loss.
- Danger Zone permanent account deletion (`DELETE /me`) requiring email security challenge and typed `@username` confirmation, destroying cloud and local storage records.
- Reorganized, accessible 4-section Profile & Settings Modal (Profile, Security, Account, Danger Zone) with focus trapping, ARIA dialog attributes, and Escape key dismissal.
- Comprehensive security test suite (`profileSecurity.test.ts`) covering profile updates, atomic handle migrations, cryptographic challenges, PIN lockouts, and danger zone teardowns (32/32 tests passing).

### Changed

- Bound `AppSidebar` and `PublicNavbar` to canonical profile state for real-time avatar thumbnail and handle synchronization.
- Labeled technical account metadata explicitly as "Account details" and clearly framed Device PIN as a local browser convenience lock.

## [0.5.0] - 2026-09-27

### Added

- Public project registry route (`/modula-project`) exhibiting systems engineered under the Modula Project umbrella with industrial "Mission Roster" layout.
- Real-time telemetry counters dynamically computed from typed project array (Total, Live, Under Reconstruction).
- Backend-authoritative STACK identity contract (`GET /me`, `POST /me/onboarding`, `GET /usernames/:username/availability`) where backend extracts `claims.sub` from API Gateway authorizer.
- Dedicated `DevMockIdentityAdapter` for local dev/test with explicit logging and zero simulated authority in production.
- Verified end-to-end acceptance test: Account A creates notes -> logout -> Account B logs in (A's notes absent) -> Account B creates notes -> logout -> Account A logs in (only A's notes visible).

### Changed

- Refactored `IdentityService` signatures to completely remove client-sent `sub` authority from onboarding and profile retrieval.
- Updated onboarding copy: `@username` is presented as STACK username and profile handle without claiming it can be used for Auth0 password sign-in.
- Guarded email verification resend: prevented browser SPA from calling Auth0 Management API or faking client success; requires trusted backend endpoint.

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
- Standalone `react-devtools` support with zero-bundle-impact dev injection for non-Chrome developer workflows (Vivaldi, Brave, Zen Browser).

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
