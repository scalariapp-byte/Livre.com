import { AnimatePresence, motion } from 'framer-motion';
import { BellPlus, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { BookCover } from '@/components/books/BookCover';
import { useLibrary } from '@/store/useLibrary';
import { addDays, fmtMonth, fmtWeekday, fromDayKey, monthGrid, toDayKey } from '@/lib/dates';
import { planFormSchema, fieldErrors } from '@/lib/schemas';
import { totalsByDay } from '@/lib/stats';
import { downloadIcs } from '@/lib/ics';
import { cn, formatMinutes } from '@/lib/utils';
import type { ReadingPlan } from '@/types';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function PlanForm({ plan, date, onDone }: { plan?: ReadingPlan; date: string; onDone: () => void }) {
  const books = useLibrary((s) => s.books);
  const { addPlan, updatePlan } = useLibrary.getState();
  const candidates = books.filter((b) => b.status === 'reading' || b.status === 'toread').sort((a, b) => (a.status === 'reading' ? -1 : 1) - (b.status === 'reading' ? -1 : 1));
  const first = plan ? undefined : candidates[0];
  const [v, setV] = useState({
    bookId: plan?.bookId ?? first?.id ?? '',
    title: plan?.title ?? first?.title ?? '',
    date: plan?.date ?? date,
    time: plan?.time ?? '21:00',
    durationMin: String(plan?.durationMin ?? 30),
    note: plan?.note ?? '',
    repeat: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v, val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = planFormSchema.safeParse({ ...v, time: v.time || undefined, bookId: v.bookId || undefined });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    const d = parsed.data;
    const payload = { bookId: d.bookId, title: d.title, date: d.date, time: d.time, durationMin: d.durationMin, note: d.note?.trim() || undefined };
    if (plan) {
      updatePlan(plan.id, payload);
      toast.success('Session modifiée');
    } else {
      const repeat = Number(v.repeat);
      for (let i = 0; i <= repeat; i++) addPlan({ ...payload, date: addDays(d.date, i * 7) });
      toast.success(repeat ? `${repeat + 1} sessions planifiées` : 'Session planifiée');
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Livre">
        {(id) => (
          <Select
            id={id}
            value={v.bookId}
            onChange={(e) => {
              const b = books.find((x) => x.id === e.target.value);
              setV((s) => ({ ...s, bookId: e.target.value, title: b ? b.title : s.bookId ? '' : s.title }));
            }}
          >
            <option value="">— Autre (événement libre) —</option>
            {candidates.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
                {b.status === 'reading' ? ' · en cours' : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {!v.bookId && (
        <Field label="Titre" error={errors.title}>
          {(id) => <Input id={id} value={v.title} onChange={(e) => set('title', e.target.value)} invalid={!!errors.title} placeholder="Ex. Club de lecture" />}
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={errors.date}>
          {(id) => <Input id={id} type="date" value={v.date} onChange={(e) => set('date', e.target.value)} />}
        </Field>
        <Field label="Heure" error={errors.time} optional>
          {(id) => <Input id={id} type="time" value={v.time} onChange={(e) => set('time', e.target.value)} />}
        </Field>
      </div>
      <Field label="Durée" error={errors.durationMin}>
        {() => (
          <div className="flex flex-wrap gap-1.5">
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set('durationMin', String(m))}
                className={cn('h-9 rounded-full border px-3.5 text-[13px] font-medium transition', v.durationMin === String(m) ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2')}
              >
                {formatMinutes(m)}
              </button>
            ))}
            <Input type="number" aria-label="Durée personnalisée (minutes)" min={5} value={v.durationMin} onChange={(e) => set('durationMin', e.target.value)} className="!h-9 w-24 !py-1" />
          </div>
        )}
      </Field>
      {!plan && (
        <Field label="Répéter chaque semaine">
          {(id) => (
            <Select id={id} value={v.repeat} onChange={(e) => set('repeat', e.target.value)}>
              <option value="0">Non</option>
              <option value="3">Pendant 4 semaines</option>
              <option value="7">Pendant 8 semaines</option>
              <option value="11">Pendant 12 semaines</option>
            </Select>
          )}
        </Field>
      )}
      <Field label="Note" optional>
        {(id) => <Textarea id={id} value={v.note} onChange={(e) => set('note', e.target.value)} className="min-h-[64px]" placeholder="Chapitres à lire, objectif…" />}
      </Field>
      <Button type="submit" size="lg" block>
        {plan ? 'Enregistrer' : 'Planifier'}
      </Button>
    </form>
  );
}

export function CalendarPage() {
  const plans = useLibrary((s) => s.plans);
  const sessions = useLibrary((s) => s.sessions);
  const books = useLibrary((s) => s.books);
  const { updatePlan, deletePlan, startTimer } = useLibrary.getState();
  const [params, setParams] = useSearchParams();
  const today = toDayKey();
  const [selected, setSelected] = useState(params.get('date') ?? today);
  const [month, setMonth] = useState(() => fromDayKey(params.get('date') ?? today));
  const [dir, setDir] = useState(0);
  const [sheet, setSheet] = useState<{ plan?: ReadingPlan } | null>(null);

  useEffect(() => {
    if (params.get('new')) {
      setSheet({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const grid = useMemo(() => monthGrid(month), [month]);
  const totals = useMemo(() => totalsByDay(sessions), [sessions]);
  const plansByDay = useMemo(() => {
    const m = new Map<string, ReadingPlan[]>();
    for (const p of plans) m.set(p.date, [...(m.get(p.date) ?? []), p]);
    return m;
  }, [plans]);

  const dayPlans = (plansByDay.get(selected) ?? []).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const daySessions = sessions.filter((s) => s.date === selected);
  const dayTotal = totals.get(selected);
  const bookOf = (id?: string) => books.find((b) => b.id === id);

  const shift = (n: number) => {
    setDir(n);
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  };

  const monthStats = useMemo(() => {
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    let days = 0;
    let pages = 0;
    for (const [d, t] of totals) {
      if (d.startsWith(key) && (t.pages || t.minutes)) {
        days++;
        pages += t.pages;
      }
    }
    const planned = plans.filter((p) => p.date.startsWith(key)).length;
    return { days, pages, planned };
  }, [month, totals, plans]);

  return (
    <>
      <PageHeader
        title="Calendrier"
        subtitle="Planifiez vos sessions et retrouvez vos jours de lecture"
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setSheet({})} className="hidden sm:inline-flex">
            Planifier
          </Button>
        }
      />
      <PageBody>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="h-display text-xl font-semibold">{fmtMonth(month)}</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMonth(fromDayKey(today));
                    setSelected(today);
                  }}
                >
                  Aujourd'hui
                </Button>
                <IconButton label="Mois précédent" size="sm" variant="soft" onClick={() => shift(-1)}>
                  <ChevronLeft className="size-4" />
                </IconButton>
                <IconButton label="Mois suivant" size="sm" variant="soft" onClick={() => shift(1)}>
                  <ChevronRight className="size-4" />
                </IconButton>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="label py-1">
                  {d}
                </span>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={month.toISOString()}
                custom={dir}
                initial={{ opacity: 0, x: dir * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -30 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-7 gap-1"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) shift(1);
                  else if (info.offset.x > 60) shift(-1);
                }}
              >
                {grid.map((d) => {
                  const inMonth = fromDayKey(d).getMonth() === month.getMonth();
                  const t = totals.get(d);
                  const read = !!t && (t.pages > 0 || t.minutes > 0);
                  const dp = plansByDay.get(d) ?? [];
                  const isSel = d === selected;
                  const isToday = d === today;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelected(d)}
                      aria-label={fmtWeekday(d)}
                      aria-pressed={isSel}
                      className={cn(
                        'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-medium transition active:scale-95 sm:aspect-[1.15]',
                        !inMonth && 'opacity-30',
                        isSel ? 'bg-ink text-bg' : 'hover:bg-surface-2',
                        isToday && !isSel && 'text-accent ring-1 ring-inset ring-accent/40',
                      )}
                    >
                      <span className={cn('tabular-nums', isToday && 'font-bold')}>{fromDayKey(d).getDate()}</span>
                      <span className="mt-1 flex h-1.5 items-center gap-0.5">
                        {read && <span className={cn('size-1.5 rounded-full', isSel ? 'bg-bg' : 'bg-success')} />}
                        {dp.slice(0, 2).map((p) => (
                          <span key={p.id} className={cn('size-1.5 rounded-full', p.done ? (isSel ? 'bg-bg/60' : 'bg-muted/50') : isSel ? 'bg-accent' : 'bg-accent')} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4 text-xs text-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" /> Jour de lecture
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" /> Session prévue
                </span>
              </div>
              <span>
                {monthStats.days} jours lus · {monthStats.pages} pages · {monthStats.planned} prévues
              </span>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="label">{selected === today ? "Aujourd'hui" : 'Jour sélectionné'}</p>
                <h3 className="h-display mt-0.5 text-lg font-semibold">{fmtWeekday(selected)}</h3>
              </div>
              <Button size="sm" variant="soft" icon={<Plus className="size-4" />} onClick={() => setSheet({})}>
                Planifier
              </Button>
            </div>

            {dayTotal && (dayTotal.pages > 0 || dayTotal.minutes > 0) && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-success/10 p-3 text-sm">
                <BookOpen className="size-5 text-success" />
                <span>
                  <b>{dayTotal.pages} pages</b> lues{dayTotal.minutes ? ` en ${formatMinutes(dayTotal.minutes)}` : ''}
                </span>
              </div>
            )}

            {dayPlans.length === 0 && daySessions.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted">Rien de prévu ce jour-là.</p>
              </div>
            )}

            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {dayPlans.map((p) => {
                  const b = bookOf(p.bookId);
                  return (
                    <motion.li key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className={cn('rounded-2xl border border-line/80 p-3', p.done && 'opacity-60')}>
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          aria-label={p.done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                          onClick={() => {
                            updatePlan(p.id, { done: !p.done });
                            if (!p.done) toast.success('Session accomplie ✓');
                          }}
                          className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90', p.done ? 'border-success bg-success text-white' : 'border-line hover:border-accent')}
                        >
                          {p.done && <Check className="size-3.5" strokeWidth={3} />}
                        </button>
                        {b && <BookCover title={b.title} src={b.coverUrl} size="xs" />}
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-sm font-semibold', p.done && 'line-through')}>{p.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="size-3" />
                            {p.time ?? 'Toute la journée'} · {formatMinutes(p.durationMin)}
                          </p>
                          {p.note && <p className="mt-1 text-xs text-ink-2">{p.note}</p>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-0.5">
                        {b && b.status === 'reading' && !p.done && selected === today && (
                          <Button size="sm" variant="ghost" onClick={() => startTimer(b.id)} disabled={!!useLibrary.getState().timer}>
                            Démarrer
                          </Button>
                        )}
                        <IconButton
                          label="Ajouter au calendrier du téléphone"
                          size="sm"
                          onClick={() => {
                            downloadIcs({ uid: `plan-${p.id}`, title: `Lecture : ${p.title}`, description: p.note, date: p.date, time: p.time, durationMin: p.durationMin });
                            toast.success('Événement téléchargé', { description: 'Ouvrez-le pour l’ajouter à votre calendrier.' });
                          }}
                        >
                          <BellPlus className="size-4" />
                        </IconButton>
                        <IconButton label="Modifier" size="sm" onClick={() => setSheet({ plan: p })}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Supprimer"
                          size="sm"
                          onClick={async () => {
                            if (await confirm({ title: 'Supprimer cette session ?', danger: true, confirmLabel: 'Supprimer' })) {
                              deletePlan(p.id);
                              toast.success('Session supprimée');
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {daySessions.length > 0 && (
              <div className="mt-5">
                <p className="label mb-2">Lectures enregistrées</p>
                <ul className="space-y-1">
                  {daySessions.map((s) => {
                    const b = bookOf(s.bookId);
                    return (
                      <li key={s.id} className="flex items-center gap-3 py-1 text-sm">
                        {b && <BookCover title={b.title} src={b.coverUrl} size="xs" className="!w-7" />}
                        <span className="min-w-0 flex-1 truncate">{b?.title ?? 'Livre supprimé'}</span>
                        <span className="text-xs tabular-nums text-muted">
                          {s.pagesRead} p.{s.minutes ? ` · ${s.minutes} min` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>
      </PageBody>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet?.plan ? 'Modifier la session' : 'Planifier une lecture'}>
        {sheet && <PlanForm key={sheet.plan?.id ?? selected} plan={sheet.plan} date={selected < today ? today : selected} onDone={() => setSheet(null)} />}
      </Sheet>
    </>
  );
}
