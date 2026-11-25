import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks';

let openCount = 0;

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Masque l'en-tête standard (contenu plein cadre). */
  bare?: boolean;
}

/**
 * Panneau modal : feuille glissante depuis le bas sur mobile (fermeture par glissement),
 * boîte de dialogue centrée sur tablette et ordinateur.
 */
export function Sheet({ open, onClose, title, description, children, footer, size = 'md', className, bare }: SheetProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const panelRef = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    openCount++;
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input:not([type=hidden]), textarea, select');
      if (el && window.matchMedia('(min-width: 640px)').matches) el.focus();
      else panelRef.current?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      openCount--;
      if (openCount <= 0) document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-lift outline-none',
              'rounded-t-[28px] sm:rounded-3xl',
              size === 'sm' && 'sm:max-w-md',
              size === 'md' && 'sm:max-w-lg',
              size === 'lg' && 'sm:max-w-2xl',
              className,
            )}
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.97, y: 4 } : { y: '100%' }}
            transition={{ type: 'spring', bounce: 0.08, duration: 0.42 }}
            drag={isDesktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragListener={false}
            dragControls={controls}
            onDragEnd={onDragEnd}
          >
            {!isDesktop && (
              <div
                className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
                onPointerDown={(e) => controls.start(e)}
              >
                <div className="h-1.5 w-10 rounded-full bg-surface-3" />
              </div>
            )}
            {!bare && (title || description) && (
              <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-2 sm:px-6 sm:pt-5">
                <div className="min-w-0">
                  {title && <h2 className="h-display text-[22px] font-semibold leading-tight">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 transition hover:bg-surface-3 active:scale-90"
                >
                  <X className="size-[18px]" />
                </button>
              </div>
            )}
            <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', !bare && 'px-5 pb-5 sm:px-6 sm:pb-6')}>{children}</div>
            {footer && <div className="safe-bottom shrink-0 border-t border-line/70 bg-surface px-5 py-3.5 sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
