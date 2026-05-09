'use client';
import { useMemo } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { StageBadge } from '@/components/StageBadge';
import { Money } from '@/components/Money';
import { usePaymentVouchers } from '@/lib/queries-pv';
import { useAuth } from '@/lib/auth-store';
import { fmtDate } from '@/lib/format';

const VENDOR_USER_TO_ID: Record<string,string> = { 'U-VENDOR-001': 'VEN-001' };

export default function VendorPortalPage() {
  const { user } = useAuth();
  const vendorId = user ? VENDOR_USER_TO_ID[user.id] ?? 'VEN-001' : 'VEN-001';
  const { data: pvs = [] } = usePaymentVouchers({ vendorId });

  const totals = useMemo(() => ({
    paid: pvs.filter(p => p.stage === 'PAID').reduce((s, p) => s + Number(p.netAmount), 0),
    inflight: pvs.filter(p => !['PAID','REJECTED','RETURNED'].includes(p.stage)).reduce((s, p) => s + Number(p.netAmount), 0),
    count: pvs.length,
  }), [pvs]);

  return (
    <>
      <Topbar title="Vendor Portal" subtitle="Track invoice & payment status" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-4">
          <Card><div className="text-2xs uppercase text-ink-muted">Invoices submitted</div><div className="text-2xl font-semibold mt-1">{totals.count}</div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">In flight</div><div className="text-2xl font-semibold mt-1"><Money value={totals.inflight} compact /></div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">Paid (lifetime)</div><div className="text-2xl font-semibold mt-1 text-ok"><Money value={totals.paid} compact /></div></Card>
        </div>

        <Card title="My invoices" padded={false}>
          {pvs.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">No invoices yet.</div>
          ) : pvs.map((pv) => (
            <div key={pv.id} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0">
              <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{pv.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{pv.title}</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  Submitted {fmtDate(pv.createdAt)}{pv.paidOn ? ` · paid ${fmtDate(pv.paidOn)} · ${pv.eftRef}` : ''}
                </div>
              </div>
              <Money value={pv.netAmount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={pv.stage} kind="pv" />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
