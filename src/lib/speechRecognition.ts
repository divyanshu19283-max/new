// SpeechRecognition wrapper — robust permission flow, interim results,
// timeout, and human-friendly error handling using the Web Speech API.

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

export type RecognitionErrorCode =
  | 'not-allowed'
  | 'service-not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unknown';

export interface RecognitionHandlers {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (code: RecognitionErrorCode, message: string) => void;
  onEnd?: () => void;
}

export interface RecognitionHandle {
  stop: () => void;
}

export interface RecognitionConfig {
  lang?: string;
  timeoutMs?: number;
}

export function startRecognition(
  handlers: RecognitionHandlers,
  config: RecognitionConfig = {},
): RecognitionHandle | null {
  ensure();
  if (!RecognitionCtor) return null;

  const lang = config.lang ?? 'en-IN';
  const timeoutMs = config.timeoutMs ?? 9000;

  try {
    const rec = new RecognitionCtor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let timeoutId: number | null = null;
    let hasFinalResult = false;
    let aborted = false;

    const clearTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const resetTimer = () => {
      clearTimer();
      timeoutId = window.setTimeout(() => {
        clearTimer();
        try {
          rec.stop();
        } catch {
          // non-fatal
        }
      }, timeoutMs);
    };

    rec.onstart = () => {
      resetTimer();
      handlers.onStart?.();
    };

    rec.onresult = (event: any) => {
      resetTimer();
      const results = event.results;
      if (!results || results.length === 0) return;

      const lastIdx = results.length - 1;
      const result = results[lastIdx];
      const transcript = result[0]?.transcript ?? '';
      const isFinal = result.isFinal;

      if (transcript) {
        handlers.onResult(transcript, isFinal);
      }

      if (isFinal) {
        hasFinalResult = true;
        clearTimer();
      }
    };

    rec.onerror = (event: any) => {
      clearTimer();
      const rawError = event?.error ?? 'unknown';
      const { code, message } = humanizeError(rawError);
      if (code === 'aborted' && aborted) return;
      handlers.onError?.(code, message);
    };

    rec.onend = () => {
      clearTimer();
      handlers.onEnd?.();
    };

    rec.start();

    return {
      stop: () => {
        aborted = true;
        clearTimer();
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

function humanizeError(raw: string): { code: RecognitionErrorCode; message: string } {
  switch (raw) {
    case 'not-allowed':
      return {
        code: 'not-allowed',
        message: 'Microphone access is blocked. Please allow it in your browser settings.',
      };
    case 'service-not-allowed':
      return {
        code: 'service-not-allowed',
        message: 'Voice recognition isn\'t available right now. You can still use the buttons.',
      };
    case 'no-speech':
      return {
        code: 'no-speech',
        message: "I didn't hear anything. Please try again or use the buttons.",
      };
    case 'audio-capture':
      return {
        code: 'audio-capture',
        message: "I couldn't access the microphone on this device. You can still use the buttons.",
      };
    case 'network':
      return {
        code: 'network',
        message: 'Voice recognition isn\'t available right now. You can still use the buttons.',
      };
    case 'aborted':
      return { code: 'aborted', message: '' };
    default:
      return {
        code: 'unknown',
        message: 'Voice recognition had a problem. You can still use the buttons.',
      };
  }
}

// Request microphone permission via getUserMedia as a pre-check.
// This prompts the browser permission dialog before we start recognition.
export async function requestMicPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'granted';
  } catch {
    return 'denied';
  }
}
