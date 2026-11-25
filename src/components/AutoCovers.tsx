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
