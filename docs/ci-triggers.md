# ICM CI Triggers — Complete Reference

All triggers in the ICM Playwright BDD pipeline.

---

## 1. Code Triggers

| Trigger | What it does | Why it helps |
|---|---|---|
| `git push` (main) | Runs full regression on merge to main | Catches regressions before they reach production |
| `git push` (PR) | Runs smoke + affected modules on pull request | Fast feedback before code review approval |
| `git push` (branch) | Developer can run tests locally on any branch | Verify changes before pushing |
| `repository_dispatch` `preprod-deployed` | Smoke after `icm-host-spa` preprod deploy | Validates live preprod build (not a deploy gate) |

---

## 2. Manual Triggers

| Trigger | What it does | Why it helps |
|---|---|---|
| `yarn test -g @<tag>` | Run a specific module from terminal | Quick verification during development |
| `yarn test -g @smoke` | Run 92 critical-path cases only | Fast pass/fail signal without full suite |
| `yarn bddgen` | Regenerate `.spec.ts` from `.feature` files | Required after any Gherkin or step text change |
| `yarn test` | Run all 388 cases across 21 modules | Full regression before release |
| `/run-test <tag>` | OpenCode slash command — runs module suite | One-command run from CLI without remembering syntax |
| `/fix-test <module>` | OpenCode agent — run, investigate, fix, re-run | Automated debug loop with up to 3 fix attempts |

---

## 3. Scheduled Triggers

| Trigger | What it does | Why it helps |
|---|---|---|
| Nightly cron (CI) | Runs full suite every night on preprod | Catches environment drift, data issues, API changes |
| Weekend full run | Extended run with all E2E phases | Deep regression not feasible during work hours |

---

## 4. Post-Test Triggers (Automatic)

| Trigger | What it does | Why it helps |
|---|---|---|
| `slack-reporter.ts` | Fires on `onEnd()` — parses results, posts to Slack | Team sees results instantly without checking CI logs |
| `ci-collect-failure-context.mjs` | Collects traces + error context after failure | OpenCode gets evidence to investigate without guessing |
| `ci-post-slack-summary.mjs` | Posts thread reply with OpenCode one-line reasons | Developers see root cause without opening test reports |
| `.ci/run-outcomes.json` write | Persists counts + failed/flaky case IDs | Downstream tools can read results programmatically |
| `.ci/slack-thread.json` write | Saves Slack message handle for thread replies | Thread replies land on the correct summary message |

---

## 5. Agent Triggers

| Trigger | What it does | Why it helps |
|---|---|---|
| `regression-fixer` agent | Reads `run-outcomes.json` + `failure-context.md`, investigates via MCP | Automated root-cause analysis without human triage |
| `regression-writer` agent | Writes new tests from spec/CSV with Playwright MCP discovery | Faster test creation with live-app verification |
| `escalate-on-stuck` rule | After 1 failed fix attempt, stops and escalates to human | Prevents infinite retry loops wasting time and tokens |

---

## 6. Environment Triggers

| Trigger | What it does | Why it helps |
|---|---|---|
| `SLACK_DISABLED=1` | Skips Slack notification entirely | Debug reporting without spamming the channel |
| `SLACK_NOTIFY_ON_FAILURE_ONLY=1` | Only posts when failures exist | Reduces noise on green runs |
| `SLACK_UPLOAD_ZIP=1` | Zips + uploads full report archive | Share detailed report without CI artifact access |
| `LOCK_CONFLICT` (app) | Another suite holds the reconcile lock | Test waits or skips — prevents false failures from env contention |

---

## Summary — Trigger Flow

```
Code push ──→ Build ──→ Smoke ──→ Full suite ──→ Post to Slack
                     ↓                         ↓
              bddgen + tsc         collect failure context
                                             ↓
                                    OpenCode investigates
                                             ↓
                                    Thread reply with reasons

icm-host-spa preprod deploy success ──→ repository_dispatch ──→ Smoke ──→ Slack
```

See also: [preprod-smoke-after-deploy.md](./preprod-smoke-after-deploy.md)

| Category | Count | When it fires |
|---|---|---|
| Code triggers | 4 | On push (main, PR, branch) + SPA preprod-deployed |
| Manual triggers | 6 | Developer runs from terminal or CLI |
| Scheduled triggers | 2 | Nightly / weekend cron |
| Post-test triggers | 5 | Automatically after every test run |
| Agent triggers | 3 | On failure or on-demand |
| Environment triggers | 4 | Config-driven skip/override |
| **Total** | **24** | |
