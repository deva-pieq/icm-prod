# PieQ ICM — Sanity Testing Checklist

Operational checklist for **sanity** on PieQ ICM (preprod).  
Goal: prove critical money and statement paths still work after deploy / data change / release candidate — not full regression depth.

| Related | Location |
| --- | --- |
| Behavior map | `scripts/test_runner/app_behavior.json` |
| Automated tag | `@sanity` |
| Smoke (nav only) | `@smoke` → `docs/preprod-smoke-after-deploy.md` |
| Statement processing (module, mostly regression) | `features/statement-processing/` |

**Last inventory:** 2026-09-16 — based on tagged features + known preprod behaviors.

---

## 1. What sanity means here

| Tier | Tag | Pass means |
| --- | --- | --- |
| Smoke | `@smoke` | Sidebar modules open; URL + page header OK |
| **Sanity** | `@sanity` | Upload → extract → Review → Complete → ledger/payment/advance outcomes match product rules |
| Regression | `@regression-test` | Full module depth (masters, dashboards, bulk, negatives) |

**Sanity focus:** statement processing pipeline and money-impacting variants (advance, cancellation, chargeback, transfer, commission truth/report), plus thin agent-create gates.

**Out of scope for sanity (keep regression):** bulk review update, large 1000-row stress, dashboard KPIs, full carriers/users/products CRUD, processing cut-off matrix, advance grid-only regression.

---

## 2. Preflight (do before any sanity run)

Mark each item when done for this environment/build.

### 2.1 Environment

- [ ] `BASE_URL` points at target (usually `https://preprod.app.pieq.ai/`)
- [ ] `E2E_PASSWORD` set
- [ ] Ops / agency credentials available per suite:
  - [ ] Default ops: `E2E_EMAIL` (happy flow, many modules)
  - [ ] Agency 1 advance login used by ARF / agent-master / chargeback flows (see `.env.example`)
  - [ ] Agency 3 ops for statement processing / MMP / payment (`agency3OpsCredentials` pattern)
- [ ] Optional roles if checking shell parity: `E2E_EMAIL_OWNER`, `E2E_EMAIL_AGENT`

### 2.2 Product / config seed (failure here looks like “test bug”)

From `app_behavior.json` → `statement-processing` / `product-management` / `transfer-sheet`:

- [ ] **ARF products:** display name equals Excel scale-name alias; Advance Setup row exists (Default non-empty, Monthly > 0). No commission template required for ARF grid check alone.
- [ ] **Policy cancellation products:** Products grid resolve by carrier-product-name alias; Advance Setup searchable by display name.
- [ ] **Commission report policies:** policies under test have a **Commission** rule (type 1), not Override-only / empty — otherwise agent commission capture fails.
- [ ] **Transfer sheet:** transfer rules / config present (mirror working `features/transfer-sheet` + smoke settings if missing).
- [ ] **MMP (if in scope):** Agency 3 levels + MMP config enabled; do not treat missing ledger Type=`mmp` as a locator bug until env confirmed.

### 2.3 Statement file hygiene

- [ ] Advance / happy-flow / SP templates: **Customer UID increments +1** and is written back to template each successful prepare (avoids false “renewal” instead of new policy).
- [ ] Recovery / chargeback / RC files reuse stored **PolicyNumber** — do not invent new UID for RC rows.
- [ ] Enough disk / write access under `.generated/` for prepared workbooks.

### 2.4 How to run

```powershell
# Collect + classify (+ fix loop default ON)
python test-runner.py -g "sanity"

# Collect only
python test-runner.py -g "sanity" --no-fix

# Direct Playwright (debug — always --retries=0)
yarn test -g "@sanity" --retries=0 --reporter=line

# Single scenario
yarn test -g "@TEST-001-happy-flow" --retries=0 --reporter=line
```

Artifacts: `.generated/test-runner/<run-id>/` (`failures.json`, `results.md`, `suite.log`).

