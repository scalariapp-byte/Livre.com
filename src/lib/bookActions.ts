import { useLibrary } from '@/store/useLibrary';
import { toast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Confirm';
import { STATUS_META } from './constants';
import type { ReadingStatus } from '@/types';

/** Supprime un livre après confirmation, avec possibilité d'annuler. */
export async function deleteBookWithUndo(id: string): Promise<boolean> {
  const s = useLibrary.getState();
  const book = s.books.find((b) => b.id === id);
  if (!book) return false;
  const ok = await confirm({
    title: 'Supprimer ce livre ?',
    message: `« ${book.title} », ses notes et son historique de lecture seront supprimés.`,
    confirmLabel: 'Supprimer',
    danger: true,
  });
  if (!ok) return false;
  const snapshot = {
    book,
    sessions: s.sessions.filter((x) => x.bookId === id),
    plans: s.plans.filter((x) => x.bookId === id),
    loans: s.loans.filter((x) => x.bookId === id),
  };
  s.deleteBook(id);
  toast.success('Livre supprimé', { action: { label: 'Annuler', onClick: () => useLibrary.getState().restoreBook(snapshot) } });
  return true;
}

export function changeStatus(id: string, status: ReadingStatus) {
  const s = useLibrary.getState();
  const book = s.books.find((b) => b.id === id);
  if (!book || book.status === status) return;
  const prev = { status: book.status, currentPage: book.currentPage, startedAt: book.startedAt, finishedAt: book.finishedAt };
  const sessionsBefore = s.sessions.length;
  s.setStatus(id, status);
  const added = useLibrary.getState().sessions.slice(sessionsBefore).map((x) => x.id);
  const msg = status === 'finished' ? `Bravo ! « ${book.title} » est terminé 🎉` : `Déplacé vers « ${STATUS_META[status].label} »`;
  toast.success(msg, {
    action: {
      label: 'Annuler',
      onClick: () => {
        const st = useLibrary.getState();
        useLibrary.setState({
          books: st.books.map((b) => (b.id === id ? { ...b, ...prev } : b)),
          sessions: st.sessions.filter((x) => !added.includes(x.id)),
        });
      },
    },
  });
}
