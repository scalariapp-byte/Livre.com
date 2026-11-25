import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { Textarea } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toast';
import { BookCover } from './BookCover';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { ENDINGS, MOODS, PACES, RECOMMENDS, questionsFor } from '@/lib/reflection';
import { cn } from '@/lib/utils';
import type { Book, Ending, Pace, Recommend } from '@/types';

function Choice<T extends string>({ value, onChange, options }: { value?: T; onChange: (v: T | undefined) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(value === o.id ? undefined : o.id)}
          className={cn(
            'h-10 rounded-full border px-4 text-[14px] font-medium transition active:scale-95',
            value === o.id ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2 hover:border-ink/30',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const STEPS = ['Ressenti', 'Votre avis', 'Questions'];

function ReflectionForm({ book, onDone }: { book: Book; onDone: () => void }) {
  const { saveReflection, updateBook } = useLibrary.getState();
  const r = book.reflection;
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(book.rating);
  const [moods, setMoods] = useState<string[]>(r?.moods ?? []);
  const [ending, setEnding] = useState<Ending | undefined>(r?.ending);
  const [pace, setPace] = useState<Pace | undefined>(r?.pace);
  const [recommend, setRecommend] = useState<Recommend | undefined>(r?.recommend);
  const [reread, setReread] = useState<boolean | undefined>(r?.reread);
  const [answers, setAnswers] = useState<Record<string, string>>(r?.answers ?? {});
  const [summary, setSummary] = useState(r?.summary ?? book.review ?? '');
  const questions = questionsFor(book);

  const toggleMood = (id: string) => setMoods((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.length >= 4 ? m : [...m, id]));

  const save = () => {
    const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
    saveReflection(book.id, { moods, ending, pace, recommend, reread, answers: clean, summary: summary.trim() || undefined });
    updateBook(book.id, { rating, review: summary.trim() || undefined });
    toast.success('Bilan enregistré', { description: 'Retrouvez-le sur la fiche du livre.' });
    onDone();
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{book.title}</p>
          <p className="truncate text-sm text-muted">{book.authors.join(', ')}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={cn('h-1 rounded-full transition-colors', i <= step ? 'bg-accent' : 'bg-surface-3')} />
            <p className={cn('mt-1.5 text-2xs font-medium', i === step ? 'text-ink' : 'text-muted')}>{label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="space-y-6">
          {step === 0 && (
            <>
              <section>
                <p className="mb-2 text-[15px] font-semibold">Quelle note lui donnez-vous ?</p>
                <Rating value={rating} onChange={setRating} size={34} />
              </section>
              <section>
                <p className="text-[15px] font-semibold">Qu’avez-vous ressenti ?</p>
                <p className="mb-3 text-xs text-muted">Jusqu’à 4 choix</p>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((m) => {
                    const on = moods.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleMood(m.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-[12.5px] font-medium transition active:scale-95',
                          on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2',
                          !on && moods.length >= 4 && 'opacity-40',
                        )}
                      >
                        <span className="text-xl leading-none">{m.emoji}</span>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {step === 1 && (
            <>
              <section>
                <p className="mb-2.5 text-[15px] font-semibold">La fin vous a-t-elle plu ?</p>
                <Choice value={ending} onChange={setEnding} options={ENDINGS} />
              </section>
              <section>
                <p className="mb-2.5 text-[15px] font-semibold">Le rythme du livre ?</p>
                <Choice value={pace} onChange={setPace} options={PACES} />
              </section>
              <section>
                <p className="mb-2.5 text-[15px] font-semibold">Le recommanderiez-vous ?</p>
                <Choice value={recommend} onChange={setRecommend} options={RECOMMENDS} />
              </section>
              <section>
                <p className="mb-2.5 text-[15px] font-semibold">Le reliriez-vous un jour ?</p>
                <Choice
                  value={reread === undefined ? undefined : reread ? 'yes' : 'no'}
                  onChange={(v) => setReread(v === undefined ? undefined : v === 'yes')}
                  options={[
                    { id: 'yes', label: 'Oui' },
                    { id: 'no', label: 'Non' },
                  ]}
                />
              </section>
            </>
          )}

          {step === 2 && (
            <>
              {questions.map((q) => (
                <section key={q.id}>
                  <label htmlFor={`q-${q.id}`} className="mb-2 block text-[15px] font-semibold">
                    {q.label}
                  </label>
                  <Textarea id={`q-${q.id}`} value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder={q.placeholder} className="min-h-[72px]" maxLength={2000} />
                </section>
              ))}
              <section>
                <label htmlFor="q-summary" className="mb-2 block text-[15px] font-semibold">
                  Votre ressenti en quelques mots
                </label>
                <Textarea id="q-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Ce que ce livre vous laisse…" className="min-h-[90px]" maxLength={5000} />
              </section>
              <p className="text-xs text-muted">Toutes les questions sont facultatives.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="lg" icon={<ArrowLeft className="size-4" />} onClick={() => setStep((s) => s - 1)} aria-label="Étape précédente" />
        )}
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1" onClick={() => setStep((s) => s + 1)}>
            Continuer
          </Button>
        ) : (
          <Button size="lg" className="flex-1" icon={<Check className="size-4" />} onClick={save}>
            Enregistrer mon bilan
          </Button>
        )}
      </div>
    </div>
  );
}

/** Bilan proposé à la fin d'un livre (ou ouvert depuis la fiche). */
export function ReflectionSheet() {
  const id = useUI((s) => s.reflectionBookId);
  const setId = useUI((s) => s.setReflection);
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [id]);
  return (
    <Sheet open={!!book} onClose={() => setId(null)} title={book?.reflection ? 'Modifier mon bilan' : 'Bilan de lecture'} description={book?.reflection ? undefined : 'Livre terminé ! Prenez une minute pour garder une trace de votre lecture.'}>
      {book && <ReflectionForm key={`${book.id}-${key}`} book={book} onDone={() => setId(null)} />}
    </Sheet>
  );
}
