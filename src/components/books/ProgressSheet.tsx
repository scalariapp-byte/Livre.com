import { useEffect, useState, type FormEvent } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { BookCover } from './BookCover';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { toDayKey } from '@/lib/dates';
import { bookPercent, cn, percent, formatDuration } from '@/lib/utils';
import { Segmented } from '@/components/ui/Segmented';
import { promptReflection } from '@/lib/bookActions';
import { sessionFormSchema, fieldErrors } from '@/lib/schemas';
import type { Book } from '@/types';

type Mode = 'pages' | 'percent';

const readMode = (): Mode => {
  try {
    return localStorage.getItem('livre-progress-mode') === 'percent' ? 'percent' : 'pages';
  } catch {
    return 'pages';
  }
};

/** Formulaire commun : progression (en pages ou en %), durée, date. */
function ProgressForm({ book, initialMinutes = 0, onDone, submitLabel = 'Enregistrer', header }: { book: Book; initialMinutes?: number; onDone: () => void; submitLabel?: string; header?: React.ReactNode }) {
  const { logSession, setPercent } = useLibrary.getState();
  const hasPages = book.pageCount > 0;
  const [mode, setModeState] = useState<Mode>(hasPages ? readMode() : 'percent');
  const [page, setPage] = useState(book.currentPage);
  const [pct, setPct] = useState(bookPercent(book));
  const [minutes, setMinutes] = useState(String(initialMinutes || ''));
  const [date, setDate] = useState(toDayKey());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startPct = bookPercent(book);

  const setMode = (m: Mode) => {
    if (m === mode) return;
    // Conversion entre les deux unités pour garder la même position.
    if (m === 'percent') setPct(percent(page, book.pageCount));
    else setPage(Math.round((pct / 100) * book.pageCount));
    setModeState(m);
    try {
      localStorage.setItem('livre-progress-mode', m);
    } catch {
      /* ignore */
    }
  };

  const isPct = mode === 'percent';
  const max = isPct ? 100 : book.pageCount || 99999;
  const value = isPct ? pct : page;
  const setValue = (v: number) => {
    const n = Math.max(0, Math.min(max, Math.round(v) || 0));
    if (isPct) setPct(n);
    else setPage(n);
  };
  const shownPct = isPct ? pct : percent(page, book.pageCount);
  const delta = isPct ? pct - startPct : page - book.currentPage;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = sessionFormSchema.safeParse({ date, minutes: minutes || 0, toPage: isPct ? 0 : page });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    if (!isPct && hasPages && page > book.pageCount) return setErrors({ toPage: `Maximum ${book.pageCount} pages` });
    const wasFinished = book.status === 'finished';
    const opts = { minutes: parsed.data.minutes, date: parsed.data.date };
    if (isPct) setPercent(book.id, pct, opts);
    else logSession({ bookId: book.id, date: opts.date, minutes: opts.minutes, toPage: page });
    const now = useLibrary.getState().books.find((b) => b.id === book.id);
    if (now?.status === 'finished' && !wasFinished) {
      toast.success(`Bravo ! « ${book.title} » est terminé 🎉`);
      promptReflection(book.id);
    } else if (delta > 0) toast.success(isPct ? `${pct} % atteint (+${delta} %)` : `+${delta} pages enregistrées`, { description: opts.minutes ? `${opts.minutes} min de lecture` : undefined });
    else toast.success('Progression mise à jour');
    onDone();
  };

  const chips = [5, 10, 25];

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {header ?? (
        <div className="flex items-center gap-4">
          <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{book.title}</p>
            <p className="text-sm text-muted">
              {hasPages ? `Actuellement p. ${book.currentPage} / ${book.pageCount} · ` : 'Actuellement '}
              {startPct} %
            </p>
          </div>
        </div>
      )}

      {hasPages && (
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          className="w-full"
          options={[
            { value: 'pages', label: 'En pages' },
            { value: 'percent', label: 'En pourcentage' },
          ]}
        />
      )}

      <div className="rounded-3xl bg-surface-2 p-5 text-center">
        <p className="label">{isPct ? 'Progression' : 'Page atteinte'}</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <button type="button" aria-label="Diminuer" onClick={() => setValue(value - 1)} className="flex size-11 items-center justify-center rounded-full bg-surface shadow-card transition active:scale-90">
            <Minus className="size-5" />
          </button>
          <div className="flex items-baseline justify-center">
            <input
              aria-label={isPct ? 'Pourcentage lu' : 'Page atteinte'}
              type="number"
              inputMode="numeric"
              value={value}
              min={0}
              max={max}
              onChange={(e) => setValue(Number(e.target.value))}
              className={cn('h-display bg-transparent text-center text-5xl font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none', isPct ? 'w-24' : 'w-32')}
            />
            {isPct && <span className="h-display text-3xl font-semibold text-muted">%</span>}
          </div>
          <button type="button" aria-label="Augmenter" onClick={() => setValue(value + 1)} className="flex size-11 items-center justify-center rounded-full bg-surface shadow-card transition active:scale-90">
            <Plus className="size-5" />
          </button>
        </div>
        {(isPct || hasPages) && (
          <>
            <input type="range" aria-label="Progression" min={0} max={max} value={value} onChange={(e) => setValue(Number(e.target.value))} className="mt-4 w-full accent-[rgb(var(--accent))]" />
            <p className="mt-1 text-sm text-muted">
              {isPct ? (hasPages ? `≈ page ${Math.round((pct / 100) * book.pageCount)} / ${book.pageCount}` : 'Livre sans nombre de pages') : `${shownPct} %`} ·{' '}
              {delta > 0 ? <span className="font-semibold text-accent">+{delta}{isPct ? ' %' : ' pages'}</span> : delta < 0 ? <span>{delta}{isPct ? ' %' : ' pages'}</span> : 'aucun changement'}
            </p>
          </>
        )}
        {errors.toPage && <p className="mt-2 text-xs font-medium text-danger">{errors.toPage}</p>}
        <div className="mt-3 flex justify-center gap-2">
          {chips.map((n) => (
            <button key={n} type="button" onClick={() => setValue(value + n)} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-2 shadow-card transition active:scale-95">
              +{n}{isPct ? ' %' : ''}
            </button>
          ))}
          <button type="button" onClick={() => setValue(max)} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-card transition active:scale-95">
            Fini
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Durée (minutes)" error={errors.minutes} optional>
          {(id) => <Input id={id} type="number" inputMode="numeric" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" invalid={!!errors.minutes} />}
        </Field>
        <Field label="Date" error={errors.date}>
          {(id) => <Input id={id} type="date" max={toDayKey()} value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
      </div>

      <Button type="submit" size="lg" block>
        {submitLabel}
      </Button>
    </form>
  );
}

