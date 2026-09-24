---
name: hail-intelligence
description: >-
  Hail Intelligence — Test Runner data/setup playbook. Use when Product not
  found in Advance Setup, commission template missing, transfer-sheet/config
  missing, purged product-team fixtures (e2e-commission-statements), or when
  test-runner / regression-fixer classifies HI-P / HI-C / HI-CR. Create product
  + template; mirror working transfer-sheet/smoke; reseed simple E2E data;
  seed commission-report policy Commission rules; escalate only after 3 failed
  attempts.
---

# Hail Intelligence

Data/setup fixer for ICM BDD. Locators often fine — **product / commission / config missing** after purge.

Load with: `test-runner`, `icm-app-behavior`, `fix-harvested-e2e-tests`.

## Internal loop (binding)

```
failed == 0  → GREEN — stop (no OpenCode edits)
else         → FIX (default on)
attempt ≤ 3  → evidenced fix + yarn test -g "@TAG" --retries=0 --reporter=line
attempt > 3  → ESCALATE into results.md — never weaken asserts
```

`python test-runner.py -g "…"` runs fix by default. Opt out: `--no-fix` / `--collect-only`.

## HI-P — Product missing (Advance Setup / grid)

### Signal

```
Error: Product "<name>" not found in Advance Setup grid
Error: Product code "…" not found
```

Taxonomy: `product_missing` (Tier 2, letter `HI-P`).

### Root cause (usual)

Excel `product name alias` points at product purged from env — **not** a bad locator.

### Fix (do this order)

1. **Read name from failure + module context**
   - Snippet quotes the name (e.g. `aetna-aca-test-advance-month-july-21`).
   - Confirm Excel prep: `utils/<module>/*ExcelPrep.ts` → `product name alias` / `productName` in context.

2. **Prefer create product that matches the Excel alias**
   - Mirror happy-flow product create: `features/e2e-happy-flow/happy-flow-001.feature` Steps 1–3.
   - Helpers: `utils/products/seedProduct.ts` (`createSeedProductWithUrls`), `ProductManagementPage`, commission structure pages.
   - Product display / carrier product name / alias must match what Advance Setup search uses (same string Excel extracts).

3. **Add commission template**
   - Open product → Commission Structure → Add rule → type Commission.
   - Set policy start / slabs as module needs.
   - Select a known template (happy-flow uses `ACA - Carrier with OVR - Regular` unless module docs say otherwise).
   - Publish rule; wait for success toast.

4. **Advance Setup (ARF modules)**
   - Navigate Advance Setup; search by product name.
   - If row missing after create+template → configure advance default/monthly per module (MCP prove UI).
   - Capture defaults only after row exists — do not skip assert.

5. **Verify once**
   ```powershell
   yarn test -g "@TEST-001-Advance-Only-ARF" --retries=0 --reporter=line
   ```
   (use failing tag)

6. **Do not**
   - Weaken `expectProductRowInAdvanceSetup` / change assert to soft-pass.
   - Invent a different product name in Excel without updating create + template to match.
   - Chase `data-testid` first when error text is literally product not found.

### Alternate when Excel name is disposable

If template is ours (not product-team locked): create fresh E2E product → write that name into prepared Excel `product name alias` → save under `.generated/` → continue flow. Keep template + Advance Setup in sync.

## HI-C — Configuration missing

### Signal

Missing transfer-sheet rule/config, empty config grids, “not configured”, advance fields absent after product exists.

Taxonomy: `config_missing` (Tier 2, letter `HI-C`).

### Fix

1. **Mirror working suites** (do not invent config UX):
   - `features/transfer-sheet/` (rule-list, policy-list, upload-and-check)
   - `features/e2e-transfer-sheet/`
   - Smoke: settings / commission templates navigation in `features/smoke/smoke.feature`
2. Add the missing rule/config via the same UI path those scenarios use.
3. Re-run failing tag with `--retries=0`.
4. After 3 attempts → escalate with screenshot + which config screen lacked data.

## HI-CR — Commission Report: policy missing `Commission` rule (compound seed)

### Signal

```
captureAgentCommissionForPeriod("M1-12") — no matching "Commission V1 | M1-12" period card
Timeout waiting for Agent split row / hierarchy not synced to active period
Expected agent value undefined; report vs expected mismatch on every period
```

Taxonomy: `config_missing` (Tier 2, letter `HI-CR`).

### Fact

Commission-report derives **expected** agent commission from the policy's own Commission Structure. A policy whose only rule is `Override` (type 4) — or has no rule — cannot satisfy the capture. Pre-seeded/purged policies often have `Override` only.

### Detect (API — cheapest)

```powershell
# list → policyUuid ; detail → commission[] ; commission read → rule values
GET /api/v1/policy?limit=5&search=<policyNumber>
GET /api/v1/policy/{uuid}                                   # commission:[{uuid,ruleName}]
GET /api/v1/policy/{uuid}/commissions?effectiveDate=YYYY-MM-DD&paidToDate=YYYY-MM-DD
#   {data:{}}      → no rule  → SEED
#   Override-only  → SEED a Commission rule
```

