import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Note sur 5 avec demi-étoiles. Cliquer sur la note actuelle la réinitialise. */
export function Rating({
  value = 0,
  onChange,
  size = 18,
  className,
}: {
  value?: number;
  onChange?: (v: number | undefined) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const readOnly = !onChange;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={() => setHover(null)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Note : ${value || 0} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = shown >= i ? 1 : shown >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-surface-3" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? size : size / 2 }}>
                <Star className="text-warning" style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
              </span>
            )}
            {!readOnly && (
              <>
                {[i - 0.5, i].map((v, k) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={value === v}
                    aria-label={`${v} étoile${v > 1 ? 's' : ''}`}
                    className={cn('absolute top-0 h-full w-1/2', k === 0 ? 'left-0' : 'right-0')}
                    onMouseEnter={() => setHover(v)}
                    onClick={() => onChange(value === v ? undefined : v)}
                  />
                ))}
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
