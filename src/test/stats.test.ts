import { describe, expect, it } from 'vitest';
import { bestStreak, dayTotals, goalPace, monthlySeries, readingSpeed, readingStreak } from '@/lib/stats';
import { addDays, monthGrid, diffDays } from '@/lib/dates';
import type { Book, ReadingSession } from '@/types';

const s = (date: string, pagesRead: number, minutes = 0): ReadingSession => ({ id: date + pagesRead + minutes, bookId: 'b', date, pagesRead, minutes, createdAt: '' });

describe('dates', () => {
  it('additionne les jours en traversant les mois', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-03-01', '2026-02-27')).toBe(2);
  });
  it('génère une grille commençant un lundi', () => {
    const g = monthGrid(new Date(2026, 10, 1)); // novembre 2026 commence un dimanche
    expect(g[0]).toBe('2026-10-26');
    expect(g.length % 7).toBe(0);
  });
});

describe('stats', () => {
  const today = '2026-11-25';
  it('calcule la série en cours, y compris si rien encore aujourd’hui', () => {
    const sessions = [s('2026-11-22', 10), s('2026-11-23', 5), s('2026-11-24', 8)];
    expect(readingStreak(sessions, today)).toBe(3);
    expect(readingStreak([...sessions, s(today, 4)], today)).toBe(4);
    expect(readingStreak([s('2026-11-20', 4)], today)).toBe(0);
  });
  it('calcule la meilleure série', () => {
    expect(bestStreak([s('2026-01-01', 1), s('2026-01-02', 1), s('2026-01-05', 1), s('2026-01-06', 1), s('2026-01-07', 1)])).toBe(3);
  });
  it('agrège les totaux du jour', () => {
    expect(dayTotals([s(today, 10, 20), s(today, 5, 10), s('2026-11-24', 99)], today)).toEqual({ pages: 15, minutes: 30, sessions: 2 });
  });
  it('ignore les sessions non chronométrées pour la vitesse', () => {
    expect(readingSpeed([s(today, 30, 60), s(today, 100, 0)])).toBe(30);
    expect(readingSpeed([s(today, 100, 0)])).toBeNull();
  });
  it('construit la série mensuelle', () => {
    const book = { status: 'finished', finishedAt: '2026-03-10T12:00:00.000Z' } as Book;
    const series = monthlySeries([book], [s('2026-03-02', 40, 30)], 2026);
    expect(series[2]).toMatchObject({ books: 1, pages: 40, minutes: 30 });
    expect(series.reduce((a, p) => a + p.books, 0)).toBe(1);
  });
  it('mesure l’avance sur l’objectif', () => {
    const r = goalPace(12, 24, new Date(2026, 6, 2));
    expect(r.ahead).toBeGreaterThan(-0.5);
    expect(r.ahead).toBeLessThan(0.5);
  });
});

import { isValidIsbn13 } from '@/lib/bookApi';
import { pickIsbn } from '@/lib/scanner';

describe('ISBN', () => {
  it('valide la clé de contrôle EAN-13', () => {
    expect(isValidIsbn13('9780441172719')).toBe(true);
    expect(isValidIsbn13('978-2-07-036002-4')).toBe(true);
    expect(isValidIsbn13('9780441172718')).toBe(false);
    expect(isValidIsbn13('3017620422003')).toBe(false); // EAN alimentaire
  });
  it('choisit l’ISBN parmi plusieurs codes lus', () => {
    expect(pickIsbn(['52499', '9780441172719'])).toBe('9780441172719');
    expect(pickIsbn(['3017620422003'])).toBeNull();
  });
});

import { detectSeries } from '@/lib/series';

