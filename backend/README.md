# MACRO PMS · Backend Handoff Package

This folder is the contract between the prototype and the real backend implementation. It is **target-framework: Node 20+ / TypeScript / Express / Prisma / PostgreSQL 15+** but every artifact (OpenAPI, SQL DDL, RBAC matrix) is portable to Django, Spring, .NET, or Laravel without semantic loss.

## What's in here

| File | Purpose |
|---|---|
| `README.md` | This file — architecture, stack rationale, folder layout, env vars, deployment |
| `schema.sql` | Full PostgreSQL DDL · 24 tables, FKs, indexes, check constraints, enums |
| `seed.sql` | Sample dataset matching the prototype (5 projects, 8 users, 12 DIP lines, 11 ARs, 9 PVs, 6 PRs, 8 vendors, 9 APs, audit log) |
| `prisma.schema` | Prisma ORM schema (1:1 with `schema.sql`) for the recommended Node implementation |
| `openapi.yaml` | OpenAPI 3.1 spec · ~80 endpoints across 11 controller groups |
| `auth.md` | JWT contract, refresh-token flow, RBAC matrix, MFA hooks |
| `workflows.md` | State machines for AR · PV · PR · AP — transitions, guards, side effects |
| `sample-requests.md` | curl examples covering the four golden flows end-to-end |

## 1 · Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│   Frontend · Next.js 14 (App Router) · Tailwind · React Query   │
│   (already prototyped in /Project Officer.html etc.)            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS · Bearer JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   API · Express 4 + TypeScript                                  │
│   ─ Routes (controllers) ──── 11 groups, ~80 endpoints          │
│   ─ Services (business logic, workflow engine, FSM guards)      │
│   ─ Repositories (Prisma client)                                │
│   ─ Middleware (auth, rbac, audit, request-id, error-handler)   │
│   ─ Workers (BullMQ) ──── recurring tx, EFT generation, OCR     │
└──────┬──────────────────┬──────────────────┬───────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌────────────┐    ┌────────────────┐
│ PostgreSQL   │   │  Redis     │    │  S3 (MinIO)    │
│ 15+          │   │  cache+bull│    │  documents     │
│ (primary DB) │   │  job queue │    │  signed URLs   │
└──────────────┘   └────────────┘    └────────────────┘
       ▲
       │ logical replication / pg_dump
       ▼
┌──────────────┐
│ Reporting DB │   (read-replica for SAGE / donor reports)
└──────────────┘
```

### Why this stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (Node 20) | Same idioms as the prototype; cheap migration; large NGO-domain library set |
| API | Express 4 | Smallest surface area; mature middleware ecosystem; easy to onboard |
| ORM | Prisma 5 | Generated types stay in sync with DDL; migrations are auditable; FSM guards are easy to express |
| DB | PostgreSQL 15 | Row-level security for donor data, JSON columns for activity payloads, foreign-data-wrapper for SAGE export |
| Queue | BullMQ on Redis 7 | Handles the recurring-tx job, OCR pipeline, EFT batch generation |
| Files | S3 (or MinIO local) | Voucher attachments, scans; 15-yr retention for audit |
| Auth | JWT + refresh in HTTP-only cookie | Stateless API; no sticky sessions; RBAC middleware reads `role` claim |
| Hosting | Render / Railway / Fly | All three deploy from a Dockerfile in <10 min; Postgres add-on $7/mo |

If your team has a hard preference for **Django**, **Laravel**, **Spring Boot**, or **.NET 8**, the OpenAPI spec and SQL DDL transfer directly — only the controllers and middleware get re-implemented.

## 2 · Folder layout (recommended)

```
macro-pms/
├── apps/
│   ├── web/                  # Next.js 14 frontend
│   │   ├── app/              # App Router routes (1 folder per role)
│   │   ├── components/       # Lifted from /shared/macro-shell.js + role HTMLs
│   │   └── lib/api.ts        # typed fetch client generated from openapi.yaml
│   └── api/                  # Express backend
│       ├── src/
│       │   ├── routes/       # 1 file per OpenAPI tag
│       │   ├── services/     # business logic (no Prisma calls here)
│       │   ├── repositories/ # all Prisma access
│       │   ├── middleware/   # auth, rbac, audit, request-id
│       │   ├── workflows/    # FSM definitions + guards
│       │   ├── workers/      # BullMQ workers
│       │   ├── lib/          # crypto, pdf, eft, ocr
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma # copy of /backend/prisma.schema
│       │   └── migrations/
│       └── tests/
├── packages/
│   ├── types/                # shared zod schemas / TS types
│   └── eslint-config/
├── infra/
│   ├── docker-compose.yml    # postgres + redis + minio for local dev
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── render.yaml           # or railway.toml / fly.toml
└── docs/
    └── (this folder copied here)
