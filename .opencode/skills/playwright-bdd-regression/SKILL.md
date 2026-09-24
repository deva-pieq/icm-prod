---
name: playwright-bdd-regression
description: Use when writing or editing Playwright BDD regression tests in the ICM project. Covers Gherkin feature files, step definitions, page objects, module isolation patterns, test case ID tags, and playwright-cli locator discovery (MCP exploratory fallback). Do NOT use for non-test code changes.
---

# Playwright BDD Regression Test Conventions (ICM)

This project uses `playwright-bdd` v8.5.0 with Gherkin `.feature` files and TypeScript step definitions. Below are the exact patterns to follow.

## Architecture Overview

```
features/<module-name>/          → Gherkin .feature files
steps/<module-name>/             → Step definitions (*.steps.ts) + common.steps.ts (BeforeAll/AfterAll)
pages/<module-name>/             → Page Object Model (*.Page.ts) + optional assertion helpers (*Assertions.ts)
utils/<module-name>/             → Context objects and utility functions
test-data/<module-name>/         → Test data factories with builder functions
steps/fixtures.ts                → Central fixture registration (page objects, shared context)
```

## 1. Module Isolation Pattern (from module-regression.mdc)

Each module tag group gets its own isolated browser context. All scenarios within the same module share one context.

### When adding a NEW module:

1. Create `features/<module-name>/` for `.feature` files
2. Create `steps/<module-name>/common.steps.ts` with:
   - `BeforeAll({ tags: '@<module-tag>' }, ...)` → `createSharedPage()` → login
   - `AfterAll({ tags: '@<module-tag>' }, ...)` → `closeSharedContext()`
   - A `Given('I am logged into PieQ ICM for <module> tests', ...)` step
3. Create step definition files under `steps/<module-name>/`
4. If the module needs new pages, add them to `pages/` following POM standard
5. Register new page fixtures in `steps/fixtures.ts`

### common.steps.ts template:

```typescript
import { LoginPage } from '../../pages/auth/LoginPage';
import { loadProjectEnv, smokeCredentials } from '../../utils/loadEnv';
import { BeforeAll, AfterAll, Given, test, createSharedPage, closeSharedContext } from '../fixtures';

loadProjectEnv();

function requireCredentials() {
  const creds = smokeCredentials();
  test.skip(!creds, 'Add E2E_EMAIL and E2E_PASSWORD to .env');
  return creds!;
}

BeforeAll({ tags: '@<module-tag>' }, async ({ browser }) => {
  const { email, password } = requireCredentials();
  const { page } = await createSharedPage(browser, { baseURL: process.env.BASE_URL });
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithEmailPasswordToApp(email, password);
});

AfterAll({ tags: '@<module-tag>' }, async () => {
  await closeSharedContext();
});

Given('I am logged into PieQ ICM for <module> tests', async ({ loginPage }) => {
  const { email, password } = requireCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});
```

### Context isolation rules:

| Concern | Rule |
|---|---|
| One module leaks state to another | Each module has its own `createSharedPage()` / `closeSharedContext()`. Never reuse contexts across modules. |
| Scenarios share login state | Yes — all scenarios in the same module share one context via `createSharedPage()`. Login once in `BeforeAll`. |
| Parallel module execution | `fullyParallel: false` in config; `workers: 3`. Contexts are independent so modules can run concurrently. |

## 2. Page Object Model Standard (from playwright-pom-standard.mdc)

### Page object structure (`*Page.ts`):

- `loc` locator map (all locators declared once)
- Navigation/open helpers
- Interaction methods (click/select/type)
- Read helpers (`getText`, value extractors)
- Stable page identity checks (heading/title/page-ready markers) — OK to keep in page object

### Assertion files (`*Assertions.ts`):

Use for cross-page or multi-step validations:
- Compare values between two pages/modules
- Follow-up action outcome assertions
- Multi-step scenario assertions spanning more than one page object

### Locator priority:

1. `data-testid` / `data-test` attributes (preferred)
2. Semantic roles (`getByRole`, `getByLabel`)
3. Text (`getByText`, `getByPlaceholder`)
4. CSS fallback only when above are unavailable

### Shared vs special-case methods:

**Do NOT change a shared method when only one scenario needs different behavior.** Instead:

