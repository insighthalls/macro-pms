# Administrator · Quick Reference (v4.1)

## What lives here
- **Users** — onboard / offboard, reset passwords, set role + project access.
- **Vendors** — create, set ceiling + WTEC, deactivate.
- **Approval Matrix** — thresholds + escalation paths per entity.
- **Project Master** — projects, donors, DIP lines, period dates.

## Onboarding a new staff member
1. Add user · email + role · password emailed.
2. Grant project access (one or many).
3. Send the right quick-reference card.
4. They sign in once; you confirm in audit log.

## Offboarding
1. Set `active = false` on user.
2. Revoke all refresh tokens (one click).
3. Re-assign open Action Points to manager.
4. Verify audit log preserves their history (it always does).

## Approval matrix
Each row: `(entityKind, thresholdLow, thresholdHigh, route[])`.
**Never delete rows** — supersede by setting an end date. Audit history depends on stable rule ids.

## Backups
- Postgres: automatic daily; manual `pg_dump` weekly to S3.
- Storage: Supabase replicates within region; weekly mirror to S3.
- Restore drill: quarterly. Calendar-blocked.

## Security
- JWT secret rotated every 90 days.
- Service-role keys: 1Password vault `MACRO-PMS-Prod`.
- Penetration test: annual, before audit cycle.
- Data-protection: GDPR + Malawi DPA; PII in users + vendors only; encryption at rest via Postgres TDE.

## Escalation paths
- System down → Render incident dashboard → page on-call ext 1199.
- Data integrity question → run `npx tsx backend-slice/scripts/verify-audit.ts` first.
- Donor enquiry → Reports → Donor pack PDF.
