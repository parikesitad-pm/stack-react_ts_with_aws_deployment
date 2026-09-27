import { useState, useEffect, useCallback } from 'react';
import {
  demoWorkspaceService,
  DEMO_USER,
} from '~/features/demo/services/demoWorkspace.service';
import { WorkspaceView } from '~/features/workspace/components/WorkspaceView';
import { StartupLoader } from '~/features/workspace/components/StartupLoader';

export function meta() {
  return [
    { title: 'Interactive Demo — STACK' },
    {
      name: 'description',
      content:
        'Experience STACK: markdown notes without the noise. Try the local-first editor with keyboard-first formatting, slash commands, and organization.',
    },
    { tagName: 'link', rel: 'canonical', href: 'https://stack-md.online/demo' },
    { name: 'robots', content: 'index, follow' },
    {
      property: 'og:title',
      content: 'Interactive Demo — STACK',
    },
    {
      property: 'og:description',
      content:
        'Experience STACK: markdown notes without the noise. Try the local-first editor with keyboard-first formatting, slash commands, and organization.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://stack-md.online/demo' },
  ];
}

export default function DemoPage() {
  const [isReady, setIsReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    demoWorkspaceService.seedDemoWorkspace().then(() => {
      if (isMounted) setIsReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, [resetKey]);

  const handleResetDemo = useCallback(async () => {
    const confirmed = window.confirm(
      'Reset demo workspace to its initial sample state? Any changes you made in demo mode will be reset.'
    );
    if (confirmed) {
      setIsReady(false);
      await demoWorkspaceService.resetDemoWorkspace();
      setResetKey((k) => k + 1);
    }
  }, []);

  if (!isReady) {
    return <StartupLoader onReady={() => {}} />;
  }

  return (
    <WorkspaceView
      key={`demo-workspace-${resetKey}`}
      user={DEMO_USER}
      token={null}
      isDemo={true}
      onResetDemo={handleResetDemo}
      onSignOut={() => {
        window.location.href = '/';
      }}
    />
  );
}
