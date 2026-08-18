import type {
  Acknowledgement,
  ActivityEntry,
  AlertEvent,
  CareState,
  CheckIn,
  Reminder,
} from '@/types';

const KEY = 'care.state.v1';
const PREFS_KEY = 'care.prefs.v1';

const SETTINGS_KEY = 'care.settings.v1';

export function isStorageAvailable(): boolean {
  try {
    const t = '__care_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

const DEMO_REMINDERS: Reminder[] = [
  { id: 'r_checkin', kind: 'checkin', label: 'Daily check-in', time: '08:00', repeat: 'daily', enabled: true, createdAt: Date.now() },
  { id: 'r_med_am', kind: 'medicine', label: 'Morning medicine', time: '08:00', repeat: 'daily', enabled: true, createdAt: Date.now() },
  { id: 'r_breakfast', kind: 'meal', label: 'Breakfast', time: '08:30', repeat: 'daily', enabled: true, createdAt: Date.now() },
  { id: 'r_lunch', kind: 'meal', label: 'Lunch', time: '12:30', repeat: 'daily', enabled: true, createdAt: Date.now() },
  { id: 'r_water', kind: 'water', label: 'Afternoon water', time: '15:00', repeat: 'daily', enabled: true, createdAt: Date.now() },
  { id: 'r_med_pm', kind: 'medicine', label: 'Evening medicine', time: '20:00', repeat: 'daily', enabled: true, createdAt: Date.now() },
];

const DEMO_SETTINGS: CareState['settings'] = {
  person: { name: 'Grandma', caregiverPhone: '' },
  checkinTime: '08:00',
  checkinGraceMinutes: 20,
  caregiverPhone: '',
  notificationsEnabled: false,
  voiceEnabled: true,
};

const DEFAULT_PREFS: CareState['preferences'] = {
  mode: 'landing',
  voiceEnabled: true,
  reducedMotion: false,
};

export function defaultState(): CareState {
  return {
    reminders: DEMO_REMINDERS,
    checkIns: [],
    acknowledgements: [],
    alerts: [],
    activity: [
      { id: 'a_demo1', timestamp: Date.now() - 86_400_000, text: 'Checked in yesterday at 8:04 AM', kind: 'info' },
    ],
    settings: DEMO_SETTINGS,
    preferences: DEFAULT_PREFS,
  };
}

export function loadState(): CareState {
  if (!isStorageAvailable()) return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<CareState>;
    const base = defaultState();
    return {
      reminders: parsed.reminders ?? base.reminders,
      checkIns: parsed.checkIns ?? [],
      acknowledgements: parsed.acknowledgements ?? [],
      alerts: parsed.alerts ?? [],
      activity: parsed.activity ?? base.activity,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      preferences: { ...base.preferences, ...(parsed.preferences ?? {}) },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: CareState): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or denied — non-fatal, in-memory continues
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type { Acknowledgement, ActivityEntry, AlertEvent, CheckIn, Reminder };
