---
name: excel-statement-extract-fix
description: >-
  Diagnose and fix ICM statement Excel templates that land Extract Error, stuck
  Extract, or Needs Attention after upload. Use when upload Stage/Status shows
  Extract Error, 0 line items, Error:Extract, corrupted TestFiles / TestFiles-prod-sanity
  xlsx, wrong product alias, wrong agent NPN, smoke/edit-transaction/payment-module
  extract failures, or when policy-cancellation/transfer sheets work but statement
  files do not. Cross-ref: statement-processing, hail-intelligence,
  TestFiles-prod-sanity/README.md.
---

# Excel Statement Extract Fix (ICM Prod)

## When to use

Upload grid shows any of:

| Signal | Meaning |
|---|---|
| Stage `Extract Error` / Status `Error` | Parser or seed data rejected the file |
| Stage stuck `Extract`, Line Items `0` | Extract never produced rows |
| Stage `Needs Attention` right after Complete Review | Extract OK; agent/product/rule mismatch |
| SP/smoke/ET pass on one module, fail on another | Compare working vs broken Excel cell-by-cell |

**Not this skill:** locator/POM failures, login flakes, Status column empty while Stage is already `Review`/`Completed`.
Payables search after Completed (Policy column / dual UID) → skill `payables-search-select`.

## Golden rule

**Copy a working upload file. Do not invent columns or aliases.**

Proven working sources (prod):

- Transfer: `TestFiles-prod-sanity/TransferSheets/[MLB New]EditThis[TransferAgent].xlsx`
- Policy cancellation advance: `TestFiles-prod-sanity/PolicyCancellationAgencyAdvance/...[Advance].xlsx`
- After fix: StatementUpload / StatementProcessing under `TestFiles-prod-sanity/`

## Prod seed map (do not use preprod names)

| Field | Prod value |
|---|---|
| Product alias (`Scale name/adjustment description`) | `test-2025-jan-1-aetna-test-001` |
| Product display name | `test-Aetna-Test-Product` |
| Statement / smoke / payment agent | NPN `0987654321`, first `test-DevaTest`, last `Agent` |
| Transfer agent (transfer sheet only) | NPN `120876543`, first `Agent`, last `Test Transfer` |
| Advance agent | NPN `600011` (`test-AgentX Test`) — advance modules |
| Statement type at upload | `Aetna ACA` |

**Banned in prod Excel:**

- Alias without `test-` prefix (`2025-jan-1-aetna-test-001`, `aetna-test-product-001`)
- Hardcoded preprod aliases (`2026 $31 PMPM Medical…`)
- Agents still Onboarding / No Level (`600001`, `600002`, `600003`) unless leveled in app
- Transfer agent (`120876543`) on **commission** uploads for that transfer product → often **Needs Attention** (active transfer-sheet rule)

Wire `test-data/**` `templateDir` to `TestFiles-prod-sanity/...`, not bare `TestFiles/` (preprod).

## Diagnosis loop (one pass)

### 1. Confirm stage

In Recently Uploaded grid for the failing file:

- `Extract Error` / `0` lines → **file/seed** (this skill)
- `Waiting`/`Review` → extract OK; debug review/reconcile elsewhere
- `Needs Attention` after Complete Review → seed/rule mismatch (wrong agent or transfer-sheet collision)

### 2. Dump the Excel (required)

```powershell
node -e "
const ExcelJS=require('exceljs');
(async()=>{
  const f='PATH/TO/file.xlsx';
  const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(f);
  const s=wb.worksheets[0];
  const h=[]; s.getRow(1).eachCell((c,i)=>h[i]=String(c.value||''));
  console.log('rows', s.rowCount, 'headers', h.filter(Boolean).join(' | '));
  for (let r=2;r<=Math.min(5,s.rowCount);r++){
    const row=s.getRow(r); if(!row.hasValues) continue;
    const o={};
    h.forEach((name,i)=>{ if(!name) return; const v=row.getCell(i).value;
      o[name]=v&&typeof v==='object'?JSON.stringify(v):v; });
    console.log('row', r, o);
  }
})();
"
```

