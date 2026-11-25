import type { Book, ReadingSession } from '@/types';
import { addDays, isoToDayKey, monthKey, toDayKey } from './dates';

export interface DayTotals {
  pages: number;
  minutes: number;
  sessions: number;
}

export function totalsByDay(sessions: ReadingSession[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  for (const s of sessions) {
    const t = map.get(s.date) ?? { pages: 0, minutes: 0, sessions: 0 };
    t.pages += s.pagesRead;
    t.minutes += s.minutes;
    t.sessions += 1;
    map.set(s.date, t);
  }
  return map;
}

export function dayTotals(sessions: ReadingSession[], day = toDayKey()): DayTotals {
  return totalsByDay(sessions.filter((s) => s.date === day)).get(day) ?? { pages: 0, minutes: 0, sessions: 0 };
}

/** Série consécutive de jours de lecture se terminant aujourd'hui (ou hier si rien aujourd'hui). */
export function readingStreak(sessions: ReadingSession[], today = toDayKey()): number {
  const days = new Set(sessions.filter((s) => s.pagesRead > 0 || s.minutes > 0).map((s) => s.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(sessions: ReadingSession[]): number {
  const days = [...new Set(sessions.filter((s) => s.pagesRead > 0 || s.minutes > 0).map((s) => s.date))].sort();
  let best = 0;
  let run = 0;
  let prev: string | undefined;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function lastNDays(sessions: ReadingSession[], n: number, today = toDayKey()) {
  const map = totalsByDay(sessions);
  const out: { day: string; pages: number; minutes: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const t = map.get(day);
    out.push({ day, pages: t?.pages ?? 0, minutes: t?.minutes ?? 0 });
  }
  return out;
}

export interface MonthPoint {
  key: string;
  date: Date;
  books: number;
  pages: number;
  minutes: number;
}

export function monthlySeries(books: Book[], sessions: ReadingSession[], year: number): MonthPoint[] {
  const points: MonthPoint[] = Array.from({ length: 12 }, (_, m) => {
    const date = new Date(year, m, 1);
    return { key: monthKey(date), date, books: 0, pages: 0, minutes: 0 };
  });
  const idx = new Map(points.map((p, i) => [p.key, i]));
  for (const b of books) {
    if (b.status !== 'finished' || !b.finishedAt) continue;
    const k = isoToDayKey(b.finishedAt)?.slice(0, 7);
    const i = k ? idx.get(k) : undefined;
    if (i !== undefined) points[i].books++;
  }
  for (const s of sessions) {
    const i = idx.get(s.date.slice(0, 7));
    if (i !== undefined) {
      points[i].pages += s.pagesRead;
      points[i].minutes += s.minutes;
    }
  }
  return points;
}

export function finishedInYear(books: Book[], year: number): Book[] {
  return books.filter((b) => b.status === 'finished' && b.finishedAt && new Date(b.finishedAt).getFullYear() === year);
}

export function genreDistribution(books: Book[]): { genre: string; count: number }[] {
  const map = new Map<string, number>();
  for (const b of books) {
    const g = b.genre?.trim() || 'Non classé';
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return [...map.entries()].map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count);
}

export function sumSessions(sessions: ReadingSession[], from?: string, to?: string) {
  let pages = 0;
  let minutes = 0;
  for (const s of sessions) {
    if (from && s.date < from) continue;
    if (to && s.date > to) continue;
    pages += s.pagesRead;
    minutes += s.minutes;
  }
  return { pages, minutes };
}

/** Vitesse de lecture moyenne (pages / heure) calculée uniquement sur les sessions chronométrées. */
export function readingSpeed(sessions: ReadingSession[]): number | null {
  let pages = 0;
  let minutes = 0;
  for (const s of sessions) {
    if (s.minutes > 0 && s.pagesRead > 0) {
      pages += s.pagesRead;
      minutes += s.minutes;
    }
  }
  return minutes >= 5 ? Math.round((pages / minutes) * 60) : null;
}

/** Estimation du temps restant pour finir un livre, d'après la vitesse moyenne. */
export function estimateRemaining(book: Book, speedPagesPerHour: number | null): number | null {
  if (!speedPagesPerHour || !book.pageCount) return null;
  const remaining = Math.max(0, book.pageCount - book.currentPage);
  return Math.round((remaining / speedPagesPerHour) * 60);
}

/** Rythme nécessaire pour atteindre l'objectif annuel. */
export function goalPace(finished: number, goal: number, now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const elapsed = (now.getTime() - start) / (end - start);
  const expected = goal * elapsed;
  return { expected: Math.round(expected * 10) / 10, ahead: finished - expected, elapsed };
}
