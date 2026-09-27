/**
 * Production Auth0 Service
 *
 * Configured strictly via environment variables:
 * - VITE_AUTH0_DOMAIN (default: dev-q17s3o8mib1dgwhd.us.auth0.com)
 * - VITE_AUTH0_CLIENT_ID (default: zvFH3CSBnuruw9DBcNgslKaQkhlBtdAO)
 * - VITE_AUTH0_AUDIENCE (default: https://api.stack.modula)
 * - VITE_PUBLIC_APP_URL (default: https://stack-md.online)
 *
 * SECURITY INVARIANT:
 * STACK must never persist, hash, log, cache, or send user passwords anywhere
 * except directly through the supported Auth0 authentication flow.
 * Never store passwords in React state longer than required by the active form,
 * localStorage, sessionStorage, IndexedDB, TanStack Query, logs, backend, or DynamoDB.
 */

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
  redirectUri: string;
}

export function getAuth0Config(): Auth0Config {
  const domain =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_AUTH0_DOMAIN) ||
    'dev-q17s3o8mib1dgwhd.us.auth0.com';
  const clientId =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_AUTH0_CLIENT_ID) ||
    'zvFH3CSBnuruw9DBcNgslKaQkhlBtdAO';
  const audience =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_AUTH0_AUDIENCE) ||
    'urn:stack:api';

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://stack-md.online/auth/callback';

  return { domain, clientId, audience, redirectUri };
}

export const auth0Service = {
  getConfig: getAuth0Config,

  /**
   * Evaluates identity claim to determine if email verification is satisfied.
   * Social logins bypass STACK OTP if and only if Auth0 token claim reports email_verified === true.
   * Never bypasses verification based solely on provider name.
   */
  isEmailVerified(claims?: { email_verified?: boolean } | null): boolean {
    return claims?.email_verified === true;
  },
};