describe('séries', () => {
  it('détecte la série et le tome dans les titres courants', () => {
    expect(detectSeries('Seasons Tome 3 : Un printemps pour te succomber')).toEqual({ series: 'Seasons', index: 3 });
    expect(detectSeries('Harry Potter, T. 1')).toEqual({ series: 'Harry Potter', index: 1 });
    expect(detectSeries('Dune (Volume 2)')).toEqual({ series: 'Dune', index: 2 });
    expect(detectSeries('La Passe-miroir', 'Livre 2 - Les disparus du Clairdelune')).toEqual({ series: 'La Passe-miroir', index: 2 });
  });
  it('ne détecte rien dans un titre simple', () => {
    expect(detectSeries('Le Petit Prince')).toBeNull();
    expect(detectSeries('1984')).toBeNull();
  });
});

import { coverFallbacks, hiResCover } from '@/lib/covers';

describe('couvertures', () => {
  it('demande une version haute résolution Google avec repli sur la miniature', () => {
    const thumb = 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&source=gbs_api';
    const hi = hiResCover(thumb);
    expect(hi).toContain('fife=w800');
    expect(hi).not.toContain('zoom=1&');
    expect(coverFallbacks(hi)).toEqual([hi, expect.stringContaining('zoom=1')]);
    expect(hiResCover('https://covers.openlibrary.org/b/id/1-L.jpg')).toBe('https://covers.openlibrary.org/b/id/1-L.jpg');
  });
});

import { badgeStates, computeMetrics, nextDecor, unlockedDecor } from '@/lib/rewards';

describe('récompenses', () => {
  it('débloque un élément de décor à chaque palier de livres terminés', () => {
    expect(unlockedDecor(0)).toHaveLength(0);
    expect(unlockedDecor(1).map((d) => d.id)).toEqual(['cat']);
    expect(unlockedDecor(3).map((d) => d.id)).toEqual(['cat', 'plant', 'house']);
    expect(nextDecor(3)?.id).toBe('tree');
  });
  it('calcule les badges à partir des données', () => {
    const books = [
      { id: 'a', status: 'finished', pageCount: 520, genre: 'Romance', series: 'S', authors: [] },
      { id: 'b', status: 'finished', pageCount: 300, genre: 'Policier', series: 'S', authors: [] },
    ] as never[];
    const sessions = [
      { id: '1', bookId: 'a', date: '2026-01-01', pagesRead: 120, minutes: 70, createdAt: '2026-01-01T23:30:00' },
      { id: '2', bookId: 'a', date: '2026-01-02', pagesRead: 40, minutes: 0, createdAt: '2026-01-02T12:00:00' },
    ] as never[];
    const m = computeMetrics(books, sessions, { yearlyGoal: 0 } as never);
    expect(m).toMatchObject({ books: 2, pages: 160, minutes: 70, streak: 2, bestDay: 120, bigBook: 520, genres: 2, series: 1, nightOwl: 1 });
    const earned = badgeStates(m).filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(expect.arrayContaining(['books-1', 'pages-100', 'time-60', 'bigday', 'bigbook', 'series-1', 'night']));
    expect(earned).not.toContain('books-5');
  });
});

import { detectGenre } from '@/lib/constants';

describe('détection du genre', () => {
  it('préfère un genre précis à « Fiction »', () => {
    expect(detectGenre({ categories: ['Fiction'], description: "Fleuriste fauchée, Nolia doit se marier avec son ex. L'heureux élu : son faux fiancé, milliardaire." })).toBe('Romance');
    expect(detectGenre({ categories: ['Fiction'], subjects: ['Romans, nouvelles', "Roman d'amour"] })).toBe('Romance');
    expect(detectGenre({ categories: ['Fiction / Mystery & Detective / General'] })).toBe('Policier');
    expect(detectGenre({ subjects: ['Roman policier'] })).toBe('Policier');
    expect(detectGenre({ categories: ['Fiction'], description: 'Un commissaire enquête sur un meurtre.' })).toBe('Policier');
    expect(detectGenre({ categories: ['Fiction'] })).toBe('Roman');
    expect(detectGenre({ categories: ['Juvenile Fiction / Fantasy & Magic'] })).toBe('Fantasy');
  });
  it('n’invente pas de genre « Art » dans des mots courants', () => {
    expect(detectGenre({ subjects: ['Heart', 'Party', 'Fiction'] })).toBe('Roman');
  });
});
