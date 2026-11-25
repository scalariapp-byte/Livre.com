import { AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Check, LayoutGrid, List, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Book } from '@/types';
import { BookRow, BookTile } from './BookCard';
import { Chips } from '@/components/ui/Segmented';
import { Input } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { IconButton } from '@/components/ui/Button';
import { cn, normalize } from '@/lib/utils';

export type SortKey = 'added' | 'title' | 'author' | 'rating' | 'progress' | 'finished' | 'priority' | 'pages';

const SORT_LABELS: Record<SortKey, string> = {
  added: "Date d'ajout",
  title: 'Titre',
  author: 'Auteur',
  rating: 'Note',
  progress: 'Progression',
  finished: 'Date de lecture',
  priority: 'Priorité',
  pages: 'Nombre de pages',
};

const sorters: Record<SortKey, (a: Book, b: Book) => number> = {
  added: (a, b) => b.addedAt.localeCompare(a.addedAt),
  title: (a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }),
  author: (a, b) => (a.authors[0] ?? '~').localeCompare(b.authors[0] ?? '~', 'fr', { sensitivity: 'base' }),
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  progress: (a, b) => (b.pageCount ? b.currentPage / b.pageCount : 0) - (a.pageCount ? a.currentPage / a.pageCount : 0),
  finished: (a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''),
  priority: (a, b) => (a.priority ?? 9) - (b.priority ?? 9) || b.addedAt.localeCompare(a.addedAt),
  pages: (a, b) => b.pageCount - a.pageCount,
};

function useStoredState<T extends string>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, v);
    } catch {
      /* ignore */
    }
  }, [key, v]);
  return [v, setV] as const;
}

interface Props {
  books: Book[];
  storageKey: string;
  sorts: SortKey[];
  defaultSort: SortKey;
  empty: ReactNode;
  toolbarExtra?: ReactNode;
  groupBy?: (b: Book) => string;
  renderMeta?: (b: Book) => ReactNode;
  renderTrailing?: (b: Book) => ReactNode;
  showStatus?: boolean;
}

export function BookCollection({ books, storageKey, sorts, defaultSort, empty, toolbarExtra, groupBy, renderMeta, renderTrailing, showStatus }: Props) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useStoredState<SortKey>(`livre-sort-${storageKey}`, defaultSort);
  const [view, setView] = useStoredState<'grid' | 'list'>(`livre-view-${storageKey}`, 'grid');

  const genres = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of books) if (b.genre) map.set(b.genre, (map.get(b.genre) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [books]);

  useEffect(() => {
    if (genre !== 'all' && !genres.some(([g]) => g === genre)) setGenre('all');
  }, [genres, genre]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const activeSort = sorts.includes(sort) ? sort : defaultSort;
    return books
      .filter((b) => genre === 'all' || b.genre === genre)
      .filter((b) => !q || normalize([b.title, b.subtitle, b.authors.join(' '), b.genre, b.isbn, b.publisher].filter(Boolean).join(' ')).includes(q))
      .sort(sorters[activeSort]);
  }, [books, query, genre, sort, sorts, defaultSort]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '', items: filtered }];
    const map = new Map<string, Book[]>();
    for (const b of filtered) {
      const k = groupBy(b);
      map.set(k, [...(map.get(k) ?? []), b]);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  if (!books.length) return <>{empty}</>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Input leading={<Search className="size-[18px]" />} placeholder="Filtrer par titre, auteur…" value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
          {query && (
            <button type="button" aria-label="Effacer" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-2">
              <X className="size-4" />
            </button>
          )}
        </div>
        {toolbarExtra}
        <Menu
          items={sorts.map((s) => ({ label: SORT_LABELS[s], icon: s === sort ? <Check /> : <span className="inline-block size-4" />, active: s === sort, onSelect: () => setSort(s) }))}
          trigger={(p) => (
            <IconButton label={`Trier : ${SORT_LABELS[sort]}`} variant="outline" {...p}>
              <ArrowDownUp className="size-[18px]" />
            </IconButton>
          )}
        />
        <IconButton label={view === 'grid' ? 'Affichage liste' : 'Affichage grille'} variant="outline" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
          {view === 'grid' ? <List className="size-[18px]" /> : <LayoutGrid className="size-[18px]" />}
        </IconButton>
      </div>

      {genres.length > 1 && (
        <div className="mb-5">
          <Chips value={genre} onChange={setGenre} options={[{ value: 'all', label: 'Tous', count: books.length }, ...genres.map(([g, c]) => ({ value: g, label: g, count: c }))]} />
        </div>
      )}

      <p className="mb-3 text-[13px] text-muted">
        {filtered.length} livre{filtered.length > 1 ? 's' : ''} · trié par {SORT_LABELS[sorts.includes(sort) ? sort : defaultSort].toLowerCase()}
      </p>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold">Aucun livre ne correspond</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-accent"
            onClick={() => {
              setQuery('');
              setGenre('all');
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className={cn(g.key && 'mb-8')}>
            {g.key && (
              <h3 className="h-display mb-3 flex items-baseline gap-2 text-xl font-semibold">
                {g.key} <span className="font-sans text-sm font-medium text-muted">{g.items.length}</span>
              </h3>
            )}
            {view === 'grid' ? (
              <div className="grid grid-cols-3 gap-x-3.5 gap-y-6 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                <AnimatePresence mode="popLayout">
                  {g.items.map((b) => (
                    <BookTile key={b.id} book={b} showStatus={showStatus} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="card -mx-1 p-1.5 sm:mx-0">
                <AnimatePresence mode="popLayout">
                  {g.items.map((b) => (
                    <BookRow key={b.id} book={b} meta={renderMeta?.(b)} trailing={renderTrailing?.(b)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
