import { Link } from 'react-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Badge } from '~/components/atoms/Badge';
import { Button } from '~/components/atoms/Button';

export function meta() {
  return [
    { title: 'Changelog & Releases — STACK' },
    {
      name: 'description',
      content:
        'Full release history, changelog, and evolution of STACK Markdown application.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://stack-md.online/changelog',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Changelog & Releases — STACK' },
    {
      property: 'og:description',
      content:
        'Full release history, changelog, and evolution of STACK Markdown application.',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: 'https://stack-md.online/changelog' },
    {
      property: 'og:image',
      content: 'https://stack-md.online/brand/stack-logo.webp',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:image',
      content: 'https://stack-md.online/brand/stack-logo.webp',
    },
    { name: 'theme-color', content: '#090A0B' },
  ];
}

interface ReleaseEntry {
  version: string;
  tag: string;
  badgeVariant: 'active' | 'default' | 'accent';
  date: string;
  headline: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: 'v0.9.0',
    tag: 'Sprint 5 — Current Baseline',
    badgeVariant: 'active',
    date: '2026-09-27',
    headline: 'Images, Attachments & Offline Resilience',
    added: [
      'Local-first attachment repository persisted in user-scoped IndexedDB databases (stack_user_{subHash}) storing binary blobs.',
      'Multi-note relative attachment isolation: two notes can reference identical relative paths (e.g. ./assets/screenshot.webp) without cross-contamination.',
      'Binary immutability guarantee: attachmentId represents an immutable binary object, preventing stale object URLs.',
      'Undo/Redo attachment safety: removing Markdown references preserves binary in IndexedDB; Redo restores rendering without broken images.',
      'Durable and resumable upload queue: restores pending uploads on startup, network reconnection, and explicit retry.',
      'Client-side image optimization pipeline enforcing max 2560px edge, WebP compression, and 25MB pre-read file limit.',
      'Interactive public demo workspace at /demo operating in complete isolation under stack_demo_workspace and stack_demo_layout.',
    ],
    changed: [
      'Aligned canonical username contract across frontend schemas, onboarding copy, and profile modal to ^[a-z0-9._-]{3,32}$.',
      'WorkspaceView cleans up object URL caches on sign-out and purges attachments on permanent note deletion.',
    ],
    fixed: [
      'Fixed username availability check collapsing non-2xx responses or network errors into false "already taken" collisions.',
      'Fixed updateProfile dropping updates when initial profile state was null during onboarding completion.',
    ],
  },
  {
    version: 'v0.8.0',
    tag: 'Sprint 4',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Authoritative Markdown Editor UX & Slash Commands',
    added: [
      'Authoritative CodeMirror Markdown-first editing engine maintaining raw Markdown text as the sole source of truth.',
      'Pure Markdown transformation service supporting 15 formatting actions with placeholder insertion and clean heading toggles.',
      'Compact formatting toolbar with active syntax detection and mobile horizontal scrolling.',
      'Keyboard-first Slash Command palette triggered by "/" at line start with fuzzy keyword filtering and arrow navigation.',
      'Editor action bar with native Undo/Redo, Explicit Save (Ctrl+S), and Copy All Markdown.',
      '500ms debounced autosave pipeline with revision safety and truthful save state machine.',
    ],
  },
  {
    version: 'v0.7.0',
    tag: 'Sprint 3',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Workspace Organization, Hierarchy & Persistence',
    added: [
      'Nested folder system supporting arbitrary depths with cycle prevention (wouldCreateCycle).',
      'Safe folder deletion workflow reparenting only direct notes and immediate folders, never flattening descendants.',
      'Note and folder sibling reordering with visual drop indicators powered by Pragmatic Drag and Drop.',
      'Accessible keyboard and touch alternative "Move to..." modal.',
      'Active-note tag editing UI and sidebar active tag roster with real-time frequency counts.',
      'Strict note state lifecycle precedence: Trash > Archive > Active.',
      'Three sidebar layout modes: Expanded (resizable 220px–420px), Compact (56px rail), and Zen fullscreen.',
      'User-scoped layout settings persistence (stack_layout_{hashSub(sub)}).',
    ],
  },
  {
    version: 'v0.6.0',
    tag: 'Sprint 2',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Profile, Security & Device Lock',
    added: [
      'Canonical profile query state (useCurrentUserProfile) propagating immediate updates across workspace and navbar.',
      'Client-side avatar crop and WebP compression with persistent S3 key structure.',
      'Atomic username updates guarded by 6-digit email security challenges.',
      'Sensitive email challenge protocol with server HMAC-SHA256 digests and 3-attempt lockout.',
      'Local Device Lock (6-digit PIN) powered by Web Crypto PBKDF2/SHA-256 with auto-lock timeouts.',
      'Danger Zone permanent account deletion destroying cloud and local storage records.',
    ],
  },
  {
    version: 'v0.5.0',
    tag: 'Sprint 1 Acceptance',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Modula Registry & Production Acceptance',
    added: [
      'Public project registry route (/modula-project) exhibiting systems under the Modula Project umbrella.',
      'Backend-authoritative identity contract where backend extracts claims.sub from API Gateway authorizer.',
      'Verified cross-user isolation: User A notes are completely invisible to User B.',
    ],
  },
  {
    version: 'v0.4.0',
    tag: 'Sprint 1',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Auth0 Identity & Per-User Workspace Partitioning',
    added: [
      'Auth0 integration via @auth0/auth0-react supporting Google, GitHub, and Universal Login.',
      'Email verification gate blocking private workspace until email is verified.',
      'First-run identity onboarding with strict username normalization.',
      'Hard per-user IndexedDB workspace partitioning (stack_user_{hash(sub)}).',
      'Comprehensive 10-step logout cleanup protocol clearing caches and closing DB connections.',
    ],
  },
  {
    version: 'v0.3.0',
    tag: 'Foundation Cutover',
    badgeVariant: 'default',
    date: '2026-09-27',
    headline: 'Domain Cutover & Core Architecture',
    added: [
      'Production custom domain cutover to https://stack-md.online.',
      'Three sidebar layout modes (expanded, compact, zen).',
      'Shared MarkdownRenderer across Split preview and Read mode.',
      'PWA standalone installation across Windows, Linux, and macOS.',
    ],
  },
  {
    version: 'v0.1.0',
    tag: 'Initial Foundation',
    badgeVariant: 'default',
    date: '2026-09-26',
    headline: 'Initial Project Foundation & Design System',
    added: [
      'React 19, TypeScript, React Router Framework Mode, Vite, and Tailwind CSS v4.',
      'Post-war industrial steel design tokens (Background, Surface, Slate Metal, Bone White, Red Slate).',
      'Brand logo compiled into lossless WebP and PWA manifest icons.',
      'Interactive UI mockup with Write, Split, and Read modes.',
      'Prerendered public routes (/docs, /help, /changelog) and CSR /app workspace.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono selection:bg-stack-red-muted selection:text-stack-bone">
      <PublicNavbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-3 border-b border-stack-metal/60 pb-6">
          <Badge variant="accent">VERSION REGISTRY</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-stack-bone">
            Release History
          </h1>
          <p className="text-xs sm:text-sm text-stack-silver max-w-2xl leading-relaxed">
            Every release strictly adheres to Semantic Versioning and Keep a
            Changelog principles. Keystroke reliability, zero telemetry noise,
            and data sovereignty are guaranteed.
          </p>
          <div className="pt-2 flex gap-3">
            <Link to="/demo">
              <Button variant="primary" size="sm">
                <span>Try Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/how-to-use">
              <Button variant="outline" size="sm">
                <span>How to Use STACK</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {RELEASES.map((rel) => (
            <div
              key={rel.version}
              className="rounded border border-stack-metal bg-stack-surface p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stack-metal/40 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-stack-bone">
                    {rel.version}
                  </span>
                  <Badge variant={rel.badgeVariant}>{rel.tag}</Badge>
                </div>
                <span className="text-xs text-stack-steel font-mono">
                  {rel.date}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stack-bone">
                  {rel.headline}
                </h3>
              </div>

              {rel.added && rel.added.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <h4 className="font-bold text-stack-silver uppercase text-[10px] tracking-wider">
                    Added
                  </h4>
                  <ul className="list-disc ml-5 space-y-1 text-stack-silver">
                    {rel.added.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rel.changed && rel.changed.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <h4 className="font-bold text-stack-silver uppercase text-[10px] tracking-wider">
                    Changed
                  </h4>
                  <ul className="list-disc ml-5 space-y-1 text-stack-silver">
                    {rel.changed.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rel.fixed && rel.fixed.length > 0 && (
                <div className="text-xs space-y-1.5">
                  <h4 className="font-bold text-stack-silver uppercase text-[10px] tracking-wider">
                    Fixed
                  </h4>
                  <ul className="list-disc ml-5 space-y-1 text-stack-silver">
                    {rel.fixed.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
