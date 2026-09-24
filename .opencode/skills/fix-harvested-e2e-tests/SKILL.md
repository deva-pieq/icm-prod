---
name: fix-harvested-e2e-tests
description: >-
  Diagnose and fix failing Playwright BDD tests after codegen or first run.
  Analyze .feature, steps, and page objects; investigate live-app flow with
  Playwright MCP (playwright-cli disabled). Use when tests fail
  after bulk POM generation, opencode/codex output, harvested locators,
  dashboard regressions, or when the user says "analyze and fix" or
  "/fix-test".
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

Cross-reference: `bdd-contextual-assertions` (assertion depth), `playwright-bdd-regression` (module isolation), `step-conflict-resolution` (step text deconfliction), `assertion-patterns` (known bugs, before/after capture).

---

## Phase 0 — Post-codegen self-fix loop

After `regression-writer` codegen:

```
1. yarn test -g @<module-tag>  (or targeted --grep)
2. If failures → apply this skill (do NOT stop at first error)
3. Fix one failure class at a time (same pattern A–T often affects many scenarios)
4. npx bddgen after step/feature text changes
5. Re-run targeted tags → module suite (exclude @bug if applicable)
6. graphify update .
```

Stop when: targeted failures are green, or remaining failures are confirmed app bugs (`@bug` + `# Known issue`).

---

## Phase 1 — Triage (read before browser)

