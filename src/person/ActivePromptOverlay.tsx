import { Check, Heart, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { VoiceButton } from '@/components/VoiceButton';
import { useCare } from '@/store/CareContext';
import { speak } from '@/lib/voice';
import { isVoiceAvailable } from '@/lib/voice';
import { clockTime, formatTime, reminderIcon, todayKey } from '@/lib/time';
import type { AcknowledgementStatus } from '@/types';

// Active prompt overlay — check-in or reminder
export function ActivePromptOverlay() {
  const { activePrompt, checkIn, acknowledge, requestHelp, dismissPrompt, settings } = useCare();
  const [done, setDone] = useState<string | null>(null);

  if (!activePrompt) return null;

  const handle = (value: AcknowledgementStatus | 'ok' | 'help' | 'later') => {
    if (activePrompt.kind === 'checkin') {
      if (value === 'ok') {
        checkIn('ok');
        setDone('Thank you ❤️');
      } else if (value === 'help') {
        checkIn('help');
      }
    } else {
      acknowledge(activePrompt.reminderId, value as AcknowledgementStatus);
      if (value === 'later' || value === 'not_yet') {
        dismissPrompt();
      } else {
        setDone('Thank you ❤️');
      }
    }
    if (settings.voiceEnabled && (value === 'ok' || ['taken', 'done', 'yes'].includes(value as string))) {
      speak('Thank you.');
    }
  };

  const isCheckin = activePrompt.kind === 'checkin';

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slatey-900/30 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-xl rounded-4xl bg-white p-8 sm:p-10 shadow-card animate-scale-in">
        {done ? (
          <div className="text-center py-8 animate-scale-in">
            <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-sage-100 text-sage-600">
              <Check size={56} strokeWidth={3} />
            </div>
            <p className="font-display text-4xl text-slatey-900">{done}</p>
            <button
              className="mt-8 text-base text-sand-600 font-semibold hover:text-slatey-700"
              onClick={() => { setDone(null); dismissPrompt(); }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto mb-5 text-6xl">
                {isCheckin ? '☀️' : reminderIcon(activePrompt.kind as any)}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-sand-600 mb-2">
                {isCheckin ? 'Daily check-in' : activePrompt.label}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-slatey-900 text-balance">
                {activePrompt.message}
              </h2>
            </div>
            <div className="grid gap-4">
              {activePrompt.options.map((opt) => (
                <Button
                  key={opt.value}
                  size="xl"
                  variant={opt.tone === 'help' ? 'help' : opt.tone === 'primary' ? 'primary' : 'soft'}
                  fullWidth
                  onClick={() => handle(opt.value)}
                >
                  {opt.tone === 'help' && <Heart size={28} fill="currentColor" />}
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <VoiceButton label="Answer by voice" />
              <button
                className="text-sm text-sand-600 font-semibold hover:text-slatey-700 px-3 py-2"
                onClick={dismissPrompt}
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Help requested confirmation screen
export function HelpRequestedScreen({ onDone }: { onDone: () => void }) {
  const { settings } = useCare();
  const phone = settings.caregiverPhone || settings.person.caregiverPhone;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-coral-50 animate-fade-in p-4">
      <div className="w-full max-w-lg text-center animate-scale-in">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-coral-500 text-white animate-breath">
          <Heart size={52} fill="currentColor" />
        </div>
        <h2 className="font-display text-4xl sm:text-5xl text-coral-700 mb-3">Help requested</h2>
        <p className="text-xl text-slatey-800 mb-8">Your caregiver has been notified.</p>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-3 bg-white text-coral-700 font-bold text-xl px-8 py-5 rounded-3xl shadow-card active:scale-95 transition-transform mb-4"
          >
            <Phone size={26} /> CALL CAREGIVER
          </a>
        )}
        <div className="mt-6">
          <button
            className="text-base text-sand-600 font-semibold hover:text-slatey-700"
            onClick={onDone}
          >
            Back to home
          </button>
        </div>
        <p className="mt-6 text-xs text-sand-600 max-w-sm mx-auto">
          This message stays on this device. No remote emergency service has been contacted.
        </p>
      </div>
    </div>
  );
}

// Offline banner
export function OfflineBanner() {
  const { online } = useCare();
  if (online) return null;
  return (
    <div className="bg-amber-soft/70 border-b border-amber-deep/20 px-4 py-2 text-center text-sm font-semibold text-amber-deep">
      Offline — your local reminders will continue.
    </div>
  );
}

export { isVoiceAvailable, clockTime, formatTime, todayKey };
