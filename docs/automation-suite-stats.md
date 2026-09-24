# ICM Test Automation — Suite Inventory & Stats

Analysis of the Playwright BDD workspace (`projects/icm`).

**Snapshot date:** 2026-08-11

---

## 1. Overview

| Metric | Count |
|---|---|
| Feature files | 25 |
| Module folders (`features/`) | 21 |
| Total scenarios | 388 |
| Registered module suites (`common.steps.ts`) | 21 |
| E2E feature files (`features/e2e-*/`) | 15 |
| E2E scenarios (tagged `@e2e`) | 23 |
| Regression-tagged feature files (`@regression`) | 3 |
| Scenarios tagged `@bug` | 5 |

---

## 2. Suite → case count (registered module tags)

| Suite (module tag) | Cases |
|---|---|
| `@smoke` | 92 |
| `@agent-dashboard` | 68 |
| `@product-management` | 66 |
| `@agency-dashboard` | 47 |
| `@advance-regression` | 27 |
| `@dashboard` | 25 |
| `@user-management` | 16 |
| `@payment-module` (ACH 8 + CHK 8) | 16 |
| `@edit-transaction` | 11 |
| `@validate-statement-processing` | 9 |
| `@validate-commission-report` / `-all` | 2 |
| `@validate-advance-adjustment` | 1 |
| `@validate-advance-only` | 1 |
| `@validate-advance-recovery` | 1 |
| `@validate-chargeback` | 1 |
| `@validate-commission-only` | 1 |
| `@validate-commission-truth` | 1 |
| `@validate-policy-cancellation-agency-advance` | 1 |
| `@validate-policy-cancellation-agency-credit` | 1 |
| `@validate-policy-cancellation-carrier-advance` | 1 |
| `@statement-upload` | 1 |
| `@transfer-sheet` | 1 |
| `@happy-flow` | 1 |

---

## 3. E2E suite breakdown (`features/e2e-*/`)

| Feature file | Scenarios |
|---|---|
| `e2e-statement-processing/validate-statement-processing.feature` | 9 |
| `e2e-advance-adjustment/validate-advance-adjustment.feature` | 1 |
| `e2e-advance-only/validate-advance-only.feature` | 1 |
| `e2e-advance-recovery/validate-advance-recovery.feature` | 1 |
| `e2e-advnace-commission-only/validate-commission-only.feature` | 1 |
| `e2e-chargeback/validate-chargeback.feature` | 1 |
| `e2e-commission-report/validate-commission-report.feature` | 1 |
| `e2e-commission-report/validate-commission-report-all.feature` | 1 |
| `e2e-commission-split/validate-commission-truth.feature` | 1 |
| `e2e-commission-statements/statement-upload-renewal.feature` | 1 |
| `e2e-happy-flow/happy-flow-001.feature` | 1 |
| `e2e-policy-cancellation-agency-advance/validate-policy-cancellation-with-agency-advance.feature` | 1 |
| `e2e-policy-cancellation-agency-credit/validate-policy-cancellation-with-agency-credit.feature` | 1 |
| `e2e-policy-cancellation-carrier-advance/validate-policy-cancellation-with-carrier-advance.feature` | 1 |
| `e2e-transfer-sheet/transfer-sheet.feature` | 1 |
| **Total** | **23** |

---

## 4. Regression scope

- **`@regression` tag** on 3 feature files: `payment-module-ach.feature`, `payment-module-chk.feature`, `edit-transaction.feature`
- **`@advance-regression`** suite: 27 scenarios in `advance-regression.feature`
- Combined regression + advance-regression scenarios: **54**

---

## 5. Execution status (evidence so far)

| Run | Result | Source |
|---|---|---|
| Latest CI run (2026-08-11) — `@edit-transaction` | 11 passed, 0 failed | `.ci/run-outcomes.json` + `test-results/` traces |
| Prior run (2026-08-10) | `T008-ET` failed → fixed | `.ci/slack-thread.json` |
| Statement-processing `SP-001` | passed live | `handoff.md` |
| Statement-processing `SP-002`–`SP-009` | not run yet | `handoff.md` |

**E2E green so far:** 1 of 23 scenarios confirmed passing live (SP-001). The remaining 22 E2E scenarios are written but unexecuted.

---

## 6. File locations

```
features/                 → 25 .feature files, 21 module folders, 388 scenarios
steps/<module>/common.steps.ts → 21 BeforeAll/AfterAll suite registrations
.ci/run-outcomes.json     → latest CI run summary (11 passed / 0 failed)
.ci/slack-thread.json     → Slack run summary + failure record
handoff.md                → statement-processing module handoff
test-results/             → trace directories (latest run: edit-transaction)
```
