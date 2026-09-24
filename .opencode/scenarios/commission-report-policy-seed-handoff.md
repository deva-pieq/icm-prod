# Commission Report — Policy Seed Hand-off

**Module:** `@validate-commission-report` / `@validate-commission-report-all`
**Env:** app `https://preprod.app.pieq.ai` (V20260910.02) · API `https://preprod.api.pieq.ai`
**User:** Deva X (Operations Manager)
**Seed source:** `TestFiles\ValidateCommissionSplit\inbox\[Oscar U65 CS]StatementOscarACA.csv`
**Date:** 2026-09-15

---

## 1. Why this matters

The commission-report test builds an **expected** agent commission from the **policy's own Commission Structure** and compares it to the **View Commission Report** produced from the uploaded statement. It calls:

```
resolveAgentCommissionForPolicyPeriod(policyNumber, period, cache)   // CommissionReportValidationPage.ts L225-257
  → cache key `${policyNumber}|${period}`
  → policies.searchAndOpenPolicy(policyNumber)
  → policies.captureAgentCommissionForPeriod(period)
```

`captureAgentCommissionForPeriod` opens the policy edit page → **Commission Structure** tab → selects the period card (`M1-12` / `M13-No Limit`) → reads the **Agent** split row `%` and `$`.

**⇒ Every active CSV policy MUST have a `Commission`-type rule (type 1) with a non-zero Agent split for `M1-12`.** Policies whose only rule is `Override` (type 4) cannot satisfy this capture — the period card the test clicks will not exist.

---

## 2. Seed state (verified via API 2026-09-15)

| Policy No | Member | State | UUID | Origin | Commission rule? |
|---|---|---|---|---|---|
| `OSC76736950-01` | Michael Taynor | OH | `0a581329-f64d-4975-9c4e-d185a8b26a8c` | UI create | ✅ Commission M1-12 (14/7/79/0) + M13-No Limit (18/3/79/0) |
| `OSC77556340-01` | Chad Riffett | OH | `1616234d-0f3a-46c6-bb64-46e1be0833fd` | UI create | ✅ Commission rule present |
| `OSC75935880-01` | Alyssa Rodriguez | TX | `bc55840b-50ab-4a7a-8afc-595190f5a152` | UI create (API 201 confirmed) | ✅ Commission rule present |
| `OSC75552662-01` | Dorothy Heavener Lesher | PA | (pre-existing) | pre-seeded | ⚠️ `Override` only — **needs Commission rule** |
| `OSC76716796-01` | Kendra Krebs | OH | `45419a6b-5aab-4512-9787-674bc2beea2c` | API create this session | ❌ none — **needs Commission rule** |
| `OSC76749426-01` | Megan Haines | TX | `39d5404a-2998-4340-bea0-980c528d78f8` | pre-seeded | ⚠️ `Override` only — **needs Commission rule** |
| `OSC78744676-01` | Benjamin Mejia | TX | (pre-existing) | pre-seeded | ⚠️ `Override` only — **needs Commission rule** |

- `400 POLICY_NUMBER_EXISTS` on create = policy already seeded → **do not recreate**, verify commissions instead.
- Taynor's M13 rule was edited (Agent 79→80, UI auto-rebalanced Agency 18→17) then **restored via PUT to 18/3/79** — back at template.

### Remaining work
All 4 missing Commission rules seeded via `POST /api/v1/policy/commission` (201 confirmed). Locator fix applied (section 7). Remaining blocker: backend extract pipeline.

| Policy | Status (post-seed) |
|---|---|
| OSC75552662-01 Dorothy | ✅ Commission M1-12 (20/79%) + M13 seeded |
| OSC76716796-01 Kendra | ✅ Commission M1-12 (36/79%) + M13 seeded |
| OSC76749426-01 Megan | ✅ Commission M1-12 (50/79%) + M13 seeded |
| OSC78744676-01 Benjamin | ✅ Commission M1-12 (75/79%) + M13 seeded |

---

## 3. API contracts

### Headers (captured from live app)
```
authorization: Bearer <token>          // from browser network tab
accept: application/json
content-type: application/json
x-service-name: pieq-react-app
x-client-id: pieq-app-dev
```
Note: browser `fetch` → 401; use `context.request` + captured Bearer.

