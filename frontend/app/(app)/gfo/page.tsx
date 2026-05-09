'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/lib/auth-store';
import { usePaymentVouchers } from '@/lib/queries-pv';
import { fmtRelative } from '@/lib/format';

export default function GfoMyDayPage() {
  const { user } = useAuth();
  const { data: pvs = [], isLoading } = usePaymentVouchers();

  const queue = useMemo(() => pvs.filter((p) => p.stage === 'PO_SUBMITTED'), [pvs]);
  const scheduled = useMemo(() => pvs.filter((p) => p.stage === 'SCHEDULED' || p.stage === 'FM_APPROVED' || p.stage === 'ED_APPROVED'), [pvs]);
  const totals = useMemo(() => ({
    pending: queue.length,
    scheduled: scheduled.length,
    pendingValue: queue.reduce((s, p) => s + Number(p.netAmount), 0),
    scheduledValue: scheduled.reduce((s, p) => s + Number(p.netAmount), 0),
  }), [queue, scheduled]);

  return (
    <>
      <Topbar title="My Day" subtitle={user ? `${user.fullName} · Grant Finance` : ''} />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="p-5 md:w-1/3 bg-gradient-to-br from-brand to-brand-700 text-white">
              <div className="text-2xs uppercase tracking-wider text-brand-100">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</div>
              <div className="mt-1 text-2xl font-semibold">Good morning, {user?.fullName.split(' ')[0]}.</div>
              <p className="mt-2 text-brand-100 text-sm leading-relaxed">
                <strong className="text-white">{totals.pending}</strong> voucher{totals.pending === 1 ? '' : 's'} awaiting your review · <strong className="text-white">{totals.scheduled}</strong> ready for payment run.
              </p>
            </div>
            <div className="grid grid-cols-2 flex-1 divide-x divide-line border-l border-line">
              <Kpi label="Pending review" value={String(totals.pending)} sub={<Money value={totals.pendingValue} compact />} />
              <Kpi label="In approval / scheduled" value={String(totals.scheduled)} sub={<Money value={totals.scheduledValue} compact />} />
            </div>
          </div>
        </Card>

        <Card title="Pending GFO review" subtitle={`${queue.length} voucher${queue.length === 1 ? '' : 's'}`} padded={false}>
          {isLoading ? (
            <div className="p-6 text-sm text-ink-muted">Loading…</div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">Inbox clear.</div>
          ) : queue.map((pv) => (
            <Link key={pv.id} href={`/gfo/payment-vouchers/${pv.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors">
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{pv.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{pv.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={pv.dipCode} />
                  {pv.arId && <><span>·</span><span className="font-mono">{pv.arId}</span></>}
                  <span>·</span>
                  <span>Submitted {fmtRelative(pv.createdAt)}</span>
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

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="text-2xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
      {sub && <div className="text-xs text-ink-muted mt-0.5">{sub}</div>}
    </div>
  );
}
