/**
 * Strict Auth0 sub-scoped TanStack Query keys
 *
 * Invariant:
 * Every private user state query MUST include the authenticated Auth0 sub.
 * Global keys such as ['notes'] or ['folders'] are strictly forbidden
 * to prevent accidental cross-account cache poisoning.
 */
export const workspaceQueryKeys = {
  profile: (sub: string) => ['profile', sub] as const,
  notes: (sub: string) => ['notes', sub] as const,
  note: (sub: string, noteId: string) => ['notes', sub, noteId] as const,
  folders: (sub: string) => ['folders', sub] as const,
  attachments: (sub: string) => ['attachments', sub] as const,
  attachment: (sub: string, path: string) =>
    ['attachments', sub, path] as const,
  metadata: (sub: string, key: string) => ['meta', sub, key] as const,
};
