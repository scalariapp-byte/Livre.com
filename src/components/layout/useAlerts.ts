import { useMemo } from 'react';
import { useLibrary } from '@/store/useLibrary';
import { computeAlerts } from '@/lib/alerts';
import { useTick } from '@/lib/hooks';

export function useAlerts() {
  const loans = useLibrary((s) => s.loans);
  const plans = useLibrary((s) => s.plans);
  const sessions = useLibrary((s) => s.sessions);
  const settings = useLibrary((s) => s.settings);
  const dismissed = useLibrary((s) => s.dismissedAlerts);
  useTick(5 * 60_000);
  const hour = new Date().getHours();
  return useMemo(
    () => computeAlerts({ loans, plans, sessions, settings }).map((a) => ({ ...a, dismissed: dismissed.includes(a.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loans, plans, sessions, settings, dismissed, hour],
  );
}
