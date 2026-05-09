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
import { useAdvanceRequest, useFmApproveAr, useEdApproveAr, useReturnAr, useDisburseAr, useAcceptLiquidation } from '@/lib/queries';
import { useAuth } from '@/lib/auth-store';
import { fmtDate, fmtRelative } from '@/lib/format';
import type { HttpError } from '@/lib/api';

export default function FmArDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: ar, isLoading } = useAdvanceRequest(id);
  const fmApprove = useFmApproveAr;
  const edApprove = useEdApproveAr;
  const ret = useReturnAr;
  const disburse = useDisburseAr;
  const acceptLiq = useAcceptLiquidation;
  const [returnNote, setReturnNote] = useState('');
  const [eft, setEft] = useState('');

  if (isLoading || !ar) return <><Topbar title="Loading…" /><div className="flex-1 p-6 bg-canvas text-sm text-ink-muted">Loading…</div></>;

  const onErr = (e: unknown) => toast.bad((e as HttpError).message ?? 'Action failed');
  const onOk = (msg: string) => toast.ok(msg);
  const role = user?.role;

  return (
    <>
      <Topbar title={`${ar.id} · ${ar.title}`} subtitle={`Activity ${ar.activityId}`} action={<Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>} />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-5">
          <Card title="Header" className="col-span-2">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <Row label="Stage"><StageBadge stage={ar.stage} kind="ar" /></Row>
              <Row label="DIP line"><DipChip code={ar.dipCode} /></Row>
              <Row label="Amount"><Money value={ar.amount} className="font-semibold" /></Row>
              <Row label="Liq. due">{ar.dueLiqDate ? `${fmtDate(ar.dueLiqDate)} · ${fmtRelative(ar.dueLiqDate)}` : '—'}</Row>
              <Row label="Next approver">{ar.nextApproverRole?.replaceAll('_',' ') ?? '—'}</Row>
              <Row label="Spent">{ar.spentAmount ? <Money value={ar.spentAmount} /> : <span className="text-ink-muted">—</span>}</Row>
              {ar.returnReason && <Row label="Return reason"><span className="text-bad">{ar.returnReason}</span></Row>}
            </dl>
          </Card>

          <Card title="Actions">
            <div className="space-y-2.5">
              {ar.stage === 'HOP_RECOMMENDED' && role === 'FINANCE_MANAGER' && (
                <>
                  <Button variant="primary" className="w-full" onClick={() => fmApprove.mutate({ id: ar.id }, { onSuccess: () => onOk('Approved as FM.'), onError: onErr })}>
                    Approve as FM
                  </Button>
                  <ReturnAction note={returnNote} setNote={setReturnNote} onReturn={() => ret.mutate({ id: ar.id, body: { note: returnNote } }, { onSuccess: () => onOk('Returned.'), onError: onErr })} />
                </>
              )}
              {ar.stage === 'FM_APPROVED' && ar.nextApproverRole === 'EXECUTIVE_DIRECTOR' && role === 'EXECUTIVE_DIRECTOR' && (
                <Button variant="primary" className="w-full" onClick={() => edApprove.mutate({ id: ar.id }, { onSuccess: () => onOk('Approved as ED.'), onError: onErr })}>
                  Approve as ED
                </Button>
              )}
              {(ar.stage === 'FM_APPROVED' || ar.stage === 'ED_APPROVED') && role === 'GRANT_FINANCE_OFFICER' && (
                <div className="space-y-2">
                  <input value={eft} onChange={(e) => setEft(e.target.value)} placeholder="EFT reference" className="w-full px-3 h-9 rounded border border-line bg-white text-sm font-mono" />
                  <Button variant="primary" className="w-full" disabled={!eft} onClick={() => disburse.mutate({ id: ar.id, body: { eftRef: eft } }, { onSuccess: () => onOk(`Disbursed (${eft}).`), onError: onErr })}>
                    Disburse
                  </Button>
                </div>
              )}
              {ar.stage === 'LIQUIDATION_PENDING' && role === 'FINANCE_MANAGER' && (
                <Button variant="primary" className="w-full" onClick={() => acceptLiq.mutate({ id: ar.id }, { onSuccess: () => onOk('Liquidation accepted.'), onError: onErr })}>
                  Accept liquidation
                </Button>
              )}
              {!['HOP_RECOMMENDED','FM_APPROVED','ED_APPROVED','LIQUIDATION_PENDING'].includes(ar.stage) && (
                <div className="text-xs text-ink-muted">No action available for your role at this stage.</div>
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
function ReturnAction({ note, setNote, onReturn }: { note: string; setNote: (s: string) => void; onReturn: () => void }) {
  return (
    <div className="space-y-2 pt-2 border-t border-line">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for return…" className="w-full px-3 py-2 rounded border border-line bg-white text-sm" rows={2} />
      <Button variant="ghost" className="w-full text-bad" disabled={!note.trim()} onClick={onReturn}>Return for revision</Button>
    </div>
  );
}
