---
name: bdd-contextual-assertions
description: Add strong, scenario-specific Playwright BDD assertions (headings, modals, grids, inputs, columns, filter outcomes, before/after values). Use ALWAYS when writing or editing .feature files, step definitions, page objects, or fixing weak tests that only check visibility. After CSV-to-feature authoring, run validate-csv-bdd-coverage to audit Expected Result mapping and assertion depth. Discover live text via playwright-cli first; Playwright MCP only as exploratory fallback.
compatibility: opencode
---

# BDD Contextual Assertions (ICM)

**Default rule:** Every `Then` step must assert **meaningful outcome**, not just that an element exists. If a scenario says "displays", "shows", "refreshes", "equals", or "contains" — the implementation must verify the **specific content, value, or relationship** implied by that wording.

Weak tests that only pass `toBeVisible()` are bugs waiting to ship.

---

## When this skill applies (always)

Invoke for **every** change to:
- `features/**/*.feature`
- `steps/**/*.steps.ts`
- `pages/**/*Page.ts` / `*Assertions.ts`

Even when "just wiring steps" or "harvesting locators" — finish by asking: **what should this scenario prove?**

---

## Phase 1 — Read the scenario intent

For each `Then` line, classify the assertion type:

| Scenario wording | Required assertion depth |
|------------------|------------------------|
| "X is displayed" / "widget shows" | Heading/region visible **+** identifying content (not empty) |
| "shows description …" | Exact or contains text match on live string |
| "date range matches …" | Computed range OR regex on formatted dates |
| "refreshes dynamically" | **Before/after** value or date changed after filter |
| "legend shows labels with $ and %" | Each legend item matches `/\$.*%/` |
| "table contains columns: …" | AG Grid/header cells match each column name |
| "equals the sum of …" | Numeric extraction + math within tolerance |
| "only shows selected …" | Legend/rows count + label set matches selection |
| "warning message …" | Exact message text after triggering action |
| "popup/panel is displayed" | Modal visible **+** heading matches context |
| "input accepts valid dates" | `toHaveValue()` on both fields after fill |
| "sorted in descending order" | Parse ordered values; assert `a >= b` for pairs |

If the Gherkin promise is stronger than your `expect`, **upgrade the assertion** or **narrow the Gherkin** — never leave a gap.

---

## Phase 2 — Live app: discover what to assert (before coding)

Use **playwright-cli** when you don't know exact live text, column set, grid row shape, or post-action values. Use **Playwright MCP** only if CLI cannot answer after a focused attempt (see fallback below).

### Decision gate

| Already know from POM/code? | Action |
|----------------------------|--------|
| Yes — locator + prior harvest | Assert directly |
| Partial — locator exists, text unknown | CLI `eval --raw` for text/headers only |
| No — new widget/modal/grid | CLI harvest + scoped snapshot; MCP if still unclear |

### Token-efficient playwright-cli workflow

1. **One session, one navigation** — `npx playwright-cli -s=bdd-<module>` (login once, `state-save`).
2. **Reproduce the scenario action** (open filter, click card, switch tab) via `click` / `run-code`.
3. **Harvest assertion targets** with `eval --raw` (pipe to file; prefer over full snapshot):

```bash
npx playwright-cli -s=bdd-<module> --raw eval "() => [...document.querySelectorAll('h1,h2,h3,[role=heading]')].map(el => ({ level: el.tagName, text: el.textContent?.trim() }))"
npx playwright-cli -s=bdd-<module> --raw eval "() => [...document.querySelectorAll('.ag-header-cell-text')].map(el => el.textContent?.trim())"
```

Equivalent evaluate snippets (for `run-code` or MCP fallback):

```js
// Headings in scope
() => [...document.querySelectorAll('h1,h2,h3,[role=heading]')]
  .map(el => ({ level: el.tagName, text: el.textContent?.trim() }))

// AG Grid columns
() => [...document.querySelectorAll('.ag-header-cell-text')]
  .map(el => el.textContent?.trim())

// Input values in a container
(root) => [...root.querySelectorAll('input,textarea')]
  .map(el => ({ testid: el.closest('[data-testid]')?.getAttribute('data-testid'), value: el.value }))

// List/legend rows
() => [...document.querySelectorAll('[data-testid="agency-owner-revenue-by-product-card"] ul li')]
  .map(el => el.textContent?.trim())
```

4. **Scoped snapshot** only when structure is unclear — `snapshot --depth=4 --filename=locators/_snap.yaml`; grep the file, don't paste into chat.
5. **Write exact strings** from live app into assertion methods (punctuation matters: `–` vs `-`).
6. **Persist** discovered selectors in POM `loc` map; browser discovery is one-time per widget.

