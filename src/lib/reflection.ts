import type { Book, Ending, Pace, Recommend } from '@/types';

export const MOODS = [
  { id: 'captivated', label: 'Captivé', emoji: '🤩' },
  { id: 'moved', label: 'Ému', emoji: '🥹' },
  { id: 'inspired', label: 'Inspiré', emoji: '✨' },
  { id: 'amused', label: 'Amusé', emoji: '😄' },
  { id: 'surprised', label: 'Surpris', emoji: '😮' },
  { id: 'thoughtful', label: 'Pensif', emoji: '🤔' },
  { id: 'overwhelmed', label: 'Bouleversé', emoji: '😭' },
  { id: 'tense', label: 'Tenu en haleine', emoji: '😬' },
  { id: 'comforted', label: 'Réconforté', emoji: '🫶' },
  { id: 'informed', label: 'Instruit', emoji: '🧠' },
  { id: 'bored', label: 'Ennuyé', emoji: '🥱' },
  { id: 'disappointed', label: 'Déçu', emoji: '😕' },
] as const;

export const ENDINGS: { id: Ending; label: string }[] = [
  { id: 'loved', label: 'J’ai adoré' },
  { id: 'mixed', label: 'Mitigé' },
  { id: 'disliked', label: 'Décevante' },
];

export const PACES: { id: Pace; label: string }[] = [
  { id: 'slow', label: 'Lent' },
  { id: 'balanced', label: 'Équilibré' },
  { id: 'fast', label: 'Haletant' },
];

export const RECOMMENDS: { id: Recommend; label: string }[] = [
  { id: 'yes', label: 'Oui, à tout le monde' },
  { id: 'maybe', label: 'À certains' },
  { id: 'no', label: 'Non' },
];

export interface Question {
  id: string;
  label: string;
  placeholder: string;
}

const NON_FICTION = ['Essai', 'Philosophie', 'Psychologie', 'Développement personnel', 'Business', 'Sciences', 'Histoire', 'Biographie', 'Cuisine', 'Voyage', 'Art'];

export const isNonFiction = (b: Pick<Book, 'genre'>) => !!b.genre && NON_FICTION.includes(b.genre);

/** Questions sur le livre, adaptées au type d'ouvrage (fiction ou documentaire). */
export function questionsFor(b: Pick<Book, 'genre'>): Question[] {
  if (isNonFiction(b))
    return [
      { id: 'learned', label: 'Qu’avez-vous appris de plus marquant ?', placeholder: 'Une idée, un fait, une notion…' },
      { id: 'apply', label: 'Qu’allez-vous mettre en pratique ou retenir ?', placeholder: 'Une habitude, une méthode…' },
      { id: 'disagree', label: 'Y a-t-il un point sur lequel vous n’êtes pas d’accord ?', placeholder: 'Un argument qui ne vous a pas convaincu…' },
      { id: 'quote', label: 'Un passage ou une citation à garder ?', placeholder: '« … »' },
    ];
  return [
    { id: 'favorite', label: 'Qu’avez-vous préféré dans ce livre ?', placeholder: 'L’intrigue, l’univers, le style…' },
    { id: 'character', label: 'Quel personnage vous a le plus marqué, et pourquoi ?', placeholder: 'Son nom, ce qu’il vous a fait ressentir…' },
    { id: 'scene', label: 'Une scène ou un moment inoubliable ?', placeholder: 'Sans divulgâcher si vous le partagez !' },
    { id: 'quote', label: 'Un passage ou une citation à garder ?', placeholder: '« … »' },
  ];
}

export const moodLabel = (id: string) => MOODS.find((m) => m.id === id);
