import { CapacitorHttp } from '@capacitor/core';
import { isNative } from './platform';

/** Charge l'image de couverture de façon lisible par un canvas (sans « teinte » CORS). */
async function loadReadableImage(url: string): Promise<HTMLImageElement | null> {
  let src = url;
  if (!url.startsWith('data:') && isNative()) {
    // Application Android : téléchargement natif, sans restriction CORS.
    try {
      const res = await CapacitorHttp.get({ url, responseType: 'blob' });
      if (res.status >= 200 && res.status < 300 && typeof res.data === 'string') {
        const type = String(res.headers['Content-Type'] ?? res.headers['content-type'] ?? 'image/jpeg').split(';')[0];
        src = `data:${type};base64,${res.data}`;
      }
    } catch {
      /* repli sur le chargement classique */
    }
  }
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    const t = setTimeout(() => resolve(null), 10000);
    img.onload = () => {
      clearTimeout(t);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    img.src = src;
  });
}

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * Couleur dominante d'une couverture (pondérée par la saturation, pour éviter
 * de retenir le blanc du fond ou le noir du texte). null si l'image est illisible.
 */
export async function extractSpineColor(url: string): Promise<string | null> {
  const img = await loadReadableImage(url);
  if (!img || img.naturalWidth < 10) return null;
  const w = 24;
  const h = 36;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const buckets = new Map<number, { r: number; g: number; b: number; n: number; score: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const light = (max + min) / 2;
      // Les tons très clairs ou très sombres comptent moins.
      const weight = 0.25 + sat * 1.5 - (light > 235 ? 0.6 : 0) - (light < 18 ? 0.4 : 0);
      if (weight <= 0) continue;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const bk = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0, score: 0 };
      bk.r += r;
      bk.g += g;
      bk.b += b;
      bk.n += 1;
      bk.score += weight;
      buckets.set(key, bk);
    }
    let best: { r: number; g: number; b: number; n: number; score: number } | undefined;
    for (const bk of buckets.values()) if (!best || bk.score > best.score) best = bk;
    if (!best) {
      // Couverture presque monochrome : moyenne simple.
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) (r += data[i], g += data[i + 1], b += data[i + 2]);
      const n = data.length / 4;
      return hex(r / n, g / n, b / n);
    }
    return hex(best.r / best.n, best.g / best.n, best.b / best.n);
  } catch {
    return null; // canvas « teinté » : image d'un autre domaine sans CORS
  }
}

/** Couleur du texte lisible sur une tranche. */
export function spineInk(bg: string): string {
  const n = parseInt(bg.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#1c1714' : '#fbf7f1';
}

/** Assombrit / éclaircit une couleur hexadécimale (amount entre -1 et 1). */
export function shade(color: string, amount: number): string {
  const n = parseInt(color.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, amount < 0 ? c * (1 + amount) : c + (255 - c) * amount));
  return hex(f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255));
}
