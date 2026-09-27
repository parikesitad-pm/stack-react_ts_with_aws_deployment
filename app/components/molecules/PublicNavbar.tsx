import { Link, useLocation } from 'react-router';
import { ArrowRight, User } from 'lucide-react';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';
import { useCurrentUserProfile } from '~/features/profile/hooks/useCurrentUserProfile';

export function PublicNavbar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthSession();
  const {
    username: canonicalUsername,
    avatarUrl: canonicalAvatarUrl,
    initials: canonicalInitials,
  } = useCurrentUserProfile();

  const effectiveUsername = canonicalUsername || user?.username || 'operator';
  const effectiveAvatarUrl = canonicalAvatarUrl || user?.picture;

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/docs', label: 'Documentation' },
    { href: '/help', label: 'Help & FAQ' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/modula-project', label: 'Modula Projects' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stack-metal/70 bg-stack-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <BrandLogo size="sm" showWordmark={true} />
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`transition-colors ${
                  isActive
                    ? 'text-stack-bone font-medium border-b border-stack-red-slate pb-0.5'
                    : 'text-stack-steel hover:text-stack-silver'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border border-stack-metal overflow-hidden bg-stack-surface flex items-center justify-center text-[10px] font-mono text-stack-bone shrink-0">
                  {effectiveAvatarUrl ? (
                    <img
                      src={effectiveAvatarUrl}
                      alt={effectiveUsername}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    canonicalInitials || 'OP'
                  )}
                </div>
                <span className="font-mono text-xs text-stack-silver">
                  @{effectiveUsername}
                </span>
              </div>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded border border-stack-red-muted bg-stack-red-slate px-3.5 py-1.5 font-mono text-xs font-medium text-stack-bone shadow-sm transition-all hover:bg-stack-red-hover"
              >
                <span>Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth/login"
                className="inline-flex items-center px-3 py-1.5 font-mono text-xs text-stack-silver hover:text-stack-bone transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-1.5 rounded border border-stack-red-muted bg-stack-red-slate px-3.5 py-1.5 font-mono text-xs font-medium text-stack-bone shadow-sm transition-all hover:bg-stack-red-hover"
              >
                <span>Create account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
