'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { toast } from '@/components/Toast';
import { useAdvanceRequests, useRecommendAr, useReturnAr } from '@/lib/queries';
import type { HttpError } from '@/lib/api';
import { fmtRelative } from '@/lib/format';

export default function HopQueuePage() {
  const { data: ars = [] } = useAdvanceRequests();
  const recommend = useRecommendAr; const ret = useReturnAr;
  const queue = useMemo(() => ars.filter((a) => a.stage === 'PO_SUBMITTED'), [ars]);
  const [returnNote, setReturnNote] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <Topbar title="Recommendation Queue" subtitle="Review and recommend project officer advance requests" />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-canvas">
        <Card title={`Awaiting recommendation · ${queue.length}`} padded={false}>
          {queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">Inbox clear.</div>
          ) : queue.map((ar) => (
            <div key={ar.id} className="border-b border-line last:border-0">
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="font-mono text-2xs text-ink-muted w-28 shrink-0">{ar.id}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{ar.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                    <DipChip code={ar.dipCode} /><span>·</span><span>Submitted {fmtRelative(ar.submittedAt ?? ar.createdAt)}</span>
                  </div>
                </div>
                <Money value={ar.amount} className="text-sm text-ink shrink-0" />
                <StageBadge stage={ar.stage} kind="ar" />
                <Button size="sm" variant="primary" onClick={() => recommend.mutate({ id: ar.id }, { onSuccess: () => toast.ok(`${ar.id} recommended`), onError: (e) => toast.bad((e as HttpError).message) })}>Recommend</Button>
                <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === ar.id ? null : ar.id)}>Return</Button>
              </div>
              {openId === ar.id && (
                <div className="bg-canvas px-4 py-3 border-t border-line flex gap-2">
                  <input value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Reason for return…" className="flex-1 px-3 h-9 rounded border border-line bg-white text-sm" />
                  <Button size="sm" variant="primary" disabled={!returnNote.trim()} onClick={() => ret.mutate({ id: ar.id, body: { note: returnNote } }, { onSuccess: () => { toast.ok('Returned'); setOpenId(null); setReturnNote(''); }, onError: (e) => toast.bad((e as HttpError).message) })}>Send back</Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
