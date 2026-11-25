export type ReadingStatus = 'reading' | 'toread' | 'wishlist' | 'finished' | 'abandoned';

export interface BookNote {
  id: string;
  text: string;
  page?: number;
  createdAt: string;
}

export type Ending = 'loved' | 'mixed' | 'disliked';
export type Pace = 'slow' | 'balanced' | 'fast';
export type Recommend = 'yes' | 'maybe' | 'no';

/** Bilan rempli après la lecture. */
export interface Reflection {
  moods: string[];
  ending?: Ending;
  pace?: Pace;
  recommend?: Recommend;
  reread?: boolean;
  /** Réponses aux questions sur le livre (identifiant de question → texte). */
  answers: Record<string, string>;
  /** Ressenti général en quelques mots. */
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  genre?: string;
  pageCount: number;
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: string;
  language?: string;
  status: ReadingStatus;
  currentPage: number;
  /** Progression en % pour les livres sans nombre de pages (liseuse, livre audio). */
  percent?: number;
  /** Bilan de lecture. */
  reflection?: Reflection;
  /** Note personnelle de 0 à 5 (demi-points autorisés). */
  rating?: number;
  review?: string;
  notes: BookNote[];
  favorite: boolean;
  /** Priorité pour la liste de souhaits / à lire : 1 haute, 3 basse. */
  priority?: 1 | 2 | 3;
  price?: number;
  purchaseUrl?: string;
  addedAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

/** Session de lecture effectivement réalisée. */
export interface ReadingSession {
  id: string;
  bookId: string;
  /** Jour local au format YYYY-MM-DD. */
  date: string;
  minutes: number;
  pagesRead: number;
  createdAt: string;
}

/** Session de lecture planifiée dans le calendrier. */
export interface ReadingPlan {
  id: string;
  bookId?: string;
  title: string;
  date: string;
  time?: string;
  durationMin: number;
  done: boolean;
  note?: string;
  createdAt: string;
}

export type LoanDirection = 'lent' | 'borrowed';

export interface Loan {
  id: string;
  direction: LoanDirection;
  bookId?: string;
  title: string;
  author?: string;
  coverUrl?: string;
  person: string;
  startDate: string;
  dueDate?: string;
  returnedAt?: string;
  note?: string;
  createdAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type Accent = 'terracotta' | 'ink' | 'sage' | 'plum' | 'ocean' | 'amber';

export interface Settings {
  name: string;
  avatar?: string;
  theme: ThemeMode;
  accent: Accent;
  yearlyGoal: number;
  dailyPagesGoal: number;
  dailyMinutesGoal: number;
  notifications: boolean;
  reduceMotion: boolean;
  onboarded: boolean;
  createdAt: string;
}

export interface ActiveTimer {
  bookId: string;
  /** Timestamp (ms) du dernier démarrage, null si en pause. */
  runningSince: number | null;
  /** Durée cumulée avant le dernier démarrage (ms). */
  elapsedMs: number;
  startPage: number;
}

export interface LibraryData {
  version: number;
  books: Book[];
  sessions: ReadingSession[];
  plans: ReadingPlan[];
  loans: Loan[];
  settings: Settings;
  timer: ActiveTimer | null;
  dismissedAlerts: string[];
  notifiedAlerts: string[];
}
