# ICM Prod Automation — Migration Plan

> Consolidation of the whole working session: objective, phase plan, verified
> ground truth, decisions, and open items. This is the single source of truth
> for what we are doing and where we are. Repo root:
> `C:\Users\user\Desktop\icm-prod-automation` (git repo, single scaffold
> commit `fe29fbf`).

---

## 1. Objective

Fold the `projects/icm` prod-testing working tree into a single, self-contained
prod-regression repo (`projects/icm` under this root) so that the **prod sanity
suite** (`@sanity-prod` / `@smoke-prod`) is the one authoritative regression
suite for the ICM app, replacing the old pre-prod `test-prod/` duplicate set.

Scope, per user decisions:
- **Keep ALL 44 root modules** — no pruning, re-point each to prod templates.
- **Keep roles (agent, sales-leader, agency-* ops, ops-manager)** — only remove
  hardcoded credentials, keep the role helper structure.
- **Keep the `-prod` tag/ID scheme** (`@sanity-prod`, `TEST-*-PROD`).
- **Remove all hardcoded `deva.r@pieq.ai` (and friends) credentials** — replace
  with env-driven values from `.env` (user-owned, `E2E_EMAIL*` keys). No repo
  secrets, no invented production identities.
- Refactor is **env-driven, not deva.r-driven**; a user-supplied ops-manager
  email in `.env` is the canonical credential for the ops-manager role.

---

## 2. Verified Ground Truth (current baseline)

Confirmed with `git status` / `git log` / `git show HEAD` / `tsc`:

- Repo: `icm-prod-automation`, single commit scaffold, working tree otherwise
  clean except for handoff notes (those are temp artifacts: move to recycle bin
  when done — never hard-delete).
- `utils/loadEnv.ts` — the credential backbone — currently **compiles clean**
  (tsc = 0 errors) after a `git checkout -- utils/loadEnv.ts` restore to the
  git baseline.
  - As-restored it still has **4 hardcoded `deva.r` references**
    (2 real fallback emails + 2 doc comments) and **no `opsManagerEmail()`
    helper yet**.
  - This is the exact Phase-1 target: the file was mid-refactor and the working
    tree had become error-laden; we restored the clean baseline and will redo
    the refactor in ONE careful pass.

---

## 3. Phase Plan

### Phase 1 — Ops-manager credential refactor (utils/loadEnv.ts)
*Status: DONE. Added `opsManagerEmail()` (E2E_EMAIL ?? LOGIN_VALID_EMAIL); `
advanceE2ECredentials` → E2E_EMAIL_ADVANCE ?? opsManagerEmail(); `
agency3OpsCredentials` → E2E_EMAIL_AGENCY3 ?? opsManagerEmail(); missing-`
email/password throw. 0 deva.r in loadEnv.ts; tsc = 0.*
- Add **one** `opsManagerEmail()` helper reading `E2E_EMAIL ?? LOGIN_VALID_EMAIL`
  (env-driven, no hardcoded email).
- Rewire the two hardcoded fallbacks (`advanceE2ECredentials`,
  `agency3OpsCredentials`) to read their role override key
  (`E2E_EMAIL_ADVANCE` / `E2E_EMAIL_AGENCY3`) and fall back to
  `opsManagerEmail()`.
- Keep roles/role helpers intact; remove only the hardcoded `deva.r`
  credential strings.
- Gate: `npx tsc --noEmit` = 0 errors.

### Phase 2 — Prod template rewire (delegate to subagents)
*Status: DONE. 12 modules re-pointed to `TestFiles-prod-sanity/<M>` by subagents;`
plus commission-split + commission-report → `ValidateCommissionSplit` with`
fixtures copied (inbox [Oscar U65 CS] CSV + 17 truth-sheet CSVs). 3 no-variant`
modules kept on `TestFiles/` with clarifying comments. All 25 referenced prod`
templates verified on disk (`Test-Path -LiteralPath`). dropbox/ not consumed by`
test code — not copied.*
- Re-point each root module from `TestFiles/` templates to the prod set
  (`TestFiles-prod-sanity/` canonical), per module, per user decision B:B
  (keep all modules, re-point to prod).
- Delegate heavy per-module exploration to subagents.

