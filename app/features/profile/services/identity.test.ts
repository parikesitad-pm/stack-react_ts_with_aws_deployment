import { describe, it, expect, beforeEach } from 'vitest';
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
});
