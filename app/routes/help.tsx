import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { Badge } from '~/components/atoms/Badge';

export function meta() {
  return [
    { title: 'Assistance & Protocols — STACK' },
    {
      name: 'description',
      content:
        'Frequently asked questions, offline usage, and storage protocols for STACK.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://stack-13.vercel.app/help' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Assistance & Protocols — STACK' },
    {
      property: 'og:description',
      content:
        'Frequently asked questions, offline usage, and storage protocols for STACK.',
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: 'https://stack-13.vercel.app/help' },
  ];
}

export default function HelpPage() {
  const faqs = [
    {
      q: 'Where are my notes actually stored?',
      a: "Notes are stored locally inside your browser's sandboxed IndexedDB storage. No third party has access to them unless you explicitly enable cloud sync.",
    },
    {
      q: 'Can I use STACK completely offline without internet?',
      a: 'Yes. STACK is a Progressive Web App (PWA) with local asset caching. Once loaded or installed, you can open and edit your notes without an internet connection.',
    },
    {
      q: 'How can I back up or export my notes?',
      a: "Open Settings > Storage and click 'Export All (.md)'. STACK packages your notes into plain text Markdown files ready to open in any text editor.",
    },
    {
      q: 'Why does the UI look like industrial hardware?',
      a: 'STACK was designed with a post-war military/avionics aesthetic—restrained, dark gunmetal, weathered steel, and red slate accents—built for maximum focus and minimum visual fatigue.',
    },
  ];

  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono">
      <PublicNavbar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <Badge variant="accent">ASSISTANCE & PROTOCOLS</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stack-bone border-b border-stack-metal/60 pb-3">
          Help & Frequently Asked Questions
        </h1>

        <div className="mt-8 space-y-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded border border-stack-metal bg-stack-surface p-5 space-y-2"
            >
              <h3 className="text-sm font-bold text-stack-bone">{faq.q}</h3>
              <p className="text-xs text-stack-silver leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
