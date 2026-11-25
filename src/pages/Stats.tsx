import { BookCheck, Clock, FileText, Flame, Gauge, Pencil, Trophy } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { BarChart, Donut, Heatmap } from '@/components/charts/Charts';
import { Segmented } from '@/components/ui/Segmented';
import { ProgressRing } from '@/components/ui/Progress';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/misc';
import { useLibrary } from '@/store/useLibrary';
import { bestStreak, finishedInYear, genreDistribution, goalPace, monthlySeries, readingSpeed, readingStreak, totalsByDay } from '@/lib/stats';
import { fmtMonthShort } from '@/lib/dates';
import { CHART_COLORS } from '@/lib/constants';
import { MOODS } from '@/lib/reflection';
import { cn, formatMinutes, percent } from '@/lib/utils';

type Metric = 'books' | 'pages' | 'minutes';

function Kpi({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-xl [&>svg]:size-4', tone)}>{icon}</span>
        <span className="text-[13px] font-medium text-muted">{label}</span>
      </div>
      <p className="h-display mt-3 text-[28px] font-semibold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function GoalsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useLibrary((s) => s.settings);
  const update = useLibrary((s) => s.updateSettings);
  const [v, setV] = useState({ y: String(settings.yearlyGoal), p: String(settings.dailyPagesGoal), m: String(settings.dailyMinutesGoal) });
  const [err, setErr] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Objectifs de lecture" size="sm">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const y = Number(v.y);
          const p = Number(v.p);
          const m = Number(v.m);
          if (![y, p, m].every((n) => Number.isInteger(n) && n >= 0 && n <= 10000)) return setErr('Entrez des nombres entiers positifs.');
          update({ yearlyGoal: y, dailyPagesGoal: p, dailyMinutesGoal: m });
          toast.success('Objectifs mis à jour');
          onClose();
        }}
      >
        <Field label={`Livres à lire en ${new Date().getFullYear()}`}>{(id) => <Input id={id} type="number" min={0} value={v.y} onChange={(e) => setV({ ...v, y: e.target.value })} />}</Field>
        <Field label="Pages par jour">{(id) => <Input id={id} type="number" min={0} value={v.p} onChange={(e) => setV({ ...v, p: e.target.value })} />}</Field>
        <Field label="Minutes par jour">{(id) => <Input id={id} type="number" min={0} value={v.m} onChange={(e) => setV({ ...v, m: e.target.value })} />}</Field>
        {err && <p className="text-xs font-medium text-danger">{err}</p>}
        <Button type="submit" size="lg" block>
          Enregistrer
        </Button>
      </form>
    </Sheet>
  );
}

