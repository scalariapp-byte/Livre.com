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
  [/science[- ]fiction|sci-fi|dystop|space opera|cyberpunk/i, 'Science-fiction'],
  [/romance|love stor|\blove\b|roman d'amour|amour|romantic|new adult|chick lit/i, 'Romance'],
  [/fantasy|fantasie|fantastique|magic|sword and sorcery|dragons?\b|fées?\b/i, 'Fantasy'],
  [/mystery|detective|crime|policier|enquête|polar|noir\b/i, 'Policier'],
  [/thriller|suspense|espionnage/i, 'Thriller'],
  [/horror|horreur|épouvante/i, 'Horreur'],
  [/comics|graphic novel|manga|bandes? dessinées?|\bbd\b/i, 'BD & Manga'],
  [/juvenile|children|young adult|jeunesse|enfants?\b/i, 'Jeunesse'],
  [/biograph|autobiograph|memoir|mémoires/i, 'Biographie'],
  [/\bhistory\b|\bhistoire\b|historique/i, 'Histoire'],
  [/philosoph/i, 'Philosophie'],
  [/psycholog/i, 'Psychologie'],
  [/self-help|personal development|développement personnel|bien-être/i, 'Développement personnel'],
  [/business|economics|management|finance|économie/i, 'Business'],
  [/\bsciences?\b|mathemat|physics|biology|nature|technology|computers/i, 'Sciences'],
  [/poetry|poésie|poèmes/i, 'Poésie'],
  [/drama|théâtre/i, 'Théâtre'],
  [/travel|voyage/i, 'Voyage'],
  [/cooking|cuisine|recettes/i, 'Cuisine'],
  [/\b(art|arts|music|musique|photography|photographie|design)\b/i, 'Art'],
  [/classic|classique/i, 'Classique'],
  [/essay|essai|social science|political|politique|religion/i, 'Essai'],
  [/fiction|roman|novel|literary|littérature/i, 'Roman'],
];

/** Genres trop généraux : on cherche d'abord mieux avant de les retenir. */
export const GENERIC_GENRES = new Set(['Roman', 'Classique']);

/** Devine un genre d'après un texte libre (résumé, collection), en dernier recours. */
const TEXT_HINTS: [RegExp, string][] = [
  [/new romance|dark romance|romantasy|romance|histoire d'amour|tomber amoureu|coup de foudre|faux fiancé|fausse fiancée|mariage arrangé|milliardaire/i, 'Romance'],
  [/enquête|enquêteur|inspecteur|commissaire|meurtre|assassinat|détective|polar|cadavre/i, 'Policier'],
  [/thriller|suspense|psychopathe|tueur en série|haletant/i, 'Thriller'],
  [/dragon|sorcier|sorcière|magie|royaume|elfe|\bfées?\b|prophétie/i, 'Fantasy'],
  [/vaisseau|planète|galaxie|extraterrestre|robot|intelligence artificielle|dystopie/i, 'Science-fiction'],
  [/horreur|épouvante|fantôme|démon|hanté/i, 'Horreur'],
  // Indices plus faibles, seulement si rien d'autre n'a été trouvé
  [/\bamour\b|amoureu|fiancé|séduction|passion/i, 'Romance'],
];

export function guessGenreFromText(...texts: (string | undefined)[]): string | undefined {
  const t = texts.filter(Boolean).join(' ');
  if (!t) return undefined;
  for (const [re, g] of TEXT_HINTS) if (re.test(t)) return g;
  return undefined;
}

/**
 * Genre le plus précis possible à partir de toutes les informations disponibles :
 * 1) un genre précis dans les catégories / sujets, 2) des indices dans l'éditeur,
 * la collection, le titre ou le résumé, 3) en dernier recours un genre général (« Roman »).
 */
export function detectGenre(src: { categories?: string[]; subjects?: string[]; description?: string; title?: string; subtitle?: string; publisher?: string; series?: string }): string | undefined {
  const cats = [...(src.categories ?? []), ...(src.subjects ?? []).slice(0, 50)];
  for (const c of cats) {
    const g = mapGenre(c);
    if (g && !GENERIC_GENRES.has(g)) return g;
  }
  const hint = guessGenreFromText(src.publisher, src.series, src.title, src.subtitle, src.description);
  if (hint) return hint;
  return mapGenre(cats);
}

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
