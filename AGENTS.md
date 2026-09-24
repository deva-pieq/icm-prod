# Cursor Instructions (ICM)

## Auto-Run on Generate

Once code is generated, run the test once immediately. One simple investigation + locator/wiring fix is allowed; if that does not fix it, escalate to a human immediately — do not keep guessing or retrying. See `.cursor/rules/escalate-on-stuck.mdc`.

## Excel Statement Prep (Customer UID)

Advance / policy-cancellation uploads need a **new** Customer UID each run, or the app shows renewal instead of the **New Policy** warning.

In `*ExcelPrep.ts` advance-payout prepare:

1. Increment Customer UID by +1 on every data row
2. Save timestamped copy under `.generated/`
3. **Also write the incremented workbook back to the template** (`writeFile(templatePath)`) so the next run advances again

Recovery / chargeback files reuse the stored PolicyNumber — do not invent a new UID.

Full rules: `.opencode/instructions.md` §5. Mirror modules: `advanceOnlyExcelPrep.ts`, `advanceRecoveryExcelPrep.ts`.

## Test Invocation

```powershell
python test-runner.py -g "sanity"              # collect + classify + fix (default ON)
python test-runner.py -g "sanity" --no-fix    # collect only
yarn test -g "@<module-tag>" --retries=0 --reporter=line
yarn bddgen
```

Do not use `npm run test:<module>` — those scripts do not exist. See `.cursor/rules/package-scripts.mdc`.

## Test Runner (sanity / regression collect + triage)

Python orchestrator — `-g` works like `yarn test -g` (aliases: `sanity`→`@sanity`, `smoke`→`@smoke`, `regression`→`@regression-test`, `T001-SMK`→`@TEST-001-smoke`):

```powershell
python test-runner.py -g "sanity"                 # GREEN if clean; else OpenCode fix (default)
python test-runner.py -g "sanity|regression"
python test-runner.py -g "T001-SMK"
python test-runner.py -g "@agency-dashboard" --no-fix
```

Internal: no failures → green; else fix; after 3 attempts/tag → escalate. Product missing / config gaps → skill `hail-intelligence`.

Artifacts: `.generated/test-runner/<run-id>/` (`failures.json`, `results.md`, `suite.log`; last **3** runs kept). Behavior map: `scripts/test_runner/app_behavior.json`. OpenCode: `/test-runner sanity` or agent `test-runner`. Skills: `test-runner`, `hail-intelligence`, `icm-app-behavior`, `fix-harvested-e2e-tests`.

## Page-entry readiness (`ensurePageReady`)

After navigation in page `open()` methods, use `ensurePageReady(page, readyMarker)` from `utils/pageLoader.ts` (settle → soft-check → one reload if missing → hard assert).

- **Do** use it for shell markers (heading, page root) at page entry only
- **Do not** wrap mid-scenario `toBeVisible` checks (modals, filters, grid rows, post-click UI) — reload wipes that state
- Keep `waitForAppSettled` after saves / in-page actions as before
