'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { Money } from '@/components/Money';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-store';

interface BurnDown { project: string; name: string; budget: number; spent: number; series: { month: string; spent: number }[] }
interface VarianceRow { code: string; label: string; budget: number; spent: number; committed: number; pctSpent: number; watch: 'GREEN' | 'AMBER' | 'RED' }
interface VendorScore { id: string; name: string; tin?: string | null; wtecValid: boolean; ceiling: number | null; spent: number; invoiceCount: number; paidCount: number; paidValue: number }
interface AgeingResp { buckets: Record<string, number>; rows: { id: string; title: string; amount: number; days: number; bucket: string; owner: string; projId: string }[] }

export default function ReportsPage() {
  const { active } = useProject();
  const projId = active?.id;

  const burn = useQuery({ enabled: !!projId, queryKey: ['rep-burn', projId], queryFn: () => api.get<{ data: BurnDown }>(`/v1/reports/burn-down?projId=${projId}`).then((r) => r.data) });
  const varq = useQuery({ enabled: !!projId, queryKey: ['rep-var', projId],  queryFn: () => api.get<{ data: VarianceRow[] }>(`/v1/reports/variance?projId=${projId}`).then((r) => r.data) });
  const vendors = useQuery({ queryKey: ['rep-vendors'], queryFn: () => api.get<{ data: VendorScore[] }>(`/v1/reports/vendors`).then((r) => r.data) });
  const ageing = useQuery({ queryKey: ['rep-ageing'],  queryFn: () => api.get<{ data: AgeingResp }>(`/v1/reports/ar-ageing`).then((r) => r.data) });
  const donor = useQuery({ queryKey: ['rep-donor'], queryFn: () => api.get<{ data: any[] }>(`/v1/reports/donor-pack`).then((r) => r.data) });

  return (
    <>
      <Topbar title="Reports" subtitle={active ? `${active.code} · ${active.donor}` : 'Pick a project'} />
      <div className="flex-1 p-6 bg-canvas overflow-auto space-y-4">
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-8" title="Burn-down">
            {burn.data ? <BurnDownChart data={burn.data} /> : <Skeleton />}
          </Card>
          <Card className="col-span-4" title="AR ageing — outstanding liquidations">
            {ageing.data ? <AgeingPanel data={ageing.data} /> : <Skeleton />}
          </Card>
        </div>

        <Card title="Variance per DIP line">
          {varq.data ? (
            <DataTable
              rows={varq.data}
              rowKey={(r) => r.code}
              columns={[
                { header: 'Code', cell: (r) => <span className="font-mono text-2xs">{r.code}</span>, width: '110px' },
                { header: 'Label', cell: (r) => <span className="text-sm">{r.label}</span> },
                { header: 'Budget', cell: (r) => <Money amount={r.budget} />, align: 'right' },
                { header: 'Committed', cell: (r) => <Money amount={r.committed} />, align: 'right' },
                { header: 'Spent', cell: (r) => <Money amount={r.spent} />, align: 'right' },
                { header: '% Spent', cell: (r) => <Bar pct={r.pctSpent} watch={r.watch} />, width: '160px' },
              ]}
            />
          ) : <Skeleton />}
        </Card>

        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-7" title="Vendor scorecards">
            {vendors.data ? (
              <DataTable
                rows={vendors.data}
                rowKey={(r) => r.id}
                columns={[
                  { header: 'Vendor', cell: (r) => <span className="text-sm font-medium">{r.name}</span> },
                  { header: 'TIN', cell: (r) => <span className="text-2xs text-ink-muted">{r.tin || '—'}</span>, width: '110px' },
                  { header: 'WTEC', cell: (r) => <span className={`text-2xs font-medium ${r.wtecValid ? 'text-good-700' : 'text-bad'}`}>{r.wtecValid ? 'VALID' : 'EXPIRED'}</span>, width: '70px' },
                  { header: 'Invoices', cell: (r) => <span className="text-2xs">{r.paidCount}/{r.invoiceCount}</span>, width: '80px', align: 'right' },
                  { header: 'Paid value', cell: (r) => <Money amount={r.paidValue} />, align: 'right' },
                ]}
              />
            ) : <Skeleton />}
          </Card>

          <Card className="col-span-5" title="Donor pack">
            {donor.data ? (
              <ul className="px-1 space-y-2">
                {donor.data.map((p: any) => (
                  <li key={p.id} className="rounded border border-line p-3 bg-white">
                    <div className="flex items-baseline justify-between">
                      <div className="text-sm font-semibold text-ink">{p.name}</div>
                      <div className="text-2xs text-ink-muted">{p.donor}</div>
                    </div>
                    <div className="mt-1 text-2xs text-ink-muted flex gap-4">
                      <span>Budget <Money amount={p.budget} /></span>
                      <span>Spent <Money amount={p.spent} /></span>
                      <span>Paid PVs {p.pvsPaidCount}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Skeleton />}
          </Card>
        </div>
      </div>
    </>
  );
}

function Skeleton() { return <div className="p-6 text-2xs text-ink-muted">Loading…</div>; }

function Bar({ pct, watch }: { pct: number; watch: string }) {
  const w = Math.min(1, Math.max(0, pct));
  const color = watch === 'RED' ? 'bg-bad' : watch === 'AMBER' ? 'bg-warn' : 'bg-good';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${w * 100}%` }} />
      </div>
      <span className="text-2xs tabular-nums text-ink-muted w-10 text-right">{Math.round(w * 100)}%</span>
    </div>
  );
}

function BurnDownChart({ data }: { data: BurnDown }) {
  const max = Math.max(data.budget, data.spent, ...data.series.map((s) => s.spent), 1);
  return (
    <div className="px-1">
      <div className="flex items-baseline gap-6 mb-3">
        <div><div className="text-2xs text-ink-muted">Budget</div><Money amount={data.budget} className="text-base font-semibold" /></div>
        <div><div className="text-2xs text-ink-muted">Spent</div><Money amount={data.spent} className="text-base font-semibold" /></div>
        <div><div className="text-2xs text-ink-muted">Remaining</div><Money amount={data.budget - data.spent} className="text-base font-semibold" /></div>
      </div>
      <div className="flex items-end gap-1 h-32">
        {data.series.length === 0 && <div className="text-2xs text-ink-muted">No paid vouchers yet.</div>}
        {data.series.map((s) => (
          <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-brand-100 rounded-t" style={{ height: `${(s.spent / max) * 100}%` }} title={`${s.month}: ${s.spent.toLocaleString()}`} />
            <div className="text-[10px] text-ink-muted">{s.month.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgeingPanel({ data }: { data: AgeingResp }) {
  const buckets = Object.entries(data.buckets);
  const total = buckets.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="px-1">
      {buckets.map(([k, v]) => (
        <div key={k} className="mb-2">
          <div className="flex justify-between text-2xs">
            <span className={`font-semibold ${k === '60+' ? 'text-bad' : k === '31-60' ? 'text-warn' : 'text-ink'}`}>{k} days</span>
            <Money amount={v} />
          </div>
          <div className="h-1.5 bg-canvas rounded-full overflow-hidden mt-0.5">
            <div className={`h-full ${k === '60+' ? 'bg-bad' : k === '31-60' ? 'bg-warn' : 'bg-brand'}`} style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
      <div className="mt-3 text-2xs text-ink-muted">{data.rows.length} outstanding · oldest {data.rows.reduce((m, r) => Math.max(m, r.days), 0)} days</div>
    </div>
  );
}