### Policy list
`GET /api/v1/policy?limit=N&search=<policyNumber>` → `{ data: [...] }`
List items include `policyUuid, policyNumber, policyStatus, statusText, premiumAmount, writingAgentInfo{...}, carrierInfo, productInfo{productName, productType{code}}, memberInfo{...}, commission: []`.
**List `commission` is always empty** — use the detail endpoint for rules.

### Policy detail
`GET /api/v1/policy/{uuid}` → includes `commission: [{ uuid, ruleName }]`.

### Commission read (rule values)
`GET /api/v1/policy/{uuid}/commissions?effectiveDate=YYYY-MM-DD&paidToDate=YYYY-MM-DD`
- **ISO dates only.** `MM/DD/YYYY` → `400 VALIDATION_ERROR "effectiveDate and paidToDate must be valid dates (YYYY-MM-DD)"`.
- `{ data: {…} }` when a rule applies; `{ data: {} }` when none.

Example (Taynor M1-12):
```json
{"data":{"uuid":"4bb5091a-...","ruleName":"COMMISSION  Oscar  Oscar U65 OH/TN/VA",
 "version":1,"commissionType":1,"commissionTypeText":"Commission",
 "paymentFrequency":1,"paymentFrequencyText":"Monthly",
 "monthFrom":1,"monthTo":12,"payoutMethod":1,"payoutMethodText":"Fixed Fee",
 "feeAmount":18.00,"premiumAmount":1234.56,
 "commissionSplit":[
   {"order":1,"role":"Agency","entity":"agency","level":"","userName":"MLB NEW","userUuid":"3abe8684-c307-45fe-a51a-6b2ce3874024","userCode":"","commissionValue":14},
   {"order":2,"role":"Sales Leader","entity":"agent","level":"LVL3","userName":"Chad Bender","userUuid":"f590a169-cafb-4729-9f3a-1933a2804350","userCode":"18598357","commissionValue":7},
   {"order":3,"role":"Agent","entity":"agent","level":"LVL3","userName":"Chad Bender","userUuid":"f590a169-cafb-4729-9f3a-1933a2804350","userCode":"18598357","commissionValue":79},
   {"order":4,"role":"Sub Agent","entity":"","level":"","userName":"","userUuid":"","userCode":"","commissionValue":0}]}}
```

### Commission write (captured wire format — PUT `/api/v1/policy/commission/{ruleUuid}` → 200)
```json
{
  "policyUuid": "0a581329-f64d-4975-9c4e-d185a8b26a8c",
  "ruleName": "COMMISSION  Oscar  Oscar U65 OH/TN/VA",
  "commissionType": 1,
  "paymentFrequency": 1,
  "monthFrom": 13,
  "monthTo": null,
  "payoutMethod": 1,
  "feeAmount": 18,
  "premiumAmount": 1234.56,
  "version": 2,
  "commissionSplit": [
    {"order":1,"role":"Agency","user_name":"MLB NEW","user_uuid":"3abe8684-c307-45fe-a51a-6b2ce3874024","user_code":"","commission_value":18,"entity":"agency","level":""},
    {"order":2,"role":"Sales Leader","user_name":"Chad Bender","user_uuid":"f590a169-cafb-4729-9f3a-1933a2804350","user_code":"18598357","commission_value":3,"entity":"agent","level":"LVL3"},
    {"order":3,"role":"Agent","user_name":"Chad Bender","user_uuid":"f590a169-cafb-4729-9f3a-1933a2804350","user_code":"18598357","commission_value":79,"entity":"agent","level":"LVL3"},
    {"order":4,"role":"Sub Agent","user_name":"","user_uuid":"","user_code":"","commission_value":0,"entity":"","level":""}
  ]
}
```
- `POST /api/v1/policy/commission` takes an **array** of these objects for create; `PUT .../{uuid}` updates one (optimistic lock on `version`).
- Field names are **snake_case inside `commissionSplit`** (`user_name`, `user_uuid`, `user_code`, `commission_value`), camelCase at the rule level.
- Response PUT: `{data:{message:"Policy commission updated successfully", commissionUuid:"…"}}`.

