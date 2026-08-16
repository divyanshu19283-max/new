import { Bell, Heart, Mic, Phone, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useCare } from '@/store/CareContext';
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '@/lib/notifications';
import { isVoiceAvailable } from '@/lib/voice';

export function CaregiverSettings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearDemoData } = useCare();
  const [name, setName] = useState(settings.person.name);
  const [phone, setPhone] = useState(settings.caregiverPhone || '');
  const [checkinTime, setCheckinTime] = useState(settings.checkinTime);
  const [grace, setGrace] = useState(String(settings.checkinGraceMinutes));
  const [voice, setVoice] = useState(settings.voiceEnabled);
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());
  const [notifEnabled, setNotifEnabled] = useState(settings.notificationsEnabled);

  const notifSupported = isNotificationSupported();
  const voiceSupported = isVoiceAvailable();

  const requestNotif = async () => {
    const p = await requestNotificationPermission();
    setNotifPerm(p);
    setNotifEnabled(p === 'granted');
  };

  const save = () => {
    updateSettings({
      person: { ...settings.person, name },
      caregiverPhone: phone,
      checkinTime,
      checkinGraceMinutes: Math.max(1, parseInt(grace, 10) || 20),
      voiceEnabled: voice,
      notificationsEnabled: notifEnabled && notifPerm === 'granted',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slatey-900/30 backdrop-blur-sm grid place-items-center p-4 animate-fade-in overflow-y-auto">
      <Card padding="lg" className="w-full max-w-md my-8 animate-scale-in">
        <h3 className="font-display text-2xl text-slatey-900 mb-5">Caregiver settings</h3>

        <div className="space-y-5">
          <Section icon={<Heart size={18} />} title="Person">
            <Field label="Person's name">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none" />
            </Field>
            <Field label="Your phone (for CALL buttons)">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+1 555 000 0000"
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none" />
            </Field>
          </Section>

          <Section icon={<Bell size={18} />} title="Daily check-in">
            <Field label="Expected check-in time">
              <input type="time" value={checkinTime} onChange={(e) => setCheckinTime(e.target.value)}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none" />
            </Field>
            <Field label="Grace period (minutes before 'missed')">
              <input type="number" min={1} max={120} value={grace} onChange={(e) => setGrace(e.target.value)}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none" />
            </Field>
          </Section>

          <Section icon={<Bell size={18} />} title="Notifications">
            {notifSupported ? (
              notifPerm === 'granted' ? (
                <p className="text-sm text-sage-700 font-semibold">✓ Browser notifications enabled</p>
              ) : notifPerm === 'denied' ? (
                <p className="text-sm text-coral-700 font-semibold">
                  Notification permission was denied in your browser. You can still see alerts in the dashboard.
                </p>
              ) : (
                <Button size="md" variant="soft" onClick={requestNotif}>
                  <Bell size={16} /> Enable browser notifications
                </Button>
              )
            ) : (
              <p className="text-sm text-sand-600 font-semibold">Notifications aren't supported on this device.</p>
            )}
          </Section>

          <Section icon={<Mic size={18} />} title="Voice">
            {voiceSupported ? (
              <Toggle label="Voice guidance on person's device" value={voice} onChange={setVoice} />
            ) : (
              <p className="text-sm text-sand-600 font-semibold">Voice isn't supported on this device.</p>
            )}
          </Section>

          <div className="pt-3 border-t border-cream-200">
            <p className="text-xs font-bold uppercase tracking-wider text-sand-600 mb-2">Data</p>
            <button
              onClick={() => { if (confirm('Clear all check-ins, acknowledgements, and alerts? Reminders and settings stay.')) clearDemoData(); }}
              className="text-sm text-coral-700 font-semibold hover:underline"
            >
              Clear activity history
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="soft" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={save}><Save size={18} /> Save</Button>
        </div>
      </Card>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-slatey-800">
        <span className="text-sand-600">{icon}</span>
        <h4 className="font-display text-lg font-semibold">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slatey-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-base font-semibold text-slatey-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-sage-500' : 'bg-cream-300'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  );
}
