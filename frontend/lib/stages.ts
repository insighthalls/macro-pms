/**
 * Stage display config — labels, colours, ordering.
 * Mirrors enums in backend-slice/prisma/schema.prisma.
 */

import type { ArStage, PvStage, PrStage, ApStatus, ApPriority } from './types';

interface StageMeta { label: string; short: string; bg: string; fg: string; dot: string; }

export const AR_STAGE: Record<ArStage, StageMeta> = {
  DRAFT:               { label: 'Draft',                short: 'Draft',     bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-400' },
  PO_SUBMITTED:        { label: 'Submitted',            short: 'Submitted', bg: 'bg-brand-50',    fg: 'text-brand-700',  dot: 'bg-brand-500' },
  HOP_RECOMMENDED:     { label: 'Recommended by HoP',   short: 'HoP rec\'d',bg: 'bg-violet-50',   fg: 'text-violet-700', dot: 'bg-violet-500' },
  FM_APPROVED:         { label: 'FM approved',          short: 'FM appr.',  bg: 'bg-emerald-50',  fg: 'text-emerald-700',dot: 'bg-emerald-500' },
  ED_APPROVED:         { label: 'ED approved',          short: 'ED appr.',  bg: 'bg-emerald-50',  fg: 'text-emerald-800',dot: 'bg-emerald-600' },
  DISBURSED:           { label: 'Disbursed',            short: 'Disbursed', bg: 'bg-teal-50',     fg: 'text-teal-700',   dot: 'bg-teal-500' },
  LIQUIDATION_PENDING: { label: 'Liquidation pending',  short: 'Liq. pend.',bg: 'bg-amber-50',    fg: 'text-amber-800',  dot: 'bg-amber-500' },
  LIQUIDATED:          { label: 'Liquidated',           short: 'Liquidated',bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-500' },
  RETURNED:            { label: 'Returned',             short: 'Returned',  bg: 'bg-red-50',      fg: 'text-red-700',    dot: 'bg-red-500' },
  REJECTED:            { label: 'Rejected',             short: 'Rejected',  bg: 'bg-red-100',     fg: 'text-red-800',    dot: 'bg-red-600' },
};

export const AR_PIPELINE_ORDER: ArStage[] = [
  'DRAFT','PO_SUBMITTED','HOP_RECOMMENDED','FM_APPROVED','ED_APPROVED',
  'DISBURSED','LIQUIDATION_PENDING','LIQUIDATED',
];

export const PV_STAGE: Record<PvStage, StageMeta> = {
  DRAFT:         { label: 'Draft',         short: 'Draft',     bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-400' },
  PO_SUBMITTED:  { label: 'Submitted',     short: 'Submitted', bg: 'bg-brand-50',    fg: 'text-brand-700',  dot: 'bg-brand-500' },
  GFO_REVIEWED:  { label: 'GFO reviewed',  short: 'GFO rev.',  bg: 'bg-violet-50',   fg: 'text-violet-700', dot: 'bg-violet-500' },
  FM_APPROVED:   { label: 'FM approved',   short: 'FM appr.',  bg: 'bg-emerald-50',  fg: 'text-emerald-700',dot: 'bg-emerald-500' },
  ED_APPROVED:   { label: 'ED approved',   short: 'ED appr.',  bg: 'bg-emerald-50',  fg: 'text-emerald-800',dot: 'bg-emerald-600' },
  SCHEDULED:     { label: 'Scheduled',     short: 'Scheduled', bg: 'bg-teal-50',     fg: 'text-teal-700',   dot: 'bg-teal-500' },
  PAID:          { label: 'Paid',          short: 'Paid',      bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-500' },
  RETURNED:      { label: 'Returned',      short: 'Returned',  bg: 'bg-red-50',      fg: 'text-red-700',    dot: 'bg-red-500' },
  REJECTED:      { label: 'Rejected',      short: 'Rejected',  bg: 'bg-red-100',     fg: 'text-red-800',    dot: 'bg-red-600' },
};

export const PV_PIPELINE_ORDER: PvStage[] = [
  'DRAFT','PO_SUBMITTED','GFO_REVIEWED','FM_APPROVED','ED_APPROVED','SCHEDULED','PAID',
];

export const PR_STAGE: Record<PrStage, StageMeta> = {
  DRAFT:         { label: 'Draft',          short: 'Draft',     bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-400' },
  PR_SUBMITTED:  { label: 'Submitted',      short: 'Submitted', bg: 'bg-brand-50',    fg: 'text-brand-700',  dot: 'bg-brand-500' },
  RFQ_OPEN:      { label: 'RFQ open',       short: 'RFQ open',  bg: 'bg-amber-50',    fg: 'text-amber-800',  dot: 'bg-amber-500' },
  RFQ_EVALUATED: { label: 'RFQ evaluated',  short: 'Evaluated', bg: 'bg-violet-50',   fg: 'text-violet-700', dot: 'bg-violet-500' },
  LPO_ISSUED:    { label: 'LPO issued',     short: 'LPO',       bg: 'bg-teal-50',     fg: 'text-teal-700',   dot: 'bg-teal-500' },
  GRN_RECEIVED:  { label: 'GRN received',   short: 'GRN',       bg: 'bg-emerald-50',  fg: 'text-emerald-700',dot: 'bg-emerald-500' },
  CLOSED:        { label: 'Closed',         short: 'Closed',    bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-500' },
  CANCELLED:     { label: 'Cancelled',      short: 'Cancelled', bg: 'bg-red-50',      fg: 'text-red-700',    dot: 'bg-red-500' },
};

export const PR_PIPELINE_ORDER: PrStage[] = [
  'PR_SUBMITTED','RFQ_OPEN','RFQ_EVALUATED','LPO_ISSUED','GRN_RECEIVED','CLOSED',
];

export const AP_STATUS: Record<ApStatus, StageMeta> = {
  OPEN:        { label: 'Open',         short: 'Open',     bg: 'bg-brand-50',    fg: 'text-brand-700',  dot: 'bg-brand-500' },
  IN_PROGRESS: { label: 'In progress',  short: 'In prog.', bg: 'bg-amber-50',    fg: 'text-amber-800',  dot: 'bg-amber-500' },
  CLOSED:      { label: 'Closed',       short: 'Closed',   bg: 'bg-slate-100',   fg: 'text-slate-700',  dot: 'bg-slate-500' },
  REOPENED:    { label: 'Reopened',     short: 'Reopened', bg: 'bg-red-50',      fg: 'text-red-700',    dot: 'bg-red-500' },
};

export const AP_PRIORITY: Record<ApPriority, { label: string; bg: string; fg: string }> = {
  LOW:      { label: 'Low',      bg: 'bg-slate-100',   fg: 'text-slate-700' },
  MEDIUM:   { label: 'Medium',   bg: 'bg-brand-50',    fg: 'text-brand-700' },
  HIGH:     { label: 'High',     bg: 'bg-amber-50',    fg: 'text-amber-800' },
  CRITICAL: { label: 'Critical', bg: 'bg-red-50',      fg: 'text-red-700' },
};
