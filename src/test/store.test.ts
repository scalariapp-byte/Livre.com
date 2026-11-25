import { beforeEach, describe, expect, it } from 'vitest';
import { useLibrary } from '@/store/useLibrary';
import { toDayKey } from '@/lib/dates';
import { backupSchema, bookFormSchema } from '@/lib/schemas';
import { computeAlerts } from '@/lib/alerts';
import { buildDemoData } from '@/lib/demo';

const st = () => useLibrary.getState();

beforeEach(() => st().resetAll());

describe('règles métier du store', () => {
  it('ajoute un livre en cours sans compter les pages lues avant le suivi', () => {
    const id = st().addBook({ title: 'Dune', pageCount: 600, status: 'reading', currentPage: 50 });
    const b = st().books.find((x) => x.id === id)!;
    expect(b.startedAt).toBeDefined();
    expect(b.currentPage).toBe(50);
    expect(st().sessions).toHaveLength(0);
  });

  it('compte un livre ajouté comme terminé à sa date de fin', () => {
    st().addBook({ title: 'Lu', pageCount: 300, status: 'finished', finishedAt: '2026-03-10T12:00:00.000Z' });
    expect(st().sessions).toHaveLength(1);
    expect(st().sessions[0]).toMatchObject({ pagesRead: 300, date: '2026-03-10' });
  });

  it('crée une session uniquement pour les progrès positifs', () => {
    const id = st().addBook({ title: 'A', pageCount: 300, status: 'reading' });
    st().setProgress(id, 40, { minutes: 25 });
    st().setProgress(id, 30);
    expect(st().sessions.map((x) => x.pagesRead)).toEqual([40]);
    expect(st().sessions[0].minutes).toBe(25);
    expect(st().books[0].currentPage).toBe(30);
  });

  it('termine automatiquement un livre arrivé à la dernière page', () => {
    const id = st().addBook({ title: 'B', pageCount: 100, status: 'reading' });
    st().setProgress(id, 100);
    const b = st().books.find((x) => x.id === id)!;
    expect(b.status).toBe('finished');
    expect(b.finishedAt).toBeDefined();
  });

  it('marquer comme lu complète les pages restantes', () => {
    const id = st().addBook({ title: 'C', pageCount: 200, status: 'reading', currentPage: 120 });
    st().setStatus(id, 'finished');
    expect(st().books[0].currentPage).toBe(200);
    expect(st().sessions.reduce((a, x) => a + x.pagesRead, 0)).toBe(80);
  });

  it('démarre la lecture si on saisit une progression sur un livre « à lire »', () => {
    const id = st().addBook({ title: 'D', pageCount: 200 });
    expect(st().books[0].status).toBe('toread');
    st().setProgress(id, 10);
    expect(st().books[0].status).toBe('reading');
  });

  it('supprime un livre et ses sessions, puis le restaure', () => {
    const id = st().addBook({ title: 'E', pageCount: 100, status: 'reading', currentPage: 10 });
    st().addLoan({ direction: 'lent', bookId: id, title: 'E', person: 'Léa', startDate: toDayKey() });
    st().setProgress(id, 20);
    const snap = { book: st().books[0], sessions: [...st().sessions], plans: [], loans: [...st().loans] };
    expect(snap.sessions).toHaveLength(1);
    st().deleteBook(id);
    expect(st().books).toHaveLength(0);
    expect(st().sessions).toHaveLength(0);
    expect(st().loans[0].bookId).toBeUndefined();
    st().restoreBook(snap);
    expect(st().books).toHaveLength(1);
    expect(st().loans[0].bookId).toBe(id);
  });

  it('gère le minuteur (pause / reprise)', () => {
    const id = st().addBook({ title: 'F', pageCount: 100 });
    st().startTimer(id);
    expect(st().books[0].status).toBe('reading');
    st().pauseTimer();
    expect(st().timer?.runningSince).toBeNull();
    st().resumeTimer();
    expect(st().timer?.runningSince).not.toBeNull();
    st().cancelTimer();
    expect(st().timer).toBeNull();
  });

  it('exporte une sauvegarde valide et la réimporte', () => {
    st().loadDemo(buildDemoData());
    const backup = st().exportBackup();
    const parsed = backupSchema.parse(JSON.parse(JSON.stringify(backup)));
    const n = st().books.length;
    st().resetAll();
    st().importBackup(parsed, 'replace');
    expect(st().books).toHaveLength(n);
    st().importBackup(parsed, 'merge');
    expect(st().books).toHaveLength(n);
  });
});

describe('validation', () => {
  it('refuse une page actuelle supérieure au total', () => {
    const r = bookFormSchema.safeParse({ title: 'X', authors: '', pageCount: 100, currentPage: 150, status: 'reading' });
    expect(r.success).toBe(false);
  });
  it('refuse un titre vide et une URL non https', () => {
    const r = bookFormSchema.safeParse({ title: ' ', authors: '', pageCount: 0, currentPage: 0, status: 'toread', coverUrl: 'javascript:alert(1)' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['title', 'coverUrl']));
  });
});

describe('alertes', () => {
  it('signale les prêts en retard et à échéance proche', () => {
    const now = new Date(2026, 10, 25, 10);
    const alerts = computeAlerts(
      {
        loans: [
          { id: '1', direction: 'lent', title: 'A', person: 'X', startDate: '2026-10-01', dueDate: '2026-11-20', createdAt: '' },
          { id: '2', direction: 'borrowed', title: 'B', person: 'Y', startDate: '2026-11-01', dueDate: '2026-11-27', createdAt: '' },
          { id: '3', direction: 'lent', title: 'C', person: 'Z', startDate: '2026-11-01', dueDate: '2026-11-20', returnedAt: '2026-11-19', createdAt: '' },
        ],
        plans: [],
        sessions: [],
        settings: st().settings,
      },
      now,
    );
    expect(alerts.map((a) => a.kind)).toEqual(['loan-overdue', 'loan-due']);
  });
});

describe('progression en % et bilan', () => {
  it('convertit un pourcentage en pages quand le total est connu', () => {
    const id = st().addBook({ title: 'P', pageCount: 400, status: 'reading' });
    st().setPercent(id, 25, { minutes: 20 });
    expect(st().books[0].currentPage).toBe(100);
    expect(st().sessions[0]).toMatchObject({ pagesRead: 100, minutes: 20 });
  });
  it('suit un livre sans nombre de pages en % et le termine à 100 %', () => {
    const id = st().addBook({ title: 'Liseuse', status: 'toread' });
    st().setPercent(id, 40, { minutes: 15 });
    let b = st().books[0];
    expect(b.status).toBe('reading');
    expect(b.percent).toBe(40);
    expect(st().sessions[0]).toMatchObject({ pagesRead: 0, minutes: 15 });
    st().setPercent(id, 100);
    b = st().books[0];
    expect(b.status).toBe('finished');
  });
  it('enregistre un bilan et le conserve à l’export', () => {
    const id = st().addBook({ title: 'Fini', pageCount: 100, status: 'finished' });
    st().saveReflection(id, { moods: ['moved'], ending: 'loved', answers: { favorite: 'Le style' }, summary: 'Superbe' });
    const backup = backupSchema.parse(JSON.parse(JSON.stringify(st().exportBackup())));
    expect(backup.data.books[0].reflection).toMatchObject({ moods: ['moved'], ending: 'loved', answers: { favorite: 'Le style' } });
  });
});