Also dump a **working** file (transfer or last green module) and diff.

### 3. Checklist — fix in this order

1. **Headers** — must match Aetna ACA shape (20 cols commission, or 21 with `Chargeback` before Gross for payment/chargeback). Do not invent columns.
2. **Row count** — NB = 1 data row. RN = 1 data row (same UID applied by prep). If RN has 3+ duplicate rows → rebuild (ExcelJS write corruption).
3. **Product alias** — exact prod alias string in `Scale name/adjustment description`.
4. **Agent NPN + names** — leveled prod agent; first/last match seed display (`test-DevaTest` / `Agent`).
5. **Plain values** — prefer numbers/dates, not shared formulas (`{"formula":...}`). Flatten formula results before upload if extract is flaky.
6. **Net compensation** — commission review uses **Net**, not Gross. Payment/chargeback templates often use Net `0` + Gross `78.9` (OK if that module historically does).
7. **Template path** — module config points at `TestFiles-prod-sanity/<module>/`.
8. **Prep overrides** — grep steps for hardcoded `productAlias` / agent rewrites that undo the template (smoke once forced a preprod alias).
9. **UID / check-run** — unique Customer UID per NB run; bump check-run date for re-uploads (T095). Persist check-run **only** (never persist smoke `SMKSTM*` UIDs or `[run:]` address back to template).

### 4. Rebuild recipe (when file is corrupted)

```text
1. Copy working Transfer or StatementUpload xlsx
2. Keep header + exactly 1 data row (splice extra rows)
3. If payment/chargeback: insert Chargeback column before Gross, value 0
4. Set agent first/last/NPN + product alias + UID prefix for module
5. Write to TestFiles-prod-sanity/<module>/
6. Update test-data/<module>/*.ts agents + templateDir if needed
7. yarn test -g "@FAILING-TAG" --retries=0 --reporter=line
```

Regenerate alias rewrites (optional):

```powershell
node scripts/prep-prod-sanity-testfiles.mjs
```

Then re-apply agent/product if the script only rewrites aliases.

### 5. Validate

```powershell
yarn test -g "@TAG" --retries=0 --reporter=line
```

Expect: extract leaves `Waiting` + `Review` (or Completed after Complete Review).  
If still Extract Error after checklist → escalate (statement setup / backend), do not keep rewriting Excel.

## Common failure → fix map

| Symptom | Likely cause | Fix |
|---|---|---|
| Extract Error, 0 lines | Preprod alias / missing product | `test-2025-jan-1-aetna-test-001` |
| Extract Error | Agent Onboarding (`600001`…) | Switch to `0987654321` test-DevaTest |
| Extract OK → Needs Attention | Transfer agent + transfer product | Use DevaTest for commission; keep Transfer agent only for transfer-sheet tests |
| Extract Error / weird parse | Shared Excel formulas | Flatten to plain numbers/dates |
| RN Extract Error | RN template has 3+ duplicate rows | Rebuild RN as 1 data row |
| Smoke run-2 Extract Error | Same check-run / bad prep override | Extra check-run days + persist date only; force prod agent/alias in prep |
| SP points at `TestFiles/` | Preprod template | Point `templateDir` at `TestFiles-prod-sanity` |
| Status `""` but Stage `Review` | Grid Status column virtualized | Assert Stage / Waiting+Review poll — not a file bug |

## Do not

- Weaken extract/Completed assertions to green-wash Extract Error
- Invent statement types in UI (`Aetna ACA` only on prod trial)
- Put `test-` only on product name and leave alias preprod
- Concurrent suites sharing the same `.generated/` / template UID counter
- Write smoke unique UIDs back onto the template file

## Related

- `TestFiles-prod-sanity/README.md` — seed map
- `statement-processing` skill — upload/review/reconcile flow
- `hail-intelligence` — product missing in Advance Setup / commission template
- `scripts/prep-prod-sanity-testfiles.mjs` — bulk alias `test-` rewrite
