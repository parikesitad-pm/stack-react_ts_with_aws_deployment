/**
 * STACK API Fetch Helper
 *
 * Centralized, token-authenticated fetch utility for the STACK backend API.
 * Uses strictly `import.meta.env.VITE_API_BASE_URL` (AWS API Gateway endpoint).
 *
 * SECURITY INVARIANT:
 * - VITE_AUTH0_AUDIENCE is exclusively for Auth0 token acquisition.
 * - It is NEVER used as an HTTP request destination.
 * - If VITE_API_BASE_URL is not set, calls throw explicit STACK_API_NOT_CONFIGURED error.
 */

export class StackApiConfigurationError extends Error {
  constructor(message = 'STACK_API_NOT_CONFIGURED') {
    super(message);
    this.name = 'StackApiConfigurationError';
  }
}

export function getStackApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return process.env.TEST_API_BASE_URL || '';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  return '';
}

export async function stackApiFetch(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getStackApiBaseUrl();

  if (!baseUrl) {
    throw new StackApiConfigurationError(
      'STACK_API_NOT_CONFIGURED: VITE_API_BASE_URL is missing. Please configure backend HTTP API endpoint.'
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
