import { motion, type TargetAndTransition } from 'framer-motion';
import { Lock, Paintbrush, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { confirm } from '@/components/ui/Confirm';
import { useLibrary } from '@/store/useLibrary';
import { BADGES, DECOR, SKIES, badgeStates, computeMetrics, nextDecor, type DecorItem } from '@/lib/rewards';
import { fmtShort } from '@/lib/dates';
import { cn, formatMinutes } from '@/lib/utils';

const IDLE: Record<NonNullable<DecorItem['idle']>, TargetAndTransition> = {
  bob: { y: [0, -4, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  sway: { rotate: [-3, 3, -3], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  float: { y: [0, -10, 0], x: [0, 6, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
  twinkle: { opacity: [1, 0.5, 1], transition: { duration: 2, repeat: Infinity } },
};

/** Scène du coin lecture : les éléments débloqués, déplaçables au doigt en mode décoration. */
function Scene({ editing }: { editing: boolean }) {
  const books = useLibrary((s) => s.books);
  const room = useLibrary((s) => s.room);
  const setPlacement = useLibrary((s) => s.setPlacement);
  const finished = books.filter((b) => b.status === 'finished').length;
  const sky = SKIES.find((s) => s.id === room.sky && finished >= s.unlockAt) ?? SKIES[0];
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [live, setLive] = useState<Record<string, { x: number; y: number }>>({});

  const items = DECOR.filter((d) => finished >= d.unlockAt && !room.placements[d.id]?.hidden);
  const pos = (d: DecorItem) => {
    const p = live[d.id] ?? room.placements[d.id];
    return p && p.x >= 0 ? p : { x: d.x, y: d.y };
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      e.preventDefault();
      const x = Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100 - drag.dx));
      const y = Math.max(8, Math.min(98, ((e.clientY - r.top) / r.height) * 100 - drag.dy));
      setLive((l) => ({ ...l, [drag.id]: { x, y } }));
    };
    const up = () => {
      setLive((l) => {
        const p = l[drag.id];
        if (p) setPlacement(drag.id, p);
        const { [drag.id]: _, ...rest } = l;
        return rest;
      });
      setDrag(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, setPlacement]);

  const onDown = (e: RPointerEvent, d: DecorItem) => {
    if (!editing) return;
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    const p = pos(d);
    setDrag({ id: d.id, dx: ((e.clientX - r.left) / r.width) * 100 - p.x, dy: ((e.clientY - r.top) / r.height) * 100 - p.y });
    navigator.vibrate?.(10);
  };

  const stars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 45, s: 1 + (i % 3) })), []);

  return (
    <div ref={ref} className={cn('relative aspect-[4/3] w-full select-none overflow-hidden rounded-3xl shadow-lift sm:aspect-[16/9]', editing && 'ring-2 ring-accent')} style={{ background: sky.gradient }}>
      {sky.stars &&
        stars.map((s, i) => (
          <motion.span key={i} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2 + (i % 4), repeat: Infinity }} />
        ))}
      {sky.sun && <span className="absolute right-[6%] top-[6%] text-4xl drop-shadow">{sky.sun}</span>}
      {/* Collines et sol */}
      <svg className="absolute inset-x-0 bottom-0 h-[48%] w-full" viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden>
        <path d="M0 70 C 80 30, 160 60, 230 40 S 360 30, 400 55 L400 150 L0 150 Z" fill={sky.ground} opacity="0.55" />
        <path d="M0 95 C 100 70, 220 100, 400 80 L400 150 L0 150 Z" fill={sky.ground} />
      </svg>
      {items.map((d) => {
        const p = pos(d);
        const size = 40 * (d.size ?? 1);
        const dragging = drag?.id === d.id;
        return (
          <motion.div
            key={d.id}
            onPointerDown={(e) => onDown(e, d)}
            className={cn('absolute -translate-x-1/2 -translate-y-full leading-none', editing && 'cursor-grab touch-none')}
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: size, zIndex: Math.round(p.y), filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.25))' }}
            initial={{ scale: 0 }}
            animate={{ scale: dragging ? 1.2 : 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            title={d.name}
          >
            <motion.span className="block" animate={!editing && d.idle ? IDLE[d.idle] : undefined}>
              {d.emoji}
            </motion.span>
          </motion.div>
        );
      })}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-medium text-[#3b2a14] shadow backdrop-blur">
            Termine ton premier livre pour accueillir 🐈 un petit chat dans ton coin lecture !
          </p>
        </div>
      )}
    </div>
  );
}

