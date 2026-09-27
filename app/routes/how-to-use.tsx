import { Link } from 'react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Command,
  Database,
  FileCode2,
  FolderTree,
  Image as ImageIcon,
  Laptop,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Badge } from '~/components/atoms/Badge';
import { Button } from '~/components/atoms/Button';
import { Kbd } from '~/components/atoms/Kbd';

export function meta() {
  return [
    { title: 'How to Use STACK — Operator Manual & Quickstart' },
    {
      name: 'description',
      content:
        'Step-by-step operating procedures for writing, organizing, attaching media, and navigating local-first Markdown notes in STACK.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://stack-md.online/how-to-use',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'How to Use STACK — Operator Manual' },
    {
      property: 'og:description',
      content:
        'Step-by-step operating procedures for writing, organizing, attaching media, and navigating local-first Markdown notes in STACK.',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: 'https://stack-md.online/how-to-use' },
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

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono selection:bg-stack-red-muted selection:text-stack-bone">
      <PublicNavbar />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-stack-metal/60 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">OPERATOR MANUAL</Badge>
            <Badge variant="default">STACK v0.9.0</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stack-bone">
            How to Use STACK
          </h1>
          <p className="text-sm text-stack-silver max-w-3xl leading-relaxed">
            STACK is an industrial-grade, local-first note-taking engine built
            for speed, keyboard ergonomics, and uncompromised data ownership.
            Here is your operational guide to mastering the workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/demo">
              <Button variant="primary" size="sm">
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="secondary" size="sm">
                <span>Open Workspace</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Section 1: Quickstart */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <Zap className="h-5 w-5 text-stack-red-hover" />
            <h2>1. Quickstart: Zero Latency, Local-First</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded border border-stack-metal bg-stack-surface p-5 space-y-2">
              <h3 className="font-bold text-stack-bone flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-stack-silver" />
                No Account Required to Test
              </h3>
              <p className="text-stack-silver leading-relaxed">
                Visit <Link to="/demo" className="text-stack-bone underline">/demo</Link> to test the entire workspace immediately. The demo runs inside an isolated IndexedDB partition (<code className="text-stack-bone">stack_demo_workspace</code>) with sample notes and folders pre-loaded.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-5 space-y-2">
              <h3 className="font-bold text-stack-bone flex items-center gap-2">
                <Database className="h-4 w-4 text-stack-silver" />
                Air-Gapped Persistence
              </h3>
              <p className="text-stack-silver leading-relaxed">
                Every keystroke commits locally to IndexedDB within milliseconds. You can write entirely offline, in airplane mode, or during connection blackouts without losing a single character.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Editor Power */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <FileCode2 className="h-5 w-5 text-stack-red-hover" />
            <h2>2. Authoritative Markdown Editor</h2>
          </div>
          <p className="text-xs text-stack-silver leading-relaxed">
            The editor is powered by CodeMirror 6. The raw Markdown string is always the sole source of truth—never an opaque JSON document tree.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Formatting Toolbar</h3>
              <p className="text-stack-silver leading-relaxed">
                Use the top toolbar to toggle Headings (H1, H2), Bold, Italic, Strikethrough, Code Blocks, Quotes, Lists, and Tables without breaking document flow.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Slash Commands</h3>
              <p className="text-stack-silver leading-relaxed">
                Type <code className="text-stack-bone bg-stack-surface-raised px-1 py-0.5 rounded">/</code> at the beginning of any line to summon the command menu. Filter by typing <code className="text-stack-bone">/h1</code>, <code className="text-stack-bone">/code</code>, <code className="text-stack-bone">/table</code>, or <code className="text-stack-bone">/check</code>.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Auto-Save & Status</h3>
              <p className="text-stack-silver leading-relaxed">
                Changes autosave 500ms after you stop typing. The status badge indicates <span className="text-stack-bone">Saved Locally</span>, and flushes instantly before switching notes or logging out.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Viewport Modes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <Layers className="h-5 w-5 text-stack-red-hover" />
            <h2>3. Tri-Mode Viewports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stack-bone">Write Mode</span>
                <Kbd>Ctrl+1</Kbd>
              </div>
              <p className="text-stack-silver leading-relaxed">
                Clean distraction-free full-width editor. Optimized for deep thought and long-form technical writing.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stack-bone">Split Mode</span>
                <Kbd>Ctrl+2</Kbd>
              </div>
              <p className="text-stack-silver leading-relaxed">
                Side-by-side editing and synchronized Markdown preview. Renders GitHub Flavored Markdown (GFM), tables, and images in real time.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stack-bone">Read Mode</span>
                <Kbd>Ctrl+3</Kbd>
              </div>
              <p className="text-stack-silver leading-relaxed">
                Pure rendered document mode. Hides all editor widgets for seamless reading, reference, and review.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Organization */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <FolderTree className="h-5 w-5 text-stack-red-hover" />
            <h2>4. Workspace Organization & Hierarchy</h2>
          </div>
          <div className="rounded border border-stack-metal bg-stack-surface p-5 space-y-4 text-xs text-stack-silver">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-stack-bone">Nested Folders & Cycle Safety</h3>
                <p className="leading-relaxed">
                  Create folders and nest them to arbitrary depths. Safe folder deletion reparents direct child notes and folders without flattening or destroying subtrees.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-stack-bone">Active Tags & Tag Roster</h3>
                <p className="leading-relaxed">
                  Add tags directly in the note pane. The sidebar lists active tags with real-time frequency counts. Clicking any tag instantly filters your note list.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-stack-bone">Drag & Drop Sibling Reordering</h3>
                <p className="leading-relaxed">
                  Reorder notes and sibling folders using precise visual before/after drop indicators powered by Pragmatic Drag and Drop.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-stack-bone">Archive & Trash Precedence</h3>
                <p className="leading-relaxed">
                  Move finished documents to Archive, or soft-delete them to Trash. Notes in Trash are safely isolated until you choose to restore or permanently empty them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Media & Attachments */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <ImageIcon className="h-5 w-5 text-stack-red-hover" />
            <h2>5. Images & Attachments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Clipboard Paste</h3>
              <p className="text-stack-silver leading-relaxed">
                Take a screenshot and press <Kbd>Ctrl+V</Kbd> (or <Kbd>Cmd+V</Kbd>) directly in the editor. STACK immediately stores the binary in your local IndexedDB and inserts a relative Markdown reference.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Client Optimization</h3>
              <p className="text-stack-silver leading-relaxed">
                Large images are automatically downscaled to 2560px and converted to modern WebP format in the browser before saving, keeping storage lightweight.
              </p>
            </div>
            <div className="rounded border border-stack-metal bg-stack-surface p-4 space-y-2">
              <h3 className="font-bold text-stack-bone">Per-Note Isolation</h3>
              <p className="text-stack-silver leading-relaxed">
                Two notes can legitimately reference <code className="text-stack-bone">./assets/diagram.webp</code> without collision. Binary attachments are bound strictly to your authenticated partition.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Keyboard Shortcuts */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <Command className="h-5 w-5 text-stack-red-hover" />
            <h2>6. Keyboard Shortcuts Cheatsheet</h2>
          </div>
          <div className="rounded border border-stack-metal bg-stack-surface overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stack-metal/70 bg-stack-surface-raised text-stack-bone">
                  <th className="p-3">Shortcut</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stack-metal/40 text-stack-silver">
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd></td>
                  <td className="p-3 text-stack-bone font-bold">Open Command Palette</td>
                  <td className="p-3">Global (Workspace)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>N</Kbd></td>
                  <td className="p-3 text-stack-bone font-bold">Create New Note</td>
                  <td className="p-3">Global (Workspace)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>S</Kbd></td>
                  <td className="p-3 text-stack-bone font-bold">Explicit Save & Flush</td>
                  <td className="p-3">Editor</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>\</Kbd></td>
                  <td className="p-3 text-stack-bone font-bold">Toggle Zen Fullscreen Mode</td>
                  <td className="p-3">Global (Workspace)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>1</Kbd></td>
                  <td className="p-3 text-stack-bone">Switch to Write Mode</td>
                  <td className="p-3">Workspace</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>2</Kbd></td>
                  <td className="p-3 text-stack-bone">Switch to Split Mode</td>
                  <td className="p-3">Workspace</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>3</Kbd></td>
                  <td className="p-3 text-stack-bone">Switch to Read Mode</td>
                  <td className="p-3">Workspace</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>Ctrl</Kbd> + <Kbd>B</Kbd> / <Kbd>I</Kbd></td>
                  <td className="p-3 text-stack-bone">Bold / Italic Toggle</td>
                  <td className="p-3">Editor Selection</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono"><Kbd>/</Kbd> (newline)</td>
                  <td className="p-3 text-stack-bone font-bold">Trigger Slash Command Menu</td>
                  <td className="p-3">Editor Line Start</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 7: Desktop PWA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stack-bone font-bold text-lg">
            <Laptop className="h-5 w-5 text-stack-red-hover" />
            <h2>7. Desktop PWA & Standalone Installation</h2>
          </div>
          <div className="rounded border border-stack-metal bg-stack-surface p-5 space-y-3 text-xs text-stack-silver leading-relaxed">
            <p>
              STACK can be installed as a native desktop application on Windows, Linux (Debian, Arch, Fedora), and macOS without going through third-party app stores:
            </p>
            <ol className="list-decimal ml-5 space-y-1.5 text-stack-silver">
              <li>Open <span className="text-stack-bone">https://stack-md.online</span> in Google Chrome, Brave, Chromium, or Microsoft Edge.</li>
              <li>Click the <span className="text-stack-bone">Install</span> icon in your browser address bar or click the desktop install button on the landing page.</li>
              <li>STACK launches in its own isolated window with system tray integration and offline capability.</li>
            </ol>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="rounded-lg border border-stack-metal bg-stack-surface-raised p-8 text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-stack-bone">
            Ready to experience distraction-free writing?
          </h3>
          <p className="mx-auto max-w-lg text-xs sm:text-sm text-stack-silver">
            Test the interface in demo mode or open your dedicated workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/demo">
              <Button variant="primary" size="lg">
                <span>Try Demo Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="secondary" size="lg">
                <span>Launch Full Workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
