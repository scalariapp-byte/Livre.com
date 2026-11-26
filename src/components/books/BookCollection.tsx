import { AnimatePresence } from 'framer-motion';
import { ArrowDownUp, BookCopy, Check, Hand, Layers, LayoutGrid, Library, List, Search, X } from 'lucide-react';
import { ShelfView } from './ShelfView';
import { SpineView } from './SpineView';
import { useLibrary } from '@/store/useLibrary';
import { toast } from '@/components/ui/Toast';
import { STATUS_META, STATUS_ORDER } from '@/lib/constants';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Book } from '@/types';
import { BookRow, BookTile } from './BookCard';
import { Chips } from '@/components/ui/Segmented';
import { Input } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { IconButton } from '@/components/ui/Button';
import { cn, normalize } from '@/lib/utils';

/** Rayons proposés en mode rangement, même vides, pour y déposer des livres. */
const MAIN_GENRES = ['Romance', 'Policier', 'Thriller', 'Fantasy', 'Science-fiction', 'Roman', 'Horreur', 'Jeunesse', 'BD & Manga', 'Développement personnel'];

export type GroupKey = 'none' | 'genre' | 'author' | 'series' | 'shelf' | 'status';

const GROUP_LABELS: Record<GroupKey, string> = {
  none: 'Sans regroupement',
  genre: 'Par thème (genre)',
  author: 'Par auteur',
  series: 'Par série',
  shelf: 'Par collection',
  status: 'Par statut',
};

export type SortKey = 'manual' | 'added' | 'title' | 'author' | 'rating' | 'progress' | 'finished' | 'priority' | 'pages';

const SORT_LABELS: Record<SortKey, string> = {
  manual: 'Mon rangement',
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
  manual: (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || b.addedAt.localeCompare(a.addedAt),
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
  groupBy?: (b: Book) => string | string[];
  /** Affiche le menu « Classer par » (thème, auteur, série…). */
  groupable?: boolean;
  renderMeta?: (b: Book) => ReactNode;
  renderTrailing?: (b: Book) => ReactNode;
  showStatus?: boolean;
}

export function BookCollection({ books, storageKey, sorts: sortsProp, defaultSort, empty, toolbarExtra, groupBy, groupable, renderMeta, renderTrailing, showStatus }: Props) {
  const sorts: SortKey[] = sortsProp.includes('manual') ? sortsProp : ['manual', ...sortsProp];
  const [arranging, setArranging] = useState(false);
  const setOrder = useLibrary((s) => s.setOrder);
  const patchBook = useLibrary((s) => s.patchBook);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useStoredState<SortKey>(`livre-sort-${storageKey}`, defaultSort);
  const [view, setView] = useStoredState<'grid' | 'list' | 'shelf' | 'spines'>(`livre-view2-${storageKey}`, groupable ? 'spines' : 'grid');
  const [group, setGroup] = useStoredState<GroupKey>(`livre-group2-${storageKey}`, groupable ? 'genre' : 'none');
  const shelves = useLibrary((s) => s.shelves);

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
    const NONE = '\uffff';
    const keyOf: ((b: Book) => string | string[]) | undefined =
      groupBy ??
      (!groupable || group === 'none'
        ? undefined
        : group === 'genre'
          ? (b) => b.genre || NONE + 'Sans genre'
          : group === 'author'
            ? (b) => b.authors[0] || NONE + 'Auteur inconnu'
            : group === 'series'
              ? (b) => b.series || NONE + 'Hors série'
              : group === 'shelf'
                ? (b) => {
                    const names = shelves.filter((sh) => b.shelfIds?.includes(sh.id)).map((sh) => `${sh.emoji ?? '📚'} ${sh.name}`);
                    return names.length ? names : NONE + 'Hors collection';
                  }
                : (b) => String(STATUS_ORDER.indexOf(b.status)));
    if (!keyOf) return [{ key: '', items: filtered }];
    const map = new Map<string, Book[]>();
    for (const b of filtered) {
      const k = keyOf(b);
      for (const key of Array.isArray(k) ? k : [k]) map.set(key, [...(map.get(key) ?? []), b]);
    }
    let entries = [...map.entries()];
    if (!groupBy) {
      if (group === 'genre') entries.sort((a, b) => (a[0].startsWith(NONE) ? 1 : b[0].startsWith(NONE) ? -1 : b[1].length - a[1].length || a[0].localeCompare(b[0], 'fr')));
      else if (group === 'status') entries.sort((a, b) => Number(a[0]) - Number(b[0]));
      else entries.sort((a, b) => a[0].localeCompare(b[0], 'fr', { sensitivity: 'base' }));
      if (group === 'series') entries = entries.map(([k, items]) => [k, k.startsWith(NONE) ? items : [...items].sort((x, y) => (x.seriesIndex ?? 999) - (y.seriesIndex ?? 999))]);
    }
    return entries.map(([key, items]) => ({
      key: key.startsWith(NONE) ? key.slice(1) : !groupBy && group === 'status' ? STATUS_META[STATUS_ORDER[Number(key)]].label : key,
      items,
    }));
  }, [filtered, groupBy, groupable, group, shelves]);

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
        {view === 'spines' && (
          <IconButton
            label={arranging ? 'Terminer le rangement' : 'Ranger mes livres'}
            variant={arranging ? 'primary' : 'outline'}
            onClick={() => {
              if (!arranging && sort !== 'manual') {
                // On part de l'ordre affiché pour que rien ne bouge au passage en mode rangement.
                setOrder(groups.flatMap((g) => g.items.map((b) => b.id)));
                setSort('manual');
              }
              setArranging((a) => !a);
            }}
          >
            <Hand className="size-[18px]" />
          </IconButton>
        )}
        {groupable && (
          <Menu
            items={(Object.keys(GROUP_LABELS) as GroupKey[]).map((g) => ({ label: GROUP_LABELS[g], icon: g === group ? <Check /> : <span className="inline-block size-4" />, active: g === group, onSelect: () => setGroup(g) }))}
            trigger={(p) => (
              <IconButton label={`Classer : ${GROUP_LABELS[group]}`} variant="outline" {...p} className={cn(group !== 'none' && 'border-accent/40 text-accent')}>
                <Layers className="size-[18px]" />
              </IconButton>
            )}
          />
        )}
        <Menu
          items={sorts.map((s) => ({ label: SORT_LABELS[s], icon: s === sort ? <Check /> : <span className="inline-block size-4" />, active: s === sort, onSelect: () => setSort(s) }))}
          trigger={(p) => (
            <IconButton label={`Trier : ${SORT_LABELS[sort]}`} variant="outline" {...p}>
              <ArrowDownUp className="size-[18px]" />
            </IconButton>
          )}
        />
