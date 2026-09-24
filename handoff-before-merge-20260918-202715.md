# icm-prod-automation — pre-merge handoff snapshot

> Baselines for merging the prod-adapted `test-prod/` suite into the root repo so root
> becomes the single prod regression suite. Generated 2026-09-18.

## Goal

Collapse `test-prod/` (prod-curated 15-feature slice) into the root so the root repo
IS the prod suite. One credential (ops-manager, env-driven) across the whole repo. All
root modules re-pointed at prod templates (products/agents), pre-prod data/behavior removed.
`test-prod/` and duplicate pre-prod template dirs removed (via recycle bin, no hard delete).

## Recovery on git replace attempt: USE RECYCLE BIN (no `rm` / hard delete)
If root gets wiped by `git replace --graft` etc., recover from elsewhere —
but DO NOT use hard deletes in this repo. Recycle any removed dir. See `.opencode/instructions.md` §18.

## Baselines

- Root = **pre-prod/pre-prod-adapted regression suite** (`https://preprod.app.pieq.ai/` default in
  `playwright.config.ts`, prod via `.env` `BASE_URL`). 44 root-only feature files vs test-prod's 15.
- `utils/loadEnv.ts` / `test-data` credential constants default to `deva.r@pieq.ai` /
  `saadiyamalan.a@pieq.ai` (pre-prod), ~20 files with hardcoded role-scoped emails
  (`deva.r@pieq.ai` agency 1, `deva.r+ag1/121876543`, `deva.r+ag2`, `deva.r+ag3/627389456`,
  `deva.r+ag+own`, `deva.r+sales`), `deva.r+ag3@pieq.ai` ops manager advance/agency3.
- **Credentials consolidation plan (env-driven, single ops manager):**

| Env var | Purpose | Used by |
|---|---|---|
| `E2E_EMAIL_AGENT` (e.g. `E2E_EMAIL_AGENT=deva.r+ag1@pieq.ai`) | agent role (was `E2E_EMAIL_AGENCY3`? see not for: pre-prod) | agent-master steps |
| `E2E_PASSWORD` | shared password | all |
| `E2E_EMAIL_AGENCY3` | ops manager / agency 3 | mmp, payment-module, advance-* steps |
| `E2E_EMAIL_ADVANCE` | advance / agency 1 | advance-* modules |
| `E2E_EMAIL_SALES_LEADER` | sales-leader dashboard:29 | sales-leader-dashboard |
| `E2E_EMAIL_OWNER` | agency owner | agency-owner steps |

> ROLE-SCOPED helpers (`opsManagerCredentials`, `advanceE2ECredentials`, `agentCredentials`,
> `salesLeaderCredentials`, `agencyOwnerCredentials`, `agency3OpsCredentials`,
> `salesLeaderDashboardCredentials`) all default to the ops-manager credential
> (env `E2E_EMAIL`) so the repo runs prod-safe as the OPS MANAGER with one env identity.

- Root shorthand for prod is `TestFiles-prod-sanity/`; test-prod rewires to `ProdTestFiles/`.
  Merge direction: point root at `TestFiles-prod-sanity/` (or merge contents), drop `test-prod/`.

## Credential rewiring (root)

**Rewire sites (file:line):** utils refs to `deva.r@pieq.ai` etc. must collapse to env-driven
ops-manager. Files: `utils/loadEnv.ts` (+`E2E_PASSWORD`, resolve `E2E_EMAIL`), `utils/loadEnv.ts`
role helpers (`opsManagerCredentials`, `agentCredentials`, `salesLeaderCredentials`,
`advanceE2ECredentials`→`agency3OpsCredentials`, `smokeCredentials`), `utils/loadEnv.ts:76,95-107`
(`E2E_EMAIL_ADVANCE`, `advanceE2ECredentials`, `agency3OpsCredentials`), test-data:
`test-data/advance-adjustment/validateAdvanceAdjustment.ts`,
`test-data/advance-consolidated?…`, plus every `deva.r@pieq.ai` in feature files, steps/*,
utils/*, test-data/*, README.md, handoff.md, docs.

## Prod template note (root TestFiles-prod-sanity)

Root's `TestFiles-prod-sanity/` (12 prod-safe module dirs) is the canonical prod template set;
`test-prod/ProdTestFiles/` is its clone. After merge, root `TestFiles/` becomes the prod template
set (canonical), `TestFiles-prod-sanity/` and `test-prod/` dirs are removed/recycled. Modules
with real prod templates: advance-only/adjustment/recovery, advance-addition, chargeback,
commission-only statements, happy-flow, mmp, policy-cancellation-agency-advance, -carrier-advance,
-carrier-agency-credit, statement-processing upload, transfer-sheet, payment-module.
(12 of the 16 root dirs have ProdTestFiles which map 1:1: `advance-adjustment`, `advance-only`,
`advance-recovery`, `advance-regression`(root `AdvanceAndAdjustment`…), `chargeback`, `commission-report`,
`commission-split`?, `dashboard`, `happy-flow`, `mmp`, `payment-module`, `policy-cancellation-agency-advance`,
`transfer-agent`, `statement-processing`; test-prod ProdTestFiles 12.)

## Modules kept in test-prod vs root (decision: fold prod behavior in root)

| Root module (1:1 feature) | test-prod keeps? | note |
|---|---|---|
| advance-only (+) | yes | `validate-advance-only.feature` → prod `e2e-advance-only` |
| advance-commission-only | yes | `validate-commission-only` → `e2e-advance-commission-only` |
| advance-recovery / advance-recovery-regression | yes | `validate-advance-recovery` → `e2e-advance-recovery` |
| advance-adjustment / advance-adjustment-regression | yes | `validate-advance-adjustment` → `e2e-advance-advance-adjustment`? prod name `e2e-advance-adjustment` |
| chargeback | yes | `validate-chargeback` → `e2e-chargeback` |
| policy-cancellation-agency-advance | yes | `validate-policy-cancellation-with-agency-advance` → `e2e-policy-cancellation-agency-advance` |
| policy-cancellation-agency-credit | yes | → `e2e-policy-cancellation-agency-credit` |
| policy-cancellation-carrier-advance | yes | → `e2e-policy-cancellation-carrier-advance` |
| commission-report | **no** (excluded per directive) | pre-prod-only, keep in root? |
| commission-split | **no** (excluded) | pre-prod-only |
| pipeline-master / dashboard | no | root-only |
| products / users / carriers / user-mgmt | no | root-only |

## Remaining ambiguity

- Whether modules with NO prod template (PaymentModule, StatementProcessing, InvalidUploadFiles,
  MmpTemplate conflicts) should keep pre-prod content — user: keep "unaffected", handle later.