1. Read in order: **page object `loc` map** → **page methods** → **step definitions** → **`.feature` scenarios** (match failing `@TEST-*` tags to scenario text).
2. Run a **small representative subset** of failing tags (3–8 scenarios), not the full suite.
3. Run `npx bddgen` if steps/features changed (catch duplicate step text).
4. Classify each failure:
   - **Locator missing/wrong** → Playwright MCP harvest
   - **Locator exists but interaction wrong** → fix page method only
   - **Assertion text mismatch** → fix expected string, alias map, or Gherkin wording
   - **Scenario order / missing step** → fix `.feature` or add thin step
   - **Login/BeforeAll flake** → infra issue, not POM (retry; don't chase phantom locator bugs)
   - **Timeout on bulk UI loop** → optimize interaction (see Phase 4)
   - **Data-lottery (NOT a wait/locator bug)** — scenario premise depends on ambient data (e.g. "add a payable" needs a leftover record NOT in the current batch; "empty dropdown" needs empty state). Fix = data strategy or `@bug`, not a wait swap. Escalate to human with evidence.

---

## Phase 2 — Browser decision gate (Playwright MCP default)

**Skip browser** when:
- `loc` already has the `data-testid`
- Method composes existing locators
- Pattern is inferable from siblings (e.g. `agency-owner-filter-{prefix}-{uuid}`)

**Use Playwright MCP** when:
- Element/state is unknown or locators were guessed
- Test fails but locator looks plausible — verify **interaction flow** on live app
- Accordion/modal content only appears after an action

Playwright CLI is disabled (unreliable). Do NOT use it.

### Token-efficient Playwright MCP rules

1. **One login per session** — `browser_navigate` to `BASE_URL`; don't re-login for each element.
2. **Prefer `browser_evaluate`** over full snapshots:
   ```javascript
   () => [...document.querySelectorAll('[data-testid]')].map(el => el.getAttribute('data-testid')).sort()
   ```
3. **Prove flows** — click → check side effect → `browser_evaluate` to confirm.
4. **Scope snapshots** with `target` + `depth`; offload large output to `{ filename }`.
5. **Persist findings into POM** — browser discovery is a one-time cost.
6. **Validate with test runner**, not repeated browser passes.

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

**Fix:** Alias map in page object; normalize before regex/assert. Update Gherkin only if spec requires exact UI copy.

### H. Weak "refresh" assertions

**Symptom:** Test passes but doesn't validate refresh.

**Fix:** Capture value before filter change, assert value/date/legend actually changed after apply. Add context steps in `.feature` if missing.

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

**Session-proven corollary (edit-transaction):** add+remove the **same** row empties the dirty row-SET → Save Batch stays disabled. Remove must skip the just-added row (pin distinct rows). Live evidence: 5920-row AG Grid, mixed 8 checked / 9 unchecked in first window. Fixed via `addedPayableRowTestId` context + scan helper (pattern V).

### U. Button-state BRANCH reads — never single `isEnabled()/isDisabled()`

**Symptom:** Flow intermittently clicks too early / takes wrong branch while polling `toBeEnabled({ timeout })` later passes. Appears random, assertions green.

**MCP proof:** React flush lags the `disabled` attribute 3–25ms behind field edits (validation debounce/re-render). One instant read in that window → wrong code branch (click Save while momentarily valid, or skip a required repair).

**Fix:** Poll the state, never branch on one read — shared helper, reuse first:

```typescript
// utils/buttonState.ts — reuse; do NOT re-implement
export async function waitForButtonState(
  button: Locator, enabled: boolean, timeout = 5_000,
): Promise<boolean> {
  // expect.poll on button.isEnabled().catch(() => false),
  // intervals [100, 250, 500, 1000]; true on reached, false on timeout.
}
```

Then branch on result: `if (await waitForButtonState(saveBtn, true)) { ... }`.

Already wired: `ProductManagementPage.expectValidationBlocksSave` / `expectProductNameValidationBlocksSave`, `ProductEditPage.expectEditValidationBlocksSave`, `CommissionRulePage.ensureSaveDraftButtonEnabled`, `CommissionRulePage.expectAddPeriodButtonDisabled`.

### V. Virtualized grid row ops — poll reads, scroll-scan, grid-ready precondition

**Symptom:** "<row> to add/remove" reads 0 rows; or remove disables Save (dirty-set); or `findRowByText` misses a row that renders 357ms after navigation. Not covered by L (L is scroll container only).

**MCP proof:** AG Grid renders only the visible window. Setting `scrollTop` + reading in ONE synchronous evaluate sees the STALE window (re-render on rAF — frame-batch between sample + read). 5920-row edit-payables grid: every scroll window beyond the top = 27 candidate rows, 0 checked; checked batch rows render late or outside sampled windows run-to-run (three consecutive runs showed three different window states).

**Fix (3 layers, all condition-based — no static waits):**

1. **Row reads:** poll-until-found with fresh query per poll (see `GridPage.findRowByText` — detach-tolerant, 60s, intervals `[500, 1000, 2000, 3000]`). A single synchronous scan is not a find.
2. **Row ops (add/remove/uncheck):** scroll-scan multiple windows (12 steps over `scrollHeight/11`), wait on first-checkbox testid CHANGE between windows (frame-batch), act on first match. Never top-window-only scan (`EditBatchPage.clickFirstPayableCheckbox`).
3. **Grid data-ready precondition:** before row ops, wait until ≥1 checkbox row rendered and expected checked-state visible. `expectPageReady`/`ensurePageReady` prove the SHELL only — grid rows load after, over `Loading data...`.

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

Cross-reference: `.opencode/agents/regression-fixer.md` (full MCP checklist + infra skip list + report format).

---

## Phase 4 — Fix workflow

```
1. Reproduce one failure (test or Playwright MCP flow proof)
2. Identify pattern A–V above (hypotheses — prove on live DOM)
3. Patch minimal layer (page method preferred; then step; then feature)
4. Keep locators in `loc` map; don't scatter raw selectors in steps
5. Run targeted tags: yarn test -g "@TEST-001|@TEST-004" --retries=0 --reporter=line
6. Run module suite excluding @bug if applicable
7. graphify update .
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
2. **What was fixed** (file + method or scenario)
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
- Fixing from old failure notes without fresh MCP proof
- Single `isEnabled()/isDisabled()` read deciding a code branch (pattern U — poll)
- Top-window-only scan / single synchronous row find on virtualized grids (pattern V)
- `scrollTop` + read in the same synchronous evaluate on AG Grid (stale window; frame-batch before re-reading)
- Row ops before grid data-ready (≥1 row rendered) — shell-ready ≠ grid-ready (pattern V)

---

## Quick reference commands

```bash
# Step conflicts
npx bddgen

# Module test
yarn test -g @agency-dashboard

# Targeted regression
yarn test -g @agency-dashboard -- --grep "@TEST-AGD-001|@TEST-AGD-004"

# Exclude known bugs
yarn test -g @agency-dashboard -- --grep "^(?=.*@agency-dashboard)(?!.*@bug).*$"
```
