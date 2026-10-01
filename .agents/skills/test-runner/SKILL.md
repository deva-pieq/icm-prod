---
name: test-runner
description: >-
  Orchestrate ICM BDD suite runs via Python test-runner.py (-g like yarn test),
  classify failures, hand off to OpenCode regression-fixer, escalate unresolved
  into results.md. Use when user says Test Runner, run sanity/smoke/regression,
  /test-runner, or asks to collect+fix E2E failures.
---

# Test Runner (collect → classify → fix / escalate)

## Entry CLI (from `projects/icm`)

```powershell
python test-runner.py -g "sanity"                 # fix ON by default
python test-runner.py -g "sanity|regression"
python test-runner.py -g "T001-SMK"
python test-runner.py -g "@agency-dashboard" --no-fix
python test-runner.py -g "@smoke-prod" --collect-only  # same as --no-fix
```

Aliases: `sanity` → `@sanity-prod`; `smoke` → `@smoke-prod`; `regression` → `@regression-test`; `T001-SMK` → `@TEST-001-smoke-PROD`.
`-g` otherwise passes through like `yarn test -g`.

Entry: project-root `test-runner.py`. Helpers: `scripts/test_runner/`.

Always uses `--retries=0 --reporter=line`. Artifacts under `.generated/test-runner/<run-id>/`:
`suite.log`, `failures.json`, `results.md` (run snapshot may include `app_behavior.json`).
Runner keeps **last 3** timestamped run dirs; older pruned automatically.

## Internal loop (binding)

```
collect → classify
failed==0          → GREEN — exit (no OpenCode)
else               → FIX (default ON; --no-fix / --collect-only to skip)
per tag ≤ 3 tries  → evidenced fix + verify
tries exhausted    → ESCALATE into results.md
```

Never weaken asserts. Skills: `test-runner`, `hail-intelligence`, `icm-app-behavior`, `fix-harvested-e2e-tests`.

## Workflow

1. Run `python test-runner.py -g "…"` (collect + classify + fix by default).
2. Read `failures.json` + `results.md`. **Gate:** `failed>0` with `failures: []` = parser bug — stop; do not pretend green.
3. **Bug-vs-test gate** (binding):
   - Read POM `loc` map first.
   - HI-P product missing → `hail-intelligence` (create product + commission template).
   - HI-C config missing → mirror transfer-sheet / smoke.
   - Tier 1 signals → one inline fix → verify once.
   - Else MCP via OpenCode `regression-fixer` before editing.
   - `app_bug` / unreseedable `data_env` → escalate; never weaken asserts.
4. Max **3** distinct evidenced attempts per tag → escalate.
5. Update `scripts/test_runner/app_behavior.json` only with MCP-proven facts.
6. Finalize Escalated table + recommendations in `results.md`.

## Cursor vs OpenCode

- **Cursor:** `python test-runner.py -g "…"` (fix default). Tier-2 → `opencode run --agent regression-fixer --auto "…"`.
- **OpenCode:** agent `test-runner` after collect; MCP in-process or spawn fixer. Load `hail-intelligence` for product/config gaps.

## Taxonomy / behavior

- `scripts/test_runner/taxonomy.json` — Tier 1/2/3 signals (incl. `product_missing` HI-P, `config_missing` HI-C)
- `scripts/test_runner/app_behavior.json` — canonical living map (+ `app_behavior.seed.json` bootstrap)
- Patterns A–T: `fix-harvested-e2e-tests` skill
- Data/setup: `hail-intelligence` skill
- History: `REGRESSION_FIX_PLAN.md`

## Constraints

- No new package.json scripts; invoke Python / yarn directly.
- `yarn bddgen` after Gherkin/step text changes.
- Methods use `this.loc.*` only; MCP `count === 1` before persist.
- Exclude `@slack-reporter-sample|@local-only` on full regression (script auto-invert).