---

## 3. Automated sanity checklist (`@sanity`)

Check **Pass / Fail / Blocked** per scenario. Use **Blocked** for env/seed/backend extract — do not weaken asserts.

### 3.1 Core pipeline — statement → pay

| Done | ID / tag | Scenario | App behavior to verify | Notes |
| --- | --- | --- | --- | --- |
| [ ] | `@TEST-001-happy-flow` | Product → commission → statement → payment finalize | New product Active; commission rule saved; statement Completes; payment path finishes | Primary “app still sells commissions” gate |
| [ ] | `@validate-commission-truth` / `@oscar-u65-cs` | Inbox statement → commission split truth | Extract reaches Review; split totals match expected truth | Watch **Extract** backend errors (`waiting:Error:Extract`) |
| [ ] | `@statement-upload` / renewal | RN statement → review → payables | Renewal prepare; upload; Review; payables trace | Depends on prior / seeded policy context |
| [ ] | `@TEST-TS-UC-001` / `@upload-to-ach` | Transfer agent → reconcile → ACH payment → history | Transfer rule applied; policy list; payment authorize; history | Needs transfer config (HI-C) |

**Expected product rules (core Review):**

- [ ] File data rows (ex header) = Review record count; after Complete, matched + unmatched = same count
- [ ] Clean single NB: Review shows **no** “NB - New business” label and **no** warning icon on clean row; Complete → auto **Completed**
- [ ] Exactly one NB → Completed; **more than one NB** → Needs Attention
- [ ] Review “Total Earned Commission” = Excel **Net** compensation (not Gross)

---

### 3.2 Advance / ARF family

| Done | ID / tag | Scenario | App behavior to verify | Notes |
| --- | --- | --- | --- | --- |
| [ ] | `@TEST-001-Advance-Only-ARF` | Advance only prepare → upload → reconcile → validate → recover | Advance Setup finds product by **display name = Excel alias** | Seed before run |
| [ ] | `@TEST-001-Advance-Recovery-ARF` | Advance + recovery full flow | Recovery reuses policy; ARF balances update | Same seed class |
| [ ] | `@TEST-001-Advance-Adjustment-ARF` | Advance + adjustment full flow | Adjustment reflected post-reconcile | Same seed class |
| [ ] | `@TEST-001-Commission-Only-Validate-Commission-Split` | Commission-only ARF path | Commission-only reconcile + recover | Serial “Failed to load module” → re-run **alone** |

---

### 3.3 Policy cancellation

| Done | ID / tag | Scenario | App behavior to verify | Notes |
| --- | --- | --- | --- | --- |
| [ ] | `@TEST-001-Policy-Cancellation-Agency-Advance` | Advance payout → partial recovery → cancel → validate | Agency advance cancellation path | Product alias + Advance Setup |
| [ ] | `@TEST-001-Policy-Cancellation-Agency-Credit` | Same with agency credit | Agency credit path | Same seed class |
| [ ] | `@TEST-001-Policy-Cancellation-Carrier-Advance` | Same with carrier advance | Carrier advance path | Same seed class |

---

### 3.4 Chargeback, reports, MMP, agent create

