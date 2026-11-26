import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useLibrary } from '@/store/useLibrary';
import { AppShell } from '@/components/layout/AppShell';
import { AlertsWatcher, CommandPalette, NotificationsSheet, ThemeController } from '@/components/layout/Overlays';
import { AddBookSheet, EditBookSheet } from '@/components/books/AddBookSheet';
import { ProgressSheet, TimerFinishSheet } from '@/components/books/ProgressSheet';
import { ReflectionSheet } from '@/components/books/ReflectionSheet';
import { ShelfPicker } from '@/components/books/ShelfPicker';
import { GlobalCoverPicker } from '@/components/books/CoverPicker';
import { AutoCovers, AutoGenres, SpineColors } from '@/components/AutoCovers';
import { BadgeWatcher, Celebration } from '@/components/Celebration';
import { AutoBackupRunner } from '@/components/AutoBackupRunner';
import { Toaster } from '@/components/ui/Toast';
import { ConfirmHost } from '@/components/ui/Confirm';
import { Skeleton } from '@/components/ui/misc';
import { LogoMark } from '@/components/layout/Logo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UpdateChecker } from '@/components/UpdateChecker';
import { Home } from '@/pages/Home';
import { Onboarding } from '@/pages/Onboarding';

const LibraryPage = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.LibraryPage })));
const ToReadPage = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.ToReadPage })));
const WishlistPage = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.WishlistPage })));
const FinishedPage = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.FinishedPage })));
const BookDetail = lazy(() => import('@/pages/BookDetail').then((m) => ({ default: m.BookDetail })));
const LoansPage = lazy(() => import('@/pages/Loans').then((m) => ({ default: m.LoansPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const StatsPage = lazy(() => import('@/pages/Stats').then((m) => ({ default: m.StatsPage })));
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage })));
const SeriesPage = lazy(() => import('@/pages/CollectionsPage').then((m) => ({ default: m.SeriesPage })));
const ShelfPage = lazy(() => import('@/pages/CollectionsPage').then((m) => ({ default: m.ShelfPage })));
const RoomPage = lazy(() => import('@/pages/RoomPage').then((m) => ({ default: m.RoomPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-8 sm:px-6 lg:px-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-3 gap-4 pt-4 sm:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3]" />
        ))}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="animate-pulse">
        <LogoMark size={56} />
      </div>
    </div>
  );
}

export default function App() {
  const hydrated = useLibrary((s) => s.hydrated);
  const onboarded = useLibrary((s) => s.settings.onboarded);
  const reduceMotion = useLibrary((s) => s.settings.reduceMotion);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
        <ThemeController />
        {!hydrated ? (
          <Splash />
        ) : !onboarded ? (
          <Onboarding />
        ) : (
          <BrowserRouter>
            <Routes>
                <Route element={<AppShell fallback={<PageFallback />} />}>
                  <Route index element={<Home />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="to-read" element={<ToReadPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="collections" element={<CollectionsPage />} />
                  <Route path="collections/series/:name" element={<SeriesPage />} />
                  <Route path="collections/shelf/:id" element={<ShelfPage />} />
                  <Route path="loans" element={<LoansPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="finished" element={<FinishedPage />} />
                  <Route path="stats" element={<StatsPage />} />
                  <Route path="room" element={<RoomPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="book/:id" element={<BookDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            <AddBookSheet />
            <EditBookSheet />
            <ProgressSheet />
            <TimerFinishSheet />
            <ReflectionSheet />
            <ShelfPicker />
            <GlobalCoverPicker />
            <AutoCovers />
            <SpineColors />
            <AutoGenres />
            <Celebration />
            <BadgeWatcher />
            <AutoBackupRunner />
            <NotificationsSheet />
            <CommandPalette />
            <AlertsWatcher />
            <UpdateChecker />
          </BrowserRouter>
        )}
        <ConfirmHost />
        <Toaster />
      </MotionConfig>
    </ErrorBoundary>
  );
}
