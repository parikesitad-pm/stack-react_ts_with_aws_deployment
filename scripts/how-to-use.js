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
${STEEL}Markdown-first, local-friendly PWA note taking engine for desktop & web${RESET}
${STEEL}Author: parikesitad-pm | License: MIT 2026${RESET}
${SILVER}Live URL: https://stack-13.vercel.app${RESET}
${SILVER}Repository: https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment${RESET}

${RED}${BOLD}[1] HOW TO USE STACK${RESET}
  ${BONE}1. Quick Start Local Development:${RESET}
     ${STEEL}$ pnpm install${RESET}
     ${STEEL}$ pnpm run dev${RESET}
     Open ${BONE}http://localhost:5173/${RESET} to view landing page or ${BONE}http://localhost:5173/app${RESET} for notes.

  ${BONE}2. Workspace & Notes Management (/app):${RESET}
     • Notes are saved automatically to ${BONE}IndexedDB${RESET} (isolated per user: ${STEEL}stack:user:{sub}${RESET}).
     • Full offline capability via service worker (PWA).
     • CodeMirror 6 markdown editor with instant preview.

  ${BONE}3. Keyboard Shortcuts:${RESET}
     • ${BONE}Ctrl + K${RESET} : Open Command Palette (search notes, tags, commands)
     • ${BONE}Ctrl + N${RESET} : Create new note
     • ${BONE}Ctrl + 1${RESET} : Switch to Write Mode (editor only)
     • ${BONE}Ctrl + 2${RESET} : Switch to Split Mode (editor + markdown preview)
     • ${BONE}Ctrl + 3${RESET} : Switch to Read Mode (rendered document only)

  ${BONE}4. Build & Production Verification:${RESET}
     ${STEEL}$ pnpm run build${RESET}
     Produces prerendered static pages in ${BONE}build/client/${RESET} and SPA fallback ${BONE}__spa-fallback.html${RESET}.

${RED}${BOLD}[2] CONSOLE UTILITIES${RESET}
  ${BONE}• Terminal:${RESET}
     ${STEEL}pnpm run how-to-use${RESET}      : Display this operational guide
     ${STEEL}pnpm run update-landing${RESET}  : Update landing page hero copy via CLI

  ${BONE}• Browser Devtools (F12 Console):${RESET}
     ${STEEL}stack.howToUse()${RESET}                   : View operational guide in browser console
     ${STEEL}stack.updateLandingPage(options)${RESET}   : Update hero headline, subheadline, or badge live
     ${STEEL}stack.resetLandingPage()${RESET}           : Reset landing page to default
     ${STEEL}stack.status()${RESET}                     : Inspect workspace telemetry & author info
`);
