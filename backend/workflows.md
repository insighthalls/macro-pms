# MACRO PMS · Workflow state machines

All state-changing endpoints validate the transition against these tables. An invalid transition returns `409 Conflict` with `{ error: "invalid_transition", from, to, allowed }`.

---

## Advance Request (AR)

```
                ┌─────────┐
                │  DRAFT  │
                └────┬────┘
                     │ submit (PO)
                     ▼
              ┌─────────────┐    return    ┌──────────┐
              │PO_SUBMITTED │◀─────────────│ RETURNED │
              └──────┬──────┘              └──────────┘
                     │ recommend (HOP)
                     ▼
              ┌─────────────────┐
              │ HOP_RECOMMENDED │
              └────────┬────────┘
                       │ fm-approve (FM)
                       ▼
              ┌─────────────┐  reject  ┌──────────┐
              │ FM_APPROVED │─────────▶│ REJECTED │
              └──────┬──────┘          └──────────┘
                     │ ed-approve (ED, if amount > threshold)
                     ▼
              ┌─────────────┐
              │ ED_APPROVED │
              └──────┬──────┘
                     │ disburse (GFO)
                     ▼
              ┌───────────┐
              │ DISBURSED │
              └─────┬─────┘
                    │ submit-liquidation (PO)
                    ▼
              ┌─────────────────────┐
              │ LIQUIDATION_PENDING │
              └──────────┬──────────┘
                         │ accept (FM)
                         ▼
                   ┌────────────┐
                   │ LIQUIDATED │  (terminal)
                   └────────────┘
```

**Transition rules:**

| from | to | actor | guards |
|---|---|---|---|
| DRAFT | PO_SUBMITTED | PO | DIP balance ≥ amount, no overdraft without justification, no outstanding overdue advance for same officer (Rule 50) |
| PO_SUBMITTED | HOP_RECOMMENDED | HOP | activity has signed SOW |
| PO_SUBMITTED | RETURNED | HOP/FM/ED/GFO | reason required |
| HOP_RECOMMENDED | FM_APPROVED | FM | budget watch-list ≤ amber OR FM justification |
| FM_APPROVED | ED_APPROVED | ED | only if amount > approval-matrix threshold |
| FM_APPROVED | DISBURSED | GFO | only if amount ≤ ED threshold |
| ED_APPROVED | DISBURSED | GFO | EFT batch released |
| DISBURSED | LIQUIDATION_PENDING | PO | within due_liq_date, attachments complete |
| LIQUIDATION_PENDING | LIQUIDATED | FM | variance ≤ 5% OR justification |
| LIQUIDATION_PENDING | RETURNED | FM | for revision |
| any | REJECTED | FM/ED | reason required, terminal |
| RETURNED | PO_SUBMITTED | PO | re-submission with corrections |

---

## Payment Voucher (PV)

```
DRAFT → PO_SUBMITTED → GFO_REVIEWED → FM_APPROVED → ED_APPROVED → POSTED → PAID
                ↓                                                       ↓
            RETURNED ←────────────────────────────────────────────── REJECTED
```

| from | to | actor | guards |
|---|---|---|---|
| DRAFT | PO_SUBMITTED | PO/GFO | three-way match (LPO/GRN/Invoice) for procurement PVs, WTEC valid, TPIN present |
| PO_SUBMITTED | GFO_REVIEWED | GFO | invoice arithmetic verified, withholding rule applied |
| GFO_REVIEWED | FM_APPROVED | FM | DIP balance ≥ gross |
| FM_APPROVED | ED_APPROVED | ED | only if gross > threshold |
| FM_APPROVED | POSTED | GFO | journal generated |
| ED_APPROVED | POSTED | GFO | journal generated |
| POSTED | PAID | GFO | EFT batch released, vendor receipt logged |
| any non-terminal | RETURNED | reviewer | reason required |
| RETURNED | PO_SUBMITTED | PO/GFO | corrections applied |

**Three-way match:** `LPO.amount ≈ GRN.received_value ≈ Invoice.net` within 2% tolerance, else block transition.

**Withholding tax:** auto-applied per `vendors.tpin_status` and category; PO cannot override, only FM with justification.

---

## Procurement Requisition (PR)

```
DRAFT → SUBMITTED → HOP_APPROVED → RFQ_ISSUED → QUOTES_RECEIVED → EVALUATED → LPO_ISSUED → GRN_RECEIVED → CLOSED
              ↓
          REJECTED
```

| from | to | actor | guards |
|---|---|---|---|
| DRAFT | SUBMITTED | PO | DIP balance check |
| SUBMITTED | HOP_APPROVED | HOP | scope confirmation |
| HOP_APPROVED | RFQ_ISSUED | PRC | minimum 3 vendors invited |
| RFQ_ISSUED | QUOTES_RECEIVED | PRC | ≥ 3 quotes (or single-source justification) |
| QUOTES_RECEIVED | EVALUATED | PRC | scoring matrix complete |
| EVALUATED | LPO_ISSUED | PRC | vendor active, contract within ceiling |
| LPO_ISSUED | GRN_RECEIVED | PRC | goods receipt note signed |
| GRN_RECEIVED | CLOSED | PRC | matched PV posted |

---

## Action Point (AP)

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
   ↓                        ↑
   └─── ESCALATED ──────────┘   (auto if >7d overdue)
```

ESCALATED is a flag, not a state — the AP retains its underlying status but appears in FM/ED escalation queues.

---

## EFT Batch

```
DRAFT → LOCKED → RELEASED → SETTLED
   ↓
CANCELLED
```

| from | to | actor | guards |
|---|---|---|---|
| DRAFT | LOCKED | GFO | ≥ 1 voucher in batch, all vouchers POSTED |
| LOCKED | RELEASED | FM | dual control: GFO created, FM releases |
| RELEASED | SETTLED | GFO | bank confirmation file uploaded; sets included PVs to PAID |

---

## Budget Revision

```
DRAFT → FM_SUBMITTED → ED_APPROVED → APPLIED
              ↓
          REJECTED
```

| from | to | actor | guards |
|---|---|---|---|
| DRAFT | FM_SUBMITTED | FM | net-zero across DIP lines, donor-authorisation document attached |
| FM_SUBMITTED | ED_APPROVED | ED | — |
| ED_APPROVED | APPLIED | system | atomically updates dip_lines.budget_amount; emits audit chain |

---

## Approval matrix lookup

Stored in `approval_matrix`. The route is a JSON array of role codes:

```sql
SELECT route FROM approval_matrix
 WHERE entity_kind = $1
   AND $2 BETWEEN threshold_low AND COALESCE(threshold_high, 9223372036854775807)
 LIMIT 1;
```

When a record changes amount, the route is re-evaluated and the next-required role is set on `record.next_approver_role`.

---

## Notifications

State transitions emit notifications per this map (all delivered via `notifications` table + WebSocket fan-out + optional email):

| Transition | Notify |
|---|---|
| AR PO_SUBMITTED | HOP of project |
| AR HOP_RECOMMENDED | FM |
| AR FM_APPROVED (above threshold) | ED |
| AR ED_APPROVED | GFO |
| AR DISBURSED | originating PO |
| AR RETURNED | originating PO |
| AR liquidation 7d before due | originating PO |
| AR liquidation overdue | PO + FM |
| PV PO_SUBMITTED | GFO |
| PV GFO_REVIEWED | FM |
| PV FM_APPROVED (above threshold) | ED |
| PV PAID | originating PO + vendor |
| PR HOP_APPROVED | PRC |
| AP assigned | owner |
| AP overdue | owner + FM |
