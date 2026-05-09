'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { usePaymentVouchers } from '@/lib/queries-pv';
import { fmtRelative } from '@/lib/format';
import type { PvStage } from '@/lib/types';

const FILTERS: { key: PvStage | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PO_SUBMITTED', label: 'Submitted' },
  { key: 'GFO_REVIEWED', label: 'GFO reviewed' },
  { key: 'FM_APPROVED',  label: 'FM approved' },
  { key: 'SCHEDULED',    label: 'Scheduled' },
  { key: 'PAID',         label: 'Paid' },
  { key: 'RETURNED',     label: 'Returned' },
];

export default function GfoPvListPage() {
  const [filter, setFilter] = useState<PvStage | 'ALL'>('ALL');
  const { data: pvs = [] } = usePaymentVouchers(filter !== 'ALL' ? { stage: filter } : undefined);
  return (
    <>
      <Topbar title="Payment Vouchers" subtitle="GFO review queue" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-canvas">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 h-8 rounded-md text-xs border transition-colors ${filter === f.key ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-line hover:border-brand-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <Card padded={false}>
          {pvs.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">No vouchers in this filter.</div>
          ) : pvs.map((pv) => (
            <Link key={pv.id} href={`/gfo/payment-vouchers/${pv.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors">
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{pv.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{pv.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={pv.dipCode} />
                  <span>·</span>
                  <span>{fmtRelative(pv.createdAt)}</span>
                </div>
              </div>
              <Money value={pv.netAmount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={pv.stage} kind="pv" />
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
