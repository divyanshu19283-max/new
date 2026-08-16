import {
  AlertOctagon, BellRing, Clock, Heart, LogOut, Phone, Settings as SettingsIcon,
  Activity, ListChecks, ShieldCheck, Wifi, WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { StatusDot, severityStyle } from '@/components/StatusDot';
import { useCare } from '@/store/CareContext';
import { clockTime, relativeTime, reminderIcon, formatTime, todayKey } from '@/lib/time';
import { AlertCenter } from './AlertCenter';
import { ReminderManager } from './ReminderManager';
import { CaregiverSettings } from './CaregiverSettings';
import { useDashboard } from './useDashboard';

type Tab = 'overview' | 'alerts' | 'reminders' | 'activity';

export function CaregiverMode() {
  const { setMode, online, alerts, markAlertSafe } = useCare();
  const activeAlertCount = alerts.filter((a) => !a.resolved && a.severity !== 'normal').length;
  const [tab, setTab] = useState<Tab>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const dash = useDashboard();
  const { activity, checkIn, requestHelp, simulateFall, settings } = useCare();
  const phone = settings.caregiverPhone || settings.person.caregiverPhone;

  const sev = dash.overallSeverity;
  const sevStyle = severityStyle(sev);
  const statusText =
    sev === 'help' ? 'Help requested — attention needed' :
    sev === 'attention' ? 'Something needs your attention' :
    'Everything looks normal';

  return (
    <div className="min-h-screen bg-cream-100">
      {/* top bar */}
      <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-md border-b border-cream-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-sand-600 bg-cream-200 px-3 py-1.5 rounded-full">
              Demo Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full ${online ? 'bg-sage-50 text-sage-700' : 'bg-amber-soft/50 text-amber-deep'}`}>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />} {online ? 'Online' : 'Offline'}
            </span>
            <button onClick={() => setShowSettings(true)} className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-slatey-700 hover:bg-cream-300" aria-label="Settings">
              <SettingsIcon size={20} />
            </button>
            <button onClick={() => setMode('landing')} className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-slatey-700 hover:bg-cream-300" aria-label="Exit caregiver mode">
              <LogOut size={20} />
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-thin">
          <TabButton icon={<Heart size={16} />} label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <TabButton icon={<AlertOctagon size={16} />} label="Alerts" active={tab === 'alerts'} onClick={() => setTab('alerts')} badge={activeAlertCount} />
          <TabButton icon={<ListChecks size={16} />} label="Reminders" active={tab === 'reminders'} onClick={() => setTab('reminders')} />
          <TabButton icon={<Activity size={16} />} label="Activity" active={tab === 'activity'} onClick={() => setTab('activity')} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'overview' && (
          <OverviewTab sev={sev} statusText={statusText} sevStyle={sevStyle} dash={dash}
            phone={phone} onSimulateFall={simulateFall} onRequestHelp={() => requestHelp()}
            onMarkSafe={(id) => markAlertSafe(id)} />
        )}
        {tab === 'alerts' && <AlertCenter />}
        {tab === 'reminders' && <ReminderManager />}
        {tab === 'activity' && <ActivityTab activity={activity} />}
      </main>

      {showSettings && <CaregiverSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function TabButton({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
        active ? 'border-sage-500 text-sage-700' : 'border-transparent text-slatey-700 hover:text-slatey-900'
      }`}
    >
      {icon} {label}
      {badge ? (
        <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1.5 text-xs text-white">{badge}</span>
      ) : null}
    </button>
  );
}

