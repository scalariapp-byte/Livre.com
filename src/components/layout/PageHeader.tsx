import { Bell, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/ui/Button';
import { useUI } from '@/store/useUI';
import { useAlerts } from './useAlerts';
import { cn } from '@/lib/utils';

export function HeaderActions({ className }: { className?: string }) {
  const setSearch = useUI((s) => s.setSearch);
  const setNotifications = useUI((s) => s.setNotifications);
  const unread = useAlerts().filter((a) => !a.dismissed).length;
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <IconButton label="Rechercher" variant="soft" onClick={() => setSearch(true)} className="lg:hidden">
        <Search className="size-[19px]" />
      </IconButton>
      <IconButton label="Notifications" variant="soft" onClick={() => setNotifications(true)} className="relative">
        <Bell className="size-[19px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-ink ring-2 ring-bg">
            {unread}
          </span>
        )}
      </IconButton>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: boolean;
  eyebrow?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="safe-top mx-auto max-w-6xl px-4 pb-2 pt-5 sm:px-6 lg:px-10 lg:pt-9">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {back && (
            <button type="button" onClick={() => navigate(-1)} className="mb-2 text-sm font-medium text-muted hover:text-ink">
              ← Retour
            </button>
          )}
          {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
          <h1 className="h-display text-[30px] font-semibold leading-[1.1] sm:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14.5px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {actions}
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-6xl px-4 pt-3 sm:px-6 lg:px-10', className)}>{children}</div>;
}
