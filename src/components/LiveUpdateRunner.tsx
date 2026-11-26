import { useEffect } from 'react';
import { toast } from '@/components/ui/Toast';
import { applyReady, checkLive, confirmBoot, liveSupported } from '@/lib/liveUpdate';
import { APP_VERSION } from '@/lib/updates';

const EVERY = 30 * 60_000;

/**
 * Mise à jour automatique (Android) : vérifie au lancement et au retour dans l'app,
 * télécharge en arrière-plan, puis installe quand l'app passe en arrière-plan
 * (ou au prochain lancement). Aucune action de l'utilisateur.
 */
export function LiveUpdateRunner() {
  useEffect(() => {
    if (!liveSupported()) return;
    let last = 0;
    let busy = false;
    const check = async () => {
      if (busy || Date.now() - last < EVERY) return;
      busy = true;
      last = Date.now();
      try {
        await checkLive();
      } catch {
        /* réessai plus tard */
      } finally {
        busy = false;
      }
    };

    confirmBoot().then((installed) => {
      if (installed) toast.success('Application mise à jour', { description: `Version ${APP_VERSION} installée automatiquement.` });
      setTimeout(check, 5000);
    });

    let remove: (() => void) | undefined;
    import('@capacitor/app').then(({ App }) =>
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) check();
        else applyReady().catch(() => {}); // app cachée : on installe sans gêner
      }).then((h) => {
        remove = () => h.remove();
      }),
    );
    return () => remove?.();
  }, []);
  return null;
}
