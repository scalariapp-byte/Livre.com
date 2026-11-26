import type { Book, ReadingSession, Settings } from '@/types';
import { bestStreak, finishedInYear, totalsByDay } from './stats';

// ---------------------------------------------------------------------------
// Décor du « coin lecture » : un élément débloqué à chaque livre terminé
// ---------------------------------------------------------------------------

export interface DecorItem {
  id: string;
  emoji: string;
  name: string;
  /** Nombre de livres terminés pour le débloquer. */
  unlockAt: number;
  /** Position par défaut dans la scène (% largeur / % hauteur). */
  x: number;
  y: number;
  /** Taille relative (1 = normale). */
  size?: number;
  /** Petite animation au repos. */
  idle?: 'bob' | 'sway' | 'float' | 'twinkle';
}

export const DECOR: DecorItem[] = [
  { id: 'cat', emoji: '🐈', name: 'Un petit chat', unlockAt: 1, x: 30, y: 80, idle: 'bob' },
  { id: 'plant', emoji: '🪴', name: 'Une plante', unlockAt: 2, x: 12, y: 82, idle: 'sway' },
  { id: 'house', emoji: '🏡', name: 'Une petite maison', unlockAt: 3, x: 62, y: 66, size: 2.2 },
  { id: 'tree', emoji: '🌳', name: 'Un arbre', unlockAt: 4, x: 86, y: 64, size: 2, idle: 'sway' },
  { id: 'bench', emoji: '🪑', name: 'Une chaise de lecture', unlockAt: 5, x: 44, y: 84 },
  { id: 'dog', emoji: '🐕', name: 'Un chien', unlockAt: 6, x: 84, y: 93, idle: 'bob' },
  { id: 'sunflower', emoji: '🌻', name: 'Des tournesols', unlockAt: 7, x: 4, y: 74, idle: 'sway' },
  { id: 'coffee', emoji: '☕', name: 'Une tasse de thé', unlockAt: 8, x: 52, y: 90, size: 0.7 },
  { id: 'owl', emoji: '🦉', name: 'Un hibou savant', unlockAt: 9, x: 88, y: 46, idle: 'bob' },
  { id: 'books', emoji: '📚', name: 'Une pile de livres', unlockAt: 10, x: 38, y: 90, size: 0.9 },
  { id: 'butterfly', emoji: '🦋', name: 'Un papillon', unlockAt: 12, x: 22, y: 50, size: 0.7, idle: 'float' },
  { id: 'rabbit', emoji: '🐇', name: 'Un lapin', unlockAt: 14, x: 20, y: 88, idle: 'bob' },
  { id: 'mushroom', emoji: '🍄', name: 'Un champignon', unlockAt: 16, x: 94, y: 88, size: 0.8 },
  { id: 'fox', emoji: '🦊', name: 'Un renard', unlockAt: 18, x: 8, y: 92, idle: 'bob' },
  { id: 'balloon', emoji: '🎈', name: 'Un ballon', unlockAt: 20, x: 46, y: 28, idle: 'float' },
  { id: 'fountain', emoji: '⛲', name: 'Une fontaine', unlockAt: 22, x: 78, y: 76, size: 1.4 },
  { id: 'rainbow', emoji: '🌈', name: 'Un arc-en-ciel', unlockAt: 25, x: 30, y: 22, size: 2.4 },
  { id: 'castle', emoji: '🏰', name: 'Un château', unlockAt: 30, x: 14, y: 52, size: 2 },
  { id: 'dragon', emoji: '🐉', name: 'Un dragon', unlockAt: 40, x: 70, y: 24, size: 1.6, idle: 'float' },
  { id: 'unicorn', emoji: '🦄', name: 'Une licorne', unlockAt: 50, x: 56, y: 82, size: 1.2, idle: 'bob' },
];

export interface SkyDef {
  id: string;
  name: string;
  unlockAt: number;
  gradient: string;
  ground: string;
  stars?: boolean;
  sun?: string;
}

