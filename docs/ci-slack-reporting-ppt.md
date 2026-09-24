# ICM CI & Slack Reporting — Presentation Deck

> Mermaid charts for slides. Business-readable, optimized for Google Slides (16:9, 3-row TB layout).

---

## Slide 1 — Title

```mermaid
flowchart TB
    A["Code Push"] --> B["Automated Testing"]
    B --> C["Reports to Slack"]
```

**CI Trigger, Workflow & Slack Reporting**

---

## Slide 2 — How the Pipeline Works

```mermaid
flowchart TB
    A["Developer pushes code"] --> B["Build & validate specs"]
    B --> C["Run smoke tests (fast gate)"]
    C --> D["Run full regression suite"]
    D --> E["Collect results & failure evidence"]
    E --> F["Post summary to Slack channel"]
```

| Stage | What happens |
|---|---|
| **Push** | Developer pushes code to repo |
| **Build** | Generate test specs, type-check |
| **Smoke** | Quick gate — 92 critical cases |
| **Full Run** | 388 cases across 21 modules |
| **Collect** | Gather traces, screenshots, error context |
| **Notify** | Post to Slack with report attached |

---

## Slide 3 — What Gets Posted to Slack

```mermaid
flowchart TB
    A["Playwright finishes run"] --> B["Count passed / failed / flaky"]
    B --> C["Group results by feature"]
    C --> D["Build Slack message\nwith per-feature breakdown"]
    D --> E["Attach HTML report\n+ zip archive"]
```

**Slack message includes:**
- Red / green indicator
- Per-feature breakdown (counts + failed case IDs)
- Grand total (passed, failed, flaky, skipped)
- Duration and environment
- Attached `index.html` report

---

## Slide 4 — Slack Message Example

```mermaid
flowchart TB
    A["🔴 [icm preprod] Playwright run"] --> B["*Feature:* smoke\nTotal: 92  ✅ 90  ❌ 1  ⚠️ 1\nFailed: T001-SMK — Verify header"]
    B --> C["*Feature:* payment-module\nTotal: 16  ✅ 16  ❌ 0  ⚠️ 0"]
    C --> D["*Grand Total*\nTotal: 108  ✅ 106  ❌ 1  ⚠️ 1"]
    D --> E["HTML report attached\nEnv: preprod  Duration: 180s"]
```

---

## Slide 5 — When Things Fail

```mermaid
flowchart TB
    A["Test fails or is flaky"] --> B["Collect failure evidence\n(traces, screenshots, error messages)"]
    B --> C["OpenCode investigates\nvia browser automation"]
    C --> D["Write one-line reason\nper failed case"]
    D --> E["Post thread reply on\nSlack summary message"]
```

| Step | What happens |
|---|---|
| **Collect** | Gather trace files, error context from test results |
| **Investigate** | OpenCode agent opens browser, reproduces the failure |
| **Reason** | Write a plain-English reason for each failed case |
| **Reply** | Post as a thread on the original Slack message |

---

## Slide 6 — Thread Reply Example

```mermaid
flowchart TB
    A["🔴 [icm preprod] Playwright run\nGrand Total: 108 — 106 passed, 1 failed"] --> B["Thread reply:\nT008-ET: No Generate and Download when ACH tab has no transactions\n→ Expected Agent Level I + II ≥ 2, got \"1\""]
    B --> C["Action: @bug tag applied\nTest asserts spec behavior\nApp defect logged separately"]
```

---

## Slide 7 — Report Outputs

```mermaid
flowchart TB
    A["Test run completes"] --> B["playwright-report/index.html\nFull interactive report"]
    A --> C["cucumber-report/index.html\nBDD-style report"]
    A --> D[".ci/run-outcomes.json\nCounts + case IDs"]
    A --> E["Slack message\nSummary + attachments"]
```

| Output | Purpose |
|---|---|
| `playwright-report/` | Detailed test results with traces |
| `cucumber-report/` | BDD-formatted report |
| `.ci/run-outcomes.json` | Machine-readable results for automation |
| Slack message | Team visibility, no need to check CI logs |

---

## Slide 8 — Failure Context Collection

```mermaid
flowchart TB
    A["test-results/\nTraces, screenshots, errors"] --> B["Script collects failure evidence\nCapped at 55KB to stay cheap"]
    B --> C[".ci/failure-context.md\nArtifact inventory + error snippets"]
    C --> D["OpenCode reads this file\nto investigate failures"]
```

---

## Slide 9 — Configuration

```mermaid
flowchart TB
    A["Required: Slack bot token + channel ID"] --> B["Optional controls"]
    B --> C["Skip Slack entirely\n(debug mode)"]
    B --> D["Only post on failures"]
    B --> E["Zip + upload report archive"]
    B --> F["Custom label or env override"]
```

| Config | What it does |
|---|---|
| `SLACK_BOT_TOKEN` | Connects to your Slack workspace |
| `SLACK_CHANNEL_ID` | Target channel for reports |
| `SLACK_DISABLED` | Turn off Slack during debugging |
| `SLACK_NOTIFY_ON_FAILURE_ONLY` | Only post when something fails |
| `SLACK_UPLOAD_ZIP` | Include full report archive |

---

## Slide 10 — Safety Design

```mermaid
flowchart TB
    A["Reporter runs after every test"] --> B["Never throws errors"]
    B --> C["Never changes test exit code"]
    C --> D["If Slack config missing → silently skip"]
    D --> E["If upload fails → warn only, keep going"]
```

**Key principle:** The reporting system must never break the test pipeline, even if Slack is down or misconfigured.

---

## Slide 11 — End-to-End Summary

```mermaid
flowchart TB
    A["Code push"] --> B["Build & validate"]
    B --> C["Smoke test (fast gate)"]
    C --> D["Full regression"]
    D --> E["Collect results"]
    E --> F["Post to Slack"]
    F --> G["Thread reply with reasons\n(if failures found)"]
```

**Flow:** `push → build → smoke → full run → collect → Slack → investigate → reply`
