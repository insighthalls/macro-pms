# MACRO PMS · Sample requests

Base URL: `https://api.macro-pms.org/v1`. All requests except `/auth/*` require `Authorization: Bearer <jwt>`.

---

## Auth

### Login

```bash
curl -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"t.phiri@macro.org","password":"…"}'
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs…",
  "refreshToken": "rt_01HXY…",
  "user": {
    "id": "U-PO",
    "fullName": "Tendai Phiri",
    "role": "PROJECT_OFFICER",
    "projects": ["IMP"],
    "region": "KP"
  }
}
```

### Refresh

```bash
curl -X POST $BASE/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"rt_01HXY…"}'
```

---

## Activity → AR → Disburse → Liquidate (full happy path)

### 1. Create activity (PO)

```bash
curl -X POST $BASE/activities \
  -H "Authorization: Bearer $TOKEN_PO" \
  -H 'Content-Type: application/json' \
  -d '{
    "projId": "IMP",
    "dipCode": "DIP-2.4.2",
    "title": "Karonga sample-transport refresher",
    "budgetAmount": 218000000,
    "startDate": "2026-05-26",
    "dueLiqDate": "2026-06-09"
  }'
```

→ `201 { "id": "ACT-2026-0151", "stage": "CONCEPT", … }`

### 2. Submit AR (PO)

```bash
curl -X POST $BASE/advance-requests \
  -H "Authorization: Bearer $TOKEN_PO" \
  -H 'Content-Type: application/json' \
  -d '{
    "activityId": "ACT-2026-0151",
    "amount": 218000000,
    "title": "Karonga sample-transport refresher"
  }'
```

→ `201 { "id": "AR-2026-0182", "stage": "PO_SUBMITTED", "nextApproverRole": "HEAD_OF_PROGRAMS" }`

### 3. HOP recommend

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/recommend \
  -H "Authorization: Bearer $TOKEN_HOP" \
  -H 'Content-Type: application/json' \
  -d '{"note": "Aligned with Q3 work plan"}'
```

→ `200 { "stage": "HOP_RECOMMENDED" }`

### 4. FM approve

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/fm-approve \
  -H "Authorization: Bearer $TOKEN_FM"
```

→ `200 { "stage": "FM_APPROVED", "needsEdApproval": true }`

### 5. ED approve

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/ed-approve \
  -H "Authorization: Bearer $TOKEN_ED"
```

→ `200 { "stage": "ED_APPROVED" }`

### 6. GFO disburse

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/disburse \
  -H "Authorization: Bearer $TOKEN_GFO" \
  -H 'Content-Type: application/json' \
  -d '{"eftRef":"EFT-2026-0033","disbursedOn":"2026-05-12"}'
```

→ `200 { "stage": "DISBURSED" }`

### 7. PO submit liquidation

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/submit-liquidation \
  -H "Authorization: Bearer $TOKEN_PO" \
  -H 'Content-Type: application/json' \
  -d '{
    "spentAmount": 211400000,
    "varianceNote": "Fuel below estimate",
    "attachments": ["att_01HZ…","att_01HZ…"]
  }'
```

→ `200 { "stage": "LIQUIDATION_PENDING" }`

### 8. FM accept liquidation

```bash
curl -X POST $BASE/advance-requests/AR-2026-0182/accept-liquidation \
  -H "Authorization: Bearer $TOKEN_FM"
```

→ `200 { "stage": "LIQUIDATED" }`

---

## Voucher (procurement, three-way match)

### Submit invoice from vendor portal

```bash
curl -X POST $BASE/vendor-portal/invoices \
  -H "Authorization: Bearer $TOKEN_VND" \
  -H 'Content-Type: application/json' \
  -d '{
    "lpoId": "LPO-2026-0021",
    "invoiceNumber": "SS-INV-04812",
    "issueDate": "2026-05-08",
    "lines": [
      {"description":"Job aids · 2,000 sets","qty":2000,"unitPrice":12000,"vatable":true}
    ]
  }'
```

→ `201 { "pvId": "PV-2026-1249", "stage": "PO_SUBMITTED" }`

### GFO review (after three-way match passes)

```bash
curl -X POST $BASE/payment-vouchers/PV-2026-1249/gfo-review \
  -H "Authorization: Bearer $TOKEN_GFO" \
  -H 'Content-Type: application/json' \
  -d '{"matched":true,"witholding":{"rate":0.10,"amount":2400000}}'
```

→ `200 { "stage": "GFO_REVIEWED" }`

### FM approve & GFO post

```bash
curl -X POST $BASE/payment-vouchers/PV-2026-1249/fm-approve \
  -H "Authorization: Bearer $TOKEN_FM"

curl -X POST $BASE/payment-vouchers/PV-2026-1249/post \
  -H "Authorization: Bearer $TOKEN_GFO"
```

---

## Procurement requisition (PR → RFQ → LPO → GRN)

```bash
# 1. PO raises PR
curl -X POST $BASE/procurement-requisitions \
  -H "Authorization: Bearer $TOKEN_PO" -H 'Content-Type: application/json' \
  -d '{"projId":"IMP","dipCode":"DIP-4.1.1","description":"Workshop venue & catering","amount":300000000}'

