# ICM Test Automation — Presentation Deck

> Mermaid charts optimized for Google Slides (16:9). All diagrams use 3-row TB layout.

---

## Slide 1 — Title

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Input"]
        A["ICM Playwright BDD\nTest Automation"]
    end
    subgraph Row2["Row 2 — Two Tools"]
        B["Cursor IDE\nCode Authoring"]
        C["OpenCode CLI\nBrowser Exploration"]
    end
    subgraph Row3["Row 3 — Output"]
        D["Regression Suite\n388 Scenarios"]
    end
    Row1 --> Row2 --> Row3
```

**ICM Test Automation — Cursor + OpenCode Dual-Tool Approach**

---

## Slide 2 — Why Two Tools

```mermaid
flowchart TB
    subgraph Row1["Row 1 — User Action"]
        A["1. Explore app step-by-step\nProvide XPath / testid hints"]
    end
    subgraph Row2["Row 2 — Split Work"]
        B["Cursor IDE\n(free / BYO key)\nWrites: features, steps,\nPOM, context, test-data"]
        C["OpenCode CLI\n(free Zen models)\nExplores: live app,\nlocators, assertion text"]
    end
    subgraph Row3["Row 3 — Result"]
        D["Playwright BDD Runner\n→ HTML + Cucumber +\nSlack Reports"]
    end
    Row1 --> Row2 --> Row3
```

| Role | Tool | Why |
|---|---|---|
| **Code authoring** | Cursor | Full context, rules auto-injected, free |
| **Live app exploration** | OpenCode + Playwright MCP | Free Zen models, browser access |
| **Run & debug** | OpenCode (`/run-test`, `/fix-test`) | Agents + slash commands |
| **CI gate** | Playwright | `yarn test -g @<tag>` |

---

## Slide 3 — Architecture Overview

```mermaid
flowchart TB
    subgraph Row1["Row 1 — AI Tools"]
        B["Cursor IDE\n10 Rules + 6 Skills"]
        C["OpenCode CLI\n2 Agents + 9 Skills"]
    end
    subgraph Row2["Row 2 — Shared Codebase"]
        E["features/ + steps/\nGherkin + Step defs"]
        F["pages/ + locators/\nPOM + Assertions"]
        G["utils/ + test-data/\nContext + Excel Prep"]
    end
    subgraph Row3["Row 3 — Output"]
        H["playwright-report/\ncucumber-report/\nSlack summary"]
    end
    Row1 --> Row2 --> Row3
```

---

## Slide 4 — Cursor: Rules & Skills

```mermaid
flowchart TB
    subgraph Row1["Row 1 — 10 Rules (auto-injected)"]
        R1["step-conflict-\nresolution"]
        R2["feature-test-\ncase-ids"]
        R3["playwright-pom-\nstandard"]
        R4["assertion-\npatterns"]
        R5["bdd-contextual-\nassertions"]
    end
    subgraph Row2["Row 2 — More Rules"]
        R6["module-\nregression"]
        R7["escalate-\non-stuck"]
        R8["browser-discovery-\nopencode-mcp"]
        R9["package-\nscripts"]
        R10["agency-owner-\nrole-parity"]
    end
    subgraph Row3["Row 3 — 6 Skills (playbooks)"]
        S1["bdd-playwright-cli"]
        S2["bdd-contextual-\nassertions"]
        S3["fix-harvested-\ne2e-tests"]
        S4["statement-\nprocessing"]
        S5["validate-csv-\nbdd-coverage"]
        S6["playwright-cli\nreference"]
    end
    Row1 --> Row2 --> Row3
```

---

## Slide 5 — OpenCode: Agents & Skills

```mermaid
flowchart TB
    subgraph Row1["Row 1 — 2 Agents"]
        W["regression-writer\nWrites new BDD tests"]
        F["regression-fixer\nFixes failing tests"]
    end
    subgraph Row2["Row 2 — 9 Skills"]
        SK1["playwright-bdd-\nregression"]
        SK2["bdd-playwright-\ncli"]
        SK3["bdd-contextual-\nassertions"]
        SK4["fix-harvested-\ne2e-tests"]
        SK5["assertion-\npatterns"]
    end
    subgraph Row3["Row 3 — More Skills + Commands"]
        SK6["feature-test-\ncase-ids"]
        SK7["step-conflict-\nresolution"]
        SK8["statement-\nprocessing"]
        SK9["validate-csv-\nbdd-coverage"]
        C1["/run-test"]
        C2["/fix-test"]
    end
    Row1 --> Row2 --> Row3
```

---

## Slide 6 — Cost-Effective Workflow

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Discover"]
        A["1. Explore app\n(User + XPath/testid)"]
        B["2. Paste walkthrough\ninto Cursor prompt"]
    end
    subgraph Row2["Row 2 — Build"]
        C["3. Cursor writes\ncode (features,\nsteps, POM)"]
        D["4. OpenCode MCP\ndiscovers live locators"]
        E["5. Cursor finalizes\ncode with live data"]
    end
    subgraph Row3["Row 3 — Run"]
        F["6. Run test\nyarn test -g @<tag>"]
        G["7. /fix-test\nif fail (≤3 tries)"]
        H["Green ✅"]
    end
    Row1 --> Row2 --> Row3
```

| Step | Tool | Cost |
|---|---|---|
| 1–2. Explore + prompt | User + Cursor | Free |
| 3–5. Write + finalize | Cursor + OpenCode MCP | Free |
| 6–7. Run + debug | Playwright + OpenCode agent | Free |

