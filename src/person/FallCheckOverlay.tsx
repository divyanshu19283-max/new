import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { useCare } from '@/store/CareContext';

// Possible fall detected confirmation overlay
export function FallCheckOverlay() {
  const { fallCheck, resolveFallCheck } = useCare();
  if (!fallCheck) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slatey-900/40 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-lg rounded-4xl bg-white p-8 shadow-card animate-scale-in text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-amber-soft/60">
          <AlertTriangle size={44} className="text-amber-deep" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-deep mb-3">
          Demo / simulated sensor event
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-slatey-900 mb-2">
          Possible fall detected
        </h2>
        <p className="text-xl text-slatey-700 mb-8">Checking if you're okay…</p>
        <div className="grid gap-4">
          <Button size="xl" variant="primary" fullWidth onClick={() => resolveFallCheck('ok')}>
            <ShieldCheck size={32} /> I'M OKAY
          </Button>
          <Button size="xl" variant="help" fullWidth onClick={() => resolveFallCheck('help')}>
            I NEED HELP
          </Button>
        </div>
        <p className="mt-6 text-xs text-sand-600">
          This is a simulated sensor event for demonstration. No real sensor is connected.
        </p>
      </div>
    </div>
  );
}
