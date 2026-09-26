# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-26
### Added
- Initial project foundation and architecture setup.
- Static prerender for public pages (`/`, `/docs`, `/help`, `/changelog`) and SPA fallback for `/app/*` using `ssr: false` in React Router Framework mode.
- Optimized brand assets: primary `stack-logo.avif` (302 KB) with `stack-logo.webp` fallback via `<picture>` element, multi-size favicon, and PWA manifest icons.
- Integrated `react-markdown` with `remark-gfm` for pure Markdown preview (tables, checklists, strikethrough) without raw HTML.
- Truly lazy-loaded CodeMirror 6 editor with React Suspense boundary.
- Clean domain-driven component organization: moved `NoteListItem` to `features/notes/components/`.
- Technical post-war industrial design system with custom palette (Background `#090A0B`, Surface `#111315`, Slate Metal `#32373D`, Bone White `#E7E5E1`, Red Slate `#7A3237`).
- Interactive UI mockup covering Landing Page, Main STACK Workspace, Write/Split/Read modes, Command Palette, and Settings panel with explicit mockup status indicators.
