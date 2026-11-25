import type { LibraryData } from '@/types';
import { diffDays, toDayKey } from './dates';
import { readingStreak, dayTotals } from './stats';

export type AlertKind = 'loan-overdue' | 'loan-due' | 'plan' | 'streak' | 'goal';

export interface AppAlert {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  href: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  /** Mérite une notification système. */
  push: boolean;
}

/** Calcule les alertes pertinentes à partir des données (aucune notification fictive). */
export function computeAlerts(data: Pick<LibraryData, 'loans' | 'plans' | 'sessions' | 'settings'>, now = new Date()): AppAlert[] {
  const today = toDayKey(now);
  const out: AppAlert[] = [];

  for (const l of data.loans) {
    if (l.returnedAt || !l.dueDate) continue;
    const d = diffDays(l.dueDate, today);
    const who = l.direction === 'lent' ? `prêté à ${l.person}` : `emprunté à ${l.person}`;
    if (d < 0) {
      out.push({
        id: `loan-overdue-${l.id}-${l.dueDate}`,
        kind: 'loan-overdue',
        title: l.direction === 'lent' ? 'Prêt en retard' : 'Retour en retard',
        body: `« ${l.title} » ${who} — échéance dépassée de ${-d} jour${-d > 1 ? 's' : ''}.`,
        href: '/loans',
        tone: 'danger',
        push: true,
      });
    } else if (d <= 3) {
      out.push({
        id: `loan-due-${l.id}-${l.dueDate}`,
        kind: 'loan-due',
        title: d === 0 ? "Retour prévu aujourd'hui" : `Retour dans ${d} jour${d > 1 ? 's' : ''}`,
        body: `« ${l.title} » ${who}.`,
        href: '/loans',
        tone: 'warning',
        push: true,
      });
    }
  }

  for (const p of data.plans) {
    if (p.done || p.date !== today) continue;
    out.push({
      id: `plan-${p.id}`,
      kind: 'plan',
      title: `Lecture prévue${p.time ? ` à ${p.time}` : " aujourd'hui"}`,
      body: `${p.title} · ${p.durationMin} min`,
      href: '/calendar',
      tone: 'info',
      push: true,
    });
  }

  const todayTotals = dayTotals(data.sessions, today);
  const streak = readingStreak(data.sessions, today);
  if (streak >= 2 && todayTotals.pages === 0 && todayTotals.minutes === 0 && now.getHours() >= 17) {
    out.push({
      id: `streak-${today}`,
      kind: 'streak',
      title: `Série de ${streak} jours en jeu`,
      body: "Lisez quelques pages aujourd'hui pour la prolonger.",
      href: '/',
      tone: 'warning',
      push: false,
    });
  }
  if (data.settings.dailyPagesGoal > 0 && todayTotals.pages >= data.settings.dailyPagesGoal) {
    out.push({
      id: `goal-${today}`,
      kind: 'goal',
      title: 'Objectif du jour atteint',
      body: `${todayTotals.pages} pages lues aujourd'hui. Bravo !`,
      href: '/stats',
      tone: 'success',
      push: false,
    });
  }
  return out;
}