export function StatsPage() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const settings = useLibrary((s) => s.settings);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const set = new Set<number>([currentYear]);
    sessions.forEach((s) => set.add(Number(s.date.slice(0, 4))));
    books.forEach((b) => b.finishedAt && set.add(new Date(b.finishedAt).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [books, sessions, currentYear]);
  const [year, setYear] = useState(currentYear);
  const [metric, setMetric] = useState<Metric>('books');
  const [goalsOpen, setGoalsOpen] = useState(false);

  const s = useMemo(() => {
    const finished = finishedInYear(books, year);
    const yearSessions = sessions.filter((x) => x.date.startsWith(String(year)));
    const pages = yearSessions.reduce((a, x) => a + x.pagesRead, 0);
    const minutes = yearSessions.reduce((a, x) => a + x.minutes, 0);
    const series = monthlySeries(books, sessions, year);
    const genres = genreDistribution(finished.length ? finished : books.filter((b) => b.status !== 'wishlist'));
    const rated = finished.filter((b) => b.rating);
    const authors = new Map<string, number>();
    finished.forEach((b) => b.authors.slice(0, 1).forEach((a) => authors.set(a, (authors.get(a) ?? 0) + 1)));
    const longest = [...finished].sort((a, b) => b.pageCount - a.pageCount)[0];
    const activeDays = new Set(yearSessions.filter((x) => x.pagesRead || x.minutes).map((x) => x.date)).size;
    return {
      finished,
      pages,
      minutes,
      series,
      genres,
      avgRating: rated.length ? rated.reduce((a, b) => a + (b.rating ?? 0), 0) / rated.length : null,
      topAuthors: [...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      longest,
      activeDays,
      heat: new Map([...totalsByDay(sessions)].map(([k, v]) => [k, v.pages])),
      reflected: finished.filter((b) => b.reflection),
    };
  }, [books, sessions, year]);

  const speed = useMemo(() => readingSpeed(sessions), [sessions]);
  const streak = useMemo(() => readingStreak(sessions), [sessions]);
  const best = useMemo(() => bestStreak(sessions), [sessions]);
  const goalPct = percent(s.finished.length, settings.yearlyGoal);
  const pace = goalPace(s.finished.length, settings.yearlyGoal);
  const isCurrent = year === currentYear;

  const genreData = s.genres.slice(0, 6).map((g, i) => ({ label: g.genre, value: g.count, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const rest = s.genres.slice(6).reduce((a, g) => a + g.count, 0);
  if (rest) genreData.push({ label: 'Autres', value: rest, color: CHART_COLORS[6] });

  const fmtMetric = (v: number) => (metric === 'minutes' ? formatMinutes(v) : metric === 'pages' ? `${v} p.` : `${v} livre${v > 1 ? 's' : ''}`);
  const nowMonth = new Date().getMonth();

  if (!books.length && !sessions.length)
    return (
      <>
        <PageHeader title="Statistiques" />
        <PageBody>
          <EmptyState icon={<Gauge className="size-7" />} title="Pas encore de statistiques" description="Ajoutez des livres et enregistrez vos sessions : vos graphiques se construiront automatiquement." />
        </PageBody>
      </>
    );

  return (
    <>
      <PageHeader title="Statistiques" subtitle="Vos habitudes de lecture en un coup d'œil" />
      <PageBody className="space-y-4">
        {years.length > 1 && (
          <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Segmented value={String(year)} onChange={(v) => setYear(Number(v))} options={years.map((y) => ({ value: String(y), label: String(y) }))} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Objectif annuel */}
          <section className="card relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-accent/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <p className="label">Objectif {year}</p>
              <button type="button" onClick={() => setGoalsOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-accent">
                <Pencil className="size-3" /> Modifier
              </button>
            </div>
            <div className="mt-4 flex items-center gap-5">
              <ProgressRing value={goalPct} size={112} stroke={10} tone={goalPct >= 100 ? 'success' : 'accent'}>
                <div className="text-center">
                  <p className="h-display text-3xl font-semibold leading-none tabular-nums">{s.finished.length}</p>
                  <p className="mt-1 text-2xs text-muted">sur {settings.yearlyGoal}</p>
                </div>
              </ProgressRing>
              <div className="min-w-0">
                <p className="h-display text-2xl font-semibold">{goalPct}%</p>
                {isCurrent ? (
                  <p className="mt-1 text-[13px] leading-snug text-muted">
                    {goalPct >= 100
                      ? 'Objectif atteint, bravo !'
                      : pace.ahead >= 0
                        ? `En avance de ${pace.ahead.toFixed(1).replace('.', ',')} livre(s) sur le rythme prévu.`
                        : `${Math.max(0, settings.yearlyGoal - s.finished.length)} livres restants · ${(-pace.ahead).toFixed(1).replace('.', ',')} de retard.`}
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] text-muted">{s.finished.length} livres lus en {year}.</p>
                )}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <Kpi icon={<BookCheck />} label="Livres lus" value={s.finished.length} sub={s.avgRating ? `Note moyenne ${s.avgRating.toFixed(1).replace('.', ',')} ★` : undefined} tone="bg-success/12 text-success" />
            <Kpi icon={<FileText />} label="Pages lues" value={s.pages.toLocaleString('fr-FR')} sub={s.activeDays ? `${Math.round(s.pages / s.activeDays)} p. par jour de lecture` : undefined} tone="bg-info/12 text-info" />
            <Kpi icon={<Clock />} label="Temps de lecture" value={formatMinutes(s.minutes)} sub={speed ? `Vitesse moyenne ${speed} p./h` : 'Utilisez le minuteur pour mesurer'} tone="bg-violet/12 text-violet" />
            <Kpi icon={<Flame />} label="Série actuelle" value={`${streak} j`} sub={`Record : ${best} jour${best > 1 ? 's' : ''}`} tone="bg-accent/12 text-accent" />
          </div>
        </div>

        {/* Progression mensuelle */}
        <section className="card p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="h-display text-lg font-semibold">Progression mensuelle</h2>
              <p className="text-[13px] text-muted">Total {year} : {fmtMetric(s.series.reduce((a, p) => a + p[metric], 0))}</p>
            </div>
            <Segmented<Metric>
              size="sm"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'books', label: 'Livres' },
                { value: 'pages', label: 'Pages' },
                { value: 'minutes', label: 'Temps' },
              ]}
            />
          </div>
          <BarChart
            height={190}
            format={fmtMetric}
            data={s.series.map((p, i) => ({
              key: p.key,
              label: fmtMonthShort(p.date).slice(0, 3),
              value: p[metric],
              highlight: isCurrent && i === nowMonth,
              tooltip: `${fmtMonthShort(p.date)} · ${fmtMetric(p[metric])}`,
            }))}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="h-display mb-1 text-lg font-semibold">Genres préférés</h2>
            <p className="mb-5 text-[13px] text-muted">{s.finished.length ? `Livres terminés en ${year}` : 'Toute votre bibliothèque'}</p>
            {genreData.length ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Donut
                  data={genreData}
                  center={
                    <>
                      <span className="h-display text-2xl font-semibold">{genreData.reduce((a, g) => a + g.value, 0)}</span>
                      <span className="text-xs text-muted">livres</span>
                    </>
                  }
                />
                <ul className="w-full flex-1 space-y-2">
                  {genreData.map((g) => {
                    const total = genreData.reduce((a, x) => a + x.value, 0);
                    return (
                      <li key={g.label} className="flex items-center gap-2.5 text-sm">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="min-w-0 flex-1 truncate">{g.label}</span>
                        <span className="tabular-nums text-muted">{Math.round((g.value / total) * 100)}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted">Renseignez le genre de vos livres pour voir cette répartition.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="h-display mb-1 text-lg font-semibold">Activité</h2>
            <p className="mb-5 text-[13px] text-muted">Pages lues par jour, 20 dernières semaines</p>
            <Heatmap values={s.heat} />
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/70 pt-4">
              <div>
                <p className="label">Auteurs favoris</p>
                {s.topAuthors.length ? (
                  <ul className="mt-2 space-y-1">
                    {s.topAuthors.slice(0, 3).map(([a, n]) => (
                      <li key={a} className="flex justify-between gap-2 text-sm">
                        <span className="truncate">{a}</span>
                        <span className="tabular-nums text-muted">{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">—</p>
                )}
              </div>
              <div>
                <p className="label flex items-center gap-1">
                  <Trophy className="size-3" /> Plus long livre
                </p>
                {s.longest ? (
                  <p className="mt-2 text-sm">
                    <span className="line-clamp-2 font-semibold">{s.longest.title}</span>
                    <span className="text-muted">{s.longest.pageCount} pages</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">—</p>
                )}
              </div>
            </div>
          </section>
        </div>
        {/* Ressentis issus des bilans de lecture */}
        <section className="card p-5">
          <h2 className="h-display mb-1 text-lg font-semibold">Vos ressentis</h2>
          {s.reflected.length ? (
            (() => {
              const counts = MOODS.map((m) => ({ ...m, n: s.reflected.filter((b) => b.reflection!.moods.includes(m.id)).length }))
                .filter((m) => m.n)
                .sort((a, b) => b.n - a.n);
              const max = Math.max(1, ...counts.map((c) => c.n));
              const rec = s.reflected.filter((b) => b.reflection!.recommend);
              const yes = rec.filter((b) => b.reflection!.recommend === 'yes').length;
              return (
                <>
                  <p className="mb-5 text-[13px] text-muted">
                    D’après {s.reflected.length} bilan{s.reflected.length > 1 ? 's' : ''} de lecture
                    {rec.length ? ` · ${Math.round((yes / rec.length) * 100)} % de livres que vous recommandez sans hésiter` : ''}
                  </p>
                  {counts.length ? (
                    <ul className="space-y-2.5">
                      {counts.slice(0, 6).map((c) => (
                        <li key={c.id} className="flex items-center gap-3 text-sm">
                          <span className="w-7 text-center text-lg">{c.emoji}</span>
                          <span className="w-32 shrink-0 truncate">{c.label}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${(c.n / max) * 100}%` }} />
                          </div>
                          <span className="w-6 text-right tabular-nums text-muted">{c.n}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">Aucun ressenti renseigné dans vos bilans.</p>
                  )}
                </>
              );
            })()
          ) : (
            <p className="py-4 text-sm text-muted">Quand vous terminez un livre, faites son bilan : vos émotions de lecture apparaîtront ici.</p>
          )}
        </section>
      </PageBody>
      <GoalsSheet key={String(goalsOpen)} open={goalsOpen} onClose={() => setGoalsOpen(false)} />
    </>
  );
}
