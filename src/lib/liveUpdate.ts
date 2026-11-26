import { Capacitor, registerPlugin } from '@capacitor/core';
import { APP_BUILD } from './updates';

/**
 * Mise à jour automatique de l'app Android, sans réinstaller l'APK.
 *
 * Chaque version publiée contient, à côté de l'APK, l'interface web compilée
 * (livre-web-apiN.zip). L'app la télécharge en arrière-plan, la décompresse dans
 * son stockage privé puis la charge à la place de celle livrée avec l'APK.
 * L'adresse interne reste la même (https://localhost) : les livres sont conservés.
 *
 * Sécurité :
 *  - une interface n'est utilisée que si l'APK installé a les fonctions natives
 *    qu'elle demande (N = native-api.txt) ; sinon l'ancienne mise à jour par APK prend le relais ;
 *  - une nouvelle interface n'est gardée qu'après avoir démarré correctement
 *    (sinon index.html revient automatiquement à la précédente).
 */

interface WebViewPlugin {
  setServerBasePath(o: { path: string }): Promise<void>;
  getServerBasePath(): Promise<{ path: string }>;
  persistServerBasePath(): Promise<void>;
}
interface AppUpdaterInfo {
  info(): Promise<{ nativeApi: number }>;
}

const WebView = registerPlugin<WebViewPlugin>('WebView');
const AppUpdater = registerPlugin<AppUpdaterInfo>('AppUpdater');

const REPO = 'scalariapp-byte/Livre.com';
const DIR = 'live';
const K = {
  ready: 'livre-live-ready', // { build, path } téléchargée, pas encore appliquée
  pending: 'livre-live-pending', // build en cours d'essai
  prev: 'livre-live-prev', // dossier à reprendre si l'essai échoue ('' = interface de l'APK)
  ok: 'livre-live-ok', // dernier build ayant démarré correctement
  bad: 'livre-live-bad', // builds refusés (liste)
};

interface Ready {
  build: number;
  path: string;
}

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignoré */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignoré */
    }
  },
};

export const liveSupported = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

let apiCache: Promise<number> | null = null;
/** Niveau des fonctions natives de l'APK installé (0 = APK trop ancien pour la mise à jour automatique). */
export const nativeApi = () =>
  (apiCache ??= AppUpdater.info()
    .then((r) => Number(r.nativeApi) || 0)
    .catch(() => 0));

const badBuilds = (): number[] => {
  try {
    return JSON.parse(ls.get(K.bad) || '[]');
  } catch {
    return [];
  }
};
const getReady = (): Ready | null => {
  try {
    const r = JSON.parse(ls.get(K.ready) || 'null');
    return r && typeof r.build === 'number' && typeof r.path === 'string' ? r : null;
  } catch {
    return null;
  }
};

const toB64 = (u8: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
};

/** À appeler au démarrage : valide l'interface qui vient d'être appliquée. Renvoie le build si une mise à jour vient d'être installée. */
export async function confirmBoot(): Promise<number | null> {
  if (!liveSupported()) return null;
  ls.set(K.ok, String(APP_BUILD));
  let installed: number | null = null;
  if (ls.get(K.pending) === String(APP_BUILD)) {
    try {
      await WebView.persistServerBasePath();
    } catch {
      /* au pire, réessai au prochain lancement */
    }
    ls.del(K.pending);
    ls.del(K.ready);
    installed = APP_BUILD;
  }
  // Une mise à jour plus récente attend déjà : on l'applique tout de suite (démarrage).
  if (await applyReady()) return null;
  cleanup().catch(() => {});
  return installed;
}

/** Supprime les anciennes interfaces téléchargées (garde celle utilisée et celle en attente). */
async function cleanup() {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const keep = new Set([`b${APP_BUILD}`]);
  const r = getReady();
  if (r) keep.add(`b${r.build}`);
  const { files } = await Filesystem.readdir({ path: DIR, directory: Directory.Data }).catch(() => ({ files: [] as { name: string }[] }));
  for (const f of files) {
    if (keep.has(f.name)) continue;
    await Filesystem.rmdir({ path: `${DIR}/${f.name}`, directory: Directory.Data, recursive: true }).catch(() => {});
  }
}

/** Charge l'interface téléchargée si elle est plus récente. Recharge la page. */
export async function applyReady(): Promise<boolean> {
  if (!liveSupported()) return false;
  const r = getReady();
  if (!r || r.build <= APP_BUILD || badBuilds().includes(r.build)) return false;
  const { Filesystem } = await import('@capacitor/filesystem');
  const ok = await Filesystem.stat({ path: `file://${r.path}/index.html` })
    .then(() => true)
    .catch(() => false);
  if (!ok) {
    ls.del(K.ready);
    return false;
  }
  const current = await WebView.getServerBasePath()
    .then((x) => x.path || '')
    .catch(() => '');
  ls.set(K.prev, current.startsWith('/') ? current : '');
  ls.set(K.pending, String(r.build));
  await WebView.setServerBasePath({ path: r.path });
  return true;
}

interface Release {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string }[];
}

/** Cherche une nouvelle interface compatible et la télécharge. Renvoie le build prêt, ou null. */
export async function checkLive(): Promise<number | null> {
  if (!liveSupported()) return null;
  const api = await nativeApi();
  if (!api) return null;
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) return null;
  const rel = (await res.json()) as Release;
  const m = /^v?1\.0\.(\d+)$/.exec(rel.tag_name);
  if (!m || rel.draft || rel.prerelease) return null;
  const build = Number(m[1]);
  if (build <= APP_BUILD || badBuilds().includes(build)) return null;
  if (getReady()?.build === build) return build;
  const asset = rel.assets.find((a) => {
    const am = /^livre-web-api(\d+)\.zip$/.exec(a.name);
    return am && Number(am[1]) <= api;
  });
  if (!asset) return null;

  const [{ Filesystem, Directory }, { unzipSync }] = await Promise.all([import('@capacitor/filesystem'), import('fflate')]);
  const zipPath = `${DIR}/download.zip`;
  await Filesystem.downloadFile({ url: asset.browser_download_url, path: zipPath, directory: Directory.Data, recursive: true });
  const { data } = await Filesystem.readFile({ path: zipPath, directory: Directory.Data });
  const files = unzipSync(fromB64(typeof data === 'string' ? data : await blobToB64(data)));
  if (!files['index.html']) throw new Error('Mise à jour incomplète');

  const target = `${DIR}/b${build}`;
  await Filesystem.rmdir({ path: target, directory: Directory.Data, recursive: true }).catch(() => {});
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith('/') || name.includes('..')) continue;
    await Filesystem.writeFile({ path: `${target}/${name}`, data: toB64(content), directory: Directory.Data, recursive: true });
  }
  await Filesystem.deleteFile({ path: zipPath, directory: Directory.Data }).catch(() => {});
  const { uri } = await Filesystem.getUri({ path: target, directory: Directory.Data });
  const path = decodeURIComponent(uri.replace(/^file:\/\//, ''));
  ls.set(K.ready, JSON.stringify({ build, path } satisfies Ready));
  return build;
}

async function blobToB64(b: Blob): Promise<string> {
  return toB64(new Uint8Array(await b.arrayBuffer()));
}

/** Indique si la version publiée peut arriver sans réinstaller l'APK. */
export async function coveredByLive(assets: { name: string }[]): Promise<boolean> {
  if (!liveSupported()) return false;
  const api = await nativeApi();
  if (!api) return false;
  return assets.some((a) => {
    const m = /^livre-web-api(\d+)\.zip$/.exec(a.name);
    return !!m && Number(m[1]) <= api;
  });
}
