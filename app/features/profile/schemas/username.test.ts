import { describe, it, expect } from 'vitest';
import { normalizeUsername, usernameSchema } from './username.schema';

describe('Username Validation & Normalization', () => {
  it('normalizes uppercase and leading @ to lowercase', () => {
    expect(normalizeUsername('Luca')).toBe('luca');
    expect(normalizeUsername('@Luca')).toBe('luca');
    expect(normalizeUsername('Luca_PM')).toBe('luca_pm');
    expect(normalizeUsername('  @Operator-99  ')).toBe('operator-99');
  });

  it('accepts valid usernames', () => {
    expect(usernameSchema.safeParse('luca').success).toBe(true);
    expect(usernameSchema.safeParse('luca_pm').success).toBe(true);
    expect(usernameSchema.safeParse('operator.01').success).toBe(true);
    expect(usernameSchema.safeParse('stack-user-2026').success).toBe(true);
    expect(usernameSchema.safeParse('abc').success).toBe(true);
    expect(usernameSchema.safeParse('a'.repeat(32)).success).toBe(true);
  });

  it('rejects usernames containing spaces', () => {
    const res = usernameSchema.safeParse('luca sena');
    expect(res.success).toBe(false);
  });

  it('rejects usernames with uppercase letters in canonical form', () => {
    const res = usernameSchema.safeParse('Luca');
    expect(res.success).toBe(false);
  });

  it('rejects unsupported arbitrary symbols', () => {
    expect(usernameSchema.safeParse('luca!').success).toBe(false);
    expect(usernameSchema.safeParse('luca$admin').success).toBe(false);
    expect(usernameSchema.safeParse('luca/sub').success).toBe(false);
    expect(usernameSchema.safeParse('luca@modula').success).toBe(false);
  });

  it('rejects usernames shorter than 3 characters', () => {
    const res = usernameSchema.safeParse('lu');
    expect(res.success).toBe(false);
  });

  it('rejects usernames longer than 32 characters', () => {
    const res = usernameSchema.safeParse('a'.repeat(33));
    expect(res.success).toBe(false);
  });
});
