#!/usr/bin/env node

/**
 * STACK CLI — How to Use & Operational Guide
 * Author: parikesitad-pm
 * License: MIT 2026
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[38;5;196m';
const STEEL = '\x1b[38;5;244m';
const BONE = '\x1b[38;5;255m';
const SILVER = '\x1b[38;5;250m';

console.log(`
${RED}${BOLD}  ____ _____  _    ____ _  __
 / ___|_   _|/ \\  / ___| |/ /
 \\___ \\ | | / _ \\| |   | ' / 
  ___) || |/ ___ \\ |___| . \\ 
 |____/ |_/_/   \\_\\____|_|\\_\\${RESET}

${BONE}${BOLD}STACK · A Modula Project${RESET}
${STEEL}Markdown notes without the noise.${RESET}
${STEEL}Author: parikesitad-pm | License: MIT 2026${RESET}
${SILVER}Live URL: https://stack-md.online${RESET}
${SILVER}How to Use Guide: https://stack-md.online/how-to-use${RESET}
${SILVER}Interactive Demo: https://stack-md.online/demo${RESET}
${SILVER}Repository: https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment${RESET}

${RED}${BOLD}[1] HOW TO USE STACK${RESET}
  ${BONE}1. Quickstart & Zero Setup:${RESET}
     • Visit ${BONE}https://stack-md.online/demo${RESET} to test immediately without signing up.
     • For local development:
       ${STEEL}$ pnpm install && pnpm run dev${RESET}
       Open ${BONE}http://localhost:5173/${RESET} for landing page or ${BONE}http://localhost:5173/demo${RESET} for demo.

  ${BONE}2. Authoritative Markdown Editor (/app):${RESET}
     • CodeMirror 6 engine: raw Markdown text is always the single source of truth.
     • Type ${BONE}/${RESET} at any line start to open the Slash Command Palette (/h1, /table, /code, /check).
     • Compact formatting toolbar with real-time active syntax detection.
     • Automatic 500ms debounced persistence to ${BONE}IndexedDB${RESET} (partitioned per user: ${STEEL}stack_user_{subHash}${RESET}).

  ${BONE}3. Organization & Attachments:${RESET}
     • Create nested folders with cycle prevention and safe reparenting deletion.
     • Tag notes with #tags and filter via the sidebar tag roster.
     • Paste images from clipboard (${BONE}Ctrl+V${RESET}) or drag & drop image files.
     • Client-side auto-downscaling to WebP with offline-safe IndexedDB binary storage.

  ${BONE}4. Keyboard Shortcuts Cheatsheet:${RESET}
     • ${BONE}Ctrl + K${RESET} : Open Command Palette (jump to notes, tags, commands)
     • ${BONE}Ctrl + N${RESET} : Create new note
     • ${BONE}Ctrl + S${RESET} : Explicit save & flush to storage
     • ${BONE}Ctrl + \\${RESET} : Toggle Zen fullscreen mode
     • ${BONE}Ctrl + 1${RESET} : Switch to Write Mode (editor only)
     • ${BONE}Ctrl + 2${RESET} : Switch to Split Mode (editor + rendered preview)
     • ${BONE}Ctrl + 3${RESET} : Switch to Read Mode (rendered document only)
     • ${BONE}Ctrl + B / I${RESET} : Bold / Italic toggle

  ${BONE}5. Production Build & Verification:${RESET}
     ${STEEL}$ pnpm run typecheck && pnpm test && pnpm run build${RESET}
     Produces prerendered static pages in ${BONE}build/client/${RESET} and SPA fallback ${BONE}__spa-fallback.html${RESET}.
`);
