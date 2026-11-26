import { get, set } from 'idb-keyval';
import { useLibrary } from '@/store/useLibrary';
import { backupSchema, type Backup } from './schemas';
import { isNative } from './platform';

/**
 * Sauvegarde automatique :
 *  - chaque jour, une copie complète est gardée dans l'appareil (7 dernières) ;
 *  - sur Android, elle est aussi écrite dans Documents/Livre (survit à une désinstallation) ;
 *  - sur iPhone / web, un rappel hebdomadaire propose d'enregistrer le fichier (Fichiers, iCloud…).
 */

const KEY = 'livre-auto-backups';
const META = 'livre-auto-backup-meta';
const KEEP = 7;
const DAY = 24 * 3600 * 1000;

export interface Snapshot {
  at: string;
  books: number;
  data: Backup;
}

export interface BackupMeta {
  lastAuto?: string;
  lastFile?: string;
  lastExport?: string;
  fileError?: string;
}

export const listSnapshots = async (): Promise<Snapshot[]> => ((await get<Snapshot[]>(KEY)) ?? []).sort((a, b) => b.at.localeCompare(a.at));
export const getMeta = async (): Promise<BackupMeta> => (await get<BackupMeta>(META)) ?? {};
const setMeta = async (patch: Partial<BackupMeta>) => set(META, { ...(await getMeta()), ...patch });

const fileName = (d = new Date()) => `livre-sauvegarde-${d.toISOString().slice(0, 10)}.json`;

/** Android : écrit la sauvegarde dans Documents/Livre et ne garde que les 7 plus récentes. */
async function writeAndroidFile(json: string) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  try {
    // Nécessaire sur Android 9 et moins ; sans effet sur les versions récentes.
    await Filesystem.requestPermissions();
  } catch {
    /* ignoré */
  }
  await Filesystem.writeFile({ path: `Livre/${fileName()}`, data: json, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
  try {
    const { files } = await Filesystem.readdir({ path: 'Livre', directory: Directory.Documents });
    const old = files
      .map((f) => f.name)
      .filter((n) => n.startsWith('livre-sauvegarde-'))
      .sort()
      .slice(0, -KEEP);
    for (const n of old) await Filesystem.deleteFile({ path: `Livre/${n}`, directory: Directory.Documents });
  } catch {
    /* nettoyage facultatif */
  }
}

/** Crée une sauvegarde automatique si la dernière a plus de 24 h (ou si force). */
export async function runAutoBackup(force = false): Promise<boolean> {
  const st = useLibrary.getState();
  if (!st.hydrated || !st.settings.onboarded) return false;
  if (st.settings.autoBackup === false && !force) return false;
  const meta = await getMeta();
  if (!force && meta.lastAuto && Date.now() - new Date(meta.lastAuto).getTime() < DAY) return false;
  // Rien à sauvegarder : on ne remplace pas une vraie sauvegarde par une bibliothèque vide.
  if (!st.books.length && !force) return false;

  const data = st.exportBackup();
  const snap: Snapshot = { at: data.exportedAt, books: st.books.length, data };
  const all = await listSnapshots();
  await set(KEY, [snap, ...all].slice(0, KEEP));
  await setMeta({ lastAuto: snap.at });

  if (isNative()) {
    try {
      await writeAndroidFile(JSON.stringify(data));
      await setMeta({ lastFile: snap.at, fileError: undefined });
    } catch (e) {
      await setMeta({ fileError: (e as Error).message || 'Écriture impossible' });
    }
  }
  return true;
}

export async function restoreSnapshot(at: string) {
  const snap = (await listSnapshots()).find((s) => s.at === at);
  if (!snap) throw new Error('Sauvegarde introuvable');
  const parsed = backupSchema.parse(JSON.parse(JSON.stringify(snap.data)));
  useLibrary.getState().importBackup(parsed, 'replace');
}

export const markExported = () => setMeta({ lastExport: new Date().toISOString() });

/** Rappel hebdomadaire d'enregistrer la sauvegarde hors de l'app (iPhone / web). */
export async function needsExportReminder() {
  if (isNative()) return false;
  const st = useLibrary.getState();
  if (!st.books.length || st.settings.autoBackup === false) return false;
  const meta = await getMeta();
  const last = meta.lastExport ? new Date(meta.lastExport).getTime() : 0;
  return Date.now() - last > 7 * DAY;
}
