import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, ExternalLink, Heart, NotebookPen, Pencil, Repeat2, Timer, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { BookCover } from '@/components/books/BookCover';
import { BookMenu } from '@/components/books/BookMenu';
import { Button, IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { Rating } from '@/components/ui/Rating';
import { Input, Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/misc';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { STATUS_META, STATUS_ORDER } from '@/lib/constants';
import { changeStatus } from '@/lib/bookActions';
import { estimateRemaining, readingSpeed } from '@/lib/stats';
import { fmtDate, fmtShort, relativeDay } from '@/lib/dates';
import { cn, formatMinutes, percent } from '@/lib/utils';

export function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  const allSessions = useLibrary((s) => s.sessions);
  const loans = useLibrary((s) => s.loans);
  const timer = useLibrary((s) => s.timer);
  const { updateBook, toggleFavorite, addNote, deleteNote, startTimer, deleteSession } = useLibrary.getState();
  const setProgress = useUI((s) => s.setProgressBook);
  const setEdit = useUI((s) => s.setEditBook);

  const sessions = useMemo(() => allSessions.filter((s) => s.bookId === id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [allSessions, id]);
  const speed = useMemo(() => readingSpeed(allSessions), [allSessions]);
  const [review, setReview] = useState(book?.review ?? '');
  const [note, setNote] = useState('');
  const [notePage, setNotePage] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setReview(book?.review ?? ''), [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!book)
    return (
      <EmptyState
        className="min-h-[70dvh]"
        icon={<BookOpen className="size-7" />}
        title="Livre introuvable"
        description="Il a peut-être été supprimé."
        action={<Button onClick={() => navigate('/library')}>Retour à la bibliothèque</Button>}
      />
    );

  const pct = percent(book.currentPage, book.pageCount);
  const totalMin = sessions.reduce((s, x) => s + x.minutes, 0);
  const remaining = book.status === 'reading' ? estimateRemaining(book, speed) : null;
  const bookLoans = loans.filter((l) => l.bookId === book.id);
  const activeLoan = bookLoans.find((l) => !l.returnedAt);

  const submitNote = (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    const p = notePage ? Number(notePage) : undefined;
    if (p !== undefined && (Number.isNaN(p) || p < 0)) return toast.error('Numéro de page invalide');
    addNote(book.id, note, p);
    setNote('');
    setNotePage('');
    toast.success('Note ajoutée');
  };

  const saveReview = () => {
    if ((book.review ?? '') !== review) {
      updateBook(book.id, { review: review.trim() || undefined });
      toast.success('Avis enregistré');
    }
  };

  const info = [
    { label: 'Pages', value: book.pageCount || '—' },
    { label: 'Genre', value: book.genre || '—' },
    { label: 'Ajouté le', value: fmtShort(book.addedAt) },
    book.startedAt && { label: 'Commencé', value: fmtShort(book.startedAt) },
    book.finishedAt && { label: 'Terminé', value: fmtShort(book.finishedAt) },
    totalMin > 0 && { label: 'Temps de lecture', value: formatMinutes(totalMin) },
    book.publishedYear && { label: 'Parution', value: book.publishedYear },
    book.publisher && { label: 'Éditeur', value: book.publisher },
    book.isbn && { label: 'ISBN', value: book.isbn },
  ].filter(Boolean) as { label: string; value: string | number }[];

  return (
    <div className="pb-6">
      {/* Bandeau */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {book.coverUrl && <img src={book.coverUrl} alt="" className="size-full scale-125 object-cover opacity-30 blur-3xl saturate-150 dark:opacity-25" />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
        </div>
        <div className="safe-top mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-10 lg:pt-8">
          <div className="mb-4 flex items-center justify-between">
            <IconButton label="Retour" variant="soft" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/library'))}>
              <ArrowLeft className="size-5" />
            </IconButton>
            <div className="flex items-center gap-1.5">
              <IconButton label={book.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} variant="soft" onClick={() => toggleFavorite(book.id)}>
                <Heart className={cn('size-[19px] transition', book.favorite && 'scale-110 text-accent')} fill={book.favorite ? 'currentColor' : 'none'} />
              </IconButton>
              <IconButton label="Modifier" variant="soft" onClick={() => setEdit(book.id)}>
                <Pencil className="size-[18px]" />
              </IconButton>
              <BookMenu book={book} variant="soft" onDeleted={() => navigate('/library', { replace: true })} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pb-6 text-center sm:flex-row sm:items-end sm:text-left">
            <motion.div initial={{ opacity: 0, y: 16, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', bounce: 0.25 }}>
              <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="xl" className="!w-[150px] shadow-lift sm:!w-[180px]" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <span className="label">{STATUS_META[book.status].label}</span>
              <h1 className="h-display mt-1 text-[30px] font-semibold leading-[1.08] sm:text-[38px]">{book.title}</h1>
              {book.subtitle && <p className="mt-1 text-[15px] text-ink-2">{book.subtitle}</p>}
              <p className="mt-2 text-[15px] text-muted">{book.authors.join(', ') || 'Auteur inconnu'}</p>
              <div className="mt-3 flex justify-center sm:justify-start">
                <Rating value={book.rating} onChange={(r) => updateBook(book.id, { rating: r })} size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <div className="min-w-0 space-y-4">
          {/* Statut */}
          <section className="card p-4">
            <p className="label mb-3">Statut de lecture</p>
            <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatus(book.id, s)}
                  aria-pressed={book.status === s}
                  className={cn(
                    'h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95',
                    book.status === s ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3',
                  )}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </section>

          {/* Progression */}
          {(book.status === 'reading' || book.status === 'finished' || book.status === 'abandoned') && (
            <section className="card p-5">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="label">Progression</p>
                  <p className="mt-1 text-sm">
                    <span className="h-display text-3xl font-semibold tabular-nums">{book.currentPage}</span>
                    <span className="text-muted"> / {book.pageCount || '?'} pages</span>
                  </p>
                </div>
                <p className="h-display text-3xl font-semibold tabular-nums text-accent">{pct}%</p>
              </div>
              <ProgressBar value={pct} tone={book.status === 'finished' ? 'success' : 'accent'} />
              {remaining !== null && remaining > 0 && <p className="mt-2 text-xs text-muted">Environ {formatMinutes(remaining)} pour terminer, d'après votre vitesse moyenne ({speed} p./h).</p>}
              {book.status === 'reading' && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                  <Button icon={<BookOpen className="size-4" />} onClick={() => setProgress(book.id)}>
                    Mettre à jour
                  </Button>
                  <Button variant="outline" icon={<Timer className="size-4" />} disabled={!!timer} onClick={() => startTimer(book.id)}>
                    {timer?.bookId === book.id ? 'En cours…' : 'Lancer le minuteur'}
                  </Button>
                  <Button variant="ghost" className="col-span-2" icon={<CheckCircle2 className="size-4" />} onClick={() => changeStatus(book.id, 'finished')}>
                    Marquer comme lu
                  </Button>
                </div>
              )}
            </section>
          )}
          {(book.status === 'toread' || book.status === 'wishlist') && (
            <section className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-semibold">{book.status === 'toread' ? 'Prêt à commencer ?' : 'Vous avez ce livre ?'}</p>
                <p className="text-sm text-muted">{book.status === 'toread' ? 'Le suivi de progression démarrera aujourd’hui.' : 'Déplacez-le dans votre pile à lire.'}</p>
              </div>
              <div className="flex gap-2">
                {book.purchaseUrl && (
                  <a href={book.purchaseUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" icon={<ExternalLink className="size-4" />}>
                      Acheter
                    </Button>
                  </a>
                )}
                <Button onClick={() => changeStatus(book.id, book.status === 'toread' ? 'reading' : 'toread')}>{book.status === 'toread' ? 'Commencer la lecture' : 'Je l’ai !'}</Button>
              </div>
            </section>
          )}

          {book.description && (
            <section className="card p-5">
              <p className="label mb-2">Résumé</p>
              <p className={cn('whitespace-pre-line text-[15px] leading-relaxed text-ink-2', !expanded && 'line-clamp-5')}>{book.description}</p>
              {book.description.length > 300 && (
                <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-2 text-sm font-semibold text-accent">
                  {expanded ? 'Réduire' : 'Lire la suite'}
                </button>
              )}
            </section>
          )}

          {/* Avis personnel */}
          <section className="card p-5">
            <p className="label mb-2">Mon avis</p>
            <Textarea value={review} onChange={(e) => setReview(e.target.value)} onBlur={saveReview} placeholder="Ce que vous avez pensé de ce livre…" className="min-h-[90px]" maxLength={5000} />
            {(book.review ?? '') !== review && (
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={saveReview}>
                  Enregistrer
                </Button>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <NotebookPen className="size-4 text-muted" />
              <p className="label">Notes & citations · {book.notes.length}</p>
            </div>
            <form onSubmit={submitNote} className="flex flex-col gap-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Une citation, une réflexion…" className="min-h-[72px]" maxLength={3000} />
              <div className="flex gap-2">
                <Input type="number" inputMode="numeric" min={0} value={notePage} onChange={(e) => setNotePage(e.target.value)} placeholder="Page" className="w-24" aria-label="Page" />
                <Button type="submit" disabled={!note.trim()} className="ml-auto">
                  Ajouter la note
                </Button>
              </div>
            </form>
            {book.notes.length > 0 && (
              <ul className="mt-4 space-y-2">
                {book.notes.map((n) => (
                  <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative rounded-2xl border-l-[3px] border-accent/60 bg-surface-2/70 py-3 pl-4 pr-10">
                    <p className="whitespace-pre-line text-[14.5px] leading-relaxed">{n.text}</p>
                    <p className="mt-1.5 text-2xs text-muted">
                      {n.page !== undefined && `Page ${n.page} · `}
                      {fmtShort(n.createdAt)}
                    </p>
                    <button
                      type="button"
                      aria-label="Supprimer la note"
                      onClick={async () => {
                        if (await confirm({ title: 'Supprimer cette note ?', danger: true, confirmLabel: 'Supprimer' })) deleteNote(book.id, n.id);
                      }}
                      className="absolute right-2 top-2 rounded-lg p-1.5 text-muted opacity-60 transition hover:bg-surface-3 hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="card p-5">
            <p className="label mb-3">Informations</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {info.map((i) => (
                <div key={i.label} className="min-w-0">
                  <dt className="text-2xs text-muted">{i.label}</dt>
                  <dd className="truncate text-sm font-semibold">{i.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="label">Sessions · {sessions.length}</p>
              {book.status === 'reading' && (
                <button type="button" onClick={() => setProgress(book.id)} className="text-xs font-semibold text-accent">
                  + Ajouter
                </button>
              )}
            </div>
            {sessions.length ? (
              <ul className="max-h-[320px] space-y-1 overflow-y-auto">
                {sessions.map((s) => (
                  <li key={s.id} className="group flex items-center gap-3 rounded-xl py-1.5 text-sm">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                      <Calendar className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{relativeDay(s.date)}</p>
                      <p className="text-2xs text-muted">
                        {s.pagesRead} pages{s.minutes ? ` · ${formatMinutes(s.minutes)}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Supprimer la session"
                      className="rounded-lg p-1.5 text-muted opacity-0 transition hover:text-danger group-hover:opacity-100 focus:opacity-100"
                      onClick={async () => {
                        if (await confirm({ title: 'Supprimer cette session ?', message: 'Elle ne sera plus comptée dans vos statistiques. La progression du livre reste inchangée.', danger: true, confirmLabel: 'Supprimer' }))
                          deleteSession(s.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Clock className="size-4" /> Aucune session enregistrée.
              </p>
            )}
          </section>

          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Prêt</p>
              <Link to={`/loans?new=1&book=${book.id}`} className="text-xs font-semibold text-accent">
                {activeLoan ? '' : '+ Prêter'}
              </Link>
            </div>
            {activeLoan ? (
              <Link to="/loans" className="flex items-center gap-3 rounded-xl bg-surface-2/70 p-3 text-sm">
                <Repeat2 className="size-4 text-accent" />
                <span>
                  {activeLoan.direction === 'lent' ? 'Prêté à' : 'Emprunté à'} <b>{activeLoan.person}</b>
                  {activeLoan.dueDate && <span className="block text-xs text-muted">Retour prévu le {fmtDate(activeLoan.dueDate)}</span>}
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted">{bookLoans.length ? `${bookLoans.length} prêt(s) passé(s).` : 'Ce livre n’est pas prêté.'}</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
