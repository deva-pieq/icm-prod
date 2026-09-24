---
description: Run failing BDD tests, analyze output, and fix until green. Usage: /fix-test <module-tag> [optional grep pattern]
agent: regression-fixer
---

Fix failing Playwright BDD tests for the given module.

## Arguments

- `$1` — module tag (e.g. `agency-dashboard`, `user-management`, `smoke`)
- `$2` — optional Playwright `--grep` pattern (e.g. `@TEST-AGD-001|@TEST-AGD-004`)

## Steps

1. From `projects/icm`, run targeted tests:
   ```
   yarn test -g "@$1"
   ```
   If `$2` provided, narrow to specific scenarios:
   ```
   yarn test -g "@$1" -- --grep "$2"
   ```

2. Follow `fix-harvested-e2e-tests` skill: triage failures, investigate with Playwright MCP, edit `.feature` / steps / page objects as needed.

3. Re-run until targeted failures pass or remaining failures are confirmed app bugs (`@bug`).

4. Report root causes, changes, and re-run command.

**Note:** Single-module fix only. For collect + classify + fix/escalate loop use `/test-runner` or `python test-runner.py -g "…"`.
