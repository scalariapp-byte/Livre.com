import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ActiveTimer,
  Book,
  BookNote,
  LibraryData,
  Loan,
  ReadingPlan,
  ReadingSession,
  ReadingStatus,
  Settings,
} from '@/types';
import { uid } from '@/lib/utils';
import { isoToDayKey, toDayKey } from '@/lib/dates';
import { idbStorage } from './storage';
import type { Backup } from '@/lib/schemas';

export const DATA_VERSION = 1;

export const defaultSettings = (): Settings => ({
  name: '',
  theme: 'system',
  accent: 'terracotta',
  yearlyGoal: 24,
  dailyPagesGoal: 30,
  dailyMinutesGoal: 30,
  notifications: false,
  reduceMotion: false,
  onboarded: false,
  createdAt: new Date().toISOString(),
});

export type NewBook = Partial<Omit<Book, 'id' | 'addedAt' | 'updatedAt' | 'notes'>> & {
  title: string;
  notes?: BookNote[];
};

interface Actions {
  addBook: (input: NewBook) => string;
  updateBook: (id: string, patch: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  restoreBook: (snapshot: DeletedBookSnapshot) => void;
  setStatus: (id: string, status: ReadingStatus) => void;
  setProgress: (id: string, page: number, opts?: { minutes?: number; date?: string }) => void;
  toggleFavorite: (id: string) => void;

  addNote: (bookId: string, text: string, page?: number) => void;
  deleteNote: (bookId: string, noteId: string) => void;

  logSession: (input: { bookId: string; date: string; minutes: number; toPage: number }) => void;
  deleteSession: (id: string) => void;

  addPlan: (input: Omit<ReadingPlan, 'id' | 'createdAt' | 'done'>) => string;
  updatePlan: (id: string, patch: Partial<ReadingPlan>) => void;
  deletePlan: (id: string) => void;

  addLoan: (input: Omit<Loan, 'id' | 'createdAt'>) => string;
  updateLoan: (id: string, patch: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  startTimer: (bookId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  dismissAlert: (id: string) => void;
  markNotified: (ids: string[]) => void;

  importBackup: (backup: Backup, mode: 'replace' | 'merge') => void;
  exportBackup: () => Backup;
  resetAll: () => void;
  loadDemo: (data: Pick<LibraryData, 'books' | 'sessions' | 'plans' | 'loans'>) => void;
}

export interface DeletedBookSnapshot {
  book: Book;
  sessions: ReadingSession[];
  plans: ReadingPlan[];
  loans: Loan[];
}

export type LibraryState = LibraryData & Actions & { hydrated: boolean };

const now = () => new Date().toISOString();

const emptyData = (): LibraryData => ({
  version: DATA_VERSION,
  books: [],
  sessions: [],
  plans: [],
  loans: [],
  settings: defaultSettings(),
  timer: null,
  dismissedAlerts: [],
  notifiedAlerts: [],
});

/** Crée une session pour toute progression positive (source unique des statistiques de pages). */
function progressSession(bookId: string, from: number, to: number, date: string, minutes = 0): ReadingSession | null {
  const pages = Math.max(0, to - from);
  if (pages === 0 && minutes === 0) return null;
  return { id: uid(), bookId, date, minutes: Math.max(0, Math.round(minutes)), pagesRead: pages, createdAt: now() };
}

/** Applique les règles métier liées à un changement de statut. */
function applyStatus(book: Book, status: ReadingStatus): Book {
  const next: Book = { ...book, status, updatedAt: now() };
  if (status === 'reading' && !next.startedAt) next.startedAt = now();
  if (status === 'finished') {
    next.finishedAt = next.finishedAt && book.status === 'finished' ? next.finishedAt : now();
    if (!next.startedAt) next.startedAt = next.finishedAt;
    if (next.pageCount) next.currentPage = next.pageCount;
  } else {
    next.finishedAt = undefined;
  }
  if (status === 'toread' || status === 'wishlist') {
    next.startedAt = undefined;
    next.currentPage = 0;
  }
  return next;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      hydrated: false,

      addBook: (input) => {
        const id = uid();
        const ts = now();
        const status = input.status ?? 'toread';
        let book: Book = {
          authors: [],
          pageCount: 0,
          currentPage: 0,
          favorite: false,
          ...input,
          status,
          notes: input.notes ?? [],
          id,
          addedAt: ts,
          updatedAt: ts,
        };
        if (status === 'reading' && !book.startedAt) book.startedAt = ts;
        if (status === 'finished') {
          book = { ...book, finishedAt: book.finishedAt ?? ts, startedAt: book.startedAt ?? book.finishedAt ?? ts };
          if (book.pageCount) book.currentPage = book.pageCount;
        }
        // Les pages déjà lues d'un livre en cours ajouté à l'app ne sont pas comptées comme lues aujourd'hui.
        // Un livre ajouté comme terminé compte à sa date de fin (statistiques annuelles cohérentes).
        const session =
          status === 'finished' ? progressSession(id, 0, book.currentPage, isoToDayKey(book.finishedAt) ?? toDayKey()) : null;
        set((s) => ({ books: [book, ...s.books], sessions: session ? [...s.sessions, session] : s.sessions }));
        return id;
      },

      updateBook: (id, patch) => {
        const prev = get().books.find((b) => b.id === id);
        if (!prev) return;
        let next: Book = { ...prev, ...patch, updatedAt: now() };
        if (patch.status && patch.status !== prev.status) next = applyStatus({ ...prev, ...patch }, patch.status);
        if (next.pageCount && next.currentPage > next.pageCount) next.currentPage = next.pageCount;
        const session =
          next.currentPage > prev.currentPage && (next.status === 'reading' || next.status === 'finished')
            ? progressSession(id, prev.currentPage, next.currentPage, toDayKey())
            : null;
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? next : b)),
          sessions: session ? [...s.sessions, session] : s.sessions,
          loans: s.loans.map((l) =>
            l.bookId === id ? { ...l, title: next.title, author: next.authors[0], coverUrl: next.coverUrl } : l,
          ),
        }));
      },

      deleteBook: (id) =>
        set((s) => ({
          books: s.books.filter((b) => b.id !== id),
          sessions: s.sessions.filter((x) => x.bookId !== id),
          plans: s.plans.map((p) => (p.bookId === id ? { ...p, bookId: undefined } : p)),
          loans: s.loans.map((l) => (l.bookId === id ? { ...l, bookId: undefined } : l)),
          timer: s.timer?.bookId === id ? null : s.timer,
        })),

      restoreBook: (snap) =>
        set((s) => ({
          books: [snap.book, ...s.books.filter((b) => b.id !== snap.book.id)],
          sessions: [...s.sessions, ...snap.sessions],
          plans: s.plans.map((p) => snap.plans.find((x) => x.id === p.id) ?? p),
          loans: s.loans.map((l) => snap.loans.find((x) => x.id === l.id) ?? l),
        })),

      setStatus: (id, status) => {
        const prev = get().books.find((b) => b.id === id);
        if (!prev || prev.status === status) return;
        const next = applyStatus(prev, status);
        const session = status === 'finished' ? progressSession(id, prev.currentPage, next.currentPage, toDayKey()) : null;
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? next : b)),
          sessions: session ? [...s.sessions, session] : s.sessions,
        }));
      },

      setProgress: (id, page, opts) => {
        const prev = get().books.find((b) => b.id === id);
        if (!prev) return;
        const max = prev.pageCount || Number.MAX_SAFE_INTEGER;
        const target = Math.max(0, Math.min(Math.round(page), max));
        let next: Book = { ...prev, currentPage: target, updatedAt: now() };
        if (prev.status !== 'reading' && prev.status !== 'finished' && target > 0) next = applyStatus(next, 'reading');
        next.currentPage = target;
        if (prev.pageCount && target >= prev.pageCount && next.status !== 'finished') next = applyStatus(next, 'finished');
        else if (next.status === 'finished' && prev.pageCount && target < prev.pageCount) next = applyStatus(next, 'reading');
        next.currentPage = target;
        const session = progressSession(id, prev.currentPage, target, opts?.date ?? toDayKey(), opts?.minutes);
        set((s) => ({
          books: s.books.map((b) => (b.id === id ? next : b)),
          sessions: session ? [...s.sessions, session] : s.sessions,
        }));
      },

      toggleFavorite: (id) =>
        set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, favorite: !b.favorite, updatedAt: now() } : b)) })),

      addNote: (bookId, text, page) =>
        set((s) => ({
          books: s.books.map((b) =>
            b.id === bookId
              ? { ...b, notes: [{ id: uid(), text: text.trim(), page, createdAt: now() }, ...b.notes], updatedAt: now() }
              : b,
          ),
        })),

      deleteNote: (bookId, noteId) =>
        set((s) => ({
          books: s.books.map((b) => (b.id === bookId ? { ...b, notes: b.notes.filter((n) => n.id !== noteId) } : b)),
        })),

      logSession: ({ bookId, date, minutes, toPage }) => get().setProgress(bookId, toPage, { minutes, date }),

      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      addPlan: (input) => {
        const id = uid();
        set((s) => ({ plans: [...s.plans, { ...input, id, done: false, createdAt: now() }] }));
        return id;
      },
      updatePlan: (id, patch) => set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      addLoan: (input) => {
        const id = uid();
        set((s) => ({ loans: [{ ...input, id, createdAt: now() }, ...s.loans] }));
        return id;
      },
      updateLoan: (id, patch) => set((s) => ({ loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLoan: (id) => set((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),

      startTimer: (bookId) => {
        const book = get().books.find((b) => b.id === bookId);
        if (!book) return;
        if (book.status !== 'reading') get().setStatus(bookId, 'reading');
        const timer: ActiveTimer = { bookId, runningSince: Date.now(), elapsedMs: 0, startPage: book.currentPage };
        set({ timer });
      },
      pauseTimer: () => {
        const t = get().timer;
        if (!t || t.runningSince === null) return;
        set({ timer: { ...t, elapsedMs: t.elapsedMs + (Date.now() - t.runningSince), runningSince: null } });
      },
      resumeTimer: () => {
        const t = get().timer;
        if (!t || t.runningSince !== null) return;
        set({ timer: { ...t, runningSince: Date.now() } });
      },
      cancelTimer: () => set({ timer: null }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      dismissAlert: (id) => set((s) => ({ dismissedAlerts: [...new Set([...s.dismissedAlerts, id])] })),
      markNotified: (ids) => set((s) => ({ notifiedAlerts: [...new Set([...s.notifiedAlerts, ...ids])].slice(-500) })),

      exportBackup: () => {
        const { books, sessions, plans, loans, settings } = get();
        return {
          app: 'livre',
          version: DATA_VERSION,
          exportedAt: now(),
          data: { books, sessions, plans, loans, settings },
        };
      },

      importBackup: (backup, mode) => {
        const d = backup.data;
        if (mode === 'replace') {
          set((s) => ({
            books: d.books as Book[],
            sessions: d.sessions,
            plans: d.plans,
            loans: d.loans,
            settings: { ...s.settings, ...d.settings, onboarded: true },
            timer: null,
            dismissedAlerts: [],
          }));
          return;
        }
        const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
          const ids = new Set(a.map((x) => x.id));
          return [...a, ...b.filter((x) => !ids.has(x.id))];
        };
        set((s) => ({
          books: mergeById(s.books, d.books as Book[]),
          sessions: mergeById(s.sessions, d.sessions),
          plans: mergeById(s.plans, d.plans),
          loans: mergeById(s.loans, d.loans),
        }));
      },

      resetAll: () => set({ ...emptyData(), hydrated: true }),

      loadDemo: (data) =>
        set((s) => ({
          books: [...data.books, ...s.books],
          sessions: [...s.sessions, ...data.sessions],
          plans: [...s.plans, ...data.plans],
          loans: [...data.loans, ...s.loans],
        })),
    }),
    {
      name: 'livre-library',
      version: DATA_VERSION,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ hydrated: _h, ...rest }) => {
        const data: Partial<LibraryState> = {};
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') (data as Record<string, unknown>)[k] = v;
        return data as LibraryState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<LibraryData>;
        return { ...current, ...p, settings: { ...defaultSettings(), ...p.settings } };
      },
      onRehydrateStorage: () => () => {
        useLibrary.setState({ hydrated: true });
      },
    },
  ),
);

/** Sélecteurs utilitaires */
export const selectBook = (id?: string) => (s: LibraryState) => s.books.find((b) => b.id === id);
