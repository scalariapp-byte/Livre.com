import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { addDays, fmtShort, fromDayKey, toDayKey } from '@/lib/dates';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  tooltip?: string;
  highlight?: boolean;
}

/** Histogramme en barres verticales, interactif (survol / toucher affiche la valeur). */
export function BarChart({ data, height = 160, format = (v: number) => String(v), goal, className }: { data: BarDatum[]; height?: number; format?: (v: number) => string; goal?: number; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, goal ?? 0, ...data.map((d) => d.value));
  const activeDatum = data.find((d) => d.key === active);

  return (
    <div className={cn('relative', className)} onMouseLeave={() => setActive(null)}>
      <div className="relative flex items-end gap-[6px]" style={{ height }}>
        {/* Grille */}
        {[0.5, 1].map((r) => (
          <div key={r} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/80" style={{ bottom: `${r * 100}%` }} />
        ))}
        {goal !== undefined && goal > 0 && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t-[1.5px] border-accent/50" style={{ bottom: `${(goal / max) * 100}%` }}>
            <span className="absolute -top-[18px] left-0 rounded bg-surface px-1 text-2xs font-semibold text-accent">Objectif {format(goal)}</span>
          </div>
        )}
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const isActive = active === d.key;
          return (
            <button
              key={d.key}
              type="button"
              aria-label={`${d.label} : ${format(d.value)}`}
              onMouseEnter={() => setActive(d.key)}
              onFocus={() => setActive(d.key)}
              onClick={() => setActive(isActive ? null : d.key)}
              className="group relative flex h-full flex-1 items-end outline-none"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(d.value > 0 ? 3 : 0, h)}%` }}
                transition={{ type: 'spring', bounce: 0.1, duration: 0.7, delay: i * 0.025 }}
                className={cn(
                  'w-full rounded-t-[6px] rounded-b-[2px] transition-colors',
                  d.highlight ? 'bg-accent' : 'bg-accent/35 group-hover:bg-accent/60',
                  isActive && 'bg-accent',
                )}
              />
              {d.value === 0 && <div className="absolute bottom-0 h-[3px] w-full rounded-full bg-surface-3" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[6px]">
        {data.map((d) => (
          <span key={d.key} className={cn('flex-1 truncate text-center text-[10.5px] font-medium', d.highlight || active === d.key ? 'text-ink' : 'text-muted')}>
            {d.label}
          </span>
        ))}
      </div>
      {activeDatum && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-bg shadow-lift">
          {activeDatum.tooltip ?? `${activeDatum.label} · ${format(activeDatum.value)}`}
        </div>
      )}
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function Donut({ data, size = 168, thickness = 22, center }: { data: DonutDatum[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-surface-2" />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const dash = Math.max(0, len - gap);
          const el = (
            <motion.circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={active === i ? thickness + 4 : thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: active === null || active === i ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              className="cursor-pointer transition-[stroke-width]"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {active !== null ? (
          <>
            <span className="h-display text-2xl font-semibold">{data[active].value}</span>
            <span className="max-w-[90px] truncate text-xs text-muted">{data[active].label}</span>
          </>
        ) : (
          center
        )}
      </div>
    </div>
  );
}

/** Carte d'activité des dernières semaines (intensité = pages lues par jour). */
export function Heatmap({ values, weeks = 20, today = toDayKey() }: { values: Map<string, number>; weeks?: number; today?: string }) {
  const end = fromDayKey(today);
  const endOffset = (end.getDay() + 6) % 7; // lundi = 0
  const start = addDays(today, -(weeks * 7 - 1) + (6 - endOffset));
  const days: string[] = [];
  for (let i = 0; i < weeks * 7; i++) days.push(addDays(start, i));
  const max = Math.max(1, ...days.map((d) => values.get(d) ?? 0));
  const level = (v: number) => (v <= 0 ? 0 : v < max * 0.25 ? 1 : v < max * 0.5 ? 2 : v < max * 0.75 ? 3 : 4);
  const cls = ['bg-surface-2', 'bg-accent/25', 'bg-accent/45', 'bg-accent/70', 'bg-accent'];
  const cols: string[][] = [];
  for (let w = 0; w < weeks; w++) cols.push(days.slice(w * 7, w * 7 + 7));
  return (
    <div>
      <div className="scrollbar-none flex gap-[3px] overflow-x-auto">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-1 flex-col gap-[3px]">
            {col.map((d) => {
              const v = values.get(d) ?? 0;
              const future = d > today;
              return (
                <div
                  key={d}
                  title={future ? '' : `${fmtShort(d)} · ${v} pages`}
                  className={cn('aspect-square min-w-[10px] rounded-[3px]', future ? 'bg-transparent' : cls[level(v)], d === today && 'ring-1 ring-ink/40')}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-2xs text-muted">
        Moins
        {cls.map((c) => (
          <span key={c} className={cn('size-2.5 rounded-[3px]', c)} />
        ))}
        Plus
      </div>
    </div>
  );
}
