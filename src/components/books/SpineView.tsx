import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { hashString } from '@/lib/utils';
import { shade, spineInk } from '@/lib/spineColor';

/** Couleur de repli tant que la vraie couleur n'est pas connue (stable pour un titre). */
const FALLBACK = ['#2B3A55', '#5C3D2E', '#1F4E4A', '#6B2D3C', '#2E2A4F', '#3D4A2A', '#7A4A1E', '#203A43', '#8C4A5A', '#4A5D7A'];

const spineWidth = (b: Book) => Math.round(Math.min(58, Math.max(24, 18 + (b.pageCount || 300) / 16)));
const spineHeight = (b: Book) => 82 + (hashString(b.id) % 19); // 82 à 100 % de la hauteur

const SHELF_H = 168;
const GAP = 3;

/** Bibliothèque virtuelle : les tranches des livres, aux couleurs de leurs couvertures. */
type Item = { kind: 'book'; book: Book } | { kind: 'label'; label: string; count: number };
const LABEL_W = 30;

export function SpineView({ books, sections }: { books?: Book[]; sections?: { key: string; items: Book[] }[] }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Suite des éléments : un serre-livres étiqueté avant chaque genre, puis ses livres.
  const items: Item[] = sections
    ? sections.flatMap((s) => [{ kind: 'label' as const, label: s.key, count: s.items.length }, ...s.items.map((book) => ({ kind: 'book' as const, book }))])
    : (books ?? []).map((book) => ({ kind: 'book' as const, book }));

  // Répartition en rangées selon la largeur réelle des tranches.
  const rows: Item[][] = [];
  let row: Item[] = [];
  let used = 0;
  items.forEach((it, idx) => {
    let w = (it.kind === 'book' ? spineWidth(it.book) : LABEL_W) + GAP;
    // Une étiquette ne reste pas seule en fin de rangée : elle part avec son premier livre.
    const next = items[idx + 1];
    if (it.kind === 'label' && next?.kind === 'book') w += spineWidth(next.book) + GAP;
    if (row.length && used + w > width - 8) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(it);
    used += (it.kind === 'book' ? spineWidth(it.book) : LABEL_W) + GAP;
  });
  if (row.length) rows.push(row);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-[#5b3b26] to-[#4a2f1e] p-2.5 shadow-lift sm:p-3.5">
      <div ref={ref} className="rounded-2xl bg-gradient-to-b from-[#3a2518] to-[#2b1b11] px-2 pt-3 shadow-[inset_0_8px_24px_rgba(0,0,0,0.45)] sm:px-4">
        {width > 0 &&
          rows.map((r, ri) => (
            <div key={ri} className="mb-4 last:mb-3">
              <div className="flex items-end px-1" style={{ height: SHELF_H, gap: GAP }}>
                {r.map((it, i) => {
                  if (it.kind === 'label')
                    return (
                      <div
                        key={`l-${it.label}`}
                        className="relative flex h-[72%] shrink-0 items-center justify-center rounded-t-md bg-gradient-to-r from-[#b8925a] via-[#e2c58b] to-[#a9824b] shadow-[1px_0_3px_rgba(0,0,0,0.6)]"
                        style={{ width: LABEL_W, marginLeft: i === 0 ? 0 : 6 }}
                        aria-label={`Rayon ${it.label}, ${it.count} livre${it.count > 1 ? 's' : ''}`}
                      >
                        <span
                          className="h-display overflow-hidden text-ellipsis whitespace-nowrap py-1 font-bold leading-none text-[#3b2a14]"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: it.label.length > 16 ? 9 : it.label.length > 11 ? 10 : 11.5, maxHeight: '100%' }}
                        >
                          {it.label} · {it.count}
                        </span>
                      </div>
                    );
                  const b = it.book;
                  const bg = b.spineColor ?? FALLBACK[hashString(b.title) % FALLBACK.length];
                  const ink = spineInk(bg);
                  const w = spineWidth(b);
                  return (
                    <motion.button
                      key={b.id}
                      type="button"
                      onClick={() => navigate(`/book/${b.id}`)}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (ri * 10 + i) * 0.015, type: 'spring', bounce: 0.25 }}
                      whileHover={{ y: -10 }}
                      whileTap={{ y: -16, scale: 1.02 }}
                      aria-label={`${b.title}${b.authors[0] ? `, ${b.authors[0]}` : ''}`}
                      title={b.title}
                      className="relative flex shrink-0 flex-col items-center justify-between overflow-hidden rounded-[3px] py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      style={{
                        width: w,
                        height: `${spineHeight(b)}%`,
                        color: ink,
                        background: `linear-gradient(90deg, ${shade(bg, -0.35)} 0%, ${shade(bg, 0.12)} 18%, ${bg} 45%, ${shade(bg, -0.08)} 80%, ${shade(bg, -0.4)} 100%)`,
                        boxShadow: '1px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      {/* Filets décoratifs */}
                      <span className="block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      <span
                        className="h-display min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-1.5 font-semibold leading-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: w < 30 ? 11 : 13 }}
                      >
                        {b.title}
                      </span>
                      <span className="max-w-full truncate px-0.5 text-[8px] font-semibold uppercase tracking-wide opacity-80">{(b.authors[0] ?? '').split(' ').pop()?.slice(0, 6)}</span>
                      <span className="mt-1 block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      {b.status === 'reading' && <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" title="En cours" />}
                      {b.favorite && <span className="absolute right-0.5 top-1.5 text-[8px]">❤️</span>}
                    </motion.button>
                  );
                })}
              </div>
              <div className="relative -mx-2 h-3.5 rounded-sm bg-gradient-to-b from-[#a87449] to-[#7a4f2f] shadow-[0_6px_10px_rgba(0,0,0,0.5)] sm:-mx-4">
                <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
