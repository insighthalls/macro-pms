'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { useAdvanceRequest, useSubmitLiquidation } from '@/lib/queries';
import { fmtDate, fmtDateTime, fmtRelative } from '@/lib/format';
import { AR_PIPELINE_ORDER, AR_STAGE } from '@/lib/stages';
import { toast } from '@/components/Toast';
import { useState } from 'react';

export default function ArDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: ar, isLoading } = useAdvanceRequest(id);
  const liquidate = useSubmitLiquidation;
  const [spent, setSpent] = useState('');
  const [note, setNote]   = useState('');

  if (isLoading || !ar) {
    return (
      <>
        <Topbar title="Advance Request" />
        <div className="p-6 text-sm text-ink-muted">Loading…</div>
      </>
    );
  }

  const isReturned = ar.stage === 'RETURNED';
  const canLiquidate = ar.stage === 'DISBURSED';

  async function onLiquidate() {
    if (!ar) return;
    if (!spent) { toast.warn('Enter spent amount.'); return; }
    try {
      await liquidate.mutateAsync({ id: ar.id, body: { spentAmount: Number(spent), varianceNote: note || undefined } });
      toast.ok('Liquidation submitted to FM.');
      setSpent(''); setNote('');
    } catch (e) {
      toast.bad((e as Error).message ?? 'Could not submit liquidation.');
    }
  }

  return (
    <>
      <Topbar
        title={`${ar.id} · ${ar.title}`}
        subtitle={`Activity ${ar.activityId}`}
        action={
          <Link href="/po/advance-requests"><Button variant="ghost" size="sm">← Back</Button></Link>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <Card title="Summary">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <Field label="Stage"><StageBadge stage={ar.stage} /></Field>
                <Field label="DIP line"><DipChip code={ar.dipCode} /></Field>
                <Field label="Amount"><Money value={ar.amount} /></Field>
                <Field label="Submitted"><span className="text-ink">{fmtDateTime(ar.submittedAt)}</span></Field>
                <Field label="Disbursed">
                  <span className="text-ink">{ar.disbursedOn ? `${fmtDate(ar.disbursedOn)} · ${ar.eftRef ?? ''}` : '—'}</span>
                </Field>
                <Field label="Liquidation due">
                  <span className="text-ink">{fmtDate(ar.dueLiqDate)} <span className="text-ink-muted">({fmtRelative(ar.dueLiqDate)})</span></span>
                </Field>
              </div>

              {isReturned && (
                <div className="mt-5 rounded-md border-l-4 border-bad bg-bad-soft text-bad text-sm px-3 py-2.5">
                  <strong>Returned:</strong> {ar.returnReason ?? 'No reason recorded.'}
                </div>
              )}
            </Card>

            {/* Pipeline */}
            <Card title="Pipeline">
              <ol className="flex items-center gap-1 overflow-x-auto pb-1">
                {AR_PIPELINE_ORDER.map((stg, i) => {
                  const reached = AR_PIPELINE_ORDER.indexOf(ar.stage) >= i;
                  const meta = AR_STAGE[stg];
                  return (
                    <li key={stg} className="flex items-center gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-2xs font-medium ${
                        reached ? `${meta.bg} ${meta.fg}` : 'bg-slate-50 text-slate-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${reached ? meta.dot : 'bg-slate-300'}`} />
                        {meta.short}
                      </span>
                      {i < AR_PIPELINE_ORDER.length - 1 && (
                        <span className="text-line-strong">›</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Card>

            {/* Liquidation */}
            {canLiquidate && (
              <Card title="Submit liquidation" subtitle="Capture how much was actually spent. FM accepts or returns.">
                <div className="space-y-4">
                  <Field label="Spent amount (MWK)">
                    <input
                      type="number"
                      min={0}
                      value={spent}
                      onChange={(e) => setSpent(e.target.value)}
                      className="h-10 w-full px-3 rounded-md border border-line font-mono tabular-nums text-sm focus:border-brand focus:outline-none focus:shadow-focus"
                    />
                  </Field>
                  <Field label="Variance note (required if ≠ advance)">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:border-brand focus:outline-none focus:shadow-focus"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={onLiquidate} disabled={liquidate.isPending}>
                      {liquidate.isPending ? 'Submitting…' : 'Submit to Finance Manager'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card title="Next approver">
              <div className="text-sm">
                {ar.nextApproverRole ? (
                  <>
                    <div className="text-ink font-medium">{ar.nextApproverRole.replaceAll('_',' ')}</div>
                    <div className="text-xs text-ink-muted mt-1">Awaiting their action.</div>
                  </>
                ) : (
                  <div className="text-ink-muted">No further approvals required.</div>
                )}
              </div>
            </Card>

            <Card title="Quick actions">
              <div className="flex flex-col gap-2">
                <Link href="/po/advance-requests" className="block"><Button variant="secondary" className="w-full">Back to list</Button></Link>
                <Link href={`/po/advance-requests/new`} className="block"><Button variant="ghost" className="w-full">+ New advance</Button></Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
