---
name: statement-processing
description: >-
  Debugging and reference for statement / advance / commission processing flows
  in ICM. Covers the SHARED skeleton used by every module (advance-only,
  advance-recovery, advance-adjustment, commission-only, commission-report,
  policy-cancellation-agency-advance): file prep, Customer UID persistence,
  upload → extract poll → Waiting/Review, warning-icon semantics (new policy vs
  renewal), Complete Review → Completed/Needs-Attention, reconciliation,
  advance exception, policy ledger, ARF ledger, Advance Overview. USE WHEN:
  debugging failing statement/advance/commission tests, "Needs Attention",
  "Unmatched Commission Mismatch", extract processing timeouts, stage/status
  assertion failures, ARF ledger balance issues, module-load transients, or
  writing new scenarios/steps for any of these modules. NOTE: module data and
  flow endings differ (full recovery vs policy cancellation vs adjustment) —
  always read the target module's config and template before assuming values.
---

# Statement Processing & Debugging (ICM)

## What this skill covers

This is the **shared skeleton** behind every statement/advance/commission module.
Modules differ in **data** and **end state**, but reuse the same steps, page
objects, assertions, and polling helpers. Use this skill for **debugging** any
failing flow and as a **reference** for the common step inventory.

**Never assume one module's numbers/order apply to another** — confirm the
target module's config + template first (section 1).

## 1. Module variants — shared skeleton, different data

| Module | Tag | Feature | Config (`test-data/`) | Prep (`utils/`) | UID prefix | Templates dir |
|---|---|---|---|---|---|---|
| advance-only | `@validate-advance-only` | `features/e2e-advance-only/validate-advance-only.feature` | `advance-only/validateAdvanceOnly.ts` | `advance-only/advanceOnlyExcelPrep.ts` | `ATENA-ADV-AO-TEST-A` | `TestFiles/AdvanceOnlyTemplate` |
| advance-recovery | `@validate-advance-recovery` | `features/e2e-advance-recovery/validate-advance-recovery.feature` | `advance-recovery/validateAdvanceRecovery.ts` | `advance-recovery/advanceRecoveryExcelPrep.ts` | `ATENA-ADV-AR-TEST-A` | `TestFiles/AdvanceAndRecovery` |
| advance-adjustment | `@validate-advance-adjustment` | `features/e2e-advance-adjustment/validate-advance-adjustment.feature` | `advance-adjustment/validateAdvanceAdjustment.ts` | `advance-adjustment/advanceAdjustmentExcelPrep.ts` | `ATENA-ADV-AO-TEST-A` | `TestFiles/AdvanceAndAdjustment` |
| commission-only | `@validate-commission-only` | `features/e2e-advnace-commission-only/validate-commission-only.feature` | `advance-only/validateCommissionOnly.ts` | `advance-only/commissionOnlyExcelPrep.ts` | `ATENA-ADV-AO-TEST-A` | `TestFiles/CommissionOnlyTemplate` |
| commission-report | `@validate-commission-report` / `-all` | `features/e2e-commission-report/validate-commission-report(-all).feature` | `commission-report/validateCommissionReport.ts` | — (reuses statement prep) | — | — |
| policy-cancellation-agency-advance | `@policy-cancellation-agency-advance` | `features/e2e-policy-cancellation-agency-advance/validate-policy-cancellation-with-agency-advance.feature` | `policy-cancellation-agency-advance/validatePolicyCancellationAgencyAdvance.ts` | `policy-cancellation-agency-advance/policyCancellationAgencyAdvanceExcelPrep.ts` | `ATENA-ADVX-PC-AA-TEST-B` | `TestFiles/PolicyCancellationAgencyAdvance` |

Key facts:

