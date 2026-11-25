import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BookPlus, Globe, PenLine, ScanBarcode, ScanLine, Search, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { BookCover } from './BookCover';
import { BookForm, type BookDraft } from './BookForm';
import { useUI } from '@/store/useUI';
import { useLibrary, type NewBook } from '@/store/useLibrary';
import { useDebounced } from '@/lib/hooks';
import { cleanIsbn, fetchOpenLibraryDescription, isIsbn, searchBooks, type BookSearchResult } from '@/lib/bookApi';
import { canScanNative, scanIsbnNative } from '@/lib/scanner';
import { WebScanner } from './WebScanner';
import { STATUS_META } from '@/lib/constants';
import { normalize } from '@/lib/utils';
import { promptReflection } from '@/lib/bookActions';
import { detectSeries } from '@/lib/series';

type Mode = 'search' | 'manual';

export function AddBookSheet() {
  const { open, status, query: initialQuery, series: forSeries } = useUI((s) => s.addBook);
  const close = useUI((s) => s.closeAddBook);
  const addBook = useLibrary((s) => s.addBook);
  const books = useLibrary((s) => s.books);
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<BookDraft | null>(null);
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(query, 450);
  const [webScan, setWebScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  /** ISBN issu d'un scan : on ouvre directement la fiche du premier résultat. */
  const scannedRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode('search');
      setQuery(initialQuery ?? '');
      setDraft(null);
      setResults([]);
      setError(null);
      scannedRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'search') return;
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    searchBooks(q, ctrl.signal)
      .then((r) => {
        setResults(r);
        if (scannedRef.current && cleanIsbn(q) === scannedRef.current) {
          scannedRef.current = null;
          if (r.length) pick({ ...r[0], isbn: r[0].isbn ?? cleanIsbn(q) });
        }
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message || 'Recherche impossible');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [debounced, open, mode]);

  const owned = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      if (b.isbn) set.add(b.isbn);
      set.add(normalize(b.title + '|' + (b.authors[0] ?? '')));
    }
    return set;
  }, [books]);

  const isOwned = (r: { isbn?: string; title: string; authors: string[] }) =>
    (r.isbn && owned.has(r.isbn)) || owned.has(normalize(r.title + '|' + (r.authors[0] ?? '')));

  const onScanned = useCallback((isbn: string) => {
    setWebScan(false);
    scannedRef.current = isbn;
    setQuery(isbn);
    toast.success(`ISBN ${isbn} détecté`, { description: 'Recherche du livre…' });
  }, []);

  const startScan = async () => {
    if (!canScanNative()) return setWebScan(true);
    setScanning(true);
    try {
      const isbn = await scanIsbnNative((msg) => toast.info(msg));
      if (isbn) onScanned(isbn);
    } catch (e) {
      toast.error('Scan impossible', { description: (e as Error).message });
    } finally {
      setScanning(false);
    }
  };

  const manualDraft = (): BookDraft => ({
    ...(isIsbn(query) ? { isbn: cleanIsbn(query) } : { title: query }),
    status: status ?? 'toread',
    ...(forSeries ? { series: forSeries.name, seriesIndex: forSeries.index } : {}),
  });

  const pick = async (r: BookSearchResult) => {
    const base: BookDraft = {
      title: r.title,
      subtitle: r.subtitle,
      authors: r.authors,
      description: r.description,
      pageCount: r.pageCount,
      coverUrl: r.coverUrl,
      isbn: r.isbn,
      publisher: r.publisher,
      publishedYear: r.publishedYear,
      genre: r.genre,
      language: r.language,
      status: status ?? 'toread',
      ...(() => {
        if (forSeries) return { series: forSeries.name, seriesIndex: forSeries.index };
        const s = detectSeries(r.title, r.subtitle);
        return s ? { series: s.series, seriesIndex: s.index } : {};
      })(),
    };
    setDraft(base);
    if (r.source === 'openlibrary' && !r.description) {
      const desc = await fetchOpenLibraryDescription(r.sourceId);
      if (desc) setDraft((d) => (d && d.title === r.title && !d.description ? { ...d, description: desc } : d));
    }
  };

  const save = (data: NewBook) => {
    if (isOwned({ isbn: data.isbn, title: data.title, authors: data.authors ?? [] })) {
      toast.info('Ce livre semble déjà être dans votre bibliothèque', { description: 'Il a tout de même été ajouté.' });
    }
    const id = addBook(data);
    close();
    promptReflection(id);
    toast.success(`« ${data.title} » ajouté`, {
      description: STATUS_META[data.status ?? 'toread'].label,
      action: { label: 'Voir', onClick: () => navigate(`/book/${id}`) },
    });
  };

  const title = draft ? (draft.title ? 'Vérifier et ajouter' : 'Nouveau livre') : 'Ajouter un livre';

  return (
    <Sheet open={open} onClose={close} title={title} description={!draft ? 'Recherchez par titre, auteur ou ISBN.' : undefined} size="lg" className="sm:h-[min(760px,88dvh)]">
      <AnimatePresence mode="wait" initial={false}>
        {draft ? (
          <motion.div key="form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }}>
            <button type="button" onClick={() => { setDraft(null); setMode('search'); }} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
              <ArrowLeft className="size-4" /> Retour
            </button>
            <BookForm initial={draft} submitLabel="Ajouter à ma bibliothèque" onSubmit={save} formId="add-book" />
          </motion.div>
        ) : (
          <motion.div key="search" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <Segmented
              value={mode}
              onChange={(m) => {
                setMode(m);
                if (m === 'manual') setDraft({ status: status ?? 'toread', ...(forSeries ? { series: forSeries.name, seriesIndex: forSeries.index } : {}) });
              }}
              options={[
                { value: 'search', label: <span className="flex items-center gap-1.5"><Globe className="size-4" />Rechercher</span> },
                { value: 'manual', label: <span className="flex items-center gap-1.5"><PenLine className="size-4" />Saisie manuelle</span> },
              ]}
              className="mb-4 w-full"
            />
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  leading={<Search className="size-[18px]" />}
                  placeholder="Titre, auteur, ISBN…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                  data-autofocus
                />
              </div>
              <Button variant="soft" className="!h-[46px] shrink-0" icon={<ScanBarcode className="size-5" />} loading={scanning} onClick={startScan} aria-label="Scanner le code-barres">
                <span className="hidden sm:inline">Scanner</span>
              </Button>
            </div>
            {isIsbn(query) && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <ScanLine className="size-3.5" /> Recherche par ISBN
              </p>
            )}

            <div className="mt-4 min-h-[280px]">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3.5 p-2.5">
                      <Skeleton className="h-[72px] w-12 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                    <WifiOff className="size-6" />
                  </div>
                  <p className="font-semibold">Recherche indisponible</p>
                  <p className="mt-1 max-w-xs text-sm text-muted">{error}</p>
                  <Button variant="soft" className="mt-4" icon={<PenLine className="size-4" />} onClick={() => setDraft(manualDraft())}>
                    Saisir manuellement
                  </Button>
                </div>
              ) : results.length ? (
                <ul className="-mx-2.5 space-y-0.5">
                  {results.map((r) => (
                    <li key={r.source + r.sourceId}>
                      <button type="button" onClick={() => pick(r)} className="group flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition hover:bg-surface-2 active:scale-[0.99]">
                        <BookCover title={r.title} author={r.authors[0]} src={r.coverUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{r.title}</p>
                          <p className="truncate text-[13px] text-muted">{r.authors.join(', ') || 'Auteur inconnu'}</p>
                          <p className="mt-0.5 text-2xs text-muted">
                            {[r.publishedYear, r.pageCount && `${r.pageCount} p.`, r.genre].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        {isOwned(r) ? (
                          <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-1 text-2xs font-semibold text-success">Possédé</span>
                        ) : (
                          <BookPlus className="size-5 shrink-0 text-muted transition group-hover:text-accent" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : debounced.trim().length >= 2 ? (
                <div className="py-12 text-center">
                  <p className="font-semibold">Aucun résultat</p>
                  <p className="mt-1 text-sm text-muted">Essayez un autre titre ou ajoutez le livre à la main.</p>
                  <Button variant="soft" className="mt-4" icon={<PenLine className="size-4" />} onClick={() => setDraft(manualDraft())}>
                    Saisir manuellement
                  </Button>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted">
                  <Search className="mx-auto mb-3 size-8 opacity-40" />
                  Les informations et la couverture seront importées automatiquement.
                  <button type="button" onClick={startScan} className="mx-auto mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-line px-5 py-3 font-semibold text-ink-2 transition hover:border-accent hover:text-accent">
                    <ScanBarcode className="size-5" /> Scanner le code-barres du livre
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <WebScanner open={webScan} onClose={() => setWebScan(false)} onResult={onScanned} />
    </Sheet>
  );
}

export function EditBookSheet() {
  const id = useUI((s) => s.editBookId);
  const setEdit = useUI((s) => s.setEditBook);
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  const updateBook = useLibrary((s) => s.updateBook);
  const close = () => setEdit(null);
  return (
    <Sheet open={!!id && !!book} onClose={close} title="Modifier le livre" size="lg">
      {book && (
        <BookForm
          key={book.id}
          initial={book}
          submitLabel="Enregistrer"
          onCancel={close}
          formId="edit-book"
          onSubmit={(data) => {
            updateBook(book.id, data);
            close();
            toast.success('Modifications enregistrées');
            if (book.status !== 'finished') promptReflection(book.id);
          }}
        />
      )}
    </Sheet>
  );
}
