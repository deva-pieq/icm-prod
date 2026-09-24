---
name: bdd-playwright-cli
description: From a .feature file, write step definitions and page objects in POM format — reuse existing locators and page methods; add separate methods only when needed. **playwright-cli disabled.** Invoke OpenCode regression-writer with Playwright MCP for live-app discovery.
---

# BDD Steps & Page Objects — OpenCode + Playwright MCP

> **playwright-cli is disabled** (unreliable/hangs). Cursor must **invoke OpenCode** for live-app work. See `.cursor/rules/browser-discovery-opencode-mcp.mdc`.

## When to use me (no skill name required)

Use this skill when you say things like:

- "Based on the feature file, write step and page files"
- "Write steps and page object in POM format"
- "Reuse existing locators/methods; create separate methods only if needed"

**Default:** Invoke **OpenCode `regression-writer`** with Playwright MCP for step/page authoring and discovery. **Do not** use `npx playwright-cli` or call Playwright MCP directly from Cursor.

Cross-reference: `browser-discovery-opencode-mcp` rule, `bdd-contextual-assertions` (assertion depth), `playwright-pom-standard` (POM structure), `step-conflict-resolution` (duplicate step text).

---

## When this skill applies

Invoke for **every** task that touches:

- `steps/**/*.steps.ts` — new or updated step definitions
- `pages/**/*Page.ts` / `*Assertions.ts` — locators, interactions, `expect*` methods
- Wiring a `.feature` scenario to page methods when locators or live text are unknown

**Skip browser entirely** when:

- Step only calls an existing page method and POM `loc` already has the **exact** harvested locator
- Parameterized sibling IDs only when the **prefix was harvested** this screen (e.g. `agent-filter-section-{slug}`) — never invent a new testid or dialog name from English

**Never skip** to guess `getByRole('dialog', { name })`, a regex testid, or an unscoped role from Gherkin/spec wording.

---

## Phase 0 — Read before browser

1. Read target `*Page.ts` `loc` map and methods.
2. List exact elements/states still unknown (widget, modal, column headers, live text).

Only open a browser for items on that list.

---

## Phase 1 — Invoke OpenCode (Cursor does not drive browser)

From `projects/icm`:

```powershell
opencode run --agent regression-writer --auto "MODULE=<module-tag>. TASK=Write step defs and page objects for <feature-path>. Read POM first. Use Playwright MCP for unknown locators and assertion text. Register fixtures. Run yarn bddgen + yarn test -g @<module-tag>." -f <feature-path>
```

Credentials from `.env`: `BASE_URL`, `E2E_EMAIL` / `E2E_EMAIL_OWNER`, `E2E_PASSWORD`.

## Phase 2 — Inside OpenCode: Playwright MCP discovery

Login and navigate:

1. `browser_navigate` → `BASE_URL`
2. Fill email/password, click sign-in
3. `browser_navigate` → target module path
4. Wait for page ready (evaluate for root `data-testid`)

Discover locators (prefer evaluate over snapshot):

```js
// All data-testids matching a prefix
() => [...document.querySelectorAll('[data-testid]')].map(el => el.getAttribute('data-testid')).filter(id => id?.includes('ledger')).sort()

// AG Grid column headers
() => [...document.querySelectorAll('.ag-header-cell-text')].map(el => el.textContent?.trim())
```

Reproduce scenario actions (expand filters, open modals) with `browser_click` / `browser_run_code_unsafe`, then harvest the new subtree.

**Then prove uniqueness** (see Locator control). Do not persist until `count === 1`.

### Rules

| Prefer | Avoid |
|--------|-------|
| `browser_evaluate` → small JSON file | Full-page `browser_snapshot` in context |
| Exact `data-testid` listed this session | Guessing testid / dialog name from spec or Gherkin |
| Scoped locator (`parent.getByRole`) after parent walk | Unscoped `getByRole('dialog')` / `button` named from heading |
| Persist only after `count === 1` | Snapshot refs (`e12`) in POM; inline `this.page.getBy*` in methods |
| One login per OpenCode session | Re-login per element |
| Human UI-mode inspect when MCP cannot unique | Guessing a "close enough" locator |

---

## Phase 3 — Write page object

Follow `playwright-pom-standard`:

```typescript
readonly loc = {
  root: () => this.page.getByTestId('ledger-page'),
  submitBtn: () => this.page.getByTestId('ledger-submit'),
};

async expectPageReady(): Promise<void> {
  await expect(this.loc.root()).toBeVisible({ timeout: T });
}
```

Locator priority: `data-testid` → `getByRole` / `getByLabel` → text → CSS last resort.

Map discovered `data-testid` values to camelCase `loc` keys. **Methods call `this.loc.*` only** — never inline `this.page.getByRole` / `getByTestId` in methods (that is how harvested loc maps get bypassed by assumed dialog names).

