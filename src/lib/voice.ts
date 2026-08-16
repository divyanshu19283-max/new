// Voice service — browser-native SpeechSynthesis with natural voice selection,
// speech queueing, and a provider abstraction for future cloud voice integration.

// ---- Provider abstraction (future-ready) ----

export interface VoiceProvider {
  speak(text: string, opts?: SpeakOptions): void;
  stop(): void;
  isAvailable(): boolean;
  isSpeaking(): boolean;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

// ---- Voice selection ----

export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  uri?: string;
}

const NATURAL_KEYWORDS = ['natural', 'neural', 'online', 'premium', 'enhanced'];

function voiceScore(v: VoiceInfo): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase();
  let score = 0;

  if (!lang.startsWith('en')) return -100;

  // Prefer en-IN, then en-US, then en-GB, then other English
  if (lang === 'en-in') score += 30;
  else if (lang === 'en-us') score += 25;
  else if (lang === 'en-gb') score += 20;
  else score += 10;

  // Natural/neural/premium voices get a big boost
  for (const kw of NATURAL_KEYWORDS) {
    if (name.includes(kw)) {
      score += 50;
      break;
    }
  }

  // Microsoft and Google voices tend to be higher quality
  if (name.includes('microsoft')) score += 15;
  if (name.includes('google')) score += 12;

  // Prefer local service voices (no network delay)
  if (v.localService) score += 5;

  // Default voice gets a small boost as tiebreaker
  if (v.default) score += 2;

  return score;
}

function pickBestVoice(voices: VoiceInfo[]): VoiceInfo | null {
  if (voices.length === 0) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (english.length === 0) return voices[0];
  let best = english[0];
  let bestScore = voiceScore(best);
  for (const v of english.slice(1)) {
    const s = voiceScore(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

// ---- BrowserSpeechProvider ----

class BrowserSpeechProvider implements VoiceProvider {
  private synth: SpeechSynthesis | null = null;
  private available = false;
  private voices: SpeechSynthesisVoice[] = [];
  private bestVoice: SpeechSynthesisVoice | null = null;
  private speaking = false;
  private queue: { text: string; opts: SpeakOptions }[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.available = true;
      this.loadVoices();
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices();
      const mapped: VoiceInfo[] = this.voices.map((v) => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
        uri: v.voiceURI,
      }));
      const best = pickBestVoice(mapped);
      if (best) {
        this.bestVoice = this.voices.find((v) => v.name === best.name && v.lang === best.lang) ?? null;
      }
    } catch {
      // non-fatal
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.bestVoice && this.synth) this.loadVoices();
    return this.bestVoice;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) this.loadVoices();
    return this.voices;
  }

  stop(): void {
    if (!this.synth) return;
    this.queue = [];
    this.speaking = false;
    this.currentUtterance = null;
    try {
      this.synth.cancel();
    } catch {
      // non-fatal
    }
  }

  speak(text: string, opts: SpeakOptions = {}): void {
    if (!this.synth || !text.trim()) return;

    // Cancel any current speech and clear queue for new announcements
    this.stop();

    // Split long text into short natural sentences
    const sentences = splitSentences(text);
    for (const s of sentences) {
      this.queue.push({ text: s, opts });
    }
    this.processQueue();
  }

  private processQueue(): void {
    if (!this.synth || this.queue.length === 0) {
      this.speaking = false;
      this.currentUtterance = null;
      return;
    }

    const item = this.queue.shift()!;
    try {
      const u = new SpeechSynthesisUtterance(item.text);
      u.rate = item.opts.rate ?? 0.9;
      u.pitch = item.opts.pitch ?? 0.98;
      u.volume = 1.0;

      const voice = this.getBestVoice();
      if (voice) u.voice = voice;

      u.onstart = () => {
        this.speaking = true;
      };
      u.onend = () => {
        this.currentUtterance = null;
        if (this.queue.length > 0) {
          this.processQueue();
        } else {
          this.speaking = false;
        }
      };
      u.onerror = () => {
        this.currentUtterance = null;
        this.queue = [];
        this.speaking = false;
      };

      this.currentUtterance = u;
      this.synth.speak(u);
    } catch {
      this.speaking = false;
      this.currentUtterance = null;
    }
  }
}

// ---- Sentence splitting ----

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation and newlines, keep reasonable chunks
  const raw = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (raw.length <= 1) return raw.length === 1 ? raw : [];

  // If a single "sentence" is very long, split further on commas
  const result: string[] = [];
  for (const s of raw) {
    if (s.length <= 120) {
      result.push(s);
    } else {
      const parts = s.split(/,\s+/).map((p) => p.trim()).filter((p) => p.length > 0);
      for (const p of parts) result.push(p);
    }
  }
  return result;
}

// ---- Singleton ----

let provider: VoiceProvider | null = null;

function getProvider(): VoiceProvider {
  if (!provider) {
    provider = new BrowserSpeechProvider();
  }
  return provider;
}

// ---- Public API (preserves existing interface) ----

export function isVoiceAvailable(): boolean {
  return getProvider().isAvailable();
}

export function speak(text: string, opts?: SpeakOptions): void {
  getProvider().speak(text, opts);
}

export function stopSpeaking(): void {
  getProvider().stop();
}

export function isSpeaking(): boolean {
  return getProvider().isSpeaking();
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  const p = getProvider();
  if (p instanceof BrowserSpeechProvider) return p.getAvailableVoices();
  return [];
}

export function getBestVoice(): SpeechSynthesisVoice | null {
  const p = getProvider();
  if (p instanceof BrowserSpeechProvider) return p.getBestVoice();
  return null;
}
