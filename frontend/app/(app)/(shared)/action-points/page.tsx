'use client';
import { useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StageBadge } from '@/components/StageBadge';
import { toast } from '@/components/Toast';
import { useActionPoints, useStartAp, useCloseAp, useReopenAp, useCreateAp } from '@/lib/queries-pv';
import { AP_PRIORITY } from '@/lib/stages';
import { fmtDate, fmtRelative } from '@/lib/format';
import { useAuth } from '@/lib/auth-store';
import type { ApPriority, ApStatus, HttpError } from '@/lib/types';

const ROLE_USER: Record<string,string> = {
  PROJECT_OFFICER: 'U-PO', HEAD_OF_PROGRAMS: 'U-HOP', GRANT_FINANCE_OFFICER: 'U-GFO',
  FINANCE_MANAGER: 'U-FM', EXECUTIVE_DIRECTOR: 'U-ED', PROCUREMENT_OFFICER: 'U-PRC',
  ADMINISTRATOR: 'U-ADM',
};

export default function ActionPointsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ApStatus | 'ALL'>('ALL');
  const { data: aps = [] } = useActionPoints(filter !== 'ALL' ? { status: filter } : undefined);
  const start = useStartAp; const close = useCloseAp; const reopen = useReopenAp;
  const create = useCreateAp;
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState(''); const [owner, setOwner] = useState('U-PO');
  const [priority, setPriority] = useState<ApPriority>('MEDIUM'); const [due, setDue] = useState('');

  const onErr = (e: unknown) => toast.bad((e as HttpError).message ?? 'Failed');

  return (
    <>
      <Topbar title="Action Points" subtitle="Track and close items raised across the org"
        action={<Button variant="primary" size="sm" onClick={() => setShowNew(!showNew)}>+ New action point</Button>} />
      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-canvas">
        {showNew && (
          <Card title="New action point">
            <div className="grid grid-cols-4 gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="col-span-2 px-3 h-9 rounded border border-line bg-white text-sm" />
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className="px-3 h-9 rounded border border-line bg-white text-sm">
                <option value="U-PO">Project Officer</option><option value="U-HOP">Head of Programs</option>
                <option value="U-GFO">Grant Finance Officer</option><option value="U-FM">Finance Manager</option>
                <option value="U-ED">Executive Director</option><option value="U-PRC">Procurement Officer</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as ApPriority)} className="px-3 h-9 rounded border border-line bg-white text-sm">
                {(['LOW','MEDIUM','HIGH','CRITICAL'] as ApPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="px-3 h-9 rounded border border-line bg-white text-sm" />
              <Button variant="primary" className="col-span-1" disabled={!title.trim()} onClick={() => {
                create.mutate({ title, ownerId: owner, priority, dueDate: due || undefined }, {
                  onSuccess: (ap) => { toast.ok(`Created ${ap.id}`); setTitle(''); setShowNew(false); }, onError: onErr,
                });
              }}>Create</Button>
            </div>
          </Card>
        )}

        <div className="flex gap-1.5">
          {(['ALL','OPEN','IN_PROGRESS','CLOSED','REOPENED'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 h-8 rounded-md text-xs border transition-colors ${filter === f ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-line hover:border-brand-300'}`}>
              {f.replace('_',' ')}
            </button>
          ))}
        </div>

        <Card padded={false}>
          {aps.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">No action points.</div>
          ) : aps.map((ap) => {
            const mine = user && (ap.ownerId === ROLE_USER[user.role] || ap.raisedById === ROLE_USER[user.role]);
            return (
              <div key={ap.id} className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0">
                <div className="font-mono text-2xs text-ink-muted w-16 shrink-0">{ap.id}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">{ap.title}</div>
                  <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                    <span>Owner {ap.ownerId}</span>
                    {ap.dueDate && <><span>·</span><span>Due {fmtDate(ap.dueDate)} ({fmtRelative(ap.dueDate)})</span></>}
                    {ap.linkedEntityId && <><span>·</span><span className="font-mono">{ap.linkedEntityId}</span></>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-2xs font-medium ${AP_PRIORITY[ap.priority].bg} ${AP_PRIORITY[ap.priority].fg}`}>{ap.priority}</span>
                <StageBadge stage={ap.status} kind="ap" />
                <div className="flex gap-1.5">
                  {ap.status === 'OPEN' && <Button size="sm" variant="ghost" onClick={() => start.mutate({ id: ap.id }, { onSuccess: () => toast.ok('Started'), onError: onErr })}>Start</Button>}
                  {ap.status !== 'CLOSED' && mine && <Button size="sm" variant="primary" onClick={() => close.mutate({ id: ap.id, body: { note: 'Done' } }, { onSuccess: () => toast.ok('Closed'), onError: onErr })}>Close</Button>}
                  {ap.status === 'CLOSED' && <Button size="sm" variant="ghost" onClick={() => reopen.mutate({ id: ap.id }, { onSuccess: () => toast.ok('Reopened'), onError: onErr })}>Reopen</Button>}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </>
  );
}
