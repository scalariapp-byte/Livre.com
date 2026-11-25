import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { cn, uid } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id' | 'duration' | 'tone'> & { tone?: ToastTone; duration?: number }) => void;
  remove: (id: string) => void;
}

const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = uid();
    const item: ToastItem = { tone: 'success', duration: t.action ? 6000 : 3200, ...t, id };
    set((s) => ({ toasts: [...s.toasts.slice(-2), item] }));
    window.setTimeout(() => get().remove(id), item.duration);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string, opts?: Partial<Pick<ToastItem, 'description' | 'action'>>) => useToasts.getState().push({ message, tone: 'success', ...opts }),
  error: (message: string, opts?: Partial<Pick<ToastItem, 'description' | 'action'>>) => useToasts.getState().push({ message, tone: 'error', ...opts }),
  info: (message: string, opts?: Partial<Pick<ToastItem, 'description' | 'action'>>) => useToasts.getState().push({ message, tone: 'info', ...opts }),
};

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };

export function Toaster() {
  const { toasts, remove } = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:top-auto lg:items-end lg:pr-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink py-3 pl-4 pr-2 text-bg shadow-lift"
            >
              <Icon className={cn('size-5 shrink-0', t.tone === 'success' && 'text-success', t.tone === 'error' && 'text-danger', t.tone === 'info' && 'text-info')} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{t.message}</p>
                {t.description && <p className="mt-0.5 text-xs opacity-70">{t.description}</p>}
              </div>
              {t.action && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-accent transition hover:bg-white/10"
                  onClick={() => {
                    t.action!.onClick();
                    remove(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" aria-label="Fermer" onClick={() => remove(t.id)} className="shrink-0 rounded-lg p-1.5 opacity-60 transition hover:opacity-100">
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
