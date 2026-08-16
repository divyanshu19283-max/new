import { useMemo } from 'react';
import { useCare } from '@/store/CareContext';
import type { AlertSeverity } from '@/types';
import { clockTime, todayKey, relativeTime, reminderIcon, formatTime } from '@/lib/time';

export function useDashboard() {
  const { reminders, acknowledgements, checkIns, alerts, settings } = useCare();
  const tkey = todayKey();

  const overallSeverity: AlertSeverity = useMemo(() => {
    const unresolved = alerts.filter((a) => !a.resolved);
    if (unresolved.some((a) => a.severity === 'help')) return 'help';
    if (unresolved.some((a) => a.severity === 'attention')) return 'attention';
    return 'normal';
  }, [alerts]);

  const lastCheckin = checkIns[0];
  const todayCheckin = checkIns.find((c) => todayKey(c.timestamp) === tkey);

  const reminderStatus = reminders
    .filter((r) => r.enabled && r.kind !== 'checkin')
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((r) => {
      const ack = acknowledgements.find((a) => a.reminderId === r.id && todayKey(a.timestamp) === tkey);
      const done = ack && !['later', 'not_yet'].includes(ack.status);
      return { reminder: r, ack, done };
    });

  const checkinMissed = alerts.find(
    (a) => a.kind === 'checkin_missed' && !a.resolved && todayKey(a.timestamp) === tkey,
  );

  return {
    overallSeverity,
    lastCheckin,
    todayCheckin,
    reminderStatus,
    checkinMissed,
    personName: settings.person.name,
    checkinTime: settings.checkinTime,
  };
}

export { clockTime, relativeTime, reminderIcon, formatTime, todayKey };
