import { Bell, Camera, RefreshCw, Smartphone, Database, Download, Monitor, Palette, ShieldCheck, Sparkles, Target, Trash2, Upload, User } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Avatar, Switch } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { useLibrary } from '@/store/useLibrary';
import { ACCENTS } from '@/lib/constants';
import { compressImage } from '@/lib/image';
import { backupSchema, type Backup } from '@/lib/schemas';
import { buildDemoData } from '@/lib/demo';
import { cn, formatMinutes } from '@/lib/utils';
import { isNative, saveFile } from '@/lib/platform';
import { GoalsSheet } from './Stats';
import { THEMES } from '@/lib/themes';
import { APP_VERSION, checkForUpdate, openUpdate } from '@/lib/updates';
import { useUpdate } from '@/components/UpdateChecker';
import { isIOS, promptInstall, useInstall } from '@/lib/install';
import type { Accent, ThemeMode } from '@/types';

function Group({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="label mb-2 flex items-center gap-1.5 px-1 [&>svg]:size-3.5">
        {icon}
        {title}
      </h2>
      <div className="card divide-y divide-line/70 overflow-hidden">{children}</div>
    </section>
  );
}

function Row({ title, description, children, onClick }: { title: string; description?: ReactNode; children?: ReactNode; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} className={cn('flex w-full items-center gap-4 px-4 py-3.5 text-left sm:px-5', onClick && 'transition hover:bg-surface-2/60')}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{title}</p>
        {description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{description}</p>}
      </div>
      {children}
    </Comp>
  );
}

