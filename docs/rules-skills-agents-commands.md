# ICM — Rules, Skills, Agents & Commands Inventory

## Cursor Rules (10)

| # | Rule | One-line description |
|---|---|---|
| 1 | `step-conflict-resolution` | Check for step definition conflicts before adding Gherkin steps; add page-name suffix if two modules share the same text |
| 2 | `feature-test-case-ids` | Every scenario needs a unique `@TEST-{NNN}-{Module}-{Area}` tag |
| 3 | `playwright-pom-standard` | POM structure: `loc` map, interactions, assertions read-only; complex cross-page assertions go in `*Assertions.ts` |
| 4 | `assertion-patterns` | `@bug` handling, before/after capture pattern, sidebar/modal heading validation |
| 5 | `bdd-contextual-assertions` | Never ship visibility-only `Then` steps; assert content, values, columns — use MCP for live text |
| 6 | `module-regression` | Each module tag gets isolated browser context; locator hierarchy: POM → MCP |
| 7 | `escalate-on-stuck` | After a simple fix attempt fails, escalate to human — no endless retry loops |
| 8 | `browser-discovery-opencode-mcp` | Use OpenCode + Playwright MCP for live-app locator discovery (playwright-cli disabled) |
| 9 | `package-scripts` | Keep `package.json` scripts minimal — `yarn test -g` for modules, no per-module aliases |
| 10 | `agency-owner-role-parity` | Fill module gaps without duplicating agency dashboard; reuse smoke POM/steps; discover owner menus live |

## Cursor Skills (6)

| # | Skill | One-line description |
|---|---|---|
| 1 | `bdd-playwright-cli` | From a `.feature` file, write step definitions and page objects in POM format; use MCP for live discovery |
| 2 | `bdd-contextual-assertions` | Add strong scenario-specific assertions — headings, modals, grids, inputs, columns, filter outcomes, before/after |
| 3 | `fix-harvested-e2e-tests` | Diagnose and fix failing BDD tests after codegen; investigate live app, patch minimally, verify green |
| 4 | `playwright-cli` | Automate browser interactions — open, click, fill, snapshot, eval commands |
| 5 | `statement-processing` | Debugging reference for statement/advance/commission processing flows — shared skeleton for all modules |
| 6 | `validate-csv-bdd-coverage` | Audit CSV/Excel test cases against Gherkin features; verify every row maps to a scenario with strong assertions |

## OpenCode Skills (9)

| # | Skill | One-line description |
|---|---|---|
| 1 | `playwright-bdd-regression` | **Umbrella skill** — full ICM conventions: architecture, module isolation, test case IDs, POM templates, `common.steps.ts` |
| 2 | `bdd-playwright-cli` | Same as Cursor — write step defs + POM from `.feature` files; use MCP for live discovery |
| 3 | `bdd-contextual-assertions` | Same as Cursor — strong scenario-specific assertions; never visibility-only |
| 4 | `fix-harvested-e2e-tests` | Same as Cursor — diagnose and fix failing tests; triage → investigate → patch → re-run |
| 5 | `assertion-patterns` | Three recurring patterns: known-bug handling, before/after capture, sidebar/modal heading validation |
| 6 | `feature-test-case-ids` | Require unique `@TEST-{NNN}-{Module}-{Area}` tags on every Gherkin scenario |
| 7 | `step-conflict-resolution` | Check step definition conflicts; add page-name suffix when two modules share the same text |
| 8 | `statement-processing` | Same as Cursor — debugging reference for statement/advance/commission processing flows |
| 9 | `validate-csv-bdd-coverage` | Same as Cursor — audit CSV rows against features; verify assertion depth on every Expected Result |

## OpenCode Agents (2)

| # | Agent | One-line description |
|---|---|---|
| 1 | `regression-writer` | Writes new BDD tests from spec/CSV/manual cases; plans file structure, discovers locators, writes bottom-up, validates with `yarn test` |
| 2 | `regression-fixer` | Diagnoses and fixes failing tests; narrow `--grep` runs, classifies failures, minimal patches, verifies green or tags `@bug` |

## OpenCode Commands (2)

| # | Command | One-line description |
|---|---|---|
| 1 | `/run-test <tag> [--headed]` | Run `yarn test -g @<tag>` from the project directory |
| 2 | `/fix-test <module> [grep]` | Run failing tests, follow fix skill, re-run until green or confirmed `@bug` |

## Summary

| Component | Count |
|---|---|
| Cursor Rules | 10 |
| Cursor Skills | 6 |
| OpenCode Skills | 9 |
| OpenCode Agents | 2 |
| OpenCode Commands | 2 |
| **Total** | **29** |
