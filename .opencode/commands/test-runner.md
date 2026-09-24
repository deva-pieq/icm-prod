---
description: >-
  Collect suite with python test-runner.py -g, classify, fix Tier1/2 (default),
  escalate rest. Usage: /test-runner <grep>
agent: test-runner
---

Run the ICM Test Runner loop for `$1` (Playwright-style grep; aliases supported).

## Arguments

- `$1` — grep expr: `sanity` (=`@sanity` e2e), `smoke` (=`@smoke`), `sanity|regression`, `T001-SMK`, `@agency-dashboard`, …

## Steps

1. From `projects/icm`:
   ```powershell
   python test-runner.py -g "$1"
   ```
   Fix is **default ON**. Use `--no-fix` only if user asks collect-only.
2. Read `.generated/test-runner/*/failures.json` and `results.md` (see `LATEST_RUN.txt`).
3. `failed==0` → report GREEN. Else follow `test-runner` + `hail-intelligence`: product missing → create product + commission template; config missing → mirror transfer-sheet/smoke; max 3 attempts then escalate.
4. Use `icm-app-behavior` + `fix-harvested-e2e-tests`. Never weaken assertions.
5. Report Summary + Escalated table + recommendations to the user.

For single-module fix-only without collect orchestration, use `/fix-test` instead.
