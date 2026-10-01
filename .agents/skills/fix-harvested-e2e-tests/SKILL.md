---
name: fix-harvested-e2e-tests
description: >-
  Diagnose and fix failing Playwright BDD tests after codegen or first run.
  Analyze .feature, steps, and page objects; investigate live-app flow with
  OpenCode regression-fixer + Playwright MCP. Use when E2E tests fail
  after bulk POM generation, opencode/codex output, harvested locators,
  agency/ops dashboard regressions, or when the user says "analyze and fix".
---
# Fix Harvested / Post-Codegen E2E Tests (POM + BDD)

## Mindset

Harvested `data-testid` locators are often **correct**. Failures usually come from **wrong interaction patterns**, **missing apply/submit steps**, **accordion prefix mismatches**, **collapsed sections**, **weak assertions**, or **Gherkin wording that doesn't match live UI**.

Do not rewrite the whole POM. Find the smallest fix that matches how the live app actually behaves.

**You may edit any layer when justified:**

| Layer | When to edit |
|---|---|
| `features/**/*.feature` | Scenario wording wrong; missing setup/teardown; `@bug` tag needed; step text must change for uniqueness |
| `steps/**/*.steps.ts` | Step delegates wrong; missing context capture; duplicate step text needs page-name suffix |
| `pages/**/*Page.ts` | Locator map, interaction methods, alias maps, assertion helpers |
| `utils/<module>/*Context.ts` | Before/after capture state missing or wrong |

Cross-reference: `bdd-playwright-cli`, `bdd-contextual-assertions`, `playwright-bdd-regression`, `step-conflict-resolution` rule. Opencode mirror: `.opencode/skills/fix-harvested-e2e-tests/`.

---

## Phase 0 — Post-codegen self-fix loop

After codegen (`bdd-playwright-cli` or opencode `regression-writer`):

```
1. yarn test -g @<module-tag>  (or more specific -g)
2. If failures → apply this skill
3. Fix one failure class at a time (patterns A–T often affect many scenarios)
4. npx bddgen after step/feature text changes
5. Re-run targeted tags → module suite (exclude @bug if applicable)
6. graphify update .
```

---

## Phase 1 — Triage (read before browser)

