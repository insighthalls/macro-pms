# MACRO PMS · Authentication & Authorization

## Auth model

- **Login** — POST `/auth/login` with `{ email, password }` → returns `{ accessToken, refreshToken, user }`.
- **Access token** — JWT, HS256, 30 min TTL. Header `Authorization: Bearer <token>`.
- **Refresh token** — opaque random 64-byte, 7 day TTL, stored hashed in `refresh_tokens` table; rotated on every use.
- **MFA (Phase 2)** — TOTP via `/auth/mfa/verify`. Required for FM and above.
- **SSO** — Microsoft 365 OIDC at `/auth/sso/microsoft/callback`. Maps `oid` claim to `users.id`.
- **Password storage** — argon2id (m=64MB, t=3, p=4). Min 12 chars, NIST SP 800-63B rules.

## JWT claims

```json
{
  "sub": "U-PO",
  "name": "Tendai Phiri",
  "role": "PROJECT_OFFICER",
  "projects": ["IMP"],
  "region": "KP",
  "iat": 1715155200,
  "exp": 1715157000,
  "jti": "01HXYZ..."
}
```

`projects` is the project access set (from `user_project_access`). Server validates every request against this list — a PO with `projects: ["IMP"]` cannot read LRR data even if they craft the URL.

## Roles

| Code | Name | Description |
|---|---|---|
| `PROJECT_OFFICER` | Project Officer | Submits ARs, PVs, activities; field execution |
| `HEAD_OF_PROGRAMS` | Head of Programs | Recommends ARs, PRs |
| `GRANT_FINANCE_OFFICER` | Grant Finance Officer | Reviews PVs, EFT batching, disbursement |
| `FINANCE_MANAGER` | Finance Manager | Approves AR/PV, budget revisions |
| `EXECUTIVE_DIRECTOR` | Executive Director | Final approver above thresholds |
| `PROCUREMENT_OFFICER` | Procurement Officer | RFQ, evaluation, LPO, GRN |
| `ADMINISTRATOR` | Administrator / M&E | User mgmt, audit, system config |
| `VENDOR` | Vendor | Self-service portal (own invoices only) |

## RBAC matrix (endpoint × role)

`✓` = allowed  ·  `S` = self-only (own records)  ·  `P` = project-scoped only  ·  blank = denied

| Endpoint | PO | HOP | GFO | FM | ED | PRC | ADM | VND |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `GET  /projects` | P | P | ✓ | ✓ | ✓ | ✓ | ✓ |  |
| `GET  /dip-lines` | P | P | ✓ | ✓ | ✓ | P | ✓ |  |
| `POST /activities` | ✓ |  |  |  |  |  | ✓ |  |
| `GET  /activities` | S | P | ✓ | ✓ | ✓ | P | ✓ |  |
| `POST /advance-requests` | ✓ |  |  |  |  |  | ✓ |  |
| `GET  /advance-requests` | S | P | ✓ | ✓ | ✓ |  | ✓ |  |
| `POST /advance-requests/:id/recommend` |  | ✓ |  |  |  |  |  |  |
| `POST /advance-requests/:id/fm-approve` |  |  |  | ✓ |  |  |  |  |
| `POST /advance-requests/:id/ed-approve` |  |  |  |  | ✓ |  |  |  |
| `POST /advance-requests/:id/disburse` |  |  | ✓ |  |  |  |  |  |
| `POST /advance-requests/:id/return` |  | ✓ | ✓ | ✓ | ✓ |  |  |  |
| `POST /payment-vouchers` | ✓ |  | ✓ |  |  |  | ✓ |  |
| `GET  /payment-vouchers` | S | P | ✓ | ✓ | ✓ |  | ✓ | S |
| `POST /payment-vouchers/:id/gfo-review` |  |  | ✓ |  |  |  |  |  |
| `POST /payment-vouchers/:id/fm-approve` |  |  |  | ✓ |  |  |  |  |
| `POST /payment-vouchers/:id/ed-approve` |  |  |  |  | ✓ |  |  |  |
| `POST /payment-vouchers/:id/post` |  |  | ✓ |  |  |  |  |  |
| `POST /eft-batches` |  |  | ✓ |  |  |  |  |  |
| `POST /eft-batches/:id/release` |  |  |  | ✓ |  |  |  |  |
| `POST /procurement-requisitions` | ✓ |  |  |  |  | ✓ | ✓ |  |
| `POST /procurement-requisitions/:id/hop-approve` |  | ✓ |  |  |  |  |  |  |
| `POST /procurement-requisitions/:id/issue-rfq` |  |  |  |  |  | ✓ |  |  |
| `POST /procurement-requisitions/:id/evaluate` |  |  |  |  |  | ✓ |  |  |
| `POST /procurement-requisitions/:id/issue-lpo` |  |  |  |  |  | ✓ |  |  |
| `POST /grns` |  |  |  |  |  | ✓ | ✓ |  |
| `POST /vendors` |  |  |  |  |  | ✓ | ✓ |  |
| `GET  /vendors` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | S |
| `GET  /action-points` | S | P | P | ✓ | ✓ | P | ✓ |  |
| `POST /action-points/:id/resolve` | S | S | S | S | S | S | ✓ |  |
| `POST /budget-revisions` |  |  |  | ✓ |  |  |  |  |
| `POST /budget-revisions/:id/ed-approve` |  |  |  |  | ✓ |  |  |  |
| `GET  /audit-log` |  |  |  | ✓ | ✓ |  | ✓ |  |
| `GET  /reports/burn-down` |  | ✓ | ✓ | ✓ | ✓ |  | ✓ |  |
| `GET  /reports/donor` |  |  | ✓ | ✓ | ✓ |  | ✓ |  |
| `POST /admin/users` |  |  |  |  |  |  | ✓ |  |
| `POST /admin/approval-matrix` |  |  |  |  |  |  | ✓ |  |
| `POST /admin/feature-flags` |  |  |  |  |  |  | ✓ |  |
| `POST /vendor-portal/invoices` |  |  |  |  |  |  |  | ✓ |
| `GET  /vendor-portal/payments` |  |  |  |  |  |  |  | S |

## Project scope enforcement

Any request that returns or mutates a record tied to a project MUST verify `record.proj_id ∈ user.projects`. Implement as a middleware:

```ts
function requireProjectAccess(getProj: (req) => string) {
  return (req, res, next) => {
    const proj = getProj(req);
    if (!req.user.projects.includes(proj)) return res.status(403).json({error:'project access denied'});
    next();
  };
}
```

ED, FM, GFO, ADM have all projects. PO, HOP, PRC are scoped.

## Audit

Every state-changing endpoint MUST emit an `audit_log` row in the same DB transaction as the mutation. Log fields:

```
at, who (user_id), entity (AR|PV|PR|AP|...), entity_id,
action (submit|recommend|fm-approve|...), note, prev_hash, hash
```

`hash = sha256(prev_hash || at || who || entity || entity_id || action || note)`. The chain is verified by `/admin/audit/verify`.

## Rate limits

- `/auth/login` — 5 attempts / 15 min / IP
- `/auth/mfa/verify` — 10 / 15 min / user
- All other endpoints — 600 / min / user

## Session management

- Logout: POST `/auth/logout` deletes the refresh token.
- Force-logout-all: ADM endpoint POST `/admin/users/:id/revoke-sessions`.
- Idle timeout: client-side, 30 min.
