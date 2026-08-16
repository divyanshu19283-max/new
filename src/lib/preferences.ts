import type { CaregiverSettings, Preferences } from '@/types';
import { defaultState } from '@/storage';

const PREFS_KEY = 'care.prefs.v1';

export function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultState().preferences;
    return { ...defaultState().preferences, ...JSON.parse(raw) };
  } catch {
    return defaultState().preferences;
  }
}

export function savePrefs(p: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // non-fatal
  }
}

export function loadSettings(): CaregiverSettings {
  try {
    const raw = localStorage.getItem('care.settings.v1');
    if (!raw) return defaultState().settings;
    return { ...defaultState().settings, ...JSON.parse(raw) };
  } catch {
    return defaultState().settings;
  }
}

export function saveSettings(s: CaregiverSettings): void {
  try {
    localStorage.setItem('care.settings.v1', JSON.stringify(s));
  } catch {
    // non-fatal
  }
}
