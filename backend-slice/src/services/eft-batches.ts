import { db } from '../lib/db.js';
import { writeAudit } from './audit.js';
import { Forbidden, BadRequest, NotFound } from '../lib/errors.js';
import type { AuthClaims } from '../lib/auth.js';

const newId = () => `EFT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

export async function listBatches(projId?: string) {
  return db.eftBatch.findMany({
    where: projId ? { projId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
}

export async function getBatch(id: string) {
  const batch = await db.eftBatch.findUnique({ where: { id }, include: { items: true } });
  if (!batch) throw NotFound('EFT batch');
  return batch;
}

export async function createBatch(input: { projId: string; pvIds: string[] }, who: AuthClaims) {
  if (who.role !== 'GRANT_FINANCE_OFFICER' && who.role !== 'FINANCE_MANAGER')
    throw Forbidden('Only GFO/FM can create EFT batches');

  if (input.pvIds.length === 0) throw BadRequest('Select at least one PV');

  const pvs = await db.paymentVoucher.findMany({
    where: { id: { in: input.pvIds }, projId: input.projId },
  });
  if (pvs.length !== input.pvIds.length) throw BadRequest('Some PVs not found / wrong project');
  const bad = pvs.find((p) => p.stage !== 'SCHEDULED');
  if (bad) throw BadRequest(`PV ${bad.id} is not SCHEDULED (stage=${bad.stage})`);

  const total = pvs.reduce((s, p) => s + Number(p.netAmount), 0);
  const id = newId();

  const batch = await db.$transaction(async (tx) => {
    const b = await tx.eftBatch.create({
      data: {
        id,
        projId: input.projId,
        totalAmount: BigInt(total),
        createdById: who.userId,
        items: { create: pvs.map((p) => ({ pvId: p.id, amount: p.netAmount })) },
      },
      include: { items: true },
    });
    await writeAudit(tx, who, 'EFT', id, 'create', `${pvs.length} PVs · MWK ${total.toLocaleString()}`);
    return b;
  });
  return batch;
}

export async function lockBatch(id: string, who: AuthClaims) {
  if (who.role !== 'FINANCE_MANAGER' && who.role !== 'EXECUTIVE_DIRECTOR')
    throw Forbidden('Only FM/ED can lock');
  const batch = await getBatch(id);
  if (batch.stage !== 'DRAFT') throw BadRequest('Only DRAFT batches can be locked');

  return db.$transaction(async (tx) => {
    const b = await tx.eftBatch.update({
      where: { id },
      data: { stage: 'LOCKED', lockedAt: new Date() },
      include: { items: true },
    });
    await writeAudit(tx, who, 'EFT', id, 'lock', 'Batch locked for export');
    return b;
  });
}

/** Generate a pacs.008 ISO20022 XML for the batch (in-memory; persisted as bankFile path). */
export async function exportBatch(id: string, who: AuthClaims) {
  if (who.role !== 'FINANCE_MANAGER' && who.role !== 'EXECUTIVE_DIRECTOR')
    throw Forbidden('Only FM/ED can export');
  const batch = await getBatch(id);
  if (batch.stage !== 'LOCKED') throw BadRequest('Only LOCKED batches can be exported');

  const xml = await renderPacs008(batch);
  const path = `eft/${batch.projId}/${batch.id}.xml`;
  // In real prod, push xml to Supabase storage here.
  // For the slice we just record the path; an integration test asserts the body is non-empty.

  return db.$transaction(async (tx) => {
    const b = await tx.eftBatch.update({
      where: { id },
      data: { stage: 'EXPORTED', bankFile: path, exportedAt: new Date() },
      include: { items: true },
    });
    await writeAudit(tx, who, 'EFT', id, 'export', `pacs.008 generated · ${xml.length} bytes`);
    return { batch: b, xml, path };
  });
}

export async function ackBatch(id: string, ackFile: string, who: AuthClaims) {
  if (who.role !== 'GRANT_FINANCE_OFFICER' && who.role !== 'FINANCE_MANAGER')
    throw Forbidden();
  const batch = await getBatch(id);
  if (batch.stage !== 'EXPORTED') throw BadRequest('Only EXPORTED batches accept ACK');

  return db.$transaction(async (tx) => {
    const b = await tx.eftBatch.update({
      where: { id },
      data: { stage: 'ACK_RECEIVED', ackFile, ackedAt: new Date() },
      include: { items: true },
    });
    // Mark all PVs in batch as PAID
    await tx.paymentVoucher.updateMany({
      where: { id: { in: batch.items.map((it) => it.pvId) } },
      data: { stage: 'PAID', paidOn: new Date(), eftRef: id },
    });
    await writeAudit(tx, who, 'EFT', id, 'ack', `Bank ACK received; ${batch.items.length} PVs marked PAID`);
    return b;
  });
}

async function renderPacs008(batch: { id: string; projId: string; totalAmount: bigint; items: Array<{ pvId: string; amount: bigint }> }) {
  const now = new Date().toISOString();
  const items = batch.items
    .map(
      (it, i) => `  <CdtTrfTxInf>
    <PmtId><EndToEndId>${batch.id}-${String(i + 1).padStart(3, '0')}</EndToEndId></PmtId>
    <Amt><InstdAmt Ccy="MWK">${Number(it.amount).toFixed(2)}</InstdAmt></Amt>
    <Cdtr><Nm>PV ${it.pvId}</Nm></Cdtr>
  </CdtTrfTxInf>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
 <FIToFICstmrCdtTrf>
  <GrpHdr>
   <MsgId>${batch.id}</MsgId>
   <CreDtTm>${now}</CreDtTm>
   <NbOfTxs>${batch.items.length}</NbOfTxs>
   <CtrlSum>${Number(batch.totalAmount).toFixed(2)}</CtrlSum>
  </GrpHdr>
${items}
 </FIToFICstmrCdtTrf>
</Document>`;
}
