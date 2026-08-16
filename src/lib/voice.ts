let synth: SpeechSynthesis | null = null;
let supported = false;

function ensure(): void {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
    supported = true;
  }
}

export function isVoiceAvailable(): boolean {
  ensure();
  return supported;
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}): void {
  ensure();
  if (!synth) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 0.92;
    u.pitch = opts.pitch ?? 1.0;
    const voices = synth.getVoices();
    const en = voices.find((v) => v.lang.startsWith('en'));
    if (en) u.voice = en;
    synth.speak(u);
  } catch {
    // non-fatal
  }
}

export function stopSpeaking(): void {
  ensure();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // non-fatal
  }
}
