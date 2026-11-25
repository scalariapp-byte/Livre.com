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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