| Done | ID / tag | Scenario | App behavior to verify | Notes |
| --- | --- | --- | --- | --- |
| [ ] | `@TEST-001-Chargeback-Recovery-Options` | NB commission then RC1/RC2/RC3 recovery parties | Ledger COMMISSION then CHARGEBACK; reconcile As Per Split / Agency / Agent | **Known risk:** chargeback detail row may not render — escalate, don’t weaken |
| [ ] | `@validate-commission-report` | Report vs policy Agent commission | Agent value matches period card / report | Needs Commission rule on policy |
| [ ] | `@validate-commission-report-all` | Agency + Sales Leader + Agent vs report | All three roles align | Same seed / HI-CR |
| [ ] | `@TEST-013-Mmp-Flow` | MMP table visible on reconciliation | MMP table present after Complete | Feature-level `@sanity` |
| [ ] | `@TEST-019-Mmp-Flow` | MMP Bonus earning type | Bonus config + statement | Configure button may be disabled if env incomplete |
| [ ] | `@TEST-015-Mmp-Flow` | MMP NB → agent ledger | Ledger Type=mmp/marketing within poll window | **Known:** ledger rows often absent in preprod |
| [ ] | `@TEST-016-Mmp-Flow` | MMP RN → agent ledger | Same for RN | Same ledger risk |
| [ ] | `@TEST-014-Mmp-Flow` (cap) | Monthly MMP cap on ledger | Cap deduction ≤ configured max | Depends on ledger posting |
| [ ] | `@TEST-AGT-019` | Create agent valid credentials | Grid shows agent **Onboarding in Progress** | Thin master gate |
| [ ] | `@TEST-AGT-020` | Status stays Onboarding until email activation | Status not auto-Active | Same |

---

## 4. Manual / UI sanity (fill gaps automation does not gate)

Use when automated suite is green but release needs human eyes, or when a scenario is Blocked on known app/env issues.

### 4.1 Login & shell

- [ ] Ops manager login lands on expected home / dashboard
- [ ] Statement Upload (or Statement Processing) menu opens without blank module error
- [ ] Products, Agents, Payment, Transfer Sheet menus load headers (or run a short `@smoke` subset)

### 4.2 Statement processing module (SP — still mostly `@regression-test`)

Recommended **manual or tagged** sanity additions (see §6):

| Done | Case | Expected |
| --- | --- | --- |
| [ ] | **SP-001** Valid single-row NB | Upload → Waiting/Review → Complete → **Completed**; commission details match file |
| [ ] | **SP-005** Invalid format | Upload button disabled / Invalid file |
| [ ] | **SP-009** (or SP-003) NB+RN | Seed NB Completed; NB+RN file Completes (RN-only alone may Needs Attention) |
| [ ] | Optional: SP-007 partial NB+RN+RC | History: NB/RN no warning; RC warning icon |

### 4.3 Payment & history

- [ ] Create Payment enabled only when amount threshold met (~$25 — do not force-enable)
- [ ] Statement History search by file ID opens commission details for last Completed upload
- [ ] Transfer / ACH history shows authorized payment when transfer E2E ran

### 4.4 Negative / exception spot-checks (one each)

- [ ] Missing mandatory column → reject **or** Needs Attention (either acceptable per SP-004)
- [ ] Multi-NB in one file → Needs Attention (not silent Completed)
- [ ] Chargeback / cancellation surfaces on ledger (row present even if detail expand is flaky)

---

## 5. Known behaviors — triage before changing tests

Copy from live runs + `scripts/test_runner/app_behavior.json`. Check when classifying a failure.

| Behavior ID | Symptom | Treat as | Action |
| --- | --- | --- | --- |
| `advance-arf-product-seed` | Product not found in Advance Setup | **data_env** | Create product display name = Excel alias + Advance Setup row |
| `policy-cancellation-product-seed` | Cancellation flow can’t find product | **data_env** | Alias on Products + Advance Setup by display name |
| `serial-suite-module-load-transient` | “Failed to load module” / late Search box only in full suite | **data_env** | Re-run same tag in isolation; pass alone → escalate env, don’t edit assert |
| `extract-backend-error-class` | `waiting:Error:Extract` / processing timeout | **data_env / backend** | Capture status/stage; escalate; do not weaken extract ready poll |
| `mmp-ledger-rows-absent` | File Completes but no Type=mmp on ledger in 300s | **data_env / product** | Confirm MMP posting in env; escalate with ledger screenshot |
| `chargeback-detail-row-not-rendered` | CHARGEBACK row exists; detail empty / missing | **app-side** | Escalate to product; do not drop Agency/Agent/SL asserts |
| `commission-report-policy-commission-missing` | Can’t capture agent commission for period | **data_env** | HI-CR: POST Commission rule (not Override-only) |
| `create-payment-min-threshold` | Create Payment stays disabled | **product rule** | Amount below threshold — not a force-click bug |
| `purged-product-team-data` | Statement fixtures break after purge | **data_env** | Reseed simple E2E product + template |

