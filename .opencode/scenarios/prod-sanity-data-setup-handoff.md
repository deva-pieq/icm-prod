# Handoff — ICM @sanity Prod Data Setup

**Session:** `ses_f56b7a959ffe92xR5E3g87qSjX` · Prod Data Setup for Sanity Tests  
**Updated:** 2026-09-16 (resume instructions from user)

## Objective

Seed `https://icm.pieq.ai` so `@sanity` can run. Repo stays preprod-primary (`.env` untouched). Prod creds used only for seeding/runs.

**Prod login:** `saadiyamalan.a@pieq.ai` (Ops Manager) — password in prior session / user-provided.

**Runtime overrides (do not edit `.env`):**
```
BASE_URL=https://icm.pieq.ai/
E2E_EMAIL / E2E_EMAIL_* / E2E_EMAIL_ADVANCE / E2E_EMAIL_AGENCY3 = saadiyamalan.a@pieq.ai
E2E_PASSWORD=<prod password>
```

## User resume decisions (2026-09-16)

1. **Statement type trial:** use **Aetna ACA** wherever tests need `Aetna ACA` / `MLB`. If upload/select fails → **stop and tell human** (they will fix statement setup in backend). Do **not** invent statement setups.
2. **Agents:** create missing agents; **edit existing** AgentX (`600011`) name with `test-` prefix (e.g. `test-AgentX` / keep NPN).
3. **Products:** `test-` prefix on product **name + alias** only.
4. Then configure advance setup + transfer sheet.
5. Create **separate folder** for prod sanity test files + README.

## Locked seed map

| Role | Preprod | Prod |
|---|---|---|
| Advance alias | `aetna-aca-test-advance-month-july-21` | `test-aetna-aca-test-advance-month-july-21` |
| Chargeback/payment alias | `aetna-test-product-001` | `test-aetna-test-product-001` |
| Transfer/MMP product | `Aetna-Test-Product` / `2025-jan-1-aetna-test-001` | `test-Aetna-Test-Product` / `test-2025-jan-1-aetna-test-001` |
| Happy-flow | self-seeds | also pre-create `test-` product (Aetna/Health/U65-ACA, template `ACA - Carrier with OVR - Regular`, slabs 10) |

**Agents to ensure (NPN unchanged):**

| NPN | Name (apply `test-` prefix on display name) | Notes |
|---|---|---|
| `600011` | edit existing → `test-AgentX` (was AgentX Test, LVL5) | exists; flag LVL5 vs preprod L1 |
| `120876543` | `test-Test Transfer Agent` (or `test-` + first/last) | create |
| `0987654321` | `test-DevaTest Agent` | create |
| `90065` | `test-TestAgent0065` LVL1 | create |
| `600001` | payment ACH | create |
| `600002` | payment CHK | create |
| `600003` | chargeback Level III | create |

## Prod inventory (already done)

- Products 541 — targets **missing**
- Agents: only `600011` exists
- Advance setup 43 — target missing
- Transfer sheet **0 rules**
- Statement setup: has **Aetna ACA**; missing Aetna ACA / MLB → **trial Aetna ACA**

## Todo (updated 2026-09-16 Cursor resume)

- [x] Read all @sanity configs + POMs
- [x] Load hail-intelligence + statement-processing
- [x] Inventory prod
- [x] Create `test-` products (advance, chargeback/payment, transfer/MMP, happy-flow) — product type **ACA**
- [ ] Commission structures on those products (still open)
- [x] Create missing agents; edit `600011` → `test-AgentX`
- [x] Advance setup default=100 monthly=50 for `test-aetna-aca-advance-july-21`
- [x] Transfer sheet Active 09/16/2023 — `test-Agent Test Transfer` + `test-Aetna-Test-Product`  
      (URL `/commission-statement-processing/transfer-sheet`)
- [x] `TestFiles-prod-sanity/` + README + alias rewrite script
- [ ] Activate / level newly created agents (Onboarding / No Level)
- [ ] Clean `.opencode/tmp-dump*.mjs`
- [ ] Backend: add statement setups Aetna ACA / MLB if Aetna ACA trial fails

## Pitfalls

- `AdvanceSetupPage.selectProduct()` picks **first** dropdown option — select target product explicitly.
- Do not disturb non-test prod data (`Sample_Product`, `e2e-seed-carrier-*`).
- Hardcoded feature strings (`Aetna-Test-Product`, `Aetna ACA`) → document mapping in README (Aetna ACA trial).

## Next actions (order)

1. Login prod as saadiya
2. Edit agent `600011` name → `test-` prefix; create 6 missing agents
3. Create 4 `test-` products + commission structures
4. Advance setup default+monthly for advance product
5. Transfer sheet rule
6. Prod folder + rewrite + README
7. If any statement-type select fails on Aetna ACA → escalate to human
