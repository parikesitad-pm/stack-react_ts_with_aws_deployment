import {
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
} from '~/features/landing/config/landing.types';

const STORAGE_KEY = 'stack_custom_landing';

declare global {
  interface Window {
    stack?: {
      howToUse: () => string;
      updateLandingPage: (options: Partial<LandingContent>) => string;
      resetLandingPage: () => string;
      status: () => string;
    };
  }
}

export function initConsoleHelper() {
  if (typeof window === 'undefined') return;
  if (window.stack) return;

  window.stack = {
    howToUse: () => {
      console.log(
        `%c  ____ _____  _    ____ _  __\n / ___|_   _|/ \\  / ___| |/ /\n \\___ \\ | | / _ \\| |   | ' / \n  ___) || |/ ___ \\ |___| . \\ \n |____/ |_/_/   \\_\\____|_|\\_\\ %c\n\n` +
          `%cSTACK · Operational Guide & System Console\n` +
          `%cVersion: 0.1.0 | License: MIT 2026 parikesitad-pm | URL: https://stack-13.vercel.app\n\n` +
          `%c[1] WORKSPACE NAVIGATION\n` +
          `  • /app              : Full local-first workspace (CodeMirror 6, tri-mode editor, IndexedDB)\n` +
          `  • /docs             : Architecture specification & keyboard shortcuts\n` +
          `  • /help             : System protocols & FAQ\n` +
          `  • /changelog        : Version history & release notes\n` +
          `  • /auth/login       : AWS Cognito User Pool authentication\n\n` +
          `%c[2] KEYBOARD SHORTCUTS\n` +
          `  • Ctrl + K          : Command palette (search, tags, actions)\n` +
          `  • Ctrl + N          : Create new Markdown note\n` +
          `  • Ctrl + 1 / 2 / 3  : Switch editor mode (Write / Split / Read)\n\n` +
          `%c[3] BROWSER CONSOLE COMMANDS\n` +
          `  • stack.howToUse()                   : Show this operational guide\n` +
          `  • stack.updateLandingPage(options)   : Customize landing page copy live in the browser\n` +
          `  • stack.resetLandingPage()           : Reset landing page copy to default\n` +
          `  • stack.status()                     : Check workspace telemetry\n\n` +
          `%cExample usage:\n` +
          `  stack.updateLandingPage({\n` +
          `    headline: "MY NOTES, MY STORAGE.",\n` +
          `    subheadline: "FAST & PRIVATE."\n` +
          `  });`,
        'color: #DC2626; font-weight: bold;',
        '',
        'color: #F7F8F8; font-weight: bold; font-size: 14px;',
        'color: #8C96A5; font-size: 11px;',
        'color: #DDE1E6; font-weight: bold;',
        'color: #DDE1E6; font-weight: bold;',
        'color: #DC2626; font-weight: bold;',
        'color: #8C96A5; font-style: italic;'
      );
      return 'Operational guide displayed above.';
    },

    updateLandingPage: (options: Partial<LandingContent>) => {
      try {
        let current: LandingContent = { ...DEFAULT_LANDING_CONTENT };
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            current = { ...current, ...JSON.parse(raw) };
          } catch {
            // ignore
          }
        }
        const updated: LandingContent = {
          badge: options.badge ?? current.badge,
          headline: options.headline ?? current.headline,
          subheadline: options.subheadline ?? current.subheadline,
          description: options.description ?? current.description,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('stack:update-landing', { detail: updated })
        );

        console.log(
          '%c[STACK]%c Landing page successfully updated live!',
          'color: #DC2626; font-weight: bold;',
          'color: #F7F8F8;'
        );
        console.table(updated);
        return 'Landing page updated! View changes at / or call stack.resetLandingPage() to restore.';
      } catch (err) {
        console.error('Failed to update landing page:', err);
        return 'Error updating landing page.';
      }
    },

    resetLandingPage: () => {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('stack:update-landing', {
          detail: DEFAULT_LANDING_CONTENT,
        })
      );
      console.log(
        '%c[STACK]%c Landing page restored to default configuration.',
        'color: #DC2626; font-weight: bold;',
        'color: #F7F8F8;'
      );
      return 'Landing page reset to default.';
    },

    status: () => {
      const info = {
        app: 'STACK · A Modula Project',
        version: '0.1.0',
        author: 'parikesitad-pm',
        license: 'MIT 2026',
        liveUrl: 'https://stack-13.vercel.app',
        repo: 'https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment',
        engine: 'CodeMirror 6 + IndexedDB + React Router v8',
      };
      console.table(info);
      return 'Status outputted above.';
    },
  };

  // Subtle console welcome notice
  console.log(
    '%c[STACK]%c System ready. Type %cstack.howToUse()%c in this console for guides and commands.',
    'color: #DC2626; font-weight: bold;',
    'color: #8C96A5;',
    'color: #F7F8F8; background: #23272C; padding: 1px 5px; border-radius: 3px; font-weight: bold; font-family: monospace;',
    'color: #8C96A5;'
  );
}
