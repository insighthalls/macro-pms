# Grant Finance Officer · Quick Reference (v4.1)

## Daily flow
1. **My Day** — incoming PVs, returned items, scheduled disbursements.
2. **Payment Vouchers** — review, return, schedule.
3. **EFT Batches** — build, post ACKs.
4. **Reports → Burn-down + ageing** — first thing on Monday.

## Reviewing a PV — the 5-point check
- [ ] Items in JSON match attached invoice
- [ ] LPO + GRN ids present (three-way match badge green)
- [ ] WTEC valid; vendor not over ceiling
- [ ] WHT calculated where due (line `whtAmount`)
- [ ] DIP line balance covers it

If any fail → **Return with reason**.

## EFT batch — your half
1. PVs reach SCHEDULED after FM approval.
2. **Create batch** with the day's SCHEDULED set.
3. (FM locks + exports.)
4. Take the bank's response file → **Post ACK**.
5. PVs flip to PAID; reconcile against the bank statement.

## Disbursement (AR)
After ED_APPROVED, click **Disburse**, paste EFT ref, save.
DIP committed amount drops by the AR amount; spent rises by it. Audit row written.

## Reports
- **Burn-down** — green is good; red bar means variance > 10 % vs plan.
- **AR ageing** — anything in 60+ bucket is your action item this week.
- **Vendor scorecards** — flag any vendor at >80 % ceiling to Procurement.

## Don'ts
- Don't backdate disbursements.
- Don't post ACK before bank confirms.
- Don't approve PVs that are missing attachments — return them.
