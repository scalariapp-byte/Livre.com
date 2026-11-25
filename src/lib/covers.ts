import type { Book } from '@/types';
import { cleanIsbn } from './bookApi';

/**
 * Variante haute résolution d'une couverture Google Books (paramètre fife),
 * la miniature d'origine restant utilisée en repli si elle ne charge pas.
 */
export function hiResCover(url: string): string {
  if (!/books\.google|googleusercontent/.test(url)) return url;
  if (/[?&]fife=/.test(url)) return url;
  return url.replace(/&?zoom=\d/, '') + '&fife=w800';
}

/** Adresses de repli pour une couverture (miniature Google d'origine, Open Library sans erreur…). */
export function coverFallbacks(url?: string): string[] {
  if (!url) return [];
  const out = [url];
  if (/[?&]fife=/.test(url)) out.push(url.replace(/&?fife=[^&]*/, '') + '&zoom=1');
  return out;
}

interface GVolume {
  volumeInfo: { title?: string; imageLinks?: { thumbnail?: string; smallThumbnail?: string; medium?: string; large?: string } };
}

async function googleCovers(q: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books`, { signal });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const data = (await res.json()) as { items?: GVolume[] };
  return (data.items ?? [])
    .map((v) => v.volumeInfo.imageLinks?.thumbnail ?? v.volumeInfo.imageLinks?.smallThumbnail)
    .filter(Boolean)
    .map((u) => hiResCover(u!.replace(/^http:/, 'https:').replace('&edge=curl', '')));
}

async function openLibraryCovers(params: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`https://openlibrary.org/search.json?${params}&limit=12&fields=cover_i,isbn`, { signal });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as { docs?: { cover_i?: number }[] };
  return (data.docs ?? []).filter((d) => d.cover_i).map((d) => `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`);
}

/**
 * Cherche des couvertures candidates pour un livre : d'abord par ISBN (édition exacte),
 * puis par titre + auteur. Les sources en échec sont ignorées.
 */
export async function findCovers(book: Pick<Book, 'title' | 'authors' | 'isbn'>, signal?: AbortSignal): Promise<string[]> {
  const isbn = book.isbn ? cleanIsbn(book.isbn) : '';
  const title = book.title.trim();
  const author = book.authors[0]?.trim() ?? '';
  const tasks: Promise<string[]>[] = [];
  if (isbn) {
    tasks.push(googleCovers(`isbn:${isbn}`, signal));
    tasks.push(Promise.resolve([`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`]));
  }
  if (title) {
    tasks.push(googleCovers(`intitle:${title}${author ? ` inauthor:${author}` : ''}`, signal));
    tasks.push(openLibraryCovers(`title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}`, signal));
  }
  const results = await Promise.allSettled(tasks);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const urls = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  return [...new Set(urls)];
}

/** Vérifie qu'une image se charge et n'est pas un pixel vide (Open Library renvoie 1×1 sans couverture). */
export function probeImage(url: string, timeout = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(false), timeout);
    img.onload = () => {
      clearTimeout(t);
      resolve(img.naturalWidth > 20 && img.naturalHeight > 20);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}