### Playwright MCP — exploratory fallback

Use MCP (`browser_evaluate`, scoped `browser_snapshot`) **only when**:

- CLI `eval`/`run-code` did not surface the needed structure after 1–2 focused attempts
- Widget has no `data-testid` and role/text tree exploration via refs is required
- User explicitly requests MCP exploratory debugging

When using MCP: prefer `browser_evaluate` → small JSON; scope snapshots with `target` + `depth`; offload to `{ filename }`.

---

## Phase 3 — Assertion patterns by UI context

### A. Page / section headings

```typescript
await expect(this.loc.sectionHeading(/Key Metrics/i)).toBeVisible({ timeout: T });
// Also assert section is non-empty:
const text = await this.loc.keyMetricsRegion().innerText();
expect(text.length).toBeGreaterThan(0);
expect(text).toMatch(/\$/); // when financial section
```

### B. Modal / sidebar panel

Assert **container + title + primary content**:

```typescript
await expect(this.loc.grossCommissionModal()).toBeVisible({ timeout: T });
await expect(this.page.getByRole('heading', { name: /Total Revenue Breakdown/i })).toBeVisible();
await expect(this.loc.grossCommissionSummaryGrid()).toBeVisible();
```

Close modal in scenario after assertions (paired step).

### C. AG Grid (summary + detail tables)

```typescript
const headers = await grid.locator('.ag-header-cell-text').allTextContents();
const normalized = headers.map(h => h.trim().toLowerCase());
expect(normalized.some(h => h.includes('name'))).toBe(true);
expect(normalized.some(h => h.includes('commission'))).toBe(true);

const rowCount = await grid.locator('.ag-row').count();
expect(rowCount, 'Grid should have data rows').toBeGreaterThan(0);
```

Discover column names via CLI/MCP once; encode in `expect*TableColumns(expected: string[])`.

### D. Input / date fields

```typescript
await expect(startDate).toBeVisible();
await startDate.fill('2026-01-01');
await expect(startDate).toHaveValue('2026-01-01'); // assert value, not just fill
```

### E. Filters — state + outcome

Filter tests need **two layers**:
1. **Control state:** radio checked, checkbox checked/unchecked
2. **Outcome:** viewing period text, metric value, legend labels changed

```typescript
// BAD — only checks visibility
async expectWidgetsRefreshDynamically() {
  await expect(this.loc.keyMetricsRegion()).toBeVisible();
}

// GOOD — captures before, acts, asserts after
const before = await this.getGrossCommissionNumericValue();
await this.selectTimePeriod('Last Month');
const after = await this.getGrossCommissionNumericValue();
expect(after).not.toBe(before); // or direction per scenario
```

Use `utils/<module>/dashboardContext.ts` for cross-step capture (`setCaptured*` / `getCaptured*`).

### F. Legend / list items

```typescript
const labels = await this.getRevenueLegendLabels();
expect(labels.length).toBeGreaterThan(0);
for (const label of labels) {
  expect(label).toMatch(/\$/);
  expect(label).toMatch(/%/);
}
// When filtered to 2 carriers:
expect(labels.length).toBeLessThanOrEqual(2);
expect(labels.some(l => l.includes('Aetna'))).toBe(true);
```

### G. Ordered data (Top Performers, rankings)

```typescript
const values = await this.getPerformerRevenueValues(); // extract $ amounts in order
for (let i = 0; i < values.length - 1; i++) {
  expect(values[i]).toBeGreaterThanOrEqual(values[i + 1]);
}
```

### H. Numeric relationships (sums, percentages)

```typescript
expect(Math.abs(sumOfRolePercentages - 100)).toBeLessThan(1);
// Currency: parse with shared helper, compare with tolerance
expect(Math.abs(total - sumOfRoles)).toBeLessThan(0.01);
```

### I. Text aliases (UI vs Gherkin)

When feature says `Sub-agents` but UI shows `Sub Agent`, normalize in page object:

```typescript
const COMMISSION_ROLE_DISPLAY_ALIASES: Record<string, string> = {
  'Sub-agents': 'Sub Agent',
  'Sub-agent': 'Sub Agent',
};
```

---

## Phase 4 — Implementation rules

### Where assertions live

| Scope | Location |
|-------|----------|
| Single page, stable checks | `*Page.ts` → `expect*` / `assert*` methods |
| Cross-page or multi-step compare | `*Assertions.ts` |
| Step definition | Thin — calls page `expect*` only |
| Cross-step values | `utils/<module>/*Context.ts` |

### Method rules (from POM standard)

