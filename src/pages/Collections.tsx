import { BookCheck, BookmarkPlus, ExternalLink, Gift, Library as LibraryIcon, Plus, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { BookCollection } from '@/components/books/BookCollection';
import { Segmented, Chips } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { EmptyState, Badge } from '@/components/ui/misc';
import { Rating } from '@/components/ui/Rating';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { changeStatus } from '@/lib/bookActions';
import { fmtMonth, fmtShort, relativeDay, isoToDayKey } from '@/lib/dates';
import { formatMinutes, plural } from '@/lib/utils';
import type { ReadingStatus } from '@/types';

const AddButton = ({ status, label = 'Ajouter' }: { status?: ReadingStatus; label?: string }) => {
  const open = useUI((s) => s.openAddBook);
  return (
    <Button icon={<Plus className="size-4" />} onClick={() => open(status)} className="hidden sm:inline-flex">
      {label}
    </Button>
  );
};

type LibFilter = 'all' | 'reading' | 'toread' | 'finished' | 'abandoned';

export function LibraryPage() {
  const books = useLibrary((s) => s.books);
  const openAdd = useUI((s) => s.openAddBook);
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') as LibFilter) || 'all';
  const owned = useMemo(() => books.filter((b) => b.status !== 'wishlist'), [books]);
  const count = (s: ReadingStatus) => owned.filter((b) => b.status === s).length;
  const shown = filter === 'all' ? owned : owned.filter((b) => b.status === filter);
  const pages = owned.reduce((s, b) => s + (b.pageCount || 0), 0);

  return (
    <>
      <PageHeader title="Ma bibliothèque" subtitle={`${plural(owned.length, 'livre')} · ${pages.toLocaleString('fr-FR')} pages`} actions={<AddButton />} />
      <PageBody>
        <div className="scrollbar-none -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented<LibFilter>
            value={filter}
            onChange={(v) => setParams(v === 'all' ? {} : { status: v }, { replace: true })}
            options={[
              { value: 'all', label: 'Tous', count: owned.length },
              { value: 'reading', label: 'En cours', count: count('reading') },
              { value: 'toread', label: 'À lire', count: count('toread') },
              { value: 'finished', label: 'Lus', count: count('finished') },
              { value: 'abandoned', label: 'Abandonnés', count: count('abandoned') },
            ]}
          />
        </div>
        <BookCollection
          books={shown}
          storageKey="library"
          sorts={['added', 'title', 'author', 'rating', 'progress', 'pages']}
          defaultSort="added"
          showStatus={filter === 'all'}
          empty={
            owned.length === 0 ? (
              <EmptyState
                icon={<LibraryIcon className="size-7" />}
                title="Votre bibliothèque est vide"
                description="Ajoutez votre premier livre : recherchez-le par titre ou ISBN, la couverture et les informations sont importées automatiquement."
                action={
                  <Button icon={<Plus className="size-4" />} onClick={() => openAdd()}>
                    Ajouter un livre
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={<LibraryIcon className="size-7" />} title="Rien ici pour l'instant" description="Aucun livre ne porte ce statut." />
            )
          }
        />
      </PageBody>
    </>
  );
}

const PRIORITY = { 1: { label: 'Priorité haute', tone: 'accent' }, 2: { label: 'Moyenne', tone: 'warning' }, 3: { label: 'Basse', tone: 'neutral' } } as const;

export function ToReadPage() {
  const books = useLibrary((s) => s.books);
  const openAdd = useUI((s) => s.openAddBook);
  const list = useMemo(() => books.filter((b) => b.status === 'toread'), [books]);
  const pages = list.reduce((s, b) => s + (b.pageCount || 0), 0);
  return (
    <>
      <PageHeader title="À lire" subtitle={list.length ? `${plural(list.length, 'livre')} dans votre pile · ${pages.toLocaleString('fr-FR')} pages` : 'Votre pile à lire'} actions={<AddButton status="toread" />} />
      <PageBody>
        <BookCollection
          books={list}
          storageKey="toread"
          sorts={['priority', 'added', 'title', 'author', 'pages']}
          defaultSort="priority"
          renderMeta={(b) => (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {b.priority && <Badge tone={PRIORITY[b.priority].tone}>{PRIORITY[b.priority].label}</Badge>}
              <span className="text-2xs text-muted">Ajouté {relativeDay(isoToDayKey(b.addedAt)!).toLowerCase()}</span>
              {b.pageCount > 0 && <span className="text-2xs text-muted">· {b.pageCount} p.</span>}
            </div>
          )}
          renderTrailing={(b) => (
            <Button
              size="sm"
              variant="soft"
              className="hidden sm:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                changeStatus(b.id, 'reading');
              }}
            >
              Commencer
            </Button>
          )}
          empty={
            <EmptyState
              icon={<BookmarkPlus className="size-7" />}
              title="Votre pile à lire est vide"
              description="Gardez une trace des livres que vous voulez découvrir prochainement."
              action={
                <Button icon={<Plus className="size-4" />} onClick={() => openAdd('toread')}>
                  Ajouter un livre à lire
                </Button>
              }
            />
          }
        />
      </PageBody>
    </>
  );
}

