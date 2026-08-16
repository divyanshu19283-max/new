// Minimal SpeechRecognition wrapper using the Web Speech API.
// Works in Chrome/Edge and some Android browsers. Falls back gracefully.

type AnySpeechRecognition = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

let RecognitionCtor: any = null;

function ensure(): void {
  if (typeof window === 'undefined') return;
  const w = window as AnySpeechRecognition;
  RecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isRecognitionSupported(): boolean {
  ensure();
  return !!RecognitionCtor;
}

export interface RecognitionHandlers {
  onResult: (transcript: string) => void;
  onError?: () => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface RecognitionHandle {
  stop: () => void;
}

export function startRecognition(handlers: RecognitionHandlers, lang = 'en-US'): RecognitionHandle | null {
  ensure();
  if (!RecognitionCtor) return null;
  try {
    const rec = new RecognitionCtor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => handlers.onStart?.();
    rec.onerror = () => handlers.onError?.();
    rec.onend = () => handlers.onEnd?.();
    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) handlers.onResult(transcript);
    };

    rec.start();
    return {
      stop: () => {
        try {
          rec.stop();
        } catch {
          // non-fatal
        }
      },
    };
  } catch {
    return null;
  }
}
