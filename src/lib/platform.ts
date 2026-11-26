import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Enregistre un fichier généré (sauvegarde JSON, rappel .ics).
 * Navigateur : téléchargement classique. Application Android : le fichier est écrit
 * dans le cache puis proposé via la feuille de partage (Drive, e-mail, Agenda…),
 * car le téléchargement par lien ne fonctionne pas dans une WebView.
 */
export async function saveFile(filename: string, content: string, mime: string): Promise<void> {
  if (isNative()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const res = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, url: res.uri, dialogTitle: 'Enregistrer ou partager' });
    return;
  }
  const blob = new Blob([content], { type: mime });
  // iPhone / iPad : la feuille de partage permet « Enregistrer dans Fichiers » (iCloud Drive…).
  try {
    const file = new File([blob], filename, { type: mime });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && nav.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('cancel');
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
