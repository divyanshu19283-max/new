import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Clock } from '@/components/Clock';
import { useCare } from '@/store/CareContext';
import { greeting, reminderIcon, formatTime, todayKey, clockTime } from '@/lib/time';
import { ActivePromptOverlay, HelpRequestedScreen, OfflineBanner } from './ActivePromptOverlay';
import { FallCheckOverlay } from './FallCheckOverlay';

export function DeviceMode() {
  const { settings, reminders, acknowledgements, checkIns, requestHelp, setMode, activePrompt, fallCheck } = useCare();
  const [helpScreen, setHelpScreen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [exitStep, setExitStep] = useState(0);

  const tkey = todayKey();
  const todayCheckin = checkIns.find((c) => todayKey(c.timestamp) === tkey);

  const nextReminder = reminders
    .filter((r) => r.enabled && r.kind !== 'checkin')
    .filter((r) => !acknowledgements.find((a) => a.reminderId === r.id && todayKey(a.timestamp) === tkey))
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  // Prevent accidental back navigation
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      if (!exitConfirm) {
        e.preventDefault();
        history.pushState(null, '', location.href);
      }
    };
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [exitConfirm]);

  const tryExit = () => {
    if (exitStep === 0) {
      setExitConfirm(true);
      setExitStep(1);
    } else {
      setMode('landing');
    }
  };

  return (
    <div className="fixed inset-0 bg-cream-100 overflow-hidden no-select">
      <OfflineBanner />

      <div className="h-full flex flex-col items-center justify-between px-6 py-8 sm:py-12 max-w-2xl mx-auto">
        {/* top: greeting + status */}
        <div className="w-full text-center animate-fade-in">
          <p className="font-display text-2xl sm:text-3xl text-slatey-700">{greeting()}, {settings.person.name} ❤️</p>
          {todayCheckin && (
            <p className="mt-1 text-sage-700 font-semibold">✓ Checked in at {clockTime(todayCheckin.timestamp)}</p>
          )}
        </div>

        {/* center: clock */}
        <div className="flex-1 grid place-items-center w-full">
          <Clock large />
        </div>

        {/* next reminder */}
        <div className="w-full text-center animate-slide-up">
          {nextReminder ? (
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-card">
              <span className="text-4xl">{reminderIcon(nextReminder.kind)}</span>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-sand-600">Next reminder</p>
                <p className="text-xl font-bold text-slatey-900">{nextReminder.label}</p>
                <p className="text-base text-slatey-700">{formatTime(nextReminder.time)}</p>
              </div>
            </div>
          ) : (
            <p className="text-lg text-slatey-700 font-semibold">All reminders done today ✨</p>
          )}
        </div>

        {/* bottom: help + exit */}
        <div className="w-full grid gap-3 sm:max-w-md">
          <button
            onClick={() => { requestHelp(); setHelpScreen(true); }}
            className="w-full bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white rounded-3xl p-5 shadow-soft transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🆘</span>
              <span className="font-display text-2xl font-semibold">HELP</span>
            </div>
          </button>
          <button
            onClick={tryExit}
            className="text-sm text-sand-600 font-semibold hover:text-slatey-700 flex items-center justify-center gap-2 py-2"
          >
            <LogOut size={16} /> {exitConfirm ? 'Press again to exit device mode' : 'Caregiver exit'}
          </button>
        </div>
      </div>

      {activePrompt && <ActivePromptOverlay />}
      {fallCheck && <FallCheckOverlay />}
      {helpScreen && <HelpRequestedScreen onDone={() => setHelpScreen(false)} />}
    </div>
  );
}
