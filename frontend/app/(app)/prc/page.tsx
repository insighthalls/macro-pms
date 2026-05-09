'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { usePurchaseRequisitions, useVendors } from '@/lib/queries-pv';
import { fmtRelative } from '@/lib/format';
import type { PrStage } from '@/lib/types';

const FILTERS: { key: PrStage | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PR_SUBMITTED', label: 'Submitted' },
  { key: 'RFQ_OPEN', label: 'RFQ open' },
  { key: 'RFQ_EVALUATED', label: 'Evaluated' },
  { key: 'LPO_ISSUED', label: 'LPO issued' },
  { key: 'GRN_RECEIVED', label: 'GRN received' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function PrcQueuePage() {
  const [filter, setFilter] = useState<PrStage | 'ALL'>('ALL');
  const { data: prs = [] } = usePurchaseRequisitions(filter !== 'ALL' ? { stage: filter } : undefined);
  const { data: vendors = [] } = useVendors();
  return (
    <>
      <Topbar title="Procurement Queue" subtitle="Manage requisitions through PR → RFQ → LPO → GRN" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-4">
          <Card><div className="text-2xs uppercase text-ink-muted">Active vendors</div><div className="text-2xl font-semibold mt-1">{vendors.filter(v => v.active).length}</div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">Open RFQs</div><div className="text-2xl font-semibold mt-1">{prs.filter(p => p.stage === 'RFQ_OPEN').length}</div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">LPOs in flight</div><div className="text-2xl font-semibold mt-1">{prs.filter(p => p.stage === 'LPO_ISSUED').length}</div></Card>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 h-8 rounded-md text-xs border transition-colors ${filter === f.key ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-line hover:border-brand-300'}`}>{f.label}</button>
          ))}
        </div>

        <Card padded={false}>
          {prs.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">No requisitions in this filter.</div>
          ) : prs.map((pr) => (
            <Link key={pr.id} href={`/prc/purchase-requisitions/${pr.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas">
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{pr.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{pr.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={pr.dipCode} />
                  {pr.lpoRef && <><span>·</span><span className="font-mono">{pr.lpoRef}</span></>}
                  <span>·</span><span>{fmtRelative(pr.updatedAt)}</span>
                </div>
              </div>
              <Money value={pr.estimatedAmount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={pr.stage} kind="pr" />
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
