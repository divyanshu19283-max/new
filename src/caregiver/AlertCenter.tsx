import {
  Bell, CheckCircle2, Phone, ShieldCheck, X,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { StatusDot, severityStyle } from '@/components/StatusDot';
import { useCare } from '@/store/CareContext';
import type { AlertEvent } from '@/types';
import { clockTime, relativeTime, todayKey } from './useDashboard';

const KIND_ICON: Record<string, string> = {
  checkin_ok: '🟢',
  checkin_missed: '⚠️',
  help_requested: '🔴',
  reminder_ack: '✓',
  reminder_missed: '⚠️',
  fall: '⚠️',
  sensor: '📡',
};

export function AlertCenter() {
  const { alerts, acknowledgeAlert, markAlertSafe, resolveAlert, settings } = useCare();
  const phone = settings.caregiverPhone || settings.person.caregiverPhone;

  const sorted = [...alerts].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-slatey-900">Alert center</h2>
        <span className="text-sm text-sand-600 font-semibold">
          {alerts.filter((a) => !a.resolved).length} active
        </span>
      </div>

      {sorted.length === 0 && (
        <Card padding="md" className="text-center text-slatey-700">
          <Bell size={28} className="mx-auto mb-2 text-sand-400" />
          No alerts yet. Alerts will appear here when check-ins or reminders need attention.
        </Card>
      )}

      <div className="grid gap-3">
        {sorted.map((a) => (
          <AlertRow key={a.id} alert={a} phone={phone}
            onAck={() => acknowledgeAlert(a.id)}
            onSafe={() => markAlertSafe(a.id)}
            onResolve={() => resolveAlert(a.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert, phone, onAck, onSafe, onResolve }: {
  alert: AlertEvent;
  phone?: string;
  onAck: () => void;
  onSafe: () => void;
  onResolve: () => void;
}) {
  const s = severityStyle(alert.severity);
  const needsAction = !alert.resolved && alert.severity !== 'normal';
  const isMissed = alert.kind === 'checkin_missed';
  const isHelp = alert.kind === 'help_requested' || alert.kind === 'fall';

  return (
    <Card padding="md" className={`${s.bg} border-l-4`} style={{ borderLeftColor: alert.severity === 'help' ? '#D96B5C' : alert.severity === 'attention' ? '#C98A2B' : '#5E9270' } as any}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{KIND_ICON[alert.kind] ?? '🔔'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusDot severity={alert.severity} />
            <span className="text-xs text-sand-600 font-semibold">{clockTime(alert.timestamp)} · {relativeTime(alert.timestamp)}</span>
          </div>
          <p className="mt-1.5 text-base font-semibold text-slatey-900">{alert.message}</p>
          {isMissed && alert.meta && (
            <p className="text-sm text-slatey-700 mt-1">
              Expected check-in: {String(alert.meta.expected)}
            </p>
          )}
          {alert.kind === 'fall' && (
            <p className="text-xs text-amber-deep font-semibold mt-1">Demo / simulated sensor event</p>
          )}

          {needsAction && (
            <div className="mt-3 flex flex-wrap gap-2">
              {isHelp && phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 bg-coral-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-coral-600 transition-colors">
                  <Phone size={16} /> CALL
                </a>
              )}
              {isMissed && phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 bg-coral-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-coral-600 transition-colors">
                  <Phone size={16} /> CALL
                </a>
              )}
              <button onClick={onSafe} className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-sage-400 hover:text-white transition-colors">
                <ShieldCheck size={16} /> MARK AS SAFE
              </button>
              <button onClick={onAck} className="inline-flex items-center gap-2 bg-cream-200 text-slatey-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-cream-300 transition-colors">
                <CheckCircle2 size={16} /> Acknowledge
              </button>
            </div>
          )}
          {alert.resolved && (
            <span className="mt-2 inline-flex items-center gap-1.5 text-sage-700 font-semibold text-sm">
              <CheckCircle2 size={15} /> Resolved
            </span>
          )}
          {!alert.resolved && alert.severity === 'normal' && (
            <button onClick={onResolve} className="mt-2 text-xs text-sand-600 font-semibold hover:text-slatey-700 inline-flex items-center gap-1">
              <X size={13} /> Dismiss
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
