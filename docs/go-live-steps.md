# MACRO PMS — Go-Live Steps
> Complete walkthrough from zero to production.  
> Estimated time: **2–3 hours** first time.  
> Platforms: GitHub · Supabase · Render · Vercel

---

## Before you start — what you'll need

- A free account on each of: [GitHub](https://github.com), [Supabase](https://supabase.com), [Render](https://render.com), [Vercel](https://vercel.com)
- Node 20 installed on your laptop (`node -v` to check)
- Git installed (`git --version` to check)
- The MACRO PMS folder open in a terminal

---

## Step 1 — Push the code to GitHub

Open a terminal in the root of the `MACRO PMS` folder and run these commands one at a time:

```bash
# 1. Initialise git (only needed if not already a repo)
git init
git add .
git commit -m "chore: initial commit"

# 2. Create the repo on GitHub:
#    Go to https://github.com/new
#    Name it: macro-pms
#    Visibility: Private
#    Do NOT tick "Add a README" — leave everything unchecked
#    Click "Create repository"

# 3. Connect and push (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/macro-pms.git
git branch -M main
git push -u origin main
```

**Check:** visit `https://github.com/YOUR-USERNAME/macro-pms` — you should see all the files.

---

## Step 2 — Supabase (file storage)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name: `macro-pms-prod` · Region: choose nearest to your users · set a strong database password (save it, you won't need it again but keep it safe)
3. Wait ~2 minutes for provisioning
4. In the left sidebar → **Storage** → **New bucket**
   - Name: `macro-attachments`
   - Toggle **Public bucket**: **OFF** (leave private — the API issues signed URLs)
   - Click **Create bucket**
5. Collect your keys — go to **Project Settings → API**:
   - Copy **Project URL** → this is your `SUPABASE_URL`
   - Copy **service_role** key (under "Project API keys", click the eye icon) → this is your `SUPABASE_SERVICE_ROLE_KEY`
   - Copy **anon** key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ Keep the service_role key secret — it bypasses Row Level Security. Only the backend ever sees it.

---

## Step 3 — Render (Postgres + API)

Render can read the `render.yaml` Blueprint file already in your repo to create everything automatically.

### 3a. Connect your repo as a Blueprint

1. Go to [render.com](https://render.com) → **New +** → **Blueprint**
2. Connect your GitHub account if not already done → select the `macro-pms` repo
3. Render will detect `render.yaml` and show you two resources:
   - `macro-pms-prod` (PostgreSQL)
   - `macro-pms-api` (Web Service)
4. Click **Apply** — Render will ask you to fill in the three `sync: false` secrets:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | The Project URL from Step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | The service_role key from Step 2 |
| `CORS_ORIGIN` | Your Vercel frontend URL (e.g. `https://macro-pms.vercel.app`) — you can update this after Step 4 |

5. Click **Create Resources** — both the database and the API service will be created. The first deploy will start building automatically (it will fail the health check until you run migrations in Step 5 — that's fine).

### 3b. Collect Render values

Once resources are created:

- Go to the `macro-pms-prod` database → copy the **External Database URL** (you'll need it for migrations in Step 5)
- Go to the `macro-pms-api` web service:
  - Copy the **service URL** (e.g. `https://macro-pms-api.onrender.com`) — this is your backend URL
  - Go to **Settings → Deploy Hook** → copy the Deploy Hook URL → save it as `RENDER_DEPLOY_HOOK` (you'll need it for GitHub Secrets in Step 6)

### 3c. Update CORS_ORIGIN after Vercel deploy

After Step 4 you'll have a real Vercel URL. Come back to Render → `macro-pms-api` → **Environment** → update `CORS_ORIGIN` to your actual Vercel production URL, then click **Save Changes** (triggers a redeploy).

---

## Step 4 — Vercel (frontend)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**
2. Select the `macro-pms` repo
3. Set **Root Directory**: `frontend`
4. Under **Environment Variables**, add these (all three are required for production):

| Variable | Value |
|----------|-------|
| `BACKEND_URL` | Your Render API URL from Step 3b, e.g. `https://macro-pms-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase Project URL from Step 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anon key from Step 2 |

5. Click **Deploy** — wait for the build to complete (~2 min)
6. Note your production URL, e.g. `https://macro-pms.vercel.app`

### 4a. Link the project for CI/CD

Run these commands on your laptop (you need the Vercel CLI):

```bash
npm i -g vercel
cd "MACRO PMS/frontend"
vercel link
# Follow the prompts — link to your existing project
```

After linking, run:

```bash
cat .vercel/project.json
```

You'll see `orgId` and `projectId` — save both for the next step.

---

## Step 5 — Run the database migrations

This is the one manual step that must be run from your laptop. Use the **External Database URL** you copied from Render in Step 3b.

```bash
cd "MACRO PMS/backend-slice"

# 1. Install dependencies (if you haven't already)
npm ci

# 2. Run all Prisma migrations
DATABASE_URL="postgresql://macro:<PASSWORD>@<HOST>.render.com/macro_pms" \
  npx prisma migrate deploy

# 3. Seed the database (approval matrix, users, sample DIP lines)
DATABASE_URL="postgresql://macro:<PASSWORD>@<HOST>.render.com/macro_pms" \
  npx tsx prisma/seed.ts
```

Replace the full connection string with your actual External Database URL from Render.

**Check:** The Render API service should now pass its `/health` check and show as **Live** in the dashboard.

> ⚠️ Before go-live: replace the seed users with real MACRO staff from your HR list. Re-run the seed or insert users directly using the Admin interface once you're live.

---

## Step 6 — GitHub Secrets (enables CI/CD auto-deploy)

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret** and add all four:

| Secret name | Where to get the value |
|-------------|----------------------|
| `RENDER_DEPLOY_HOOK` | Render → `macro-pms-api` → Settings → Deploy Hook URL |
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create token |
| `VERCEL_ORG_ID` | The `orgId` from `.vercel/project.json` (Step 4a) |
| `VERCEL_PROJECT_ID` | The `projectId` from `.vercel/project.json` (Step 4a) |

Once all four secrets are in place, every merge to `main` will automatically deploy both services.

---

## Step 7 — Go-live verification checklist

Run through these after everything is deployed:

- [ ] `https://<render-api-url>/health` returns `{"ok":true}`
- [ ] Frontend loads at your Vercel URL without a blank screen or console errors
- [ ] Login with an admin seed user works
- [ ] Create a test Advance Request — confirm it appears in the Finance Manager dashboard
- [ ] Upload an attachment — confirm the file appears in Supabase Storage
- [ ] Check Render logs (dashboard → `macro-pms-api` → Logs) — no crash errors
- [ ] Open GitHub → Actions tab → confirm the CI run on `main` is green

---

## Step 8 — Custom domain (optional)

### Backend (Render)
Render → `macro-pms-api` → **Settings → Custom Domains** → add `api.macro.org` → follow CNAME instructions from your DNS provider.

Then update `CORS_ORIGIN` on Render to `https://pms.macro.org` and update `BACKEND_URL` on Vercel to `https://api.macro.org`.

### Frontend (Vercel)
Vercel → Project → **Settings → Domains** → add `pms.macro.org` → follow the CNAME/A-record instructions.

---

## Quick reference — env vars at a glance

### Render (`macro-pms-api` environment)

| Variable | Set by |
|----------|--------|
| `DATABASE_URL` | Auto-wired from Render Postgres (Blueprint) |
| `JWT_SECRET` | Auto-generated by Render (Blueprint) |
| `JWT_ACCESS_TTL_MIN` | `15` (set in Blueprint) |
| `JWT_REFRESH_TTL_DAYS` | `14` (set in Blueprint) |
| `NODE_ENV` | `production` (set in Blueprint) |
| `PORT` | `4000` (set in Blueprint) |
| `STORAGE_BUCKET` | `macro-attachments` (set in Blueprint) |
| `SUPABASE_URL` | You enter during Blueprint setup |
| `SUPABASE_SERVICE_ROLE_KEY` | You enter during Blueprint setup |
| `CORS_ORIGIN` | You enter during Blueprint setup |

### Vercel (frontend environment)

| Variable | Value |
|----------|-------|
| `BACKEND_URL` | `https://<your-render-api>.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Project Settings |

---

## Troubleshooting

**Render deploy fails on `npm run build`**  
→ Check that `npx prisma generate` ran before `npm run build` in the build command — it's already set correctly in `render.yaml`.

**Frontend shows "Network Error" hitting the API**  
→ Confirm `BACKEND_URL` on Vercel matches your Render API URL exactly (no trailing slash). Also confirm `CORS_ORIGIN` on Render matches your Vercel URL exactly.

**Prisma migration fails with "relation does not exist"**  
→ You're probably running against the wrong database. Double-check the `DATABASE_URL` you're passing — use the External URL from Render, not the Internal one.

**Seed fails with "unique constraint" errors**  
→ The database already has data — migrations ran twice. Safe to ignore if the data looks correct, or reset with `npx prisma migrate reset` (⚠️ destroys all data — only do this before go-live).

**GitHub Actions deploy step is skipped**  
→ One of the four secrets (`RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) is missing or misspelled. Check the Actions log — it will say which one.
