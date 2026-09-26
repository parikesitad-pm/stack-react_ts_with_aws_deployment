import { useNavigate } from 'react-router';
import AppPage from './app';
import { ProfileModal } from '~/features/profile/components/ProfileModal';

export function meta() {
  return [
    { title: 'Operator Profile — STACK' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function ProfileRoute() {
  const navigate = useNavigate();

  return (
    <>
      <AppPage />
      <ProfileModal
        isOpen={true}
        onClose={() => navigate('/app', { replace: true })}
      />
    </>
  );
}