```

## 3 · Environment variables

```dotenv
# Database
DATABASE_URL="postgresql://macro:macro@localhost:5432/macro_pms?schema=public"

# Auth
JWT_SECRET="<64-byte random>"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="8h"
COOKIE_DOMAIN=".macro.org"
ARGON2_MEMORY_COST=65536        # 64MB

# Files
S3_ENDPOINT="https://s3.eu-west-1.amazonaws.com"
S3_BUCKET="macro-pms-prod"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_PRESIGN_TTL_SECONDS=900

# Queue
REDIS_URL="redis://localhost:6379"

# Currency / locale
DEFAULT_CCY="MWK"
DEFAULT_TZ="Africa/Blantyre"

# Integrations
SAGE_HOST=""
SAGE_API_KEY=""
SLACK_WEBHOOK_URL=""

# Observability
SENTRY_DSN=""
LOG_LEVEL="info"
```

## 4 · Run locally

```bash
# 1 · clone & install
pnpm install

# 2 · spin up infra
docker-compose -f infra/docker-compose.yml up -d   # postgres + redis + minio

# 3 · migrate + seed
pnpm --filter api prisma migrate deploy
psql $DATABASE_URL -f backend/seed.sql

# 4 · run
pnpm --filter api dev    # http://localhost:4000
pnpm --filter web dev    # http://localhost:3000
```

## 5 · Deployment

**Render** is the lowest-friction host. One `render.yaml` defines: web service (Next.js), api service (Express), Postgres, Redis. Promote env vars in the Render dashboard. Cost as of 2026: ~$28/mo for the small tier (api $7 + web $7 + postgres $7 + redis $7). Scale up by changing the plan only.

**Backups.** Render Postgres takes daily snapshots; retain 30 days. Add a weekly `pg_dump` to S3 for 12 months. Document attachment bucket has versioning enabled — never delete, only archive.

## 6 · Acceptance checklist for backend MVP

- [ ] Auth: login, refresh, logout, password reset
- [ ] RBAC enforced on every endpoint per `auth.md`
- [ ] AR full lifecycle (Draft → Liquidated)
- [ ] PV full lifecycle (Draft → Posted)
- [ ] PR full lifecycle (Draft → Closed)
- [ ] AP CRUD + escalation worker
- [ ] DIP balance recalculated on every commit/spend event
- [ ] Audit log entry on every state transition (immutable, append-only)
- [ ] Notifications fanned out per workflow events
- [ ] File upload to S3 with presigned URLs
- [ ] Voucher Bundle PDF generation
- [ ] EFT batch generation (ISO 20022 pacs.008.001.10)
- [ ] Recurring transaction worker draws drafts on schedule
- [ ] CSV export for SAGE GL
- [ ] Reports endpoints: burn-down, variance, ageing, vendor scorecard
- [ ] OpenAPI spec served at `/docs`
- [ ] Tests: ≥70% coverage on services + workflows

## 7 · Ownership

- **Owner:** Finance Manager (system) · CTO (technical)
- **Implementers:** 2 backend engineers, 1 frontend engineer, 0.5 DevOps, 8–10 weeks for MVP
- **Review cadence:** weekly demo, milestone gate at end of each module
