import { Mic, MicOff, Loader2, Check, AlertCircle, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isRecognitionSupported,
  startRecognition,
  requestMicPermission,
  type RecognitionHandle,
  type RecognitionErrorCode,
} from '@/lib/speechRecognition';
import { stopSpeaking } from '@/lib/voice';

type VoiceState = 'idle' | 'permission' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';

interface Props {
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export function VoiceButton({ disabled, label = 'Speak', size = 'sm' }: Props) {
  const supported = isRecognitionSupported();
  const [state, setState] = useState<VoiceState>(supported ? 'idle' : 'unsupported');
  const [interim, setInterim] = useState('');
  const [heard, setHeard] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const handleRef = useRef<RecognitionHandle | null>(null);
  const successTimer = useRef<number | null>(null);
  const errorTimer = useRef<number | null>(null);

  const sizeClasses = size === 'sm' ? 'px-4 py-2.5 text-sm' : 'px-5 py-3.5 text-base';

  const clearTimers = useCallback(() => {
    if (successTimer.current) { window.clearTimeout(successTimer.current); successTimer.current = null; }
    if (errorTimer.current) { window.clearTimeout(errorTimer.current); errorTimer.current = null; }
  }, []);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
  }, []);

  useEffect(() => () => { stop(); clearTimers(); }, [stop, clearTimers]);

  // Reset to idle after success/error messages
  useEffect(() => {
    if (state === 'success') {
      successTimer.current = window.setTimeout(() => setState('idle'), 2500);
    }
    if (state === 'error') {
      errorTimer.current = window.setTimeout(() => setState('idle'), 5000);
    }
    return () => { if (successTimer.current) window.clearTimeout(successTimer.current); if (errorTimer.current) window.clearTimeout(errorTimer.current); };
  }, [state]);

  const handleResult = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setHeard(transcript.trim());
      setInterim('');
      setState('processing');
      window.dispatchEvent(new CustomEvent('care-voice-command', { detail: { transcript } }));
      window.setTimeout(() => setState('success'), 400);
    } else {
      setInterim(transcript.trim());
    }
  }, []);

  const handleError = useCallback((code: RecognitionErrorCode, message: string) => {
    if (code === 'aborted' || code === 'no-speech') {
      // no-speech: show a gentle message, not a hard error
      if (code === 'no-speech') {
        setErrorMsg("I didn't hear anything. Please try again or use the buttons.");
        setState('error');
      }
      return;
    }
    setErrorMsg(message || 'Voice recognition had a problem. You can still use the buttons.');
    setState('error');
    handleRef.current = null;
  }, []);

  const handleEnd = useCallback(() => {
    handleRef.current = null;
    if (state !== 'success' && state !== 'error' && state !== 'processing') {
      setState('idle');
    }
  }, [state]);

  const beginListening = useCallback(() => {
    setState('listening');
    setInterim('');
    setHeard('');
    setErrorMsg('');

    const h = startRecognition(
      {
        onStart: () => setState('listening'),
        onResult: handleResult,
        onError: handleError,
        onEnd: handleEnd,
      },
      { lang: 'en-IN', timeoutMs: 9000 },
    );
    handleRef.current = h;
    if (!h) {
      setErrorMsg('Voice recognition isn\'t available right now. You can still use the buttons.');
      setState('error');
    }
  }, [handleResult, handleError, handleEnd]);

  const requestPermission = useCallback(async () => {
    setState('permission');
    const result = await requestMicPermission();
    if (result === 'granted') {
      beginListening();
    } else if (result === 'denied') {
      setErrorMsg('Microphone access was denied. You can still use the buttons.');
      setState('error');
    } else {
      // getUserMedia unsupported — try recognition directly (some browsers allow it)
      beginListening();
    }
  }, [beginListening]);

  const onClick = useCallback(() => {
    if (disabled) return;

    if (state === 'listening') {
      stop();
      setState('idle');
      return;
    }

    // Stop any ongoing speech when user wants to talk
    stopSpeaking();

    if (state === 'idle' || state === 'success' || state === 'error') {
      clearTimers();
      requestPermission();
    }
  }, [disabled, state, stop, requestPermission, clearTimers]);

  // ---- Unsupported ----
  if (state === 'unsupported') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-cream-100 ${sizeClasses} font-semibold text-sand-600 opacity-80`}
        title="Voice control isn't supported by this browser."
      >
        <MicOff size={18} /> Voice not supported
      </span>
    );
  }

  // ---- Error ----
  if (state === 'error') {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <span className={`inline-flex items-center gap-2 rounded-2xl border border-coral-400 bg-coral-50 ${sizeClasses} font-bold text-coral-700`}>
          <AlertCircle size={18} /> Voice problem
        </span>
        <span className="text-xs text-coral-700 font-semibold max-w-[260px]">{errorMsg}</span>
        <button
          type="button"
          onClick={onClick}
          className="text-xs text-sage-700 font-bold underline mt-0.5"
        >
          Try again
        </button>
      </span>
    );
  }

  // ---- Permission ----
  if (state === 'permission') {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <button
          type="button"
          disabled
          className={`inline-flex items-center gap-2 rounded-2xl bg-sage-100 ${sizeClasses} font-bold text-sage-700`}
        >
          <Loader2 size={18} className="animate-spin" /> Allow microphone…
        </button>
        <span className="text-xs text-slatey-700 font-semibold">Allow microphone access so CARE can listen.</span>
      </span>
    );
  }

  // ---- Listening ----
  if (state === 'listening') {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-2 rounded-2xl ${sizeClasses} font-bold bg-coral-500 text-white shadow-glowCoral animate-pulse-soft transition-all`}
          aria-pressed
          aria-label="Stop listening"
        >
          <Mic size={18} /> I'm listening…
        </button>
        {interim && (
          <span className="text-sm text-slatey-700 italic max-w-[280px]">"{interim}…"</span>
        )}
        {!interim && (
          <span className="text-xs text-sand-600 font-semibold">Say something like "I'm okay" or "Done"</span>
        )}
      </span>
    );
  }

  // ---- Processing ----
  if (state === 'processing') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-2xl bg-sage-100 ${sizeClasses} font-bold text-sage-700`}>
        <Loader2 size={18} className="animate-spin" /> Understanding…
      </span>
    );
  }

  // ---- Success ----
  if (state === 'success') {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <span className={`inline-flex items-center gap-2 rounded-2xl bg-sage-50 ${sizeClasses} font-bold text-sage-700`}>
          <Check size={18} /> Heard
        </span>
        {heard && <span className="text-xs text-slatey-700 font-semibold">"{heard}"</span>}
      </span>
    );
  }

  // ---- Idle ----
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-2xl ${sizeClasses} font-bold transition-all active:scale-95 bg-sage-100 text-sage-700 hover:bg-sage-400 hover:text-white`}
      aria-label={label}
    >
      <Mic size={18} /> {label}
    </button>
  );
}
