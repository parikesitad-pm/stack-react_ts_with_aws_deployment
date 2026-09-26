import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Shield,
  Zap,
  Terminal,
  Laptop,
  Database,
  Lock,
  CheckCircle2,
  ChevronRight,
  Download,
} from 'lucide-react';
import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Button } from '~/components/atoms/Button';
import { Badge } from '~/components/atoms/Badge';
import { InstallStackButton } from '~/features/pwa/components/InstallStackButton';
import {
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
} from '~/features/landing/config/landing.types';

export default function LandingPage() {
  const [content, setContent] = useState<LandingContent>(
    DEFAULT_LANDING_CONTENT
  );

  useEffect(() => {
    const raw = localStorage.getItem('stack_custom_landing');
    if (raw) {
      try {
        setContent((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch {
        // ignore invalid json
      }
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LandingContent>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
      }
    };

    window.addEventListener('stack:update-landing', handleUpdate);
    return () =>
      window.removeEventListener('stack:update-landing', handleUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col selection:bg-stack-red-muted selection:text-stack-bone">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-stack-metal/70 px-4 py-20 sm:px-6 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(#32373D_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

          <div className="relative mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-stack-metal bg-stack-surface px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-stack-red-slate" />
              <span className="font-mono text-xs text-stack-silver">
                {content.badge}
              </span>
            </div>

            <h1 className="font-mono text-4xl sm:text-6xl font-extrabold tracking-tight text-stack-bone leading-tight">
              {content.headline} <br />
              <span className="text-stack-steel">{content.subheadline}</span>
            </h1>

            <p className="mx-auto max-w-2xl font-mono text-sm sm:text-base text-stack-silver leading-relaxed">
              {content.description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/app">
                <Button variant="primary" size="lg" className="shadow-lg">
                  <span>Open STACK</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="secondary" size="lg">
                  <span>Explore Docs</span>
                </Button>
              </Link>
            </div>

            {/* Quick telemetry badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 font-mono text-xs text-stack-steel">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-stack-red-hover" />
                <span>Zero Typing Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-stack-silver" />
                <span>IndexedDB Local-First</span>
              </div>
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-stack-silver" />
                <span>Desktop PWA Native</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-stack-silver" />
                <span>Zero Vendor Lock-in</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="border-b border-stack-metal/70 py-16 sm:py-20 bg-stack-surface/40 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-xl">
              <Badge variant="accent">THE PHILOSOPHY</Badge>
              <h2 className="mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-stack-bone">
                Why STACK Exists
              </h2>
              <p className="mt-2 font-mono text-xs sm:text-sm text-stack-steel leading-relaxed">
                Modern note SaaS apps have become bloated database engines
                pretending to support Markdown. STACK restores Markdown as the
                first-class citizen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded border border-stack-metal bg-stack-surface p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-stack-metal bg-stack-surface-raised text-stack-bone font-mono">
                  01
                </div>
                <h3 className="font-mono text-base font-bold text-stack-bone">
                  Typing Never Waits
                </h3>
                <p className="font-mono text-xs text-stack-steel leading-relaxed">
                  Every stroke commits to memory and IndexedDB immediately.
                  Network sync happens in the background. Even during a complete
                  network blackout, your editor flows uninterrupted.
                </p>
              </div>

              <div className="rounded border border-stack-metal bg-stack-surface p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-stack-metal bg-stack-surface-raised text-stack-bone font-mono">
                  02
                </div>
                <h3 className="font-mono text-base font-bold text-stack-bone">
                  Pure Markdown Storage
                </h3>
                <p className="font-mono text-xs text-stack-steel leading-relaxed">
                  No obfuscated binary formats or proprietary database schema.
                  If you export your workspace, you get clean, standard Markdown
                  files readable on any system forever.
                </p>
              </div>

              <div className="rounded border border-stack-metal bg-stack-surface p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-stack-metal bg-stack-surface-raised text-stack-bone font-mono">
                  03
                </div>
                <h3 className="font-mono text-base font-bold text-stack-bone">
                  Post-War Industrial Tooling
                </h3>
                <p className="font-mono text-xs text-stack-steel leading-relaxed">
                  A restrained palette of worn steel, slate, and bone white with
                  red-slate controls. Built to feel like heavy-duty military
                  avionics, not a childish toy or noisy gaming UI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-xl">
              <Badge variant="default">OPERATIONAL CAPABILITIES</Badge>
              <h2 className="mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-stack-bone">
                Built for Technical Precision
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded border border-stack-metal/70 bg-stack-surface/60 p-5 space-y-2">
                <Terminal className="h-5 w-5 text-stack-red-hover" />
                <h4 className="font-mono text-sm font-bold text-stack-bone">
                  CodeMirror 6 Engine
                </h4>
                <p className="font-mono text-xs text-stack-steel">
                  Lazy-loaded specifically in /app. Does not burden public
                  landing pages or SEO crawlers.
                </p>
              </div>

              <div className="rounded border border-stack-metal/70 bg-stack-surface/60 p-5 space-y-2">
                <Laptop className="h-5 w-5 text-stack-silver" />
                <h4 className="font-mono text-sm font-bold text-stack-bone">
                  Tri-Mode Editing
                </h4>
                <p className="font-mono text-xs text-stack-steel">
                  Seamlessly toggle between Write, Split (code + rendered
                  preview), and Read viewports.
                </p>
              </div>

              <div className="rounded border border-stack-metal/70 bg-stack-surface/60 p-5 space-y-2">
                <Database className="h-5 w-5 text-stack-silver" />
                <h4 className="font-mono text-sm font-bold text-stack-bone">
                  Command Palette
                </h4>
                <p className="font-mono text-xs text-stack-steel">
                  Instant Ctrl+K jump list for notes, tags, themes, and system
                  settings.
                </p>
              </div>

              <div className="rounded border border-stack-metal/70 bg-stack-surface/60 p-5 space-y-2">
                <Shield className="h-5 w-5 text-stack-silver" />
                <h4 className="font-mono text-sm font-bold text-stack-bone">
                  PWA & Desktop First
                </h4>
                <p className="font-mono text-xs text-stack-steel">
                  Installable directly onto Windows and Linux systems as an
                  isolated standalone application.
                </p>
              </div>
            </div>

            {/* Desktop PWA Install Section */}
            <div className="mt-16 pt-12 border-t border-stack-metal/70 text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-stack-metal bg-stack-surface px-3 py-1">
                <Download className="h-3.5 w-3.5 text-stack-red-hover" />
                <span className="font-mono text-xs text-stack-silver">
                  STANDALONE PWA
                </span>
              </div>

              <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-stack-bone">
                STACK on your desktop
              </h3>

              <p className="mx-auto max-w-xl font-mono text-xs sm:text-sm text-stack-steel leading-relaxed">
                Install STACK directly from your browser. No app store required,
                zero background telemetry daemons, and instant launch with full
                offline capabilities.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[11px]">
                <span className="px-2.5 py-1 rounded border border-stack-metal bg-stack-surface text-stack-silver">
                  Windows
                </span>
                <span className="px-2.5 py-1 rounded border border-stack-metal bg-stack-surface text-stack-silver">
                  Linux (Debian / Arch / Fedora)
                </span>
                <span className="px-2.5 py-1 rounded border border-stack-metal bg-stack-surface text-stack-silver">
                  macOS (Chromium / Safari Dock)
                </span>
              </div>

              <div className="pt-2 flex justify-center">
                <InstallStackButton size="lg" variant="primary" />
              </div>
            </div>

            {/* CTA Box */}
            <div className="mt-12 rounded-lg border border-stack-metal bg-stack-surface-raised p-8 text-center sm:p-12 space-y-4">
              <h3 className="font-mono text-2xl font-bold text-stack-bone">
                Ready to take back your notes?
              </h3>
              <p className="mx-auto max-w-lg font-mono text-xs sm:text-sm text-stack-silver">
                Launch the application right now in your browser. All data stays
                local to your machine.
              </p>
              <div className="pt-2">
                <Link to="/app">
                  <Button variant="primary" size="lg">
                    <span>Launch STACK Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
