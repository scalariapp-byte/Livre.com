import { isNative } from './platform';
import { isValidIsbn13 } from './bookApi';

export class ScanError extends Error {}

/** Sélectionne l'ISBN parmi les codes lus (un livre porte parfois un 2e code-barres de prix). */
export function pickIsbn(codes: string[]): string | null {
  return codes.map((c) => c.replace(/\D/g, '')).find(isValidIsbn13) ?? null;
}

/**
 * Android : scanner Google (Play Services), sans permission caméra.
 * Renvoie l'ISBN, null si l'utilisateur annule.
 */
export async function scanIsbnNative(onStatus?: (msg: string) => void): Promise<string | null> {
  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    onStatus?.('Installation du scanner Google…');
    await new Promise<void>((resolve, reject) => {
      let handle: { remove: () => Promise<void> } | undefined;
      const timeout = setTimeout(() => reject(new ScanError('Installation du scanner trop longue. Réessayez.')), 120_000);
      BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (e) => {
        if (e.progress !== undefined) onStatus?.(`Installation du scanner… ${e.progress} %`);
        if (e.state === 4) {
          clearTimeout(timeout);
          handle?.remove();
          resolve();
        } else if (e.state === 3 || e.state === 5) {
          clearTimeout(timeout);
          handle?.remove();
          reject(new ScanError('Installation du scanner impossible.'));
        }
      }).then((h) => (handle = h));
      BarcodeScanner.installGoogleBarcodeScannerModule().catch((err: Error) => {
        clearTimeout(timeout);
        reject(new ScanError(err.message || 'Installation du scanner impossible.'));
      });
    });
  }
  try {
    const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.Ean13] });
    const codes = barcodes.map((b) => b.rawValue ?? '');
    if (!codes.length) return null;
    const isbn = pickIsbn(codes);
    if (!isbn) throw new ScanError('Ce code-barres n’est pas un ISBN de livre.');
    return isbn;
  } catch (e) {
    if (e instanceof ScanError) throw e;
    if (/cancel/i.test((e as Error).message ?? '')) return null;
    throw new ScanError((e as Error).message || 'Scan impossible.');
  }
}

export const canScanNative = () => isNative();
