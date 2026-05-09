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
import { useAdvanceRequests } from '@/lib/queries';
import { fmtRelative } from '@/lib/format';

export default function FmMyDayPage() {
  const { user } = useAuth();
  const { data: pvs = [] } = usePaymentVouchers();
  const { data: ars = [] } = useAdvanceRequests();

  const pvQueue = useMemo(() => pvs.filter((p) => p.stage === 'GFO_REVIEWED'), [pvs]);
  const arQueue = useMemo(() => ars.filter((a) => a.stage === 'HOP_RECOMMENDED'), [ars]);
  const queueValue = useMemo(() =>
    pvQueue.reduce((s, p) => s + Number(p.netAmount), 0) +
    arQueue.reduce((s, a) => s + Number(a.amount), 0)
  , [pvQueue, arQueue]);

  return (
    <>
      <Topbar title="My Day" subtitle={user ? `${user.fullName} · Finance Manager` : ''} />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="p-5 md:w-1/3 bg-gradient-to-br from-brand to-brand-700 text-white">
              <div className="text-2xs uppercase tracking-wider text-brand-100">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</div>
              <div className="mt-1 text-2xl font-semibold">Good morning, {user?.fullName.split(' ')[0]}.</div>
              <p className="mt-2 text-brand-100 text-sm leading-relaxed">
                <strong className="text-white">{pvQueue.length + arQueue.length}</strong> item{pvQueue.length + arQueue.length === 1 ? '' : 's'} need your approval.
              </p>
            </div>
            <div className="grid grid-cols-3 flex-1 divide-x divide-line border-l border-line">
              <Kpi label="ARs to approve" value={String(arQueue.length)} />
              <Kpi label="PVs to approve" value={String(pvQueue.length)} />
              <Kpi label="Queue value" value={<Money value={queueValue} compact />} />
            </div>
          </div>
        </Card>

        <Card title="Approval queue" subtitle={`${pvQueue.length + arQueue.length} item${pvQueue.length + arQueue.length === 1 ? '' : 's'}`} padded={false}>
          {arQueue.map((ar) => (
            <Link key={ar.id} href={`/fm/advance-requests/${ar.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors">
              <span className="text-2xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium w-12 text-center shrink-0">AR</span>
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{ar.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{ar.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={ar.dipCode} /><span>·</span><span>{fmtRelative(ar.updatedAt)}</span>
                </div>
              </div>
              <Money value={ar.amount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={ar.stage} kind="ar" />
            </Link>
          ))}
          {pvQueue.map((pv) => (
            <Link key={pv.id} href={`/gfo/payment-vouchers/${pv.id}`} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors">
              <span className="text-2xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium w-12 text-center shrink-0">PV</span>
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{pv.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{pv.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={pv.dipCode} /><span>·</span><span>{fmtRelative(pv.updatedAt)}</span>
                </div>
              </div>
              <Money value={pv.netAmount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={pv.stage} kind="pv" />
            </Link>
          ))}
          {pvQueue.length + arQueue.length === 0 && (
            <div className="p-8 text-center text-sm text-ink-muted">Inbox clear.</div>
          )}
        </Card>
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="text-2xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}