export const SKIES: SkyDef[] = [
  { id: 'day', name: 'Journée', unlockAt: 0, gradient: 'linear-gradient(180deg,#9fd3f7 0%,#d6effc 60%,#f3f9ec 100%)', ground: '#8cc56b', sun: '☀️' },
  { id: 'sunset', name: 'Coucher de soleil', unlockAt: 5, gradient: 'linear-gradient(180deg,#f7a06b 0%,#f9c58a 45%,#fde6c0 100%)', ground: '#9a9a55', sun: '🌅' },
  { id: 'night', name: 'Nuit étoilée', unlockAt: 10, gradient: 'linear-gradient(180deg,#0f1a3b 0%,#283a6e 60%,#45528a 100%)', ground: '#2f5240', stars: true, sun: '🌙' },
  { id: 'snow', name: 'Hiver', unlockAt: 20, gradient: 'linear-gradient(180deg,#c9d8ea 0%,#e8eff7 70%,#ffffff 100%)', ground: '#f4f7fb', sun: '❄️' },
];

export const unlockedDecor = (finished: number) => DECOR.filter((d) => finished >= d.unlockAt);
export const nextDecor = (finished: number) => DECOR.find((d) => finished < d.unlockAt);

// ---------------------------------------------------------------------------
// Badges : objectifs de lecture façon objectifs sportifs
// ---------------------------------------------------------------------------

export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: 'Livres' | 'Pages' | 'Temps' | 'Régularité' | 'Défis';
  target: number;
  /** Mesure actuelle de l'utilisateur pour ce badge. */
  metric: keyof Metrics;
  unit?: string;
}

export interface Metrics {
  books: number;
  pages: number;
  minutes: number;
  streak: number;
  bestDay: number;
  genres: number;
  reflections: number;
  bigBook: number;
  yearGoal: number;
  nightOwl: number;
  earlyBird: number;
  series: number;
}

export const BADGES: BadgeDef[] = [
  { id: 'books-1', emoji: '📖', name: 'Premier chapitre', description: 'Terminer un premier livre', category: 'Livres', target: 1, metric: 'books', unit: 'livre' },
  { id: 'books-5', emoji: '📚', name: 'Lecteur assidu', description: 'Terminer 5 livres', category: 'Livres', target: 5, metric: 'books', unit: 'livres' },
  { id: 'books-10', emoji: '🐭', name: 'Rat de bibliothèque', description: 'Terminer 10 livres', category: 'Livres', target: 10, metric: 'books', unit: 'livres' },
  { id: 'books-25', emoji: '🏛️', name: 'Bibliophile', description: 'Terminer 25 livres', category: 'Livres', target: 25, metric: 'books', unit: 'livres' },
  { id: 'books-50', emoji: '🦖', name: 'Dévoreur de livres', description: 'Terminer 50 livres', category: 'Livres', target: 50, metric: 'books', unit: 'livres' },
  { id: 'books-100', emoji: '👑', name: 'Légende', description: 'Terminer 100 livres', category: 'Livres', target: 100, metric: 'books', unit: 'livres' },
  { id: 'pages-100', emoji: '👟', name: 'Échauffement', description: 'Lire 100 pages', category: 'Pages', target: 100, metric: 'pages', unit: 'pages' },
  { id: 'pages-1000', emoji: '🏃', name: 'Mille pages', description: 'Lire 1 000 pages', category: 'Pages', target: 1000, metric: 'pages', unit: 'pages' },
  { id: 'pages-5000', emoji: '🏅', name: 'Marathonien', description: 'Lire 5 000 pages', category: 'Pages', target: 5000, metric: 'pages', unit: 'pages' },
  { id: 'pages-10000', emoji: '🚀', name: 'Ultra-lecteur', description: 'Lire 10 000 pages', category: 'Pages', target: 10000, metric: 'pages', unit: 'pages' },
  { id: 'time-60', emoji: '⏱️', name: 'Première heure', description: '1 heure de lecture chronométrée', category: 'Temps', target: 60, metric: 'minutes', unit: 'min' },
  { id: 'time-600', emoji: '⌛', name: 'Dix heures', description: '10 heures de lecture', category: 'Temps', target: 600, metric: 'minutes', unit: 'min' },
  { id: 'time-3000', emoji: '🕰️', name: 'Cinquante heures', description: '50 heures de lecture', category: 'Temps', target: 3000, metric: 'minutes', unit: 'min' },
  { id: 'time-6000', emoji: '💎', name: 'Cent heures', description: '100 heures de lecture', category: 'Temps', target: 6000, metric: 'minutes', unit: 'min' },
  { id: 'streak-3', emoji: '🔥', name: 'En rythme', description: 'Lire 3 jours de suite', category: 'Régularité', target: 3, metric: 'streak', unit: 'jours' },
  { id: 'streak-7', emoji: '📅', name: 'Semaine parfaite', description: 'Lire 7 jours de suite', category: 'Régularité', target: 7, metric: 'streak', unit: 'jours' },
  { id: 'streak-30', emoji: '🌙', name: 'Un mois de lecture', description: 'Lire 30 jours de suite', category: 'Régularité', target: 30, metric: 'streak', unit: 'jours' },
  { id: 'streak-100', emoji: '⚡', name: 'Inarrêtable', description: 'Lire 100 jours de suite', category: 'Régularité', target: 100, metric: 'streak', unit: 'jours' },
  { id: 'bigday', emoji: '☀️', name: 'Grande journée', description: 'Lire 100 pages en une journée', category: 'Défis', target: 100, metric: 'bestDay', unit: 'pages' },
  { id: 'bigbook', emoji: '🧱', name: 'Le pavé', description: 'Terminer un livre de 500 pages ou plus', category: 'Défis', target: 500, metric: 'bigBook', unit: 'pages' },
  { id: 'genres-5', emoji: '🧭', name: 'Explorateur', description: 'Terminer des livres de 5 genres différents', category: 'Défis', target: 5, metric: 'genres', unit: 'genres' },
  { id: 'series-1', emoji: '🧩', name: 'Saga complète', description: 'Lire tous les tomes possédés d’une série (2 tomes ou plus)', category: 'Défis', target: 1, metric: 'series', unit: 'série' },
  { id: 'reflections-5', emoji: '✍️', name: 'Critique littéraire', description: 'Faire 5 bilans de lecture', category: 'Défis', target: 5, metric: 'reflections', unit: 'bilans' },
  { id: 'goal', emoji: '🎯', name: 'Objectif atteint', description: 'Atteindre son objectif annuel de livres', category: 'Défis', target: 1, metric: 'yearGoal' },
  { id: 'night', emoji: '🦉', name: 'Oiseau de nuit', description: 'Lire après 22 h', category: 'Défis', target: 1, metric: 'nightOwl' },
  { id: 'early', emoji: '🐓', name: 'Lève-tôt', description: 'Lire avant 7 h', category: 'Défis', target: 1, metric: 'earlyBird' },
];