### Phase 3 — Tags / IDs prod rename
*Status: DONE. 43 .feature files + 1 .feature.skip renamed via`
`rename-prod-tags.mjs` (idempotent; @sanity-prod x31, @smoke-prod x97,`
`TEST-*-PROD x687; standalone @sanity/@smoke = 0; every @TEST-* has -PROD).`
`test-runner.py + taxonomy.json + grep_map.py + skills + context messages +`
`SESSION_FILE → TestFiles-prod-sanity updated for the -prod scheme.*
- `@sanity` → `@sanity-prod`, `@smoke` → `@smoke-prod`; scenario IDs
  `TEST-*-PROD`; keep the `-prod` scheme.

### Phase 4 — Collapse duplicate prod dirs
*Status: DONE (user-approved). `test-prod/` recycled via recycle.ps1; `test:prod`
script removed from package.json; README + plan.md refs updated. Verification:`
0 test-prod source files missing from root, ProdTestFiles fully mirrored in`
`TestFiles-prod-sanity` (happy-flow CSVs hash-identical under TestFiles/),`
test-prod `.env` values identical to root `.env` (spacing bug in root lines`
fixed), only unique file was legacy `scripts/fix-prod-tags.mjs` (superseded by`
Phase 3 rename — discarded).*
- Remove `test-prod/` + duplicate `TestFiles-prod-sanity/` via recycle bin
  (`.opencode/scripts/recycle.ps1` — never `rm`/hard delete).
- Collapse `test:prod` → `test` in package.json scripts.

### Phase 5 — Verify + close
*Status: DONE (dry-run scope). `yarn bddgen` exit 0; `npx tsc --noEmit` = 0;`
`--list` resolves @smoke-prod → 96 tests, @sanity-prod → 22 tests (17 files).`
`All non-deferred deva.r removed (MmpSettingsPage derived email,`
`MMP.opsEmail → agency3OpsCredentials().email, 3 doc comments). Remaining`
`deva.r only in §5.3-deferred paths + graphify-out/graph.json (generated).`
`Final live-app smoke run NOT executed (requires app up + user go-ahead).*
- `bddgen` + `tsc` + a dry prod smoke run.
- Final grep for `deva\.r` in non-doc, non-generated paths = 0.

---

## 4. Approach / Working Conventions

- **Build first, verify immediately**: run the test once right after code
  generation; fix in ≤2–3 iterations, then **escalate to a human** (do not keep
  guessing).
- **No hard deletes**: all removals via recycle bin.
- **Credentials are user-owned + env-driven**: `.env` holds `E2E_EMAIL*` +
  `E2E_PASSWORD`; never hardcode `deva.r@pieq.ai` / friends in repo source.
- **Include only prod**: this is a prod-sanity suite; strip pre-prod-only
  template dirs and cred helpers.
- **Delegate heavy exploration to subagents** to conserve context (user
  instruction).
- Typecheck: `npx tsc --noEmit -p tsconfig.json`.

---

## 5. Open Items / Decisions Needed

1. **Phase 1 approach** — RESOLVED: single clean `opsManagerEmail()` refactor
   applied and gated (tsc = 0).
2. **Canonical prod templates per module** — RESOLVED: `TestFiles-prod-sanity/`
   for the 12 variant modules + `ValidateCommissionSplit` for commission-split/
   report; 3 no-variant modules stay on `TestFiles/`. 25/25 files verified.
3. **Deferred (not this pass)**: hardcoded `deva.r` refs inside
   `utils/agent-activation/*`, `test-data/payment-module/paymentModule.ts`
   (role fallbacks), and 20 `.feature` files (24 files incl. spec) — each a
   separate cleanup tracked after Phase 1–5. `graphify-out/graph.json` is a
   generated artifact (not source).
4. **Phase 4 deletion** — RESOLVED: `test-prod/` recycled on user go-ahead;
   `TestFiles-prod-sanity/` is the ACTIVE canonical template set (root configs
   point at it) and is retained, as is `TestFiles/` (no-variant modules).
5. **Live-app dry smoke run** — NOT run in this session; run
   `yarn test -g "@sanity-prod"` against live preprod when the app is up.

---

## 6. Key Files

| Path | Role |
|---|---|
| `utils/loadEnv.ts` | Credential backbone — Phase 1 target |
| `utils/loadEnv.spec.ts` / `*.spec.ts` | Credential-helper unit tests |
| `TestFiles-prod-sanity/` | Canonical prod template set (12 dirs) — active |
| `TestFiles/` | No-variant module templates (statement-processing, happy-flow, …) |
| `features/**` | Gherkin (Phase 3 tags/IDs) |
| `steps/**`, `pages/**`, `utils/**` | Module registry + helpers |

---

_Last updated: session handoff — see `handoff-before-merge-*.md` snapshots for
the live diff map and per-module re-pointing table._
