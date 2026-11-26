import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Pencil, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LOOKS, PetSprite, type PetAction } from '@/components/PetSprite';
import { PetRoom } from '@/components/PetRoom';
import { CAT_COATS, coatOf } from '@/components/CatSprite';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Progress';
import { Sheet } from '@/components/ui/Sheet';
import { toast } from '@/components/ui/Toast';
import { ACCESSORIES, MOOD_META, PET_TAP_LINES, ROOM_ITEMS, SPECIES, petMessage, petStatus, roomUnlocked, speciesOf } from '@/lib/pet';
import { cn } from '@/lib/utils';

function Adopt({ onDone, initial }: { onDone: () => void; initial?: { species: string; name: string } }) {
  const setPet = useLibrary((s) => s.setPet);
  const [species, setSpecies] = useState(initial?.species ?? 'cat');
  const [name, setName] = useState(initial?.name ?? '');
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim().slice(0, 24) || 'Moka';
        setPet({ species, name: n });
        toast.success(initial ? 'Compagnon modifié' : `Bienvenue ${n} ! ${speciesOf(species).emoji}`);
        onDone();
      }}
    >
      <div>
        <p className="mb-2 text-[15px] font-semibold">Choisis ton compagnon</p>
        <div className="grid grid-cols-4 gap-2">
          {SPECIES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={species === s.id}
              onClick={() => setSpecies(s.id)}
              className={cn('flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 transition active:scale-95', species === s.id ? 'border-accent bg-accent/8' : 'border-line')}
            >
              <span className="text-4xl leading-none">{s.emoji}</span>
              <span className="text-xs font-medium">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="pet-name" className="mb-2 block text-[15px] font-semibold">
          Son nom
        </label>
        <Input id="pet-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Moka, Biscotte, Pixel…" maxLength={24} />
      </div>
      <Button type="submit" size="lg" block>
        {initial ? 'Enregistrer' : 'Adopter'}
      </Button>
    </form>
  );
}

