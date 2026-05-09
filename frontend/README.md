# MACRO PMS · Frontend (Next.js 15)

Refactor port of the HTML prototype into a typed, componentised Next.js app.
Visual parity with the prototype: brand `#1F4E79`, Plus Jakarta Sans, JetBrains Mono for codes/amounts, MWK whole-kwacha formatting, DIP-X.Y.Z chips.

---

## Stack

| Layer    | Choice                                       |
|----------|----------------------------------------------|
| Framework| Next.js 15 (App Router) + React 19           |
| Language | TypeScript (strict)                          |
| Styling  | Tailwind CSS + design tokens (`tailwind.config.ts`) |
| Data     | TanStack React Query                         |
| State    | Zustand (auth + toast)                       |
| Auth     | **Today:** backend-slice `/v1/auth/login` (JWT). **Cutover target:** Supabase Auth (Session 5). |
| Storage  | Supabase Storage (receipts, scans) — Session 5 |
| Hosting  | Vercel (frontend) + Supabase (DB + auth + files) + Render (Express API) |

---

## Layout

```
frontend/
├─ app/
│  ├─ layout.tsx          root + providers + Toaster
│  ├─ page.tsx            redirects to role home or /login
│  ├─ globals.css         Tailwind + Google Fonts
│  ├─ login/page.tsx      sign-in
│  └─ (app)/              authenticated shell (sidebar + topbar)
│     ├─ layout.tsx       AuthGate + Sidebar
│     └─ po/              Project Officer workspace
│        ├─ page.tsx                       My Day
│        ├─ advance-requests/page.tsx      AR list
│        ├─ advance-requests/new/page.tsx  AR create
│        └─ advance-requests/[id]/page.tsx AR detail + liquidation
├─ components/    Sidebar, Topbar, Card, Button, DataTable, StageBadge,
│                 DipChip, Money, AuthGate, QueryProvider, Toast
├─ lib/           api.ts, auth-store.ts, queries.ts, types.ts,
│                 format.ts, stages.ts, supabase.ts
├─ tailwind.config.ts
├─ next.config.mjs   /api/* → BACKEND_URL/v1/*
├─ vercel.json
└─ .env.example
```

---

## Run locally

```bash
# 1. Backend (in repo root)
cd backend-slice
docker compose up -d db
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                       # → http://localhost:4000

# 2. Frontend
cd frontend
cp .env.example .env.local        # adjust if needed
npm install
npm run dev                       # → http://localhost:3000
```

Sign in with seeded credentials: `t.phiri@macro.org` / `Password123!`.

---

## Deploy

### Vercel (frontend)
1. Push repo to GitHub.
2. Import the `frontend/` directory as a Vercel project.
3. Set env vars:
   - `BACKEND_URL` → your Render API URL
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. The `/api/*` rewrite proxies to `BACKEND_URL/v1/*`.

### Supabase (DB + future auth)
1. Create a Supabase project.
2. Connect Prisma to `DATABASE_URL` from Settings → Database (use the **Pooler** connection string for serverless).
3. `npx prisma migrate deploy` against Supabase.
4. (Session 5) Enable Supabase Auth, add Microsoft SSO provider, swap login flow.

### Render (Express API)
1. New Web Service from `backend-slice/`.
2. Build: `npm install && npm run build`.
3. Start: `npm start`.
4. Env: `DATABASE_URL` (Supabase pooler), `JWT_SECRET`.

---

## Migration roadmap (per session)

| # | Goal                                                              | Status |
|---|-------------------------------------------------------------------|--------|
| 1 | Scaffold + design tokens + PO workspace (My Day + AR module)      | ✅ done |
| 2 | Backend modules: Payment Vouchers, Procurement, Action Points     | next   |
| 3 | Frontend: GFO + FM + ED workspaces                                 | —      |
| 4 | Frontend: PRC + ADM + Vendor portal                                | —      |
| 5 | Polish: Supabase Auth cutover, file uploads, Realtime notifications, PDF voucher bundle, Reports | — |
| 6 | CI/CD, monitoring, env hardening                                   | —      |

---

## Conventions

- **Money** is always `bigint` over the wire (`amount: "1850000"`). Never use floats. The `<Money>` component handles formatting.
- **DIP codes** render via `<DipChip code="DIP-2.4.1" watch="GREEN|AMBER|RED" />` — never plain text.
- **Stages** render via `<StageBadge stage={ar.stage} />`. Order + colours live in `lib/stages.ts`.
- **Errors** thrown from `lib/api.ts` carry `code` + `details`. Match on `code` for guard-rule UX (e.g. `outstanding_advance_block`, `dip_overdraft_no_justification`).
- **Auth**: every page in `(app)/` is gated by `<AuthGate>`. 401 from any fetch clears auth + bounces to `/login`.
- **No localStorage business state.** Every read/write goes through React Query → fetch → Express → Postgres. Auth tokens are the only persisted client state.
