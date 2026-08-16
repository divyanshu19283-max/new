import { ArrowRight, Heart, ShieldCheck, Smartphone, Mic } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useCare } from '@/store/CareContext';

export function Landing() {
  const { setMode } = useCare();

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* top */}
      <header className="px-4 sm:px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Logo size="md" />
        <span className="text-xs font-bold uppercase tracking-wider text-sand-600 bg-cream-200 px-3 py-1.5 rounded-full">
          Demo Mode
        </span>
      </header>

      {/* hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 bg-sage-50 text-sage-700 font-bold text-sm px-4 py-2 rounded-full mb-8 animate-fade-in">
            <Heart size={16} fill="currentColor" /> Simple support when it matters
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-slatey-900 leading-[1.05] text-balance animate-slide-up">
            Care, made calm.
            <span className="block text-sage-600 mt-2">For the people you love.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slatey-700 max-w-xl mx-auto text-balance animate-slide-up" style={{ animationDelay: '80ms' }}>
            CARE is a gentle daily assistant — check-ins, medicine reminders, and a clear way to ask for help. Works on an ordinary phone or computer. No expensive hardware. No paid subscriptions.
          </p>

          {/* mode selection */}
          <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '160ms' }}>
            <button
              onClick={() => setMode('person')}
              className="group text-left bg-white rounded-3xl p-6 sm:p-7 shadow-card hover:shadow-soft transition-all hover:-translate-y-0.5 active:scale-[0.98] border border-cream-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-sage-600">
                  <Heart size={26} fill="currentColor" />
                </div>
                <ArrowRight size={22} className="text-sand-600 group-hover:text-sage-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-display text-2xl text-slatey-900 mb-1">Person Mode</h3>
              <p className="text-slatey-700">Large buttons, gentle reminders, and an obvious help button. Built for someone who may not be comfortable with technology.</p>
            </button>

            <button
              onClick={() => setMode('caregiver')}
              className="group text-left bg-white rounded-3xl p-6 sm:p-7 shadow-card hover:shadow-soft transition-all hover:-translate-y-0.5 active:scale-[0.98] border border-cream-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-100 text-coral-600">
                  <ShieldCheck size={26} />
                </div>
                <ArrowRight size={22} className="text-sand-600 group-hover:text-coral-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-display text-2xl text-slatey-900 mb-1">Caregiver Mode</h3>
              <p className="text-slatey-700">See if everything looks normal, manage reminders, and respond when attention is needed. A calm dashboard, not a hospital screen.</p>
            </button>
          </div>

          {/* features */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '240ms' }}>
            <Feature icon={<Smartphone size={20} />} title="Works on any phone" body="Old Android, tablet, or computer — just a browser." />
            <Feature icon={<Mic size={20} />} title="Voice where supported" body={'Say "okay" or "done". Buttons always work too.'} />
            <Feature icon={<ShieldCheck size={20} />} title="Private by default" body="Your data stays on the device. No paid cloud required." />
          </div>

          <p className="mt-10 text-xs text-sand-600 max-w-md mx-auto">
            CARE is a prototype, not a medical device. It does not provide medical-grade fall detection or emergency monitoring.
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white/60 rounded-2xl p-4 text-left border border-cream-200">
      <div className="text-sage-600 mb-2">{icon}</div>
      <p className="font-bold text-slatey-900 text-sm">{title}</p>
      <p className="text-sm text-slatey-700 mt-0.5">{body}</p>
    </div>
  );
}
