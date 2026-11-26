import { beforeEach, describe, expect, it } from 'vitest';
import { clear } from 'idb-keyval';
import { useLibrary } from '@/store/useLibrary';
import { listSnapshots, restoreSnapshot, runAutoBackup } from '@/lib/autoBackup';

const st = () => useLibrary.getState();

beforeEach(async () => {
  await clear();
  st().resetAll();
  st().updateSettings({ onboarded: true });
});

describe('sauvegarde automatique', () => {
  it('crée une copie par jour et permet de la restaurer', async () => {
    st().addBook({ title: 'Dune', pageCount: 600, status: 'reading' });
    expect(await runAutoBackup()).toBe(true);
    expect(await runAutoBackup()).toBe(false); // déjà faite aujourd'hui
    const [snap] = await listSnapshots();
    expect(snap.books).toBe(1);
    st().deleteBook(st().books[0].id);
    expect(st().books).toHaveLength(0);
    await restoreSnapshot(snap.at);
    expect(st().books.map((b) => b.title)).toEqual(['Dune']);
  });
  it('ne sauvegarde pas une bibliothèque vide et respecte le réglage', async () => {
    expect(await runAutoBackup()).toBe(false);
    st().addBook({ title: 'A' });
    st().updateSettings({ autoBackup: false });
    expect(await runAutoBackup()).toBe(false);
    expect(await runAutoBackup(true)).toBe(true);
  });
});
