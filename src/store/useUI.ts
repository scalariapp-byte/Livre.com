import { create } from 'zustand';
import type { ReadingStatus } from '@/types';

interface UIState {
  addBook: { open: boolean; status?: ReadingStatus; query?: string; series?: { name: string; index: number } };
  editBookId: string | null;
  progressBookId: string | null;
  searchOpen: boolean;
  notificationsOpen: boolean;
  timerFinishOpen: boolean;
  reflectionBookId: string | null;
  shelfPickerBookId: string | null;
  coverPickerBookId: string | null;
  openAddBook: (status?: ReadingStatus, extra?: { query?: string; series?: { name: string; index: number } }) => void;
  closeAddBook: () => void;
  setEditBook: (id: string | null) => void;
  setProgressBook: (id: string | null) => void;
  setSearch: (open: boolean) => void;
  setNotifications: (open: boolean) => void;
  setTimerFinish: (open: boolean) => void;
  setReflection: (id: string | null) => void;
  setShelfPicker: (id: string | null) => void;
  setCoverPicker: (id: string | null) => void;
}

export const useUI = create<UIState>((set) => ({
  addBook: { open: false },
  editBookId: null,
  progressBookId: null,
  searchOpen: false,
  notificationsOpen: false,
  timerFinishOpen: false,
  reflectionBookId: null,
  shelfPickerBookId: null,
  coverPickerBookId: null,
  openAddBook: (status, extra) => set({ addBook: { open: true, status, ...extra } }),
  closeAddBook: () => set((s) => ({ addBook: { ...s.addBook, open: false } })),
  setEditBook: (id) => set({ editBookId: id }),
  setProgressBook: (id) => set({ progressBookId: id }),
  setSearch: (open) => set({ searchOpen: open }),
  setNotifications: (open) => set({ notificationsOpen: open }),
  setTimerFinish: (open) => set({ timerFinishOpen: open }),
  setReflection: (id) => set({ reflectionBookId: id }),
  setShelfPicker: (id) => set({ shelfPickerBookId: id }),
  setCoverPicker: (id) => set({ coverPickerBookId: id }),
}));
