import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

async function main() {
  const pwd = await argon2.hash('password123', { type: argon2.argon2id });

  await db.project.createMany({
    data: [
      { id: 'IMP', code: 'IMPACT KP',  name: 'IMPACT KP — DREAMS Plus', donor: 'PEPFAR / USAID', colorHex: '#1F4E79', budgetTotal: 584_000_000_000n, spentTotal: 392_700_000_000n, periodStart: new Date('2024-10-01'), periodEnd: new Date('2027-09-30') },
      { id: 'LRR', code: 'LINK RISE',  name: 'LINK RISE — TB & HIV',     donor: 'Global Fund',     colorHex: '#7A1F4E', budgetTotal: 812_000_000_000n, spentTotal: 431_200_000_000n, periodStart: new Date('2024-04-01'), periodEnd: new Date('2027-03-31') },
    ],
    skipDuplicates: true,
  });

  await db.user.createMany({
    data: [
      { id: 'U-PO',  fullName: 'Tendai Phiri',    role: 'PROJECT_OFFICER',       email: 't.phiri@macro.org',  region: 'KP',  passwordHash: pwd, initials: 'TP' },
      { id: 'U-HOP', fullName: 'Chimwemwe Banda', role: 'HEAD_OF_PROGRAMS',      email: 'c.banda@macro.org',  region: 'HQ',  passwordHash: pwd, initials: 'CB' },
      { id: 'U-GFO', fullName: 'Dalitso Nkhata',  role: 'GRANT_FINANCE_OFFICER', email: 'd.nkhata@macro.org', region: 'HQ',  passwordHash: pwd, initials: 'DN' },
      { id: 'U-FM',  fullName: 'Ruth Mwale',      role: 'FINANCE_MANAGER',       email: 'r.mwale@macro.org',  region: 'HQ',  passwordHash: pwd, initials: 'RM' },
      { id: 'U-ED',  fullName: 'Eleanor Phiri',   role: 'EXECUTIVE_DIRECTOR',    email: 'e.phiri@macro.org',  region: 'HQ',  passwordHash: pwd, initials: 'EP' },
    ],
    skipDuplicates: true,
  });

  await db.userProjectAccess.createMany({
    data: [
      { userId: 'U-PO',  projId: 'IMP' },
      { userId: 'U-HOP', projId: 'IMP' },
      { userId: 'U-GFO', projId: 'IMP' }, { userId: 'U-GFO', projId: 'LRR' },
      { userId: 'U-FM',  projId: 'IMP' }, { userId: 'U-FM',  projId: 'LRR' },
      { userId: 'U-ED',  projId: 'IMP' }, { userId: 'U-ED',  projId: 'LRR' },
    ],
    skipDuplicates: true,
  });

  await db.dipLine.createMany({
    data: [
      { code: 'DIP-1.1.1', projId: 'IMP', label: 'KP outreach – Lilongwe',   budgetAmount: 8_400_000_000n, committed: 1_840_000_000n, spent: 4_120_000_000n, watchLevel: 'GREEN' },
      { code: 'DIP-2.4.1', projId: 'IMP', label: 'Peer-led case finding',    budgetAmount: 4_120_000_000n, committed:   680_000_000n, spent: 3_690_000_000n, watchLevel: 'RED'   },
      { code: 'DIP-2.4.2', projId: 'IMP', label: 'Index-testing field ops',  budgetAmount: 3_350_000_000n, committed:   410_000_000n, spent: 1_870_000_000n, watchLevel: 'GREEN' },
    ],
    skipDuplicates: true,
  });

  await db.activity.createMany({
    data: [
      { id: 'ACT-2026-0148', projId: 'IMP', dipCode: 'DIP-2.4.2', title: 'Index testing rotation', officerId: 'U-PO', stage: 'EXECUTE',  budgetAmount: 246_000_000n, advanceAmount: 184_000_000n, spentAmount: 98_000_000n, startDate: new Date('2026-05-07'), dueLiqDate: new Date('2026-05-14') },
      { id: 'ACT-2026-0151', projId: 'IMP', dipCode: 'DIP-2.4.2', title: 'Karonga sample-transport refresher', officerId: 'U-PO', stage: 'ADVANCE', budgetAmount: 218_000_000n, advanceAmount: 0n, spentAmount: 0n, startDate: new Date('2026-05-10'), dueLiqDate: new Date('2026-05-26') },
    ],
    skipDuplicates: true,
  });

  await db.advanceRequest.createMany({
    data: [
      // Already-overdue liquidation belonging to PO — used by tests to assert the outstanding-advance block (Rule 50)
      { id: 'AR-2026-0166', activityId: 'ACT-2026-0148', projId: 'IMP', dipCode: 'DIP-2.4.2', title: 'Old advance, overdue', amount: 184_000_000n, requestedById: 'U-PO', stage: 'LIQUIDATION_PENDING', submittedAt: new Date('2026-04-06'), disbursedOn: new Date('2026-04-12'), dueLiqDate: new Date('2026-04-19') },
    ],
    skipDuplicates: true,
  });

  await db.approvalRule.createMany({
    data: [
      { id: 'AR<2M',   entityKind: 'AR', thresholdLow: 0n,             thresholdHigh: 200_000_000n, route: ['HOP', 'FM'] },
      { id: 'AR2-10M', entityKind: 'AR', thresholdLow: 200_000_000n,   thresholdHigh: 1_000_000_000n, route: ['HOP', 'FM', 'ED'] },
      { id: 'AR>10M',  entityKind: 'AR', thresholdLow: 1_000_000_000n, thresholdHigh: null,         route: ['HOP', 'FM', 'ED'] },
      { id: 'PV<2M',   entityKind: 'PV', thresholdLow: 0n,             thresholdHigh: 200_000_000n, route: ['GFO', 'FM'] },
      { id: 'PV2-10M', entityKind: 'PV', thresholdLow: 200_000_000n,   thresholdHigh: 1_000_000_000n, route: ['GFO', 'FM', 'ED'] },
      { id: 'PV>10M',  entityKind: 'PV', thresholdLow: 1_000_000_000n, thresholdHigh: null,         route: ['GFO', 'FM', 'ED'] },
    ],
    skipDuplicates: true,
  });

  await db.user.createMany({
    data: [
      { id: 'U-PRC', fullName: 'Mphatso Kondowe',  role: 'PROCUREMENT_OFFICER', email: 'm.kondowe@macro.org', region: 'HQ', passwordHash: pwd, initials: 'MK' },
      { id: 'U-ADM', fullName: 'Sibongile Tembo',  role: 'ADMINISTRATOR',       email: 's.tembo@macro.org',   region: 'HQ', passwordHash: pwd, initials: 'ST' },
    ],
    skipDuplicates: true,
  });
  await db.userProjectAccess.createMany({
    data: [
      { userId: 'U-PRC', projId: 'IMP' }, { userId: 'U-PRC', projId: 'LRR' },
      { userId: 'U-ADM', projId: 'IMP' }, { userId: 'U-ADM', projId: 'LRR' },
    ],
    skipDuplicates: true,
  });

  await db.vendor.createMany({
    data: [
      { id: 'VEN-001', name: 'Sunbird Stationers Ltd',  tin: 'TIN-3-001', bankName: 'NBM', bankAccount: '01234567', wtecValid: true,  wtecExpiry: new Date('2026-12-31'), ceiling: 80_000_000n, spent: 22_400_000n },
      { id: 'VEN-002', name: 'Lilongwe Logistics Co.',  tin: 'TIN-3-014', bankName: 'NBS', bankAccount: '02233344', wtecValid: true,  wtecExpiry: new Date('2026-09-30'), ceiling: 220_000_000n, spent: 117_300_000n },
      { id: 'VEN-003', name: 'Bridge Catering',          tin: 'TIN-3-097', bankName: 'NBM', bankAccount: '04488112', wtecValid: false, wtecExpiry: new Date('2025-11-30'), ceiling: 120_000_000n, spent: 86_500_000n },
    ],
    skipDuplicates: true,
  });

  await db.paymentVoucher.createMany({
    data: [
      { id: 'PV-2026-1248', projId: 'IMP', dipCode: 'DIP-1.1.1', vendorId: 'VEN-001', title: 'Stationery & training packs · Mzuzu KP', grossAmount: 4_120_000n, whtAmount: 412_000n, netAmount: 3_708_000n, itemsJson: [{ description:'Notebooks', qty: 250, unitPrice: 1200 }, { description:'Pens', qty: 500, unitPrice: 350 }] as never, attachmentsJson: ['receipt-1248.pdf'] as never, raisedById: 'U-PO', stage: 'PO_SUBMITTED', nextApproverRole: 'GRANT_FINANCE_OFFICER', threeWayMatchOk: true },
      { id: 'PV-2026-1249', projId: 'IMP', dipCode: 'DIP-2.4.2', vendorId: 'VEN-002', arId: 'AR-2026-0166', title: 'Karonga transport refund', grossAmount: 1_840_000n, whtAmount: 0n, netAmount: 1_840_000n, itemsJson: [{ description:'Fuel + per diem', qty: 1, unitPrice: 1840000 }] as never, attachmentsJson: ['fuel-receipts.pdf'] as never, raisedById: 'U-PO', stage: 'GFO_REVIEWED', nextApproverRole: 'FINANCE_MANAGER', threeWayMatchOk: true },
    ],
    skipDuplicates: true,
  });

  await db.purchaseRequisition.createMany({
    data: [
      { id: 'PR-2026-0042', projId: 'IMP', dipCode: 'DIP-1.1.1', title: 'Branded materials · KP outreach', estimatedAmount: 8_400_000n, stage: 'RFQ_OPEN', raisedById: 'U-PO', rfqDeadline: new Date('2026-05-22') },
      { id: 'PR-2026-0044', projId: 'IMP', dipCode: 'DIP-2.4.2', title: 'Vehicle hire · field supervision', estimatedAmount: 12_600_000n, vendorId: 'VEN-002', stage: 'LPO_ISSUED', raisedById: 'U-PO', lpoRef: 'LPO-2026-0089' },
    ],
    skipDuplicates: true,
  });

  await db.actionPoint.createMany({
    data: [
      { id: 'AP-0480', title: 'Submit narrative report · Mzuzu workshop', ownerId: 'U-PO',  raisedById: 'U-HOP', priority: 'HIGH',     status: 'OPEN', dueDate: new Date('2026-05-15'), projId: 'IMP', linkedEntity: 'AR', linkedEntityId: 'AR-2026-0166' },
      { id: 'AP-0482', title: 'Reconcile DIP-2.4.1 overdraft',           ownerId: 'U-FM',  raisedById: 'U-ED',  priority: 'CRITICAL', status: 'IN_PROGRESS', dueDate: new Date('2026-05-12'), projId: 'IMP' },
      { id: 'AP-0484', title: 'Renew Bridge Catering WTEC',              ownerId: 'U-PRC', raisedById: 'U-FM',  priority: 'MEDIUM',   status: 'OPEN', dueDate: new Date('2026-06-01'), linkedEntity: 'VENDOR', linkedEntityId: 'VEN-003' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main().finally(() => db.$disconnect());
