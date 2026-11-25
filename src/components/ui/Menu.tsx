import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  active?: boolean;
}

export function Menu({ trigger, items, align = 'right', className }: { trigger: (props: { onClick: () => void; 'aria-expanded': boolean }) => ReactNode; items: (MenuItem | 'divider')[]; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ onClick: () => setOpen((o) => !o), 'aria-expanded': open })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className={cn(
              'absolute top-full z-40 mt-2 min-w-[210px] origin-top-right rounded-2xl border border-line/80 bg-surface p-1.5 shadow-lift',
              align === 'right' ? 'right-0' : 'left-0 origin-top-left',
            )}
          >
            {items.map((it, i) =>
              it === 'divider' ? (
                <div key={i} className="my-1 h-px bg-line/70" />
              ) : (
                <button
                  key={it.label}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-surface-2',
                    it.danger ? 'text-danger' : 'text-ink-2 hover:text-ink',
                    it.active && 'text-accent',
                  )}
                >
                  {it.icon && <span className="[&>svg]:size-4">{it.icon}</span>}
                  {it.label}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
