import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Acknowledgement,
  AcknowledgementStatus,
  ActivityEntry,
  AlertEvent,
  AlertKind,
  AlertSeverity,
  CareState,
  CheckIn,
  CheckInStatus,
  Mode,
  Reminder,
  ReminderKind,
  SensorEvent,
} from '@/types';
import {
  defaultState,
  loadState,
  saveState,
  uid,
} from '@/storage';
import { notify } from '@/lib/notifications';
import { speak, stopSpeaking } from '@/lib/voice';
import { todayKey, nowHHMM, reminderIcon, formatTime } from '@/lib/time';

interface ActivePrompt {
  id: string;
  reminderId: string;
  kind: ReminderKind | 'checkin' | 'fall';
  label: string;
  message: string;
  options: PromptOption[];
  startedAt: number;
}

interface PromptOption {
  label: string;
  value: AcknowledgementStatus | 'ok' | 'help' | 'later';
  tone: 'primary' | 'soft' | 'help';
}

interface FallCheck {
  active: boolean;
  startedAt: number;
}

interface CareContextValue extends CareState {
  mode: Mode;
  setMode: (m: Mode) => void;
  activePrompt: ActivePrompt | null;
  fallCheck: FallCheck | null;
  online: boolean;
  // actions
  checkIn: (status: CheckInStatus, source?: 'manual' | 'voice' | 'sensor') => void;
  acknowledge: (reminderId: string, status: AcknowledgementStatus, source?: 'manual' | 'voice') => void;
  requestHelp: (source?: 'manual' | 'voice' | 'sensor') => void;
  simulateFall: () => void;
  resolveFallCheck: (status: 'ok' | 'help') => void;
  ingestSensorEvent: (evt: SensorEvent) => void;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  markAlertSafe: (id: string) => void;
  resolveAlert: (id: string) => void;
  updateSettings: (patch: Partial<CareState['settings']>) => void;
  setPreferences: (patch: Partial<CareState['preferences']>) => void;
  dismissPrompt: () => void;
  speakNext: () => void;
  clearDemoData: () => void;
}

const Ctx = createContext<CareContextValue | null>(null);

export function useCare(): CareContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCare must be used within CareProvider');
  return v;
}

function promptFor(r: Reminder): { message: string; options: PromptOption[] } {
  switch (r.kind) {
    case 'medicine':
      return {
        message: `It's time for your ${r.label.toLowerCase()}.`,
        options: [
          { label: 'TAKEN', value: 'taken', tone: 'primary' },
          { label: 'REMIND ME LATER', value: 'later', tone: 'soft' },
        ],
      };
    case 'meal':
      return {
        message: `It's time for ${r.label.toLowerCase()}. Have you eaten?`,
        options: [
          { label: 'YES', value: 'yes', tone: 'primary' },
          { label: 'NOT YET', value: 'not_yet', tone: 'soft' },
        ],
      };
    case 'water':
      return {
        message: `Please have some water.`,
        options: [
          { label: 'DONE', value: 'done', tone: 'primary' },
          { label: 'LATER', value: 'later', tone: 'soft' },
        ],
      };
    default:
      return {
        message: r.label,
        options: [
          { label: 'OKAY', value: 'done', tone: 'primary' },
          { label: 'LATER', value: 'later', tone: 'soft' },
        ],
      };
  }
}

function checkinPrompt(): { message: string; options: PromptOption[] } {
  return {
    message: 'Are you okay?',
    options: [
      { label: "I'M OKAY", value: 'ok', tone: 'primary' },
      { label: 'I NEED HELP', value: 'help', tone: 'help' },
    ],
  };
}

function severityFor(kind: AlertKind): AlertSeverity {
  if (kind === 'help_requested' || kind === 'fall') return 'help';
  if (kind === 'checkin_missed' || kind === 'reminder_missed') return 'attention';
  return 'normal';
}