- All module configs are **structurally identical** (`columns`, `gridColumns`, `uploadPoll {maxAttempts:30, intervalMs:2000}`, `reviewPoll {15, 2000}`, `expectedAfterExtract {Waiting/Review}`, `reviewHeading`, `reconciliationHeading`, `warningTooltip.newPolicy`). Only `templateDir` / `templateFileName` and `customerUidPrefix` / `customerUidPad` differ.
- **Actual data values (gross, commission, months, amounts) live in the Excel templates** under `TestFiles/<module>/`, NOT in the configs. When debugging a value mismatch, read the module's template — not another module's.
- Flow endings differ: advance-recovery ends with **full recovery**; policy-cancellation ends with **chargeback → Needs Attention → cancellation exception → ARF closing balance**; advance-adjustment applies an adjustment. The shared phases are the same up to the branch point.

## 2. Shared flow skeleton (common steps & assertions)

1. **Prep** — advance file prepared, Customer UID incremented +1 (prefix + pad preserved), timestamped copy in `.generated/`, incremented UIDs persisted back to the template (`wb.xlsx.writeFile(templatePath)`).
2. **Agent eligibility** — extract Agent ID from file → Agents page → search by ID → open settings → **carrier advance toggle enabled**.
3. **Advance Setup** — extract product alias → search grid → capture **Advance Default** and **Advance Monthly** values.
4. **Upload** — upload page → select statement type (e.g. `Aetna ACA`) → submit → **extract processing poll** → status `Waiting` / stage `Review`.
5. **Review** — open review from stored row → **advance (new policy) only**: hover warning icon → tooltip "New Policy" → Complete Review.
6. **Stage assert** — `Completed` or `Needs Attention` (module-dependent; chargeback always lands `Needs Attention`).
7. **Reconciliation** — open record → hover advance-exception tooltip → click exception → months input == captured Advance Monthly → capture advance amount → ARF row in transaction preview → reconcile → success toast.
8. **Policy ledger** — Policies → search by stored PolicyNumber → View Ledger → ARF row amount matches capture → earning-type rows (e.g. `CHARGEBACK`).
9. **Recovery / chargeback** (per module) — upload → extract poll → review → stage.
10. **Advance Overview** — Historical tab → search → open record → details grid **balance assertion**.

Gherkin step text is **module-unique via suffix**: `in advance recovery validation`, `in advance only validation`, `in commission only validation`, `in advance adjustment validation`, `in policy cancellation validation`, `in commission report validation`. Identical wording across modules without a suffix = step conflict — always `grep` `steps/**/*.steps.ts` for the exact text before adding steps.

## 3. Shared building blocks

- `pages/statement-processing/StatementUploadPage.ts` — `loc` map (`fileUpload`, `fileInput`, `uploadProcessBtn`, `statementTypeDropdown`, `carrierInput`, `gridRefresh`); `uploadFromPrepared`, `resolveStoredUploadRow` (prefer `BT-*` File ID, fall back to fileName; review URLs use UUIDs — NOT grid IDs), `expectStoredUploadStatusAndStage`, `openReviewForStoredUpload`, `completeReviewAndConfirm`.
- `pages/statement-processing/StatementReviewPage.ts` — `warningIcon` = `//div[@col-id='__warning__']` → `.lucide.lucide-triangle-alert`; `completeReviewButton`/`completeReviewConfirmButton`; `submitStatement`/`submitConfirm`.
- `pages/statement-processing/StatementUploadAssertions.ts` — `pollUntilUploadReviewReady` (regex-escaped exact status+stage), `pollPastExtractProcessing` (`'ready'` once no longer Extract+Processing and not still Uploaded), `readStatusAndStage`.
- `utils/<module>/*Context.ts` — module-level singletons (`set*`/`get*`), cleared in the module `Before` hook. Captured values (PolicyNumber, file paths/IDs, ARF amount, pending payment, default/monthly) must come from context, not literals.
- `utils/pageLoader.ts` `waitForAppSettled` — after every navigation/save; auto-recovers transient "Failed to load module" (single immediate check, ≤2 reloads, zero-cost happy path).
- `utils/pageLoader.ts` `ensurePageReady` — page-entry only (settle → soft-check ready marker → one `page.reload` if missing → hard assert). Use from `open()` for shell/heading markers; never mid-scenario visibility (modals, filters, upload grids).
- `utils/debugSteps.ts` — `DEBUG_STEPS=true` prints `[debug_steps] [assert] label | actual | expected | status`, `[click] fileId=BT-*`, `[capture:review-url] fileId=<uuid>`.

