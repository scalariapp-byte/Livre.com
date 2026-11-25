import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useLibrary } from '@/store/useLibrary';
import { useUI } from '@/store/useUI';
import { cn } from '@/lib/utils';

export const SHELF_EMOJIS = ['📚', '❤️', '⭐', '🌙', '☀️', '🏖️', '🎄', '🔥', '🧠', '🌸', '🎁', '🏆'];

/** Choix des collections d'un livre (cases à cocher + création rapide). */
export function ShelfPicker() {
  const bookId = useUI((s) => s.shelfPickerBookId);
  const setId = useUI((s) => s.setShelfPicker);
  const book = useLibrary((s) => s.books.find((b) => b.id === bookId));
  const shelves = useLibrary((s) => s.shelves);
  const { toggleShelf, addShelf } = useLibrary.getState();
  const [name, setName] = useState('');

  const create = () => {
    if (!name.trim() || !book) return;
    const id = addShelf(name);
    toggleShelf(book.id, id, true);
    toast.success(`Collection « ${name.trim()} » créée`);
    setName('');
  };

  return (
    <Sheet open={!!book} onClose={() => setId(null)} title="Ajouter à une collection" description={book?.title} size="sm">
      {book && (
        <div className="space-y-4">
          {shelves.length > 0 ? (
            <ul className="space-y-1.5">
              {shelves.map((sh) => {
                const on = book.shelfIds?.includes(sh.id) ?? false;
                return (
                  <li key={sh.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleShelf(book.id, sh.id)}
                      className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]', on ? 'border-accent bg-accent/8' : 'border-line')}
                    >
                      <span className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-lg">{sh.emoji ?? '📚'}</span>
                      <span className="flex-1 font-medium">{sh.name}</span>
                      <span className={cn('flex size-6 items-center justify-center rounded-full border-2', on ? 'border-accent bg-accent text-accent-ink' : 'border-line')}>
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">Vous n’avez pas encore de collection. Créez-en une : « Coups de cœur », « Vacances 2026 », « À offrir »…</p>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <div className="flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle collection" maxLength={60} aria-label="Nom de la nouvelle collection" />
            </div>
            <Button type="submit" variant="soft" icon={<Plus className="size-4" />} disabled={!name.trim()}>
              Créer
            </Button>
          </form>
          <Button block size="lg" onClick={() => setId(null)}>
            Terminé
          </Button>
        </div>
      )}
    </Sheet>
  );
}
