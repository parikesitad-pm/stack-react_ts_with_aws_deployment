#!/usr/bin/env node

/**
 * STACK CLI — Update Landing Page Configuration
 * Author: parikesitad-pm
 * License: MIT 2026
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(
  __dirname,
  '../app/features/landing/config/landing.types.ts'
);

const args = process.argv.slice(2);

function parseArgs() {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--headline=')) {
      result.headline = arg.replace('--headline=', '');
    } else if (arg === '--headline' && args[i + 1]) {
      result.headline = args[++i];
    } else if (arg.startsWith('--subheadline=')) {
      result.subheadline = arg.replace('--subheadline=', '');
    } else if (arg === '--subheadline' && args[i + 1]) {
      result.subheadline = args[++i];
    } else if (arg.startsWith('--badge=')) {
      result.badge = arg.replace('--badge=', '');
    } else if (arg === '--badge' && args[i + 1]) {
      result.badge = args[++i];
    } else if (arg.startsWith('--desc=')) {
      result.description = arg.replace('--desc=', '');
    } else if (arg === '--desc' && args[i + 1]) {
      result.description = args[++i];
    }
  }
  return result;
}

const params = parseArgs();

if (Object.keys(params).length === 0) {
  console.log(`
\x1b[38;5;196m\x1b[1m[STACK CLI] Update Landing Page Configuration\x1b[0m

Usage:
  node scripts/update-landing.js [options]
  pnpm run update-landing -- [options]

Options:
  --headline <text>      Update primary hero headline
  --subheadline <text>   Update subheadline text
  --badge <text>         Update hero badge text
  --desc <text>          Update hero paragraph description

Example:
  node scripts/update-landing.js --headline="OFFLINE-FIRST ENGINE" --subheadline="YOUR DATA STAYS LOCAL"
`);
  process.exit(0);
}

try {
  let fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');

  if (params.badge) {
    fileContent = fileContent.replace(
      /badge:\s*['"`].*?['"`]/,
      `badge: '${params.badge.replace(/'/g, "\\'")}'`
    );
  }
  if (params.headline) {
    fileContent = fileContent.replace(
      /headline:\s*['"`].*?['"`]/,
      `headline: '${params.headline.replace(/'/g, "\\'")}'`
    );
  }
  if (params.subheadline) {
    fileContent = fileContent.replace(
      /subheadline:\s*['"`].*?['"`]/,
      `subheadline: '${params.subheadline.replace(/'/g, "\\'")}'`
    );
  }
  if (params.description) {
    fileContent = fileContent.replace(
      /description:\s*['"`][\s\S]*?['"`],/,
      `description: '${params.description.replace(/'/g, "\\'")}',`
    );
  }

  fs.writeFileSync(CONFIG_FILE, fileContent, 'utf-8');
  console.log('\x1b[32m✔ Landing page configuration updated successfully!\x1b[0m');
  console.log(params);
} catch (err) {
  console.error('\x1b[31m✖ Failed to update landing configuration:\x1b[0m', err.message);
  process.exit(1);
}
