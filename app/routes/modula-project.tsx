import { PublicNavbar } from '~/components/molecules/PublicNavbar';
import { PublicFooter } from '~/components/molecules/PublicFooter';
import { ModulaProjectRegistry } from '~/features/modula-project/components/ModulaProjectRegistry';

export function meta() {
  return [
    { title: 'Modula Project Registry — STACK' },
    {
      name: 'description',
      content:
        'Explore live and in-development projects built under the Modula Project umbrella.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://stack-md.online/modula-project',
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Modula Project Registry — STACK' },
    {
      property: 'og:description',
      content:
        'Explore live and in-development projects built under the Modula Project umbrella.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://stack-md.online/modula-project' },
    {
      property: 'og:image',
      content: 'https://stack-md.online/brand/stack-logo.webp',
    },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:title',
      content: 'Modula Project Registry — STACK',
    },
    {
      name: 'twitter:description',
      content:
        'Explore live and in-development projects built under the Modula Project umbrella.',
    },
    {
      name: 'twitter:image',
      content: 'https://stack-md.online/brand/stack-logo.webp',
    },
  ];
}

export default function ModulaProjectRoute() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col font-mono selection:bg-stack-red-muted selection:text-stack-bone">
      <PublicNavbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <ModulaProjectRegistry />
      </main>
      <PublicFooter />
    </div>
  );
}
