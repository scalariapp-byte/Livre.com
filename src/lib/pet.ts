import type { Book, ReadingSession } from '@/types';
import { dayTotals, readingStreak } from './stats';
import { diffDays, toDayKey } from './dates';

export interface Species {
  id: string;
  emoji: string;
  name: string;
  sound: string;
}

export const SPECIES: Species[] = [
  { id: 'cat', emoji: '🐈', name: 'Chat', sound: 'Miaou' },
  { id: 'dog', emoji: '🐕', name: 'Chien', sound: 'Ouaf' },
  { id: 'rabbit', emoji: '🐇', name: 'Lapin', sound: 'Snif snif' },
  { id: 'fox', emoji: '🦊', name: 'Renard', sound: 'Yip' },
  { id: 'panda', emoji: '🐼', name: 'Panda', sound: 'Mmmh' },
  { id: 'owl', emoji: '🦉', name: 'Hibou', sound: 'Hou hou' },
  { id: 'hamster', emoji: '🐹', name: 'Hamster', sound: 'Couic' },
  { id: 'turtle', emoji: '🐢', name: 'Tortue', sound: '…' },
];

export const speciesOf = (id?: string) => SPECIES.find((s) => s.id === id) ?? SPECIES[0];

export interface Accessory {
  id: string;
  emoji: string;
  name: string;
  slot: 'head' | 'side';
  level: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: 'book', emoji: '📖', name: 'Un livre', slot: 'side', level: 1 },
  { id: 'bow', emoji: '🎀', name: 'Un nœud', slot: 'head', level: 2 },
  { id: 'flower', emoji: '🌸', name: 'Une fleur', slot: 'head', level: 3 },
  { id: 'tea', emoji: '☕', name: 'Une tasse de thé', slot: 'side', level: 4 },
  { id: 'hat', emoji: '🎩', name: 'Un chapeau', slot: 'head', level: 5 },
  { id: 'yarn', emoji: '🧶', name: 'Une pelote', slot: 'side', level: 6 },
  { id: 'cap', emoji: '🎓', name: 'Une toque de diplômé', slot: 'head', level: 7 },
  { id: 'lamp', emoji: '🕯️', name: 'Une bougie', slot: 'side', level: 8 },
  { id: 'crown', emoji: '👑', name: 'Une couronne', slot: 'head', level: 10 },
  { id: 'trophy', emoji: '🏆', name: 'Un trophée', slot: 'side', level: 12 },
];

/** Expérience gagnée : 1 par page lue, 50 par livre terminé, 20 par bilan. */
export function petXp(books: Book[], sessions: ReadingSession[]) {
  const pages = sessions.reduce((a, s) => a + s.pagesRead, 0);
  const finished = books.filter((b) => b.status === 'finished').length;
  const reflections = books.filter((b) => b.reflection).length;
  return pages + finished * 50 + reflections * 20;
}

/** Niveau n atteint à 50 × (n − 1)² XP : 0, 50, 200, 450, 800… */
export function levelFor(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const cur = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, into: xp - cur, needed: next - cur, progress: Math.round(((xp - cur) / (next - cur)) * 100) };
}

export function stageFor(level: number) {
  if (level >= 10) return { name: 'Sage', scale: 1.35 };
  if (level >= 6) return { name: 'Adulte', scale: 1.2 };
  if (level >= 3) return { name: 'Junior', scale: 1 };
  return { name: 'Bébé', scale: 0.8 };
}

export type Mood = 'joyful' | 'happy' | 'bored' | 'sleepy' | 'new';

/** Humeur selon la régularité : elle reflète la lecture récente, sans jamais punir. */
export function moodFor(sessions: ReadingSession[], today = toDayKey()): Mood {
  const active = sessions.filter((s) => s.pagesRead > 0 || s.minutes > 0);
  if (!active.length) return 'new';
  const last = active.map((s) => s.date).sort().pop()!;
  const gap = diffDays(today, last);
  if (gap <= 0) return 'joyful';
  if (gap === 1) return 'happy';
  if (gap <= 3) return 'bored';
  return 'sleepy';
}

export const MOOD_META: Record<Mood, { face: string; label: string }> = {
  joyful: { face: '😻', label: 'Ravi' },
  happy: { face: '😊', label: 'Content' },
  bored: { face: '🥱', label: 'Un peu seul' },
  sleepy: { face: '😴', label: 'Endormi' },
  new: { face: '🤗', label: 'Curieux' },
};

/** Ce que dit le compagnon, selon la situation. */
export function petMessage(name: string, sound: string, mood: Mood, ctx: { todayPages: number; goal: number; streak: number }) {
  const s = sound === '…' ? '' : `${sound} ! `;
  if (mood === 'new') return `${s}Je suis ${name}. Lis quelques pages et je grandirai avec toi !`;
  if (ctx.goal > 0 && ctx.todayPages >= ctx.goal) return `${s}${ctx.todayPages} pages aujourd'hui, je suis fier de toi !`;
  if (mood === 'joyful') return ctx.streak >= 3 ? `${s}${ctx.streak} jours de suite, on fait une super équipe !` : `${s}Merci pour la lecture du jour, j'adore les histoires.`;
  if (mood === 'happy') return `${s}On lit un chapitre aujourd'hui ?`;
  if (mood === 'bored') return `${s}Tu me manques… on reprend notre livre ?`;
  return `Zzz… ${name} t'attend pour la prochaine histoire.`;
}

export const PET_TAP_LINES = ['Encore une page !', 'Ronron…', "J'adore quand tu lis.", 'Tu me racontes la suite ?', '❤️', 'Hihi, ça chatouille !', 'On est bien, là.'];

export function petStatus(books: Book[], sessions: ReadingSession[], dailyGoal: number) {
  const xp = petXp(books, sessions);
  const lvl = levelFor(xp);
  return {
    xp,
    ...lvl,
    stage: stageFor(lvl.level),
    mood: moodFor(sessions),
    todayPages: dayTotals(sessions).pages,
    streak: readingStreak(sessions),
    food: dailyGoal > 0 ? Math.min(100, Math.round((dayTotals(sessions).pages / dailyGoal) * 100)) : 0,
  };
}
