/**
 * Production Auth0 Service
 *
 * Configured strictly via environment variables:
 * - VITE_AUTH0_DOMAIN
 * - VITE_AUTH0_CLIENT_ID
 * - VITE_AUTH0_AUDIENCE
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
    'stack-auth.us.auth0.com';
  const clientId =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_AUTH0_CLIENT_ID) ||
    'stack-client-id';
  const audience =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_AUTH0_AUDIENCE
      : undefined;

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://stack-md.online/auth/callback';

  return { domain, clientId, audience, redirectUri };
}

export const auth0Service = {
  getConfig: getAuth0Config,

  /**
   * Build Auth0 Universal Login URL for secure OAuth authentication
   */
  buildAuthorizeUrl(
    connection?: 'google-oauth2' | 'github' | 'Username-Password-Authentication'
  ): string {
    const config = getAuth0Config();
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: 'openid profile email',
    });

    if (config.audience) {
      params.set('audience', config.audience);
    }
    if (connection) {
      params.set('connection', connection);
    }

    return `https://${config.domain}/authorize?${params.toString()}`;
  },

  /**
   * Evaluates identity claim to determine if email verification is satisfied.
   * Social logins bypass STACK OTP if and only if Auth0 token claim reports email_verified === true.
   * Never bypasses verification based solely on provider name.
   */
  isEmailVerified(claims: { email_verified?: boolean }): boolean {
    return claims.email_verified === true;
  },
};
