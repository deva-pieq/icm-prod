# Prod Sanity Test Files

Separate templates for running `@sanity` against **prod** (`https://icm.pieq.ai`).  
Repo `.env` stays preprod-primary — use runtime overrides below.

## Statement type trial

Prod Statement Setup has **Aetna ACA** but not `Aetna ACA` / `MLB`.

**Trial:** use **Aetna ACA** at upload for modules that normally select Aetna ACA or MLB.  
If select/upload fails → stop; fix statement setup in backend (do not invent setups in UI).

## Seed map (prod)

### Products (name + alias prefixed `test-`)

| Role | Product name | Carrier product name (alias) | Code |
|---|---|---|---|
| Advance (AO/AR/AA/CO) | `test-aetna-aca-advance-july-21` | `test-aetna-aca-test-advance-month-july-21` | `TEST-ADV-JUL21` |
| Chargeback / payment | `test-aetna-test-product-001` | `test-aetna-test-product-001` | `TEST-AETNA-001` |
| Transfer / MMP / statement upload | `test-Aetna-Test-Product` | `test-2025-jan-1-aetna-test-001` | `TEST-AETNA-XFER` |
| Happy-flow (pre-seed) | `test-happy-flow-aca-u65` | `test-2026-sep-16-happy-flow-aca-u65` | `TEST-HF-ACA-U65` |

Prod product type dropdown uses **`ACA`** (not `U65 - ACA`). Carrier **Aetna**, LOB **Health**.

### Agents (`test-` display names; NPNs unchanged)

| NPN / Agent ID | Display name | Notes |
|---|---|---|
| `600011` | `test-AgentX Test` | Edited existing; **LVL5** (preprod was Level I) |
| `120876543` | `test-Agent Test Transfer` | Created; Onboarding / No Level |
| `0987654321` | `test-DevaTest Agent` | Created; Onboarding / No Level |
| `90065` | `test-TestAgent 0065` | Created; Onboarding / No Level |
| `600001` | `test-Pay ACH` | Created; Onboarding / No Level |
| `600002` | `test-Pay CHK` | Created; Onboarding / No Level |
| `600003` | `test-Chargeback Agent` | Created; Onboarding / No Level |

New agents may need **level + Active** before payment/transfer/advance eligibility works.

## Template rewrites

Copied from `TestFiles/` (no `.generated`). Alias cells rewritten to `test-` values via:

```powershell
node scripts/prep-prod-sanity-testfiles.mjs
```

Report: `_rewrite-report.json`.

## How to run against prod

```powershell
$env:BASE_URL='https://icm.pieq.ai/'
$env:E2E_EMAIL='saadiyamalan.a@pieq.ai'
$env:E2E_EMAIL_OWNER='saadiyamalan.a@pieq.ai'
$env:E2E_EMAIL_AGENT='saadiyamalan.a@pieq.ai'
$env:E2E_EMAIL_ADVANCE='saadiyamalan.a@pieq.ai'
$env:E2E_EMAIL_AGENCY3='saadiyamalan.a@pieq.ai'
$env:E2E_PASSWORD='<prod password>'
# Point module template dirs at this folder OR copy paths in test-data — until wired, swap TestFiles manually.

yarn test -g "@sanity" --retries=0 --reporter=line
```

## Feature-string mapping (no fork)

| Hardcoded in features | Prod seed |
|---|---|
| `Aetna-Test-Product` | `test-Aetna-Test-Product` |
| `Test Transfer Agent` | `test-Agent Test Transfer` |
| `Aetna ACA` / `MLB` statement type | **Aetna ACA** (trial) |
| `deva.r@pieq.ai` | override via `E2E_EMAIL*` |

## Config checklist

- [x] Advance setup: product `test-aetna-aca-advance-july-21` — default **100**, monthly **50**
- [x] Transfer sheet: Active rule, effective **09/16/2023**, agent `test-Agent Test Transfer` (NPN 120876543) + `test-Aetna-Test-Product`  
  URL: `/commission-statement-processing/transfer-sheet` (not `/settings/transfer-sheet`)
- [ ] Commission structures on products (template `ACA - Carrier with OVR - Regular` where needed) — **not done yet**
- [ ] Agent levels / Active status for payment & transfer agents (still Onboarding / No Level)

## Statement type note for human

Prod missing **Aetna ACA** / **MLB** statement setups. Trial path = **Aetna ACA**. If upload `selectStatementType` fails on Aetna ACA for U65/MLB modules → fix in backend.

## Handoff

See `.opencode/scenarios/prod-sanity-data-setup-handoff.md`.
