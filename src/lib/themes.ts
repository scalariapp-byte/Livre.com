import type { ThemeMode } from '@/types';

export interface ThemeDef {
  id: Exclude<ThemeMode, 'system'>;
  label: string;
  dark: boolean;
  /** Couleurs d'aperçu (fond, surface, texte) pour le sélecteur. */
  preview: [string, string, string];
  /** Couleur de la barre système du téléphone. */
  bar: string;
}

/** Les palettes sont définies dans index.css (classes .theme-<id>). */
export const THEMES: ThemeDef[] = [
  { id: 'light', label: 'Papier', dark: false, preview: ['#F8F6F2', '#FFFFFF', '#1A1715'], bar: '#F8F6F2' },
  { id: 'sepia', label: 'Sépia', dark: false, preview: ['#F4ECDC', '#FBF6EC', '#3B2C1E'], bar: '#F4ECDC' },
  { id: 'rose', label: 'Rose poudré', dark: false, preview: ['#FAF3F4', '#FFFFFF', '#2B1B20'], bar: '#FAF3F4' },
  { id: 'mint', label: 'Menthe', dark: false, preview: ['#F2F7F4', '#FFFFFF', '#16241E'], bar: '#F2F7F4' },
  { id: 'dark', label: 'Nuit', dark: true, preview: ['#100F0E', '#1A1917', '#F4F1EC'], bar: '#100F0E' },
  { id: 'midnight', label: 'Bleu nuit', dark: true, preview: ['#0D111C', '#151B2A', '#E8ECF5'], bar: '#0D111C' },
  { id: 'forest', label: 'Forêt', dark: true, preview: ['#0E1411', '#161F1A', '#E9F1EC'], bar: '#0E1411' },
  { id: 'amoled', label: 'Noir absolu', dark: true, preview: ['#000000', '#0C0C0C', '#F5F5F5'], bar: '#000000' },
];

export const DARK_THEMES = THEMES.filter((t) => t.dark).map((t) => t.id);

/** Thème effectivement appliqué (le mode « système » suit le réglage du téléphone). */
export function resolveTheme(mode: ThemeMode, systemDark: boolean): ThemeDef {
  const id = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
