import type { QueryClient } from '@tanstack/react-query';
import { userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';
import { attachmentRepository } from '~/features/attachments/services/attachment.repository';
import { attachmentResolver } from '~/features/attachments/services/attachment-resolver.service';

export interface LogoutCleanupOptions {
  sub?: string;
  queryClient?: QueryClient;
  onCompleteAuth0Logout?: () => void;
}

export const logoutCleanupService = {
  /**
   * Executes the mandatory 10-step cleanup protocol on user sign-out
   */
  async execute(options: LogoutCleanupOptions = {}): Promise<void> {
    const { sub, queryClient, onCompleteAuth0Logout } = options;

    // 1. Cancel active authenticated TanStack Query requests
    if (queryClient) {
      try {
        await queryClient.cancelQueries();
      } catch {}
    }

    // 2. Detach current user sync workers / event listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stack:sync-worker-detach'));
    }

    // 3. Clear active note selection from session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stack_active_note_id');
      sessionStorage.removeItem('stack_active_filter');
    }

    // 4. Clear in-memory private note and draft state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stack_editor_draft');
    }

    // 5. Clear authenticated QueryClient cache
    if (queryClient) {
      try {
        queryClient.clear();
      } catch {}
    }

    // 6. Release all attachment object URLs
    try {
      attachmentResolver.clearAll();
    } catch {}

    // 7. Close & detach user's IndexedDB connection & active sub
    if (sub) {
      try {
        userWorkspaceStorage.closeConnection(sub);
      } catch {}
    }
    attachmentRepository.setActiveSub(null);

    // 8. Clear user-specific UI state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stack_app_cold_boot');
    }

    // 9. Clear sensitive session-only return state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stack_redirect_after_login');
      sessionStorage.removeItem('stack_auth_state');
    }

    // 10. Complete Auth0 logout
    if (onCompleteAuth0Logout) {
      onCompleteAuth0Logout();
    }
  },
};
