import { ImagePlus, Link2, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import type { Book, ReadingStatus } from '@/types';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { BookCover } from './BookCover';
import { GENRES, STATUS_META, STATUS_ORDER } from '@/lib/constants';
import { bookFormSchema, fieldErrors } from '@/lib/schemas';
import { compressImage } from '@/lib/image';
import { isoToDayKey, toDayKey, fromDayKey } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import type { NewBook } from '@/store/useLibrary';

export type BookDraft = Partial<Book>;

interface Props {
  initial: BookDraft;
  submitLabel: string;
  onSubmit: (data: NewBook) => void;
  onCancel?: () => void;
  formId?: string;
}

const dayToIso = (day?: string) => {
  if (!day) return undefined;
  const d = fromDayKey(day);
  d.setHours(12);
  return d.toISOString();
};

export function BookForm({ initial, submitLabel, onSubmit, onCancel, formId = 'book-form' }: Props) {
  const [v, setV] = useState({
    title: initial.title ?? '',
    authors: (initial.authors ?? []).join(', '),
    genre: initial.genre ?? '',
    pageCount: initial.pageCount ? String(initial.pageCount) : '',
    currentPage: String(initial.currentPage ?? 0),
    status: (initial.status ?? 'toread') as ReadingStatus,
    description: initial.description ?? '',
    coverUrl: initial.coverUrl ?? '',
    isbn: initial.isbn ?? '',
    publisher: initial.publisher ?? '',
    publishedYear: initial.publishedYear ?? '',
    rating: initial.rating,
    startedAt: isoToDayKey(initial.startedAt) ?? '',
    finishedAt: isoToDayKey(initial.finishedAt) ?? '',
    priority: initial.priority,
    price: initial.price !== undefined ? String(initial.price) : '',
    purchaseUrl: initial.purchaseUrl ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUrl, setShowUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      set('coverUrl', await compressImage(file));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = bookFormSchema.safeParse({
      ...v,
      pageCount: v.pageCount || 0,
      currentPage: v.currentPage || 0,
      startedAt: v.startedAt || undefined,
      finishedAt: v.finishedAt || undefined,
      coverUrl: v.coverUrl || undefined,
      isbn: v.isbn || undefined,
      publishedYear: v.publishedYear || undefined,
      purchaseUrl: v.purchaseUrl || undefined,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error('Vérifiez les champs signalés');
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`#${formId} [aria-invalid="true"]`);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    const d = parsed.data;
    const status = d.status;
    onSubmit({
      title: d.title,
      authors: d.authors.split(/[,;]/).map((a) => a.trim()).filter(Boolean),
      genre: d.genre || undefined,
      pageCount: d.pageCount,
      currentPage: status === 'reading' ? d.currentPage : status === 'finished' ? d.pageCount : 0,
      status,
      description: d.description?.trim() || undefined,
      coverUrl: d.coverUrl || undefined,
      isbn: d.isbn?.replace(/[\s-]/g, '') || undefined,
      publisher: d.publisher || undefined,
      publishedYear: d.publishedYear || undefined,
      rating: status === 'finished' || status === 'abandoned' ? d.rating : initial.rating,
      startedAt:
        status === 'reading' || status === 'finished' || status === 'abandoned' ? dayToIso(d.startedAt) ?? initial.startedAt : undefined,
      finishedAt: status === 'finished' ? dayToIso(d.finishedAt) ?? initial.finishedAt : undefined,
      priority: d.priority,
      price: d.price,
      purchaseUrl: d.purchaseUrl || undefined,
      subtitle: initial.subtitle,
      language: initial.language,
    });
  };

  const isReading = v.status === 'reading';
  const isFinished = v.status === 'finished';
  const showDates = isReading || isFinished || v.status === 'abandoned';

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="flex gap-4">
        <div className="relative">
          <BookCover title={v.title || 'Nouveau livre'} author={v.authors.split(',')[0]} src={v.coverUrl || undefined} size="lg" />
          {uploading && <div className="absolute inset-0 animate-pulse rounded-[10px] bg-surface/60" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-2">
          <p className="label">Couverture</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" size="sm" icon={<ImagePlus className="size-4" />} onClick={() => fileRef.current?.click()} loading={uploading}>
            Importer une image
          </Button>
          <Button variant="ghost" size="sm" icon={<Link2 className="size-4" />} onClick={() => setShowUrl((s) => !s)}>
            Depuis une URL
          </Button>
          {v.coverUrl && (
            <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={() => set('coverUrl', '')} className="text-danger hover:text-danger">
              Retirer
            </Button>
          )}
        </div>
      </div>
      {showUrl && (
        <Field label="URL de la couverture" error={errors.coverUrl}>
          {(id) => (
            <Input id={id} placeholder="https://…" value={v.coverUrl.startsWith('data:') ? '' : v.coverUrl} onChange={(e) => set('coverUrl', e.target.value)} invalid={!!errors.coverUrl} />
          )}
        </Field>
      )}

      <Field label="Titre" error={errors.title}>
        {(id) => <Input id={id} value={v.title} onChange={(e) => set('title', e.target.value)} invalid={!!errors.title} placeholder="Ex. Le Petit Prince" data-autofocus />}
      </Field>
      <Field label="Auteur(s)" hint="Séparez plusieurs auteurs par une virgule" error={errors.authors}>
        {(id) => <Input id={id} value={v.authors} onChange={(e) => set('authors', e.target.value)} placeholder="Ex. Antoine de Saint-Exupéry" />}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Genre" error={errors.genre}>
          {(id) => (
            <>
              <Input id={id} list="genres" value={v.genre} onChange={(e) => set('genre', e.target.value)} placeholder="Choisir…" />
              <datalist id="genres">
                {GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label="Pages" error={errors.pageCount}>
          {(id) => <Input id={id} type="number" inputMode="numeric" min={0} value={v.pageCount} onChange={(e) => set('pageCount', e.target.value)} invalid={!!errors.pageCount} placeholder="0" />}
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-2">Statut</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('status', s)}
              aria-pressed={v.status === s}
              className={cn(
                'h-9 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-95',
                v.status === s ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-2 hover:border-ink/30',
              )}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {isReading && (
        <Field label="Page actuelle" error={errors.currentPage}>
          {(id) => <Input id={id} type="number" inputMode="numeric" min={0} value={v.currentPage} onChange={(e) => set('currentPage', e.target.value)} invalid={!!errors.currentPage} />}
        </Field>
      )}

      {showDates && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début" error={errors.startedAt} optional>
            {(id) => <Input id={id} type="date" max={toDayKey()} value={v.startedAt} onChange={(e) => set('startedAt', e.target.value)} />}
          </Field>
          {isFinished && (
            <Field label="Fin" error={errors.finishedAt} optional>
              {(id) => <Input id={id} type="date" max={toDayKey()} value={v.finishedAt} onChange={(e) => set('finishedAt', e.target.value)} invalid={!!errors.finishedAt} />}
            </Field>
          )}
        </div>
      )}

      {(isFinished || v.status === 'abandoned') && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Ma note</p>
          <Rating value={v.rating} onChange={(r) => set('rating', r)} size={28} />
        </div>
      )}

      {(v.status === 'wishlist' || v.status === 'toread') && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priorité">
            {(id) => (
              <Select id={id} value={v.priority ?? ''} onChange={(e) => set('priority', e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined)}>
                <option value="">Aucune</option>
                <option value="1">Haute</option>
                <option value="2">Moyenne</option>
                <option value="3">Basse</option>
              </Select>
            )}
          </Field>
          {v.status === 'wishlist' && (
            <Field label="Prix (€)" error={errors.price} optional>
              {(id) => <Input id={id} inputMode="decimal" value={v.price} onChange={(e) => set('price', e.target.value)} invalid={!!errors.price} placeholder="0,00" />}
            </Field>
          )}
        </div>
      )}
      {v.status === 'wishlist' && (
        <Field label="Lien d'achat" error={errors.purchaseUrl} optional>
          {(id) => <Input id={id} type="url" value={v.purchaseUrl} onChange={(e) => set('purchaseUrl', e.target.value)} invalid={!!errors.purchaseUrl} placeholder="https://" />}
        </Field>
      )}

      <Field label="Description" error={errors.description} optional>
        {(id) => <Textarea id={id} value={v.description} onChange={(e) => set('description', e.target.value)} placeholder="Résumé, 4e de couverture…" />}
      </Field>

      <details className="group rounded-2xl border border-line/80 px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink-2">
          Informations d'édition
          <span className="text-muted transition group-open:rotate-45">+</span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="ISBN" error={errors.isbn} className="col-span-2">
            {(id) => <Input id={id} inputMode="numeric" value={v.isbn} onChange={(e) => set('isbn', e.target.value)} invalid={!!errors.isbn} />}
          </Field>
          <Field label="Éditeur">{(id) => <Input id={id} value={v.publisher} onChange={(e) => set('publisher', e.target.value)} />}</Field>
          <Field label="Année" error={errors.publishedYear}>
            {(id) => <Input id={id} inputMode="numeric" value={v.publishedYear} onChange={(e) => set('publishedYear', e.target.value)} invalid={!!errors.publishedYear} />}
          </Field>
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <Button variant="outline" size="lg" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-[2]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
