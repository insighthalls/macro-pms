# MACRO PMS — Training Pack

> A 2-day curriculum: Day 1 role workshops (4 × 90 min); Day 2 cross-role flow + open lab.
> All training uses the UAT environment so practice never touches production data.

---

## Day 1 · Role workshops

### 1. Project Officer (90 min)

**Outcomes — by end you can:**
- Create, submit, edit, resubmit an Advance Request.
- Liquidate with variance notes.
- Attach evidence (concept note, receipts).
- Read the My Day dashboard and act on returned items.

**Hands-on:**
1. Sign in with your training account.
2. Create AR-2026-T01 against your activity.
3. Attach a sample concept note (provided in the training pack).
4. Submit; watch it appear in HoP's queue (live demo).
5. After HoP returns it, fix the description and resubmit.
6. Liquidate AR-2026-D03 (already disbursed seed) — full liquidation.
7. Liquidate AR-2026-D04 with variance note — partial.

**Reference card:** [`docs/cards/po-quick-reference.md`](cards/po-quick-reference.md)

---

### 2. Approvers (HoP / FM / ED) (90 min)

**Outcomes:**
- Recognise the queue + the action panel for your role.
- Apply the Manual v4.1 thresholds correctly.
- Use **Return with reason** — the *only* way to send work back.
- Read the audit log and explain it to internal audit.

**Hands-on:**
1. Open your **Approval Queue**.
2. Approve AR-2026-T05 (under threshold).
3. Return AR-2026-T06 with reason "Budget line code wrong".
4. Approve PV-2026-T11 noting the three-way-match badge.
5. (FM only) Build an EFT batch with 3 SCHEDULED PVs, lock, export.

**Reference card:** [`docs/cards/approver-quick-reference.md`](cards/approver-quick-reference.md)

---

### 3. Grant Finance Officer (90 min)

**Outcomes:**
- Review PVs against rules: WTEC, ceilings, three-way match.
- Schedule a PV for an EFT batch.
- Post a bank ACK.
- Read the burn-down chart and explain variance to the PM.

**Hands-on:**
1. Review PV-2026-T20: confirm three-way match, ceiling, WTEC.
2. Move it FM_APPROVED → SCHEDULED.
3. Add it to today's EFT batch (alongside two others provided).
4. After FM exports, post the bank ACK file.
5. Open **Reports → Burn-down** and explain the December dip.

**Reference card:** [`docs/cards/gfo-quick-reference.md`](cards/gfo-quick-reference.md)

---

### 4. Procurement Officer + Vendor (90 min, joint)

**Procurement Officer outcomes:**
- Run a PR through PR_SUBMITTED → RFQ_OPEN → RFQ_EVALUATED → LPO → GRN → CLOSED.
- Maintain vendor master + WTEC expiry.

**Vendor outcomes:**
- Sign in.
- Read invoice status.
- Upload a tax invoice as an attachment.

**Hands-on:**
1. Procurement: take PR-2026-T30 from RFQ_OPEN to CLOSED.
2. Vendor: log into vendor portal, find PV-2026-T20, attach the tax invoice.
3. Confirm Procurement and GFO see the file in their views.

**Reference card:** [`docs/cards/prc-vendor-quick-reference.md`](cards/prc-vendor-quick-reference.md)

---

## Day 2 · Cross-role flow + open lab

### Morning: end-to-end role-play (3 hr)

In a single Zoom + screen-shared session, run this scenario:

1. **PO** raises AR-2026-DAY2 for MWK 1.2 m (above ED threshold).
2. **HoP** recommends.
3. **FM** approves.
4. **ED** approves.
5. **GFO** disburses with EFT ref.
6. **PO** raises PV-2026-DAY2 for MWK 600 k against an LPO+GRN already in the system.
7. **GFO** reviews; **FM** approves; **GFO** schedules.
8. **GFO** + **FM** build & lock today's EFT batch including this PV.
9. **FM** exports pacs.008.
10. **GFO** posts the ACK.
11. **PO** liquidates the original AR with the PV, note variance.
12. Everyone opens the audit log together — verify chain integrity.

### Afternoon: open lab (3 hr)

- 30 min refresher Q&A.
- 2 hr: trainees recreate one real piece of work each from last week, in UAT.
- 30 min retrospective: log every "I expected it to do X" — feeds into v4.2 backlog.

---

## Quick-reference cards

Each card is one A4 page. Keep at every desk on go-live.

- [`docs/cards/po-quick-reference.md`](cards/po-quick-reference.md)
- [`docs/cards/approver-quick-reference.md`](cards/approver-quick-reference.md)
- [`docs/cards/gfo-quick-reference.md`](cards/gfo-quick-reference.md)
- [`docs/cards/prc-vendor-quick-reference.md`](cards/prc-vendor-quick-reference.md)
- [`docs/cards/admin-quick-reference.md`](cards/admin-quick-reference.md)

---

## Logistics checklist

- [ ] UAT environment seeded with 12 training scenarios (`prisma/seed-training.ts`)
- [ ] Each trainee has unique account + assigned project access
- [ ] Trainer laptop + projector
- [ ] Printed quick-reference cards (1 per role, per trainee)
- [ ] Coffee + lunch (4 days ÷ 8 trainees: every minute eating is a minute not arguing about workflow)
- [ ] Recorded session uploaded to MACRO Drive afterwards

---

## Post-training

| Week | Action | Owner |
|---|---|---|
| W+1 | Daily 30-min huddle to triage UAT issues | FM |
| W+2 | Sign-off on UAT completion checklist | ED |
| W+3 | Cut-over weekend: import historical data, freeze old system | Admin + GFO |
| W+4 | Go-live; on-call rota for first 10 working days | Admin |
| W+8 | First retrospective; capture v4.2 backlog | All |
