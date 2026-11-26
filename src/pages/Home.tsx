import { motion } from 'framer-motion';
import { ArrowRight, BookCheck, BookOpen, BookmarkPlus, CalendarDays, Clock, Flame, FolderHeart, Gift, Library, Plus, Repeat2, Settings, Target, Timer, TrendingUp } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { HeaderActions } from '@/components/layout/PageHeader';
import { BookCover } from '@/components/books/BookCover';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Avatar, Badge } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { BarChart } from '@/components/charts/Charts';
import { dayTotals, estimateRemaining, finishedInYear, lastNDays, readingSpeed, readingStreak, totalsByDay } from '@/lib/stats';
import { diffDays, fmtMonth, fmtWeekday, fromDayKey, greeting, monthGrid, relativeDay, toDayKey } from '@/lib/dates';
import type { ReadingPlan, ReadingSession } from '@/types';
import { bookPercent, cn, formatMinutes, percent, plural } from '@/lib/utils';
import type { Book } from '@/types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0, duration: 0.5 } } };

function Card({ children, className, title, icon, to, action }: { children: ReactNode; className?: string; title?: string; icon?: ReactNode; to?: string; action?: ReactNode }) {
  return (
    <motion.section variants={item} className={cn('card flex flex-col p-5', className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            {icon && <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2 text-ink-2 [&>svg]:size-4">{icon}</span>}
            {title}
          </h2>
          {action ??
            (to && (
              <Link to={to} className="flex items-center gap-1 text-[13px] font-medium text-muted transition hover:text-accent">
                Tout voir <ArrowRight className="size-3.5" />
              </Link>
            ))}
        </div>
      )}
      {children}
    </motion.section>
  );
}

function CurrentlyReading({ books, speed }: { books: Book[]; speed: number | null }) {
  const setProgress = useUI((s) => s.setProgressBook);
  const openAdd = useUI((s) => s.openAddBook);
  const startTimer = useLibrary((s) => s.startTimer);
  const timer = useLibrary((s) => s.timer);
  const navigate = useNavigate();
  if (!books.length)
    return (
      <Card className="lg:col-span-2" title="En cours de lecture" icon={<BookOpen />}>
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line py-10 text-center">
          <p className="font-semibold">Aucune lecture en cours</p>
          <p className="mt-1 text-sm text-muted">Commencez un livre de votre pile « À lire » ou ajoutez-en un.</p>
          <Button className="mt-4" size="sm" icon={<Plus className="size-4" />} onClick={() => openAdd('reading')}>
            Commencer un livre
          </Button>
        </div>
      </Card>
    );
  const [main, ...others] = books;
  const pct = bookPercent(main);
  const remaining = estimateRemaining(main, speed);
  return (
    <Card className="overflow-hidden lg:col-span-2" title="En cours de lecture" icon={<BookOpen />} to="/library?status=reading">
      <div className="relative flex gap-5">
        <div className="pointer-events-none absolute -left-10 -top-16 size-56 rounded-full bg-accent/10 blur-3xl" />
        <button type="button" onClick={() => navigate(`/book/${main.id}`)} className="relative shrink-0 transition active:scale-95">
          <BookCover title={main.title} author={main.authors[0]} src={main.coverUrl} size="lg" className="sm:!w-[132px]" />
        </button>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <Link to={`/book/${main.id}`} className="h-display line-clamp-2 text-[22px] font-semibold leading-tight hover:underline">
            {main.title}
          </Link>
          <p className="mt-1 truncate text-sm text-muted">{main.authors.join(', ')}</p>
          <div className="mt-auto pt-4">
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-semibold tabular-nums">
                {main.pageCount ? (
                  <>
                    {main.currentPage}
                    <span className="font-normal text-muted"> / {main.pageCount} pages</span>
                  </>
                ) : (
                  <span className="font-normal text-muted">Progression</span>
                )}
              </span>
              <span className="h-display text-lg font-semibold tabular-nums text-accent">{pct}%</span>
            </div>
            <ProgressBar value={pct} />
            {remaining !== null && remaining > 0 && <p className="mt-2 text-xs text-muted">≈ {formatMinutes(remaining)} restantes à votre rythme</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setProgress(main.id)}>
                Mettre à jour
              </Button>
              <Button size="sm" variant="outline" icon={<Timer className="size-4" />} disabled={!!timer} onClick={() => startTimer(main.id)}>
                {timer?.bookId === main.id ? 'Minuteur actif' : 'Minuteur'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {others.length > 0 && (
        <div className="mt-5 grid gap-2 border-t border-line/70 pt-4 sm:grid-cols-2">
          {others.slice(0, 4).map((b) => {
            const p = bookPercent(b);
            return (
              <button key={b.id} type="button" onClick={() => navigate(`/book/${b.id}`)} className="flex items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-surface-2">
                <BookCover title={b.title} src={b.coverUrl} size="xs" className="!w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={p} size="sm" />
                    <span className="text-2xs font-semibold tabular-nums text-muted">{p}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CoverStrip({ books, empty, emptyAction }: { books: Book[]; empty: string; emptyAction?: ReactNode }) {
  const navigate = useNavigate();
  if (!books.length)
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <p className="text-sm text-muted">{empty}</p>
        {emptyAction}
      </div>
    );
  return (
    <div className="scrollbar-none -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
      {books.map((b) => (
        <button key={b.id} type="button" onClick={() => navigate(`/book/${b.id}`)} className="w-[84px] shrink-0 text-left transition active:scale-95">
          <BookCover title={b.title} author={b.authors[0]} src={b.coverUrl} size="md" className="!w-[84px]" />
          <p className="mt-2 line-clamp-2 text-[12.5px] font-semibold leading-tight">{b.title}</p>
          <p className="truncate text-2xs text-muted">{b.authors[0]}</p>
        </button>
      ))}
    </div>
  );
}

/** Mois en miniature : jours de lecture (vert), sessions prévues (accent), aujourd'hui. */
function MiniCalendar({ sessions, plans, today }: { sessions: ReadingSession[]; plans: ReadingPlan[]; today: string }) {
  const navigate = useNavigate();
  const month = fromDayKey(today);
  const grid = monthGrid(month);
  const totals = totalsByDay(sessions);
  const planned = new Set(plans.filter((p) => !p.done).map((p) => p.date));
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{fmtMonth(month)}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-muted">
            {d}
          </span>
        ))}
        {grid.map((d) => {
          const inMonth = fromDayKey(d).getMonth() === month.getMonth();
          const t = totals.get(d);
          const read = !!t && (t.pages > 0 || t.minutes > 0);
          const isToday = d === today;
          return (
            <button
              key={d}
              type="button"
              onClick={() => navigate(`/calendar?date=${d}`)}
              className={cn('mx-auto flex size-8 flex-col items-center justify-center rounded-full text-xs tabular-nums transition active:scale-90', !inMonth && 'opacity-25', isToday ? 'bg-accent font-bold text-accent-ink' : 'hover:bg-surface-2')}
              aria-label={d}
            >
              {fromDayKey(d).getDate()}
              <span className="flex h-1 gap-0.5">
                {read && <span className={cn('size-1 rounded-full', isToday ? 'bg-accent-ink' : 'bg-success')} />}
                {planned.has(d) && <span className={cn('size-1 rounded-full', isToday ? 'bg-accent-ink' : 'bg-accent')} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const QUICK = [
  { to: '/to-read', label: 'À lire', icon: BookmarkPlus },
  { to: '/wishlist', label: 'Souhaits', icon: Gift },
  { to: '/finished', label: 'Livres lus', icon: BookCheck },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/loans', label: 'Prêts', icon: Repeat2 },
  { to: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { to: '/settings', label: 'Réglages', icon: Settings },
];

export function Home() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const loans = useLibrary((s) => s.loans);
  const plans = useLibrary((s) => s.plans);
  const settings = useLibrary((s) => s.settings);
  const openAdd = useUI((s) => s.openAddBook);
  const today = toDayKey();

  const d = useMemo(() => {
    const reading = books.filter((b) => b.status === 'reading').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const toRead = books.filter((b) => b.status === 'toread').sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9) || b.addedAt.localeCompare(a.addedAt));
    const wishlist = books.filter((b) => b.status === 'wishlist').sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
    const finished = books.filter((b) => b.status === 'finished').sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''));
    const activeLoans = loans.filter((l) => !l.returnedAt).sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    const upcoming = plans.filter((p) => !p.done && p.date >= today).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
    const year = new Date().getFullYear();
    return {
      reading,
      toRead,
      wishlist,
      finished,
      activeLoans,
      upcoming,
      todayT: dayTotals(sessions, today),
      streak: readingStreak(sessions, today),
      week: lastNDays(sessions, 7, today),
      speed: readingSpeed(sessions),
      yearDone: finishedInYear(books, year).length,
    };
  }, [books, sessions, loans, plans, today]);

  const pagesPct = percent(d.todayT.pages, settings.dailyPagesGoal);
  const minutesPct = percent(d.todayT.minutes, settings.dailyMinutesGoal);
  const weekPages = d.week.reduce((s, x) => s + x.pages, 0);

  return (
    <div className="safe-top mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-9">
      {/* En-tête de bienvenue */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link to="/settings" className="flex min-w-0 items-center gap-3">
          <Avatar name={settings.name} src={settings.avatar} size={46} className="lg:hidden" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted">{fmtWeekday(today)}</p>
            <h1 className="h-display truncate text-[26px] font-semibold leading-tight sm:text-[32px]">
              {greeting()}
              {settings.name ? `, ${settings.name.split(' ')[0]}` : ''}
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button className="hidden sm:inline-flex" icon={<Plus className="size-4" />} onClick={() => openAdd()}>
            Ajouter un livre
          </Button>
          <HeaderActions />
        </div>
      </header>

      {/* Raccourcis vers toutes les pages */}
      <nav aria-label="Raccourcis" className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 lg:hidden">
        {QUICK.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex shrink-0 items-center gap-2 rounded-2xl border border-line/80 bg-surface px-3.5 py-2.5 text-[13px] font-semibold text-ink-2 shadow-card transition active:scale-95">
            <Icon className="size-4 text-accent" />
            {label}
          </Link>
        ))}
      </nav>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-3">
        {/* Statistiques quotidiennes */}
        <motion.section variants={item} className="card relative overflow-hidden p-5 lg:col-span-3">
          <div className="grid gap-5 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_auto_1fr]">
            <div className="flex items-center gap-5">
              <ProgressRing value={pagesPct} size={92} stroke={8}>
                <div className="text-center">
                  <p className="h-display text-2xl font-semibold leading-none tabular-nums">{d.todayT.pages}</p>
                  <p className="mt-0.5 text-2xs text-muted">/ {settings.dailyPagesGoal} p.</p>
                </div>
              </ProgressRing>
              <div>
                <p className="label">Aujourd'hui</p>
                <p className="mt-1 text-[15px] font-semibold">
                  {pagesPct >= 100 ? 'Objectif atteint 🎉' : d.todayT.pages ? `Encore ${settings.dailyPagesGoal - d.todayT.pages} pages` : 'Prêt à lire ?'}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                  <Clock className="size-3.5" />
                  {formatMinutes(d.todayT.minutes)} / {formatMinutes(settings.dailyMinutesGoal)}
                </p>
                <div className="mt-2 w-36">
                  <ProgressBar value={minutesPct} size="sm" tone="ink" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:border-l lg:border-line/70 lg:pl-6">
              {[
                { icon: <Flame className="size-4" />, value: d.streak, label: d.streak > 1 ? 'jours de suite' : 'jour de suite', tone: 'text-accent bg-accent/10' },
                { icon: <TrendingUp className="size-4" />, value: weekPages, label: 'pages / 7 j', tone: 'text-info bg-info/10' },
                { icon: <Target className="size-4" />, value: `${d.yearDone}/${settings.yearlyGoal}`, label: `livres en ${new Date().getFullYear()}`, tone: 'text-success bg-success/10' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-surface-2/70 p-3">
                  <span className={cn('mb-2 flex size-7 items-center justify-center rounded-lg', s.tone)}>{s.icon}</span>
                  <p className="h-display text-xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-2xs leading-tight text-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="hidden lg:block">
              <BarChart
                height={88}
                goal={settings.dailyPagesGoal}
                format={(v) => `${v} p.`}
                data={d.week.map((x) => ({
                  key: x.day,
                  label: fromDayKey(x.day).toLocaleDateString('fr-FR', { weekday: 'narrow' }),
                  value: x.pages,
                  highlight: x.day === today,
                  tooltip: `${relativeDay(x.day)} · ${x.pages} p. · ${formatMinutes(x.minutes)}`,
                }))}
              />
            </div>
          </div>
        </motion.section>

        <CurrentlyReading books={d.reading} speed={d.speed} />


        <Card title="À lire prochainement" icon={<Library />} to="/to-read" className="lg:col-span-2">
          <CoverStrip
            books={d.toRead.slice(0, 12)}
            empty="Votre pile à lire est vide."
            emptyAction={
              <button type="button" onClick={() => openAdd('toread')} className="mt-2 text-sm font-semibold text-accent">
                Ajouter un livre →
              </button>
            }
          />
        </Card>

        {/* Prêts */}
        <Card title="Prêts & emprunts" icon={<Repeat2 />} to="/loans">
          {d.activeLoans.length ? (
            <ul className="space-y-1">
              {d.activeLoans.slice(0, 3).map((l) => {
                const late = l.dueDate && diffDays(l.dueDate, today) < 0;
                return (
                  <li key={l.id}>
                    <Link to="/loans" className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-surface-2">
                      <BookCover title={l.title} src={l.coverUrl} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.title}</p>
                        <p className="truncate text-xs text-muted">
                          {l.direction === 'lent' ? 'Prêté à' : 'Emprunté à'} {l.person}
                        </p>
                      </div>
                      {l.dueDate && <Badge tone={late ? 'danger' : diffDays(l.dueDate, today) <= 3 ? 'warning' : 'neutral'}>{late ? 'En retard' : relativeDay(l.dueDate)}</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted">Aucun prêt en cours.</p>
              <Link to="/loans?new=1" className="mt-2 text-sm font-semibold text-accent">
                Enregistrer un prêt →
              </Link>
            </div>
          )}
        </Card>

        <Card title="Terminés récemment" icon={<BookOpen />} to="/finished" className="lg:col-span-2">
          <CoverStrip books={d.finished.slice(0, 12)} empty="Vos livres terminés apparaîtront ici." />
        </Card>

        <Card title="Liste de souhaits" icon={<Gift />} to="/wishlist">
          {d.wishlist.length ? (
            <ul className="space-y-1">
              {d.wishlist.slice(0, 3).map((b) => (
                <li key={b.id}>
                  <Link to={`/book/${b.id}`} className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-surface-2">
                    <BookCover title={b.title} src={b.coverUrl} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{b.title}</p>
                      <p className="truncate text-xs text-muted">{b.authors[0]}</p>
                    </div>
                    {b.price !== undefined && <span className="text-sm font-semibold tabular-nums">{b.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>}
                  </Link>
                </li>
              ))}
              {d.wishlist.length > 3 && <p className="px-1.5 pt-1 text-xs text-muted">+ {plural(d.wishlist.length - 3, 'autre envie', 'autres envies')}</p>}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted">Notez ici les livres qui vous font envie.</p>
              <button type="button" onClick={() => openAdd('wishlist')} className="mt-2 text-sm font-semibold text-accent">
                Ajouter une envie →
              </button>
            </div>
          )}
        </Card>

        {/* Calendrier */}
        <Card title="Calendrier" icon={<CalendarDays />} to="/calendar" className="lg:col-span-3">
          <div className="grid gap-5 sm:grid-cols-2">
          <MiniCalendar sessions={sessions} plans={plans} today={today} />
          <div>
          <p className="label mb-1.5">Prochaines lectures</p>
          {d.upcoming.length ? (
            <ul className="space-y-2">
              {d.upcoming.slice(0, 3).map((p) => {
                const dd = fromDayKey(p.date);
                return (
                  <li key={p.id}>
                    <Link to={`/calendar?date=${p.date}`} className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-surface-2">
                      <div className={cn('flex size-12 shrink-0 flex-col items-center justify-center rounded-xl', p.date === today ? 'bg-accent text-accent-ink' : 'bg-surface-2')}>
                        <span className="text-[10px] font-semibold uppercase leading-none opacity-80">{dd.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="h-display text-lg font-semibold leading-tight">{dd.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="text-xs text-muted">
                          {relativeDay(p.date)}
                          {p.time ? ` · ${p.time}` : ''} · {p.durationMin} min
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-start py-1">
              <p className="text-sm text-muted">Aucune session planifiée.</p>
              <Link to="/calendar?new=1" className="mt-1 text-sm font-semibold text-accent">
                Planifier une lecture →
              </Link>
            </div>
          )}
          </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
