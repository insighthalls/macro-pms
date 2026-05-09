# MACRO PMS — Deployment Runbook

> Production target: **Render** (backend + Postgres) · **Vercel** (frontend) · **Supabase** (file storage).
> Estimated first-time setup: **half a day**.

---

## 0. Inventory

| Component | Stack | Hostable on |
|---|---|---|
| `backend-slice/` | Node 20 + Express + Prisma + Postgres | Render Web Service / Fly.io / Railway |
| `frontend/` | Next.js 15 (App Router) | Vercel / Netlify |
| Postgres | v16 | Render Postgres / Supabase / Neon |
| Object storage | Supabase Storage | Supabase only (or swap with S3) |
| Outbound email | (TBD) | Resend / Postmark |

---

## 1. One-time provisioning

### 1.1 Postgres (Render)
1. Render → **New +** → **PostgreSQL** → name `macro-pms-prod`, plan ≥ 1 GB.
2. Copy the **Internal Database URL** (used by the API service in the same region).
3. Copy the **External Database URL** (used for migrations from your laptop).

### 1.2 Backend service (Render)
1. **New +** → **Web Service** → connect this repo, root directory `backend-slice`.
2. Build command:
   ```
   npm ci && npx prisma generate && npm run build
   ```
3. Start command: `node dist/index.js`
4. Environment:
   ```
   DATABASE_URL=<internal db url>
   JWT_SECRET=<openssl rand -hex 32>
   JWT_ACCESS_TTL_MIN=15
   JWT_REFRESH_TTL_DAYS=14
   PORT=4000
   NODE_ENV=production
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role>
   STORAGE_BUCKET=macro-attachments
   CORS_ORIGIN=https://pms.macro.org
   ```
5. **Health Check Path:** `/health`
6. Capture the **Deploy Hook URL** for `RENDER_DEPLOY_HOOK` secret.

### 1.3 Supabase Storage
1. New project → **Storage** → **Create bucket** `macro-attachments` (private).
2. Settings → **Service role key** → copy into `SUPABASE_SERVICE_ROLE_KEY`.
3. Storage policies: leave bucket private; the API issues short-lived signed URLs.

### 1.4 Frontend (Vercel)
1. **Add New Project** → import this repo, root directory `frontend`.
2. Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE=https://api.macro.org
   ```
3. **Project Settings → Git → Production Branch:** `main`.
4. From `vercel link` locally, copy `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` for GH secrets.
5. Custom domain `pms.macro.org` → CNAME to Vercel.

### 1.5 GitHub Secrets
In repo **Settings → Secrets and variables → Actions** add:

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK` | URL from §1.2-6 |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | from `vercel link` |
| `VERCEL_PROJECT_ID` | from `vercel link` |

---

## 2. First migration

From your laptop, with the **External** Postgres URL:

```bash
cd backend-slice
DATABASE_URL="postgresql://…@…render.com/macro_pms" npx prisma migrate deploy
DATABASE_URL="postgresql://…@…render.com/macro_pms" npx tsx prisma/seed.ts
```

This loads:
- Approval matrix
- Real users (replace seeds with the MACRO HR list before go-live)
- Sample DIP lines for IMPACT-KP

---

## 3. Branching + deploy flow

```
feature/* ──▶ develop ──▶ main
             (preview)    (production)
```

- Pushes to `develop` → Vercel preview + Render preview env (optional).
- PR merged into `main` → CI runs → on success the **Deploy** workflow:
  1. Hits Render deploy hook (zero-downtime rolling restart).
  2. Triggers Vercel `--prod` deploy.

If a deploy fails, Render and Vercel both roll back to previous revision automatically; no manual action needed.

---

## 4. Rollback

| Service | How |
|---|---|
| Backend | Render dashboard → Service → **Deploys** → pick previous → **Redeploy**. |
| Frontend | Vercel → **Deployments** → previous → **Promote to Production**. |
| Database | `pg_restore` from latest nightly dump (§5). |

---

## 5. Backups + DR

- **Postgres:** Render Postgres takes daily snapshots automatically (retention 7 days on starter, 30 on standard). Schedule `pg_dump` to S3 weekly via a Render cron job for off-platform copy.
- **Storage:** Supabase replicates within the region. Mirror to a private S3 bucket weekly using `rclone` if compliance demands.
- **Restore drill:** quarterly. Restore to a staging instance, run `__tests__/ar.test.ts` against it, confirm audit-chain hash continuity.

---

## 6. Monitoring + observability

| Concern | Tool |
|---|---|
| Uptime | UptimeRobot ping `/health` every 1 min |
| Error tracking | Sentry (DSN in both backend + frontend env) |
| Logs | Render log drain → Logtail or Datadog |
| DB perf | Render dashboard + `pg_stat_statements` |
| Security | Render TLS auto-renew · HSTS via Next.js headers |

---

## 7. Secrets rotation

- `JWT_SECRET` rotated every 90 days. Rolling rotation: deploy with `JWT_SECRET_PREVIOUS` accepting old tokens for 24h, then drop.
- `SUPABASE_SERVICE_ROLE_KEY` rotated on personnel changes.
- Database password rotated with Render's "Regenerate Credentials" button + 1-line env update.
