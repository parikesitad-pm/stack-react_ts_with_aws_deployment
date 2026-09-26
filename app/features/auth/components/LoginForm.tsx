import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "~/components/atoms/Button";
import { BrandLogo } from "~/components/atoms/BrandLogo";
import { Badge } from "~/components/atoms/Badge";
import { AuthService } from "~/features/auth/services/auth.service";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("parikesitad-pm@modula.tools");
  const [password, setPassword] = useState("ModulaStack2026!");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.login({ email, password });
      navigate("/app", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-stack-metal bg-stack-surface p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <BrandLogo size="md" showWordmark={true} />
        <div className="pt-2">
          <Badge variant="accent">COGNITO USER POOL ACCESS</Badge>
        </div>
        <h2 className="font-mono text-xl font-bold tracking-tight text-stack-bone pt-1">
          Authenticate Operator
        </h2>
        <p className="font-mono text-xs text-stack-steel">
          Enter credentials to access private, isolated workspace.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded border border-stack-red-slate/50 bg-stack-red-muted/30 p-3 font-mono text-xs text-stack-red-hover">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="space-y-1.5">
          <label className="text-stack-silver text-[11px] uppercase tracking-wider">
            Operator Email
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@modula.tools"
              className="w-full rounded border border-stack-metal bg-stack-bg py-2 pl-9 pr-3 text-stack-bone placeholder:text-stack-steel focus:border-stack-steel focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-stack-silver text-[11px] uppercase tracking-wider">
              Secret Passphrase
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-[10px] text-stack-steel hover:text-stack-bone underline"
            >
              Reset?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 h-4 w-4 text-stack-steel" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded border border-stack-metal bg-stack-bg py-2 pl-9 pr-3 text-stack-bone placeholder:text-stack-steel focus:border-stack-steel focus:outline-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
          className="w-full justify-center mt-2"
        >
          <span>{isLoading ? "Authenticating..." : "Authorize Session"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-stack-metal/40 flex items-center justify-between font-mono text-xs text-stack-steel">
        <span>Need a workspace?</span>
        <Link
          to="/auth/register"
          className="text-stack-silver hover:text-stack-bone font-medium underline"
        >
          Initialize Account
        </Link>
      </div>

      <div className="mt-4 rounded border border-stack-metal/40 bg-stack-bg p-2 text-center font-mono text-[10px] text-stack-steel">
        🛡️ User data scoped strictly to Cognito sub. No cross-account leakage.
      </div>
    </div>
  );
}
