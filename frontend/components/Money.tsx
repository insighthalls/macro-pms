'use client';
import clsx from 'clsx';
import { fmtMwk, fmtMwkCompact } from '@/lib/format';

export function Money({ value, compact = false, className }: {
  value: string | number | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx('font-mono tabular-nums', className)}>
      {compact ? fmtMwkCompact(value) : fmtMwk(value)}
    </span>
  );
}