1. Read in order: **page object `loc` map** → **page methods** → **step definitions** → **`.feature` scenarios**.
2. Run a **small representative subset** of failing tags (3–8 scenarios), not the full suite.
3. Run `npx bddgen` if steps/features changed (catch duplicate step text).
4. Classify each failure:
   - **Locator missing/wrong** → invoke OpenCode regression-fixer (Playwright MCP)
   - **Locator exists but interaction wrong** → fix page method only
   - **Assertion text mismatch** → fix expected string, alias map, or Gherkin wording
   - **Scenario order / missing step** → fix `.feature` or add thin step
   - **Login/BeforeAll flake** → infra issue, not POM (retry; don't chase phantom locator bugs)
   - **Timeout on bulk UI loop** → optimize interaction (see Phase 4)

---

## Phase 2 — Browser decision gate (OpenCode + MCP)

**Skip browser** when:
- `loc` already has the `data-testid`
- Method composes existing locators
- Pattern is inferable from siblings (e.g. `agency-owner-filter-{prefix}-{uuid}`)

**Invoke OpenCode regression-fixer** when:
- Element/state is unknown or locators were guessed
- Test fails but locator looks plausible — verify **interaction flow** on live app
- Accordion/modal content only appears after an action

```powershell
opencode run --agent regression-fixer --auto "MODULE=<tag>. TASK=Fix <grep>. Investigate with Playwright MCP. Minimal patch."
```

Inside OpenCode:
1. Prefer `browser_evaluate` → small JSON over `browser_snapshot`
2. **Prove flows** — click → check side effect → return JSON
3. **Persist findings into POM** — browser discovery is a one-time cost
4. **Validate with test runner**, not repeated browser passes

---

## Phase 3 — Common harvested-POM failure patterns

### A. Radio/checkbox click blocked by decorative overlay

**Symptom:** `intercepts pointer events` on `-radio-circle` span.

**Fix:** `await locator.check({ force: true })` — not `.click()`.

### B. Filter change without Apply

**Symptom:** Radio/checkbox state changes but dashboard data/viewing period unchanged.

**Fix:** After changing filter, if Apply bar visible → click `*-filter-apply` → wait for loader settled.

```typescript
await radio.check({ force: true });
if (await applyBtn.isVisible().catch(() => false)) {
  await applyBtn.click();
  await waitForLoaderHidden(page);
}
```

Never add inverted/hacky conditionals (e.g. only apply when Apply is *not* visible).

### C. Accordion section slug ≠ checkbox testid prefix

**Symptom:** `filterSectionLabels('line-of-business')` finds nothing; live IDs use `lob`.

**Fix:** Maintain two maps:
- **Section header:** `agency-owner-filter-section-{section-slug}`
- **Checkbox items:** `agency-owner-filter-{item-prefix}-{id}`

Example: `Line of Business` → section `line-of-business`, items `lob`.

### D. Collapsed accordion — controls not in DOM

**Symptom:** Timeout on radio/checkbox; `isVisible() === false`.

**Fix:** Expand first — only click section button when `aria-expanded !== 'true'`.

```typescript
if ((await sectionBtn.getAttribute('aria-expanded')) !== 'true') {
  await sectionBtn.click();
}
```

**Anti-pattern:** Always clicking accordion toggles — collapses an already-open section.

### E. Legend/list uses plain HTML, not ARIA roles

**Symptom:** `getByRole('list')` returns 0; live app has `ul > li` without `role="list"`.

**Fix:** `card.locator('ul li')` scoped to widget container.

### F. Bulk uncheck loops timeout

**Symptom:** 7+ min timeout unchecking 50+ carrier checkboxes one-by-one.

**Fix:** Click the section's `-all` checkbox once when all are selected — toggles entire group.

```typescript
const allLabel = page.getByTestId(`agency-owner-filter-${prefix}-all`);
if (await allLabel.locator('input[type="checkbox"]').isChecked()) {
  await allLabel.click(); // unchecks all in section
}
```

### G. Display text aliases

**Symptom:** Feature says `Sub-agents`; UI shows `Sub Agent`.

**Fix:** Alias map in page object; normalize before regex/assert.

### H. Weak "refresh" assertions

**Symptom:** Test passes but doesn't validate refresh.

**Fix:** Capture value before filter change, assert value/date/legend actually changed after apply.

### I. Readonly calendar / date input — never `.fill()`

**Symptom:** `locator.fill` timeout on date fields.

**MCP proof:** input `readonly` + react-calendar popup.

**Fix:** Calendar popup (`selectDateInCalendar` / `{testid}-calendar-clear`). Never `.fill()` readonly dates. Same pattern: CarrierMaster, ProductManagement, StatementReview bulk, TransferSheet.

### J. `sr-only` checkbox — click `<label>`, not hidden `<input>`

**Symptom:** Uncheck runs but Apply never appears / React state unchanged.

**MCP proof:** `<input class="sr-only">`; handlers on parent `<label>`.

**Fix:** Click label (or `label[for=id]`). Never `input.uncheck({ force: true })` — force bypasses label click-through. Same: filters, edit-batch select-all, PayablesPage `clickSrOnlyCheckbox`.

### K. Wrong ARIA role guess

**Symptom:** `getByRole('menu'|'dialog'|'list')` not visible; node exists as plain div/ul.

**Fix:** Harvest `data-testid` with `count === 1`. Example: column toggle = `active-grid-toggle-columns-modal`, not `role="menu"`.

### L. Wrong virtualization scroll container (AG Grid vs MUI)

**Symptom:** Side-panel row sum/count << widget total (e.g. 21 of 69).

**MCP proof:** Scroll root `.ag-body-vertical-scroll-viewport` / `.ag-body-viewport`, not `.MuiDataGrid-virtualScroller`.

**Fix:** Scroll correct viewport to bottom; accumulate unique rows.

### M. Shared seed / stale data across Outline examples

**Symptom:** Example N flaky; earlier examples polluted shared product/draft.

**Fix:** Per-example fresh seed (`@needs-fresh-product` or equivalent) when empty state required.

### N. Hardcoded fixtures vs live volatile data

**Symptom:** Expected fixed amount (e.g. `5356.13`) got `0` after dataset change.

**Fix:** Dynamic asserts (`toBeGreaterThan(0)`) when product says values update; use a period that has data. Do not invent new hardcodes from old notes.

### O. App-vs-spec mismatch — `@bug` or delete invalid case

**Symptom:** Locator correct; live behavior intentionally differs from old scenario.

**Fix:** `@bug` + MCP evidence, or remove obsolete scenario. Never weaken assertion to pass.

### P. Template / fixture corruption looks like logic bug

**Symptom:** BeforeAll / prep crash during “selection logic” scenarios.

**Proof:** Corrupt/zero-length xlsx (`Corrupted zip`).

**Fix:** Restore template from git when appropriate; leave Customer-UID-persisted templates alone. Disprove UI hypothesis with MCP before rewriting selection logic.

### Q. Visibility wait before `.innerText()` after re-render

**Symptom:** `innerText` / `evaluate` timeout on metric cards after filter apply.

**Fix:** `await expect(locator).toBeVisible({ timeout })` before read.

### R. Strict-mode multi-match

**Symptom:** Regex/heading matches widget + matrix title.

**Fix:** Scope to container or proven unique locator — not blind `.first()` unless MCP shows first is intended.

### S. AG Grid sort cycle — reset before direction

**Symptom:** Asc/desc lands wrong because column already sorted (none → asc → desc → none).

**Fix:** Click header until unsorted, then click for desired direction.

### T. Enabled-state / threshold / data precondition

**Symptom:** Button expected enabled, got disabled.

**MCP proof:** Selection count, dirty-set semantics, amount thresholds.

**Fix:** Correct test data or `@bug`. Do not force-enable assertion. Dirty state may track **set of rows**, not count.

---

## Binding investigation order (no-assumption)

```
1. Read POM loc map
2. Reproduce: yarn test -g "@TAG" --retries=0 --reporter=line
3. MCP login → exact page → live DOM (exact text/colors/state)
4. Prove count === 1 before persist
5. Minimal patch (POM → steps → feature)
6. yarn bddgen if Gherkin/steps changed
7. Verify once same tag --retries=0; still fail → escalate
```

Do **not** fix from Gherkin / old failure notes alone. Do **not** re-implement `loginWithRetry`, change workers/retries config, or use playwright-cli. Cascade: fix first failing tag in serial file before siblings.

Invoke OpenCode: `opencode run --agent regression-fixer --auto "…"`. Full MCP checklist + report format: `.opencode/agents/regression-fixer.md`.

---

## Phase 4 — Fix workflow

```
1. Reproduce one failure (test or CLI flow proof; MCP if CLI stuck)
2. Identify pattern A–T above (hypotheses — prove on live DOM)
3. Patch minimal layer (page method preferred; then step; then feature)
4. Keep locators in `loc` map; don't scatter raw selectors in steps
5. Run targeted tags: `yarn test -g "@Tag-001|@Tag-004" --retries=0 --reporter=line`
6. Run module suite excluding @bug if applicable
7. graphify update .  (if project uses graphify)
```

### Step-definition rules (playwright-bdd)

- Search `steps/**/*.ts` for duplicate Gherkin text before adding steps.
- Add page-name suffix when conflicts exist (`on agency dashboard`).
- Steps should be thin — delegate to page object methods.

---

## Phase 5 — Live-app verification checklist

When validating `.feature` wording or new scenarios:

- [ ] Log in with correct role from `.env`
- [ ] Navigate via real sidebar `data-testid` (not guessed link text)
- [ ] Match **exact** rendered labels (punctuation, spacing, em-dash vs hyphen)
- [ ] Reproduce conditional UI (Apply bar, modals, expanded sections) before asserting
- [ ] Tables: verify real column headers from live DOM
- [ ] Known bugs: assert **expected** behavior + `#` comment documenting actual app bug
- [ ] Avoid brittle live counts/dates — assert patterns not volatile values

---

## Phase 6 — Report to user

Structure findings as:

1. **Root causes** (pattern letter + one line each)
2. **What was fixed** (file + method)
3. **Test evidence** (passed/failed tags; distinguish POM fix vs login flake)
4. **Re-run command**

---

## Example: agency dashboard time period

**Broken (AI-generated):**
```typescript
await radio.click();
if (option === 'Year to Date' && !await apply.isVisible()) await apply.click();
```

**Fixed (live-verified):**
```typescript
// expand time period if collapsed
await radio.check({ force: true });
if (await apply.isVisible().catch(() => false)) {
  await apply.click();
  await waitForLoaderHidden(page);
}
```

**CLI proof returned:** `afterClick` unchanged, `afterApply` shows new date range.

---

## Anti-patterns

- Rewriting all locators when interactions are wrong
- Full-page browser snapshots for every element (CLI or MCP)
- Per-item uncheck loops on large filter lists
- Assuming accordion slug equals checkbox prefix
- `.click()` / `uncheck({ force: true })` on sr-only inputs under custom radio/checkbox UI
- `.fill()` on readonly calendar date inputs
- Assuming MUI DataGrid scroll when panel is AG Grid
- Hardcoding commission/KPI amounts from old fixtures when data is volatile
- Weakening assertions when live app ≠ old scenario (use `@bug` instead)
- Chasing locator bugs when `LoginPage.ensureSession` times out on sidebar
- Fixing from old `REGRESSION_FAILURES.md` notes without fresh MCP proof

---

## Quick reference commands

```bash
# Step conflicts
npx bddgen

# Targeted regression
yarn test -g "@module-tag.*001|004|052" --reporter=line

# Exclude known bugs
yarn test -g "^(?=.*@agency-dashboard)(?!.*@bug).*$"
```
