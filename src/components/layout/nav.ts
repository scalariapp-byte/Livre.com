import { BarChart3, BookCheck, BookOpen, BookmarkPlus, CalendarDays, FolderHeart, Gift, Library, Repeat2, Settings } from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Accueil', icon: BookOpen },
  { to: '/library', label: 'Ma bibliothèque', short: 'Biblio', icon: Library },
  { to: '/to-read', label: 'À lire', icon: BookmarkPlus },
  { to: '/wishlist', label: 'Liste de souhaits', short: 'Souhaits', icon: Gift },
  { to: '/collections', label: 'Collections', icon: FolderHeart },
  { to: '/loans', label: 'Prêts & emprunts', short: 'Prêts', icon: Repeat2 },
  { to: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { to: '/finished', label: 'Livres lus', icon: BookCheck },
  { to: '/stats', label: 'Statistiques', icon: BarChart3 },
  { to: '/settings', label: 'Profil & réglages', short: 'Profil', icon: Settings },
] as const;