# 2. HOP approves
curl -X POST $BASE/procurement-requisitions/PR-2026-0050/hop-approve \
  -H "Authorization: Bearer $TOKEN_HOP"

# 3. PRC issues RFQ to 4 vendors
curl -X POST $BASE/procurement-requisitions/PR-2026-0050/issue-rfq \
  -H "Authorization: Bearer $TOKEN_PRC" -H 'Content-Type: application/json' \
  -d '{"vendorIds":["V-003","V-006","V-009","V-012"],"closesOn":"2026-05-15"}'

# 4. PRC enters quotes
curl -X POST $BASE/procurement-requisitions/PR-2026-0050/quotes \
  -H "Authorization: Bearer $TOKEN_PRC" -H 'Content-Type: application/json' \
  -d '{"quotes":[
    {"vendorId":"V-003","amount":288000000,"deliveryDays":3},
    {"vendorId":"V-006","amount":312000000,"deliveryDays":2},
    {"vendorId":"V-009","amount":297000000,"deliveryDays":4}
  ]}'

# 5. Evaluate & award
curl -X POST $BASE/procurement-requisitions/PR-2026-0050/evaluate \
  -H "Authorization: Bearer $TOKEN_PRC" -H 'Content-Type: application/json' \
  -d '{"awardVendorId":"V-003","scores":{"price":0.4,"quality":0.35,"delivery":0.25}}'

# 6. Issue LPO
curl -X POST $BASE/procurement-requisitions/PR-2026-0050/issue-lpo \
  -H "Authorization: Bearer $TOKEN_PRC"

# 7. GRN on receipt
curl -X POST $BASE/grns \
  -H "Authorization: Bearer $TOKEN_PRC" -H 'Content-Type: application/json' \
  -d '{"lpoId":"LPO-2026-0050","receivedOn":"2026-05-22","items":[
    {"description":"Venue 3 days · 60 pax","qty":1,"unitPrice":288000000}
  ]}'
```

---

## EFT batch

```bash
curl -X POST $BASE/eft-batches \
  -H "Authorization: Bearer $TOKEN_GFO" -H 'Content-Type: application/json' \
  -d '{"voucherIds":["PV-2026-1240","PV-2026-1241","PV-2026-1242"]}'
# → { "id":"EFT-2026-0034", "totalAmount":494000000, "stage":"DRAFT" }

curl -X POST $BASE/eft-batches/EFT-2026-0034/lock \
  -H "Authorization: Bearer $TOKEN_GFO"
# → { "stage":"LOCKED", "iso20022Url":"/eft-batches/EFT-2026-0034/pacs008.xml" }

curl -X POST $BASE/eft-batches/EFT-2026-0034/release \
  -H "Authorization: Bearer $TOKEN_FM"
# → { "stage":"RELEASED" }
```

---

## Budget revision

```bash
curl -X POST $BASE/budget-revisions \
  -H "Authorization: Bearer $TOKEN_FM" -H 'Content-Type: application/json' \
  -d '{
    "projId":"IMP",
    "lines":[
      {"dipCode":"DIP-2.4.1","delta": -120000000},
      {"dipCode":"DIP-2.4.2","delta": +120000000}
    ],
    "rationale":"Reallocate from over-spent peer-led line to index-testing",
    "donorAuthDocId":"doc_01HZ…"
  }'
# → { "id":"BR-2026-0007", "stage":"FM_SUBMITTED" }

curl -X POST $BASE/budget-revisions/BR-2026-0007/ed-approve \
  -H "Authorization: Bearer $TOKEN_ED"
# → { "stage":"APPLIED", "appliedAt":"2026-05-08T16:42:00+02:00" }
```

---

## Reports

```bash
# Burn-down for IMPACT KP
curl "$BASE/reports/burn-down?projId=IMP&monthly=true" \
  -H "Authorization: Bearer $TOKEN_FM"

# Donor report (quarter)
curl "$BASE/reports/donor?projId=IMP&periodStart=2026-01-01&periodEnd=2026-03-31&template=PEPFAR" \
  -H "Authorization: Bearer $TOKEN_GFO"
# → returns PDF URL

# SAGE GL export
curl "$BASE/reports/sage-export?periodStart=2026-04-01&periodEnd=2026-04-30" \
  -H "Authorization: Bearer $TOKEN_GFO"
# → returns CSV URL
```

---

## Error responses

All errors return:

```json
{ "error": "<code>", "message": "<human readable>", "details": {…} }
```

Common codes:
- `unauthenticated` (401)
- `forbidden` (403)
- `not_found` (404)
- `invalid_transition` (409, `from`/`to`/`allowed`)
- `validation_failed` (422, `fields`)
- `rule_violation` (422, `rule` — e.g. `outstanding_advance_block`, `dip_overdraft_no_justification`)
- `rate_limited` (429)
