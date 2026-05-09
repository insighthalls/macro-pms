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
import { usePaymentVoucher, useGfoReviewPv, useReturnPv, useFmApprovePv, useEdApprovePv, useSchedulePv, useMarkPvPaid } from '@/lib/queries-pv';
import { useAuth } from '@/lib/auth-store';
import type { HttpError } from '@/lib/api';

export default function PvDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: pv, isLoading } = usePaymentVoucher(id);
  const review = useGfoReviewPv;
  const ret = useReturnPv;
  const fmApprove = useFmApprovePv;
  const edApprove = useEdApprovePv;
  const schedule = useSchedulePv;
  const markPaid = useMarkPvPaid;
  const [returnNote, setReturnNote] = useState('');
  const [eft, setEft] = useState('');

  if (isLoading || !pv) return <><Topbar title="Loading…" /><div className="flex-1 p-6 bg-canvas text-sm text-ink-muted">Loading…</div></>;

  const onErr = (e: unknown) => toast.bad((e as HttpError).message ?? 'Action failed');
  const onOk = (msg: string) => toast.ok(msg);
  const role = user?.role;

  return (
    <>
      <Topbar title={pv.id} subtitle={pv.title} action={<Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>} />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-5">
          <Card title="Header" className="col-span-2">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <Row label="Stage"><StageBadge stage={pv.stage} kind="pv" /></Row>
              <Row label="DIP line"><DipChip code={pv.dipCode} /></Row>
              <Row label="Linked AR">{pv.arId ?? <span className="text-ink-muted">—</span>}</Row>
              <Row label="Vendor">{pv.vendorId ?? <span className="text-ink-muted">—</span>}</Row>
              <Row label="Gross"><Money value={pv.grossAmount} /></Row>
              <Row label="WHT"><Money value={pv.whtAmount} /></Row>
              <Row label="Net"><Money value={pv.netAmount} className="font-semibold" /></Row>
              <Row label="3-way match">{pv.threeWayMatchOk ? <span className="text-ok">✓ Pass</span> : <span className="text-warn">Pending</span>}</Row>
              {pv.eftRef && <Row label="EFT"><span className="font-mono text-xs">{pv.eftRef}</span></Row>}
              {pv.returnReason && <Row label="Return reason"><span className="text-bad">{pv.returnReason}</span></Row>}
            </dl>
          </Card>

          <Card title="Actions">
            <div className="space-y-2.5">
              {pv.stage === 'PO_SUBMITTED' && role === 'GRANT_FINANCE_OFFICER' && (
                <>
                  <Button variant="primary" className="w-full" onClick={() => review.mutate({ id: pv.id, body: { threeWayMatchOk: true } }, { onSuccess: () => onOk('Reviewed and forwarded to FM.'), onError: onErr })}>
                    Approve & forward to FM
                  </Button>
                  <ReturnAction note={returnNote} setNote={setReturnNote} onReturn={() => ret.mutate({ id: pv.id, body: { note: returnNote } }, { onSuccess: () => onOk('Voucher returned.'), onError: onErr })} />
                </>
              )}
              {pv.stage === 'GFO_REVIEWED' && role === 'FINANCE_MANAGER' && (
                <>
                  <Button variant="primary" className="w-full" onClick={() => fmApprove.mutate({ id: pv.id }, { onSuccess: () => onOk('Approved by FM.'), onError: onErr })}>
                    Approve as FM
                  </Button>
                  <ReturnAction note={returnNote} setNote={setReturnNote} onReturn={() => ret.mutate({ id: pv.id, body: { note: returnNote } }, { onSuccess: () => onOk('Returned.'), onError: onErr })} />
                </>
              )}
              {pv.stage === 'FM_APPROVED' && role === 'EXECUTIVE_DIRECTOR' && pv.nextApproverRole === 'EXECUTIVE_DIRECTOR' && (
                <Button variant="primary" className="w-full" onClick={() => edApprove.mutate({ id: pv.id }, { onSuccess: () => onOk('Approved by ED.'), onError: onErr })}>
                  Approve as ED
                </Button>
              )}
              {(pv.stage === 'FM_APPROVED' || pv.stage === 'ED_APPROVED') && role === 'GRANT_FINANCE_OFFICER' && (
                <Button variant="primary" className="w-full" onClick={() => schedule.mutate({ id: pv.id }, { onSuccess: () => onOk('Scheduled for payment.'), onError: onErr })}>
                  Schedule for payment
                </Button>
              )}
              {pv.stage === 'SCHEDULED' && role === 'GRANT_FINANCE_OFFICER' && (
                <div className="space-y-2">
                  <input value={eft} onChange={(e) => setEft(e.target.value)} placeholder="EFT reference" className="w-full px-3 h-9 rounded border border-line bg-white text-sm font-mono" />
                  <Button variant="primary" className="w-full" disabled={!eft} onClick={() => markPaid.mutate({ id: pv.id, body: { eftRef: eft } }, { onSuccess: () => onOk(`Marked paid (${eft}).`), onError: onErr })}>
                    Mark paid
                  </Button>
                </div>
              )}
              {!['PO_SUBMITTED','GFO_REVIEWED','FM_APPROVED','SCHEDULED'].includes(pv.stage) && (
                <div className="text-xs text-ink-muted">No further action required at this stage for your role.</div>
              )}
            </div>
          </Card>
        </div>

        <Card title="Line items" padded={false}>
          <table className="w-full text-sm">
            <thead className="bg-canvas border-b border-line text-2xs uppercase tracking-wider text-ink-muted">
              <tr><th className="text-left px-4 py-2 font-medium">Description</th><th className="text-right px-4 py-2 font-medium">Qty</th><th className="text-right px-4 py-2 font-medium">Unit</th><th className="text-right px-4 py-2 font-medium">Total</th></tr>
            </thead>
            <tbody>
              {pv.itemsJson.map((it, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">{it.description}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{it.qty}</td>
                  <td className="px-4 py-2.5 text-right font-mono"><Money value={it.unitPrice} /></td>
                  <td className="px-4 py-2.5 text-right font-mono"><Money value={Number(it.qty) * Number(it.unitPrice)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<><dt className="text-2xs uppercase tracking-wider text-ink-muted">{label}</dt><dd className="text-ink">{children}</dd></>);
}

function ReturnAction({ note, setNote, onReturn }: { note: string; setNote: (s: string) => void; onReturn: () => void }) {
  return (
    <div className="space-y-2 pt-2 border-t border-line">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for return…" className="w-full px-3 py-2 rounded border border-line bg-white text-sm" rows={2} />
      <Button variant="ghost" className="w-full text-bad" disabled={!note.trim()} onClick={onReturn}>
        Return for revision
      </Button>
    </div>
  );
}
