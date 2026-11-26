import { useEffect, useRef } from 'react';
import { useLibrary } from '@/store/useLibrary';
import { findCovers, probeImage } from '@/lib/covers';

const PER_RUN = 15;
const DELAY = 1200;

/**
 * Complète en arrière-plan les couvertures manquantes ou cassées avec la vraie couverture
 * trouvée en ligne (ISBN d'abord, puis titre + auteur). Chaque livre n'est traité qu'une fois.
 */
export function AutoCovers() {
  const pending = useLibrary((s) => s.books.filter((b) => !b.coverChecked).length);
  const running = useRef(false);

  useEffect(() => {
    if (!pending || running.current || !navigator.onLine) return;
    running.current = true;
    let cancelled = false;
    (async () => {
      const queue = useLibrary
        .getState()
        .books.filter((b) => !b.coverChecked)
        .slice(0, PER_RUN);
      for (const b of queue) {
        if (cancelled) break;
        try {
          if (b.coverUrl && (await probeImage(b.coverUrl))) {
            useLibrary.getState().patchBook(b.id, { coverChecked: true });
            continue;
          }
          const candidates = await findCovers(b);
          let found: string | undefined;
          for (const url of candidates.slice(0, 5)) {
            if (await probeImage(url)) {
              found = url;
              break;
            }
          }
          const still = useLibrary.getState().books.find((x) => x.id === b.id);
          if (!still) continue;
          // Ne remplace jamais une couverture choisie entre-temps par l'utilisateur.
          if (still.coverUrl !== b.coverUrl) useLibrary.getState().patchBook(b.id, { coverChecked: true });
          else useLibrary.getState().patchBook(b.id, found ? { coverUrl: found, coverChecked: true } : { coverChecked: true });
        } catch {
          break; // hors ligne ou quota : on réessaiera au prochain lancement
        }
        await new Promise((r) => setTimeout(r, DELAY));
      }
      running.current = false;
    })();
    return () => {
      cancelled = true;
      running.current = false;
    };
  }, [pending]);

  return null;
}

/** Calcule en arrière-plan la couleur de tranche de chaque livre à partir de sa couverture. */
export function SpineColors() {
  const pending = useLibrary((s) => s.books.filter((b) => b.coverUrl && b.spineFor !== b.coverUrl).length);
  const running = useRef(false);

  useEffect(() => {
    if (!pending || running.current) return;
    running.current = true;
    let cancelled = false;
    (async () => {
      const { extractSpineColor } = await import('@/lib/spineColor');
      const queue = useLibrary.getState().books.filter((b) => b.coverUrl && b.spineFor !== b.coverUrl);
      for (const b of queue) {
        if (cancelled) break;
        const color = await extractSpineColor(b.coverUrl!);
        // spineFor est renseigné même en cas d'échec pour ne pas réessayer en boucle.
        useLibrary.getState().patchBook(b.id, { spineColor: color ?? undefined, spineFor: b.coverUrl });
      }
      running.current = false;
    })();
    return () => {
      cancelled = true;
      running.current = false;
    };
  }, [pending]);

  return null;
}

/**
 * Trouve le genre des livres qui n'en ont pas : catégories Google Books (ISBN, puis titre + auteur),
 * sinon indices dans le résumé. Chaque livre n'est traité qu'une fois.
 */
export function AutoGenres() {
  const pending = useLibrary((s) => s.books.filter((b) => !b.genre && !b.genreChecked).length);
  const running = useRef(false);

  useEffect(() => {
    if (!pending || running.current || !navigator.onLine) return;
    running.current = true;
    let cancelled = false;
    (async () => {
      const { mapGenre, guessGenreFromText } = await import('@/lib/constants');
      const queue = useLibrary.getState().books.filter((b) => !b.genre && !b.genreChecked).slice(0, 20);
      for (const b of queue) {
        if (cancelled) break;
        let genre: string | undefined;
        try {
          const q = b.isbn ? `isbn:${b.isbn}` : `intitle:${b.title}${b.authors[0] ? ` inauthor:${b.authors[0]}` : ''}`;
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`);
          if (res.ok) {
            const data = (await res.json()) as { items?: { volumeInfo: { categories?: string[]; description?: string } }[] };
            for (const it of data.items ?? []) {
              genre = mapGenre(it.volumeInfo.categories) ?? guessGenreFromText(it.volumeInfo.description);
              if (genre) break;
            }
          }
        } catch {
          /* hors ligne : on se contente des indices locaux */
        }
        genre ??= guessGenreFromText(b.description, b.subtitle, b.series);
        const still = useLibrary.getState().books.find((x) => x.id === b.id);
        if (still && !still.genre) useLibrary.getState().patchBook(b.id, { genre, genreChecked: true });
        await new Promise((r) => setTimeout(r, 900));
      }
      running.current = false;
    })();
    return () => {
      cancelled = true;
      running.current = false;
    };
  }, [pending]);

  return null;
}
