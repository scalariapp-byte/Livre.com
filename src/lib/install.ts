import { create } from 'zustand';

/** Événement Chrome / Edge / Android permettant d'afficher la fenêtre d'installation de la PWA. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  promptEvent: BeforeInstallPromptEvent | null;
  installed: boolean;
}

export const useInstall = create<InstallState>(() => ({
  promptEvent: null,
  installed: typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true),
}));

/** À appeler au démarrage : mémorise la possibilité d'installer l'application. */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ promptEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ installed: true, promptEvent: null }));
}

export async function promptInstall(): Promise<boolean> {
  const e = useInstall.getState().promptEvent;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  useInstall.setState({ promptEvent: null, installed: outcome === 'accepted' });
  return outcome === 'accepted';
}

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