### Template values (auto-created by UI on policy save)
| Field | Value |
|---|---|
| ruleName | `COMMISSION  Oscar  {productName}` |
| commissionType | 1 (Commission) |
| paymentFrequency | 1 (Monthly) |
| payoutMethod | 1 (Fixed Fee) |
| feeAmount | = CSV `Commission` column $ (e.g. OH 18, TX 50, PA 20, …) |
| premiumAmount | = policy premium |
| M1-12 split | Agency 14% (MLB NEW `3abe8684-c307-45fe-a51a-6b2ce3874024`) / Sales Leader 7% (writing agent) / Agent 79% (writing agent) / Sub Agent 0% |
| M13-No Limit split | Agency 18% / Sales Leader 3% / Agent 79% / Sub Agent 0% |

---

## 4. Test internals (confirmed)

- `claimPeriodTabs` / `selectCommissionPeriodTab`: card labels `Commission V1 | M1-12 | $18.00`, `Commission V1 | M13-No limit | $18.00`, `Override V1 | M1-No limit | $5.00`.
- `waitForHierarchySyncedToActivePeriod` rejects a stale fingerprint (Agency 41% / Agent 55% mounted under M1-12 — i.e. M13 config shown under M1-12 tab). Do not loosen.
- Review-capture skip rules (`CommissionReportReviewCapture.ts`): zero `grossComm`, non-empty chargeback, row bg `#ef4444`, missing policy number/columns.
- `commissionAmount = grossComm / totalMembers`; then `valueTimesMembers` vs report asserted.
- Active CSV rows must have `Commission > 0` and no block reason; rows with "Blocked due to terminated appointment" / "minimum life threshold" / 0 commission are skipped.
- `OSC78744676-01` block reason "check" — treat as active; confirm only via real run.

### CSV rows (active)
| Policy | Member | State | Commission $ | Members | Months |
|---|---|---|---|---|---|
| OSC76736950-01 | Michael Taynor | OH | 18 | 1 | renewal |
| OSC77556340-01 | Chad Riffett | OH | 18 | 1 | 03/01/2026 |
| OSC75935880-01 | Alyssa Rodriguez | TX | 50 | 2 | 02/01 + 03/01 |
| OSC75552662-01 | Dorothy Heavener Lesher | PA | 20 | 1 | 04/01/2026 |
| OSC76716796-01 | Kendra Krebs | OH | 36 | 1 | — |
| OSC76749426-01 | Megan Haines | TX | 50 | 1 | — |
| OSC78744676-01 | Benjamin Mejia | TX | 75 | 1 | — |
| OSC74894193-01 | Craig Geckle | NJ | 0 | — | blocked (terminated appointment) |
| OSC75341504-01 | Christopher Green | GA | 0 | — | blocked |

---

## 5. Run commands

```powershell
python test-runner.py -g "validate-commission-report"          # collect + classify + fix (default ON)
python test-runner.py -g "validate-commission-report" --no-fix
yarn test -g "@validate-commission-report" --retries=0 --reporter=line
yarn test -g "@validate-commission-report-all" --retries=0 --reporter=line
yarn bddgen
```
Hail loop: `failed==0` → GREEN; else fix, attempt ≤3 (evidenced fix + rerun), >3 → escalate. Never weaken asserts.

---

## 6. Relevant files

| Need | Where |
|---|---|
| Capture mechanism | `pages/statement-processing/CommissionReportValidationPage.ts` L225-257 |
| Review capture / skip rules | `pages/statement-processing/CommissionReportReviewCapture.ts` |
| Period tabs / stale guard | `pages/policies/PolicyCommissionReportPage.ts` |
| Policy form locators / API routes | `pages/policy-master/PolicyMasterPage.ts` |
| Feature files | `features/e2e-commission-report/validate-commission-report{,-all}.feature` |
| Test-data config | `test-data/commission-report/validateCommissionReport.ts` |
| API surface / testids | `.opencode/scenarios/policy-findings-scratchpad.md` |
| Seed playbook | `.opencode/skills/hail-intelligence/SKILL.md` → HI-CR |
| Behavior facts | `scripts/test_runner/app_behavior.json` → `statement-processing` |
