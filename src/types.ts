export type Mode = 'landing' | 'person' | 'caregiver' | 'device';

export type ReminderKind = 'medicine' | 'meal' | 'water' | 'checkin' | 'custom';

export type RepeatType = 'daily';

export interface Reminder {
  id: string;
  kind: ReminderKind;
  label: string;
  time: string; // "HH:MM"
  repeat: RepeatType;
  enabled: boolean;
  createdAt: number;
}

export type CheckInStatus = 'ok' | 'help';

export interface CheckIn {
  id: string;
  timestamp: number;
  status: CheckInStatus;
  source: 'manual' | 'voice' | 'sensor';
}

export type AcknowledgementStatus = 'taken' | 'done' | 'yes' | 'later' | 'not_yet';

export interface Acknowledgement {
  id: string;
  reminderId: string;
  reminderLabel: string;
  reminderKind: ReminderKind;
  status: AcknowledgementStatus;
  timestamp: number;
  expectedTime?: string;
  source: 'manual' | 'voice';
}

export type AlertSeverity = 'normal' | 'attention' | 'help';
export type AlertKind =
  | 'checkin_ok'
  | 'checkin_missed'
  | 'help_requested'
  | 'reminder_ack'
  | 'reminder_missed'
  | 'fall'
  | 'sensor';

export interface AlertEvent {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
  meta?: Record<string, string | number>;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  text: string;
  kind: AlertKind | 'info';
}

export interface SensorEvent {
  type: 'fall' | 'help_button' | 'door' | 'motion';
  deviceId: string;
  timestamp: string;
  confidence: number;
}

export interface PersonProfile {
  name: string;
  caregiverPhone?: string;
}

export interface CaregiverSettings {
  person: PersonProfile;
  checkinTime: string; // "HH:MM"
  checkinGraceMinutes: number;
  caregiverPhone?: string;
  notificationsEnabled: boolean;
  voiceEnabled: boolean;
}

export interface Preferences {
  mode: Mode;
  voiceEnabled: boolean;
  reducedMotion: boolean;
}

export interface CareState {
  reminders: Reminder[];
  checkIns: CheckIn[];
  acknowledgements: Acknowledgement[];
  alerts: AlertEvent[];
  activity: ActivityEntry[];
  settings: CaregiverSettings;
  preferences: Preferences;
}
