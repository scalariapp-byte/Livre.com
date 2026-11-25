import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { isNative } from './platform';

interface AppUpdaterPlugin {
  canInstall(): Promise<{ allowed: boolean }>;
  openInstallSettings(): Promise<void>;
  downloadAndInstall(o: { url: string }): Promise<void>;
  addListener(event: 'progress', cb: (e: { progress: number }) => void): Promise<PluginListenerHandle>;
}

/** Module Android natif (android/app/src/main/java/com/livre/app/AppUpdaterPlugin.java). */
const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export class InstallPermissionError extends Error {}

const REPO = 'scalariapp-byte/Livre.com';
const DISMISS_KEY = 'livre-update-dismissed';

/** Numéro de compilation de l'application installée (injecté au build). */
export const APP_BUILD = Number(import.meta.env.VITE_APP_BUILD || 0);
export const APP_VERSION = `1.0.${APP_BUILD}`;

export interface UpdateInfo {
  build: number;
  version: string;
  apkUrl: string;
  pageUrl: string;
  publishedAt: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string }[];
}

/** Interroge GitHub et renvoie la dernière version si elle est plus récente que celle installée. */
export async function checkForUpdate(signal?: AbortSignal): Promise<UpdateInfo | null> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(res.status === 403 ? 'Trop de vérifications, réessayez dans une heure.' : `GitHub a répondu ${res.status}`);
  const r = (await res.json()) as GithubRelease;
  const m = /^v?1\.0\.(\d+)$/.exec(r.tag_name);
  const apk = r.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  if (!m || !apk || r.draft || r.prerelease) return null;
  const build = Number(m[1]);
  if (build <= APP_BUILD) return null;
  return { build, version: `1.0.${build}`, apkUrl: apk.browser_download_url, pageUrl: r.html_url, publishedAt: r.published_at };
}

export const canInstallUpdates = async () => (await AppUpdater.canInstall()).allowed;
export const openInstallSettings = () => AppUpdater.openInstallSettings();

/**
 * Télécharge l'APK dans l'application puis ouvre l'installateur Android.
 * Lève InstallPermissionError si l'autorisation « applications inconnues » manque.
 */
export async function installUpdate(info: UpdateInfo, onProgress: (p: number) => void): Promise<void> {
  const handle = await AppUpdater.addListener('progress', (e) => onProgress(e.progress));
  try {
    await AppUpdater.downloadAndInstall({ url: info.apkUrl });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'INSTALL_PERMISSION') throw new InstallPermissionError(err.message);
    throw e;
  } finally {
    handle.remove();
  }
}

/** Repli : ouvre le téléchargement de l'APK dans le navigateur du téléphone. */
export async function openUpdate(info: UpdateInfo) {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: info.apkUrl });
  } else window.open(info.apkUrl, '_blank', 'noopener');
}

export function isDismissed(build: number) {
  try {
    return Number(localStorage.getItem(DISMISS_KEY)) >= build;
  } catch {
    return false;
  }
}

export function dismiss(build: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(build));
  } catch {
    /* stockage indisponible */
  }
}
