import { motion } from 'framer-motion';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  return (
    <div role="tablist" className={cn('inline-flex rounded-2xl bg-surface-2 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-medium transition-colors',
              size === 'md' ? 'h-9 px-3.5 text-sm' : 'h-7 px-2.5 text-xs',
              active ? 'text-ink' : 'text-muted hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-surface shadow-card"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && (
              <span className={cn('relative text-2xs tabular-nums', active ? 'text-accent' : 'text-muted')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Pastilles de filtre horizontales défilantes (genres…). */
export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={cn(
            'flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95',
            o.value === value
              ? 'border-ink bg-ink text-bg'
              : 'border-line bg-surface text-ink-2 hover:border-ink/30 hover:text-ink',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="text-2xs tabular-nums opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
