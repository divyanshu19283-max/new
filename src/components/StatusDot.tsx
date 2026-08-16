import type { AlertSeverity } from '@/types';

const STYLES: Record<AlertSeverity, { dot: string; bg: string; text: string; label: string }> = {
  normal: { dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-700', label: 'Normal' },
  attention: { dot: 'bg-amber-deep', bg: 'bg-amber-soft/40', text: 'text-amber-deep', label: 'Attention' },
  help: { dot: 'bg-coral-500', bg: 'bg-coral-50', text: 'text-coral-700', label: 'Help requested' },
};

export function StatusDot({ severity, pulse = false }: { severity: AlertSeverity; pulse?: boolean }) {
  const s = STYLES[severity];
  return (
    <span className={`inline-flex items-center gap-2 ${s.text} font-semibold`}>
      <span className={`relative inline-block h-3 w-3 rounded-full ${s.dot}`}>
        {pulse && severity !== 'normal' && (
          <span className={`absolute inset-0 rounded-full ${s.dot} animate-pulse-soft`} />
        )}
      </span>
      {s.label}
    </span>
  );
}

export function severityStyle(severity: AlertSeverity) {
  return STYLES[severity];
}
