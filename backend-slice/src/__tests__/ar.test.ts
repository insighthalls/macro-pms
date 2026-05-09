import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'node:child_process';
import { buildApp } from '../index.js';
import { db } from '../lib/db.js';

const app = buildApp();

async function loginAs(email: string) {
  const r = await request(app).post('/v1/auth/login').send({ email, password: 'password123' });
  expect(r.status).toBe(200);
  return r.body.accessToken as string;
}

beforeAll(() => {
  // Reset & re-seed against the configured DATABASE_URL (use a *_test DB in CI)
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  execSync('npx prisma db seed', { stdio: 'inherit' });
});

afterAll(async () => {
  await db.$disconnect();
});

describe('Advance Requests · happy path', () => {
  it('walks DRAFT → LIQUIDATED through all roles', async () => {
    const tokenPO  = await loginAs('t.phiri@macro.org');
    const tokenHOP = await loginAs('c.banda@macro.org');
    const tokenFM  = await loginAs('r.mwale@macro.org');
    const tokenED  = await loginAs('e.phiri@macro.org');
    const tokenGFO = await loginAs('d.nkhata@macro.org');

    // First, liquidate the seeded overdue AR-2026-0166 so Rule 50 doesn't block
    let r = await request(app).post('/v1/advance-requests/AR-2026-0166/submit-liquidation')
      .set('Authorization', `Bearer ${tokenPO}`)
      .send({ spentAmount: 184_000_000, varianceNote: 'matches' });
    expect(r.status).toBe(200);
    r = await request(app).post('/v1/advance-requests/AR-2026-0166/accept-liquidation')
      .set('Authorization', `Bearer ${tokenFM}`);
    expect(r.status).toBe(200);

    // Create
    r = await request(app).post('/v1/advance-requests')
      .set('Authorization', `Bearer ${tokenPO}`)
      .send({ activityId: 'ACT-2026-0151', amount: 218_000_000, title: 'Karonga refresher' });
    expect(r.status).toBe(201);
    const id = r.body.id as string;
    expect(id).toMatch(/^AR-\d{4}-\d{4}$/);
    expect(r.body.stage).toBe('PO_SUBMITTED');

    // Recommend
    r = await request(app).post(`/v1/advance-requests/${id}/recommend`).set('Authorization', `Bearer ${tokenHOP}`);
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('HOP_RECOMMENDED');

    // FM approve (218M is >200M so route includes ED)
    r = await request(app).post(`/v1/advance-requests/${id}/fm-approve`).set('Authorization', `Bearer ${tokenFM}`);
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('FM_APPROVED');
    expect(r.body.nextApproverRole).toBe('EXECUTIVE_DIRECTOR');

    // ED approve
    r = await request(app).post(`/v1/advance-requests/${id}/ed-approve`).set('Authorization', `Bearer ${tokenED}`);
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('ED_APPROVED');

    // GFO disburse
    r = await request(app).post(`/v1/advance-requests/${id}/disburse`)
      .set('Authorization', `Bearer ${tokenGFO}`)
      .send({ eftRef: 'EFT-2026-0099', disbursedOn: '2026-05-12' });
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('DISBURSED');

    // PO submits liquidation
    r = await request(app).post(`/v1/advance-requests/${id}/submit-liquidation`)
      .set('Authorization', `Bearer ${tokenPO}`)
      .send({ spentAmount: 211_400_000, varianceNote: 'fuel under estimate' });
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('LIQUIDATION_PENDING');

    // FM accepts
    r = await request(app).post(`/v1/advance-requests/${id}/accept-liquidation`).set('Authorization', `Bearer ${tokenFM}`);
    expect(r.status).toBe(200);
    expect(r.body.stage).toBe('LIQUIDATED');
  }, 60_000);
});

describe('Advance Requests · guards', () => {
  it('rejects login with bad password', async () => {
    const r = await request(app).post('/v1/auth/login').send({ email: 't.phiri@macro.org', password: 'wrong-password' });
    expect(r.status).toBe(401);
  });

  it('rejects unauthenticated requests', async () => {
    const r = await request(app).get('/v1/advance-requests');
    expect(r.status).toBe(401);
  });

  it('rejects wrong-role transitions (PO trying to fm-approve)', async () => {
    const tokenPO = await loginAs('t.phiri@macro.org');
    const r = await request(app).post('/v1/advance-requests/AR-2026-0166/fm-approve')
      .set('Authorization', `Bearer ${tokenPO}`);
    expect(r.status).toBe(403);
    expect(r.body.error).toBe('forbidden');
  });

  it('blocks new AR while officer has overdue liquidation (Rule 50)', async () => {
    // Re-reset to ensure AR-2026-0166 is overdue again
    execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
    execSync('npx prisma db seed', { stdio: 'inherit' });

    const tokenPO = await loginAs('t.phiri@macro.org');
    const r = await request(app).post('/v1/advance-requests')
      .set('Authorization', `Bearer ${tokenPO}`)
      .send({ activityId: 'ACT-2026-0151', amount: 218_000_000, title: 'Should be blocked' });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('rule_violation');
    expect(r.body.details.rule).toBe('outstanding_advance_block');
  }, 60_000);

  it('rejects invalid transitions with 409', async () => {
    const tokenFM = await loginAs('r.mwale@macro.org');
    // AR-2026-0166 is in LIQUIDATION_PENDING — fm-approve is not a valid transition
    const r = await request(app).post('/v1/advance-requests/AR-2026-0166/fm-approve')
      .set('Authorization', `Bearer ${tokenFM}`);
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('invalid_transition');
  });
});
