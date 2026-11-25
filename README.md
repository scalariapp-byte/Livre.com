# Livre — bibliothèque personnelle & suivi de lecture

Application web progressive (PWA) mobile-first : bibliothèque, suivi de lecture, statistiques, prêts et calendrier. Installable sur iPhone/Android (« Ajouter à l'écran d'accueil »), utilisable hors ligne.

## Démarrer

```bash
npm install
npm run dev        # développement  → http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run build      # typecheck + build de production dans dist/
npm run preview    # sert le build (service worker actif)
```

## Fonctionnalités

- **Accueil** : salutation, objectif du jour (pages/minutes), série, 7 derniers jours, lectures en cours, à lire, souhaits, terminés, prêts, sessions planifiées.
- **Livres** : ajout par recherche (Google Books, repli Open Library ; titre, auteur ou ISBN) ou saisie manuelle ; couverture importée, par URL ou générée ; modification, suppression avec annulation, favoris, note sur 5 (demi-étoiles), avis, notes/citations avec page.
- **Pages** : Ma bibliothèque, À lire (priorités), Liste de souhaits (prix, lien d'achat), Livres lus (par mois/année), avec recherche, filtre par genre, tri, vue grille/liste.
- **Suivi** : progression page par page, minuteur de lecture persistant (pause/reprise, survit au rechargement), sessions datées, estimation du temps restant.
- **Prêts & emprunts** : échéances, retards, historique, rappel exportable vers le calendrier du téléphone (.ics).
- **Calendrier** : vue mensuelle (balayage), sessions planifiées (répétition hebdomadaire), jours de lecture, export .ics.
- **Statistiques** : objectif annuel et rythme, livres/pages/temps par mois, genres, carte d'activité, séries, vitesse.
- **Réglages** : profil et photo, thème clair/sombre/système, 6 couleurs d'accent, réduction des animations, objectifs, notifications système, export/import JSON (fusion ou remplacement), données d'exemple, effacement.
- **UX** : recherche rapide ⌘K / `/`, centre de notifications calculé à partir des données, toasts avec annulation, confirmations, squelettes de chargement.

## Architecture

```
src/
  types/            modèle de données (Book, ReadingSession, ReadingPlan, Loan, Settings)
  store/            état Zustand persisté dans IndexedDB (repli localStorage) + état UI
  lib/              logique pure : stats, dates, API livres, validation (zod), alertes, ics, démo
  components/ui     système de design (Button, Sheet, Field, Segmented, Toast, Confirm…)
  components/books  couverture, cartes, formulaires, feuilles d'ajout/progression
  components/layout shell (barre latérale ≥1024 px, barre d'onglets mobile), palette, notifications
  components/charts graphiques SVG maison
  pages/            écrans (chargés à la demande)
```

Règle métier centrale : toute progression positive crée une `ReadingSession` ; les statistiques de pages et de temps en dérivent toutes. Les pages déjà lues d'un livre ajouté « en cours » ne sont pas comptées comme lues aujourd'hui.

## Données & confidentialité

Les données restent dans le navigateur de l'appareil. Seules les requêtes de recherche de livres partent vers Google Books / Open Library. Pas de compte ni de synchronisation multi-appareils : utilisez l'export/import JSON pour transférer.
