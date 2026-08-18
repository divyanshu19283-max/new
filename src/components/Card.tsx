import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'status' | 'alert';
  padding?: 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  default: 'bg-white/80 backdrop-blur-sm border-cream-300',
  status: 'bg-white border-cream-300',
  alert: 'bg-white border-cream-300',
};

const PADDING = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function Card({ children, variant = 'default', padding = 'md', className = '', ...rest }: Props) {
  return (
    <div
      className={[
        'rounded-3xl border shadow-card',
        VARIANTS[variant],
        PADDING[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
