'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Money } from '@/components/Money';
import { DataTable } from '@/components/DataTable';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-store';
import { toast } from '@/components/Toast';

interface PV { id: string; title: string; netAmount: number; vendor?: { name: string } | null; stage: string }
interface Batch {
  id: string; projId: string; ccy: string; totalAmount: number;
  stage: 'DRAFT' | 'LOCKED' | 'EXPORTED' | 'ACK_RECEIVED' | 'CANCELLED';
  bankFile?: string | null; ackFile?: string | null;
  createdAt: string; lockedAt?: string | null; exportedAt?: string | null; ackedAt?: string | null;
  items: { pvId: string; amount: number }[];
}

export default function EftBatchesPage() {
  const { active } = useProject();
  const projId = active?.id;
  const qc = useQueryClient();

  const { data: batches = [] } = useQuery({
    enabled: !!projId,
    queryKey: ['eft', projId],
    queryFn: () => api.get<{ data: Batch[] }>(`/v1/eft-batches?projId=${projId}`).then((r) => r.data),
  });

  const { data: schedulable = [] } = useQuery({
    enabled: !!projId,
    queryKey: ['pv', 'scheduled', projId],
    queryFn: () => api.get<{ data: PV[] }>(`/v1/payment-vouchers?stage=SCHEDULED&projId=${projId}`).then((r) => r.data),
  });

  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const create = useMutation({
    mutationFn: () => api.post<{ data: Batch }>('/v1/eft-batches', { projId, pvIds: picked }),
    onSuccess: () => { setPicked([]); qc.invalidateQueries(); toast.ok('Batch created.'); },
    onError: (e: any) => toast.bad(e.message),
  });
  const lock = useMutation({
    mutationFn: (id: string) => api.post(`/v1/eft-batches/${id}/lock`),
    onSuccess: () => { qc.invalidateQueries(); toast.ok('Batch locked.'); },
    onError: (e: any) => toast.bad(e.message),
  });
  const exportXml = async (id: string) => {
    const res = await fetch(`/api/v1/eft-batches/${id}/export`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('macro_token') ?? ''}` },
    });
    if (!res.ok) { toast.bad('Export failed'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${id}.xml`; a.click();
    URL.revokeObjectURL(url);
    qc.invalidateQueries({ queryKey: ['eft'] });
  };
  const ack = useMutation({
    mutationFn: (id: string) => api.post(`/v1/eft-batches/${id}/ack`, { ackFile: `${id}.ack.xml` }),
    onSuccess: () => { qc.invalidateQueries(); toast.ok('ACK recorded — PVs marked PAID.'); },
    onError: (e: any) => toast.bad(e.message),
  });

  const total = picked.reduce((s, id) => s + (schedulable.find((p) => p.id === id)?.netAmount ?? 0), 0);

  return (
    <>
      <Topbar title="EFT Batches" subtitle="Group scheduled vouchers, lock & export pacs.008, post bank ACK" />
      <div className="flex-1 p-6 bg-canvas overflow-auto">
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-7" title="New batch · scheduled vouchers">
            {schedulable.length === 0 ? (
              <div className="p-6 text-sm text-ink-muted">No SCHEDULED vouchers in this project.</div>
            ) : (
              <DataTable
                rows={schedulable}
                rowKey={(r) => r.id}
                columns={[
                  { header: '', cell: (r) => (
                    <input type="checkbox" checked={picked.includes(r.id)} onChange={() => togglePick(r.id)} />
                  ), width: '32px' },
                  { header: 'PV', cell: (r) => <span className="font-mono text-2xs">{r.id}</span>, width: '140px' },
                  { header: 'Title', cell: (r) => <span className="text-sm">{r.title}</span> },
                  { header: 'Vendor', cell: (r) => <span className="text-2xs text-ink-muted">{r.vendor?.name ?? '—'}</span> },
                  { header: 'Net', cell: (r) => <Money amount={r.netAmount} />, align: 'right' },
                ]}
              />
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-2xs text-ink-muted">
                {picked.length} selected · <Money amount={total} />
              </div>
              <Button onClick={() => create.mutate()} disabled={picked.length === 0 || create.isPending || !projId}>
                {create.isPending ? 'Creating…' : 'Create batch'}
              </Button>
            </div>
          </Card>

          <Card className="col-span-5" title="Pipeline · how a batch moves">
            <ol className="space-y-3 px-1 text-sm">
              <PipeStep n={1} label="DRAFT" body="GFO selects scheduled PVs and creates the batch." />
              <PipeStep n={2} label="LOCKED" body="FM/ED reviews totals and locks; no items can be added." />
              <PipeStep n={3} label="EXPORTED" body="System generates pacs.008 XML; bank file downloads." />
              <PipeStep n={4} label="ACK_RECEIVED" body="Bank ACK posted; PVs in batch flip to PAID with EFT ref." />
            </ol>
          </Card>
        </div>

        <Card className="mt-4" title={`History · ${batches.length} batch${batches.length === 1 ? '' : 'es'}`}>
          {batches.length === 0 ? (
            <div className="p-6 text-sm text-ink-muted">No batches yet.</div>
          ) : (
            <DataTable
              rows={batches}
              rowKey={(r) => r.id}
              columns={[
                { header: 'ID', cell: (r) => <Link href={`/fm/eft-batches/${r.id}`} className="font-mono text-2xs text-brand hover:underline">{r.id}</Link>, width: '160px' },
                { header: 'Items', cell: (r) => <span className="text-2xs">{r.items.length}</span>, width: '60px' },
                { header: 'Total', cell: (r) => <Money amount={r.totalAmount} />, align: 'right' },
                { header: 'Stage', cell: (r) => <StageDot stage={r.stage} /> },
                { header: 'Created', cell: (r) => <span className="text-2xs text-ink-muted">{new Date(r.createdAt).toLocaleDateString()}</span> },
                { header: 'Actions', cell: (r) => (
                  <div className="flex gap-2 justify-end">
                    {r.stage === 'DRAFT' && <Button size="sm" variant="ghost" onClick={() => lock.mutate(r.id)}>Lock</Button>}
                    {r.stage === 'LOCKED' && <Button size="sm" onClick={() => exportXml(r.id)}>Export pacs.008</Button>}
                    {r.stage === 'EXPORTED' && <Button size="sm" variant="ghost" onClick={() => ack.mutate(r.id)}>Post ACK</Button>}
                  </div>
                ), align: 'right' },
              ]}
            />
          )}
        </Card>
      </div>
    </>
  );
}

function StageDot({ stage }: { stage: string }) {
  const tone =
    stage === 'ACK_RECEIVED' ? 'bg-good/20 text-good-700'
    : stage === 'EXPORTED' ? 'bg-warn/20 text-warn-700'
    : stage === 'LOCKED' ? 'bg-brand-50 text-brand-700'
    : stage === 'CANCELLED' ? 'bg-bad/20 text-bad-700'
    : 'bg-canvas text-ink-muted';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium ${tone}`}>{stage}</span>;
}

function PipeStep({ n, label, body }: { n: number; label: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="h-6 w-6 rounded-full bg-brand-50 text-brand-700 text-2xs font-bold grid place-items-center shrink-0">{n}</span>
      <div>
        <div className="text-2xs font-semibold text-ink">{label}</div>
        <div className="text-2xs text-ink-muted">{body}</div>
      </div>
    </li>
  );
}
