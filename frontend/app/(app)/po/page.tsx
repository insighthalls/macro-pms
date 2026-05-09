'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { DipChip } from '@/components/DipChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/lib/auth-store';
import { useAdvanceRequests } from '@/lib/queries';
import { fmtRelative, daysFromNow } from '@/lib/format';
import type { AdvanceRequest } from '@/lib/types';

export default function MyDayPage() {
  const { user } = useAuth();
  const { data: ars = [], isLoading } = useAdvanceRequests();

  // Inbox derivations from the live AR list
  const inbox = useMemo(() => {
    const items: { id: string; tone: 'bad'|'warn'|'info'; title: string; meta: string; href: string; cta: string }[] = [];
    for (const ar of ars) {
      if (ar.stage === 'RETURNED') {
        items.push({
          id: ar.id, tone: 'bad',
          title: `${ar.id} returned for revision`,
          meta:  ar.returnReason ?? 'No reason given',
          href:  `/po/advance-requests/${ar.id}`,
          cta:   'Open & revise',
        });
      } else if ((ar.stage === 'DISBURSED' || ar.stage === 'LIQUIDATION_PENDING') && (daysFromNow(ar.dueLiqDate) ?? 999) < 0) {
        items.push({
          id: ar.id, tone: 'warn',
          title: `${ar.id} liquidation overdue`,
          meta:  `Due ${fmtRelative(ar.dueLiqDate)} · ${ar.title}`,
          href:  `/po/advance-requests/${ar.id}`,
          cta:   'Submit liquidation',
        });
      } else if (ar.stage === 'DISBURSED') {
        items.push({
          id: ar.id, tone: 'info',
          title: `${ar.id} ready to liquidate`,
          meta:  `Due ${fmtRelative(ar.dueLiqDate)} · ${ar.title}`,
          href:  `/po/advance-requests/${ar.id}`,
          cta:   'Open',
        });
      }
    }
    return items.slice(0, 6);
  }, [ars]);

  const counts = useMemo(() => ({
    returned: ars.filter((a) => a.stage === 'RETURNED').length,
    overdue:  ars.filter((a) => (a.stage === 'DISBURSED' || a.stage === 'LIQUIDATION_PENDING') && (daysFromNow(a.dueLiqDate) ?? 999) < 0).length,
    held:     ars.filter((a) => a.stage === 'DISBURSED').reduce((s, a) => s + Number(a.amount), 0),
    inflight: ars.filter((a) => !['LIQUIDATED','REJECTED'].includes(a.stage)).length,
  }), [ars]);

  return (
    <>
      <Topbar
        title="My Day"
        subtitle={user ? `${user.fullName} · ${user.region ?? 'Field'}` : ''}
        action={
          <Link href="/po/advance-requests/new">
            <Button variant="primary" size="sm">+ New advance</Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto bg-canvas">
        {/* Greeting + KPIs */}
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="p-5 md:w-1/3 bg-gradient-to-br from-brand to-brand-700 text-white">
              <div className="text-2xs uppercase tracking-wider text-brand-100">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</div>
              <div className="mt-1 text-2xl font-semibold">Good morning, {user?.fullName.split(' ')[0]}.</div>
              <p className="mt-2 text-brand-100 text-sm leading-relaxed">
                You have <strong className="text-white">{counts.returned}</strong> returned item · <strong className="text-white">{counts.overdue}</strong> liquidation{counts.overdue === 1 ? '' : 's'} overdue.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 flex-1 divide-x divide-line border-l border-line">
              <Kpi label="In flight" value={String(counts.inflight)} />
              <Kpi label="Returned"  value={String(counts.returned)} tone={counts.returned ? 'bad' : 'ink'} />
              <Kpi label="Held (disbursed)" value={<Money value={counts.held} compact />} />
            </div>
          </div>
        </Card>

        {/* Inbox */}
        <Card title="Needs your action" subtitle={`${inbox.length} item${inbox.length === 1 ? '' : 's'}`} padded={false}>
          {isLoading ? (
            <div className="p-6 text-sm text-ink-muted">Loading…</div>
          ) : inbox.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">All clear. Nothing needs your action right now.</div>
          ) : (
            <ul>
              {inbox.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${
                    item.tone === 'bad' ? 'bg-bad' : item.tone === 'warn' ? 'bg-warn' : 'bg-brand'
                  }`}/>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink truncate">{item.title}</div>
                    <div className="text-xs text-ink-muted truncate">{item.meta}</div>
                  </div>
                  <Link href={item.href}>
                    <Button variant="secondary" size="sm">{item.cta}</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* In-flight pipeline */}
        <Card title="In flight" padded={false}>
          {ars.filter((a) => !['LIQUIDATED','REJECTED'].includes(a.stage)).slice(0, 5).map((ar) => (
            <Link
              key={ar.id}
              href={`/po/advance-requests/${ar.id}`}
              className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-canvas transition-colors"
            >
              <div className="font-mono text-2xs text-ink-muted w-24 shrink-0">{ar.id}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{ar.title}</div>
                <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                  <DipChip code={ar.dipCode} />
                  <span>·</span>
                  <span>Due {fmtRelative(ar.dueLiqDate)}</span>
                </div>
              </div>
              <Money value={ar.amount} className="text-sm text-ink shrink-0" />
              <StageBadge stage={ar.stage} />
            </Link>
          ))}
          {ars.length === 0 && !isLoading && (
            <div className="p-8 text-center text-sm text-ink-muted">No advances yet. Click &ldquo;New advance&rdquo; to start.</div>
          )}
        </Card>
      </div>
    </>
  );
}

function Kpi({ label, value, tone = 'ink' }: { label: string; value: React.ReactNode; tone?: 'ink' | 'bad' | 'warn' | 'ok' }) {
  const colour = tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-ink';
  return (
    <div className="p-5">
      <div className="text-2xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${colour}`}>{value}</div>
    </div>
  );
}
