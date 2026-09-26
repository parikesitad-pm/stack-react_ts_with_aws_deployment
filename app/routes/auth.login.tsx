import { Link } from 'react-router';
import { BrandLogo } from '~/components/atoms/BrandLogo';
import { Auth0LoginForm } from '~/features/auth/components/Auth0LoginForm';

export default function AuthLoginPage() {
  return (
    <div className="min-h-screen bg-stack-bg text-stack-bone flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-stack-red-muted selection:text-stack-bone">
      {/* Background industrial grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#32373D_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative w-full max-w-md border border-stack-metal bg-stack-surface p-6 sm:p-8 rounded-lg shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="inline-block p-1 hover:opacity-80 transition-opacity">
            <BrandLogo size="lg" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-stack-steel uppercase tracking-widest pt-2">
            <span className="font-bold text-stack-bone">STACK</span>
            <span>·</span>
            <span>A Modula Project</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stack-bone">
            Sign in to Workspace
          </h1>
          <p className="text-xs text-stack-steel max-w-xs">
            Authenticate to access your private notes, synchronized via secure Auth0 JWT claims.
          </p>
        </div>

        {/* Auth0 Login Form */}
        <Auth0LoginForm />

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-stack-silver hover:text-stack-bone underline decoration-stack-metal transition-colors"
          >
            ← Return to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
