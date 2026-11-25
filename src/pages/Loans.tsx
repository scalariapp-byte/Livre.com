import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, BellPlus, CheckCircle2, MoreHorizontal, Pencil, Plus, Repeat2, RotateCcw, Trash2, User } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Button, IconButton } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Menu } from '@/components/ui/Menu';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { BookCover } from '@/components/books/BookCover';
import { useLibrary } from '@/store/useLibrary';
import { addDays, diffDays, fmtDate, fmtShort, relativeDay, toDayKey } from '@/lib/dates';
import { loanFormSchema, fieldErrors } from '@/lib/schemas';
import { downloadIcs } from '@/lib/ics';
import { cn } from '@/lib/utils';
import type { Loan, LoanDirection } from '@/types';

type Tab = 'lent' | 'borrowed' | 'history';

function LoanForm({ loan, defaultBookId, defaultDirection, onDone }: { loan?: Loan; defaultBookId?: string; defaultDirection: LoanDirection; onDone: () => void }) {
  const books = useLibrary((s) => s.books);
  const { addLoan, updateLoan } = useLibrary.getState();
  const today = toDayKey();
  const initialBook = books.find((b) => b.id === (loan?.bookId ?? defaultBookId));
  const [v, setV] = useState({
    direction: loan?.direction ?? defaultDirection,
    bookId: loan?.bookId ?? initialBook?.id ?? '',
    title: loan?.title ?? initialBook?.title ?? '',
    author: loan?.author ?? initialBook?.authors[0] ?? '',
    person: loan?.person ?? '',
    startDate: loan?.startDate ?? today,
    dueDate: loan?.dueDate ?? addDays(today, 21),
    note: loan?.note ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v, val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const people = useMemo(() => [...new Set(useLibrary.getState().loans.map((l) => l.person))], []);
  const ownBooks = books.filter((b) => b.status !== 'wishlist').sort((a, b) => a.title.localeCompare(b.title, 'fr'));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = loanFormSchema.safeParse(v);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    const d = parsed.data;
    const book = books.find((b) => b.id === d.bookId);
    const payload = {
      direction: d.direction,
      bookId: book?.id,
      title: book?.title ?? d.title,
      author: book?.authors[0] ?? (d.author || undefined),
      coverUrl: book?.coverUrl,
      person: d.person,
      startDate: d.startDate,
      dueDate: d.dueDate || undefined,
      note: d.note?.trim() || undefined,
    };
    if (loan) {
      updateLoan(loan.id, payload);
      toast.success('Prêt mis à jour');
    } else {
      addLoan(payload);
      toast.success(d.direction === 'lent' ? `Prêt à ${d.person} enregistré` : `Emprunt à ${d.person} enregistré`);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Segmented<LoanDirection>
        value={v.direction}
        onChange={(d) => set('direction', d)}
        className="w-full"
        options={[
          { value: 'lent', label: <span className="flex items-center gap-1.5"><ArrowUpRight className="size-4" />Je prête</span> },
          { value: 'borrowed', label: <span className="flex items-center gap-1.5"><ArrowDownLeft className="size-4" />J'emprunte</span> },
        ]}
      />
      {v.direction === 'lent' && ownBooks.length > 0 && (
        <Field label="Livre de ma bibliothèque">
          {(id) => (
            <Select
              id={id}
              value={v.bookId}
              onChange={(e) => {
                const b = books.find((x) => x.id === e.target.value);
                setV((s) => ({ ...s, bookId: e.target.value, title: b?.title ?? '', author: b?.authors[0] ?? '' }));
                setErrors((er) => ({ ...er, title: '' }));
              }}
            >
              <option value="">— Autre livre —</option>
              {ownBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      {(!v.bookId || v.direction === 'borrowed') && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titre du livre" error={errors.title}>
            {(id) => <Input id={id} value={v.title} onChange={(e) => setV((s) => ({ ...s, title: e.target.value, bookId: '' }))} invalid={!!errors.title} placeholder="Titre" />}
          </Field>
          <Field label="Auteur" optional>
            {(id) => <Input id={id} value={v.author} onChange={(e) => set('author', e.target.value)} />}
          </Field>
        </div>
      )}
      <Field label={v.direction === 'lent' ? 'Prêté à' : 'Emprunté à'} error={errors.person}>
        {(id) => (
          <>
            <Input id={id} list="loan-people" value={v.person} onChange={(e) => set('person', e.target.value)} invalid={!!errors.person} placeholder="Nom de la personne ou bibliothèque" leading={<User className="size-4" />} />
            <datalist id="loan-people">
              {people.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Depuis le" error={errors.startDate}>
          {(id) => <Input id={id} type="date" value={v.startDate} onChange={(e) => set('startDate', e.target.value)} />}
        </Field>
        <Field label="Retour prévu" error={errors.dueDate} optional>
          {(id) => <Input id={id} type="date" value={v.dueDate} min={v.startDate} onChange={(e) => set('dueDate', e.target.value)} invalid={!!errors.dueDate} />}
        </Field>
      </div>
      <div className="-mt-1 flex flex-wrap gap-1.5">
        {[
          { l: '1 semaine', d: 7 },
          { l: '2 semaines', d: 14 },
          { l: '3 semaines', d: 21 },
          { l: '1 mois', d: 30 },
        ].map((q) => (
          <button key={q.d} type="button" onClick={() => set('dueDate', addDays(v.startDate, q.d))} className={cn('rounded-full border px-3 py-1 text-xs font-medium transition', v.dueDate === addDays(v.startDate, q.d) ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2')}>
            {q.l}
          </button>
        ))}
        <button type="button" onClick={() => set('dueDate', '')} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2">
          Sans date
        </button>
      </div>
      <Field label="Note" optional>
        {(id) => <Textarea id={id} value={v.note} onChange={(e) => set('note', e.target.value)} className="min-h-[70px]" placeholder="État du livre, numéro de carte…" />}
      </Field>
      <Button type="submit" size="lg" block>
        {loan ? 'Enregistrer' : 'Enregistrer le prêt'}
      </Button>
    </form>
  );
}

function LoanCard({ loan, onEdit }: { loan: Loan; onEdit: () => void }) {
  const { updateLoan, deleteLoan } = useLibrary.getState();
  const today = toDayKey();
  const days = loan.dueDate ? diffDays(loan.dueDate, today) : null;
  const late = !loan.returnedAt && days !== null && days < 0;
  const soon = !loan.returnedAt && days !== null && days >= 0 && days <= 3;
  const since = diffDays(today, loan.startDate);

  const markReturned = () => {
    updateLoan(loan.id, { returnedAt: new Date().toISOString() });
    toast.success(loan.direction === 'lent' ? `« ${loan.title} » est revenu` : `« ${loan.title} » rendu`, {
      action: { label: 'Annuler', onClick: () => useLibrary.getState().updateLoan(loan.id, { returnedAt: undefined }) },
    });
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className={cn('card p-4', late && 'border-danger/40')}>
      <div className="flex gap-3.5">
        <BookCover title={loan.title} author={loan.author} src={loan.coverUrl} size="sm" className="!w-14" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{loan.title}</p>
              {loan.author && <p className="truncate text-[13px] text-muted">{loan.author}</p>}
            </div>
            <Menu
              items={[
                { label: 'Modifier', icon: <Pencil />, onSelect: onEdit },
                ...(loan.dueDate && !loan.returnedAt
                  ? [
                      {
                        label: 'Ajouter un rappel au calendrier',
                        icon: <BellPlus />,
                        onSelect: () => {
                          downloadIcs({
                            uid: `loan-${loan.id}`,
                            title: loan.direction === 'lent' ? `Récupérer « ${loan.title} » (${loan.person})` : `Rendre « ${loan.title} » à ${loan.person}`,
                            date: loan.dueDate!,
                            time: '10:00',
                            durationMin: 15,
                            alarmMinutesBefore: 60 * 24,
                          });
                          toast.success('Rappel téléchargé', { description: 'Ouvrez le fichier pour l’ajouter à votre calendrier.' });
                        },
                      },
                    ]
                  : []),
                loan.returnedAt
                  ? { label: 'Marquer comme non rendu', icon: <RotateCcw />, onSelect: () => updateLoan(loan.id, { returnedAt: undefined }) }
                  : { label: 'Marquer comme rendu', icon: <CheckCircle2 />, onSelect: markReturned },
                'divider',
                {
                  label: 'Supprimer',
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: async () => {
                    if (await confirm({ title: 'Supprimer ce prêt ?', message: 'Il sera retiré de votre historique.', danger: true, confirmLabel: 'Supprimer' })) {
                      deleteLoan(loan.id);
                      toast.success('Prêt supprimé');
                    }
                  },
                },
              ]}
              trigger={(p) => (
                <IconButton label="Actions" size="sm" {...p}>
                  <MoreHorizontal className="size-[18px]" />
                </IconButton>
              )}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px]">
            <span className={cn('flex size-6 items-center justify-center rounded-full', loan.direction === 'lent' ? 'bg-accent/12 text-accent' : 'bg-info/12 text-info')}>
              {loan.direction === 'lent' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownLeft className="size-3.5" />}
            </span>
            <span className="text-ink-2">
              {loan.direction === 'lent' ? 'Prêté à' : 'Emprunté à'} <b className="text-ink">{loan.person}</b>
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {loan.returnedAt ? (
              <Badge tone="green">Rendu le {fmtShort(loan.returnedAt)}</Badge>
            ) : loan.dueDate ? (
              <Badge tone={late ? 'danger' : soon ? 'warning' : 'neutral'}>{late ? `En retard de ${-days!} j` : `Retour ${relativeDay(loan.dueDate).toLowerCase()}`}</Badge>
            ) : (
              <Badge>Sans échéance</Badge>
            )}
            <span className="text-2xs text-muted">
              Depuis le {fmtDate(loan.startDate)}
              {!loan.returnedAt && since > 0 ? ` · ${since} j` : ''}
            </span>
          </div>
          {loan.note && <p className="mt-2 rounded-xl bg-surface-2/70 px-3 py-2 text-xs text-ink-2">{loan.note}</p>}
        </div>
      </div>
      {!loan.returnedAt && (
        <Button variant={late ? 'primary' : 'soft'} size="sm" block className="mt-3.5" icon={<CheckCircle2 className="size-4" />} onClick={markReturned}>
          {loan.direction === 'lent' ? 'Le livre m’a été rendu' : 'J’ai rendu le livre'}
        </Button>
      )}
    </motion.div>
  );
}

export function LoansPage() {
  const loans = useLibrary((s) => s.loans);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('lent');
  const [editing, setEditing] = useState<Loan | null>(null);
  const [creating, setCreating] = useState(false);
  const [defaultBookId, setDefaultBookId] = useState<string | undefined>();

  useEffect(() => {
    if (params.get('new')) {
      setDefaultBookId(params.get('book') ?? undefined);
      setCreating(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const active = loans.filter((l) => !l.returnedAt);
  const sortDue = (a: Loan, b: Loan) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
  const lists: Record<Tab, Loan[]> = {
    lent: active.filter((l) => l.direction === 'lent').sort(sortDue),
    borrowed: active.filter((l) => l.direction === 'borrowed').sort(sortDue),
    history: loans.filter((l) => l.returnedAt).sort((a, b) => (b.returnedAt ?? '').localeCompare(a.returnedAt ?? '')),
  };
  const late = active.filter((l) => l.dueDate && l.dueDate < toDayKey()).length;
  const list = lists[tab];

  return (
    <>
      <PageHeader
        title="Prêts & emprunts"
        subtitle={active.length ? `${active.length} en cours${late ? ` · ${late} en retard` : ''}` : 'Ne perdez plus jamais la trace de vos livres'}
        actions={
          <Button icon={<Plus className="size-4" />} size="sm" onClick={() => setCreating(true)} aria-label="Nouveau prêt">
            <span className="hidden sm:inline">Nouveau prêt</span>
          </Button>
        }
      />
      <PageBody>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          className="mb-5 w-full sm:w-auto"
          options={[
            { value: 'lent', label: 'Prêtés', count: lists.lent.length },
            { value: 'borrowed', label: 'Empruntés', count: lists.borrowed.length },
            { value: 'history', label: 'Historique', count: lists.history.length },
          ]}
        />
        {list.length === 0 ? (
          <EmptyState
            icon={<Repeat2 className="size-7" />}
            title={tab === 'history' ? 'Aucun historique' : tab === 'lent' ? 'Aucun livre prêté' : 'Aucun livre emprunté'}
            description={tab === 'history' ? 'Les prêts rendus apparaîtront ici.' : 'Enregistrez à qui vous prêtez vos livres et recevez un rappel avant la date de retour.'}
            action={
              tab !== 'history' && (
                <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                  {tab === 'lent' ? 'Prêter un livre' : 'Ajouter un emprunt'}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {list.map((l) => (
                <LoanCard key={l.id} loan={l} onEdit={() => setEditing(l)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </PageBody>
      <Sheet open={creating || !!editing} onClose={() => {
          setCreating(false);
          setEditing(null);
          setDefaultBookId(undefined);
        }} title={editing ? 'Modifier le prêt' : 'Nouveau prêt'}>
        {(creating || editing) && (
          <LoanForm
            key={editing?.id ?? 'new'}
            loan={editing ?? undefined}
            defaultBookId={defaultBookId}
            defaultDirection={tab === 'borrowed' ? 'borrowed' : 'lent'}
            onDone={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </>
  );
}
