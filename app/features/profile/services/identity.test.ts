import { describe, it, expect, beforeEach } from 'vitest';
import { IdentityService } from './identity.service';

describe('IdentityService Atomic Username Claims', () => {
  beforeEach(() => {
    IdentityService.resetForTesting();
  });

  it('allows user A to claim an available username', async () => {
    const profile = await IdentityService.claimOnboarding('auth0|user_a', {
      username: 'luca',
      dateOfBirth: '1995-05-15',
    });

    expect(profile.sub).toBe('auth0|user_a');
    expect(profile.username).toBe('luca');
    expect(profile.dateOfBirth).toBe('1995-05-15');
  });

  it('rejects user B claiming the exact same username with USERNAME_TAKEN', async () => {
    await IdentityService.claimOnboarding('auth0|user_a', {
      username: 'luca',
    });

    // User B attempts to claim 'luca'
    await expect(
      IdentityService.claimOnboarding('auth0|user_b', {
        username: 'luca',
      })
    ).rejects.toThrow('USERNAME_TAKEN');

    // Case-insensitive collision: 'LUCA' must also fail
    await expect(
      IdentityService.claimOnboarding('auth0|user_c', {
        username: 'LUCA',
      })
    ).rejects.toThrow('USERNAME_TAKEN');
  });

  it('suggests clean alternatives when a username is taken', async () => {
    await IdentityService.claimOnboarding('auth0|user_existing', {
      username: 'luca',
    });
    const avail = await IdentityService.checkAvailability('luca');
    expect(avail.available).toBe(false);
    expect(avail.suggestions?.length).toBeGreaterThan(0);
    expect(avail.suggestions?.some((s) => s.startsWith('luca'))).toBe(true);
  });
});
