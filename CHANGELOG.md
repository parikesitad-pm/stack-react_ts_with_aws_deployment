# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 9-language internationalization (`i18next` + `react-i18next`) with dynamic chunk code-splitting (`en`, `id`, `es`, `fr`, `de`, `pt`, `ja`, `ko`, `zh-CN`).
- One-shot terminal typewriter animation for hero tagline (`Markdown notes without the noise.`) with `prefers-reduced-motion` accessibility support.
- Industrial Manifesto section on landing page detailing local-first design and zero-telemetry architecture.
- Production SEO metadata with route-level canonical links, OpenGraph, Twitter Cards, and `SoftwareApplication` JSON-LD structured data.
- Document outline panel parsing Markdown heading hierarchies (`H1`-`H3`) with smooth navigation scroll.
- Crash recovery draft buffer and banner safeguarding uncommitted keystrokes across browser restarts.
- Universal vault import/export engine supporting single `.md` download, note `.zip` bundle with local assets, full workspace backup (`stack-manifest.json`), and non-destructive collision resolution.
- Live reading time estimation indicator (~200 wpm) in workspace header.
- Cognito User Pool authentication mockup screens (`/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`) adhering to STACK post-war industrial design.
- Modular `@aws-amplify/auth` integration layer without `@aws-amplify/ui-react`.
- Protected workspace guard on `/app/*` redirecting unauthenticated operators to `/auth/login`.
- Multi-user data isolation architecture: backend derivation of identity strictly from Cognito JWT `sub` (`PK = USER#{sub}`, `SK = NOTE#{noteId}`) and local storage namespacing (`stack:user:{sub}`).
- Operator session card in workspace sidebar featuring active Cognito `sub` and sign-out trigger.

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
