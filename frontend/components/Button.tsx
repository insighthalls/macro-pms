'use client';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary:   'bg-brand text-white hover:bg-brand-600 disabled:bg-brand-200 disabled:text-white',
  secondary: 'bg-white text-ink border border-line hover:bg-canvas hover:border-line-strong',
  ghost:     'text-ink-muted hover:bg-canvas hover:text-ink',
  danger:    'bg-bad text-white hover:bg-red-700',
};

const SIZE: Record<Size, string> = {
  sm: 'h-7  px-2.5 text-xs gap-1.5 rounded',
  md: 'h-9  px-3.5 text-sm gap-2   rounded-md',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed',
        VARIANT[variant], SIZE[size], className,
      )}
    >
      {children}
    </button>
  );
}