---

## Slide 7 — Module Isolation Pattern

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Suite A: @smoke"]
        BA1["BeforeAll"] --> L1["Login once"] --> S1["Scenario 1\nScenario 2\nScenario N"] --> AA1["AfterAll"]
    end
    subgraph Row2["Row 2 — Suite B: @payment-module"]
        BA2["BeforeAll"] --> L2["Login once"] --> S2["ACH (8)\nCHK (8)"] --> AA2["AfterAll"]
    end
    subgraph Row3["Row 3 — Rule"]
        R["Each module tag = isolated browser context\nNo state leaks between modules"]
    end
    Row1 -.->|"isolated"| Row2
    Row1 --> Row3
    Row2 --> Row3
```

---

## Slide 8 — Page Object Model Standard

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Page Object (*Page.ts)"]
        LOC["loc map (all locators)"]
        NAV["open() / goto()"]
        ACT["click / select / type"]
    end
    subgraph Row2["Row 2 — Assertions + Context"]
        EXP["*Assertions.ts\nexpect* methods\n(read-only, no clicks)"]
        CTX["*Context.ts\nset*() / get*() / clear*()"]
    end
    subgraph Row3["Row 3 — Wiring"]
        FIX["fixtures.ts\nregister all pages"]
        TD["test-data/*.ts\nconfig + builders"]
        XL["*ExcelPrep.ts\nUID +1 per run"]
    end
    LOC --> EXP
    ACT --> CTX
    EXP --> FIX
    CTX --> TD
    TD --> XL
```

---

## Slide 9 — Test Architecture

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Input Files"]
        F["features/<module>/*.feature\nGherkin scenarios\n@TEST-{NNN} tags"]
        TD["test-data/<module>/*.ts\nconfig + builders"]
        XL["utils/*ExcelPrep.ts\nUID +1, persist template"]
    end
    subgraph Row2["Row 2 — Code"]
        S["steps/<module>/*.steps.ts\nGiven / When / Then"]
        P["pages/<module>/*Page.ts\nloc map + methods"]
        U["utils/<module>/*Context.ts\nset/get/clear state"]
    end
    subgraph Row3["Row 3 — Output"]
        R["Playwright BDD Runner"]
        HTML["playwright-report/"]
        CUKE["cucumber-report/"]
        SLACK["Slack summary"]
    end
    F --> S
    TD --> P
    XL --> R
    S --> P
    U --> S
    P --> R
    R --> HTML
    R --> CUKE
    R --> SLACK
```

---

## Slide 10 — Current Suite Stats

```mermaid
pie title Suite Distribution (388 Scenarios)
    "smoke (92)" : 92
    "agent-dashboard (68)" : 68
    "product-management (67)" : 67
    "agency-dashboard (47)" : 47
    "advance-regression (27)" : 27
    "dashboard (25)" : 25
    "payment-module (16)" : 16
    "user-management (15)" : 15
    "e2e suites (23)" : 23
    "edit-transaction (11)" : 11
    "other (7)" : 7
```

| Metric | Value |
|---|---|
| Feature files | 25 |
| Total scenarios | 388 |
| Module suites | 21 |
| E2E scenarios | 23 |
| Regression scenarios | 54 |
| Bug-tagged (`@bug`) | 5 |

---

## Slide 11 — E2E Phases

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Early Phases"]
        P1["Phase 1\nHappy Flow\n1 scenario"]
        P2["Phase 2\nStatement Processing\n9 scenarios"]
    end
    subgraph Row2["Row 2 — Core Phases"]
        P3["Phase 3\nAdvance E2E\n3 scenarios"]
        P4["Phase 4\nCommission E2E\n4 scenarios"]
    end
    subgraph Row3["Row 3 — Final Phases"]
        P5["Phase 5\nPolicy Cancellation\n3 scenarios"]
        P6["Phase 6\nTransfer Sheet\n1 scenario"]
    end
    Row1 --> Row2 --> Row3
```

| Phase | Scenarios | Status |
|---|---|---|
| Happy Flow | 1 | Written, not run |
| Statement Processing | 9 | SP-001 green live |
| Advance E2E | 3 | Written, not run |
| Commission E2E | 4 | Written, not run |
| Policy Cancellation | 3 | Written, not run |
| Transfer Sheet | 1 | Written, not run |

---

## Slide 12 — CI Pipeline

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Build"]
        A["git push"]
        B["yarn bddgen\nGenerate specs"]
        C["tsc --noEmit\nType gate"]
    end
    subgraph Row2["Row 2 — Test"]
        D["yarn test -g @smoke\n92 cases, fast fail"]
        E["yarn test\nFull suite, workers=3"]
    end
    subgraph Row3["Row 3 — Report"]
        F["Cucumber HTML\n+ Slack summary"]
        G["regression-fixer\n/debug/fix"]
    end
    Row1 --> Row2 --> Row3
```

---

## Slide 13 — One-Line Mental Model

```mermaid
flowchart TB
    subgraph Row1["Row 1 — Guard"]
        A["Rules = always-on guardrails"]
        B["Skills = how-to playbooks"]
    end
    subgraph Row2["Row 2 — Workers"]
        C["OpenCode agents = specialized workers"]
        D["Cursor = code authoring (free)"]
    end
    subgraph Row3["Row 3 — Eyes"]
        E["OpenCode = browser exploration (free Zen)"]
        F["Playwright MCP = eyes on live app"]
    end
    Row1 --> Row2 --> Row3
```
