---
name: validate-csv-bdd-coverage
description: >-
  Audits manual CSV/Excel test cases against Gherkin feature files and step
  implementations. Verifies every CSV row has a matching scenario, every Expected
  Result maps to Then steps, and assertions are strong (not visibility-only). Use
  when authoring from CSV, reviewing automation coverage, or when assertions feel
  too weak. Cross-reference bdd-contextual-assertions for upgrade patterns.
---

# Validate CSV → BDD Coverage (ICM)

**Goal:** Prove that automation faithfully covers the manual test spec — every CSV row is a scenario, every Expected Result is a `Then`, and every `Then` asserts meaningful outcomes.

Run this skill **after** writing features from a CSV and **before** merging. Re-run after fixing gaps.

---

## When to invoke

- User provides or references a CSV/Excel manual test case file
- User asks "are all cases covered?", "missing scenarios?", "assertions too weak"
- After `regression-writer` harvests a module from spec
- Before signing off on a dashboard/module regression batch

---

## Phase 1 — Prepare inputs

| Input | Required | Notes |
|-------|----------|-------|
| CSV (or exported CSV from Excel) | Yes | `Sno, Scenarios, Steps, Expected result` |
| Target `.feature` file | Yes | Scenarios use trace IDs like `T001-AGT-FLT` |
| Step definitions `*.steps.ts` | Recommended | Maps `Then` text → page methods |
| Page object `*Page.ts` | Recommended | Scores assertion depth in `expect*` methods |

### CSV column format (primary)

Most ICM manual specs use this layout:

```csv
Sno,Scenarios,Steps,Expected result
1,Time Period filter panel displays radio options,Open agent dashboard,Time Period section displays all radio options; only one can be selected
4,Selecting time period refreshes widgets,Select Last Month and Apply,Viewing period shows last month range; all widgets refresh
```

| Column | Maps to |
|--------|---------|
| **Sno** | Row number → feature trace prefix `T001`, `T004`, … (`T` + zero-padded Sno) |
| **Scenarios** | Scenario title (fuzzy-matched to text after `T001-AGT-FLT —` in `.feature`) |
| **Steps** | `When` / `Given` steps in the scenario |
| **Expected result** | `Then` / `And` assertion steps |

### Alternate CSV formats

Header names are flexible (case-insensitive). The audit script also accepts:

| Purpose | Accepted headers |
|---------|-------------------|
| Serial | `Sno`, `S.No`, `Sr No`, `#` |
| Scenario text | `Scenarios`, `Scenario`, `Title` |
| Steps | `Steps`, `Test Steps`, `Procedure` |
| Expected | `Expected result`, `Expected Result`, `Expected outcome` |
| Explicit ID (optional) | `Test Case ID`, `TC ID` — use instead of Sno when present |

### How rows match feature scenarios

1. **Sno → trace prefix** — Sno `4` matches `Scenario: T004-AGT-FLT — …`
2. **Scenarios text** — fuzzy title match when Sno alignment fails
3. **Explicit ID** — `T004-AGT-FLT` in a `Test Case ID` column (if used)

Feature scenario example:

```gherkin
@agent-dashboard @global-filters @TEST-004-Agent-Dashboard-Filter-Actions
Scenario: T004-AGT-FLT — Selecting a time period and applying changes refreshes widgets
```

CSV row Sno `4` + Scenarios text maps to this scenario.

---

## Phase 2 — Run automated audit

From `projects/icm`:

```bash
node .cursor/skills/validate-csv-bdd-coverage/scripts/audit-csv-coverage.mjs \
  --csv <path-to-test-cases.csv> \
  --feature features/dashboard/agent-dashboard.feature \
  --steps steps/dashboard/agent-dashboard.steps.ts \
  --page pages/agent-insights/AgentDashboardPage.ts
```

Add `--json` for machine-readable output. Exit code `1` = gaps remain.

### What the script checks

1. **Scenario coverage** — every CSV row (by Sno → `T###` or Scenarios text) has a matching `Scenario:`
2. **Extra scenarios** — feature scenarios not matched by any CSV row (informational)
3. **Steps mapping** — each bullet in CSV Steps column has a `When`/`Given` with ≥35% keyword overlap
4. **Expected-result mapping** — each bullet in Expected result has a `Then`/`And` with ≥35% keyword overlap
5. **Assertion depth** — traces `Then` → step def → `expect*` method; flags visibility-only patterns

---

## Phase 3 — Manual review checklist

Automated checks catch structure; the agent must still verify semantics.

### A. CSV row → Scenario (1:1)

- [ ] Each CSV row (Sno) → exactly one `Scenario`
- [ ] Scenario title starts with `T{Sno padded to 3}-` (e.g. Sno 4 → `T004-AGT-FLT — …`)
- [ ] Scenario title body matches CSV **Scenarios** column text
- [ ] `@TEST-{NNN}-{Module}-{Area}` tag present and sequential per area
- [ ] CSV **Steps** → `When`/`Given` steps (order preserved where it matters)
- [ ] CSV **Expected result** → `Then`/`And` steps (one outcome per bullet)

