import { detectGenre } from './constants';
import { hiResCover } from './covers';

export interface BookSearchResult {
  sourceId: string;
  source: 'google' | 'openlibrary';
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  pageCount?: number;
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: string;
  language?: string;
  genre?: string;
}

export class BookApiError extends Error {}

const ISBN_RE = /^(97[89])?\d{9}[\dX]$/i;

export function cleanIsbn(q: string) {
  return q.replace(/[\s-]/g, '').toUpperCase();
}

export function isIsbn(q: string) {
  return ISBN_RE.test(cleanIsbn(q));
}

function stripHtml(s?: string) {
  if (!s) return undefined;
  const doc = new DOMParser().parseFromString(s, 'text/html');
  return doc.body.textContent?.trim() || undefined;
}

const httpsify = (u?: string) => u?.replace(/^http:\/\//, 'https://');

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
    publisher?: string;
    publishedDate?: string;
    language?: string;
  };
}

async function searchGoogle(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const q = isIsbn(query) ? `isbn:${cleanIsbn(query)}` : query;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books&langRestrict=`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new BookApiError(`Google Books a répondu ${res.status}`);
  const data = (await res.json()) as { items?: GoogleVolume[] };
  return (data.items ?? [])
    .filter((v) => v.volumeInfo?.title)
    .map((v) => {
      const i = v.volumeInfo;
      const ids = i.industryIdentifiers ?? [];
      const isbn = ids.find((x) => x.type === 'ISBN_13')?.identifier ?? ids.find((x) => x.type === 'ISBN_10')?.identifier;
      const thumb = httpsify(i.imageLinks?.thumbnail ?? i.imageLinks?.smallThumbnail);
      return {
        sourceId: v.id,
        source: 'google' as const,
        title: i.title!,
        subtitle: i.subtitle,
        authors: i.authors ?? [],
        description: stripHtml(i.description),
        pageCount: i.pageCount || undefined,
        coverUrl: thumb ? hiResCover(thumb.replace('&edge=curl', '')) : undefined,
        isbn,
        publisher: i.publisher,
        publishedYear: i.publishedDate?.slice(0, 4),
        language: i.language,
        genre: detectGenre({ categories: i.categories, description: i.description, title: i.title, subtitle: i.subtitle, publisher: i.publisher }),
      };
    });
}

interface OLDoc {
  key: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  first_publish_year?: number;
  language?: string[];
  subject?: string[];
}

async function searchOpenLibrary(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const param = isIsbn(query) ? `isbn=${cleanIsbn(query)}` : `q=${encodeURIComponent(query)}`;
  const fields = 'key,title,subtitle,author_name,number_of_pages_median,cover_i,isbn,publisher,first_publish_year,language,subject';
  const res = await fetch(`https://openlibrary.org/search.json?${param}&limit=20&fields=${fields}`, { signal });
  if (!res.ok) throw new BookApiError(`Open Library a répondu ${res.status}`);
  const data = (await res.json()) as { docs?: OLDoc[] };
  return (data.docs ?? [])
    .filter((d) => d.title)
    .map((d) => ({
      sourceId: d.key,
      source: 'openlibrary' as const,
      title: d.title!,
      subtitle: d.subtitle,
      authors: d.author_name ?? [],
      pageCount: d.number_of_pages_median,
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : undefined,
      isbn: d.isbn?.find((x) => x.length === 13) ?? d.isbn?.[0],
      publisher: d.publisher?.[0],
      publishedYear: d.first_publish_year ? String(d.first_publish_year) : undefined,
      language: d.language?.[0],
      genre: detectGenre({ subjects: d.subject, title: d.title, subtitle: d.subtitle, publisher: d.publisher?.[0] }),
    }));
}

/** Récupère la description d'une œuvre Open Library (la recherche ne la renvoie pas). */
export async function fetchOpenLibraryDescription(key: string, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(`https://openlibrary.org${key}.json`, { signal });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { description?: string | { value: string } };
    const d = data.description;
    return typeof d === 'string' ? d : d?.value;
  } catch {
    return undefined;
  }
}

/**
 * Recherche un livre : Google Books en priorité, Open Library en repli
 * (quota dépassé, réseau indisponible ou aucun résultat).
 */
export async function searchBooks(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  let googleError: unknown;
  try {
    const results = await searchGoogle(q, signal);
    if (results.length) return results;
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    googleError = e;
  }
  try {
    return await searchOpenLibrary(q, signal);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    if (googleError) throw new BookApiError('Les services de recherche sont injoignables. Vérifiez votre connexion.');
    throw e;
  }
}

/** Vérifie un code EAN-13 de livre (préfixe 978/979 et clé de contrôle). */
export function isValidIsbn13(code: string): boolean {
  const c = cleanIsbn(code);
  if (!/^97[89]\d{10}$/.test(c)) return false;
  const sum = c
    .slice(0, 12)
    .split('')
    .reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(c[12]);
}
