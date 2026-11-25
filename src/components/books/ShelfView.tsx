import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/types';
import { BookCover } from './BookCover';
import { useMediaQuery } from '@/lib/hooks';
import { bookPercent } from '@/lib/utils';

/** Bibliothèque virtuelle : les livres posés sur des étagères en bois. */
export function ShelfView({ books }: { books: Book[] }) {
  const navigate = useNavigate();
  const sm = useMediaQuery('(min-width: 640px)');
  const lg = useMediaQuery('(min-width: 1024px)');
  const perRow = lg ? 8 : sm ? 6 : 4;
  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += perRow) rows.push(books.slice(i, i + perRow));

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-[#5b3b26] to-[#4a2f1e] p-2.5 shadow-lift sm:p-3.5">
      <div className="rounded-2xl bg-gradient-to-b from-[#3a2518] to-[#2b1b11] px-2 pt-4 shadow-[inset_0_8px_24px_rgba(0,0,0,0.45)] sm:px-4">
        {rows.map((row, r) => (
          <div key={r} className="mb-5 last:mb-3">
            <div className="grid items-end gap-2.5 px-1 sm:gap-4" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
              {row.map((b, i) => {
                const pct = bookPercent(b);
                // Légère variation de hauteur et d'inclinaison pour un rendu naturel.
                const tilt = (b.id.charCodeAt(0) + i) % 7 === 0 ? -3 : 0;
                return (
                  <motion.button
                    key={b.id}
                    type="button"
                    onClick={() => navigate(`/book/${b.id}`)}
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (r * perRow + i) * 0.02, type: 'spring', bounce: 0.3 }}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative origin-bottom text-left outline-none"
                    style={{ rotate: tilt }}
                    aria-label={`${b.title}${b.authors[0] ? `, ${b.authors[0]}` : ''}`}
                  >
                    <BookCover title={b.title} author={b.authors[0]} src={b.coverUrl} size="md" className="!w-full !rounded-[4px] shadow-[2px_4px_10px_rgba(0,0,0,0.6)]" />
                    {b.status === 'reading' && (
                      <div className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {b.favorite && <span className="absolute right-1 top-1 text-[11px] drop-shadow">❤️</span>}
                  </motion.button>
                );
              })}
            </div>
            {/* Planche */}
            <div className="relative -mx-2 mt-0 h-3.5 rounded-sm bg-gradient-to-b from-[#a87449] to-[#7a4f2f] shadow-[0_6px_10px_rgba(0,0,0,0.5)] sm:-mx-4">
              <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
