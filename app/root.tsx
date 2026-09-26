import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StackAuthProvider } from './features/auth/components/StackAuthProvider';
import './styles/app.css';

export function meta() {
  return [
    { title: 'STACK — A Modula Project' },
    {
      name: 'description',
      content:
        'Markdown-first, local-friendly desktop & PWA note-taking engine',
    },
    { name: 'theme-color', content: '#090A0B' },
  ];
}

export function links() {
  return [
    { rel: 'manifest', href: '/manifest.json' },
    { rel: 'icon', type: 'image/x-icon', href: '/brand/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/brand/stack-icon-192.png' },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-stack-bg text-stack-bone">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-stack-bg font-sans text-stack-bone selection:bg-stack-red-muted selection:text-stack-bone antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <StackAuthProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </StackAuthProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = 'An unexpected error occurred.';
  let details = '';

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    details = error.data || '';
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded border border-stack-metal bg-stack-surface p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded border border-stack-red-slate/40 bg-stack-red-muted/20 text-stack-red-slate">
          <span className="font-mono text-xl font-bold">!</span>
        </div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-stack-bone">
          {message}
        </h1>
        {details && (
          <p className="mt-2 font-mono text-xs text-stack-steel">{details}</p>
        )}
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded border border-stack-metal bg-stack-surface-raised px-4 py-2 font-mono text-xs text-stack-bone transition-colors hover:border-stack-steel hover:bg-stack-metal"
        >
          Return to STACK Home
        </a>
      </div>
    </main>
  );
}
