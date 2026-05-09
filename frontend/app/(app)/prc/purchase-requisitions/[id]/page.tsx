'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { toast } from '@/components/Toast';
import { usePurchaseRequisition, useVendors, useOpenRfq, useEvaluateRfq, useIssueLpo, useRecordGrn, useClosePr } from '@/lib/queries-pv';
import type { HttpError } from '@/lib/api';
import { PR_PIPELINE_ORDER, PR_STAGE } from '@/lib/stages';

export default function PrDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: pr, isLoading } = usePurchaseRequisition(id);
  const { data: vendors = [] } = useVendors();
  const openRfq = useOpenRfq; const evaluate = useEvaluateRfq;
  const issueLpo = useIssueLpo; const recordGrn = useRecordGrn; const closePr = useClosePr;
  const [deadline, setDeadline] = useState(''); const [winner, setWinner] = useState('');
  const [lpo, setLpo] = useState(''); const [grn, setGrn] = useState('');

  if (isLoading || !pr) return <><Topbar title="Loading…" /><div className="flex-1 p-6 bg-canvas text-sm text-ink-muted">Loading…</div></>;
  const onErr = (e: unknown) => toast.bad((e as HttpError).message ?? 'Failed');

  return (
    <>
      <Topbar title={pr.id} subtitle={pr.title} action={<Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>} />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-5">
          <Card title="Header" className="col-span-2">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <Row label="Stage"><StageBadge stage={pr.stage} kind="pr" /></Row>
              <Row label="DIP line"><DipChip code={pr.dipCode} /></Row>
              <Row label="Estimated"><Money value={pr.estimatedAmount} className="font-semibold" /></Row>
              <Row label="Vendor">{pr.vendorId ? vendors.find(v => v.id === pr.vendorId)?.name ?? pr.vendorId : <span className="text-ink-muted">— pending RFQ</span>}</Row>
              {pr.rfqDeadline && <Row label="RFQ deadline">{pr.rfqDeadline.slice(0, 10)}</Row>}
              {pr.lpoRef && <Row label="LPO ref"><span className="font-mono text-xs">{pr.lpoRef}</span></Row>}
              {pr.grnRef && <Row label="GRN ref"><span className="font-mono text-xs">{pr.grnRef}</span></Row>}
            </dl>
            <ol className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
              {PR_PIPELINE_ORDER.map((stg, i) => {
                const reached = PR_PIPELINE_ORDER.indexOf(pr.stage) >= i;
                const m = PR_STAGE[stg];
                return (
                  <li key={stg} className="flex items-center gap-1 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-2xs font-medium ${reached ? `${m.bg} ${m.fg}` : 'bg-slate-50 text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${reached ? m.dot : 'bg-slate-300'}`} />{m.short}
                    </span>
                    {i < PR_PIPELINE_ORDER.length - 1 && <span className="text-line-strong">›</span>}
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              {pr.stage === 'PR_SUBMITTED' && (
                <div className="space-y-2">
                  <label className="text-2xs uppercase text-ink-muted">RFQ deadline</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 h-9 rounded border border-line bg-white text-sm" />
                  <Button variant="primary" className="w-full" disabled={!deadline} onClick={() => openRfq.mutate({ id: pr.id, body: { rfqDeadline: deadline } }, { onSuccess: () => toast.ok('RFQ opened'), onError: onErr })}>Open RFQ</Button>
                </div>
              )}
              {pr.stage === 'RFQ_OPEN' && (
                <div className="space-y-2">
                  <label className="text-2xs uppercase text-ink-muted">Winning vendor</label>
                  <select value={winner} onChange={(e) => setWinner(e.target.value)} className="w-full px-3 h-9 rounded border border-line bg-white text-sm">
                    <option value="">— select —</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}{v.wtecValid ? '' : ' (WTEC invalid)'}</option>)}
                  </select>
                  <Button variant="primary" className="w-full" disabled={!winner} onClick={() => evaluate.mutate({ id: pr.id, body: { winningVendorId: winner } }, { onSuccess: () => toast.ok('Evaluated'), onError: onErr })}>Record evaluation</Button>
                </div>
              )}
              {pr.stage === 'RFQ_EVALUATED' && (
                <div className="space-y-2">
                  <label className="text-2xs uppercase text-ink-muted">LPO reference</label>
                  <input value={lpo} onChange={(e) => setLpo(e.target.value)} placeholder="LPO-2026-…" className="w-full px-3 h-9 rounded border border-line bg-white text-sm font-mono" />
                  <Button variant="primary" className="w-full" disabled={!lpo} onClick={() => issueLpo.mutate({ id: pr.id, body: { lpoRef: lpo } }, { onSuccess: () => toast.ok('LPO issued'), onError: onErr })}>Issue LPO</Button>
                </div>
              )}
              {pr.stage === 'LPO_ISSUED' && (
                <div className="space-y-2">
                  <label className="text-2xs uppercase text-ink-muted">GRN reference</label>
                  <input value={grn} onChange={(e) => setGrn(e.target.value)} placeholder="GRN-…" className="w-full px-3 h-9 rounded border border-line bg-white text-sm font-mono" />
                  <Button variant="primary" className="w-full" disabled={!grn} onClick={() => recordGrn.mutate({ id: pr.id, body: { grnRef: grn } }, { onSuccess: () => toast.ok('GRN recorded'), onError: onErr })}>Record GRN</Button>
                </div>
              )}
              {pr.stage === 'GRN_RECEIVED' && (
                <Button variant="primary" className="w-full" onClick={() => closePr.mutate({ id: pr.id }, { onSuccess: () => toast.ok('Closed'), onError: onErr })}>Close requisition</Button>
              )}
              {(pr.stage === 'CLOSED' || pr.stage === 'CANCELLED') && (
                <div className="text-xs text-ink-muted">No further actions.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<><dt className="text-2xs uppercase tracking-wider text-ink-muted">{label}</dt><dd className="text-ink">{children}</dd></>);
}
