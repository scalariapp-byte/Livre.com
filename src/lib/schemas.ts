import { z } from 'zod';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide');
const optStr = z.string().optional();
const status = z.enum(['reading', 'toread', 'wishlist', 'finished', 'abandoned']);

export const bookFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire').max(300, 'Titre trop long'),
    authors: z.string().trim().max(300, 'Trop long'),
    genre: z.string().trim().max(60).optional(),
    pageCount: z.coerce
      .number({ invalid_type_error: 'Nombre invalide' })
      .int('Nombre entier attendu')
      .min(0, 'Doit être positif')
      .max(20000, 'Nombre de pages irréaliste'),
    currentPage: z.coerce.number().int().min(0, 'Doit être positif').max(20000),
    status,
    description: z.string().max(10000, 'Description trop longue').optional(),
    coverUrl: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^(https:\/\/|data:image\/)/.test(v), 'URL https ou image importée attendue'),
    isbn: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^[\dXx-\s]{10,17}$/.test(v), 'ISBN invalide'),
    publisher: z.string().trim().max(200).optional(),
    publishedYear: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^\d{3,4}$/.test(v), 'Année invalide'),
    rating: z.number().min(0).max(5).optional(),
    series: z.string().trim().max(120, 'Trop long').optional(),
    seriesIndex: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
      z.number({ invalid_type_error: 'Numéro invalide' }).int('Nombre entier').min(1, 'Dès 1').max(999).optional(),
    ),
    shelfIds: z.array(z.string()).optional(),
    startedAt: z.string().optional(),
    finishedAt: z.string().optional(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    price: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? undefined : Number(String(v).replace(',', '.'))),
      z.number({ invalid_type_error: 'Prix invalide' }).min(0, 'Prix invalide').max(100000).optional(),
    ),
    purchaseUrl: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^https?:\/\//.test(v), 'Lien invalide (http/https)'),
  })
  .superRefine((v, ctx) => {
    if (v.pageCount > 0 && v.currentPage > v.pageCount)
      ctx.addIssue({ code: 'custom', path: ['currentPage'], message: 'Dépasse le nombre de pages' });
    if (v.startedAt && v.finishedAt && v.finishedAt < v.startedAt)
      ctx.addIssue({ code: 'custom', path: ['finishedAt'], message: 'Antérieure à la date de début' });
  });

export type BookFormValues = z.input<typeof bookFormSchema>;

export const loanFormSchema = z
  .object({
    direction: z.enum(['lent', 'borrowed']),
    bookId: optStr,
    title: z.string().trim().min(1, 'Indiquez le livre'),
    author: z.string().trim().max(200).optional(),
    person: z.string().trim().min(1, 'Indiquez la personne').max(120),
    startDate: day,
    dueDate: day.optional().or(z.literal('')),
    note: z.string().max(1000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.dueDate && v.dueDate < v.startDate)
      ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Antérieure à la date du prêt' });
  });

export const planFormSchema = z.object({
  bookId: optStr,
  title: z.string().trim().min(1, 'Ajoutez un titre').max(200),
  date: day,
  time: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{2}:\d{2}$/.test(v), 'Heure invalide'),
  durationMin: z.coerce.number().int().min(5, '5 minutes minimum').max(720, '12 h maximum'),
  note: z.string().max(500).optional(),
});

export const sessionFormSchema = z.object({
  date: day,
  minutes: z.coerce.number().int().min(0, 'Doit être positif').max(1440, '24 h maximum'),
  toPage: z.coerce.number().int().min(0, 'Doit être positif'),
});

// ---- Import / export ----

const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: optStr,
  authors: z.array(z.string()).default([]),
  description: optStr,
  genre: optStr,
  pageCount: z.number().default(0),
  coverUrl: optStr,
  isbn: optStr,
  publisher: optStr,
  publishedYear: optStr,
  language: optStr,
  status,
  currentPage: z.number().default(0),
  percent: z.number().optional(),
  coverChecked: z.boolean().optional(),
  genreChecked: z.boolean().optional(),
  spineColor: optStr,
  order: z.number().optional(),
  spineFor: optStr,
  series: optStr,
  seriesIndex: z.number().optional(),
  shelfIds: z.array(z.string()).optional(),
  reflection: z
    .object({
      moods: z.array(z.string()).default([]),
      ending: z.enum(['loved', 'mixed', 'disliked']).optional(),
      pace: z.enum(['slow', 'balanced', 'fast']).optional(),
      recommend: z.enum(['yes', 'maybe', 'no']).optional(),
      reread: z.boolean().optional(),
      answers: z.record(z.string()).default({}),
      summary: optStr,
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .optional(),
  rating: z.number().optional(),
  review: optStr,
  notes: z
    .array(z.object({ id: z.string(), text: z.string(), page: z.number().optional(), createdAt: z.string() }))
    .default([]),
  favorite: z.boolean().default(false),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  price: z.number().optional(),
  purchaseUrl: optStr,
  addedAt: z.string(),
  updatedAt: z.string(),
  startedAt: optStr,
  finishedAt: optStr,
});

export const backupSchema = z.object({
  app: z.literal('livre'),
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    books: z.array(bookSchema),
    sessions: z.array(
      z.object({
        id: z.string(),
        bookId: z.string(),
        date: day,
        minutes: z.number(),
        pagesRead: z.number(),
        createdAt: z.string(),
      }),
    ),
    plans: z.array(
      z.object({
        id: z.string(),
        bookId: optStr,
        title: z.string(),
        date: day,
        time: optStr,
        durationMin: z.number(),
        done: z.boolean(),
        note: optStr,
        createdAt: z.string(),
      }),
    ),
    loans: z.array(
      z.object({
        id: z.string(),
        direction: z.enum(['lent', 'borrowed']),
        bookId: optStr,
        title: z.string(),
        author: optStr,
        coverUrl: optStr,
        person: z.string(),
        startDate: day,
        dueDate: optStr,
        returnedAt: optStr,
        note: optStr,
        createdAt: z.string(),
      }),
    ),
    shelves: z.array(z.object({ id: z.string(), name: z.string(), emoji: optStr, createdAt: z.string() })).default([]),
    settings: z
      .object({
        name: z.string(),
        avatar: optStr,
        theme: z.enum(['system', 'light', 'sepia', 'rose', 'mint', 'dark', 'midnight', 'forest', 'amoled']),
        accent: z.enum(['terracotta', 'ink', 'sage', 'plum', 'ocean', 'amber']),
        yearlyGoal: z.number(),
        dailyPagesGoal: z.number(),
        dailyMinutesGoal: z.number(),
        notifications: z.boolean(),
        reduceMotion: z.boolean().default(false),
        onboarded: z.boolean(),
        createdAt: z.string(),
      })
      .partial(),
  }),
});

export type Backup = z.infer<typeof backupSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = issue.path.join('.');
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