export function PetTab() {
  const pet = useLibrary((s) => s.pet);
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const goal = useLibrary((s) => s.settings.dailyPagesGoal);
  const setPet = useLibrary((s) => s.setPet);
  const startTimer = useLibrary((s) => s.startTimer);
  const timer = useLibrary((s) => s.timer);
  const openAdd = useUI((s) => s.openAddBook);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [tapLine, setTapLine] = useState<string | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);
  const [jump, setJump] = useState(0);

  const st = useMemo(() => petStatus(books, sessions, goal), [books, sessions, goal]);

  // ---- Comportement : se promène, regarde autour, s'assoit, dort ----
  const [action, setAction] = useState<PetAction>('idle');
  const [walk, setWalk] = useState({ x: 0, dir: 1, duration: 0 });
  const happyUntil = useRef(0);
  const sleepy = st.mood === 'sleepy';

  useEffect(() => {
    if (sleepy) {
      setAction('sleep');
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      if (Date.now() < happyUntil.current) {
        t = setTimeout(next, 800);
        return;
      }
      const r = Math.random();
      if (r < 0.45) {
        setWalk((w) => {
          const x = Math.round((Math.random() * 2 - 1) * 70);
          const duration = Math.max(0.8, Math.abs(x - w.x) / 45);
          setAction('walk');
          setTimeout(() => setAction((a) => (a === 'walk' ? 'idle' : a)), duration * 1000);
          return { x, dir: x >= w.x ? 1 : -1, duration };
        });
      } else if (r < 0.7) setAction('look');
      else setAction('idle');
      t = setTimeout(next, 3200 + Math.random() * 3000);
    };
    t = setTimeout(next, 1200);
    return () => clearTimeout(t);
  }, [sleepy]);

  if (!pet)
    return (
      <div className="card p-5">
        <div className="mb-4 text-center">
          <p className="text-5xl">🥚</p>
          <h2 className="h-display mt-2 text-xl font-semibold">Adopte un compagnon de lecture</h2>
          <p className="mt-1 text-sm text-muted">Il grandit à chaque page que tu lis et te félicite à chaque livre terminé.</p>
        </div>
        <Adopt onDone={() => {}} />
      </div>
    );

  const sp = speciesOf(pet.species);
  const mood = MOOD_META[st.mood];
  const head = ACCESSORIES.find((a) => a.id === pet.head && st.level >= a.level);
  const side = ACCESSORIES.find((a) => a.id === pet.side && st.level >= a.level);
  const msg = tapLine ?? petMessage(pet.name, sp.sound, st.mood, { todayPages: st.todayPages, goal, streak: st.streak });
  const size = Math.round(96 * st.stage.scale);
  const reading = books.filter((b) => b.status === 'reading').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  const caress = () => {
    happyUntil.current = Date.now() + 2200;
    setAction('happy');
    setTimeout(() => setAction(sleepy ? 'sleep' : 'idle'), 2200);
    setJump((j) => j + 1);
    setHearts((h) => [...h.slice(-6), Date.now()]);
    setTapLine(PET_TAP_LINES[Math.floor(Math.random() * PET_TAP_LINES.length)]);
    navigator.vibrate?.(12);
    setTimeout(() => setTapLine(null), 2600);
  };

  return (
    <div className="space-y-4">
      {/* Scène du compagnon */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-accent/15 via-surface to-surface-2 p-5 shadow-card ring-1 ring-line/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="h-display text-2xl font-semibold">{pet.name}</p>
            <p className="text-sm text-muted">
              {sp.name} · {st.stage.name} · niveau {st.level}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-sm font-medium shadow-card">
            {mood.face} {mood.label}
          </span>
        </div>

        {/* Bulle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative mx-auto mt-4 max-w-xs rounded-2xl bg-surface px-4 py-2.5 text-center text-sm font-medium shadow-card"
          >
            {msg}
            <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-surface" />
          </motion.div>
        </AnimatePresence>

        <button type="button" onClick={caress} aria-label={`Caresser ${pet.name}`} className="relative mt-3 flex h-64 w-full items-end justify-center overflow-hidden rounded-3xl outline-none ring-1 ring-black/10 sm:h-72">
          {/* Coussin */}
          <PetRoom night={st.mood === 'sleepy'} items={roomUnlocked(st.level)} />
          {LOOKS[pet.species] ? (
            <motion.div
              className="relative mb-[2%]"
              animate={{ x: walk.x }}
              transition={{ duration: walk.duration, ease: 'linear' }}
            >
              <motion.div key={jump} animate={jump ? { y: [0, -34, 0, -10, 0] } : { y: 0 }} transition={{ duration: 0.7 }}>
                <div style={{ transform: `scaleX(${walk.dir})` }}>
                  <PetSprite
                    species={pet.species}
                    coat={pet.coat}
                    action={action}
                    size={Math.round(150 * st.stage.scale)}
                    head={head && <span style={{ display: 'inline-block', transform: `scaleX(${walk.dir})` }}>{head.emoji}</span>}
                    side={side && <span style={{ display: 'inline-block', transform: `scaleX(${walk.dir})` }}>{side.emoji}</span>}
                  />
                </div>
              </motion.div>
              {action === 'sleep' && (
                <motion.span className="absolute -top-2 right-2 text-xl font-bold text-muted" animate={{ opacity: [0, 1, 0], y: [0, -14], x: [0, 6] }} transition={{ duration: 2.4, repeat: Infinity }}>
                  Zzz
                </motion.span>
              )}
            </motion.div>
          ) : (
            <motion.span
              key={jump}
              className="relative mb-6 block leading-none"
              style={{ fontSize: size, filter: st.mood === 'sleepy' ? 'saturate(0.6)' : undefined }}
              initial={{ y: 0 }}
              animate={jump ? { y: [0, -36, 0, -12, 0], rotate: [0, -6, 6, 0] } : { y: [0, -5, 0], x: [0, 30, 0, -30, 0] }}
              transition={jump ? { duration: 0.7 } : { duration: st.mood === 'sleepy' ? 4 : 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              {head && <span className="absolute -top-[0.42em] left-1/2 -translate-x-1/2 text-[0.42em]">{head.emoji}</span>}
              {sp.emoji}
              {side && <span className="absolute -right-[0.55em] bottom-0 text-[0.42em]">{side.emoji}</span>}
            </motion.span>
          )}
          {hearts.map((h) => (
            <motion.span
              key={h}
              className="pointer-events-none absolute bottom-20 text-2xl"
              initial={{ opacity: 1, y: 0, x: (h % 60) - 30 }}
              animate={{ opacity: 0, y: -110 }}
              transition={{ duration: 1.4 }}
              onAnimationComplete={() => setHearts((x) => x.filter((v) => v !== h))}
            >
              ❤️
            </motion.span>
          ))}
        </button>

        <div className="mt-2 flex justify-center gap-2">
          <Button variant="soft" icon={<Hand className="size-4" />} onClick={caress}>
            Caresser
          </Button>
          <Button
            icon={<Timer className="size-4" />}
            disabled={!!timer}
            onClick={() => {
              if (reading) {
                startTimer(reading.id);
                toast.success(`${pet.name} lit avec toi ${sp.emoji}`, { description: reading.title });
              } else openAdd('reading');
            }}
          >
            {timer ? 'Lecture en cours' : 'Lire avec lui'}
          </Button>
        </div>
      </div>

      {/* Jauges */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">⭐ Niveau {st.level}</span>
            <span className="tabular-nums text-muted">
              {st.into} / {st.needed} XP
            </span>
          </div>
          <ProgressBar value={st.progress} className="mt-2" />
          <p className="mt-2 text-xs text-muted">1 XP par page lue · 50 XP par livre terminé · 20 XP par bilan</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">🍪 Gamelle du jour</span>
            <span className="tabular-nums text-muted">
              {st.todayPages} / {goal} pages
            </span>
          </div>
          <ProgressBar value={st.food} tone={st.food >= 100 ? 'success' : 'accent'} className="mt-2" />
          <p className="mt-2 text-xs text-muted">{st.food >= 100 ? `${pet.name} est rassasié, bravo !` : 'Chaque page lue aujourd’hui remplit sa gamelle.'}</p>
        </div>
      </div>

      {/* Chambre : se remplit avec les niveaux */}
      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-sm font-semibold">Sa chambre</p>
          <p className="text-xs text-muted">
            {ROOM_ITEMS.filter((i) => st.level >= i.level).length}/{ROOM_ITEMS.length} objets
          </p>
        </div>
        {(() => {
          const next = ROOM_ITEMS.find((i) => st.level < i.level);
          return next ? (
            <p className="mb-3 rounded-2xl bg-surface-2 p-3 text-sm text-ink-2">
              Prochain objet au <b>niveau {next.level}</b> : {next.emoji} {next.name.toLowerCase()}
            </p>
          ) : null;
        })()}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ROOM_ITEMS.map((i) => {
            const locked = st.level < i.level;
            return (
              <div key={i.id} className={cn('flex flex-col items-center gap-1 rounded-2xl border p-2 text-center', locked ? 'border-dashed border-line opacity-50' : 'border-accent/40 bg-accent/5')}>
                <span className={cn('text-2xl leading-none', locked && 'grayscale')}>{locked ? '🔒' : i.emoji}</span>
                <span className="line-clamp-2 text-[10.5px] font-medium leading-tight text-ink-2">{locked ? `Niveau ${i.level}` : i.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pelage (chat) */}
      {pet.species === 'cat' && (
        <section className="card p-4">
          <p className="mb-3 text-sm font-semibold">Pelage de {pet.name}</p>
          <div className="flex flex-wrap gap-2">
            {CAT_COATS.map((c) => {
              const on = coatOf(pet.coat).id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPet({ coat: c.id })}
                  className={cn('flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-[13px] font-medium transition active:scale-95', on ? 'border-accent' : 'border-line')}
                >
                  <span className="size-7 rounded-full ring-1 ring-black/10" style={{ background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.fur} 60%, ${c.dark})` }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Accessoires */}
      <section className="card p-4">
        <p className="mb-3 text-sm font-semibold">Accessoires</p>
        <div className="grid grid-cols-5 gap-2">
          {ACCESSORIES.map((a) => {
            const locked = st.level < a.level;
            const worn = pet[a.slot] === a.id;
            return (
              <button
                key={a.id}
                type="button"
                disabled={locked}
                aria-pressed={worn}
                onClick={() => setPet({ [a.slot]: worn ? undefined : a.id })}
                title={locked ? `Niveau ${a.level}` : a.name}
                className={cn('flex flex-col items-center gap-0.5 rounded-2xl border-2 p-2 transition active:scale-95', worn ? 'border-accent bg-accent/8' : 'border-line', locked && 'border-dashed opacity-50')}
              >
                <span className={cn('text-2xl leading-none', locked && 'grayscale')}>{locked ? '🔒' : a.emoji}</span>
                <span className="text-[10px] font-medium text-muted">{locked ? `Niv. ${a.level}` : a.slot === 'head' ? 'Tête' : 'À côté'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-center gap-2">
        <Button variant="ghost" size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
          Changer de nom ou d’animal
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/stats')}>
          Mes statistiques
        </Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Mon compagnon" size="sm">
        {editing && <Adopt initial={{ species: pet.species, name: pet.name }} onDone={() => setEditing(false)} />}
      </Sheet>
    </div>
  );
}
