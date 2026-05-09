# MACRO PMS — User Acceptance Test (UAT) Plan

> **Goal:** confirm the production system implements every clause of MACRO Finance Manual v4.1
> with the right people, the right thresholds, and the right paper trail before go-live.

---

## 1. Scope

| In scope | Out of scope (Phase 2) |
|---|---|
| Advance Requests · Liquidations | Asset register |
| Payment Vouchers (incl. EFT batches) | Petty cash module |
| Procurement (PR → RFQ → LPO → GRN) | Donor reconciliation auto-import |
| Action Points | Mobile native app |
| Reports (burn-down, ageing, vendor, donor) | Multi-currency revaluation |
| Notifications + SLA escalation | |

---

## 2. Roles & test users

Eight personas — one tester each minimum, two preferred:

| Role | Tester | Backup |
|---|---|---|
| Project Officer | __________________ | __________________ |
| Head of Programs | __________________ | __________________ |
| Grant Finance Officer | __________________ | __________________ |
| Finance Manager | __________________ | __________________ |
| Executive Director | __________________ | __________________ |
| Procurement Officer | __________________ | __________________ |
| Administrator | __________________ | __________________ |
| Vendor (external) | __________________ | __________________ |

---

## 3. Environments

- **UAT URL:** https://uat-pms.macro.org
- **Reset:** UAT DB is wiped + reseeded every Monday 06:00.
- Each tester gets unique credentials emailed at kickoff.

---

## 4. Test scripts

Each script ends with **PASS / FAIL / N-A** and notes. Testers record evidence (screenshot or audit-log row id).

### TS-01 · Advance Request happy path (PO → HoP → FM → ED → GFO)

| Step | Actor | Action | Expected | Pass/Fail |
|---|---|---|---|---|
| 1 | PO | Create AR for IMPACT-KP, MWK 850,000, attach concept note | AR appears DRAFT, attachment visible |  |
| 2 | PO | Submit | Stage = PO_SUBMITTED, HoP gets notification within 5 s |  |
| 3 | HoP | Recommend | Stage = HOP_RECOMMENDED, FM gets notification |  |
| 4 | FM | Approve | Stage = FM_APPROVED, ED gets notification (rule: >500k) |  |
| 5 | ED | Approve | Stage = ED_APPROVED, GFO gets notification |  |
| 6 | GFO | Disburse with EFT-2026-0411 | Stage = DISBURSED, DIP committed amount drops, spent rises |  |
| 7 | PO | Liquidate spent 820k + variance note | Stage = LIQUIDATED, balance returned to DIP |  |
| 8 | All | Open audit log | Hash chain unbroken; one row per transition |  |

### TS-02 · Return-for-revision

| Step | Actor | Action | Expected |
|---|---|---|---|
| 1 | FM | Return AR with reason | Stage = RETURNED, returnReason persisted, PO notified |
| 2 | PO | Edit and resubmit | Stage = PO_SUBMITTED again, HoP queue refreshed |

### TS-03 · Threshold escalation

Create AR for MWK 250,000 (below ED threshold).
- Expected: after FM approval, stage jumps **directly to ED_APPROVED equivalent** without ED touch (or stops at FM_APPROVED ready for GFO — whichever the matrix says).
- Verify approval matrix row used appears in audit `note`.

### TS-04 · Outstanding-advance block (Manual Rule 50)

1. PO has one DISBURSED AR not yet liquidated.
2. PO tries to submit a new AR for the same activity.
3. Expected: 422 with message "Outstanding advance ARxxxx must be liquidated first."

### TS-05 · Payment Voucher with three-way match

1. PRC closes PR-2026-0042 with LPO-… and GRN-…
2. PO raises PV linked to the LPO+GRN.
3. PV requires `threeWayMatchOk = true` to pass GFO_REVIEWED.
4. GFO reviews → FM approves → ED approves (if >threshold) → GFO schedules.

### TS-06 · EFT batch end-to-end

1. GFO selects 3 SCHEDULED PVs → **Create batch**.
2. FM **Lock**.
3. FM **Export pacs.008** → file downloads, opens as valid XML.
4. GFO **Post ACK** → all 3 PVs flip to PAID, EFT ref stamped.
5. Audit shows `EFT-…` rows for create/lock/export/ack.

### TS-07 · Procurement pipeline

PR DRAFT → submit → RFQ open (deadline) → record evaluation → issue LPO → record GRN → close.
Verify each transition writes an audit row and updates PR.stage.

### TS-08 · Action Points

1. FM raises an AP on PO with 7-day due date.
2. PO sees AP in **Action Points**, marks **In progress**, then **Close** with note.
3. FM **Reopens** with reason → stage = REOPENED.

### TS-09 · Vendor portal

1. Vendor logs in.
2. Sees only their own invoices (zero leakage of other vendors').
3. PV statuses match what GFO sees.

### TS-10 · WTEC + ceiling guards

1. Mark vendor WTEC expired in Admin.
2. PO tries to attach this vendor to a new PV.
3. Expected: warning banner + cannot submit until WTEC renewed.
4. Likewise: vendor at 95 % of ceiling — soft warning. At 100 %: hard block.

### TS-11 · Reports

1. Open **Reports**.
2. Burn-down, variance, ageing, vendor scorecards, donor pack all populate within 3 s.
3. Numbers tie to manual SQL spot-check on `ar`, `pv`, `dip_lines` tables.

### TS-12 · Project picker

User with access to two projects switches via topbar; lists, KPIs, reports refresh.

### TS-13 · Attachments

1. Attach a 4 MB PDF to an AR.
2. File uploads via signed URL, registers, downloads with correct filename.
3. Delete → file gone from Supabase bucket.

### TS-14 · Notifications

1. Open the bell — items match the role's queue.
2. Trigger a return on another window → bell badge increments live (SSE).
3. Mark all read → counts go to 0; reload preserves state.

### TS-15 · Auth + session

1. Wrong password → "Invalid credentials" (no enumeration).
2. Idle 16 min → access token rejected → silent refresh OK.
3. Refresh token revoked from Admin → next request kicks to login.

### TS-16 · Audit chain integrity

`SELECT * FROM audit_log ORDER BY id;` then run the verifier:

```bash
npx tsx backend-slice/scripts/verify-audit.ts
```

Must return "OK · N rows, chain intact".

---

## 5. Defect tracking

- Logged in **GitHub Issues** with label `uat`.
- Severity: `S1 blocker` / `S2 major` / `S3 minor` / `S4 cosmetic`.
- Exit criteria for go-live: zero S1, zero S2, S3 ≤ 5 with workarounds documented.

---

## 6. Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| ED | | | |
| FM | | | |
| HoP | | | |
| Admin | | | |
| Internal Audit | | | |