export function ProgressSheet() {
  const id = useUI((s) => s.progressBookId);
  const setId = useUI((s) => s.setProgressBook);
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  return (
    <Sheet open={!!book} onClose={() => setId(null)} title="Progression" size="sm">
      {book && <ProgressForm key={book.id} book={book} onDone={() => setId(null)} />}
    </Sheet>
  );
}

/** Feuille affichée à l'arrêt du minuteur : on saisit la page atteinte, la durée est pré-remplie. */
export function TimerFinishSheet() {
  const open = useUI((s) => s.timerFinishOpen);
  const setOpen = useUI((s) => s.setTimerFinish);
  const timer = useLibrary((s) => s.timer);
  const cancelTimer = useLibrary((s) => s.cancelTimer);
  const book = useLibrary((s) => s.books.find((b) => b.id === timer?.bookId));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (open && timer) setElapsed(timer.elapsedMs + (timer.runningSince ? Date.now() - timer.runningSince : 0));
  }, [open, timer]);

  if (!book || !timer) return null;
  const minutes = Math.max(1, Math.round(elapsed / 60000));
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Fin de session" description={`Vous avez lu pendant ${formatDuration(elapsed)}.`} size="sm">
      <ProgressForm
        key={timer.runningSince ?? timer.elapsedMs}
        book={book}
        initialMinutes={minutes}
        submitLabel="Enregistrer la session"
        onDone={() => {
          cancelTimer();
          setOpen(false);
        }}
      />
      <button
        type="button"
        className="mt-3 w-full py-2 text-center text-sm font-medium text-muted hover:text-danger"
        onClick={() => {
          cancelTimer();
          setOpen(false);
          toast.info('Session ignorée');
        }}
      >
        Ignorer cette session
      </button>
    </Sheet>
  );
}