function DecorTab() {
  const books = useLibrary((s) => s.books);
  const room = useLibrary((s) => s.room);
  const { toggleDecor, setSky, resetRoom } = useLibrary.getState();
  const [editing, setEditing] = useState(false);
  const finished = books.filter((b) => b.status === 'finished').length;
  const upcoming = nextDecor(finished);
  const unlockedCount = DECOR.filter((d) => finished >= d.unlockAt).length;

  return (
    <div className="space-y-5">
      <Scene editing={editing} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={editing ? 'primary' : 'soft'} icon={<Paintbrush className="size-4" />} onClick={() => setEditing((e) => !e)}>
          {editing ? 'Terminé' : 'Décorer'}
        </Button>
        {editing && (
          <Button
            variant="ghost"
            icon={<RotateCcw className="size-4" />}
            onClick={async () => {
              if (await confirm({ title: 'Remettre le décor par défaut ?', confirmLabel: 'Réinitialiser' })) resetRoom();
            }}
          >
            Réinitialiser
          </Button>
        )}
        <p className="ml-auto text-sm text-muted">
          {unlockedCount}/{DECOR.length} éléments
        </p>
      </div>
      {editing && <p className="-mt-2 text-sm text-muted">Fais glisser les éléments dans la scène, et touche-les ci-dessous pour les afficher ou les cacher.</p>}

      {upcoming && (
        <div className="card flex items-center gap-4 p-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-3xl grayscale">{upcoming.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Prochaine récompense : {upcoming.name}</p>
            <p className="text-xs text-muted">
              Encore {upcoming.unlockAt - finished} livre{upcoming.unlockAt - finished > 1 ? 's' : ''} à terminer
            </p>
            <ProgressBar value={(finished / upcoming.unlockAt) * 100} size="sm" className="mt-2" />
          </div>
        </div>
      )}

      <section>
        <h2 className="label mb-2 px-1">Ciel</h2>
        <div className="grid grid-cols-4 gap-2">
          {SKIES.map((s) => {
            const locked = finished < s.unlockAt;
            const on = (room.sky ?? 'day') === s.id;
            return (
              <button
                key={s.id}
                type="button"
                disabled={locked}
                onClick={() => setSky(s.id)}
                className={cn('rounded-2xl border-2 p-1 text-left transition active:scale-95', on ? 'border-accent' : 'border-transparent', locked && 'opacity-50')}
              >
                <div className="relative h-12 rounded-xl" style={{ background: s.gradient }}>
                  {locked ? <Lock className="absolute inset-0 m-auto size-4 text-white drop-shadow" /> : <span className="absolute right-1 top-1 text-xs">{s.sun}</span>}
                </div>
                <p className="mt-1 truncate px-0.5 text-[11px] font-medium">{locked ? `${s.unlockAt} livres` : s.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="label mb-2 px-1">Collection de décor</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {DECOR.map((d) => {
            const locked = finished < d.unlockAt;
            const hidden = room.placements[d.id]?.hidden;
            return (
              <button
                key={d.id}
                type="button"
                disabled={locked}
                onClick={() => toggleDecor(d.id, !hidden)}
                aria-pressed={!locked && !hidden}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition active:scale-95',
                  locked ? 'border-dashed border-line' : hidden ? 'border-line opacity-50' : 'border-accent/40 bg-accent/5',
                )}
              >
                <span className={cn('text-3xl leading-none', locked && 'opacity-30 grayscale')}>{locked ? '❔' : d.emoji}</span>
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ink-2">{locked ? `${d.unlockAt} livre${d.unlockAt > 1 ? 's' : ''}` : d.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function BadgesTab() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const settings = useLibrary((s) => s.settings);
  const owned = useLibrary((s) => s.badges);
  const states = useMemo(() => badgeStates(computeMetrics(books, sessions, settings)), [books, sessions, settings]);
  const earned = states.filter((b) => b.earned).length;
  const categories = [...new Set(BADGES.map((b) => b.category))];

  const fmt = (b: (typeof states)[number], v: number) => (b.metric === 'minutes' ? formatMinutes(v) : `${v.toLocaleString('fr-FR')}${b.unit ? ` ${b.unit}` : ''}`);

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4 p-5">
        <span className="text-5xl">🏆</span>
        <div className="flex-1">
          <p className="h-display text-2xl font-semibold">
            {earned} / {states.length} badges
          </p>
          <ProgressBar value={(earned / states.length) * 100} className="mt-2" />
        </div>
      </div>
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="label mb-2 px-1">{cat}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {states
              .filter((b) => b.category === cat)
              .map((b) => (
                <motion.div key={b.id} layout className={cn('card relative overflow-hidden p-4', b.earned && 'border-warning/40')}>
                  {b.earned && <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-warning/20 blur-xl" />}
                  <div className={cn('flex size-14 items-center justify-center rounded-full text-3xl', b.earned ? 'bg-gradient-to-br from-[#ffe7a3] to-[#f3c25b] shadow-glow' : 'bg-surface-2 grayscale')}>
                    <span className={cn(!b.earned && 'opacity-40')}>{b.emoji}</span>
                  </div>
                  <p className="mt-2.5 text-sm font-semibold leading-tight">{b.name}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{b.description}</p>
                  {b.earned ? (
                    <p className="mt-2 text-[11px] font-semibold text-warning">Obtenu{owned[b.id] ? ` le ${fmtShort(owned[b.id])}` : ''}</p>
                  ) : b.target > 1 ? (
                    <div className="mt-2">
                      <ProgressBar value={b.progress} size="sm" />
                      <p className="mt-1 text-[11px] tabular-nums text-muted">
                        {fmt(b, Math.min(b.value, b.target))} / {fmt(b, b.target)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted">À débloquer</p>
                  )}
                </motion.div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RoomPage() {
  const [tab, setTab] = useState<'decor' | 'badges'>('decor');
  return (
    <>
      <PageHeader title="Mon coin lecture" subtitle="Chaque livre terminé fait grandir ton petit monde" />
      <PageBody>
        <Segmented
          value={tab}
          onChange={setTab}
          className="mb-5 w-full sm:w-auto"
          options={[
            { value: 'decor', label: '🏡 Mon décor' },
            { value: 'badges', label: '🏅 Badges' },
          ]}
        />
        {tab === 'decor' ? <DecorTab /> : <BadgesTab />}
      </PageBody>
    </>
  );
}
