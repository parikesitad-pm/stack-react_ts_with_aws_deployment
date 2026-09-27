import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IdentityService } from './identity.service';
import { DevMockIdentityAdapter } from './identityMock.service';

describe('IdentityService & DevMockIdentityAdapter Contracts', () => {
  beforeEach(() => {
    IdentityService.resetForTesting();
  });

  it('allows user A to claim an available username via token authorization without passing sub in body', async () => {
    const tokenA = 'auth0|user_a_token';
    const profile = await IdentityService.claimOnboarding(
      {
        username: 'luca',
        dateOfBirth: '1995-05-15',
      },
      tokenA
    );

    expect(profile.username).toBe('luca');
    expect(profile.dateOfBirth).toBe('1995-05-15');

    // Retrieve via getProfile(token)
    const fetched = await IdentityService.getProfile(tokenA);
    expect(fetched).not.toBeNull();
    expect(fetched?.username).toBe('luca');
  });

  it('rejects user B claiming the exact same username with USERNAME_TAKEN', async () => {
    const tokenA = 'auth0|user_a_token';
    const tokenB = 'auth0|user_b_token';
    const tokenC = 'auth0|user_c_token';

    await IdentityService.claimOnboarding(
      {
        username: 'luca',
      },
      tokenA
    );

    // User B attempts to claim 'luca'
    await expect(
      IdentityService.claimOnboarding(
        {
          username: 'luca',
        },
        tokenB
      )
    ).rejects.toThrow('USERNAME_TAKEN');

    // Case-insensitive collision: 'LUCA' must also fail
    await expect(
      IdentityService.claimOnboarding(
        {
          username: 'LUCA',
        },
        tokenC
      )
    ).rejects.toThrow('USERNAME_TAKEN');
  });

  it('suggests clean alternatives when a username is taken', async () => {
    await IdentityService.claimOnboarding(
      {
        username: 'luca',
      },
      'auth0|user_existing_token'
    );
    const avail = await IdentityService.checkAvailability('luca');
    expect(avail.available).toBe(false);
    expect(avail.suggestions?.length).toBeGreaterThan(0);
    expect(avail.suggestions?.some((s) => s.startsWith('luca'))).toBe(true);
  });

  it('DevMockIdentityAdapter cleanly resets and stores mock records for dev/testing', () => {
    DevMockIdentityAdapter.claimOnboarding('auth0|test_sub', {
      username: 'devoperator',
    });

    const prof = DevMockIdentityAdapter.getProfile('auth0|test_sub');
    expect(prof?.username).toBe('devoperator');

    DevMockIdentityAdapter.resetForTesting();
    expect(DevMockIdentityAdapter.getProfile('auth0|test_sub')).toBeNull();
  });

  describe('checkAvailability error mapping & discriminated union semantics', () => {
    beforeEach(() => {
      process.env.TEST_API_BASE_URL = 'https://api.stack.test';
    });
    afterEach(() => {
      delete process.env.TEST_API_BASE_URL;
    });

    it('returns status: available when backend returns 200 with available: true', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ username: 'luca', available: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('available');
      expect(res.available).toBe(true);
      expect(res.normalizedUsername).toBe('luca');
      spy.mockRestore();
    });

    it('returns status: taken when backend returns 200 with available: false', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ username: 'luca', available: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('taken');
      expect(res.available).toBe(false);
      expect(res.suggestions).toBeDefined();
      spy.mockRestore();
    });

    it('returns status: taken when backend returns 409 with USERNAME_TAKEN', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'USERNAME_TAKEN' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('taken');
      expect(res.available).toBe(false);
      spy.mockRestore();
    });

    it('returns status: error with session refresh message on 401 and 403', async () => {
      const spy401 = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const res401 = await IdentityService.checkAvailability('luca');
      expect(res401.status).toBe('error');
      expect(res401.available).toBe(false);
      if (res401.status === 'error') {
        expect(res401.message).toBe(
          'Your session needs to be refreshed. Sign in again.'
        );
      }
      spy401.mockRestore();

      const spy403 = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      const res403 = await IdentityService.checkAvailability('luca');
      expect(res403.status).toBe('error');
      expect(res403.available).toBe(false);
      if (res403.status === 'error') {
        expect(res403.message).toBe(
          'Your session needs to be refreshed. Sign in again.'
        );
      }
      spy403.mockRestore();
    });

    it('returns status: error with service not available on 404', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Not Found', {
          status: 404,
        })
      );

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('error');
      expect(res.available).toBe(false);
      if (res.status === 'error') {
        expect(res.message).toBe('Username service is not available yet.');
      }
      spy.mockRestore();
    });

    it('returns status: error on 5xx without masquerading as taken', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('error');
      expect(res.available).toBe(false);
      if (res.status === 'error') {
        expect(res.message).toBe('Internal Server Error');
      }
      spy.mockRestore();
    });

    it('returns status: error on network failure without masquerading as taken', async () => {
      const spy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const res = await IdentityService.checkAvailability('luca');
      expect(res.status).toBe('error');
      expect(res.available).toBe(false);
      if (res.status === 'error') {
        expect(res.message).toBe(
          "Couldn't check username availability. Try again."
        );
      }
      spy.mockRestore();
    });

    it('returns status: error with backend validation message on 400', async () => {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'invalid_username',
            message:
              'Username must be 3-24 characters using lowercase letters, numbers, or underscore.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const res = await IdentityService.checkAvailability('luca-test');
      expect(res.status).toBe('error');
      expect(res.available).toBe(false);
      if (res.status === 'error') {
        expect(res.message).toContain('Username must be 3-24 characters');
      }
      spy.mockRestore();
    });
  });
});