Headers: `authorization: Bearer <token>`, `accept: application/json`, `content-type: application/json`, `x-service-name: pieq-react-app`, `x-client-id: pieq-app-dev`. Browser `fetch` → 401; use `context.request`. Dates **ISO only** (`MM/DD/YYYY` → `400 VALIDATION_ERROR`).

### Fix — POST `/api/v1/policy/commission` (array) / PUT `/api/v1/policy/commission/{ruleUuid}`

Rule object (camelCase; `commissionSplit` items snake_case):
```json
{"policyUuid":"<uuid>","ruleName":"COMMISSION  Oscar  <productName>",
 "commissionType":1,"paymentFrequency":1,"monthFrom":1,"monthTo":12,
 "payoutMethod":1,"feeAmount":18,"premiumAmount":1234.56,"version":1,
 "commissionSplit":[
   {"order":1,"role":"Agency","user_name":"MLB NEW","user_uuid":"3abe8684-c307-45fe-a51a-6b2ce3874024","user_code":"","commission_value":14,"entity":"agency","level":""},
   {"order":2,"role":"Sales Leader","user_name":"<writing agent>","user_uuid":"<uuid>","user_code":"<code>","commission_value":7,"entity":"agent","level":"LVL3"},
   {"order":3,"role":"Agent","user_name":"<writing agent>","user_uuid":"<uuid>","user_code":"<code>","commission_value":79,"entity":"agent","level":"LVL3"},
   {"order":4,"role":"Sub Agent","user_name":"","user_uuid":"","user_code":"","commission_value":0,"entity":"","level":""}]}
```
- `feeAmount` = CSV `Commission` $ column (OH 18, TX 50, PA 20, …).
- Add a 2nd rule `monthFrom:13, monthTo:null` (M13-No Limit) with split 18/3/79/0.
- Splits must total 100 (frontend-owned; editing one % auto-rebalances Agency).

### Do not
- Do not assume a `400 POLICY_NUMBER_EXISTS` on create is a failure — policy already seeded; go verify commissions.
- Do not weaken `waitForHierarchySyncedToActivePeriod` / the stale-fingerprint guard (Agency 41 / Agent 55 under M1-12 = wrong tab mounted).
- Do not skip rows the review-capture already skips (zero `grossComm`, chargeback, row bg `#ef4444`).

### Verify
```powershell
yarn test -g "@validate-commission-report" --retries=0 --reporter=line
yarn test -g "@validate-commission-report-all" --retries=0 --reporter=line
```
Full detail: `.opencode/scenarios/commission-report-policy-seed-handoff.md`.

## Purged product-team data (`e2e-commission-statements` and kin)

### Fact

Some statement fixtures assume product-team seed data. Env purge → failures even when automation code is fine.

### Fix as much as we can

1. Reseed **simple** E2E product + commission template (HI-P steps).
2. Point statement prep / carrier-product fields at that product when template is under our control.
3. Validate **flow**: upload → review → payables / stage transitions — not frozen team catalog names.
4. If scenario hard-requires purged team-only catalog entries → escalate `data_env` with evidence; keep `@bug` only when product confirms. **Never** greenwash by deleting Then steps.

## Reference map

| Need | Where |
|------|--------|
| Create product + template | `features/e2e-happy-flow/happy-flow-001.feature`, `utils/products/seedProduct.ts` |
| Advance product row assert | `pages/advance-only/AdvanceOnlyPage.ts` `expectProductRowInAdvanceSetup` |
| Excel product alias | `utils/advance-only/advanceOnlyExcelPrep.ts` (and sibling `*ExcelPrep.ts`) |
| Transfer Sheet working paths | `features/transfer-sheet/*`, `features/e2e-transfer-sheet/*` |
| Statement renewal (may need reseed) | `features/e2e-commission-statements/statement-upload-renewal.feature` |
| Commission-report policy seed | `.opencode/scenarios/commission-report-policy-seed-handoff.md` |
| Commission capture / period tabs | `pages/statement-processing/CommissionReportValidationPage.ts`, `pages/policies/PolicyCommissionReportPage.ts` |
| Behavior facts | `scripts/test_runner/app_behavior.json` → `advance-setup-product-missing`, `purged-product-team-data`, `config-mirror-working-suite`, `commission-report-policy-commission-missing` |

## Escalation stub (results.md)

1. **Failed** — tag / Product `"…"` not found (or config signal)
2. **Checked** — HI-P/HI-C steps tried; MCP evidence; attempt count
3. **Disposition** — `data_env` if unreseedable team data; else `unknown` after 3 tries
4. **Ask human** — restore product-team seed **or** approve permanent E2E product name in template
