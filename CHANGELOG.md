# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive `README.md` documenting tech stack, quick start, console tools, keyboard shortcuts, and dual AWS/Vercel deployment architecture.
- Browser DevTools console API (`stack.howToUse()`, `stack.updateLandingPage()`, `stack.resetLandingPage()`, `stack.status()`) with live DOM reactive updates.
- Terminal CLI helper scripts `pnpm run how-to-use` and `pnpm run update-landing`.
- Dynamic landing page configuration state with localStorage persistence.
- Cognito User Pool authentication mockup screens (`/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`) adhering to STACK post-war industrial design.
- Modular `@aws-amplify/auth` integration layer without `@aws-amplify/ui-react`.
- Protected workspace guard on `/app/*` redirecting unauthenticated operators to `/auth/login`.
- Multi-user data isolation architecture: backend derivation of identity strictly from Cognito JWT `sub` (`PK = USER#{sub}`, `SK = NOTE#{noteId}`) and local storage namespacing (`stack:user:{sub}`).
- Operator session card in workspace sidebar featuring active Cognito `sub` and sign-out trigger.

### Changed

- Replaced hardcoded landing page footer with standard `<PublicFooter />` displaying `STACK · A Modula Project · MIT License 2026 - crafted with <3 by parikesitad-pm` with GitHub link.

## [0.1.0] - 2026-09-27

### Added

- Initial STACK application foundation
- React Router Framework Mode
- Static prerendering for public routes
- CSR workspace under `/app`
- Atomic UI architecture
- STACK industrial design system
- Optimized STACK brand assets
- PWA foundation
- AWS Amplify deployment configuration
- Vercel preview deployment configuration
- Live preview workflow