export function computeMetrics(books: Book[], sessions: ReadingSession[], settings: Settings, now = new Date()): Metrics {
  const finished = books.filter((b) => b.status === 'finished');
  const days = totalsByDay(sessions);
  let bestDay = 0;
  for (const t of days.values()) bestDay = Math.max(bestDay, t.pages);
  const hours = sessions.filter((s) => s.pagesRead > 0 || s.minutes > 0).map((s) => new Date(s.createdAt).getHours());
  const series = new Map<string, Book[]>();
  for (const b of books) if (b.series) series.set(b.series, [...(series.get(b.series) ?? []), b]);
  const completeSeries = [...series.values()].filter((l) => l.length >= 2 && l.every((b) => b.status === 'finished')).length;
  return {
    books: finished.length,
    pages: sessions.reduce((a, s) => a + s.pagesRead, 0),
    minutes: sessions.reduce((a, s) => a + s.minutes, 0),
    streak: bestStreak(sessions),
    bestDay,
    genres: new Set(finished.map((b) => b.genre).filter(Boolean)).size,
    reflections: books.filter((b) => b.reflection).length,
    bigBook: Math.max(0, ...finished.map((b) => b.pageCount || 0)),
    yearGoal: settings.yearlyGoal > 0 && finishedInYear(books, now.getFullYear()).length >= settings.yearlyGoal ? 1 : 0,
    nightOwl: hours.some((h) => h >= 22 || h < 4) ? 1 : 0,
    earlyBird: hours.some((h) => h >= 4 && h < 7) ? 1 : 0,
    series: completeSeries,
  };
}

export interface BadgeState extends BadgeDef {
  value: number;
  progress: number;
  earned: boolean;
}

export function badgeStates(m: Metrics): BadgeState[] {
  return BADGES.map((b) => {
    const value = m[b.metric];
    return { ...b, value, progress: Math.min(100, Math.round((value / b.target) * 100)), earned: value >= b.target };
  });
}
