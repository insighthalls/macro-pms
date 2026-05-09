import { db } from '../lib/db.js';

/** Burn-down: total budget vs spent by month, per project. */
export async function burnDown(projId: string) {
  const proj = await db.project.findUnique({ where: { id: projId } });
  if (!proj) return null;
  const pvs = await db.paymentVoucher.findMany({
    where: { projId, stage: 'PAID' },
    select: { netAmount: true, paidOn: true },
  });
  const months: Record<string, number> = {};
  for (const p of pvs) {
    if (!p.paidOn) continue;
    const k = p.paidOn.toISOString().slice(0, 7);
    months[k] = (months[k] ?? 0) + Number(p.netAmount);
  }
  const series = Object.entries(months).sort().map(([m, v]) => ({ month: m, spent: v }));
  return {
    project: proj.id, name: proj.name,
    budget: Number(proj.budgetTotal),
    spent: Number(proj.spentTotal),
    series,
  };
}

/** Variance: budget vs actual per DIP line. */
export async function variance(projId: string) {
  const lines = await db.dipLine.findMany({ where: { projId } });
  return lines.map((l) => ({
    code: l.code,
    label: l.label,
    budget: Number(l.budgetAmount),
    spent: Number(l.spent),
    committed: Number(l.committed),
    pctSpent: Number(l.budgetAmount) ? Number(l.spent) / Number(l.budgetAmount) : 0,
    watch: l.watchLevel,
  }));
}

/** Vendor scorecards: count + value of paid invoices, on-time %. */
export async function vendorScorecards() {
  const vs = await db.vendor.findMany({ include: { pvs: true } });
  return vs.map((v) => {
    const paid = v.pvs.filter((p) => p.stage === 'PAID');
    const totalPaid = paid.reduce((s, p) => s + Number(p.netAmount), 0);
    return {
      id: v.id,
      name: v.name,
      tin: v.tin,
      wtecValid: v.wtecValid,
      wtecExpiry: v.wtecExpiry,
      ceiling: v.ceiling ? Number(v.ceiling) : null,
      spent: Number(v.spent),
      invoiceCount: v.pvs.length,
      paidCount: paid.length,
      paidValue: totalPaid,
    };
  });
}

/** AR ageing buckets — for outstanding liquidations. */
export async function arAgeing() {
  const ars = await db.advanceRequest.findMany({
    where: { stage: 'LIQUIDATION_PENDING' },
    select: { id: true, title: true, amount: true, dueLiqDate: true, requestedById: true, projId: true, requestedBy: { select: { fullName: true } } },
  });
  const today = new Date();
  const buckets = { '0-7': 0, '8-30': 0, '31-60': 0, '60+': 0 };
  const rows = ars.map((a) => {
    const due = a.dueLiqDate ? new Date(a.dueLiqDate) : today;
    const days = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400_000));
    const bucket = days <= 7 ? '0-7' : days <= 30 ? '8-30' : days <= 60 ? '31-60' : '60+';
    buckets[bucket as keyof typeof buckets] += Number(a.amount);
    return { id: a.id, title: a.title, amount: Number(a.amount), days, bucket, owner: a.requestedBy.fullName, projId: a.projId };
  });
  return { buckets, rows };
}

/** Donor pack: monthly summary across all projects. */
export async function donorPack() {
  const projs = await db.project.findMany({
    include: {
      ars: { where: { stage: 'DISBURSED' }, select: { amount: true } },
      pvs: { where: { stage: 'PAID' }, select: { netAmount: true } },
    },
  });
  return projs.map((p) => ({
    id: p.id,
    name: p.name,
    donor: p.donor,
    ccy: p.ccy,
    budget: Number(p.budgetTotal),
    spent: Number(p.spentTotal),
    arsDisbursedCount: p.ars.length,
    pvsPaidCount: p.pvs.length,
    pvsPaidValue: p.pvs.reduce((s, x) => s + Number(x.netAmount), 0),
  }));
}
