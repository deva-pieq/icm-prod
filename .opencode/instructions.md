# ICM Playwright BDD — Code Generation Rules

## 0. Auto-Run on Generate

Once code is generated, run the test once immediately. If the issue can be fixed in 2–3 iterations, fix and re-run. After 3 failed iterations, escalate to a human — do not keep guessing.

## 1. Skill Reference — Load Before Generating

Before generating code, load the relevant skill from `.opencode/skills/`:

| Task | Skill |
|---|---|
| Writing new scenarios (step text uniqueness) | `step-conflict-resolution` |
| Assigning test case IDs | `feature-test-case-ids` |
| Known bugs, before/after capture, sidebar validation | `assertion-patterns` |
| Writing step defs + page objects (full wiring) | `playwright-bdd-regression` |
| Fixing failing tests (8 failure patterns) | `fix-harvested-e2e-tests` |
| Suite collect + classify + fix/escalate (`-g`; fix default ON) | `test-runner` |
| Product/config missing, purged fixtures (HI-P / HI-C) | `hail-intelligence` |
| Proven product behavior (dashboards, payment, etc.) | `icm-app-behavior` |
| Strengthening weak `Then` steps | `bdd-contextual-assertions` |
| Auditing CSV-to-feature coverage | `validate-csv-bdd-coverage` |

## 2. Existing Method First — Never Duplicate

Before creating ANY new method/step/context field:

1. **Search step text**: `grep "step text pattern" steps/**/*.steps.ts` — avoid Gherkin step text conflicts
2. **Search page methods**: `grep "methodName" pages/**/*Page.ts` — reuse if the method does what you need
3. **Search context fields**: `grep "getFieldName\|setFieldName" utils/**/*Context.ts` — check if context already exists
4. **Search test-data constants**: `grep "constantName" test-data/**/*.ts` — check if config already exists
5. **Search fixture registrations**: `grep "pageObjectName" steps/fixtures.ts` — check if page is already registered

**Only create new when no existing method can serve the purpose**. Prefer parameterizing an existing method over creating a new one.

## 3. Complete Wiring When Adding New Methods

When adding a new flow (or adapting existing methods cannot serve), wire every layer:

```
feature/*.feature  →  "Given ... When ... Then ..." step text
                      ↓
steps/*.steps.ts   →  Given('...', async ({ pageObj }) => { ... })
                      ↓
pages/*Page.ts     →  async newMethod(): Promise<void> { ... }
                      ↓
utils/*Context.ts  →  setX() / getX()  (if state is needed)
                      ↓
steps/fixtures.ts  →  Register page object if new
```

**Missing any one layer = broken code that will fail at runtime.**

## 4. Template File Name Resolution

Template file names are declared in `test-data/<module>/*.ts` as constants:

```typescript
templateFileName: 'ActualFile.xlsx',
recoveryTemplateFileName: 'ActualFile[Recovery].xlsx',
chargebackTemplateFileName: 'ActualFile[Cancellation].xlsx',
```

**ALWAYS** verify the actual file exists on disk under `TestFiles/<module>/` before trusting the config.

The full path resolves as: `path.join(templateDir, templateFileName)` where `templateDir = path.join(projectRoot, 'TestFiles', '<module>')`.

## 5. Excel Statement Prep — Customer UID (required)

Advance / policy-cancellation statement uploads treat an **existing** Customer UID as a **renewal** (bug/renewal icon). A **new** UID shows the warning icon with **"New Policy"** tooltip.

Every `*ExcelPrep.ts` advance-payout prepare function MUST:

1. Read the template from `TestFiles/<module>/`
2. Increment **Customer UID by +1** on every data row (preserve prefix + zero-padding)
3. Write a timestamped copy under `TestFiles/<module>/.generated/`
4. **Persist the incremented UIDs back to the template** with `await wb.xlsx.writeFile(templatePath)` so the next run creates a new policy

```typescript
await wb.xlsx.writeFile(absolutePath);   // generated upload file
await wb.xlsx.writeFile(templatePath);   // persist for next run — REQUIRED
```

Recovery / chargeback prep: replace Customer UID with the **stored PolicyNumber** from the advance payout (do not invent a new UID). Do **not** overwrite the advance template from recovery/chargeback prep.

Reference implementations: `advanceOnlyExcelPrep.ts`, `advanceRecoveryExcelPrep.ts`, `advanceAdjustmentExcelPrep.ts`, `policyCancellationAgencyAdvanceExcelPrep.ts`.

## 6. Gherkin Step Text Uniqueness

Step text must be unique across ALL step definition files. If two modules could use the same wording, add a "in {module} validation" suffix:

```gherkin
Then the product status chip shows "Active" in commission truth validation
Then the product status chip shows "Active" in policy cancellation validation
```

Before registering any new step text, grep all `steps/**/*.steps.ts` for the exact text.

## 7. Context Field Lifecycle

- Context fields are defined in `utils/<module>/*Context.ts` as module-level singletons
- Every `set` must have a matching `get` with proper error handling
- Context is cleared in `common.steps.ts` `Before` hooks

## 8. Test Invocation — `yarn test -g @<tag>`

The project has a single `test` script. Do **not** use `npm run test:<module>` — those scripts do not exist.