### B. Expected Result → Then steps

For **each** Expected Result bullet in the CSV, confirm a matching `Then`/`And`:

| CSV Expected Result pattern | Required Gherkin |
|----------------------------|------------------|
| "displays / shows / visible" | `Then … is displayed` + content check |
| "selected by default" | `Then … is selected` / `toBeChecked` |
| "refreshes / updates dynamically" | `Then … refresh dynamically` + before/after |
| "date range matches …" | `Then viewing period shows …` with computed range |
| "table contains columns: A, B, C" | `Then` with DataTable or column assertion |
| "warning message …" | `Then` with exact message text |
| "equals sum of …" | `Then` with numeric relationship |
| "sorted descending" | `Then` with order assertion |

**Rule:** If CSV has N expected outcomes, the scenario needs **≥ N** distinct `Then`/`And` lines (Background steps don't count).

### C. Assertion strength (Then → code)

Cross-reference **`bdd-contextual-assertions`** skill. Reject:

| Weak | Upgrade to |
|------|------------|
| `toBeVisible()` only for "refreshes" | Capture before/after metric or date |
| `toBeAttached()` for radio list | `toBeChecked()` on selected + count options |
| `text.length > 0` | Pattern: `$`, `%`, date regex, column names |
| `expectWidgetsRefreshDynamically` with only widget visible | Compare viewing period or KPI value |
| Step def with no `expect*` call | Add page `expect*` method |

Trace the chain for every flagged `Then`:

```
.feature Then line
  → steps/*.steps.ts (Then handler)
    → pages/*Page.ts expect* method
      → Playwright expect() calls
```

---

## Phase 4 — Fix gaps (workflow)

### Missing scenarios

1. Add `Scenario: T###-MOD-SUB — <CSV title>` with correct `@TEST-*` tag
2. Translate CSV Test Steps → `When`/`And`
3. Translate each Expected Result → `Then`/`And`
4. Run `npx bddgen` — resolve step conflicts with page-name suffixes

### Missing Expected Result assertions

1. Split CSV Expected Result into atomic outcomes (numbered list, semicolons, newlines)
2. Add one `Then` per outcome — **do not bundle unrelated checks**
3. Implement `expect*` in page object; keep step defs thin
4. Re-run audit script

### Weak assertions

1. Read the CSV Expected Result for the exact promise
2. Upgrade page `expect*` per `bdd-contextual-assertions` Phase 3 patterns
3. If live text unknown → OpenCode `regression-writer` + Playwright MCP (not guess)
4. Re-run audit + targeted test: `yarn test -g "@TEST-…"`

---

## Phase 5 — Report template

Deliver this summary to the user after audit + fixes:

```markdown
## Coverage audit: <module>

| Check | Result |
|-------|--------|
| CSV cases | N |
| Scenarios in feature | N |
| Missing from feature | 0 |
| Expected-result gaps | 0 |
| Weak assertions | 0 |

### Fixed in this pass
- T004-AGT-FLT: added before/after widget refresh assertion
- T012-AGT-PO: mapped "shows $ value and description" to expectKpiCardContent

### Remaining / @bug
- T055-AGT-CS: app shows empty legend — asserted expected + `# @bug ICM-123`
```

---

## Worked example

**CSV row:**
```
Sno: 4
Scenarios: Selecting time period refreshes widgets
Steps: 1. Select Last Month 2. Click Apply
Expected result: 1. Viewing period shows last month range 2. All widgets refresh with filtered data
```

**Insufficient feature (reject):**
```gherkin
Scenario: T004-AGT-FLT — ...
  When I select the time period "Last Month" on agent dashboard
  And I click the Apply button on agent dashboard
  Then all dashboard widgets refresh dynamically on agent dashboard
```

Missing: viewing period assertion. "refresh dynamically" likely visibility-only.

**Acceptable feature:**
```gherkin
Scenario: T004-AGT-FLT — ...
  When I select the time period "Last Month" on agent dashboard
  And I click the Apply button on agent dashboard
  Then the viewing period shows last month's date range on agent dashboard
  And all dashboard widgets refresh dynamically on agent dashboard
```

With `expectViewingPeriodShowsLastMonth()` (computed range) and `expectWidgetsRefreshDynamically()` that compares captured KPI or date — not just `toBeVisible`.

---

## Validation loop

```bash
# 1. Coverage + assertion audit
node .cursor/skills/validate-csv-bdd-coverage/scripts/audit-csv-coverage.mjs \
  --csv <csv> --feature <feature> --steps <steps> --page <page>

# 2. Step conflicts
npx bddgen

# 3. Targeted run
yarn test -g "@TEST-001|@TEST-004"
```

---

## Related skills

| Skill | Role |
|-------|------|
| `bdd-contextual-assertions` | How to write strong `expect*` methods |
| `bdd-playwright-cli` / OpenCode MCP | Discover live assertion text |
| `fix-harvested-e2e-tests` | Fix failing tests after upgrades |
| `playwright-bdd-regression` | Module structure, test IDs, POM conventions |
