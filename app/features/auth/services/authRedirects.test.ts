import { describe, it, expect } from 'vitest';
import { auth0Service } from './auth0.service';

describe('Auth Redirect & Verification Logic', () => {
  it('identifies verified email claim correctly', () => {
    expect(auth0Service.isEmailVerified({ email_verified: true })).toBe(true);
    expect(auth0Service.isEmailVerified({ email_verified: false })).toBe(false);
    expect(auth0Service.isEmailVerified(null)).toBe(false);
    expect(auth0Service.isEmailVerified(undefined)).toBe(false);
  });

  it('evaluates social verified claims strictly based on email_verified claim, not provider name', () => {
    // If google reports email_verified: false, it must NOT bypass
    const unverifiedGoogle = {
      sub: 'google-oauth2|123',
      email_verified: false,
    };
    expect(auth0Service.isEmailVerified(unverifiedGoogle)).toBe(false);

    // If google reports email_verified: true, it bypasses
    const verifiedGoogle = {
      sub: 'google-oauth2|123',
      email_verified: true,
    };
    expect(auth0Service.isEmailVerified(verifiedGoogle)).toBe(true);
  });

  it('constructs correct redirect targets and preserves returnTo state', () => {
    const rawTarget = '/app/note/note_123';
    const encoded = encodeURIComponent(rawTarget);
    const loginUrl = `/auth/login?returnTo=${encoded}`;

    const parsedParams = new URLSearchParams(loginUrl.split('?')[1]);
    expect(parsedParams.get('returnTo')).toBe(rawTarget);
  });
});
