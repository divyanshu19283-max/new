import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useCare } from '@/store/CareContext';

export function PersonSettings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, preferences, setPreferences, simulateFall } = useCare();
  const [name, setName] = useState(settings.person.name);
  const [phone, setPhone] = useState(settings.caregiverPhone || settings.person.caregiverPhone || '');
  const [voice, setVoice] = useState(settings.voiceEnabled);

  const save = () => {
    updateSettings({
      person: { ...settings.person, name, caregiverPhone: phone },
      caregiverPhone: phone,
      voiceEnabled: voice,
    });
    setPreferences({ voiceEnabled: voice });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slatey-900/30 backdrop-blur-sm grid place-items-center p-4 animate-fade-in">
      <Card padding="lg" className="w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-slatey-900">Settings</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 hover:bg-cream-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slatey-700 mb-1.5">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slatey-700 mb-1.5">Caregiver phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+1 555 000 0000"
              className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none"
            />
            <p className="text-xs text-sand-600 mt-1">Used only for the CALL button on this device.</p>
          </div>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-base font-bold text-slatey-700">Voice guidance</span>
            <button
              type="button"
              role="switch"
              aria-checked={voice}
              onClick={() => setVoice(!voice)}
              className={`relative h-7 w-12 rounded-full transition-colors ${voice ? 'bg-sage-500' : 'bg-cream-300'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${voice ? 'left-6' : 'left-1'}`} />
            </button>
          </label>

          <div className="pt-3 border-t border-cream-200">
            <p className="text-xs font-bold uppercase tracking-wider text-sand-600 mb-2">Demo controls</p>
            <Button variant="danger" size="md" fullWidth onClick={() => { simulateFall(); onClose(); }}>
              Simulate fall (demo sensor event)
            </Button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="soft" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={save}>Save</Button>
        </div>
      </Card>
    </div>
  );
}
