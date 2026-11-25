import { Check, ImageOff, ImagePlus, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/misc';
import { toast } from '@/components/ui/Toast';
import { findCovers, probeImage } from '@/lib/covers';
import { compressImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import type { Book } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  book: Pick<Book, 'title' | 'authors' | 'isbn'> & { coverUrl?: string };
  onPick: (url: string | undefined) => void;
}

/** Choix de la vraie couverture parmi celles trouvées en ligne (ou photo importée). */
export function CoverPicker({ open, onClose, book, onPick }: Props) {
  const [covers, setCovers] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setCovers(null);
    setError(null);
    (async () => {
      try {
        const found = await findCovers(book, ctrl.signal);
        // On ne garde que les images qui se chargent réellement.
        const checks = await Promise.all(found.map(async (u) => ((await probeImage(u)) ? u : null)));
        if (!ctrl.signal.aborted) setCovers(checks.filter(Boolean) as string[]);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Recherche impossible. Vérifiez votre connexion.');
      }
    })();
    return () => ctrl.abort();
  }, [open, book.title, book.isbn, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (url: string | undefined) => {
    onPick(url);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Choisir la couverture" description={book.title} size="lg">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            pick(await compressImage(f));
          } catch (err) {
            toast.error((err as Error).message);
          }
        }}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" icon={<ImagePlus className="size-4" />} onClick={() => fileRef.current?.click()}>
          Prendre / importer une photo
        </Button>
        {book.coverUrl && (
          <Button variant="ghost" size="sm" icon={<ImageOff className="size-4" />} onClick={() => pick(undefined)}>
            Couverture générée
          </Button>
        )}
      </div>
      {error ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="soft" className="mt-3" icon={<RefreshCw className="size-4" />} onClick={() => setNonce((n) => n + 1)}>
            Réessayer
          </Button>
        </div>
      ) : covers === null ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      ) : covers.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Aucune couverture trouvée en ligne pour ce livre. Prenez-la en photo !</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">{covers.length} couverture{covers.length > 1 ? 's' : ''} trouvée{covers.length > 1 ? 's' : ''} · touchez celle de votre édition</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {covers.map((u) => {
              const on = u === book.coverUrl;
              return (
                <button key={u} type="button" onClick={() => pick(u)} className={cn('relative overflow-hidden rounded-lg ring-offset-2 ring-offset-surface transition active:scale-95', on && 'ring-2 ring-accent')}>
                  <img src={u} alt="" referrerPolicy="no-referrer" loading="lazy" className="aspect-[2/3] w-full bg-surface-2 object-cover shadow-cover" />
                  {on && (
                    <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-accent-ink">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Sélecteur global (fiche du livre, menu) qui enregistre directement la couverture choisie. */
export function GlobalCoverPicker() {
  const id = useUI((s) => s.coverPickerBookId);
  const setId = useUI((s) => s.setCoverPicker);
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  if (!book) return null;
  return (
    <CoverPicker
      open={!!book}
      onClose={() => setId(null)}
      book={book}
      onPick={(url) => {
        useLibrary.getState().updateBook(book.id, { coverUrl: url, coverChecked: true });
        toast.success(url ? 'Couverture mise à jour' : 'Couverture générée utilisée');
      }}
    />
  );
}
