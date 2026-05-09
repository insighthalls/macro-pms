# Approvers (HoP / FM / ED) · Quick Reference (v4.1)

## Your one queue
**Approval Queue** is the only place you need to check. Items are pre-filtered to what's waiting on you.

## Three actions, no fourth
| Action | Use when |
|---|---|
| **Approve** | All checks pass, threshold matches your level |
| **Return with reason** | Anything wrong — describe what to fix |
| **Reject** | Out-of-policy and not fixable. Rare. |

> **Never** approve "with verbal note." If it isn't in the system, it didn't happen.

## Threshold ladder (Manual v4.1, Approval Matrix)

| Entity | Range (MWK) | Path |
|---|---|---|
| AR | ≤ 500 k | PO → HoP → FM → GFO |
| AR | > 500 k | PO → HoP → FM → ED → GFO |
| PV | ≤ 1 m | PO → GFO → FM → GFO |
| PV | > 1 m | PO → GFO → FM → ED → GFO |
| BR (any) | any | PM → FM → ED |

## Things to look for before pressing Approve
- DIP line balance covers it (chip turns AMBER/RED if not)
- Three-way match green (PV only)
- Vendor WTEC valid (PV + procurement)
- Outstanding advance not blocking (AR only)
- Activity end date hasn't passed

## EFT batches (FM only)
1. **Create** — GFO picks SCHEDULED PVs.
2. **Lock** (you) — totals frozen.
3. **Export pacs.008** (you) — bank file downloads.
4. **Upload** to bank portal.
5. **Post ACK** (GFO) — PVs flip to PAID.

## Audit
Every click writes one row. Internal audit can replay the whole hash chain. **Don't share login.**
