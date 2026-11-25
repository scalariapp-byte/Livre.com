/**
 * Détecte la série et le numéro de tome dans un titre importé, par exemple :
 * « Seasons Tome 3 : Un printemps pour te succomber », « Harry Potter, T. 1 »,
 * « Dune (Volume 2) », « Les Rougon-Macquart, n° 7 ».
 */
const RE = /^(.{2,80}?)[\s,.:;–—-]*\(?\s*(?:tome|t\.|vol(?:ume)?\.?|livre|book|n°|no\.?|#)\s*(\d{1,3})\b\)?/i;

export function detectSeries(title: string, subtitle?: string): { series: string; index: number } | null {
  for (const text of [title, subtitle, subtitle ? `${title} ${subtitle}` : undefined]) {
    if (!text) continue;
    const m = RE.exec(text.trim());
    if (m) {
      const series = m[1].replace(/[\s,.:;–—(-]+$/, '').trim();
      const index = Number(m[2]);
      if (series.length >= 2 && index > 0 && index < 500) return { series, index };
    }
  }
  return null;
}

/** Libellé court « Seasons · Tome 3 ». */
export const seriesLabel = (series: string, index?: number) => (index ? `${series} · Tome ${index}` : series);
