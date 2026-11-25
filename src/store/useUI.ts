import { create } from 'zustand';
import type { ReadingStatus } from '@/types';

interface UIState {
  addBook: { open: boolean; status?: ReadingStatus };
  editBookId: string | null;
  progressBookId: string | null;
  searchOpen: boolean;
  notificationsOpen: boolean;
  timerFinishOpen: boolean;
  openAddBook: (status?: ReadingStatus) => void;
  closeAddBook: () => void;
  setEditBook: (id: string | null) => void;
  setProgressBook: (id: string | null) => void;
  setSearch: (open: boolean) => void;
  setNotifications: (open: boolean) => void;
  setTimerFinish: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  addBook: { open: false },
  editBookId: null,
  progressBookId: null,
  searchOpen: false,
  notificationsOpen: false,
  timerFinishOpen: false,
  openAddBook: (status) => set({ addBook: { open: true, status } }),
  closeAddBook: () => set((s) => ({ addBook: { ...s.addBook, open: false } })),
  setEditBook: (id) => set({ editBookId: id }),
  setProgressBook: (id) => set({ progressBookId: id }),
  setSearch: (open) => set({ searchOpen: open }),
  setNotifications: (open) => set({ notificationsOpen: open }),
  setTimerFinish: (open) => set({ timerFinishOpen: open }),
}));