- Keep the existing shared method unchanged
- Add a separate, scenario-specific method on the page that owns that flow
- Name it for the scenario or outcome (e.g. `openReconciliation`, `uploadPreparedCommissionSplitCsv`)
- Compose from the shared method when possible (`await super.openFirstGridRow()` inside a page-specific wrapper)

**When it IS ok to change a shared method:**
- The fix corrects broken behavior for ALL current callers
- You have verified every step/module that calls the method still passes

### Example split:
- `NeedsAttentionPage.ts` → locators, open, click actions, get row text, heading visible check
- `NeedsAttentionAssertions.ts` → compare with `StatementHistoryPage` data and verify follow-up reconciliation outcomes

## 3. Test Case ID Tags (from feature-test-case-ids.mdc)

Every `Scenario` and `Scenario Outline` in `.feature` files must have a unique test case ID tag.

### Format: `@TEST-{NNN}-{Module}-{Area}` — three-digit, zero-padded sequence per Module-Area suffix.

| Area | Example ID |
|---|---|
| Product create page | `@TEST-001-Product-Create-Page` |
| Product edit page | `@TEST-001-Product-Edit-Page` |
| Commission structure | `@TEST-001-Product-Commission-Structure` |
| Commission rule edit | `@TEST-001-Product-Commission-Rule` |
| User management | `@TEST-001-User-Page` |
| Smoke | `@TEST-001-smoke` |

### Rules:
1. One ID per scenario — assign to `Scenario` and `Scenario Outline` only, not to `Examples` rows
2. Sequential numbering per Module-Area suffix — restart at `001`; never reuse or skip numbers
3. Tag placement — append the ID on the tag line immediately above the scenario with other tags:
   ```gherkin
   @user-management @positive @TEST-001-User-Page
   Scenario: Add user with valid mandatory fields
   ```
4. New scenarios — use the next available number for that Module-Area suffix
5. Do NOT rename existing IDs — they are stable traceability links

## 4. Feature File Authoring (Gherkin)

### File location: `features/<module-name>/<feature-name>.feature`

### Structure:
- Required tag line above `Feature:` with module tag + `@icm`
- `Feature:` description block explaining purpose and env requirements
- `Background:` section with login step (references the `Given('I am logged into...')` step from common.steps.ts)
- Scenarios with descriptive titles, unique test case ID tags

### When authoring from spec/manual test cases:
1. Map source 1:1 — each spec row → one `Scenario`
2. Verify every assertion against the live app via playwright-cli (`eval --raw`); MCP only if CLI cannot surface needed structure. Never trust spec wording blindly.
3. Match exact rendered text (punctuation, hyphens vs em-dashes)
4. Reproduce conditional UI states before asserting them (hidden ≠ disabled)
5. Avoid brittle, data-dependent assertions (specific dates, live counts) — describe patterns instead
6. Document known bugs: assert expected behavior + add `#` comment noting the issue

### Configuration: `playwright.config.ts` uses `defineBddConfig`:
```typescript
const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  outputDir: '.features-gen',
});
```

## 5. Step Definitions

### File location: `steps/<module-name>/<topic>.steps.ts`

### Pattern:
```typescript
import { Given, When, Then } from '../fixtures';

When('I open the {word} dashboard', async ({ page, <pageObject> }) => {
  await <pageObject>.goto();
});
```

- Use `{word}`, `{string}`, `{int}` parameter types
- Import `Given, When, Then` from `../fixtures` (not from `playwright-bdd`)
- Use fixture-injected page objects from `steps/fixtures.ts`
- Use `expect.soft` for non-blocking assertions in smoke tests

## 6. Browser Locator Discovery (Playwright MCP Default)

**DO NOT GUESS LOCATORS.** Read POM `loc` map first. Playwright CLI is disabled (unreliable). Use **Playwright MCP** for all live-app discovery.

### Hierarchy

```
1. POM `loc` map → write code (no browser)
2. Playwright MCP → browser_evaluate, scoped snapshot (default)
3. Persist to POM → validate with test runner
```

### Playwright MCP workflow (configured in opencode.jsonc)

1. **One login per session** — `browser_navigate` to `BASE_URL`, fill credentials from `.env` (`E2E_EMAIL` / `E2E_PASSWORD`).
2. **Prefer `browser_evaluate`** returning small JSON over full `browser_snapshot`:
   ```javascript
   () => [...document.querySelectorAll('[data-testid]')].map(el => el.getAttribute('data-testid')).sort()
   ```