```powershell
yarn test -g "@agency-dashboard"          # module suite
yarn test -g "@TEST-AGD-001"              # single scenario
yarn test -g "@smoke" --headed            # headed mode
yarn test --ui                            # Playwright UI mode
yarn bddgen                               # generate specs only
```

## 9. Browser Discovery — Playwright MCP Default

Playwright CLI is unreliable and disabled. Use **Playwright MCP** (configured in `opencode.jsonc`) for all live-app locator discovery.

```
1. POM `loc` map → write code (no browser)
2. Playwright MCP → browser_evaluate, scoped snapshot (default)
3. Persist to POM → validate with test runner
```

Locator priority: `data-testid` → `getByRole` / `getByLabel` → text → CSS last resort.

Token-efficient MCP: one login per session; prefer small JSON from `browser_evaluate`; scope snapshots; persist findings to POM immediately.

## 10. POM Standard — Locator Map & Read-Only Assertions

- `loc` map: all locators declared once
- Interaction methods: click/select/type
- Read helpers: `getText`, value extractors
- Stable page identity checks (heading/title) OK in page object
- `expect*` methods are **read-only** — no clicks/navigation inside assertions
- Do NOT change shared methods for one-off scenarios — add scenario-specific wrappers

## 11. Assertion Standards

Every `Then` step must assert meaningful content — not just "element exists":

| Gherkin wording | Required assertion depth |
|---|---|
| "X is displayed" | Visible + non-empty content |
| "contains Y" | Text or value match |
| "equals Z" | Exact numeric or string match |
| "matches N" | Within tolerance (use `toBeCloseTo`) |
| "shows columns: A, B, C" | Each column header verified |

Weak (BAD): `await expect(locator).toBeVisible()`  
Strong (GOOD): `await expect(locator).toHaveText(expected)`

## 12. Module Creation Checklist

- [ ] `features/<module-name>/` — Gherkin `.feature` files
- [ ] `steps/<module-name>/` — Step definitions + `common.steps.ts` (BeforeAll/AfterAll)
- [ ] `pages/<module-name>/` — Page objects + assertions
- [ ] `test-data/<module-name>/` — Test data constants + builder functions
- [ ] `utils/<module-name>/` — Context + Excel prep (with Customer UID persist)
- [ ] `steps/fixtures.ts` — Register all new page objects
- [ ] Unique `@TEST-{NNN}-{Module}-{Area}` tag on every scenario
- [ ] Template files in `TestFiles/<module-name>/` referenced by `templateFileName`

## 13. Pre-Generation Checks

```bash
grep "potential-step-text" steps/**/*.steps.ts      # Step conflicts
grep "similarMethodName" pages/**/*Page.ts            # Existing methods
grep "contextField" utils/**/*Context.ts              # Existing context
grep "FixtureName" steps/fixtures.ts                  # Existing fixtures
Test-Path "TestFiles/<module>/<template-name>.xlsx"   # Template exists
```

## 14. Scenario Cleanup — Close What You Open

Every `.feature` scenario that opens a modal, popup, or side panel must close it before the scenario ends (last step after validation).

## 15. Page Object / Fixture Registration

Every page object must be imported and registered in `steps/fixtures.ts`, then accessed from steps via the destructured fixture parameter.

## 16. File Naming Reference

| Artifact | Convention | Example |
|---|---|---|
| Feature files | `kebab-case.feature` | `validate-policy-cancellation.feature` |
| Step definitions | `kebab-case.steps.ts` | `policy-cancellation.steps.ts` |
| Common steps | `common.steps.ts` | `common.steps.ts` |
| Page objects | `PascalCasePage.ts` | `PolicyCancellationAgencyAdvancePage.ts` |
| Assertions | `PascalCaseAssertions.ts` | `PolicyCancellationAgencyAdvanceAssertions.ts` |
| Context | `PascalCaseContext.ts` | `policyCancellationAgencyAdvanceContext.ts` |
| Test data | `camelCase.ts` | `validatePolicyCancellationAgencyAdvance.ts` |
| Excel prep | `camelCasePrep.ts` | `policyCancellationAgencyAdvanceExcelPrep.ts` |

## 17. Architecture Reference

```
features/<module-name>/          → Gherkin .feature files
steps/<module-name>/             → Step definitions (*.steps.ts) + common.steps.ts
pages/<module-name>/             → Page Object Model (*Page.ts) + assertions (*Assertions.ts)
utils/<module-name>/             → Context objects and utility functions
test-data/<module-name>/         → Test data factories with builder functions
steps/fixtures.ts                → Central fixture registration
TestFiles/<module-name>/         → Excel/CSV template files
TestFiles/<module-name>/.generated/  → Generated files (runtime)
```

## 18. File Deletion — Recycle Bin, Never Hard Delete

When the user asks to delete/remove files or directories, **move them to the Recycle Bin** so they can be restored. Never use `rm`, `del`, or `Remove-Item` (hard delete).

```
powershell -NoProfile -ExecutionPolicy Bypass -File ".opencode/scripts/recycle.ps1" -Paths "<path1>","<path2>"
```

Confirm each path reports `Recycled: <path>`. If a path is missing or fails, tell the user — do not fall back to hard delete.
