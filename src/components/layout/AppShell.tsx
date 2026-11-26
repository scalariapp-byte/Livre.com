import { motion } from 'framer-motion';
import { PawPrint, Plus, Search } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from './nav';
import { cn } from '@/lib/utils';
import { useUI } from '@/store/useUI';
import { useLibrary } from '@/store/useLibrary';
import { Avatar } from '@/components/ui/misc';
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
        {NAV.filter((n) => n.to !== '/settings').map(({ to, label, icon: Icon }) => (
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
  const pick = (to: string) => NAV.find((n) => n.to === to)!;
  const left = [pick('/'), pick('/library')];
  const right = [
    { ...pick('/stats'), short: 'Stats' },
    { ...pick('/room'), short: 'Compagnon', icon: PawPrint },
  ];

  const item = ({ to, label, icon: Icon, short }: { to: string; label: string; icon: typeof PawPrint; short?: string }) => (
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
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-surface/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl items-end px-2 pt-1">
        {left.map(item)}
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
      </div>
    </nav>
  );
}

export function AppShell({ fallback }: { fallback?: ReactNode }) {
  const location = useLocation();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-clip pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-10">
        {/* Transition d'entrée uniquement : une animation de sortie (AnimatePresence « wait »)
            peut rester bloquée quand la page suivante se charge à la demande. */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* Suspense ici (et non au-dessus du shell) : la navigation et les feuilles ouvertes
              restent montées pendant le chargement d'une page. */}
          <Suspense fallback={fallback}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>
      <BottomNav />
      <TimerPill />
    </div>
  );
}
