import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatches(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return matches;
}

export function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Re-rend le composant à intervalle régulier (horloge du minuteur, etc.). */
export function useTick(ms: number, enabled = true) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setT((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
}
