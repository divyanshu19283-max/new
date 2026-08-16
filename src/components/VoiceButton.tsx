import { Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isRecognitionSupported, startRecognition, type RecognitionHandle } from '@/lib/speechRecognition';

interface Props {
  disabled?: boolean;
  label?: string;
  onUnsupported?: () => void;
}

export function VoiceButton({ disabled, label = 'Speak', onUnsupported }: Props) {
  const supported = isRecognitionSupported();
  const [listening, setListening] = useState(false);
  const handleRef = useRef<RecognitionHandle | null>(null);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        onClick={onUnsupported}
        className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-cream-100 px-4 py-2.5 text-sm font-semibold text-sand-600 opacity-80"
        title="Voice control isn't available on this device"
      >
        <MicOff size={18} /> Voice unavailable
      </button>
    );
  }

  const start = () => {
    if (disabled) return;
    setListening(true);
    const h = startRecognition({
      onStart: () => setListening(true),
      onEnd: () => {
        setListening(false);
        handleRef.current = null;
      },
      onError: () => {
        setListening(false);
        handleRef.current = null;
      },
      onResult: (transcript) => {
        window.dispatchEvent(new CustomEvent('care-voice-command', { detail: { transcript } }));
      },
    });
    handleRef.current = h;
    if (!h) setListening(false);
  };

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95',
        listening
          ? 'bg-coral-500 text-white shadow-glowCoral animate-pulse-soft'
          : 'bg-sage-100 text-sage-700 hover:bg-sage-400 hover:text-white',
      ].join(' ')}
      aria-pressed={listening}
      aria-label={listening ? 'Stop listening' : label}
    >
      <Mic size={18} /> {listening ? 'Listening…' : label}
    </button>
  );
}
