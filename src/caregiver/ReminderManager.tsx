import { Clock, Pill, Plus, Trash2, UtensilsCrossed, Droplet, Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useCare } from '@/store/CareContext';
import type { Reminder, ReminderKind } from '@/types';
import { clockTime, formatTime, todayKey } from '@/lib/time';

const KIND_META: Record<ReminderKind, { icon: typeof Pill; label: string }> = {
  medicine: { icon: Pill, label: 'Medicine' },
  meal: { icon: UtensilsCrossed, label: 'Meal' },
  water: { icon: Droplet, label: 'Water' },
  checkin: { icon: Clock, label: 'Check-in' },
  custom: { icon: Bell, label: 'Custom' },
};

export function ReminderManager() {
  const { reminders, acknowledgements, addReminder, updateReminder, deleteReminder } = useCare();
  const [showAdd, setShowAdd] = useState(false);
  const tkey = todayKey();

  const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-slatey-900">Reminders</h2>
        <Button size="md" variant="primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Add reminder
        </Button>
      </div>

      <div className="grid gap-3">
        {sorted.map((r) => {
          const ack = acknowledgements.find((a) => a.reminderId === r.id && todayKey(a.timestamp) === tkey);
          const done = ack && !['later', 'not_yet'].includes(ack.status);
          const meta = KIND_META[r.kind];
          const Icon = meta.icon;
          return (
            <Card key={r.id} padding="md" className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cream-200 text-sand-600 shrink-0">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slatey-900 truncate">{r.label}</p>
                <p className="text-sm text-slatey-700">{formatTime(r.time)} · every day · {meta.label}</p>
                {done && (
                  <p className="text-xs text-sage-700 font-semibold mt-0.5">✓ {ack!.status} at {clockTime(ack!.timestamp)}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`Toggle ${r.label}`}
                  onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${r.enabled ? 'bg-sage-500' : 'bg-cream-300'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-6' : 'left-1'}`} />
                </button>
                {r.kind !== 'checkin' && (
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-coral-600 hover:bg-coral-50 transition-colors"
                    aria-label={`Delete ${r.label}`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {showAdd && <AddReminderModal onClose={() => setShowAdd(false)} onAdd={(r) => { addReminder(r); setShowAdd(false); }} />}
    </div>
  );
}

function AddReminderModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Omit<Reminder, 'id' | 'createdAt'>) => void }) {
  const [kind, setKind] = useState<ReminderKind>('medicine');
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('09:00');

  const submit = () => {
    if (!label.trim() || !time) return;
    onAdd({ kind, label: label.trim(), time, repeat: 'daily', enabled: true });
  };

  const kinds: ReminderKind[] = ['medicine', 'meal', 'water', 'custom'];

  return (
    <div className="fixed inset-0 z-50 bg-slatey-900/30 backdrop-blur-sm grid place-items-center p-4 animate-fade-in">
      <Card padding="lg" className="w-full max-w-md animate-scale-in">
        <h3 className="font-display text-2xl text-slatey-900 mb-5">New reminder</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slatey-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {kinds.map((k) => {
                const meta = KIND_META[k];
                const Icon = meta.icon;
                return (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition-colors ${
                      kind === k ? 'border-sage-400 bg-sage-50 text-sage-700' : 'border-cream-300 bg-cream-50 text-slatey-700 hover:bg-cream-200'
                    }`}
                  >
                    <Icon size={18} /> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slatey-700 mb-1.5">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
              placeholder="e.g. Evening medicine"
              className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slatey-700 mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-lg text-slatey-900 focus:border-sage-400 outline-none"
            />
            <p className="text-xs text-sand-600 mt-1">Repeats every day</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="soft" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={submit} disabled={!label.trim()}>Add reminder</Button>
        </div>
      </Card>
    </div>
  );
}