function OverviewTab({ sev, statusText, sevStyle, dash, phone, onSimulateFall, onRequestHelp, onMarkSafe }: {
  sev: any;
  statusText: string;
  sevStyle: any;
  dash: ReturnType<typeof useDashboard>;
  phone?: string;
  onSimulateFall: () => void;
  onRequestHelp: () => void;
  onMarkSafe: (id: string) => void;
}) {
  const recentActivity = useCare().activity.slice(0, 6);

  return (
    <div className="grid gap-5">
      {/* status hero */}
      <Card padding="lg" className={`${sevStyle.bg} animate-slide-up`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slatey-700 mb-1">CARE · {dash.personName}</p>
            <div className="flex items-center gap-3 mt-1">
              <StatusDot severity={sev} pulse={sev !== 'normal'} />
            </div>
            <p className="mt-3 font-display text-2xl sm:text-3xl text-slatey-900 text-balance">{statusText}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-sand-600">Last check-in</p>
            <p className="font-display text-2xl text-slatey-900">
              {dash.lastCheckin ? clockTime(dash.lastCheckin.timestamp) : '—'}
            </p>
            <p className="text-sm text-slatey-700">
              {dash.todayCheckin ? 'Today' : dash.lastCheckin ? relativeTime(dash.lastCheckin.timestamp) : 'No check-ins yet'}
            </p>
          </div>
        </div>

        {dash.checkinMissed && (
          <div className="mt-4 bg-white/70 rounded-2xl p-4 border border-amber-deep/20">
            <div className="flex items-center gap-2 text-amber-deep font-bold">
              <AlertOctagon size={20} /> CHECK-IN MISSED
            </div>
            <p className="text-sm text-slatey-700 mt-1">No response received from {dash.personName}.</p>
            <p className="text-sm text-slatey-700">Expected: {dash.checkinTime}</p>
            <div className="mt-3 flex gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 bg-coral-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-coral-600">
                  <Phone size={16} /> CALL
                </a>
              )}
              <button onClick={() => onMarkSafe(dash.checkinMissed!.id)} className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-sage-400 hover:text-white">
                <ShieldCheck size={16} /> MARK AS SAFE
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* today's reminders */}
      <Card padding="md">
        <h3 className="font-display text-xl text-slatey-900 mb-4">Today's reminders</h3>
        <div className="grid gap-2.5">
          {dash.reminderStatus.length === 0 && (
            <p className="text-sm text-slatey-700">No reminders scheduled.</p>
          )}
          {dash.reminderStatus.map(({ reminder, done, ack }) => (
            <div key={reminder.id} className="flex items-center gap-3">
              <span className="text-xl">{reminderIcon(reminder.kind)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slatey-900 truncate">{reminder.label}</p>
                <p className="text-xs text-slatey-700">{formatTime(reminder.time)}</p>
              </div>
              {done ? (
                <span className="text-xs font-bold text-sage-700 bg-sage-50 px-2.5 py-1 rounded-full">
                  ✓ {ack!.status === 'taken' ? 'Taken' : ack!.status === 'yes' ? 'Eaten' : 'Done'} {clockTime(ack!.timestamp).split(' ')[0]}
                </span>
              ) : (
                <span className="text-xs font-bold text-sand-600 bg-cream-200 px-2.5 py-1 rounded-full">○ pending</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* recent activity */}
      <Card padding="md">
        <h3 className="font-display text-xl text-slatey-900 mb-4">Recent activity</h3>
        <div className="grid gap-2.5">
          {recentActivity.length === 0 && <p className="text-sm text-slatey-700">No activity yet.</p>}
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span className="text-sand-600 font-semibold tabular-nums w-20 shrink-0">{clockTime(a.timestamp)}</span>
              <span className="text-slatey-800">{a.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* quick actions */}
      <Card padding="md">
        <h3 className="font-display text-xl text-slatey-900 mb-3">Demo controls</h3>
        <p className="text-xs text-sand-600 mb-3">
          These simulate events for testing. No real sensors are connected.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="md" variant="soft" onClick={onSimulateFall}>
            <BellRing size={16} /> Simulate fall
          </Button>
          <Button size="md" variant="soft" onClick={onRequestHelp}>
            <Heart size={16} /> Simulate help request
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ActivityTab({ activity }: { activity: ReturnType<typeof useCare>['activity'] }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-slatey-900 mb-4">Activity timeline</h2>
      {activity.length === 0 && (
        <Card padding="md" className="text-center text-slatey-700">No activity recorded yet.</Card>
      )}
      <div className="grid gap-2.5">
        {activity.map((a) => (
          <Card key={a.id} padding="sm" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cream-200 text-sand-600 shrink-0">
              <Clock size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slatey-900">{a.text}</p>
              <p className="text-xs text-sand-600">{clockTime(a.timestamp)} · {relativeTime(a.timestamp)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
