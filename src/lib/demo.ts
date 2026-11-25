import type { Book, Loan, ReadingPlan, ReadingSession } from '@/types';
import { addDays, fromDayKey, toDayKey } from './dates';
import { uid } from './utils';

const olCover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

/** Générateur pseudo-aléatoire déterministe pour des données de démonstration stables. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

type Seed = Pick<Book, 'title' | 'authors' | 'genre' | 'pageCount' | 'isbn' | 'description' | 'publishedYear'>;

const SEEDS: Record<string, Seed> = {
  dune: {
    title: 'Dune',
    authors: ['Frank Herbert'],
    genre: 'Science-fiction',
    pageCount: 688,
    isbn: '9780441172719',
    publishedYear: '1965',
    description:
      "Sur la planète désertique Arrakis, seule source de l'épice la plus précieuse de l'univers, le jeune Paul Atréides voit sa famille trahie et doit survivre parmi les Fremen.",
  },
  hailmary: {
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    genre: 'Science-fiction',
    pageCount: 496,
    isbn: '9780593135204',
    publishedYear: '2021',
    description: "Ryland Grace se réveille seul à bord d'un vaisseau, sans souvenirs, avec la survie de l'humanité entre les mains.",
  },
  sapiens: {
    title: 'Sapiens',
    authors: ['Yuval Noah Harari'],
    genre: 'Histoire',
    pageCount: 464,
    isbn: '9780062316097',
    publishedYear: '2014',
    description: "Une brève histoire de l'humanité, des chasseurs-cueilleurs à la révolution scientifique.",
  },
  prince: {
    title: 'Le Petit Prince',
    authors: ['Antoine de Saint-Exupéry'],
    genre: 'Classique',
    pageCount: 104,
    isbn: '9782070612758',
    publishedYear: '1943',
    description: 'Un aviateur échoué dans le désert rencontre un petit prince venu d’une autre planète.',
  },
  etranger: {
    title: "L'Étranger",
    authors: ['Albert Camus'],
    genre: 'Roman',
    pageCount: 184,
    isbn: '9782070360024',
    publishedYear: '1942',
    description: "Meursault, employé de bureau à Alger, traverse l'existence avec une indifférence qui le mène au drame.",
  },
  hobbit: {
    title: 'The Hobbit',
    authors: ['J. R. R. Tolkien'],
    genre: 'Fantasy',
    pageCount: 300,
    isbn: '9780547928227',
    publishedYear: '1937',
    description: 'Bilbo Sacquet est entraîné par Gandalf et treize nains dans une quête pour reprendre un trésor gardé par un dragon.',
  },
  habits: {
    title: 'Atomic Habits',
    authors: ['James Clear'],
    genre: 'Développement personnel',
    pageCount: 320,
    isbn: '9780735211292',
    publishedYear: '2018',
    description: 'Une méthode concrète pour construire de bonnes habitudes et se défaire des mauvaises.',
  },
  wind: {
    title: 'The Name of the Wind',
    authors: ['Patrick Rothfuss'],
    genre: 'Fantasy',
    pageCount: 662,
    isbn: '9780756404741',
    publishedYear: '2007',
  },
  klara: {
    title: 'Klara and the Sun',
    authors: ['Kazuo Ishiguro'],
    genre: 'Roman',
    pageCount: 303,
    isbn: '9780593318171',
    publishedYear: '2021',
  },
  kahneman: {
    title: 'Thinking, Fast and Slow',
    authors: ['Daniel Kahneman'],
    genre: 'Psychologie',
    pageCount: 499,
    isbn: '9780374533557',
    publishedYear: '2011',
  },
  bovary: {
    title: 'Madame Bovary',
    authors: ['Gustave Flaubert'],
    genre: 'Classique',
    pageCount: 512,
    isbn: '9782070413119',
    publishedYear: '1857',
  },
  pride: {
    title: 'Pride and Prejudice',
    authors: ['Jane Austen'],
    genre: 'Romance',
    pageCount: 480,
    isbn: '9780141439518',
    publishedYear: '1813',
  },
  threebody: {
    title: 'The Three-Body Problem',
    authors: ['Liu Cixin'],
    genre: 'Science-fiction',
    pageCount: 400,
    isbn: '9780765382030',
    publishedYear: '2008',
  },
  circe: {
    title: 'Circe',
    authors: ['Madeline Miller'],
    genre: 'Fantasy',
    pageCount: 393,
    isbn: '9780316556347',
    publishedYear: '2018',
  },
};

export function buildDemoData(today = toDayKey()) {
  const rand = rng(42);
  const ts = new Date().toISOString();
  const books: Book[] = [];
  const sessions: ReadingSession[] = [];

  const make = (key: string, extra: Partial<Book>): Book => {
    const s = SEEDS[key];
    const book: Book = {
      ...s,
      id: uid(),
      coverUrl: s.isbn ? olCover(s.isbn) : undefined,
      status: 'toread',
      currentPage: 0,
      notes: [],
      favorite: false,
      addedAt: ts,
      updatedAt: ts,
      ...extra,
    };
    books.push(book);
    return book;
  };

  const iso = (day: string, h = 20) => {
    const d = fromDayKey(day);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };

  /** Répartit la lecture d'un livre sur une période en générant des sessions crédibles. */
  const spread = (book: Book, startDay: string, endDay: string, pages: number) => {
    const days: string[] = [];
    for (let d = startDay; d <= endDay; d = addDays(d, 1)) if (rand() > 0.25) days.push(d);
    if (!days.length) days.push(endDay);
    let left = pages;
    days.forEach((day, i) => {
      const share = i === days.length - 1 ? left : Math.min(left, Math.round((pages / days.length) * (0.6 + rand() * 0.8)));
      if (share <= 0) return;
      left -= share;
      sessions.push({
        id: uid(),
        bookId: book.id,
        date: day,
        pagesRead: share,
        minutes: Math.round(share * (1.4 + rand() * 0.8)),
        createdAt: iso(day),
      });
    });
  };

  // Livres terminés répartis sur l'année
  const finished: [string, number, number, Partial<Book>][] = [
    ['prince', 300, 296, { rating: 5, favorite: true }],
    ['etranger', 250, 244, { rating: 4 }],
    ['hobbit', 200, 186, { rating: 4.5, favorite: true }],
    ['habits', 150, 132, { rating: 4 }],
    ['klara', 110, 95, { rating: 3.5 }],
    ['sapiens', 75, 52, { rating: 4.5, review: 'Passionnant, une vraie mise en perspective de notre histoire.' }],
    ['pride', 40, 22, { rating: 5 }],
  ];
  for (const [key, startAgo, endAgo, extra] of finished) {
    const start = addDays(today, -startAgo);
    const end = addDays(today, -endAgo);
    const b = make(key, { status: 'finished', startedAt: iso(start), finishedAt: iso(end), addedAt: iso(addDays(start, -10)), ...extra });
    b.currentPage = b.pageCount;
    spread(b, start, end, b.pageCount);
  }

  // En cours
  const dune = make('dune', { status: 'reading', startedAt: iso(addDays(today, -18)), addedAt: iso(addDays(today, -30)), favorite: true });
  dune.currentPage = 412;
  spread(dune, addDays(today, -18), today, 412);
  dune.notes = [
    { id: uid(), text: 'La peur tue l’esprit. La peur est la petite mort qui conduit à l’oblitération totale.', page: 12, createdAt: iso(addDays(today, -17)) },
    { id: uid(), text: 'Le système écologique d’Arrakis est d’une richesse incroyable.', page: 288, createdAt: iso(addDays(today, -6)) },
  ];
  const hail = make('hailmary', { status: 'reading', startedAt: iso(addDays(today, -5)), addedAt: iso(addDays(today, -12)) });
  hail.currentPage = 138;
  spread(hail, addDays(today, -5), addDays(today, -1), 138);

  // À lire
  make('threebody', { status: 'toread', priority: 1, addedAt: iso(addDays(today, -9)) });
  make('wind', { status: 'toread', priority: 2, addedAt: iso(addDays(today, -20)) });
  make('kahneman', { status: 'toread', priority: 3, addedAt: iso(addDays(today, -40)) });

  // Liste de souhaits
  make('circe', { status: 'wishlist', priority: 1, price: 9.9, addedAt: iso(addDays(today, -3)) });
  make('bovary', { status: 'wishlist', priority: 2, price: 4.5, addedAt: iso(addDays(today, -15)) });

  const byKey = (title: string) => books.find((b) => b.title === title)!;
  const loans: Loan[] = [
    {
      id: uid(),
      direction: 'lent',
      bookId: byKey('The Hobbit').id,
      title: 'The Hobbit',
      author: 'J. R. R. Tolkien',
      coverUrl: byKey('The Hobbit').coverUrl,
      person: 'Camille',
      startDate: addDays(today, -21),
      dueDate: addDays(today, 3),
      createdAt: ts,
    },
    {
      id: uid(),
      direction: 'borrowed',
      title: 'Le Comte de Monte-Cristo',
      author: 'Alexandre Dumas',
      person: 'Médiathèque',
      startDate: addDays(today, -25),
      dueDate: addDays(today, -2),
      note: 'Carte n° 2231',
      createdAt: ts,
    },
    {
      id: uid(),
      direction: 'lent',
      bookId: byKey('Sapiens').id,
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      coverUrl: byKey('Sapiens').coverUrl,
      person: 'Hugo',
      startDate: addDays(today, -60),
      dueDate: addDays(today, -30),
      returnedAt: iso(addDays(today, -28)),
      createdAt: ts,
    },
  ];

  const plans: ReadingPlan[] = [
    { id: uid(), bookId: dune.id, title: 'Dune', date: today, time: '21:00', durationMin: 45, done: false, createdAt: ts },
    { id: uid(), bookId: hail.id, title: 'Project Hail Mary', date: addDays(today, 1), time: '07:30', durationMin: 30, done: false, createdAt: ts },
    { id: uid(), bookId: dune.id, title: 'Dune', date: addDays(today, 2), time: '21:00', durationMin: 60, done: false, createdAt: ts },
    { id: uid(), title: 'Club de lecture', date: addDays(today, 5), time: '19:00', durationMin: 90, done: false, note: 'Discussion sur Dune', createdAt: ts },
    { id: uid(), bookId: dune.id, title: 'Dune', date: addDays(today, -1), time: '21:00', durationMin: 45, done: true, createdAt: ts },
  ];

  return { books, sessions, plans, loans };
}
