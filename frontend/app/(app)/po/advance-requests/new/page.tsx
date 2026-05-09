'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/Topbar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useCreateAdvanceRequest } from '@/lib/queries';
import { toast } from '@/components/Toast';
import { HttpError } from '@/lib/api';
import { fmtMwk } from '@/lib/format';

export default function NewArPage() {
  const router = useRouter();
  const create  = useCreateAdvanceRequest();
  const [activityId, setActivityId] = useState('ACT-2026-0138');
  const [title, setTitle]           = useState('Mzuzu KP outreach · Workshop & DSA');
  const [amount, setAmount]         = useState('1850000');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const ar = await create.mutateAsync({ activityId, title, amount: Number(amount) });
      toast.ok(`Created ${ar.id} · routed to Head of Programs.`);
      router.replace(`/po/advance-requests/${ar.id}`);
    } catch (err) {
      const e = err as HttpError;
      if (e.code === 'outstanding_advance_block') {
        toast.bad(`Blocked by Rule 50 — liquidate ${(e.details as {blockingArId?: string})?.blockingArId} first.`);
      } else if (e.code === 'dip_overdraft_no_justification') {
        toast.bad('DIP overdraft — adjust amount or split across lines.');
      } else {
        toast.bad(e.message ?? 'Could not create advance.');
      }
    }
  }

  return (
    <>
      <Topbar
        title="New Advance Request"
        subtitle="Step 1 of 2 · Linkage & amount"
        action={<Link href="/po/advance-requests"><Button variant="ghost" size="sm">Cancel</Button></Link>}
      />
      <div className="flex-1 p-6 overflow-y-auto bg-canvas">
        <div className="max-w-3xl">
          <Card title="Activity & amount" subtitle="The activity must already exist and be assigned to you.">
            <form onSubmit={onSubmit} className="space-y-5">
              <Field label="Activity ID" hint="From your activities backlog (ACT-YYYY-NNNN).">
                <input
                  required
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-line bg-white font-mono text-sm focus:border-brand focus:outline-none focus:shadow-focus"
                />
              </Field>
              <Field label="Title" hint="What is this advance for? Visible to all approvers.">
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-line bg-white text-sm focus:border-brand focus:outline-none focus:shadow-focus"
                />
              </Field>
              <Field label="Amount (MWK)" hint={amount ? `Will request ${fmtMwk(amount)}.` : 'Whole kwacha — no decimals.'}>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 w-full px-3 rounded-md border border-line bg-white font-mono tabular-nums text-sm focus:border-brand focus:outline-none focus:shadow-focus"
                />
              </Field>

              <div className="border-t border-line pt-5 flex items-center justify-between">
                <p className="text-xs text-ink-muted">
                  On submit, this is checked against Rule 50 (no overdue advances) and the DIP balance,
                  then routed to <strong>Head of Programs</strong> for recommendation.
                </p>
                <div className="flex gap-2">
                  <Link href="/po/advance-requests"><Button variant="secondary">Cancel</Button></Link>
                  <Button type="submit" variant="primary" disabled={create.isPending}>
                    {create.isPending ? 'Submitting…' : 'Submit for HoP recommendation'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-2xs text-ink-soft">{hint}</p>}
    </label>
  );
}
