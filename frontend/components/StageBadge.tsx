'use client';
import clsx from 'clsx';
import type { ArStage, PvStage, PrStage, ApStatus } from '@/lib/types';
import { AR_STAGE, PV_STAGE, PR_STAGE, AP_STATUS } from '@/lib/stages';

type Kind = 'ar' | 'pv' | 'pr' | 'ap';

export function StageBadge({
  stage, kind = 'ar', size = 'md',
}: {
  stage: ArStage | PvStage | PrStage | ApStatus;
  kind?: Kind;
  size?: 'sm' | 'md';
}) {
  const map = kind === 'pv' ? PV_STAGE : kind === 'pr' ? PR_STAGE : kind === 'ap' ? AP_STATUS : AR_STAGE;
  const s = (map as Record<string, { short: string; bg: string; fg: string; dot: string }>)[stage];
  if (!s) return <span className="text-2xs text-ink-muted">{stage}</span>;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded font-medium',
        s.bg, s.fg,
        size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs',
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.short}
    </span>
  );
}