**UI patterns (sanity runs):**

- Readonly dates → calendar helpers, never `.fill()`
- Filter changes → click **Apply** when bar visible
- Statement side panels → scroll AG Grid viewport, not MUI virtual scroller

---

## 6. Coverage improvements (recommended)

Current `@sanity` is strong on **e2e money paths**. Gaps vs statement-processing knowledge:

| Priority | Change | Why |
| --- | --- | --- |
| **P0** | Add `@sanity` to **SP-001** (`@TEST-001-Statement-Processing`) | Canonical Aetna ACA single-row NB gate; module not in `@sanity` filter today |
| **P1** | Add `@sanity` to **SP-009** or **SP-003** (one NB+RN Completed path) | Proves renewal auto-reconcile rule without full SP suite |
| **P1** | Add `@sanity` to **SP-005** (invalid format) | Cheap upload-gate; catches broken file validation |
| **P2** | Keep SP-002/004/006/007/008 + bulk BU-* on `@regression-test` only | Depth / time / data cost |
| **P2** | Optional thin payment-module ACH **or** CHK single create/authorize | Happy flow already covers payment; only if payment module ships independently |
| **P3** | Do **not** promote full MMP ledger scenarios until env posts Type=mmp | Avoid permanent red sanity |
| **P3** | Chargeback: keep in sanity but track app bug on detail expand separately | Suite stays honest |

**Suggested minimal release gate (if full `@sanity` too slow):**

1. Happy flow  
2. SP-001 (after tag)  
3. Advance-only ARF  
4. One policy-cancellation  
5. Chargeback (or mark Blocked if detail bug confirmed)  
6. Transfer-sheet E2E  
7. Agent create T019  

**Suggested full sanity:** entire `@sanity` tag list in §3 + SP-001/SP-005/SP-009 once tagged.

---

## 7. Sign-off

| Field | Value |
| --- | --- |
| Build / deploy / SPA SHA | |
| Environment | |
| Date | |
| Tester | |
| Command used | `python test-runner.py -g "sanity"` / `yarn test -g "@sanity" …` |
| Run id (artifacts) | |
| Automated Pass / Fail / Blocked counts | |
| Manual §4 completed? | Y / N |
| Known Blocked items (IDs) | |
| Release decision | **GO** / **NO-GO** / **GO with waivers** |

### Waiver log (if any)

| Scenario | Reason | Owner | Expiry |
| --- | --- | --- | --- |
| | | | |

---

## 8. Quick reference — feature paths

| Area | Feature file |
| --- | --- |
| Happy flow | `features/e2e-happy-flow/happy-flow-001.feature` |
| Commission truth | `features/e2e-commission-split/validate-commission-truth.feature` |
| Renewal statement | `features/e2e-commission-statements/statement-upload-renewal.feature` |
| Transfer E2E | `features/e2e-transfer-sheet/transfer-sheet.feature` |
| Advance only / recovery / adjustment / commission-only | `features/e2e-advance-*/` |
| Policy cancellation ×3 | `features/e2e-policy-cancellation-*/` |
| Chargeback | `features/e2e-chargeback/validate-chargeback.feature` |
| Commission report | `features/e2e-commission-report/` |
| MMP | `features/mmp/validate-mmp-flows.feature` |
| Agent create | `features/agent-master/create-agent.feature` |
| Statement processing (SP / bulk) | `features/statement-processing/` |

---

*Update this doc when `@sanity` tags change, when `app_behavior.json` gains new classes, or after a release sign-off that changes the minimal gate.*
