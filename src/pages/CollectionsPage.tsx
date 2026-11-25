import { motion } from 'framer-motion';
import { Check, FolderHeart, Layers, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { BookCollection } from '@/components/books/BookCollection';
import { BookCover } from '@/components/books/BookCover';
import { BookRow } from '@/components/books/BookCard';
import { SHELF_EMOJIS } from '@/components/books/ShelfPicker';
import { Segmented } from '@/components/ui/Segmented';
import { Button, IconButton } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Input } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { EmptyState } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/Progress';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { cn, normalize, plural } from '@/lib/utils';
import type { Book, Shelf } from '@/types';

interface SeriesGroup {
  name: string;
  books: Book[];
  authors: string[];
  read: number;
  maxIndex: number;
  missing: number[];
}

function useSeries(): SeriesGroup[] {
  const books = useLibrary((s) => s.books);
  return useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const b of books) if (b.series) map.set(b.series, [...(map.get(b.series) ?? []), b]);
    return [...map.entries()]
      .map(([name, list]) => {
        const sorted = [...list].sort((a, b) => (a.seriesIndex ?? 999) - (b.seriesIndex ?? 999));
        const indexes = new Set(sorted.map((b) => b.seriesIndex).filter(Boolean) as number[]);
        const maxIndex = Math.max(0, ...indexes);
        const missing: number[] = [];
        for (let i = 1; i < maxIndex; i++) if (!indexes.has(i)) missing.push(i);
        return {
          name,
          books: sorted,
          authors: [...new Set(sorted.flatMap((b) => b.authors.slice(0, 1)))],
          read: sorted.filter((b) => b.status === 'finished').length,
          maxIndex,
          missing,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [books]);
}

/** Couvertures empilées façon pile de livres. */
function Stack({ books }: { books: Book[] }) {
  const top = books.slice(0, 3);
  return (
    <div className="relative h-[118px] w-[110px] shrink-0">
      {top
        .map((b, i) => (
          <div key={b.id} className="absolute bottom-0" style={{ left: i * 18, zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg) scale(${1 - i * 0.06})`, transformOrigin: 'bottom center' }}>
            <BookCover title={b.title} author={b.authors[0]} src={b.coverUrl} size="md" className="!w-[72px]" />
          </div>
        ))
        .reverse()}
    </div>
  );
}

function Mosaic({ books, emoji }: { books: Book[]; emoji?: string }) {
  const four = books.slice(0, 4);
  return (
    <div className="relative grid aspect-square grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-surface-2 p-1.5">
      {four.map((b) => (
        <div key={b.id} className="overflow-hidden rounded-lg">
          <BookCover title={b.title} src={b.coverUrl} size="md" className="!w-full !rounded-lg !shadow-none" />
        </div>
      ))}
      {four.length === 0 && <div className="col-span-2 row-span-2 flex items-center justify-center text-4xl">{emoji ?? '📚'}</div>}
      {four.length > 0 && <span className="absolute bottom-2 left-2 flex size-9 items-center justify-center rounded-xl bg-surface/90 text-lg shadow-card backdrop-blur">{emoji ?? '📚'}</span>}
    </div>
  );
}

function ShelfForm({ shelf, onDone }: { shelf?: Shelf; onDone: (id?: string) => void }) {
  const { addShelf, updateShelf } = useLibrary.getState();
  const [name, setName] = useState(shelf?.name ?? '');
  const [emoji, setEmoji] = useState(shelf?.emoji ?? '📚');
  const [error, setError] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError('Donnez un nom à la collection');
        if (shelf) {
          updateShelf(shelf.id, { name: name.trim().slice(0, 60), emoji });
          toast.success('Collection modifiée');
          onDone(shelf.id);
        } else {
          const id = addShelf(name, emoji);
          toast.success(`Collection « ${name.trim()} » créée`);
          onDone(id);
        }
      }}
    >
      <Field label="Nom" error={error}>
        {(id) => <Input id={id} value={name} onChange={(e) => (setName(e.target.value), setError(''))} placeholder="Ex. Coups de cœur, Vacances 2026…" maxLength={60} invalid={!!error} data-autofocus />}
      </Field>
      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-2">Icône</p>
        <div className="grid grid-cols-6 gap-2">
          {SHELF_EMOJIS.map((em) => (
            <button key={em} type="button" aria-pressed={emoji === em} onClick={() => setEmoji(em)} className={cn('flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl transition active:scale-90', emoji === em ? 'border-accent bg-accent/8' : 'border-transparent bg-surface-2')}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" size="lg" block>
        {shelf ? 'Enregistrer' : 'Créer la collection'}
      </Button>
    </form>
  );
}

export function CollectionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'shelves' | 'series') || 'shelves';
  const series = useSeries();
  const shelves = useLibrary((s) => s.shelves);
  const books = useLibrary((s) => s.books);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Collections"
        subtitle="Vos séries et vos collections personnelles"
        actions={
          tab === 'shelves' && (
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setCreating(true)} aria-label="Nouvelle collection">
              <span className="hidden sm:inline">Nouvelle collection</span>
            </Button>
          )
        }
      />
      <PageBody>
        <Segmented
          value={tab}
          onChange={(t) => setParams(t === 'shelves' ? {} : { tab: t }, { replace: true })}
          className="mb-5 w-full sm:w-auto"
          options={[
            { value: 'shelves', label: 'Mes collections', count: shelves.length },
            { value: 'series', label: 'Séries', count: series.length },
          ]}
        />

        {tab === 'shelves' ? (
          shelves.length === 0 ? (
            <EmptyState
              icon={<FolderHeart className="size-7" />}
              title="Créez votre première collection"
              description="Rangez vos livres comme vous voulez : « Coups de cœur », « À offrir », « Lectures d’été »… Un livre peut être dans plusieurs collections."
              action={
                <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                  Nouvelle collection
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shelves.map((sh) => {
                const list = books.filter((b) => b.shelfIds?.includes(sh.id));
                return (
                  <motion.button key={sh.id} type="button" layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/collections/shelf/${sh.id}`)} className="card card-interactive p-2.5 text-left">
                    <Mosaic books={list} emoji={sh.emoji} />
                    <p className="mt-2.5 truncate px-1 font-semibold">{sh.name}</p>
                    <p className="px-1 pb-1 text-xs text-muted">{plural(list.length, 'livre')}</p>
                  </motion.button>
                );
              })}
              <button type="button" onClick={() => setCreating(true)} className="flex aspect-[0.82] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line text-sm font-semibold text-muted transition hover:border-accent hover:text-accent">
                <Plus className="size-6" />
                Nouvelle collection
              </button>
            </div>
          )
        ) : series.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-7" />}
            title="Aucune série pour l’instant"
            description="Indiquez la série et le numéro de tome dans la fiche d’un livre. Elle est souvent détectée automatiquement lors de l’ajout (ex. « Seasons Tome 3 »)."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {series.map((s) => (
              <Link key={s.name} to={`/collections/series/${encodeURIComponent(s.name)}`} className="card card-interactive flex items-center gap-4 p-4">
                <Stack books={s.books} />
                <div className="min-w-0 flex-1">
                  <p className="h-display truncate text-lg font-semibold">{s.name}</p>
                  <p className="truncate text-[13px] text-muted">{s.authors.join(', ')}</p>
                  <p className="mt-2 text-xs text-ink-2">
                    {plural(s.books.length, 'tome')} · {s.read} lu{s.read > 1 ? 's' : ''}
                    {s.missing.length ? <span className="text-warning"> · {s.missing.length} manquant{s.missing.length > 1 ? 's' : ''}</span> : null}
                  </p>
                  <ProgressBar value={(s.read / s.books.length) * 100} size="sm" tone="success" className="mt-2 max-w-[180px]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouvelle collection" size="sm">
        {creating && (
          <ShelfForm
            onDone={(id) => {
              setCreating(false);
              if (id) navigate(`/collections/shelf/${id}`);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

export function SeriesPage() {
  const { name = '' } = useParams();
  const decoded = decodeURIComponent(name);
  const s = useSeries().find((x) => x.name === decoded);
  const openAdd = useUI((st) => st.openAddBook);
  if (!s)
    return (
      <>
        <PageHeader title="Série introuvable" back />
        <PageBody>
          <EmptyState icon={<Layers className="size-7" />} title="Cette série n’existe plus" description="Ses livres ont peut-être été modifiés ou supprimés." />
        </PageBody>
      </>
    );
  const slots: ({ type: 'book'; book: Book } | { type: 'missing'; index: number })[] = [];
  const withIndex = s.books.filter((b) => b.seriesIndex);
  for (let i = 1; i <= s.maxIndex; i++) {
    const found = withIndex.filter((b) => b.seriesIndex === i);
    if (found.length) found.forEach((book) => slots.push({ type: 'book', book }));
    else slots.push({ type: 'missing', index: i });
  }
  s.books.filter((b) => !b.seriesIndex).forEach((book) => slots.push({ type: 'book', book }));

  return (
    <>
      <PageHeader title={s.name} subtitle={`${s.authors.join(', ')} · ${plural(s.books.length, 'tome')} · ${s.read} lu${s.read > 1 ? 's' : ''}`} back eyebrow="Série" />
      <PageBody>
        <div className="card p-1.5">
          {slots.map((slot) =>
            slot.type === 'book' ? (
              <div key={slot.book.id} className="flex items-center">
                <span className="h-display w-12 shrink-0 text-center text-lg font-semibold text-muted">{slot.book.seriesIndex ?? '·'}</span>
                <div className="min-w-0 flex-1">
                  <BookRow book={slot.book} />
                </div>
              </div>
            ) : (
              <div key={`m${slot.index}`} className="flex items-center gap-3.5 p-2.5">
                <span className="h-display w-12 shrink-0 text-center text-lg font-semibold text-muted/60">{slot.index}</span>
                <div className="flex aspect-[2/3] w-[52px] items-center justify-center rounded-md border-2 border-dashed border-line text-muted">?</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-muted">Tome {slot.index}</p>
                  <p className="text-[13px] text-muted">Pas encore dans votre bibliothèque</p>
                </div>
                <Button size="sm" variant="soft" icon={<Plus className="size-4" />} onClick={() => openAdd('wishlist', { query: `${s.name} tome ${slot.index}`, series: { name: s.name, index: slot.index } })}>
                  Ajouter
                </Button>
              </div>
            ),
          )}
        </div>
        <Button
          variant="outline"
          className="mt-4"
          icon={<Plus className="size-4" />}
          onClick={() => openAdd('toread', { query: `${s.name} tome ${s.maxIndex + 1}`, series: { name: s.name, index: s.maxIndex + 1 } })}
        >
          Ajouter le tome {s.maxIndex + 1}
        </Button>
      </PageBody>
    </>
  );
}

function AddBooksSheet({ shelf, open, onClose }: { shelf: Shelf; open: boolean; onClose: () => void }) {
  const books = useLibrary((s) => s.books);
  const toggleShelf = useLibrary((s) => s.toggleShelf);
  const [q, setQ] = useState('');
  const list = books.filter((b) => !q || normalize(b.title + ' ' + b.authors.join(' ')).includes(normalize(q))).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  return (
    <Sheet open={open} onClose={onClose} title={`Ajouter à « ${shelf.name} »`} size="lg" footer={<Button block size="lg" onClick={onClose}>Terminé</Button>}>
      <Input leading={<Search className="size-[18px]" />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans ma bibliothèque" />
      <ul className="mt-3 space-y-1">
        {list.map((b) => {
          const on = b.shelfIds?.includes(shelf.id) ?? false;
          return (
            <li key={b.id}>
              <button type="button" aria-pressed={on} onClick={() => toggleShelf(b.id, shelf.id)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-surface-2">
                <BookCover title={b.title} src={b.coverUrl} size="xs" className="!w-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{b.title}</span>
                  <span className="block truncate text-xs text-muted">{b.authors.join(', ')}</span>
                </span>
                <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-accent bg-accent text-accent-ink' : 'border-line')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export function ShelfPage() {
  const { id } = useParams();
  const shelf = useLibrary((s) => s.shelves.find((x) => x.id === id));
  const allBooks = useLibrary((s) => s.books);
  const books = useMemo(() => allBooks.filter((b) => b.shelfIds?.includes(id ?? '')), [allBooks, id]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  if (!shelf)
    return (
      <>
        <PageHeader title="Collection introuvable" back />
        <PageBody>
          <EmptyState icon={<FolderHeart className="size-7" />} title="Cette collection n’existe plus" />
        </PageBody>
      </>
    );

  return (
    <>
      <PageHeader
        back
        eyebrow="Collection"
        title={`${shelf.emoji ?? '📚'} ${shelf.name}`}
        subtitle={plural(books.length, 'livre')}
        actions={
          <>
            <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)} aria-label="Ajouter des livres">
              <span className="hidden sm:inline">Ajouter des livres</span>
            </Button>
            <Menu
              items={[
                { label: 'Renommer / icône', icon: <Pencil />, onSelect: () => setEditing(true) },
                {
                  label: 'Supprimer la collection',
                  icon: <Trash2 />,
                  danger: true,
                  onSelect: async () => {
                    if (await confirm({ title: 'Supprimer cette collection ?', message: 'Les livres restent dans votre bibliothèque.', danger: true, confirmLabel: 'Supprimer' })) {
                      useLibrary.getState().deleteShelf(shelf.id);
                      toast.success('Collection supprimée');
                      navigate('/collections', { replace: true });
                    }
                  },
                },
              ]}
              trigger={(p) => (
                <IconButton label="Options de la collection" variant="soft" {...p}>
                  <MoreHorizontal className="size-[18px]" />
                </IconButton>
              )}
            />
          </>
        }
      />
      <PageBody>
        <BookCollection
          books={books}
          storageKey={`shelf-${shelf.id}`}
          groupable
          sorts={['added', 'title', 'author', 'rating', 'progress']}
          defaultSort="title"
          showStatus
          empty={
            <EmptyState
              icon={<FolderHeart className="size-7" />}
              title="Collection vide"
              description="Ajoutez des livres de votre bibliothèque à cette collection."
              action={
                <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
                  Ajouter des livres
                </Button>
              }
            />
          }
        />
      </PageBody>
      <AddBooksSheet shelf={shelf} open={adding} onClose={() => setAdding(false)} />
      <Sheet open={editing} onClose={() => setEditing(false)} title="Modifier la collection" size="sm">
        {editing && <ShelfForm shelf={shelf} onDone={() => setEditing(false)} />}
      </Sheet>
    </>
  );
}
