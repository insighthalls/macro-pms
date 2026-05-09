# MACRO PMS · Advance-Requests slice

A working, runnable backend slice — ONE module (Advance Requests) end-to-end — built as the reference implementation for the rest of the system.

## What's in here

- **Node 20 + TypeScript + Express 4 + Prisma + PostgreSQL 16**
- JWT auth (HS256) with argon2id password hashing
- Role-based + project-scoped middleware
- Hash-chained audit log
- Full Advance-Request state machine (DRAFT → PO_SUBMITTED → HOP_RECOMMENDED → FM_APPROVED → ED_APPROVED → DISBURSED → LIQUIDATION_PENDING → LIQUIDATED, plus RETURNED / REJECTED branches)
- Vitest + supertest integration tests covering the happy path and key guards
- Dockerfile + docker-compose for local dev (Postgres + app)
- Prisma seed matching the prototype's data

## Quickstart

```bash
cd backend-slice
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then:

```bash
# Login
curl -X POST http://localhost:4000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"t.phiri@macro.org","password":"password123"}'

# Submit an AR (use the returned accessToken)
TOKEN=...
curl -X POST http://localhost:4000/v1/advance-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"activityId":"ACT-2026-0151","amount":218000000,"title":"Karonga refresher"}'
```

## Tests

```bash
npm test
```

Spins up a fresh Postgres test schema, applies migrations, seeds, and walks the full AR lifecycle plus failure modes (wrong role, project access denied, invalid transition, outstanding-advance block).

## How to extend

Each module follows the same pattern:

```
prisma/schema.prisma       — model + enum
src/services/<entity>.ts   — workflow guards
src/routes/<entity>.ts     — Express router
src/__tests__/<entity>.ts  — integration tests
```

Replicate this for Payment Vouchers, Procurement, Action Points, etc. The auth/RBAC/audit/workflow plumbing is already abstracted in `src/lib/` and `src/middleware/` and is shared across modules.

## Production notes

This slice is dev-grade. Before production:

- Move JWT signing from HS256 → RS256 with a managed KMS key
- Add rate limiting (`express-rate-limit`) on `/auth/*`
- Add OpenTelemetry tracing
- Replace local file storage with S3 (presigned upload URLs) — not in this slice
- Add `helmet`, CSRF for cookie-based sessions
- Wire MFA (TOTP) — stubbed but not enforced here
- Move secrets to AWS Secrets Manager / Vault
