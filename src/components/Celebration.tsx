import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { BookCover } from '@/components/books/BookCover';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { BADGES, DECOR, badgeStates, computeMetrics, nextDecor } from '@/lib/rewards';
import { diffDays, isoToDayKey } from '@/lib/dates';
import { formatMinutes, hashString } from '@/lib/utils';
import { speciesOf } from '@/lib/pet';

const CONFETTI = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: (hashString('c' + i) % 100) + Math.random() * 2,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.6,
        rot: Math.random() * 720 - 360,
        color: CONFETTI[i % CONFETTI.length],
        w: 6 + (i % 3) * 3,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block rounded-[2px]"
          style={{ left: `${p.x}%`, width: p.w, height: p.w * 1.6, background: p.color }}
          initial={{ y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rot, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

/** Animation affichée quand un livre est terminé : chat, confettis, récompenses. */
export function Celebration() {
  const id = useUI((s) => s.celebrateBookId);
  const setCelebrate = useUI((s) => s.setCelebrate);
  const setReflection = useUI((s) => s.setReflection);
  const recent = useUI((s) => s.recentBadges);
  const book = useLibrary((s) => s.books.find((b) => b.id === id));
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const navigate = useNavigate();
  const pet = useLibrary((s) => s.pet);
  const petEmoji = speciesOf(pet?.species).emoji;

  const finishedCount = books.filter((b) => b.status === 'finished').length;
  const newDecor = DECOR.find((d) => d.unlockAt === finishedCount);
  const upcoming = nextDecor(finishedCount);
  const fresh = Date.now() - recent.at < 15000 ? BADGES.filter((b) => recent.ids.includes(b.id)) : [];
  const bookSessions = sessions.filter((s) => s.bookId === id);
  const minutes = bookSessions.reduce((a, s) => a + s.minutes, 0);
  const start = isoToDayKey(book?.startedAt);
  const end = isoToDayKey(book?.finishedAt);
  const days = start && end ? Math.max(1, diffDays(end, start) + 1) : undefined;

  useEffect(() => {
    if (book) navigator.vibrate?.([30, 60, 30, 60, 80]);
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (then?: () => void) => {
    setCelebrate(null);
    then?.();
  };

  return createPortal(
    <AnimatePresence>
      {book && (
        <motion.div
          className="fixed inset-0 z-[58] flex items-center justify-center overflow-y-auto bg-gradient-to-b from-black/70 via-black/60 to-black/75 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Livre terminé"
        >
          <Confetti />
          <motion.div
            className="relative my-auto w-full max-w-sm overflow-hidden rounded-[28px] bg-surface p-6 pt-24 text-center shadow-lift"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay: 0.15 }}
          >
            {/* Le chat arrive en sautillant et se pose sur la carte */}
            <motion.div
              className="absolute left-1/2 top-3 text-[72px] leading-none drop-shadow-lg"
              initial={{ x: '-260%', y: 0 }}
              animate={{ x: ['-260%', '-170%', '-110%', '-50%'], y: [0, -40, 0, -26, 0] }}
              transition={{ duration: 1.3, delay: 0.5, ease: 'easeOut' }}
            >
              {petEmoji}
            </motion.div>
            <motion.div
              className="absolute left-1/2 top-2 ml-9 rounded-2xl bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink shadow-lift"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.8, type: 'spring', bounce: 0.5 }}
            >
              {pet ? `${pet.name} : bravo !` : 'Bravo ! 🎉'}
            </motion.div>

            <div className="mb-4 flex justify-center">
              <motion.div initial={{ rotate: -8, scale: 0.6 }} animate={{ rotate: [-8, 6, 0], scale: 1 }} transition={{ delay: 0.35, duration: 0.7 }}>
                <BookCover title={book.title} author={book.authors[0]} src={book.coverUrl} size="lg" className="shadow-lift" />
              </motion.div>
            </div>
            <p className="label">Livre terminé</p>
            <h2 className="h-display mt-1 text-2xl font-semibold leading-tight">{book.title}</h2>
            <div className="mt-3 flex justify-center gap-4 text-sm text-muted">
              {book.pageCount > 0 && <span>📄 {book.pageCount} pages</span>}
              {days && <span>📅 {days} jour{days > 1 ? 's' : ''}</span>}
              {minutes > 0 && <span>⏱️ {formatMinutes(minutes)}</span>}
            </div>

            {newDecor ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-5 rounded-2xl bg-accent/10 p-3.5">
                <p className="text-xs font-semibold text-accent">Nouveau dans ton coin lecture !</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-[15px] font-semibold">
                  <motion.span className="text-3xl" animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.25, 1] }} transition={{ delay: 1.3, duration: 0.8 }}>
                    {newDecor.emoji}
                  </motion.span>
                  {newDecor.name}
                </p>
              </motion.div>
            ) : upcoming ? (
              <p className="mt-5 rounded-2xl bg-surface-2 p-3 text-sm text-ink-2">
                Encore {upcoming.unlockAt - finishedCount} livre{upcoming.unlockAt - finishedCount > 1 ? 's' : ''} pour débloquer {upcoming.emoji} {upcoming.name.toLowerCase()}
              </p>
            ) : null}

            {fresh.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-3">
                <p className="text-xs font-semibold text-muted">Badge{fresh.length > 1 ? 's' : ''} débloqué{fresh.length > 1 ? 's' : ''}</p>
                <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                  {fresh.map((b) => (
                    <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold">
                      {b.emoji} {b.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {!book.reflection && (
                <Button size="lg" block onClick={() => close(() => setTimeout(() => setReflection(book.id), 250))}>
                  Faire mon bilan
                </Button>
              )}
              <Button size="lg" block variant={book.reflection ? 'primary' : 'outline'} onClick={() => close(() => navigate('/room'))}>
                Voir mon coin lecture
              </Button>
              <button type="button" onClick={() => close()} className="py-1.5 text-sm font-medium text-muted hover:text-ink">
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Détecte les badges nouvellement obtenus, les enregistre et les annonce. */
export function BadgeWatcher() {
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const settings = useLibrary((s) => s.settings);

  useEffect(() => {
    const t = setTimeout(() => {
      const st = useLibrary.getState();
      const earned = badgeStates(computeMetrics(st.books, st.sessions, st.settings)).filter((b) => b.earned);
      const fresh = earned.filter((b) => !st.badges[b.id]);
      if (!fresh.length) return;
      const firstRun = Object.keys(st.badges).length === 0 && fresh.length > 2;
      st.unlockBadges(fresh.map((b) => b.id));
      useUI.getState().setRecentBadges(fresh.map((b) => b.id));
      // Pendant la célébration, les badges y sont affichés ; sinon, une notification.
      setTimeout(() => {
        if (useUI.getState().celebrateBookId) return;
        if (firstRun || fresh.length > 2) toast.success(`🏅 ${fresh.length} badges débloqués !`, { description: 'Retrouvez-les dans Mon coin lecture.' });
        else fresh.forEach((b) => toast.success(`${b.emoji} Nouveau badge : ${b.name}`, { description: b.description }));
      }, 600);
    }, 400);
    return () => clearTimeout(t);
  }, [books, sessions, settings]);

  return null;
}
