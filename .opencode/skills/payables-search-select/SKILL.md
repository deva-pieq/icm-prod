---
name: payables-search-select
description: >-
  Debug and fix Pending Payments (Payables) search/select failures after statement
  upload Completes. Use when edit-transaction or payment-module fails on
  searchByValue / isPayablesSearchSettled, mixed ACH+CHK batch, Customer UID not
  found while Status still shows Searching for, Agents filter Agent Level I/II
  missing on prod, or Create Payment after dual UID select. Complements
  excel-statement-extract-fix (extract) — this skill is post-Completed payables only.
---

# Payables Search & Select (Pending Payments)

## When to use

Statement upload already **Completed**, but tests fail on Payables:

| Signal | Meaning |
|---|---|
| `searchByValue` / `isPayablesSearchSettled` → false | Settle logic wrong or search not finished |
| Status `Searching for: AETNA-PAY-TEST-…` + ~1000 rows | Filter still applying **or** settle checked wrong DOM |
| `filter-agents-option-Agent Level I` not found | Preprod agent names — prod uses `test-DevaTest Agent` |
| Mixed ACH+CHK: 1st UID OK, 2nd UID timeout | Missing clear-search between UIDs, or CHK UID not on Policy |
| Extract green, Create Payment never reached | This skill — not Excel extract |

**Not this skill:** Stage `Extract Error` / 0 line items → use `excel-statement-extract-fix`.

## Proven live-UI facts (prod)

1. **Pending Payments** search filters the grid by Customer UID.
2. Matching value appears in the **Policy** column (exact string, e.g. `AETNA-PAY-TEST-ACH-026`).
3. Visible row also shows Txn ID, Paid To Agent (`test-DevaTest Agent`), Amount, Source Trace (`BT-… [MLB]PaymentModule…`).
4. Policy / Source Trace are often **outside** `.ag-center-cols-container` until scrolled — center-cols-only checks **false-fail**.
5. After statement **Completed**, open Payables → optional grid **Refresh** → search → wait for Policy cell → select checkboxes.

## Correct settle pattern

```typescript
// After fill(UID) + Enter + waitForAppSettled:
const policyHit = page
  .locator('[role="gridcell"]')
  .filter({ hasText: new RegExp(`^\\s*${escapeRegex(uid)}\\s*$`) });
await expect.poll(async () => {
  if ((await policyHit.count()) < 1) return false;
  await policyHit.first().scrollIntoViewIfNeeded().catch(() => undefined);
  if (!(await policyHit.first().isVisible().catch(() => false))) return false;
  return (await rowCheckboxes.count()) >= 1;
}, { timeout: 180_000, intervals: [1_000, 2_000, 3_000] }).toBe(true);
```

### Do not settle on

- `.ag-center-cols-container` innerText alone (UID often missing there)
- `PaymentModule-ACH` / `PaymentModule-CHK` filename in center cols (truncated / off-screen)
- Checkbox count alone while status still shows unfiltered ~1000 rows
- Preprod filter testids: `filter-agents-option-Agent Level I` / `Agent Level II`

### Do settle on

- Exact Policy **gridcell** text = Customer UID
- Then `selectAllRecords()` (rendered row checkboxes only — not header select-all)

## Multi-UID select (mixed / dual batch)

```text
1. uploadAndAutoReconcile NB+RN for cycle A → wait Completed
2. same for cycle B
3. payables.open()
4. refresh grid (optional but recommended)
5. search UID_A → wait Policy visible → selectAllRecords
6. clearPayablesSearch → wait "Searching for" gone
7. search UID_B → wait Policy visible → selectAllRecords
8. clear search → Create Payment
```

**Clear between UIDs** or the second search races the first filter.

## Prod agent / payment-method notes

| Item | Guidance |
|---|---|
| Statement / payables agent | `0987654321` / first `test-DevaTest` / last `Agent` |
| Product alias | `test-2025-jan-1-aetna-test-001` |
| Transfer agent `120876543` on commission upload | Often Needs Attention (active transfer sheet) — avoid for payables seed |
| `600001` / `600002` | Onboarding → Extract Error — avoid until leveled |
| Mixed ACH+Check on prod | If Check-tab agent unavailable, **dual-ACH** (two ACH Customer UIDs) still exercises multi-select + kebab remove on Approval ACH tab |

## Page object touchpoints

- `pages/payment-processing/PayablesPage.ts` — `searchByValue`, `isPayablesSearchSettled`, `clearPayablesSearch`, `selectAchAndChkPayablesByCustomerUid`
- `steps/edit-transaction/edit-transaction.steps.ts` — mixed batch Given (dual-ACH on prod)
- `pages/payment-module/PaymentModulePage.ts` — `uploadAndAutoReconcile` must finish **Completed** before Payables

## Debug checklist

1. Confirm upload Stage = **Completed** (not Extract / Needs Attention).
2. Manually (or MCP): Payables → search Customer UID → Policy column shows UID?
3. If yes in UI but test fails → settle locator wrong (use Policy gridcell + scroll).
4. If no rows → refresh grid; wait longer; verify UID in Excel matches Policy.
5. If Agent Level I/II missing → select by UID only (no level filter).
6. Validate: `yarn test -g "@TEST-ET-010-PROD" --retries=0 --reporter=line`

## Related

- `excel-statement-extract-fix` — Extract Error / corrupt xlsx / wrong prod alias
- `statement-processing` — upload → review → Completed flow
- `TestFiles-prod-sanity/README.md` — prod seed map
