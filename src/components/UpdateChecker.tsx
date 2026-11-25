import { Download, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { toast } from '@/components/ui/Toast';
import {
  APP_VERSION,
  InstallPermissionError,
  canInstallUpdates,
  checkForUpdate,
  dismiss,
  installUpdate,
  isDismissed,
  openInstallSettings,
  openUpdate,
  type UpdateInfo,
} from '@/lib/updates';
import { isNative } from '@/lib/platform';
import { fmtDate } from '@/lib/dates';

/** Mise à jour proposée à l'utilisateur (partagée avec la page Réglages). */
export const useUpdate = create<{ info: UpdateInfo | null; open: boolean; show: (info: UpdateInfo) => void; close: () => void }>((set) => ({
  info: null,
  open: false,
  show: (info) => set({ info, open: true }),
  close: () => set({ open: false }),
}));

type Phase = 'idle' | 'permission' | 'downloading' | 'installing';

/** Vérifie au démarrage / au retour dans l'app, puis télécharge et installe sans quitter l'application. */
export function UpdateChecker() {
  const { info, open, show, close } = useUpdate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const waitingPermission = useRef(false);

  const start = async (u: UpdateInfo) => {
    setProgress(0);
    setPhase('downloading');
    try {
      await installUpdate(u, setProgress);
      setPhase('installing'); // l'installateur Android est affiché
    } catch (e) {
      if (e instanceof InstallPermissionError) {
        setPhase('permission');
        return;
      }
      setPhase('idle');
      toast.error('Téléchargement interrompu', { description: (e as Error).message || 'Vérifiez votre connexion.' });
    }
  };

  useEffect(() => {
    if (!isNative()) return;
    let last = 0;
    const check = () => {
      if (Date.now() - last < 30 * 60_000) return;
      last = Date.now();
      checkForUpdate()
        .then((u) => u && !isDismissed(u.build) && show(u))
        .catch(() => {});
    };
    check();
    let remove: (() => void) | undefined;
    import('@capacitor/app').then(({ App }) =>
      App.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        // Retour des réglages Android après avoir accordé l'autorisation : on reprend.
        if (waitingPermission.current) {
          waitingPermission.current = false;
          const u = useUpdate.getState().info;
          if (u && (await canInstallUpdates().catch(() => false))) start(u);
          return;
        }
        check();
      }).then((h) => {
        remove = () => h.remove();
      }),
    );
    return () => remove?.();
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = phase === 'downloading';

  return (
    <Sheet open={open && !!info} onClose={() => !busy && (setPhase('idle'), close())} size="sm" bare>
      {info && (
        <div className="px-6 pb-6 pt-4 text-center sm:pt-7">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            {phase === 'permission' ? <ShieldCheck className="size-7" /> : <Sparkles className="size-7" />}
          </div>

          {phase === 'permission' ? (
            <>
              <h2 className="h-display text-2xl font-semibold">Une autorisation, une seule fois</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pour s'installer elle-même, Livre doit avoir le droit d'installer des applications. Activez <b className="text-ink">« Autoriser cette source »</b>, puis revenez : la mise à jour reprendra
                automatiquement.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  size="lg"
                  block
                  onClick={() => {
                    waitingPermission.current = true;
                    openInstallSettings();
                  }}
                >
                  Ouvrir le réglage
                </Button>
                <Button size="lg" block variant="ghost" onClick={() => (setPhase('idle'), openUpdate(info))}>
                  Télécharger avec le navigateur
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="h-display text-2xl font-semibold">{phase === 'installing' ? 'Installation…' : 'Mise à jour disponible'}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {phase === 'installing' ? (
                  <>Appuyez sur <b className="text-ink">« Mettre à jour »</b> dans la fenêtre Android. Vos livres sont conservés.</>
                ) : (
                  <>
                    La version <b className="text-ink">{info.version}</b> est sortie le {fmtDate(info.publishedAt)}. Vous avez la version {APP_VERSION}.
                  </>
                )}
              </p>

              {busy && (
                <div className="mt-5">
                  <ProgressBar value={progress} />
                  <p className="mt-2 text-xs tabular-nums text-muted">Téléchargement… {progress} %</p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                {phase === 'installing' ? (
                  <Button size="lg" block variant="outline" onClick={() => start(info)}>
                    Relancer l'installation
                  </Button>
                ) : (
                  <Button size="lg" block loading={busy} icon={<Download className="size-4" />} onClick={() => start(info)}>
                    {busy ? 'Téléchargement…' : 'Mettre à jour'}
                  </Button>
                )}
                {!busy && (
                  <Button
                    size="lg"
                    block
                    variant="ghost"
                    onClick={() => {
                      if (phase !== 'installing') dismiss(info.build);
                      setPhase('idle');
                      close();
                    }}
                  >
                    {phase === 'installing' ? 'Fermer' : 'Plus tard'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
