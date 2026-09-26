import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Badge } from '~/components/atoms/Badge';
import { Kbd } from '~/components/atoms/Kbd';

export function meta() {
  return [
    { title: 'System Documentation — STACK' },
    {
      name: 'description',
      content:
        'Technical operational guide, architecture, and write pipeline for STACK Markdown notes engine.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://stack-13.vercel.app/docs',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'System Documentation — STACK' },
    {
      property: 'og:description',
      content:
        'Technical operational guide, architecture, and write pipeline for STACK Markdown notes engine.',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: 'https://stack-13.vercel.app/docs' },
  ];
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono">
      <PublicNavbar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <Badge variant="accent">SYSTEM DOCUMENTATION</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stack-bone border-b border-stack-metal/60 pb-3">
          STACK Architecture & Operational Guide
        </h1>

        <div className="mt-8 space-y-8 text-xs text-stack-silver leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-stack-bone">
              1. Local Storage Guarantee
            </h2>
            <p>
              STACK utilizes IndexedDB as the primary persistence layer. When
              you enter characters into the editor, the document state is saved
              into an IndexedDB object store with zero network dependency.
            </p>
            <div className="rounded border border-stack-metal bg-stack-surface p-4">
              <span className="text-stack-bone font-bold">Write Pipeline:</span>
              <p className="mt-1 text-stack-steel">
                CodeMirror ViewUpdate → Local Memory Buffer → IndexedDB Put
                Operation → Sync Worker Queue
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-stack-bone">
              2. Keyboard Navigation Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface">
                <span>Command Palette</span>
                <div className="flex gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>K</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface">
                <span>New Document</span>
                <div className="flex gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>N</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface">
                <span>Write Mode</span>
                <div className="flex gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>1</Kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface">
                <span>Split Mode</span>
                <div className="flex gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>2</Kbd>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-stack-bone">
              3. Desktop PWA Installation
            </h2>
            <p>
              On Windows and Linux, click the install icon in your browser
              address bar or use Chromium/Edge/Brave menu &gt; "Install STACK".
              Once installed, STACK runs in its own window without browser
              chrome.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