export function SettingsPage() {
  const settings = useLibrary((s) => s.settings);
  const books = useLibrary((s) => s.books);
  const sessions = useLibrary((s) => s.sessions);
  const loans = useLibrary((s) => s.loans);
  const plans = useLibrary((s) => s.plans);
  const { updateSettings, exportBackup, importBackup, resetAll, loadDemo } = useLibrary.getState();
  const [name, setName] = useState(settings.name);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [pending, setPending] = useState<Backup | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const showUpdate = useUpdate((s) => s.show);
  const installEvent = useInstall((s) => s.promptEvent);
  const installed = useInstall((s) => s.installed);
  const [iosHelp, setIosHelp] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => e.usage !== undefined && setUsage(`${(e.usage / 1024 / 1024).toFixed(1).replace('.', ',')} Mo utilisés`))
      .catch(() => {});
  }, [books.length]);

  const saveName = () => {
    const n = name.trim().slice(0, 60);
    if (n !== settings.name) {
      updateSettings({ name: n });
      toast.success('Profil mis à jour');
    }
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    try {
      updateSettings({ avatar: await compressImage(file, 256, 0.85) });
      toast.success('Photo de profil mise à jour');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const doExport = async () => {
    const data = exportBackup();
    try {
      await saveFile(`livre-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast.success('Sauvegarde exportée', { description: `${books.length} livres, ${sessions.length} sessions` });
    } catch (e) {
      if (!/cancel/i.test((e as Error).message ?? '')) toast.error('Export impossible', { description: (e as Error).message });
    }
  };

  const onImportFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error('Fichier trop volumineux');
    try {
      const json = JSON.parse(await file.text());
      const parsed = backupSchema.safeParse(json);
      if (!parsed.success) return toast.error('Fichier invalide', { description: 'Ce n’est pas une sauvegarde Livre valide.' });
      setPending(parsed.data);
    } catch {
      toast.error('Lecture impossible', { description: 'Le fichier n’est pas un JSON valide.' });
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const requestNotifications = async (on: boolean) => {
    if (!on) return updateSettings({ notifications: false });
    if (typeof Notification === 'undefined')
      return toast.error(isNative() ? 'Notifications système indisponibles dans l’application' : 'Notifications non prises en charge par ce navigateur', {
        description: isNative() ? 'Les rappels restent visibles dans la cloche et peuvent être ajoutés à votre agenda.' : 'Sur iPhone, ajoutez d’abord l’app à l’écran d’accueil.',
      });
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') {
      updateSettings({ notifications: true });
      toast.success('Rappels activés', { description: 'Vous serez prévenu des retours de prêts et des lectures prévues.' });
    } else toast.error('Autorisation refusée', { description: 'Activez les notifications dans les réglages du navigateur.' });
  };

  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const u = await checkForUpdate();
      if (u) showUpdate(u);
      else toast.success('Vous avez la dernière version', { description: `Version ${APP_VERSION}` });
    } catch (e) {
      toast.error('Vérification impossible', { description: (e as Error).message || 'Vérifiez votre connexion.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <PageHeader title="Profil & réglages" />
      <PageBody className="max-w-3xl space-y-7">
        {/* Profil */}
        <section className="card flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={settings.name} src={settings.avatar} size={88} />
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
            <button type="button" aria-label="Changer la photo" onClick={() => avatarRef.current?.click()} className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full border-4 border-surface bg-ink text-bg transition active:scale-90">
              <Camera className="size-4" />
            </button>
          </div>
          <div className="w-full min-w-0 flex-1">
            <label htmlFor="profile-name" className="label">
              Votre prénom
            </label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), saveName())} placeholder="Comment vous appeler ?" className="mt-1.5" maxLength={60} leading={<User className="size-4" />} />
            <p className="mt-3 text-[13px] text-muted">
              {books.length} livres · {books.filter((b) => b.status === 'finished').length} lus · {formatMinutes(totalMinutes)} de lecture
            </p>
            {settings.avatar && (
              <button type="button" onClick={() => updateSettings({ avatar: undefined })} className="mt-1 text-xs font-medium text-muted hover:text-danger">
                Retirer la photo
              </button>
            )}
          </div>
        </section>

        <Group title="Apparence" icon={<Palette />}>
          <div className="px-4 py-3.5 sm:px-5">
            <p className="text-[15px] font-medium">Thème</p>
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {[{ id: 'system' as ThemeMode, label: 'Automatique', preview: ['#F8F6F2', '#100F0E', '#888888'] }, ...THEMES].map((t) => {
                const on = settings.theme === t.id;
                const [bg, surface, ink] = t.preview;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => updateSettings({ theme: t.id })}
                    className={cn('rounded-2xl border-2 p-1.5 text-left transition active:scale-95', on ? 'border-accent' : 'border-transparent')}
                  >
                    <div
                      className="relative h-16 overflow-hidden rounded-xl ring-1 ring-black/10"
                      style={{ background: t.id === 'system' ? `linear-gradient(135deg, ${bg} 50%, ${surface} 50%)` : bg }}
                    >
                      {t.id !== 'system' && (
                        <div className="absolute inset-x-2 bottom-2 top-3 rounded-lg p-1.5" style={{ background: surface }}>
                          <div className="h-1.5 w-2/3 rounded-full" style={{ background: ink, opacity: 0.85 }} />
                          <div className="mt-1 h-1.5 w-1/3 rounded-full" style={{ background: ink, opacity: 0.35 }} />
                          <div className="absolute bottom-1.5 right-1.5 size-3 rounded-full bg-accent" />
                        </div>
                      )}
                      {t.id === 'system' && <Monitor className="absolute inset-0 m-auto size-5" style={{ color: ink }} />}
                    </div>
                    <p className={cn('mt-1.5 truncate px-0.5 text-[12.5px] font-medium', on ? 'text-accent' : 'text-ink-2')}>{t.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-4 py-3.5 sm:px-5">
            <p className="text-[15px] font-medium">Couleur d'accent</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {(Object.keys(ACCENTS) as Accent[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateSettings({ accent: a })}
                  aria-label={ACCENTS[a].label}
                  aria-pressed={settings.accent === a}
                  className={cn('flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px] font-medium transition active:scale-95', settings.accent === a ? 'border-ink' : 'border-line')}
                >
                  <span className="size-6 rounded-full" style={{ backgroundColor: `rgb(${ACCENTS[a].rgb})` }} />
                  {ACCENTS[a].label}
                </button>
              ))}
            </div>
          </div>
          <Row title="Réduire les animations" description="Désactive les transitions pour plus de sobriété.">
            <Switch label="Réduire les animations" checked={settings.reduceMotion} onChange={(reduceMotion) => updateSettings({ reduceMotion })} />
          </Row>
        </Group>

        <Group title="Lecture" icon={<Target />}>
          <Row title="Objectifs" description={`${settings.yearlyGoal} livres par an · ${settings.dailyPagesGoal} pages et ${settings.dailyMinutesGoal} min par jour`} onClick={() => setGoalsOpen(true)}>
            <span className="text-sm font-semibold text-accent">Modifier</span>
          </Row>
        </Group>

        <Group title="Notifications" icon={<Bell />}>
          <Row title="Rappels" description="Retours de prêts, lectures planifiées. Les rappels apparaissent aussi dans la cloche de l'app.">
            <Switch label="Rappels" checked={settings.notifications} onChange={requestNotifications} />
          </Row>
        </Group>

        <Group title="Données" icon={<Database />}>
          <Row title="Exporter mes données" description="Téléchargez une sauvegarde complète au format JSON." onClick={doExport}>
            <Download className="size-5 text-muted" />
          </Row>
          <Row title="Importer une sauvegarde" description="Restaurez ou fusionnez une sauvegarde Livre." onClick={() => importRef.current?.click()}>
            <Upload className="size-5 text-muted" />
          </Row>
          <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <Row
            title="Charger des exemples"
            description="Ajoute une bibliothèque de démonstration pour découvrir l'app."
            onClick={async () => {
              if (await confirm({ title: 'Ajouter les exemples ?', message: 'Une quinzaine de livres, des sessions, des prêts et des lectures planifiées seront ajoutés à vos données existantes.', confirmLabel: 'Ajouter' })) {
                loadDemo(buildDemoData());
                toast.success('Exemples ajoutés');
              }
            }}
          >
            <Sparkles className="size-5 text-muted" />
          </Row>
          <Row
            title="Tout effacer"
            description={`${books.length} livres, ${sessions.length} sessions, ${loans.length} prêts, ${plans.length} plans${usage ? ` · ${usage}` : ''}`}
            onClick={async () => {
              if (!(await confirm({ title: 'Effacer toutes les données ?', message: 'Livres, sessions, prêts, calendrier et réglages seront définitivement supprimés de cet appareil. Pensez à exporter une sauvegarde.', danger: true, confirmLabel: 'Tout effacer' }))) return;
              resetAll();
              toast.success('Toutes les données ont été effacées');
            }}
          >
            <Trash2 className="size-5 text-danger" />
          </Row>
        </Group>

        <Group title="Application" icon={<Smartphone />}>
          {isNative() ? (
            <Row title="Mise à jour" description={`Version installée : ${APP_VERSION}`} onClick={checking ? undefined : checkUpdate}>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                <RefreshCw className={cn('size-4', checking && 'animate-spin')} />
                {checking ? 'Vérification…' : 'Rechercher'}
              </span>
            </Row>
          ) : (
            <>
            {!installed && (installEvent || isIOS()) && (
              <Row
                title="Installer l'application"
                description={isIOS() ? 'Ajoutez Livre à l’écran d’accueil de votre iPhone ou iPad.' : 'Ajoutez Livre à votre appareil : icône, plein écran, hors ligne.'}
                onClick={async () => {
                  if (isIOS()) return setIosHelp((v) => !v);
                  if (await promptInstall()) toast.success('Livre est installée 🎉');
                }}
              >
                <Download className="size-5 text-accent" />
              </Row>
            )}
            {iosHelp && (
              <div className="space-y-2 bg-surface-2/60 px-5 py-4 text-sm text-ink-2">
                <p>1. Dans Safari, touchez le bouton <b>Partager</b> (carré avec une flèche vers le haut).</p>
                <p>2. Choisissez <b>« Sur l’écran d’accueil »</b>.</p>
                <p>3. Touchez <b>Ajouter</b> : l’icône Livre apparaît sur votre écran.</p>
              </div>
            )}
            {installed && <Row title="Application installée" description="Vous utilisez Livre comme une application." />}
            <Row
              title="Application Android"
              description="Installez Livre sur votre téléphone Android. La version web se met à jour toute seule."
              onClick={() => openUpdate({ build: 0, version: '', apkUrl: 'https://github.com/scalariapp-byte/Livre.com/releases/latest/download/Livre.apk', pageUrl: '', publishedAt: '' })}
            >
              <Download className="size-5 text-muted" />
            </Row>
            </>
          )}
        </Group>

        <div className="flex items-start gap-3 rounded-2xl bg-surface-2/70 p-4 text-[13px] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
          <p>
            Vos données restent sur cet appareil (stockage local du navigateur). Rien n'est envoyé à un serveur, à l'exception des recherches de livres transmises à Google Books / Open Library. Exportez régulièrement une sauvegarde pour la transférer sur un autre appareil.
          </p>
        </div>
        <p className="pb-4 text-center text-xs text-muted">Livre · version {APP_VERSION}</p>
      </PageBody>

      <GoalsSheet key={String(goalsOpen)} open={goalsOpen} onClose={() => setGoalsOpen(false)} />

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Importer la sauvegarde" size="sm">
        {pending && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Sauvegarde du {new Date(pending.exportedAt).toLocaleDateString('fr-FR')}</p>
              <p className="mt-1 text-muted">
                {pending.data.books.length} livres · {pending.data.sessions.length} sessions · {pending.data.loans.length} prêts · {pending.data.plans.length} plans
              </p>
            </div>
            <Button
              block
              size="lg"
              onClick={() => {
                importBackup(pending, 'merge');
                setPending(null);
                toast.success('Sauvegarde fusionnée');
              }}
            >
              Fusionner avec mes données
            </Button>
            <Button
              block
              size="lg"
              variant="outline"
              className="text-danger"
              onClick={async () => {
                if (!(await confirm({ title: 'Remplacer vos données ?', message: 'Vos données actuelles seront remplacées par celles de la sauvegarde.', danger: true, confirmLabel: 'Remplacer' }))) return;
                importBackup(pending, 'replace');
                setPending(null);
                toast.success('Sauvegarde restaurée');
              }}
            >
              Remplacer mes données
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
