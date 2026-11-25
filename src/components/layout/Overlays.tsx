import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BellOff, CalendarClock, CheckCircle2, CornerDownLeft, Flame, Plus, Search, Timer, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '@/components/ui/Sheet';
import { useUI } from '@/store/useUI';
import { useLibrary } from '@/store/useLibrary';
import { useAlerts } from './useAlerts';
import { NAV } from './nav';
import { BookCover } from '@/components/books/BookCover';
import { STATUS_META, ACCENTS } from '@/lib/constants';
import { cn, normalize } from '@/lib/utils';
import { THEMES, resolveTheme } from '@/lib/themes';
import { computeAlerts } from '@/lib/alerts';

const toneIcon = {
  danger: { Icon: AlertCircle, cls: 'bg-danger/12 text-danger' },
  warning: { Icon: Flame, cls: 'bg-warning/15 text-warning' },
  info: { Icon: CalendarClock, cls: 'bg-info/12 text-info' },
  success: { Icon: CheckCircle2, cls: 'bg-success/12 text-success' },
};

export function NotificationsSheet() {
  const open = useUI((s) => s.notificationsOpen);
  const setOpen = useUI((s) => s.setNotifications);
  const dismiss = useLibrary((s) => s.dismissAlert);
  const alerts = useAlerts();
  const navigate = useNavigate();
  const visible = alerts.filter((a) => !a.dismissed);

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Notifications" description={visible.length ? `${visible.length} élément${visible.length > 1 ? 's' : ''} à voir` : undefined} size="sm">
      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
            <BellOff className="size-6" />
          </div>
          <p className="font-semibold">Tout est à jour</p>
          <p className="mt-1 text-sm text-muted">Les rappels de prêts et de lectures prévues apparaîtront ici.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((a) => {
              const { Icon, cls } = toneIcon[a.tone];
              return (
                <motion.li key={a.id} layout exit={{ opacity: 0, x: 40 }} className="flex items-start gap-3 rounded-2xl border border-line/70 p-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => {
                      setOpen(false);
                      navigate(a.href);
                    }}
                  >
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', cls)}>
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{a.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">{a.body}</span>
                    </span>
                  </button>
                  <button type="button" aria-label="Masquer" onClick={() => dismiss(a.id)} className="rounded-lg p-1 text-muted transition hover:bg-surface-2 hover:text-ink">
                    <X className="size-4" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}

/** Palette de recherche rapide (⌘K / Ctrl+K ou « / ») : livres, pages et actions. */
export function CommandPalette() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearch);
  const openAddBook = useUI((s) => s.openAddBook);
  const books = useLibrary((s) => s.books);
  const startTimer = useLibrary((s) => s.startTimer);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  type Item = { id: string; group: string; label: string; sub?: string; icon: React.ReactNode; run: () => void };

  const items = useMemo<Item[]>(() => {
    const nq = normalize(q);
    const go = (to: string) => () => navigate(to);
    const actions: Item[] = [
      { id: 'a-add', group: 'Actions', label: 'Ajouter un livre', icon: <Plus className="size-4" />, run: () => openAddBook() },
      ...books
        .filter((b) => b.status === 'reading')
        .slice(0, 3)
        .map((b) => ({ id: 't-' + b.id, group: 'Actions', label: `Lancer le minuteur · ${b.title}`, icon: <Timer className="size-4" />, run: () => startTimer(b.id) })),
    ];
    const pages: Item[] = NAV.map((n) => ({ id: 'p-' + n.to, group: 'Pages', label: n.label, icon: <n.icon className="size-4" />, run: go(n.to) }));
    const bookItems: Item[] = books.map((b) => ({
      id: 'b-' + b.id,
      group: 'Livres',
      label: b.title,
      sub: [b.authors.join(', '), STATUS_META[b.status].label].filter(Boolean).join(' · '),
      icon: <BookCover title={b.title} src={b.coverUrl} size="xs" className="!w-7" />,
      run: go(`/book/${b.id}`),
    }));
    if (!nq) return [...actions, ...bookItems.slice(0, 5), ...pages];
    const match = (it: Item) => normalize(it.label + ' ' + (it.sub ?? '')).includes(nq);
    const fromBooks = books
      .filter((b) => normalize([b.title, b.authors.join(' '), b.genre, b.isbn, b.publisher].join(' ')).includes(nq))
      .map((b) => bookItems.find((i) => i.id === 'b-' + b.id)!);
    return [...fromBooks.slice(0, 12), ...pages.filter(match), ...actions.filter(match)];
  }, [q, books, navigate, openAddBook, startTimer]);

  useEffect(() => setIndex(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const run = (it?: Item) => {
    if (!it) return;
    setOpen(false);
    it.run();
  };

  const groups = [...new Set(items.map((i) => i.group))];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center p-3 pt-[max(12px,env(safe-area-inset-top))] sm:pt-[12vh]">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche rapide"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line/70 bg-surface shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line/70 px-4">
              <Search className="size-5 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un livre, une page…"
                className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setIndex((i) => Math.min(items.length - 1, i + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    run(items[index]);
                  } else if (e.key === 'Escape') setOpen(false);
                }}
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-surface-2 px-2 py-1 text-2xs font-semibold text-muted">
                Échap
              </button>
            </div>
            <div ref={listRef} className="max-h-[60dvh] overflow-y-auto p-2">
              {items.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  Aucun résultat pour « {q} ».
                  <button
                    type="button"
                    className="mt-3 block w-full font-semibold text-accent"
                    onClick={() => {
                      setOpen(false);
                      openAddBook();
                    }}
                  >
                    Chercher ce livre en ligne →
                  </button>
                </div>
              )}
              {groups.map((g) => (
                <div key={g} className="mb-1">
                  <p className="label px-3 pb-1 pt-2">{g}</p>
                  {items.map((it, i) =>
                    it.group !== g ? null : (
                      <button
                        key={it.id}
                        type="button"
                        data-index={i}
                        onMouseMove={() => setIndex(i)}
                        onClick={() => run(it)}
                        className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition', i === index ? 'bg-surface-2' : '')}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center text-muted">{it.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{it.label}</span>
                          {it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}
                        </span>
                        {i === index && <CornerDownLeft className="size-4 text-muted" />}
                      </button>
                    ),
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Applique thème, accent et préférences d'animation. */
export function ThemeController() {
  const { theme, accent, reduceMotion } = useLibrary((s) => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const t = resolveTheme(theme, mq.matches);
      const dark = t.dark;
      root.classList.toggle('dark', dark);
      THEMES.forEach((x) => root.classList.toggle(`theme-${x.id}`, x.id === t.id && x.id !== 'light' && x.id !== 'dark'));
      const a = ACCENTS[accent] ?? ACCENTS.terracotta;
      root.style.setProperty('--accent', dark ? a.rgbDark : a.rgb);
      root.style.setProperty('--accent-ink', dark ? '20 16 14' : a.contrast);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t.bar));
    };
    apply();
    try {
      localStorage.setItem('livre-theme', theme);
    } catch {
      /* stockage indisponible */
    }
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, accent]);
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);
  return null;
}

/** Envoie des notifications système (si autorisées) pour les rappels importants, une seule fois par alerte. */
export function AlertsWatcher() {
  const enabled = useLibrary((s) => s.settings.notifications);
  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined') return;
    const check = () => {
      if (Notification.permission !== 'granted') return;
      const s = useLibrary.getState();
      const fresh = computeAlerts(s).filter((a) => a.push && !s.notifiedAlerts.includes(a.id) && !s.dismissedAlerts.includes(a.id));
      if (!fresh.length) return;
      for (const a of fresh.slice(0, 3)) {
        try {
          new Notification(a.title, { body: a.body, icon: '/icon-192.png', tag: a.id });
        } catch {
          /* certains navigateurs mobiles exigent un service worker */
          navigator.serviceWorker?.ready.then((reg) => reg.showNotification(a.title, { body: a.body, icon: '/icon-192.png', tag: a.id })).catch(() => {});
        }
      }
      s.markNotified(fresh.map((a) => a.id));
    };
    check();
    const id = setInterval(check, 10 * 60_000);
    return () => clearInterval(id);
  }, [enabled]);
  return null;
}
