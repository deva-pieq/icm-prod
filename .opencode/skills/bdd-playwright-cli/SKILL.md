---
name: bdd-playwright-cli
description: From a .feature file, write step definitions and page objects in POM format — reuse existing locators and page methods; add separate methods only when needed. Use Playwright MCP for live-app discovery (playwright-cli disabled).
compatibility: opencode
metadata:
  project: icm
  workflow: bdd-pom
---

# BDD Steps & Page Objects — Playwright MCP (OpenCode)

> **playwright-cli is disabled** (unreliable/hangs). Use **Playwright MCP** tools directly in this OpenCode session (`mcp.playwright` in `opencode.jsonc`).

Cross-reference: `bdd-contextual-assertions`, `playwright-bdd-regression` (POM standard), `step-conflict-resolution` (step text deconfliction).

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

## Phase 1 — Playwright MCP session setup

Credentials from `.env`: `BASE_URL`, `E2E_EMAIL` / `E2E_EMAIL_OWNER`, `E2E_PASSWORD`.

Login and navigate:

1. `browser_navigate` → `BASE_URL`
2. `browser_fill_form` or `browser_type` for email/password; `browser_click` sign-in
3. `browser_navigate` → target module path
4. Wait for page ready via `browser_evaluate` (root `data-testid` visible)

**Before snapshot:** wait for target screen. Snapshots during PieQ loader show only `Loading…`. Prefer `browser_evaluate` over full snapshots.

---

## Phase 2 — Discover locators (token-efficient)

Prefer **`browser_evaluate`** with `filename` — read/grep file, not full output in context:

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
| One login per session | Re-login per element |
| Human UI-mode inspect when MCP cannot unique | Guessing a "close enough" locator |

---

## Phase 3 — Write page object

Follow `playwright-pom-standard`. Locator priority: `data-testid` → `getByRole` / `getByLabel` → text → CSS.

**Methods call `this.loc.*` only** — never inline `this.page.getByRole` / `getByTestId` in methods (harvested loc maps get bypassed by assumed dialog names).

Register new pages in `steps/fixtures.ts`.

---

## Phase 4 — Write step definitions

1. Search `steps/` for duplicate step text.
2. Add page-name suffix per `step-conflict-resolution` if conflict exists.
3. Keep steps thin — delegate to page `expect*` / interaction methods.
4. Run `npx bddgen` — fix any "Multiple definitions matched" errors.

---

## Phase 5 — Discover assertion text (live app)

Use `browser_evaluate` before encoding exact strings in `expect*`. Match punctuation from live DOM.

---

## Phase 6 — Validate

```bash
npx bddgen
yarn test -g @<module-tag> -- --grep "@Your-Scenario-Tag"
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
- Heuristic chains (`button` filter `hasText: /^(?!Cancel|Save)/`)
- Snapshot refs (`e12`) copied into POM
- Page methods using `this.page.getBy*` instead of `this.loc.*`

### MCP uniqueness protocol (closest substitute for 1 of 1)

1. Reproduce state (open drawer/modal/menu).
2. List testids in that subtree.
3. Prefer exact `data-testid` on the target, else closest parent with a testid.
4. Prove count:

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

5. If `count !== 1`: walk parents for a unique testid, then **scope** (`parent.getByRole(...)`). Re-count. Persist only at `count === 1`.
6. If still not unique → **stop. Do not guess.** Escalate to human: `yarn test --ui` → Locators tab → Inspect parent/child until **1 of 1** → paste into `loc` map.

## Quick checklist

```
- [ ] Read existing POM `loc` map first
- [ ] browser_navigate + login once
- [ ] Reproduce modal/filter state before harvest
- [ ] browser_evaluate → testids + count === 1 (or parent-scope then re-count)
- [ ] If MCP cannot unique → stop; human UI mode + inspect; do not guess
- [ ] Write loc map only; methods use this.loc.* (no inline this.page.getBy*)
- [ ] Thin step defs; check step conflicts
- [ ] npx bddgen + targeted test run
```
