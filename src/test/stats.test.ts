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
