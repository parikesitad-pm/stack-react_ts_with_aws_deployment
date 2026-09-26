import { z } from 'zod';

export const USERNAME_REGEX = /^[a-z0-9._-]+$/;

/**
 * Normalizes input string to canonical STACK username:
 * - strips leading '@' if typed by user
 * - converts to lowercase
 * - trims surrounding whitespace
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/**
 * Validates canonical STACK username string
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(32, 'Username cannot exceed 32 characters.')
  .regex(
    USERNAME_REGEX,
    'Username may only contain lowercase letters, numbers, dots, underscores, and hyphens.'
  )
  .refine((val) => !val.includes(' '), {
    message: 'Spaces are not allowed in usernames.',
  })
  .refine((val) => !val.startsWith('.') && !val.endsWith('.'), {
    message: 'Username cannot start or end with a dot.',
  });

export const userProfileSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(3).max(32),
  preferredName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  picture: z.string().optional(),
  onboardingCompletedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
