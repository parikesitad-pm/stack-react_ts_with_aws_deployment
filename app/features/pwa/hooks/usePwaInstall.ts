import { useState, useEffect, useCallback } from 'react';

export type PwaInstallStatus =
  | 'idle'
  | 'available'
  | 'installing'
  | 'installed'
  | 'unsupported';

export interface BrowserCapability {
  isChromium: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isLinux: boolean;
  isMac: boolean;
  isWindows: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<PwaInstallStatus>('idle');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [browser, setBrowser] = useState<BrowserCapability>({
    isChromium: false,
    isSafari: false,
    isFirefox: false,
    isLinux: false,
    isMac: false,
    isWindows: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isFirefox = ua.includes('firefox');
    const isSafari =
      ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
    const isChromium =
      ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');
    const isLinux = ua.includes('linux');
    const isMac = ua.includes('macintosh') || ua.includes('mac os');
    const isWindows = ua.includes('windows');

    setBrowser({
      isChromium,
      isSafari,
      isFirefox,
      isLinux,
      isMac,
      isWindows,
    });

    // Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      setStatus('installed');
      return;
    }

    if (isFirefox) {
      setStatus('unsupported');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus('available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    const appInstalledHandler = () => {
      setStatus('installed');
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      setStatus('installing');
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setStatus('installed');
      } else {
        setStatus('available');
      }
      setDeferredPrompt(null);
    } else {
      setIsDialogOpen(true);
    }
  }, [deferredPrompt]);

  return {
    status,
    isInstalled: status === 'installed',
    isInstallable: status === 'available' || !!deferredPrompt,
    isDialogOpen,
    setIsDialogOpen,
    triggerInstall,
    browser,
  };
}
