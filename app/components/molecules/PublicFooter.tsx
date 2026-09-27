import { Link } from 'react-router';

export function PublicFooter() {
  return (
    <footer className="border-t border-stack-metal/80 bg-stack-bg px-4 py-8 font-mono text-xs text-stack-steel sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
          <span className="font-bold text-stack-bone">STACK</span>
          <span>· A Modula Project</span>
          <span>· MIT License 2026 - crafted with &lt;3 by</span>
          <a
            href="https://github.com/parikesitad-pm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stack-silver hover:text-stack-bone underline decoration-stack-metal hover:decoration-stack-red-slate transition-colors"
          >
            parikesitad-pm
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-stack-silver justify-center">
          <Link to="/demo" className="hover:text-stack-bone">
            Demo
          </Link>
          <Link to="/how-to-use" className="hover:text-stack-bone">
            How to Use
          </Link>
          <Link to="/docs" className="hover:text-stack-bone">
            Docs
          </Link>
          <Link to="/help" className="hover:text-stack-bone">
            Help
          </Link>
          <Link to="/changelog" className="hover:text-stack-bone">
            Changelog
          </Link>
          <Link to="/modula-project" className="hover:text-stack-bone">
            Modula
          </Link>
          <Link to="/app" className="text-stack-red-hover hover:underline">
            Launch App
          </Link>
        </div>
      </div>
    </footer>
  );
}
