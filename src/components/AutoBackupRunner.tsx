import { useEffect } from 'react';
import { useLibrary } from '@/store/useLibrary';
import { runAutoBackup } from '@/lib/autoBackup';
import { isNative } from '@/lib/platform';

/** Lance la sauvegarde automatique au démarrage, au retour dans l'app et toutes les 6 h. */
export function AutoBackupRunner() {
  const hydrated = useLibrary((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    const run = () => runAutoBackup().catch(() => {});
    const t = setTimeout(run, 4000);
    const i = setInterval(run, 6 * 3600 * 1000);
    const onVis = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVis);
    let remove: (() => void) | undefined;
    if (isNative())
      import('@capacitor/app').then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => isActive && run()).then((h) => {
          remove = () => h.remove();
        }),
      );
    return () => {
      clearTimeout(t);
      clearInterval(i);
      document.removeEventListener('visibilitychange', onVis);
      remove?.();
    };
  }, [hydrated]);
  return null;
}
