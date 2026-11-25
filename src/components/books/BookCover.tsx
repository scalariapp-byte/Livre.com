import { useEffect, useState } from 'react';
import { coverFallbacks } from '@/lib/covers';
import { cn, hashString } from '@/lib/utils';

const PALETTES = [
  ['#2B3A55', '#E8C4A0'],
  ['#5C3D2E', '#F2DFC7'],
  ['#1F4E4A', '#D8E6CF'],
  ['#6B2D3C', '#F4D6C6'],
  ['#2E2A4F', '#C9C3F0'],
  ['#3D4A2A', '#E9E1B8'],
  ['#7A4A1E', '#F6E2BE'],
  ['#203A43', '#BFE0E8'],
];

interface Props {
  title: string;
  author?: string;
  src?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  xs: 'w-9 rounded-[5px]',
  sm: 'w-12 rounded-md',
  md: 'w-[88px] rounded-lg',
  lg: 'w-[120px] rounded-[10px]',
  xl: 'w-[160px] rounded-xl',
};

/** Couverture du livre, avec une couverture typographique générée si l'image est absente ou inaccessible. */
export function BookCover({ title, author, src, className, size = 'md' }: Props) {
  const candidates = coverFallbacks(src);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
  }, [src]);
  const failed = attempt >= candidates.length;
  const current = candidates[attempt];
  const next = () => {
    setLoaded(false);
    setAttempt((a) => a + 1);
  };
  const [bg, fg] = PALETTES[hashString(title) % PALETTES.length];
  const showImg = !!current && !failed;
  const small = size === 'xs' || size === 'sm';

  return (
    <div
      className={cn('relative aspect-[2/3] shrink-0 overflow-hidden shadow-cover', sizes[size], className)}
      style={{ backgroundColor: bg }}
    >
      {(!showImg || !loaded) && (
        <div className="absolute inset-0 flex flex-col justify-between p-[9%]" style={{ color: fg }} aria-hidden={!!showImg}>
          <div className="h-px w-1/3 opacity-60" style={{ backgroundColor: fg }} />
          {!small && (
            <p className="h-display line-clamp-4 font-semibold leading-[1.05]" style={{ fontSize: size === 'md' ? 12 : size === 'lg' ? 15 : 19 }}>
              {title}
            </p>
          )}
          {small && <p className="h-display text-center text-[13px] font-semibold">{title.charAt(0).toUpperCase()}</p>}
          {!small && author ? (
            <p className="line-clamp-1 text-[9px] font-medium uppercase tracking-wider opacity-75" style={{ fontSize: size === 'xl' ? 10 : 8 }}>
              {author}
            </p>
          ) : (
            <span />
          )}
        </div>
      )}
      {showImg && (
        <img
          key={current}
          src={current}
          alt={`Couverture de ${title}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            // Certaines API renvoient une image 1×1 quand la couverture n'existe pas.
            if ((e.currentTarget.naturalWidth || 0) < 10) next();
            else setLoaded(true);
          }}
          onError={next}
          className={cn('absolute inset-0 size-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
      {/* Reflet et dos du livre */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10" />
    </div>
  );
}
