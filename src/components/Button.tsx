import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'help' | 'soft' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'xl';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700 shadow-soft',
  help: 'bg-coral-500 text-white hover:bg-coral-600 active:bg-coral-700 shadow-soft',
  soft: 'bg-cream-200 text-slatey-800 hover:bg-cream-300 active:bg-sand-400 shadow-soft',
  ghost: 'bg-transparent text-slatey-700 hover:bg-cream-200 active:bg-cream-300',
  danger: 'bg-coral-50 text-coral-700 border border-coral-400 hover:bg-coral-100 active:bg-coral-400',
};

const SIZES: Record<Size, string> = {
  md: 'px-5 py-3 text-base rounded-2xl min-h-[52px]',
  lg: 'px-7 py-5 text-lg rounded-3xl min-h-[64px]',
  xl: 'px-8 py-7 text-2xl rounded-3xl min-h-[88px]',
};

export function Button({ variant = 'primary', size = 'md', fullWidth, children, className = '', ...rest }: Props) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-3 font-bold no-select',
        'transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100',
        'touch-manipulation select-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
