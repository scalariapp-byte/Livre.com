import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { useTick } from '@/lib/hooks';
import { formatDuration } from '@/lib/utils';
import { BookCover } from '@/components/books/BookCover';

export function timerElapsed(t: { elapsedMs: number; runningSince: number | null }) {
  return t.elapsedMs + (t.runningSince ? Date.now() - t.runningSince : 0);
}

/** Minuteur de lecture flottant, persistant entre les pages et les rechargements. */
export function TimerPill() {
  const timer = useLibrary((s) => s.timer);
  const book = useLibrary((s) => s.books.find((b) => b.id === s.timer?.bookId));
  const { pauseTimer, resumeTimer } = useLibrary.getState();
  const setFinish = useUI((s) => s.setTimerFinish);
  const navigate = useNavigate();
  useTick(1000, !!timer?.runningSince);

  return (
    <AnimatePresence>
      {timer && book && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed inset-x-3 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:w-[360px]"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-ink p-2 pr-2.5 text-bg shadow-lift">
            <button type="button" onClick={() => navigate(`/book/${book.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <BookCover title={book.title} src={book.coverUrl} size="xs" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{book.title}</p>
                <p className="flex items-center gap-1.5 text-xs tabular-nums opacity-70">
                  {timer.runningSince && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
                  {formatDuration(timerElapsed(timer))} {timer.runningSince ? '' : '· en pause'}
                </p>
              </div>
            </button>
            <button
              type="button"
              aria-label={timer.runningSince ? 'Pause' : 'Reprendre'}
              onClick={() => (timer.runningSince ? pauseTimer() : resumeTimer())}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/15 active:scale-90"
            >
              {timer.runningSince ? <Pause className="size-[18px]" fill="currentColor" /> : <Play className="size-[18px]" fill="currentColor" />}
            </button>
            <button
              type="button"
              aria-label="Terminer la session"
              onClick={() => {
                pauseTimer();
                setFinish(true);
              }}
              className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink transition active:scale-90"
            >
              <Square className="size-4" fill="currentColor" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