- `expect*` methods are **side-effect-free** — read + `expect()` only
- Setup actions belong in `When` / interaction methods (`selectTimePeriod`, `clickMetricCard`)
- Return readers (`getMetricCardValue`, `getRevenueLegendLabels`) separate from assertions
- Use `smokeStepTimeoutMs` (`T`) on visibility waits

### Gherkin ↔ implementation alignment

Every `Then` in `.feature` must map to an `expect*` with matching strength:

```gherkin
Then the breakdown popup shows a Category summary table with Amount and % of Total columns
```

```typescript
// Must verify columns exist — not just grid visible
await expect(this.loc.grossCommissionSummaryGrid()).toBeVisible();
const headers = await this.loc.grossCommissionSummaryGrid()
  .locator('.ag-header-cell-text').allTextContents();
expect(headers.join(' ').toLowerCase()).toMatch(/category/);
expect(headers.join(' ').toLowerCase()).toMatch(/amount/);
expect(headers.join(' ').toLowerCase()).toMatch(/%|of total/);
```

---

## Phase 5 — Anti-patterns (reject these)

| Anti-pattern | Why it fails | Fix |
|--------------|--------------|-----|
| `toBeVisible()` only for "refreshes dynamically" | Proves nothing changed | Before/after capture |
| `text.length > 0` | Passes on loading/error text | Pattern match (`$`, `%`, date regex) |
| `labels.length > 0` for legend | Doesn't verify content | Per-item `$` and `%` checks |
| Assert feature wording without live harvest | Hyphen/em-dash mismatch | Harvest live string via CLI |
| Assert in step file directly | Unmaintainable | Move to page `expect*` |
| Click inside `expect*` method | Violates POM standard | Split interaction + assertion |
| Hard-code volatile counts/dates | Flaky | Assert structure/range/pattern |
| Skip assertion because `@bug` | Only tag known **app** bugs | Still assert expected behavior |

---

## Phase 6 — Agency dashboard assertion upgrade checklist

When touching agency dashboard tests, verify each area:

- [ ] **Time period** → viewing period text matches `computeExpectedDateRange(option)`
- [ ] **Filter deselect** → gross commission ≤ captured initial (or zero when all carriers off)
- [ ] **KPI cards** → `$` value + description substring per card
- [ ] **Gross commission modal** → heading + summary columns + detail grid visible
- [ ] **Revenue pie** → legend items have name + `$` + `%`; filtered legend matches selection
- [ ] **Commission roles** → each role shows `$`, `%`, people count; percentages sum ≈ 100
- [ ] **Role detail modal** → summary metrics + performers grid columns (Name, Level, Policies, Commission)
- [ ] **Top performers** → descending revenue order; split shows `%`
- [ ] **Revenue trend** → trend line labels present in chart card text
- [ ] **Warning on empty filters** → exact message after Apply

---

## Phase 7 — Worked example: upgrading a weak step

**Feature:**
```gherkin
Then all dashboard widgets refresh dynamically based on the selected LOBs
```

**Weak (reject):**
```typescript
await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
// only: keyMetricsRegion.toBeVisible()
```

**Strong (accept):**
```typescript
// In When: deselectSpecificFilterOption + apply
// In Then:
const initial = getCapturedGrossCommission();
const current = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
expect(current).toBeLessThanOrEqual(initial);
await agencyOwnerDashboardPage.expectRevenueDonutChart();
const labels = await agencyOwnerDashboardPage.getRevenueLegendLabels();
expect(labels.length).toBeGreaterThan(0);
```

---

## Phase 8 — Validation loop

After adding assertions:

```bash
# When authoring from CSV: audit coverage + assertion depth first
node .cursor/skills/validate-csv-bdd-coverage/scripts/audit-csv-coverage.mjs \
  --csv <test-cases.csv> --feature <module>.feature --steps <steps>.ts --page <Page>.ts

npx bddgen                                    # no step conflicts
yarn test -g "@Your-Scenario-Tag" --reporter=line   # targeted
```

If assertion fails:
1. CLI or MCP harvest actual value (eval, not guess)
2. Fix assertion text OR file `@bug` if app is wrong
3. Re-run same tag

---

## Quick reference: assertion selector

```
Scenario says "displays/shows"     → visible + non-empty content pattern
Scenario says "contains columns"   → header cell text list
Scenario says "accepts valid"      → toHaveValue after fill
Scenario says "refreshes/changes"  → before/after via context
Scenario says "only shows"         → count + label set ⊆ expected
Scenario says "equals sum"         → parse numbers + math
Scenario says "sorted by"          → extract ordered values + compare
Scenario says "warning"            → exact getByText after trigger action
Scenario opens modal/panel         → modal testid + heading + close step
```

Cross-reference: `playwright-bdd-regression` skill (module isolation, step IDs), `fix-harvested-e2e-tests` skill (interaction bugs).
