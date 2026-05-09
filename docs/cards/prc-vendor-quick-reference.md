# Procurement + Vendor · Quick Reference (v4.1)

## Procurement Officer — pipeline

```
DRAFT → PR_SUBMITTED → RFQ_OPEN → RFQ_EVALUATED → LPO_ISSUED → GRN_RECEIVED → CLOSED
```

| Stage | What you do |
|---|---|
| PR_SUBMITTED | Validate need + budget; open RFQ |
| RFQ_OPEN | Set deadline; vendors quote |
| RFQ_EVALUATED | Pick winner, document scoring |
| LPO_ISSUED | Generate LPO ref, send to vendor |
| GRN_RECEIVED | Goods/service received; record GRN ref + date |
| CLOSED | Match LPO+GRN to incoming PV |

## Vendor master
- Add new vendors with TIN + bank details + WTEC expiry.
- Set ceiling per the procurement policy.
- WTEC < 30 days from expiry → AMBER badge; expired → blocks new PVs.

## Vendor portal — what your supplier sees
- Their own invoices only (other vendors invisible).
- Status of each: SCHEDULED / PAID / RETURNED.
- Can attach tax invoices and supporting docs.
- Cannot edit anything else.

## Common returns
| Reason | Fix |
|---|---|
| GRN missing | Record date + ref before issuing PV |
| LPO over ceiling | Split into 2 LPOs or revise ceiling via Admin |
| Vendor WTEC expired | Renew before LPO_ISSUED |

## Lead times to remember
- RFQ open ≥ 7 working days for goods, 14 for services.
- LPO issued within 3 days of evaluation sign-off.
- GRN within 24 hours of receipt.
