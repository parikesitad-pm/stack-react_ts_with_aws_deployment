import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Badge } from '~/components/atoms/Badge';

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
  ];
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono">
      <PublicNavbar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <Badge variant="accent">VERSION REGISTRY</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stack-bone border-b border-stack-metal/60 pb-3">
          Release History
        </h1>

        <div className="mt-8 space-y-8">
          <div className="rounded border border-stack-metal bg-stack-surface p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stack-metal/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-stack-bone">
                  v0.1.0
                </span>
                <Badge variant="active">Initial Mockup & Foundation</Badge>
              </div>
              <span className="text-xs text-stack-steel">2026-09-26</span>
            </div>

            <div className="text-xs text-stack-silver space-y-2">
              <h4 className="font-bold text-stack-bone uppercase text-[10px] tracking-wider">
                Added
              </h4>
              <ul className="list-disc ml-5 space-y-1 text-stack-silver">
                <li>
                  Initial project foundation with React 19, TypeScript, React
                  Router, Vite, and Tailwind CSS v4.
                </li>
                <li>
                  Post-war industrial steel design tokens (Background, Surface,
                  Slate Metal, Bone White, Red Slate).
                </li>
                <li>
                  Brand logo compiled into lossless WebP, multi-size favicon,
                  and PWA manifest icons.
                </li>
                <li>
                  Interactive UI mockup with Write, Split (Editor + Preview),
                  and Read modes.
                </li>
                <li>
                  Command Palette (Ctrl+K), System Settings panel, and mobile
                  responsive layout.
                </li>
                <li>
                  Prerendered public routes (/docs, /help, /changelog) and CSR
                  /app workspace.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
