import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { cn, hashString } from '@/lib/utils';
import { shade, spineInk } from '@/lib/spineColor';

/** Couleur de repli tant que la vraie couleur n'est pas connue (stable pour un titre). */
const FALLBACK = ['#2B3A55', '#5C3D2E', '#1F4E4A', '#6B2D3C', '#2E2A4F', '#3D4A2A', '#7A4A1E', '#203A43', '#8C4A5A', '#4A5D7A'];

/** Toutes les tranches ont la même taille, comme une collection bien rangée. */
const SPINE_W = 42;
const LABEL_W = 30;
const SHELF_H = 168;
const GAP = 3;

interface Section {
  key: string;
  ids: string[];
}

interface Props {
  books?: Book[];
  sections?: { key: string; items: Book[] }[];
  /** Mode rangement : les tranches se déplacent au doigt. */
  editable?: boolean;
  /** Appelé au lâcher avec l'ordre complet des livres affichés. */
  onReorder?: (ids: string[]) => void;
}

type Item = { kind: 'book'; book: Book; section: string } | { kind: 'label'; label: string; count: number };

/** Bibliothèque virtuelle : les tranches des livres, aux couleurs de leurs couvertures. */
export function SpineView({ books, sections, editable, onReorder }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const incoming: Section[] = sections ? sections.map((s) => ({ key: s.key, ids: s.items.map((b) => b.id) })) : [{ key: '', ids: (books ?? []).map((b) => b.id) }];
  const byId = new Map((sections ? sections.flatMap((s) => s.items) : books ?? []).map((b) => [b.id, b]));
  const [local, setLocal] = useState<Section[]>(incoming);
  const [dragId, setDragId] = useState<string | null>(null);
  const incomingKey = incoming.map((s) => s.key + ':' + s.ids.join(',')).join('|');

  // Resynchronise avec les données, sauf pendant un déplacement.
  useEffect(() => {
    if (!dragId) setLocal(incoming);
  }, [incomingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items: Item[] = local.flatMap((s) => [
    ...(sections ? [{ kind: 'label' as const, label: s.key, count: s.ids.length }] : []),
    ...s.ids.map((id) => byId.get(id)).filter(Boolean).map((book) => ({ kind: 'book' as const, book: book!, section: s.key })),
  ]);

  // Répartition en rangées selon la largeur disponible.
  const rows: Item[][] = [];
  let row: Item[] = [];
  let used = 0;
  items.forEach((it, idx) => {
    let w = (it.kind === 'book' ? SPINE_W : LABEL_W) + GAP;
    // Une étiquette ne reste pas seule en fin de rangée : elle part avec son premier livre.
    if (it.kind === 'label' && items[idx + 1]?.kind === 'book') w += SPINE_W + GAP;
    if (row.length && used + w > width - 8) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(it);
    used += (it.kind === 'book' ? SPINE_W : LABEL_W) + GAP;
  });
  if (row.length) rows.push(row);

  // ---- Déplacement au doigt (mode rangement) ----
  const onPointerDown = (e: RPointerEvent<HTMLButtonElement>, id: string) => {
    if (!editable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(id);
    navigator.vibrate?.(15);
  };

  const onPointerMove = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!dragId) return;
    const target = document.elementsFromPoint(e.clientX, e.clientY).map((el) => (el as HTMLElement).closest<HTMLElement>('[data-spine-id]')).find((el) => el && el.dataset.spineId !== dragId);
    const targetId = target?.dataset.spineId;
    if (!targetId) return;
    setLocal((prev) => {
      const sec = prev.find((s) => s.ids.includes(dragId));
      // Les livres restent dans leur rayon (genre, série…).
      if (!sec || !sec.ids.includes(targetId)) return prev;
      const ids = sec.ids.filter((x) => x !== dragId);
      const to = sec.ids.indexOf(targetId);
      ids.splice(to, 0, dragId);
      return prev.map((s) => (s === sec ? { ...s, ids } : s));
    });
  };

  const onPointerUp = () => {
    if (!dragId) return;
    setDragId(null);
    onReorder?.(local.flatMap((s) => s.ids));
  };

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
                  const dragging = dragId === b.id;
                  return (
                    <motion.button
                      key={b.id}
                      layout
                      data-spine-id={b.id}
                      type="button"
                      onClick={() => !editable && navigate(`/book/${b.id}`)}
                      onPointerDown={(e) => onPointerDown(e, b.id)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: dragging ? -18 : 0, scale: dragging ? 1.06 : 1 }}
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
                      whileHover={editable ? undefined : { y: -10 }}
                      aria-label={`${b.title}${b.authors[0] ? `, ${b.authors[0]}` : ''}`}
                      title={b.title}
                      className={cn(
                        'relative flex shrink-0 flex-col items-center justify-between overflow-hidden rounded-[3px] py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        editable && 'cursor-grab touch-none select-none',
                        dragging && 'z-10 cursor-grabbing ring-2 ring-white/80',
                      )}
                      style={{
                        width: SPINE_W,
                        height: '100%',
                        color: ink,
                        background: `linear-gradient(90deg, ${shade(bg, -0.35)} 0%, ${shade(bg, 0.12)} 18%, ${bg} 45%, ${shade(bg, -0.08)} 80%, ${shade(bg, -0.4)} 100%)`,
                        boxShadow: dragging ? '0 12px 24px rgba(0,0,0,0.6)' : '1px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <span className="block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      <span
                        className="h-display min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-1.5 font-semibold leading-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: b.title.length > 28 ? 11.5 : 13.5 }}
                      >
                        {b.title}
                      </span>
                      <span className="max-w-full truncate px-0.5 text-[8px] font-semibold uppercase tracking-wide opacity-80">{(b.authors[0] ?? '').split(' ').pop()?.slice(0, 7)}</span>
                      <span className="mt-1 block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      {b.status === 'reading' && <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" title="En cours" />}
                      {b.favorite && <span className="absolute right-0.5 top-1.5 text-[8px]">❤️</span>}
                      {editable && !dragging && <span className="absolute inset-x-0 top-1/2 mx-auto h-6 w-1 -translate-y-1/2 rounded-full bg-white/0" />}
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
