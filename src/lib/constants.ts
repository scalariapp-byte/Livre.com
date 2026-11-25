import type { Accent, ReadingStatus } from '@/types';

export const STATUS_META: Record<ReadingStatus, { label: string; short: string; tone: string }> = {
  reading: { label: 'En cours', short: 'En cours', tone: 'accent' },
  toread: { label: 'À lire', short: 'À lire', tone: 'blue' },
  wishlist: { label: 'Liste de souhaits', short: 'Souhait', tone: 'violet' },
  finished: { label: 'Terminé', short: 'Lu', tone: 'green' },
  abandoned: { label: 'Abandonné', short: 'Abandonné', tone: 'neutral' },
};

export const STATUS_ORDER: ReadingStatus[] = ['reading', 'toread', 'wishlist', 'finished', 'abandoned'];

export const GENRES = [
  'Roman',
  'Classique',
  'Science-fiction',
  'Fantasy',
  'Policier',
  'Thriller',
  'Romance',
  'Horreur',
  'Biographie',
  'Histoire',
  'Essai',
  'Philosophie',
  'Psychologie',
  'Développement personnel',
  'Business',
  'Sciences',
  'Poésie',
  'Théâtre',
  'BD & Manga',
  'Jeunesse',
  'Voyage',
  'Cuisine',
  'Art',
  'Autre',
];

/** Correspondance des catégories renvoyées par les API (anglais) vers nos genres. */
const GENRE_MAP: [RegExp, string][] = [
  [/science fiction|sci-fi|dystop/i, 'Science-fiction'],
  [/fantasy|magic/i, 'Fantasy'],
  [/mystery|detective|crime|policier/i, 'Policier'],
  [/thriller|suspense/i, 'Thriller'],
  [/romance|love/i, 'Romance'],
  [/horror|horreur/i, 'Horreur'],
  [/biograph|autobiograph|memoir/i, 'Biographie'],
  [/history|histoire/i, 'Histoire'],
  [/philosoph/i, 'Philosophie'],
  [/psycholog/i, 'Psychologie'],
  [/self-help|personal development|développement/i, 'Développement personnel'],
  [/business|economics|management|finance/i, 'Business'],
  [/science|mathemat|physics|biology|nature|technology|computers/i, 'Sciences'],
  [/poetry|poésie/i, 'Poésie'],
  [/drama|théâtre/i, 'Théâtre'],
  [/comics|graphic novel|manga|bande/i, 'BD & Manga'],
  [/juvenile|children|young adult|jeunesse/i, 'Jeunesse'],
  [/travel|voyage/i, 'Voyage'],
  [/cooking|cuisine/i, 'Cuisine'],
  [/art|music|photography|design/i, 'Art'],
  [/classic/i, 'Classique'],
  [/essay|social science|political|religion/i, 'Essai'],
  [/fiction|roman|novel|literary/i, 'Roman'],
];

export function mapGenre(categories?: string[] | string): string | undefined {
  const list = Array.isArray(categories) ? categories : categories ? [categories] : [];
  for (const cat of list) {
    for (const [re, g] of GENRE_MAP) if (re.test(cat)) return g;
  }
  return undefined;
}

export const ACCENTS: Record<Accent, { label: string; rgb: string; rgbDark: string; contrast: string }> = {
  terracotta: { label: 'Terracotta', rgb: '201 92 58', rgbDark: '232 128 94', contrast: '255 255 255' },
  ink: { label: 'Encre', rgb: '67 72 196', rgbDark: '139 146 255', contrast: '255 255 255' },
  sage: { label: 'Sauge', rgb: '61 125 98', rgbDark: '112 190 152', contrast: '255 255 255' },
  plum: { label: 'Prune', rgb: '140 64 128', rgbDark: '214 132 200', contrast: '255 255 255' },
  ocean: { label: 'Océan', rgb: '22 115 160', rgbDark: '96 186 230', contrast: '255 255 255' },
  amber: { label: 'Ambre', rgb: '176 116 18', rgbDark: '236 178 72', contrast: '255 255 255' },
};

/** Palette catégorielle pour les graphiques (validée pour fond clair et sombre). */
export const CHART_COLORS = ['#C95C3A', '#4348C4', '#3D7D62', '#B07412', '#8C4080', '#1673A0', '#7A6F66'];