3. **Scope snapshots** with `target` + `depth` when evaluate is insufficient.
4. **Persist findings to POM `loc` map** — browser discovery is a one-time cost.
5. **Validate with test runner** — `yarn test -g @<module-tag>`, not repeated browser passes.

### Locator priority (stable → fragile)
1. `data-testid` / `data-test` attributes (preferred)
2. Semantic roles (`getByRole`, `getByLabel`)
3. Text (`getByText`, `getByPlaceholder`)
4. CSS/XPath fallback only when above are unavailable

## 7. Fixture Registration (steps/fixtures.ts)

### To add a new page fixture:
1. Import the page class
2. Add it to the `Fixtures` type definition
3. Register it in the `test.extend<Fixtures>({})` block:
```typescript
myNewPage: async ({ page }, use) => {
  await use(new MyNewPage(page));
},
```

The file already exports `test`, `createSharedPage`, `closeSharedContext`, `Given, When, Then, Before, After, BeforeAll, AfterAll` via `createBdd(test)`.

## 8. BDD Build Pipeline

Tests are built via: `bddgen` → `rename-bdd-gen-to-ts.mjs` → `fix-bdd-gen-spec.mjs` → `playwright test`

Run module-specific tests — the project has a single `test` script, no per-module aliases:
```
yarn test -g @user-management           # user management suite
yarn test -g @product-management         # product management suite
yarn test -g @happy-flow                 # happy flow
yarn test -g @smoke                      # smoke suite
yarn test -g @statement-upload           # statement upload
yarn test -g @transfer-sheet             # transfer sheet
yarn test -g @validate-commission-truth # commission truth
yarn test -g @policy-cancellation-agency-advance  # policy cancellation
```

## 9. Assertion Patterns — **always read `bdd-contextual-assertions` skill first**

For every new or edited `Then` step, follow `.opencode/skills/bdd-contextual-assertions/SKILL.md` — it defines required assertion depth by scenario wording (headings, grids, inputs, before/after, legends, modals). Never ship visibility-only checks when Gherkin promises content, values, or refresh.

### 9a. Known bugs, before/after capture, sidebar validation

### 9a. Known bug handling

When the app has a functional bug (spec says X, app does Y), **assert the expected (spec) behavior**. Tag the scenario `@bug` and add a `# Known issue` comment:

```gherkin
  @bug
  Scenario: AGD-YL-051 — Year limits for Custom Date Range
    Then the agency dashboard minimum selectable year should be 1990
    # Known issue: the app currently allows selecting years below 1990
    And the agency dashboard maximum selectable year should be 2100
```

**Functional bug ≠ test issue.** If the app violates the spec, the test is right to fail — that's the signal. If the locator/assertion in the test is wrong, fix the test.

### 9b. Before/after capture pattern

Capture a value before an action, then assert it changed in the expected direction:

```gherkin
    And I capture the Gross commission initial value
    When I deselect a specific LOB
    Then all dashboard widgets refresh dynamically based on the selected LOBs
    And I validate current Gross commission is lessthan or equals to capture initial one
```

Implementation:
- Store captured values in `utils/<module>/<module>Context.ts` (set*/get*/clear* pattern)
- `clear*()` is called in `Before` hook
- Page object exposes a `getMetricNumericValue()` method
- Step calls `setCapturedMetric(value)`, then later `getCapturedMetric()` for comparison

### 9c. Sidebar/modal heading validation

When a row/link/card opens a sidebar or modal, capture the clicked text before clicking, then assert the panel heading matches:

```gherkin
  When I click the first row in the Top Performers list
  Then the details panel heading matches the clicked performer name
  When I close the sidebar modal on agency dashboard
```

Rules:
- Capture text **before** click (panel might obscure the original element)
- Store in context object (same pattern as 9b)
- Case-insensitive comparison
- Every open step must have a corresponding close step (last step)

## 10. Data Flow Pattern

Use context objects to pass state between steps (not global variables):
```
utils/<module>/<module>Context.ts  → set*/get* pattern + clear* for teardown
test-data/<module>/                → builder functions (e.g. buildValidProduct(), randomValidPersonName())
```

Context object pattern (from existing utils):
```typescript
let _data: SomeType | null = null;

export function setSomeData(value: SomeType) { _data = value; }
export function getSomeData(): SomeType { return _data!; }
export function clearSomeData() { _data = null; }
```
