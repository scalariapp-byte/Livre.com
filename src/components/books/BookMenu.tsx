import { BookOpen, BookmarkPlus, CheckCircle2, FolderPlus, Heart, MoreHorizontal, Pencil, Sparkles, Trash2, XCircle } from 'lucide-react';
import type { Book } from '@/types';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { IconButton } from '@/components/ui/Button';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { changeStatus, deleteBookWithUndo } from '@/lib/bookActions';

export function useBookMenuItems(book: Book, onDeleted?: () => void): (MenuItem | 'divider')[] {
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const setEditBook = useUI((s) => s.setEditBook);
  const setProgressBook = useUI((s) => s.setProgressBook);
  const setShelfPicker = useUI((s) => s.setShelfPicker);
  const items: (MenuItem | 'divider')[] = [];
  if (book.status === 'reading') items.push({ label: 'Mettre à jour la progression', icon: <BookOpen />, onSelect: () => setProgressBook(book.id) });
  if (book.status !== 'reading' && book.status !== 'finished')
    items.push({ label: 'Commencer la lecture', icon: <BookOpen />, onSelect: () => changeStatus(book.id, 'reading') });
  if (book.status === 'finished') items.push({ label: 'Relire', icon: <BookOpen />, onSelect: () => changeStatus(book.id, 'reading') });
  if (book.status !== 'finished') items.push({ label: 'Marquer comme lu', icon: <CheckCircle2 />, onSelect: () => changeStatus(book.id, 'finished') });
  if (book.status !== 'toread' && book.status !== 'reading') items.push({ label: 'Ajouter à « À lire »', icon: <BookmarkPlus />, onSelect: () => changeStatus(book.id, 'toread') });
  if (book.status !== 'wishlist' && book.status !== 'finished') items.push({ label: 'Liste de souhaits', icon: <Sparkles />, onSelect: () => changeStatus(book.id, 'wishlist') });
  if (book.status === 'reading') items.push({ label: 'Abandonner', icon: <XCircle />, onSelect: () => changeStatus(book.id, 'abandoned') });
  items.push('divider');
  items.push({ label: book.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris', icon: <Heart />, onSelect: () => toggleFavorite(book.id) });
  items.push({ label: 'Ajouter à une collection', icon: <FolderPlus />, onSelect: () => setShelfPicker(book.id) });
  items.push({ label: 'Modifier', icon: <Pencil />, onSelect: () => setEditBook(book.id) });
  items.push({
    label: 'Supprimer',
    icon: <Trash2 />,
    danger: true,
    onSelect: async () => {
      if (await deleteBookWithUndo(book.id)) onDeleted?.();
    },
  });
  return items;
}

export function BookMenu({ book, onDeleted, variant = 'ghost' }: { book: Book; onDeleted?: () => void; variant?: 'ghost' | 'soft' }) {
  const items = useBookMenuItems(book, onDeleted);
  return (
    <Menu
      items={items}
      trigger={(p) => (
        <IconButton
          label="Actions"
          size="sm"
          variant={variant}
          {...p}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            p.onClick();
          }}
        >
          <MoreHorizontal className="size-[18px]" />
        </IconButton>
      )}
    />
  );
}