Add interaction methods (`click*`, `select*`, `fill*`) and side-effect-free `expect*` / `get*` readers.

Register new pages in `steps/fixtures.ts`.

---

## Phase 4 — Write step definitions

1. Search `steps/` for duplicate step text (`rg "Then\\('your step" steps/`).
2. If conflict exists, add page-name suffix per `step-conflict-resolution` rule.
3. Keep steps thin — delegate to page `expect*` / interaction methods:

```typescript
Then('the ledger grid shows column {string} in ledger', async ({ ledgerPage }, column) => {
  await ledgerPage.expectGridColumnVisible(column);
});
```

4. Run `npx bddgen` — fix any "Multiple definitions matched" errors.

---

## Phase 5 — Discover assertion text (live app)

Handled inside OpenCode via `browser_evaluate` before encoding exact strings in `expect*`.

---

## Phase 6 — Validate

```bash
npx bddgen
yarn test -g "@Your-Scenario-Tag" --reporter=line
```

Confirm with the test runner — not another browser pass.

---

## Locator control — MCP explores; uniqueness is proven (not assumed)

Playwright MCP can open the live app and list DOM. It **cannot** replace Playwright UI mode + DevTools inspect.

| Human (`yarn test --ui`) | Playwright MCP |
|--------------------------|----------------|
| Locators tab shows **1 of 1** / n of n | No match-count badge |
| Inspect parent/child until unique | No DevTools tree; snapshot is a11y + ephemeral refs |
| Overlay/portal/duplicate dialogs visible | Easy to miss; `getByRole('dialog', { name })` often heading guess |

**Control:** never persist a locator unless live `count === 1` on the widget **after** reproducing state. Gherkin/spec wording is not a locator.

### Assumption fingerprints (banned until proven live)

- `getByRole('dialog' | 'alertdialog', { name: /heading from spec/i })`
- `getByTestId('…')` / regex testid **not** returned by `[data-testid]` harvest this session
- Unscoped `getByRole('dialog')` or `getByRole('button', { name: /select/i })` when duplicates exist
- Heuristic chains (`button` filter `hasText: /^(?!Cancel\|Save)/`)
- Snapshot refs (`e12`) copied into POM
- Page methods using `this.page.getBy*` instead of `this.loc.*`

### MCP uniqueness protocol (closest substitute for 1 of 1)

1. Reproduce state (open drawer/modal/menu).
2. List testids in that subtree.
3. Prefer exact `data-testid` on the target, else closest parent with a testid.
4. Prove count via `browser_evaluate` or `browser_run_code_unsafe`:

```js
() => ({
  count: document.querySelectorAll('[data-testid="add-level-record-modal"]').length,
})
```

```js
async (page) => ({
  count: await page.getByTestId('add-level-record-modal').count(),
})
```

5. If `count !== 1`: walk parents for a unique testid, then **scope**:

```js
() => {
  const el = document.querySelector('[data-testid="add-level-record-modal"] button');
  const chain = [];
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const tid = n.getAttribute('data-testid');
    if (tid) chain.push(tid);
  }
  return chain;
}
```

```ts
this.page.getByTestId('add-level-record-modal').getByRole('button', { name: /select/i })
```

Re-count. Persist only at `count === 1`.

6. If still not unique (portals, stacked dialogs, shadow, duplicates) → **stop. Do not guess.** Escalate to human.

### Human fallback (MCP cannot unique)

1. `yarn test --ui` (or headed pick-locator).
2. Paste candidate in Locators tab. If not **1 of 1**, Inspect → parent or child until **1 of 1**.
3. Put that locator in POM `loc` map. Methods use `this.loc.*` only.

### Discovery hierarchy

| Priority | Tool | When |
|----------|------|------|
| 1 | **POM `loc` map** | Exact harvested locator already there — no browser |
| 2 | **OpenCode + Playwright MCP** | Unknown element; harvest + uniqueness proof |
| 3 | **Human UI mode + inspect** | MCP cannot get `count === 1` |
| 4 | **Test runner** | Confirm tests pass |

**playwright-cli is disabled.** Cursor invokes OpenCode; OpenCode uses Playwright MCP internally.

---

## Quick checklist

```
- [ ] Read existing POM `loc` map first
- [ ] If live app needed → opencode run --agent regression-writer --auto "..."
- [ ] Reproduce modal/filter state before harvest
- [ ] browser_evaluate → testids + count === 1 (or parent-scope then re-count)
- [ ] If MCP cannot unique → stop; human UI mode + inspect; do not guess
- [ ] Write loc map only; methods use this.loc.* (no inline this.page.getBy*)
- [ ] Thin step defs; check step conflicts
- [ ] npx bddgen + targeted yarn test
```