<Menu
          items={[
            { label: 'Grille', icon: <LayoutGrid />, active: view === 'grid', onSelect: () => setView('grid') },
            { label: 'Étagère : tranches', icon: <BookCopy />, active: view === 'spines', onSelect: () => setView('spines') },
            { label: 'Étagère : couvertures', icon: <Library />, active: view === 'shelf', onSelect: () => setView('shelf') },
            { label: 'Liste', icon: <List />, active: view === 'list', onSelect: () => setView('list') },
          ]}
          trigger={(p) => (
            <IconButton label="Affichage" variant="outline" {...p}>
              {view === 'grid' ? <LayoutGrid className="size-[18px]" /> : view === 'shelf' ? <Library className="size-[18px]" /> : view === 'spines' ? <BookCopy className="size-[18px]" /> : <List className="size-[18px]" />}
            </IconButton>
          )}
        />
      </div>

      {genres.length > 1 && (
        <div className="mb-5">
          <Chips value={genre} onChange={setGenre} options={[{ value: 'all', label: 'Tous', count: books.length }, ...genres.map(([g, c]) => ({ value: g, label: g, count: c }))]} />
        </div>
      )}

      {arranging && view === 'spines' && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-accent/10 p-3 text-sm text-ink-2">
          <Hand className="size-5 shrink-0 text-accent" />
          <p className="flex-1">
            {groupable && group === 'genre'
              ? 'Faites glisser les tranches pour les ranger. Déposez un livre dans un autre rayon (Romance, Policier…) pour changer son genre.'
              : 'Faites glisser les tranches pour ranger vos livres comme vous voulez. Chaque livre reste dans son rayon.'}
          </p>
          <button type="button" onClick={() => setArranging(false)} className="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink">
            Terminé
          </button>
        </div>
      )}

      <p className="mb-3 text-[13px] text-muted">
        {filtered.length} livre{filtered.length > 1 ? 's' : ''}
        {groupable && group !== 'none' ? ` · ${GROUP_LABELS[group].toLowerCase()}` : ''} · trié par {SORT_LABELS[sorts.includes(sort) ? sort : defaultSort].toLowerCase()}
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
        view === 'spines' && groups.length > 0 && groups[0].key !== '' ? (
          <SpineView
            sections={
              arranging && groupable && group === 'genre'
                ? [...groups, ...MAIN_GENRES.filter((g) => !groups.some((x) => x.key === g)).map((g) => ({ key: g, items: [] as Book[] }))]
                : groups
            }
            editable={arranging}
            onReorder={setOrder}
            crossSection={groupable && group === 'genre'}
            onSectionChange={(id, key) => {
              patchBook(id, { genre: key === 'Sans genre' ? undefined : key, genreChecked: true, genreManual: true });
              toast.success(key === 'Sans genre' ? 'Genre retiré' : `Rangé dans « ${key} »`);
            }}
          />
        ) : (
        groups.map((g) => (
          <section key={g.key} className={cn(g.key && 'mb-8')}>
            {g.key && (
              <h3 className="h-display mb-3 flex items-baseline gap-2 text-xl font-semibold">
                {g.key} <span className="font-sans text-sm font-medium text-muted">{g.items.length}</span>
              </h3>
            )}
            {view === 'spines' ? (
              <SpineView books={g.items} editable={arranging} onReorder={setOrder} />
            ) : view === 'shelf' ? (
              <ShelfView books={g.items} />
            ) : view === 'grid' ? (
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
        )
      )}
    </div>
  );
}
