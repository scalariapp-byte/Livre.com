import { Download, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { APP_VERSION, checkForUpdate, dismiss, isDismissed, openUpdate, type UpdateInfo } from '@/lib/updates';
import { isNative } from '@/lib/platform';
import { fmtDate } from '@/lib/dates';

/** Mise à jour proposée à l'utilisateur (partagée avec la page Réglages). */
export const useUpdate = create<{ info: UpdateInfo | null; open: boolean; show: (info: UpdateInfo) => void; close: () => void }>((set) => ({
  info: null,
  open: false,
  show: (info) => set({ info, open: true }),
  close: () => set({ open: false }),
}));

/** Vérifie silencieusement au démarrage et au retour dans l'application (Android uniquement). */
export function UpdateChecker() {
  const { info, open, show, close } = useUpdate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNative()) return;
    let last = 0;
    const run = () => {
      if (Date.now() - last < 30 * 60_000) return; // au plus toutes les 30 min
      last = Date.now();
      checkForUpdate()
        .then((u) => u && !isDismissed(u.build) && show(u))
        .catch(() => {}); // hors ligne : on réessaiera plus tard
    };
    run();
    let remove: (() => void) | undefined;
    import('@capacitor/app').then(({ App }) =>
      App.addListener('appStateChange', ({ isActive }) => isActive && run()).then((h) => {
        remove = () => h.remove();
      }),
    );
    return () => remove?.();
  }, [show]);

  return (
    <Sheet open={open && !!info} onClose={close} size="sm" bare>
      {info && (
        <div className="px-6 pb-6 pt-4 text-center sm:pt-7">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <Sparkles className="size-7" />
          </div>
          <h2 className="h-display text-2xl font-semibold">Mise à jour disponible</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            La version <b className="text-ink">{info.version}</b> est sortie le {fmtDate(info.publishedAt)}. Vous avez la version {APP_VERSION}.
          </p>
          <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-left text-xs leading-relaxed text-ink-2">
            Le fichier va se télécharger. Ouvrez-le puis appuyez sur « Mettre à jour ». Vos livres et réglages sont conservés.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              size="lg"
              block
              loading={busy}
              icon={<Download className="size-4" />}
              onClick={async () => {
                setBusy(true);
                try {
                  await openUpdate(info);
                } finally {
                  setBusy(false);
                  close();
                }
              }}
            >
              Mettre à jour
            </Button>
            <Button
              size="lg"
              block
              variant="ghost"
              onClick={() => {
                dismiss(info.build);
                close();
              }}
            >
              Plus tard
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
