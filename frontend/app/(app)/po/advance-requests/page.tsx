'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { DataTable, type Column } from '@/components/DataTable';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { useAdvanceRequests } from '@/lib/queries';
import { fmtDate } from '@/lib/format';
import type { AdvanceRequest, ArStage } from '@/lib/types';

const FILTERS: { label: string; stages: ArStage[] | null }[] = [
  { label: 'All',          stages: null },
  { label: 'In flight',    stages: ['PO_SUBMITTED','HOP_RECOMMENDED','FM_APPROVED','ED_APPROVED'] },
  { label: 'Disbursed',    stages: ['DISBURSED'] },
  { label: 'Returned',     stages: ['RETURNED'] },
  { label: 'Liquidation',  stages: ['LIQUIDATION_PENDING','LIQUIDATED'] },
];

export default function ArListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState(0);
  const { data: rows = [], isLoading } = useAdvanceRequests();

  const stages = FILTERS[filter].stages;
  const filtered = stages ? rows.filter((r) => stages.includes(r.stage)) : rows;

  const cols: Column<AdvanceRequest>[] = [
    { key: 'id',     header: 'Ref',    cell: (r) => <span className="font-mono text-2xs text-ink-muted">{r.id}</span>, className: 'w-28' },
    { key: 'title',  header: 'Title',  cell: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { key: 'dip',    header: 'DIP',    cell: (r) => <DipChip code={r.dipCode} />, className: 'w-32' },
    { key: 'amt',    header: 'Amount', cell: (r) => <Money value={r.amount} />, align: 'right', className: 'w-40' },
    { key: 'due',    header: 'Liq. due', cell: (r) => <span className="text-ink-muted">{fmtDate(r.dueLiqDate)}</span>, className: 'w-32' },
    { key: 'stage',  header: 'Stage',  cell: (r) => <StageBadge stage={r.stage} />, className: 'w-40' },
  ];

  return (
    <>
      <Topbar
        title="Advance Requests"
        subtitle={`${filtered.length} of ${rows.length}`}
        action={
          <Link href="/po/advance-requests/new">
            <Button variant="primary" size="sm">+ New advance</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-canvas">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setFilter(i)}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                filter === i
                  ? 'bg-brand text-white'
                  : 'bg-white border border-line text-ink-muted hover:text-ink hover:border-line-strong'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Card padded={false}>
          {isLoading ? (
            <div className="p-8 text-sm text-ink-muted text-center">Loading…</div>
          ) : (
            <DataTable
              rows={filtered}
              columns={cols}
              getRowKey={(r) => r.id}
              onRowClick={(r) => router.push(`/po/advance-requests/${r.id}`)}
              empty="No advance requests match this filter."
            />
          )}
        </Card>
      </div>
    </>
  );
}
