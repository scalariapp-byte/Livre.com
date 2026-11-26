import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { cn, hashString } from '@/lib/utils';
import { shade, spineInk } from '@/lib/spineColor';

/** Couleur de repli tant que la vraie couleur n'est pas connue (stable pour un titre). */
const FALLBACK = ['#2B3A55', '#5C3D2E', '#1F4E4A', '#6B2D3C', '#2E2A4F', '#3D4A2A', '#7A4A1E', '#203A43', '#8C4A5A', '#4A5D7A'];

/** Toutes les tranches ont la même taille, comme une collection bien rangée. */
const SPINE_W = 30;
const SHELF_H = 120;
const GAP = 3;
const ROW_GAP = 22;

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
  /** Autorise le déplacement d'un livre vers un autre rayon (ex. changer son genre). */
  crossSection?: boolean;
  onSectionChange?: (bookId: string, section: string) => void;
}


/** Bibliothèque virtuelle : les tranches des livres, aux couleurs de leurs couvertures. */
export function SpineView({ books, sections, editable, onReorder, crossSection, onSectionChange }: Props) {
  const navigate = useNavigate();

  const incoming: Section[] = sections ? sections.map((s) => ({ key: s.key, ids: s.items.map((b) => b.id) })) : [{ key: '', ids: (books ?? []).map((b) => b.id) }];
  const byId = new Map((sections ? sections.flatMap((s) => s.items) : books ?? []).map((b) => [b.id, b]));
  const [local, setLocal] = useState<Section[]>(incoming);
  const [dragId, setDragId] = useState<string | null>(null);
  const originSection = useRef<string | null>(null);
  const incomingKey = incoming.map((s) => s.key + ':' + s.ids.join(',')).join('|');

  // Resynchronise avec les données, sauf pendant un déplacement.
  useEffect(() => {
    if (!dragId) setLocal(incoming);
  }, [incomingKey]); // eslint-disable-line react-hooks/exhaustive-deps



  // ---- Déplacement au doigt (mode rangement) ----
  // Le suivi se fait sur toute la fenêtre : quand la tranche change de place dans le DOM,
  // le navigateur perd la « capture » du pointeur, qui ne doit donc pas dépendre d'elle.
  const localRef = useRef(local);
  localRef.current = local;
  const cbRef = useRef({ onReorder, onSectionChange, crossSection });
  cbRef.current = { onReorder, onSectionChange, crossSection };

  useEffect(() => {
    if (!dragId) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      const els = document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[];
      const spine = els.map((el) => el.closest<HTMLElement>('[data-spine-id]')).find((el) => el && el.dataset.spineId !== dragId);
      const label = els.map((el) => el.closest<HTMLElement>('[data-section-label]')).find(Boolean);
      const targetId = spine?.dataset.spineId;
      const labelKey = label?.dataset.sectionLabel;
      if (!targetId && labelKey === undefined) return;
      setLocal((prev) => {
        const from = prev.find((s) => s.ids.includes(dragId));
        const to = targetId ? prev.find((s) => s.ids.includes(targetId)) : prev.find((s) => s.key === labelKey);
        if (!from || !to) return prev;
        if (from !== to && !cbRef.current.crossSection) return prev; // chaque livre reste dans son rayon
        if (!targetId && from === to) return prev;
        const without = prev.map((s) => (s === from ? { ...s, ids: s.ids.filter((x) => x !== dragId) } : s));
        return without.map((s) => {
          if (s.key !== to.key) return s;
          const ids = [...s.ids];
          const at = targetId ? to.ids.filter((x) => x !== dragId).indexOf(targetId) : ids.length;
          ids.splice(Math.max(0, at), 0, dragId);
          return { ...s, ids };
        });
      });
    };
    const up = () => {
      const id = dragId;
      setDragId(null);
      const now = localRef.current.find((s) => s.ids.includes(id))?.key;
      if (now !== undefined && now !== originSection.current) cbRef.current.onSectionChange?.(id, now);
      cbRef.current.onReorder?.(localRef.current.flatMap((s) => s.ids));
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragId]);

  const onPointerDown = (e: RPointerEvent<HTMLButtonElement>, id: string) => {
    if (!editable) return;
    e.preventDefault();
    originSection.current = local.find((s) => s.ids.includes(id))?.key ?? null;
    setDragId(id);
    navigator.vibrate?.(15);
  };

  const renderSpine = (b: Book) => {
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
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: dragging ? -18 : 0, scale: dragging ? 1.06 : 1 }}
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
                      whileHover={editable ? undefined : { y: -10 }}
                      aria-label={`${b.title}${b.authors[0] ? `, ${b.authors[0]}` : ''}`}
                      title={b.title}
                      className={cn(
                        'relative flex shrink-0 flex-col items-center justify-between overflow-hidden rounded-[3px] py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        editable && 'cursor-grab touch-none select-none',
                        dragging && 'z-10 cursor-grabbing ring-2 ring-white/80',
                      )}
                      style={{
                        width: SPINE_W,
                        height: SHELF_H,
                        color: ink,
                        background: `linear-gradient(90deg, ${shade(bg, -0.35)} 0%, ${shade(bg, 0.12)} 18%, ${bg} 45%, ${shade(bg, -0.08)} 80%, ${shade(bg, -0.4)} 100%)`,
                        boxShadow: dragging ? '0 12px 24px rgba(0,0,0,0.6)' : '1px 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <span className="block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      <span
                        className="h-display min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-1.5 font-semibold leading-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: b.title.length > 20 ? 9.5 : 11 }}
                      >
                        {b.title}
                      </span>
                      <span className="mt-1 block h-[3px] w-full opacity-40" style={{ background: ink }} />
                      {b.status === 'reading' && <span className="absolute left-0 top-0 h-full w-[3px] bg-accent" title="En cours" />}
                      {b.favorite && <span className="absolute right-0 top-1.5 text-[7px]">❤️</span>}
                      {editable && !dragging && <span className="absolute inset-x-0 top-1/2 mx-auto h-6 w-1 -translate-y-1/2 rounded-full bg-white/0" />}
                    </motion.button>
    );
  };

  const shelfStyle = {
    columnGap: GAP,
    rowGap: ROW_GAP,
    paddingBottom: 16,
    minHeight: SHELF_H + 16,
    // Une planche sous chaque rangée (les rangées ont toutes la même hauteur).
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${SHELF_H}px, #a87449 ${SHELF_H}px, #7a4f2f ${SHELF_H + 14}px, rgba(0,0,0,0.45) ${SHELF_H + 14}px, transparent ${SHELF_H + 20}px, transparent ${SHELF_H + ROW_GAP}px)`,
    marginInline: -8,
    paddingInline: 12,
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-[#5b3b26] to-[#4a2f1e] p-2 shadow-lift sm:p-3">
      <div className="rounded-2xl bg-gradient-to-b from-[#3a2518] to-[#2b1b11] px-2 pt-2 shadow-[inset_0_8px_24px_rgba(0,0,0,0.45)] sm:px-4">
        {local.map((sec) => {
          const list = sec.ids.map((id) => byId.get(id)).filter(Boolean) as Book[];
          return (
            <section key={sec.key || 'all'} data-section-label={sections ? sec.key : undefined} aria-label={sections ? `Rayon ${sec.key}` : undefined}>
              {sections && (
                // Plaque du rayon, au-dessus de l'étagère
                <div className="mb-2 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#7a5a2a] bg-gradient-to-b from-[#e8cf98] via-[#d4b06b] to-[#b48a47] px-3 py-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.5)]">
                    <span className="h-display text-[13px] font-bold tracking-wide text-[#3b2a14]">{sec.key}</span>
                    <span className="rounded bg-[#3b2a14]/15 px-1 text-[10px] font-bold tabular-nums text-[#3b2a14]">{list.length}</span>
                  </span>
                </div>
              )}
              <div className="relative flex flex-wrap items-end" style={shelfStyle}>
                {list.map(renderSpine)}
                {list.length === 0 && editable && (
                  <span className="absolute inset-x-0 top-1/3 text-center text-xs font-medium text-white/50">Déposez un livre ici</span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
