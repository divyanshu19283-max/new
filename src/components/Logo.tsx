import { Heart } from 'lucide-react';

export function Logo({ size = 'md', tone = 'dark' }: { size?: 'sm' | 'md' | 'lg'; tone?: 'dark' | 'light' }) {
  const color = tone === 'light' ? 'text-cream-100' : 'text-sage-600';
  const text = tone === 'light' ? 'text-cream-100' : 'text-slatey-900';
  const sizes = {
    sm: { icon: 18, text: 'text-base' },
    md: { icon: 22, text: 'text-xl' },
    lg: { icon: 30, text: 'text-3xl' },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5 no-select">
      <div className={`grid place-items-center rounded-2xl bg-sage-100 ${color}`}>
        <Heart size={s.icon} strokeWidth={2.4} className="m-1.5" fill="currentColor" />
      </div>
      <span className={`font-display font-semibold tracking-tight ${s.text} ${text}`}>CARE</span>
    </div>
  );
}