### Polling rules
- Grid refresh is **throttled** (button shows "No Refresh") — click refresh, then wait `intervalMs` before the next poll iteration.
- When a file ID is captured, prefer it over fileName for row resolution (parallel-run safety).
- `readStatusAndStage` calls `ensureOnUploadPage()` — polls are safe from any route.

## 4. Debugging guide

### Fast loop
1. Enable `DEBUG_STEPS=true` and re-run the failing tag — follow the `[debug_steps]` assertion/click/capture log to find the exact step and actual vs expected.
2. Read `test-results/<failed-test-dir>/error-context.md` — contains the page snapshot at failure + source + error.
3. `npx tsc --noEmit -p tsconfig.json` before/after edits; run `yarn test -g "@<module-tag>" --retries=0 --reporter=line` (never omit `--retries=0`).

### Classify the failure first
- **App transient** — "Failed to load module" (sidebar fine, main shows error + Reload Page) or "This page could not be displayed": auto-recovered by `waitForAppSettled`; otherwise re-run. **Do NOT hunt phantom locators.**
- **Scenario timeout** — "Test timeout of N ms exceeded" is the scenario cap (default `smokeScenarioTimeoutMs` = 420s), NOT the poll. Long multi-phase modules need `test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000))` in their `common.steps.ts` `Before` (pattern: commission-report, policy-cancellation-agency-advance). The upload poll has its own timeout (`max(T*3, attempts*interval)`).
- **Data mismatch** — `Needs Attention` / "Unmatched Commission Mismatch" on recovery/chargeback: check prep (rules below).
- **Stage/status assert** — poll helper expected state vs actual; confirm you're resolving the right row (BT-* ID vs UUID).

### Data rules — VERIFY AGAINST THE MODULE BEING DEBUGGED
1. **Warning icon "New Policy"** appears ONLY on **new-policy advance review rows** (brand-new Customer UID). Existing UID = renewal (no icon). **Recovery / chargeback reviews target an existing policy → NO warning icon.** Do NOT add warning-hover steps to recovery/chargeback phases in any module.
2. **Recovery gross must equal the advance's expected monthly recovery** for that module (e.g. `78.90` in the advance-recovery and policy-cancellation templates). Overriding it (e.g. to `26.30`) produces stuck "Unmatched Commission Mismatch" rows (Pending, no controls) → upload stuck at `Needs Attention`.
3. **ARF ledger closing balance** — row order differs per module/screen. In policy-cancellation the ledger is chronological and `$0.00` is the **LAST** row (advance → recovery credits → cancellation reversal); advance-recovery asserts the **FIRST** row. Confirm against the live grid for the module before changing an assertion — do NOT assume one order.
4. **UID persistence** — advance prep increments +1 each run and persists back to the template; recovery/chargeback prep replaces UID with the **stored PolicyNumber** from the advance (never invent a UID; never overwrite the advance template). `.generated/` is shared per module → never run two suites concurrently.
5. **Amounts** — ARF amount and pending payment are **captured** into context and compared, not hardcoded — except where a feature fixes a literal. Follow the module's own capture steps.

