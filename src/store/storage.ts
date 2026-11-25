import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Stockage IndexedDB (pas de limite de 5 Mo comme localStorage, indispensable
 * pour les couvertures importées). Repli sur localStorage si IndexedDB est indisponible
 * (navigation privée de certains navigateurs).
 */
export const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return (await get<string>(name)) ?? null;
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    try {
      await del(name);
    } catch {
      localStorage.removeItem(name);
    }
  },
};
