/** Génère un fichier iCalendar (.ics) pour ajouter un rappel au calendrier du téléphone. */
function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadIcs(opts: { uid: string; title: string; description?: string; date: string; time?: string; durationMin?: number; alarmMinutesBefore?: number }) {
  const [y, m, d] = opts.date.split('-');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Livre//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${opts.uid}@livre.app`, `DTSTAMP:${stamp}`];
  if (opts.time) {
    const [hh, mm] = opts.time.split(':');
    const start = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
    const end = new Date(start.getTime() + (opts.durationMin ?? 30) * 60000);
    const fmt = (dt: Date) =>
      `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}${String(dt.getMinutes()).padStart(2, '0')}00`;
    lines.push(`DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`);
  } else {
    const next = new Date(Number(y), Number(m) - 1, Number(d) + 1);
    const n = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`;
    lines.push(`DTSTART;VALUE=DATE:${y}${m}${d}`, `DTEND;VALUE=DATE:${n}`);
  }
  lines.push(`SUMMARY:${esc(opts.title)}`);
  if (opts.description) lines.push(`DESCRIPTION:${esc(opts.description)}`);
  lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(opts.title)}`, `TRIGGER:-PT${opts.alarmMinutesBefore ?? (opts.time ? 15 : 0)}M`, 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${opts.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
