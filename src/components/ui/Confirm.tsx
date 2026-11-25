import { AlertTriangle } from 'lucide-react';
import { create } from 'zustand';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmStore {
  current: (ConfirmOptions & { resolve: (v: boolean) => void }) | null;
}

const useConfirmStore = create<ConfirmStore>(() => ({ current: null }));

/** Ouvre une boîte de confirmation et résout `true` si l'utilisateur confirme. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ current: { ...opts, resolve } }));
}

export function ConfirmHost() {
  const current = useConfirmStore((s) => s.current);
  const close = (v: boolean) => {
    current?.resolve(v);
    useConfirmStore.setState({ current: null });
  };
  return (
    <Sheet open={!!current} onClose={() => close(false)} size="sm" bare>
      {current && (
        <div className="px-6 pb-6 pt-4 text-center sm:pt-7">
          <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${current.danger ? 'bg-danger/12 text-danger' : 'bg-accent/12 text-accent'}`}>
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="h-display text-xl font-semibold">{current.title}</h2>
          {current.message && <p className="mt-2 text-sm leading-relaxed text-muted">{current.message}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" block size="lg" onClick={() => close(false)}>
              Annuler
            </Button>
            <Button variant={current.danger ? 'danger' : 'primary'} block size="lg" onClick={() => close(true)} data-autofocus>
              {current.confirmLabel ?? 'Confirmer'}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
