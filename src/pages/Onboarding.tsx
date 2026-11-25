import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarDays, ChartNoAxesColumn, Repeat2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { LogoMark } from '@/components/layout/Logo';
import { useLibrary } from '@/store/useLibrary';
import { buildDemoData } from '@/lib/demo';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: BookOpen, title: 'Votre bibliothèque', text: 'Ajoutez un livre en quelques secondes, couverture comprise.' },
  { icon: ChartNoAxesColumn, title: 'Suivi & statistiques', text: 'Progression, temps de lecture, séries et objectifs.' },
  { icon: CalendarDays, title: 'Calendrier', text: 'Planifiez vos sessions de lecture.' },
  { icon: Repeat2, title: 'Prêts', text: 'Sachez toujours à qui vous avez prêté vos livres.' },
];

export function Onboarding() {
  const updateSettings = useLibrary((s) => s.updateSettings);
  const loadDemo = useLibrary((s) => s.loadDemo);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(24);

  const finish = (demo: boolean) => {
    if (demo) loadDemo(buildDemoData());
    updateSettings({ name: name.trim().slice(0, 60), yearlyGoal: goal, onboarded: true });
  };

  return (
    <div className="safe-top safe-bottom relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[380px] rounded-full bg-info/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <LogoMark size={56} />
              <h1 className="h-display mt-6 text-[40px] font-semibold leading-[1.05]">
                Toutes vos lectures,
                <br />
                <span className="text-accent">au même endroit.</span>
              </h1>
              <ul className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, title, text }, i) => (
                  <motion.li key={title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="flex gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-card">
                      <Icon className="size-5 text-accent" />
                    </span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-muted">{text}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
              <Button size="lg" block className="mt-10" iconRight={<ArrowRight className="size-4" />} onClick={() => setStep(1)}>
                Commencer
              </Button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.form
              key="1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <p className="label">Étape 1 sur 2</p>
              <h2 className="h-display mt-2 text-3xl font-semibold">Comment vous appelez-vous ?</h2>
              <p className="mt-2 text-muted">Pour personnaliser votre tableau de bord.</p>
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" className="mt-6 !h-14 !text-lg" maxLength={60} />
              <p className="label mt-8">Combien de livres cette année ?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[6, 12, 24, 52].map((g) => (
                  <button key={g} type="button" onClick={() => setGoal(g)} className={cn('h-11 flex-1 rounded-2xl border text-[15px] font-semibold transition active:scale-95', goal === g ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface')}>
                    {g}
                  </button>
                ))}
              </div>
              <Button type="submit" size="lg" block className="mt-10" iconRight={<ArrowRight className="size-4" />}>
                Continuer
              </Button>
            </motion.form>
          )}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <p className="label">Étape 2 sur 2</p>
              <h2 className="h-display mt-2 text-3xl font-semibold">Par où commencer{name.trim() ? `, ${name.trim()}` : ''} ?</h2>
              <div className="mt-8 space-y-3">
                <button type="button" onClick={() => finish(false)} className="card card-interactive w-full p-5 text-left">
                  <p className="font-semibold">Bibliothèque vierge</p>
                  <p className="mt-1 text-sm text-muted">Ajoutez vos propres livres dès maintenant.</p>
                </button>
                <button type="button" onClick={() => finish(true)} className="card card-interactive w-full p-5 text-left">
                  <p className="font-semibold">Explorer avec des exemples</p>
                  <p className="mt-1 text-sm text-muted">Une bibliothèque de démonstration, modifiable et supprimable à tout moment depuis les réglages.</p>
                </button>
              </div>
              <button type="button" onClick={() => setStep(1)} className="mt-6 text-sm font-medium text-muted hover:text-ink">
                ← Retour
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
