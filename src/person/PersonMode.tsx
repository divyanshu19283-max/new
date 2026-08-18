import { LogOut, Phone, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { VoiceButton } from '@/components/VoiceButton';
import { useCare } from '@/store/CareContext';
import { greeting, formatTime, reminderIcon, todayKey, clockTime } from '@/lib/time';
import { isVoiceAvailable } from '@/lib/voice';
import { ActivePromptOverlay, HelpRequestedScreen, OfflineBanner } from './ActivePromptOverlay';
import { FallCheckOverlay } from './FallCheckOverlay';
import { PersonSettings } from './PersonSettings';

export function PersonMode() {
  const {
    settings, reminders, acknowledgements, checkIns, checkIn, requestHelp,
    mode, setMode, activePrompt, fallCheck, online,
  } = useCare();
  const [helpScreen, setHelpScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceNote, setShowVoiceNote] = useState(false);

  const personName = settings.person.name;
  const tkey = todayKey();

  const todaysReminders = reminders
    .filter((r) => r.enabled && r.kind !== 'checkin')
    .sort((a, b) => a.time.localeCompare(b.time));

  const ackFor = (reminderId: string) =>
    acknowledgements.find((a) => a.reminderId === reminderId && todayKey(a.timestamp) === tkey);

  const todayCheckin = checkIns.find((c) => todayKey(c.timestamp) === tkey);
  const lastCheckin = checkIns[0];

  const phone = settings.caregiverPhone || settings.person.caregiverPhone;
  const voiceSupported = isVoiceAvailable();

  useEffect(() => {
    if (!voiceSupported) {
      const t = window.setTimeout(() => setShowVoiceNote(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, [voiceSupported]);

  return (
    <div className="min-h-screen bg-cream-100">
      <OfflineBanner />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        {/* top bar */}
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sand-600 bg-cream-200 px-3 py-1.5 rounded-full">
              Demo Mode
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-slatey-700 hover:bg-cream-300 transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={() => setMode('landing')}
              className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 text-slatey-700 hover:bg-cream-300 transition-colors"
              aria-label="Exit person mode"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* greeting */}
        <div className="mb-8 animate-slide-up">
          <h1 className="font-display text-4xl sm:text-5xl text-slatey-900">
            {greeting()}, {personName} ❤️
          </h1>
          <p className="mt-2 text-xl text-slatey-700">{formatTime(settings.checkinTime)} check-in · {todaysReminders.length} reminders today</p>
        </div>

        {/* check-in status / CTA */}
        <Card padding="lg" className="mb-6 animate-slide-up">
          <h2 className="font-display text-3xl text-slatey-900 mb-1">Are you okay?</h2>
          {todayCheckin ? (
            <p className="text-lg text-sage-700 font-semibold mb-5">
              ✓ You checked in at {clockTime(todayCheckin.timestamp)}
            </p>
          ) : lastCheckin ? (
            <p className="text-lg text-slatey-700 mb-5">
              Last check-in: {clockTime(lastCheckin.timestamp)}
            </p>
          ) : (
            <p className="text-lg text-slatey-700 mb-5">Let your caregiver know how you're doing.</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Button size="lg" variant="primary" fullWidth onClick={() => checkIn('ok')} disabled={!!todayCheckin}>
              I'M OKAY
            </Button>
            <Button size="lg" variant="help" fullWidth onClick={() => { checkIn('help'); setHelpScreen(true); }}>
              I NEED HELP
            </Button>
          </div>
        </Card>

        {/* help button — always prominent */}
        <button
          onClick={() => { requestHelp(); setHelpScreen(true); }}
          className="w-full mb-8 bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white rounded-3xl p-6 sm:p-7 shadow-soft transition-all active:scale-[0.98] animate-slide-up"
          aria-label="Request help"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl">🆘</span>
            <span className="font-display text-3xl sm:text-4xl font-semibold">HELP</span>
          </div>
        </button>

        {/* reminders list */}
        <div className="mb-8">
          <h3 className="font-display text-2xl text-slatey-900 mb-4 px-1">Today's reminders</h3>
          <div className="grid gap-3">
            {todaysReminders.length === 0 && (
              <Card padding="md" className="text-center text-slatey-700">
                No reminders scheduled. Your caregiver can add some.
              </Card>
            )}
            {todaysReminders.map((r, i) => {
              const ack = ackFor(r.id);
              const done = ack && !['later', 'not_yet'].includes(ack.status);
              return (
                <Card
                  key={r.id}
                  padding="md"
                  className={`flex items-center gap-4 animate-slide-in ${done ? 'opacity-75' : ''}`}
                >
                  <div style={{ animationDelay: `${i * 60}ms` }} className="text-3xl shrink-0">
                    {reminderIcon(r.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slatey-900 truncate">{r.label}</p>
                    <p className="text-base text-slatey-700">{formatTime(r.time)}</p>
                  </div>
                  {done ? (
                    <span className="inline-flex items-center gap-1.5 text-sage-700 font-bold text-base bg-sage-50 px-3 py-1.5 rounded-full">
                      ✓ {clockTime(ack!.timestamp).split(' ')[0]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sand-600 font-semibold text-sm bg-cream-200 px-3 py-1.5 rounded-full">
                      ○ pending
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* caregiver call */}
        {phone && (
          <Card padding="md" className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-base text-slatey-700">Need to reach your caregiver?</p>
              <p className="text-xs text-sand-600 mt-0.5">Uses your phone's dialer</p>
            </div>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 font-bold px-5 py-3 rounded-2xl hover:bg-sage-400 hover:text-white transition-colors"
            >
              <Phone size={20} /> CALL
            </a>
          </Card>
        )}

        {/* voice control */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-lg font-bold text-slatey-900">Voice control</p>
              {voiceSupported ? (
                <p className="text-sm text-slatey-700 mt-0.5">Say "okay", "done", "help", or "what's next"</p>
              ) : (
                <p className="text-sm text-sand-600 mt-0.5">Voice isn't available on this device. You can still use the buttons.</p>
              )}
            </div>
            <VoiceButton />
          </div>
        </Card>

        {showVoiceNote && !voiceSupported && (
          <div className="mb-6 flex items-start gap-3 bg-amber-soft/50 border border-amber-deep/20 rounded-2xl p-4 animate-slide-up">
            <AlertCircle size={22} className="text-amber-deep shrink-0 mt-0.5" />
            <p className="text-sm text-amber-deep font-semibold">
              Voice isn't available on this device. You can still use the buttons — everything works without voice.
            </p>
            <button className="ml-auto text-amber-deep" onClick={() => setShowVoiceNote(false)}>×</button>
          </div>
        )}

        {/* device mode promo */}
        {mode !== 'device' && (
          <button
            onClick={() => setMode('device')}
            className="w-full text-center text-sm text-sand-600 font-semibold hover:text-slatey-700 py-3"
          >
            Turn on Device Mode (full-screen, always-on display) →
          </button>
        )}
      </div>

      {/* overlays */}
      {activePrompt && <ActivePromptOverlay />}
      {fallCheck && <FallCheckOverlay />}
      {helpScreen && <HelpRequestedScreen onDone={() => setHelpScreen(false)} />}
      {showSettings && <PersonSettings onClose={() => setShowSettings(false)} />}

      {/* offline note */}
      {!online && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slatey-900 text-cream-100 text-sm font-semibold px-4 py-2 rounded-full shadow-soft">
          Offline — reminders continue locally
        </div>
      )}
    </div>
  );
}