export function CareProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CareState>(() => loadState());
  const [mode, setModeState] = useState<Mode>(() => state.preferences.mode);
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [fallCheck, setFallCheck] = useState<FallCheck | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  const stateRef = useRef(state);
  stateRef.current = state;
  const promptRef = useRef<ActivePrompt | null>(null);
  promptRef.current = activePrompt;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const firedRef = useRef<Set<string>>(new Set());

  // persist
  useEffect(() => {
    const toSave = { ...state, preferences: { ...state.preferences, mode } };
    saveState(toSave);
  }, [state, mode]);

  // online status
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const setMode = useCallback((m: Mode) => setModeState(m), []);

  const pushActivity = useCallback((text: string, kind: ActivityEntry['kind']) => {
    setState((s) => ({
      ...s,
      activity: [{ id: uid('act'), timestamp: Date.now(), text, kind }, ...s.activity].slice(0, 80),
    }));
  }, []);

  const pushAlert = useCallback((kind: AlertKind, message: string, meta?: Record<string, string | number>) => {
    const alert: AlertEvent = {
      id: uid('alert'),
      kind,
      severity: severityFor(kind),
      message,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      meta,
    };
    setState((s) => ({ ...s, alerts: [alert, ...s.alerts].slice(0, 60) }));
    if (alert.severity !== 'normal') {
      notify(alert.severity === 'help' ? 'CARE — Help requested' : 'CARE — Attention needed', message);
    }
    return alert;
  }, []);

  const dismissPrompt = useCallback(() => setActivePrompt(null), []);

  const presentPrompt = useCallback(
    (reminderId: string, kind: ReminderKind | 'checkin' | 'fall', label: string, message: string, options: PromptOption[]) => {
      const p: ActivePrompt = { id: uid('p'), reminderId, kind, label, message, options, startedAt: Date.now() };
      setActivePrompt(p);
      if (stateRef.current.settings.voiceEnabled) speak(message);
      notify(label, message);
    },
    [],
  );

  // Reminder engine — checks every 20s for due reminders and missed check-in
  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      const now = new Date();
      const hh = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const tkey = todayKey();

      // Missed check-in detection (only if no prompt active)
      if (!promptRef.current && !fallCheck) {
        const checkinReminder = s.reminders.find((r) => r.kind === 'checkin' && r.enabled);
        if (checkinReminder) {
          const todayCheckin = s.checkIns.find((c) => todayKey(c.timestamp) === tkey);
          if (!todayCheckin) {
            const dueMs = new Date();
            const [ch, cm] = s.settings.checkinTime.split(':').map((n) => parseInt(n, 10));
            dueMs.setHours(ch, cm, 0, 0);
            const overdueMs = dueMs.getTime() + s.settings.checkinGraceMinutes * 60000;
            if (Date.now() >= overdueMs && Date.now() - overdueMs < 90_000) {
              const fireKey = `missed_checkin_${tkey}`;
              if (!firedRef.current.has(fireKey)) {
                firedRef.current.add(fireKey);
                pushAlert('checkin_missed', 'Check-in missed — no response received.', {
                  expected: s.settings.checkinTime,
                });
              }
            }
          }
        }
      }

      // Due reminders (non-checkin)
      if (!promptRef.current) {
        for (const r of s.reminders) {
          if (!r.enabled || r.kind === 'checkin') continue;
          const fireKey = `${r.id}_${tkey}`;
          if (firedRef.current.has(fireKey)) continue;
          if (r.time === hh) {
            firedRef.current.add(fireKey);
            const { message, options } = promptFor(r);
            presentPrompt(r.id, r.kind, r.label, message, options);
            break;
          }
        }

        // Daily check-in prompt at configured time
        const checkinReminder = s.reminders.find((r) => r.kind === 'checkin' && r.enabled);
        if (checkinReminder && s.settings.checkinTime === hh) {
          const fireKey = `checkin_prompt_${tkey}`;
          if (!firedRef.current.has(fireKey)) {
            firedRef.current.add(fireKey);
            const { message, options } = checkinPrompt();
            presentPrompt(checkinReminder.id, 'checkin', 'Daily check-in', message, options);
          }
        }
      }

      // Missed reminder detection (30 min after due, not acknowledged)
      for (const r of s.reminders) {
        if (!r.enabled || r.kind === 'checkin') continue;
        const ackToday = s.acknowledgements.find(
          (a) => a.reminderId === r.id && todayKey(a.timestamp) === tkey,
        );
        if (ackToday) continue;
        const [rh, rm] = r.time.split(':').map((n) => parseInt(n, 10));
        const due = new Date();
        due.setHours(rh, rm, 0, 0);
        if (Date.now() >= due.getTime() + 30 * 60000 && Date.now() < due.getTime() + 32 * 60000) {
          const fireKey = `missed_${r.id}_${tkey}`;
          if (!firedRef.current.has(fireKey)) {
            firedRef.current.add(fireKey);
            pushAlert('reminder_missed', `${r.label} reminder not acknowledged.`, { time: r.time });
          }
        }
      }
    };

    const interval = window.setInterval(tick, 20_000);
    tick();
    return () => window.clearInterval(interval);
  }, [fallCheck, presentPrompt, pushAlert]);

  // Fall check auto-escalation (60s no response)
  useEffect(() => {
    if (!fallCheck) return;
    const t = window.setTimeout(() => {
      setFallCheck(null);
      pushAlert('fall', 'Possible fall detected — no response received.', { simulated: 1 });
      pushActivity('Possible fall — no response (simulated)', 'fall');
    }, 60_000);
    return () => window.clearTimeout(t);
  }, [fallCheck, pushAlert]);

  const checkIn = useCallback(
    (status: CheckInStatus, source: 'manual' | 'voice' | 'sensor' = 'manual') => {
      const entry: CheckIn = { id: uid('ci'), timestamp: Date.now(), status, source };
      setState((s) => ({ ...s, checkIns: [entry, ...s.checkIns].slice(0, 100) }));
      pushActivity(`Check-in: ${status === 'ok' ? "I'm okay" : 'help requested'}`, 'checkin_ok');
      if (status === 'ok') {
        pushAlert('checkin_ok', 'Checked in — all okay.');
        speak("You're all set. I've recorded your check-in.");
      } else {
        pushAlert('help_requested', 'Help requested during check-in.');
      }
      dismissPrompt();
    },
    [dismissPrompt, pushActivity, pushAlert],
  );

  const acknowledge = useCallback(
    (reminderId: string, status: AcknowledgementStatus, source: 'manual' | 'voice' = 'manual') => {
      const s = stateRef.current;
      const r = s.reminders.find((rm) => rm.id === reminderId);
      if (!r) return;
      const ack: Acknowledgement = {
        id: uid('ack'),
        reminderId,
        reminderLabel: r.label,
        reminderKind: r.kind,
        status,
        timestamp: Date.now(),
        expectedTime: r.time,
        source,
      };
      setState((prev) => ({ ...prev, acknowledgements: [ack, ...prev.acknowledgements].slice(0, 200) }));
      const verb =
        status === 'taken' ? 'marked as taken' :
        status === 'done' ? 'marked done' :
        status === 'yes' ? 'marked yes' :
        status === 'not_yet' ? 'marked not yet' : 'snoozed';
      pushActivity(`${r.label}: ${verb}`, 'reminder_ack');
      if (status === 'later' || status === 'not_yet') {
        // snooze — re-arm for 10 minutes later
        const tkey = todayKey();
        firedRef.current.delete(`${r.id}_${tkey}`);
      } else {
        pushAlert('reminder_ack', `${r.label} acknowledged.`);
        const confirmMsg =
          r.kind === 'medicine' ? "Okay. I've marked that medicine as taken." :
          r.kind === 'meal' ? "Done. I've noted that you've eaten." :
          r.kind === 'water' ? "Great. I've marked that as done." :
          "Okay. I've marked that reminder as done.";
        speak(confirmMsg);
      }
      dismissPrompt();
    },
    [dismissPrompt, pushActivity, pushAlert],
  );

  const requestHelp = useCallback(
    (source: 'manual' | 'voice' | 'sensor' = 'manual') => {
      pushAlert('help_requested', 'Help requested by the person.', { source });
      pushActivity('Help requested', 'help_requested');
      speak("Help requested. Your caregiver has been notified.");
      dismissPrompt();
    },
    [dismissPrompt, pushActivity, pushAlert],
  );

  const simulateFall = useCallback(() => {
    const fc: FallCheck = { active: true, startedAt: Date.now() };
    setFallCheck(fc);
    pushActivity('Possible fall detected (simulated sensor event)', 'fall');
    if (stateRef.current.settings.voiceEnabled) {
      speak('Possible fall detected. Are you okay?');
    }
    notify('CARE — Possible fall detected', 'Checking if the person is okay.');
  }, [pushActivity]);

  const resolveFallCheck = useCallback(
    (status: 'ok' | 'help') => {
      setFallCheck(null);
      if (status === 'ok') {
        pushAlert('fall', 'Possible fall — person confirmed they are okay.', { resolved: 1 });
        pushActivity('Fall check — person is okay', 'fall');
        speak("Glad you're okay.");
      } else {
        pushAlert('fall', 'Possible fall — help requested.', { help: 1 });
        pushActivity('Fall check — help requested', 'fall');
        requestHelp('sensor');
      }
    },
    [pushActivity, pushAlert, requestHelp],
  );

  const ingestSensorEvent = useCallback(
    (evt: SensorEvent) => {
      if (evt.type === 'fall' && evt.confidence >= 0.5) {
        simulateFall();
      } else if (evt.type === 'help_button') {
        requestHelp('sensor');
      } else {
        pushActivity(`Sensor event: ${evt.type} from ${evt.deviceId}`, 'sensor');
      }
    },
    [simulateFall, requestHelp, pushActivity],
  );

  const addReminder = useCallback((r: Omit<Reminder, 'id' | 'createdAt'>) => {
    setState((s) => ({ ...s, reminders: [...s.reminders, { ...r, id: uid('r'), createdAt: Date.now() }] }));
  }, []);

  const updateReminder = useCallback((id: string, patch: Partial<Reminder>) => {
    setState((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
  }, []);

  const markAlertSafe = useCallback((id: string) => {
    setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true, resolved: true } : a)) }));
    pushActivity('Marked person as safe', 'info');
  }, [pushActivity]);

  const resolveAlert = useCallback((id: string) => {
    setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, resolved: true, acknowledged: true } : a)) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<CareState['settings']>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setPreferences = useCallback((patch: Partial<CareState['preferences']>) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
  }, []);

  const speakNext = useCallback(() => {
    const s = stateRef.current;
    const tkey = todayKey();
    const upcoming = s.reminders
      .filter((r) => r.enabled && r.kind !== 'checkin')
      .filter((r) => !s.acknowledgements.find((a) => a.reminderId === r.id && todayKey(a.timestamp) === tkey))
      .sort((a, b) => a.time.localeCompare(b.time));
    const next = upcoming[0];
    if (next) {
      speak(`Your next reminder is ${next.label.toLowerCase()} at ${formatTime(next.time)}.`);
    } else {
      speak("Everything is done for today. Well done.");
    }
  }, []);

  const clearDemoData = useCallback(() => {
    setState((s) => ({ ...s, checkIns: [], acknowledgements: [], alerts: [], activity: [] }));
    firedRef.current.clear();
  }, []);

  // voice command interpreter — natural language understanding
  useEffect(() => {
    const normalize = (t: string): string =>
      t.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();

    const matchAny = (text: string, phrases: string[]): boolean =>
      phrases.some((p) => text === p || text.includes(p));

    const OKAY_PHRASES = [
      "i'm okay", 'i am okay', "i'm fine", 'i am fine', 'i am good',
      "i'm good", 'okay', 'ok', 'fine', 'all good', 'feeling okay',
      'yes i am okay', "yes i'm okay", 'im okay', 'im fine', 'im good',
    ];
    const HELP_PHRASES = [
      'i need help', 'help me', 'i need assistance', 'please help',
      'emergency', 'call my caregiver', 'call caregiver', 'need help',
      'help', 'i need some help', 'can you help',
    ];
    const DONE_PHRASES = [
      'done', 'finished', 'taken', 'i took it', "i've taken it",
      'completed', 'yes', 'i did it', 'i have eaten', 'i ate',
      "i've eaten", 'i drank', "i've had water", 'i had water',
    ];
    const LATER_PHRASES = [
      'later', 'remind me later', 'not now', "i'll do it later",
      'not yet', 'maybe later', 'in a bit', 'wait',
    ];
    const NEXT_PHRASES = [
      "what's next", 'next reminder', 'what do i need to do',
      "what's my next reminder", 'whats next', 'what is next',
      'anything else', 'what else',
    ];
    const STOP_PHRASES = [
      'stop', 'stop talking', 'quiet', 'cancel', 'silence',
      'stop speaking', 'be quiet', 'shush',
    ];

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ transcript: string }>).detail;
      const text = normalize(detail.transcript);
      if (!text) return;

      const p = promptRef.current;

      // STOP — always handled, regardless of context
      if (matchAny(text, STOP_PHRASES)) {
        stopSpeaking();
        return;
      }

      // HELP — works in any context
      if (matchAny(text, HELP_PHRASES)) {
        if (p?.kind === 'checkin') checkIn('help', 'voice');
        else requestHelp('voice');
        return;
      }

      // If there's an active prompt, handle within its context
      if (p) {
        if (matchAny(text, OKAY_PHRASES)) {
          if (p.kind === 'checkin') checkIn('ok', 'voice');
          else acknowledge(p.reminderId, 'taken', 'voice');
          return;
        }
        if (matchAny(text, DONE_PHRASES)) {
          const status: AcknowledgementStatus =
            p.kind === 'meal' ? 'yes' :
            p.kind === 'water' ? 'done' :
            p.kind === 'medicine' ? 'taken' : 'done';
          acknowledge(p.reminderId, status, 'voice');
          return;
        }
        if (matchAny(text, LATER_PHRASES)) {
          acknowledge(p.reminderId, p.kind === 'meal' ? 'not_yet' : 'later', 'voice');
          return;
        }
        if (matchAny(text, NEXT_PHRASES)) {
          speakNext();
          return;
        }
        return;
      }

      // No active prompt — handle global commands
      if (matchAny(text, OKAY_PHRASES)) {
        checkIn('ok', 'voice');
        return;
      }
      if (matchAny(text, NEXT_PHRASES)) {
        speakNext();
        return;
      }
    };
    window.addEventListener('care-voice-command', handler as EventListener);
    return () => window.removeEventListener('care-voice-command', handler as EventListener);
  }, [acknowledge, checkIn, requestHelp, speakNext]);

  const value = useMemo<CareContextValue>(
    () => ({
      ...state,
      mode,
      setMode,
      activePrompt,
      fallCheck,
      online,
      checkIn,
      acknowledge,
      requestHelp,
      simulateFall,
      resolveFallCheck,
      ingestSensorEvent,
      addReminder,
      updateReminder,
      deleteReminder,
      acknowledgeAlert,
      markAlertSafe,
      resolveAlert,
      updateSettings,
      setPreferences,
      dismissPrompt,
      speakNext,
      clearDemoData,
    }),
    [
      state, mode, setMode, activePrompt, fallCheck, online, checkIn, acknowledge, requestHelp,
      simulateFall, resolveFallCheck, ingestSensorEvent, addReminder, updateReminder, deleteReminder,
      acknowledgeAlert, markAlertSafe, resolveAlert, updateSettings, setPreferences, dismissPrompt,
      speakNext, clearDemoData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// helper export for components needing prompt option metadata
export function optionForPrompt(p: ActivePrompt | null) {
  return p?.options ?? [];
}

export { reminderIcon, nowHHMM, todayKey };
export { defaultState };
