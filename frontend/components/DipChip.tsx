'use client';
import clsx from 'clsx';

export function DipChip({ code, watch, className }: {
  code: string;
  watch?: 'GREEN' | 'AMBER' | 'RED';
  className?: string;
}) {
  const tint =
    watch === 'RED'   ? 'bg-bad-soft  text-bad'
  : watch === 'AMBER' ? 'bg-warn-soft text-warn'
  :                     'bg-brand-50  text-brand-700';
  return (
    <span className={clsx('inline-flex items-center rounded font-mono text-2xs px-1.5 py-0.5', tint, className)}>
      {code}
    </span>
  );
}
