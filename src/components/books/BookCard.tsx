import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { BookCover } from './BookCover';
import { BookMenu } from './BookMenu';
import { ProgressBar } from '@/components/ui/Progress';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/misc';
import { STATUS_META } from '@/lib/constants';
import { bookPercent, cn } from '@/lib/utils';

function useOpenBook(id: string) {
  const navigate = useNavigate();
  return {
    role: 'link' as const,
    tabIndex: 0,
    onClick: () => navigate(`/book/${id}`),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') navigate(`/book/${id}`);
    },
  };
}

/** Tuile de grille : couverture et métadonnées. */
export function BookTile({ book, showStatus = false }: { book: Book; showStatus?: boolean }) {
  const open = useOpenBook(book.id);
  const pct = bookPercent(book);
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="group cursor-pointer outline-none" {...open}>
      <div className="relative">
        <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="xl" className="!w-full transition duration-300 ease-spring group-hover:-translate-y-1 group-hover:shadow-lift" />
        {book.favorite && (
          <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
            <Heart className="size-3.5" fill="currentColor" />
          </span>
        )}
        <div className="absolute right-1.5 top-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <div className="rounded-full bg-surface/90 backdrop-blur" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <BookMenu book={book} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug">{book.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{book.authors.join(', ') || 'Auteur inconnu'}</p>
        {book.status === 'reading' && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={pct} size="sm" />
            <span className="text-2xs font-semibold tabular-nums text-muted">{pct}%</span>
          </div>
        )}
        {book.status === 'finished' && book.rating ? <Rating value={book.rating} size={13} className="mt-1.5" /> : null}
        {showStatus && book.status !== 'reading' && !(book.status === 'finished' && book.rating) && (
          <Badge tone={STATUS_META[book.status].tone} className="mt-1.5">
            {STATUS_META[book.status].short}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

/** Ligne de liste détaillée. */
export function BookRow({ book, meta, trailing, className }: { book: Book; meta?: ReactNode; trailing?: ReactNode; className?: string }) {
  const open = useOpenBook(book.id);
  const pct = bookPercent(book);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn('group flex cursor-pointer items-center gap-3.5 rounded-2xl p-2.5 outline-none transition hover:bg-surface-2/70 focus-visible:bg-surface-2', className)}
      {...open}
    >
      <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="sm" className="!w-[52px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-semibold">{book.title}</p>
          {book.favorite && <Heart className="size-3.5 shrink-0 text-accent" fill="currentColor" />}
        </div>
        <p className="truncate text-[13px] text-muted">{book.authors.join(', ') || 'Auteur inconnu'}</p>
        {meta ?? (
          <div className="mt-1.5 flex items-center gap-2">
            {book.status === 'reading' ? (
              <>
                <ProgressBar value={pct} size="sm" className="max-w-[140px]" />
                <span className="text-2xs font-semibold tabular-nums text-muted">{pct}%</span>
              </>
            ) : book.status === 'finished' && book.rating ? (
              <Rating value={book.rating} size={13} />
            ) : (
              <Badge tone={STATUS_META[book.status].tone}>{STATUS_META[book.status].short}</Badge>
            )}
            {book.genre && <span className="hidden truncate text-2xs text-muted sm:inline">· {book.genre}</span>}
          </div>
        )}
      </div>
      {trailing}
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <BookMenu book={book} />
      </div>
    </motion.div>
  );
}