export function WishlistPage() {
  const books = useLibrary((s) => s.books);
  const openAdd = useUI((s) => s.openAddBook);
  const list = useMemo(() => books.filter((b) => b.status === 'wishlist'), [books]);
  const total = list.reduce((s, b) => s + (b.price ?? 0), 0);
  return (
    <>
      <PageHeader
        title="Liste de souhaits"
        subtitle={list.length ? `${plural(list.length, 'envie')}${total ? ` · budget ${total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : ''}` : 'Les livres que vous aimeriez acheter ou lire'}
        actions={<AddButton status="wishlist" />}
      />
      <PageBody>
        <BookCollection
          books={list}
          storageKey="wishlist"
          sorts={['priority', 'added', 'title', 'author']}
          defaultSort="priority"
          renderMeta={(b) => (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {b.priority && <Badge tone={PRIORITY[b.priority].tone}>{PRIORITY[b.priority].label}</Badge>}
              {b.price !== undefined && <span className="text-xs font-semibold tabular-nums">{b.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>}
            </div>
          )}
          renderTrailing={(b) => (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {b.purchaseUrl && (
                <a href={b.purchaseUrl} target="_blank" rel="noopener noreferrer" aria-label="Acheter" className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink">
                  <ExternalLink className="size-4" />
                </a>
              )}
              <Button size="sm" variant="soft" className="hidden sm:inline-flex" onClick={() => changeStatus(b.id, 'toread')}>
                Je l'ai !
              </Button>
            </div>
          )}
          empty={
            <EmptyState
              icon={<Gift className="size-7" />}
              title="Aucune envie pour l'instant"
              description="Notez les livres repérés en librairie ou recommandés par vos proches."
              action={
                <Button icon={<Plus className="size-4" />} onClick={() => openAdd('wishlist')}>
                  Ajouter une envie
                </Button>
              }
            />
          }
        />
      </PageBody>
    </>
  );
}

export function FinishedPage() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const finished = useMemo(() => books.filter((b) => b.status === 'finished'), [books]);
  const years = useMemo(() => [...new Set(finished.map((b) => (b.finishedAt ? String(new Date(b.finishedAt).getFullYear()) : '—')))].sort().reverse(), [finished]);
  const [year, setYear] = useState('all');
  const list = year === 'all' ? finished : finished.filter((b) => b.finishedAt && String(new Date(b.finishedAt).getFullYear()) === year);
  const pages = list.reduce((s, b) => s + (b.pageCount || 0), 0);
  const rated = list.filter((b) => b.rating);
  const avg = rated.length ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length : 0;
  const ids = new Set(list.map((b) => b.id));
  const minutes = sessions.filter((s) => ids.has(s.bookId)).reduce((s, x) => s + x.minutes, 0);

  return (
    <>
      <PageHeader title="Livres lus" subtitle="L'historique complet de vos lectures terminées" />
      <PageBody>
        {finished.length > 0 && (
          <>
            {years.length > 1 && (
              <div className="mb-4">
                <Chips value={year} onChange={setYear} options={[{ value: 'all', label: 'Toutes les années' }, ...years.map((y) => ({ value: y, label: y }))]} />
              </div>
            )}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Livres', value: list.length },
                { label: 'Pages', value: pages.toLocaleString('fr-FR') },
                { label: 'Temps', value: minutes ? formatMinutes(minutes) : '—' },
                { label: 'Note moyenne', value: avg ? avg.toFixed(1).replace('.', ',') : '—', icon: avg ? <Star className="size-4 text-warning" fill="currentColor" /> : null },
              ].map((s) => (
                <div key={s.label} className="card p-4">
                  <p className="label">{s.label}</p>
                  <p className="h-display mt-1 flex items-center gap-1.5 text-2xl font-semibold tabular-nums">
                    {s.value}
                    {s.icon}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        <BookCollection
          books={list}
          storageKey="finished"
          sorts={['finished', 'rating', 'title', 'author', 'pages']}
          defaultSort="finished"
          groupBy={(b) => (b.finishedAt ? fmtMonth(b.finishedAt) : 'Date inconnue')}
          renderMeta={(b) => (
            <div className="mt-1.5 flex items-center gap-2">
              {b.rating ? <Rating value={b.rating} size={13} /> : <span className="text-2xs text-muted">Non noté</span>}
              {b.finishedAt && <span className="text-2xs text-muted">· Terminé le {fmtShort(b.finishedAt)}</span>}
            </div>
          )}
          empty={<EmptyState icon={<BookCheck className="size-7" />} title="Aucun livre terminé" description="Quand vous finissez un livre, il rejoint automatiquement cet historique." />}
        />
      </PageBody>
    </>
  );
}
