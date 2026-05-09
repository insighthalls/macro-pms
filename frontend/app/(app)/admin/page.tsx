'use client';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { useVendors } from '@/lib/queries-pv';

export default function AdminPage() {
  const { data: vendors = [] } = useVendors();
  return (
    <>
      <Topbar title="Administration" subtitle="Users · roles · audit · master data" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        <div className="grid grid-cols-3 gap-4">
          <Card><div className="text-2xs uppercase text-ink-muted">Active users</div><div className="text-2xl font-semibold mt-1">8</div><div className="text-xs text-ink-muted mt-0.5">across 7 roles</div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">Active vendors</div><div className="text-2xl font-semibold mt-1">{vendors.filter(v => v.active).length}</div><div className="text-xs text-ink-muted mt-0.5">{vendors.filter(v => !v.wtecValid).length} with WTEC issues</div></Card>
          <Card><div className="text-2xs uppercase text-ink-muted">Audit chain</div><div className="text-2xl font-semibold mt-1 text-ok">✓ Sealed</div><div className="text-xs text-ink-muted mt-0.5">Hash-chained, tamper-evident</div></Card>
        </div>

        <Card title="Vendor master" padded={false}>
          <table className="w-full text-sm">
            <thead className="bg-canvas border-b border-line text-2xs uppercase tracking-wider text-ink-muted">
              <tr><th className="text-left px-4 py-2 font-medium">Vendor</th><th className="text-left px-4 py-2 font-medium">TIN</th><th className="text-left px-4 py-2 font-medium">Bank</th><th className="text-left px-4 py-2 font-medium">WTEC</th><th className="text-right px-4 py-2 font-medium">Ceiling</th><th className="text-right px-4 py-2 font-medium">Spent</th></tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{v.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-muted">{v.tin ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted">{v.bankName} · {v.bankAccount}</td>
                  <td className="px-4 py-2.5">{v.wtecValid ? <span className="text-ok text-xs">✓ Valid · {v.wtecExpiry?.slice(0,10)}</span> : <span className="text-bad text-xs">✗ Invalid</span>}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{v.ceiling ? Number(v.ceiling).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{Number(v.spent).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Roles & permissions" subtitle="RBAC matrix · 8 roles · 17 modules">
          <div className="text-sm text-ink-muted">Full role-permission matrix is defined in <span className="font-mono text-xs">backend/auth.md</span>. Edits here are read-only in this slice — full UI to come in a later session.</div>
        </Card>
      </div>
    </>
  );
}