### Commission statement (Aetna ACA / `@validate-statement-processing`) rules
1. **Record count** — Excel/CSV data rows (exclude header) MUST equal review footer count. After Complete Review, `matched + unmatched` (Completed auto-reconcile + Needs Attention exceptions) MUST equal that same file row count.
2. **Total Earned Commission** on Review = Excel **Net compensation**, NOT Gross. Assert net (formula `M*(1-0.12)` → e.g. `$48.31`). Grid Gross column is virtualized — do not poll grid text for gross.
3. **"New Policy" warning** — only for a **brand-new Customer UID** (NB). Hover/tooltip assert only on that path. **RN / existing UID** → no New Policy icon; just **Complete Review** (auto-reconcile to Completed).
4. **RN (renewal)** — only for a Customer UID already processed (policy exists). Seed UID via a prior Completed upload in the same scenario; never invent RN with a brand-new UID.
5. **NB auto-reconcile** — **exactly one** NB in the file → after Complete Review the upload auto-reconciles to `Completed` (may take time — keep poll windows). **More than one NB** in the same file → `Needs Attention` (ops manager manual reconcile).
6. **Needs Attention** — only for discrepancies: policy missing, commission mismatch, chargeback, advance exception, policy cancellation, or multi-NB. Clean single-NB / CSV / state-variant files with no discrepancy → `Completed`, not NA.
7. **Invalid format (SP-005)** — after attaching unsupported file: Upload Statement button **disabled** + `getByText('Invalid file')` visible. Do **not** click Upload.
8. **Partial (SP-007)** — typical mix: 1 NB (new UID) + 1 RN (seeded UID) + 1 RC/chargeback
   (seeded UID, Chargeback amt / Gross 0) → after Complete Review stage is **Completed**
   (not Needs Attention). Validate via History search by file ID: open record → **NB** and **RN**
   have **no** warning icon; **RC** has warning icon.

### Per-module gotchas
- policy-cancellation: pending payment = advance − 4 recovery credits (e.g. 653.31 − 4×72.59 = 362.95) and matches the cancellation reversal on the ARF ledger.
- advance-recovery: recovery rows complete with no warning icon and no reconciliation — stage goes straight to `Completed`.

## 5. Reference — common step inventory (suffix `in {module} validation`)

| Phase | Gherkin (representative) | Page method |
|---|---|---|
| Prep | the advance statement file is prepared from template | module `prepareFile()` |
| Prep | the Customer UID is incremented by 1 / saved with timestamp / stored for later steps | prep + context setters |
| Agents | a row containing the agent ID and Level is displayed | `expectAgentRowDisplayed` |
| Advance Setup | a row for the product appears in the Advance Setup grid / capture Default / Monthly | `expectProductRowInAdvanceSetup`, `captureAdvanceDefault/Monthly` |
| Upload | the upload extract processing completes and file ID is captured | `pollPastExtractProcessing` |
| Upload | the upload row shows status "Waiting" and stage "Review" | `expectStoredUploadStatusAndStage` |
| Review | hover over the warning icon / tooltip contains "New Policy" | `hoverWarningIcon` (advance only) |
| Review | click Complete Review | `completeReviewAndConfirm` |
| Stage | the upload stage changes to "Completed" / "Needs Attention" | `expectStoredUploadStage` |
| Reconcile | the number of months input matches the captured Advance Monthly value | context compare |
| Reconcile | the transaction preview grid contains an ARF row | `expectArfRowInPreview` |
| Policy | the ARF row Amount matches the captured advance amount | ledger compare |
| Overview | the balance in the {first|last} row of the Advance Overview details grid is "$0.00" | `expectFirstRowBalanceIsZero` / `expectLastRowBalanceIsZero` (module-dependent row order!) |

## 6. Checklist

- [ ] Identified the target module's config + template before assuming any data value
- [ ] Failure classified: transient / scenario timeout / data mismatch / stage-assert, not assumed
- [ ] `DEBUG_STEPS=true` run used to locate the failing assertion (actual vs expected)
- [ ] Step text searched across `steps/**/*.steps.ts`; module suffix applied
- [ ] Warning-icon steps only on new-policy advance reviews (never recovery/chargeback)
- [ ] Recovery gross matches the module's expected monthly recovery; UIDs follow persistence rules
- [ ] ARF ledger row order confirmed for THIS module before touching a balance assertion
- [ ] Long scenarios override scenario timeout to 30 min; `waitForAppSettled` stays zero-cost
- [ ] Verified with `npx tsc --noEmit -p tsconfig.json` + `yarn test -g "@<module-tag>" --retries=0 --reporter=line`

## Quick reference

```bash
DEBUG_STEPS=true yarn test -g "@policy-cancellation-agency-advance" --retries=0 --reporter=line
npx tsc --noEmit -p tsconfig.json
yarn bddgen   # after step/feature text changes
```

Cursor mirror: `.cursor/skills/statement-processing/`.
