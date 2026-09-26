import { useNavigate } from 'react-router';
import { AuthService } from '~/features/auth/services/auth.service';

export function useSignOut() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await AuthService.logout();
      // Navigate to login screen
      navigate('/auth/login', { replace: true });
    } catch (err) {
      console.error('Sign out failure:', err);
      navigate('/auth/login', { replace: true });
    }
  };

  return { handleSignOut };
}
