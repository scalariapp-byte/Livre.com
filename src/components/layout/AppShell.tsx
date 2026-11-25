import { AnimatePresence, motion } from 'framer-motion';
import { Plus, MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from './nav';
import { cn } from '@/lib/utils';
import { useUI } from '@/store/useUI';
import { useLibrary } from '@/store/useLibrary';
import { Avatar } from '@/components/ui/misc';
import { Sheet } from '@/components/ui/Sheet';
import { TimerPill } from './TimerPill';
import { Logo } from './Logo';

function Sidebar() {
  const openAddBook = useUI((s) => s.openAddBook);
  const setSearch = useUI((s) => s.setSearch);
  const settings = useLibrary((s) => s.settings);
  const counts = useLibrary((s) => ({
    '/library': s.books.filter((b) => b.status !== 'wishlist').length,
    '/to-read': s.books.filter((b) => b.status === 'toread').length,
    '/wishlist': s.books.filter((b) => b.status === 'wishlist').length,
    '/loans': s.loans.filter((l) => !l.returnedAt).length,
    '/finished': s.books.filter((b) => b.status === 'finished').length,
  }));
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line/70 bg-surface/50 px-4 pb-4 pt-6 backdrop-blur-xl lg:flex">
      <div className="mb-6 px-2">
        <Logo />
      </div>
      <button
        type="button"
        onClick={() => setSearch(true)}
        className="mb-3 flex h-10 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-muted transition hover:border-ink/20"
      >
        <Search className="size-4" />
        Rechercher…
        <kbd className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 font-sans text-2xs font-semibold">⌘K</kbd>
      </button>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV.slice(0, 8).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition',
                isActive ? 'text-ink' : 'text-muted hover:bg-surface-2/70 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-xl bg-surface shadow-card ring-1 ring-line/60" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
                <Icon className={cn('relative size-[18px]', isActive && 'text-accent')} />
                <span className="relative">{label}</span>
                {counts[to as keyof typeof counts] ? (
                  <span className="relative ml-auto text-2xs font-semibold tabular-nums text-muted">{counts[to as keyof typeof counts]}</span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => openAddBook()}
        className="mb-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-semibold text-accent-ink shadow-glow transition hover:brightness-105 active:scale-[0.98]"
      >
        <Plus className="size-[18px]" /> Ajouter un livre
      </button>
      <NavLink
        to="/settings"
        className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-2', isActive && 'bg-surface-2')}
      >
        <Avatar name={settings.name} src={settings.avatar} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{settings.name || 'Lecteur'}</p>
          <p className="text-2xs text-muted">Profil & réglages</p>
        </div>
      </NavLink>
    </aside>
  );
}

function BottomNav() {
  const openAddBook = useUI((s) => s.openAddBook);
  const [more, setMore] = useState(false);
  const location = useLocation();
  const main = [NAV[0], NAV[1]];
  const right = [NAV[5]];
  const moreActive = !['/', '/library', '/calendar'].includes(location.pathname) && !location.pathname.startsWith('/book/');

  const item = ({ to, label, icon: Icon, short }: (typeof NAV)[number] & { short?: string }) => (
    <NavLink key={to} to={to} end={to === '/'} className="flex flex-1 flex-col items-center gap-1 py-1.5">
      {({ isActive }) => (
        <>
          <span className={cn('relative flex h-8 w-14 items-center justify-center rounded-full transition', isActive ? 'text-accent' : 'text-muted')}>
            {isActive && <motion.span layoutId="tab-active" className="absolute inset-0 rounded-full bg-accent/12" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
            <Icon className="relative size-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          <span className={cn('text-[10.5px] font-medium', isActive ? 'text-ink' : 'text-muted')}>{short ?? label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-surface/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-end px-2 pt-1">
          {main.map(item)}
          <div className="flex flex-1 justify-center pb-1.5">
            <button
              type="button"
              aria-label="Ajouter un livre"
              onClick={() => openAddBook()}
              className="-mt-5 flex size-14 items-center justify-center rounded-[20px] bg-accent text-accent-ink shadow-glow transition active:scale-90"
            >
              <Plus className="size-7" strokeWidth={2.2} />
            </button>
          </div>
          {right.map(item)}
          <button type="button" onClick={() => setMore(true)} className="flex flex-1 flex-col items-center gap-1 py-1.5">
            <span className={cn('flex h-8 w-14 items-center justify-center rounded-full', moreActive ? 'bg-accent/12 text-accent' : 'text-muted')}>
              <MoreHorizontal className="size-[22px]" />
            </span>
            <span className={cn('text-[10.5px] font-medium', moreActive ? 'text-ink' : 'text-muted')}>Plus</span>
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Menu" size="sm">
        <div className="grid grid-cols-3 gap-2.5">
          {NAV.filter((n) => !['/', '/library', '/calendar'].includes(n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMore(false)}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center text-[12.5px] font-medium transition active:scale-95',
                  isActive ? 'border-accent/30 bg-accent/8 text-accent' : 'border-line/80 text-ink-2',
                )
              }
            >
              <Icon className="size-6" />
              {label}
            </NavLink>
          ))}
        </div>
      </Sheet>
    </>
  );
}

export function AppShell() {
  const location = useLocation();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-clip pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <TimerPill />
    </div>
  );
}
