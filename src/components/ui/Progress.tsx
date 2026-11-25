import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ProgressBar({ value, className, tone = 'accent', size = 'md' }: { value: number; className?: string; tone?: 'accent' | 'success' | 'ink'; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-surface-3/80', size === 'md' ? 'h-1.5' : 'h-1', className)}
    >
      <motion.div
        className={cn('h-full rounded-full', tone === 'accent' && 'bg-accent', tone === 'success' && 'bg-success', tone === 'ink' && 'bg-ink')}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  className,
  children,
  tone = 'accent',
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  tone?: 'accent' | 'success';
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={tone === 'accent' ? 'stroke-accent' : 'stroke-success'}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (v / 100) * c }}
          transition={{ type: 'spring', bounce: 0, duration: 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
