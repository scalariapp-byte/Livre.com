import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn, initials } from '@/lib/utils';

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: string; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-2 text-ink-2',
    accent: 'bg-accent/12 text-accent',
    green: 'bg-success/12 text-success',
    blue: 'bg-info/12 text-info',
    violet: 'bg-violet/12 text-violet',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/12 text-danger',
  };
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-2xs font-semibold', tones[tone] ?? tones.neutral, className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-surface-2', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/60 to-transparent" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">{icon}</div>
      <h3 className="h-display text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string; size?: number; className?: string }) {
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-accent/60 font-semibold text-accent-ink ring-2 ring-surface', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name || 'Lecteur')}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-accent' : 'bg-surface-3')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className={cn('absolute top-0.5 size-6 rounded-full bg-white shadow-md', checked ? 'right-0.5' : 'left-0.5')}
      />
    </button>
  );
}

export function SectionHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="h-display text-[19px] font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
