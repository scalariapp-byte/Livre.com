/** Toutes les dates « jour » sont manipulées au format local YYYY-MM-DD. */

export function toDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function isoToDayKey(iso?: string): string | undefined {
  if (!iso) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : toDayKey(d);
}

export function addDays(key: string, n: number): string {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + n);
  return toDayKey(d);
}

export function diffDays(a: string, b: string): number {
  const ms = fromDayKey(a).getTime() - fromDayKey(b).getTime();
  return Math.round(ms / 86400000);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const monthShortFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

const asDate = (v: string | Date) => (typeof v === 'string' ? (v.length === 10 ? fromDayKey(v) : new Date(v)) : v);

export const fmtDate = (v: string | Date) => dayFmt.format(asDate(v));
export const fmtShort = (v: string | Date) => shortFmt.format(asDate(v)).replace('.', '');
export const fmtWeekday = (v: string | Date) => {
  const s = weekdayFmt.format(asDate(v));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtMonth = (v: string | Date) => {
  const s = monthFmt.format(asDate(v));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtMonthShort = (v: string | Date) => monthShortFmt.format(asDate(v)).replace('.', '');

export function relativeDay(key: string, today = toDayKey()): string {
  const d = diffDays(key, today);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  if (d === -1) return 'Hier';
  if (d > 1 && d < 7) return `Dans ${d} jours`;
  if (d < -1 && d > -7) return `Il y a ${-d} jours`;
  return fmtShort(key);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Grille de calendrier (semaines commençant le lundi). */
export function monthGrid(month: Date): string[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(toDayKey(d));
  }
  // Retire la dernière semaine si elle est entièrement hors du mois
  const lastWeek = days.slice(35);
  if (lastWeek.every((k) => fromDayKey(k).getMonth() !== month.getMonth())) return days.slice(0, 35);
  return days;
}
