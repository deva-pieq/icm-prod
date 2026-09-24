# HANDOFF — `icm-prod-automation` (ICM Prod Environment Test Repo)

**Date:** 2026-09-18
**Owner:** QA Automation (ICM)
**Status:** Build phase complete — env wired, dependencies installed, generation/discovery verified, initial commit `fe29fbf` (local, no remote). First live prod run still pending (user-initiated).

---

## 1. Purpose

Standalone repository dedicated to running the ICM automation suite against
**production** (`https://icm.pieq.ai/`), per lead's directive to separate the
prod test project from the preprod monorepo. The preprod regression suite
continues to live in the original repo; this repo is the home of all
**prod-environment test work going forward**.

## 2. Provenance

| Item | Value |
|---|---|
| Source repo | `pieq-ai/pieq-test-automation` (local: `Desktop\pieq-cursor\pieq-test-automation`) |
| Source path | `projects/icm` (branch `pieq-icm`) |
| Clone method | **Working-tree copy** (not `git clone`) — includes uncommitted changes present on 2026-09-18 (xlsx templates, `package.json`, `MmpFlowPage.ts`, `CommissionStructurePage.ts`, `test-prod/ProdTestFiles/*.xlsx`) |
| Copy status | **Done** — 941 files, 423 dirs copied via robocopy; junk excluded |
| Git history | **Done** — fresh `git init` + single initial commit `fe29fbf`, no link to old repo |
| Remote | **None yet** — local only; create GitHub repo later and `git remote add origin <url>` |
| Old repo | **Untouched** — remains the preprod-primary automation home |

## 3. Locked User Decisions (do not change without re-asking)

1. **Scope** — full `projects/icm` copy (all regression features/steps/pages
   kept as reference), not a lean `test-prod`-only repo, not the full monorepo.
2. **Copy source** — working tree as-is (preserves uncommitted changes). ✔ done
3. **Git** — fresh init, no shared history with the old repo.
4. **Remote** — local only for now; no push until user creates the GitHub repo.
5. **`.env`** — existing prod credentials carried into the new repo (root +
   `test-prod/`); both are **gitignored and must never be committed**.
6. **CI** — intentionally skipped for v1; add a prod workflow later.
7. **Live run** — no live prod run at build time; first run is user-initiated.

## 4. Repo Structure

```
icm-prod-automation/
├─ features/                  # Full ICM feature set (preprod regression kept as reference)
├─ steps/  pages/  test-data/ # Step defs, page objects, module configs
├─ utils/                     # Contexts + Excel prep (Customer UID auto-increment)
├─ TestFiles/                 # Preprod template set (reference)
├─ TestFiles-prod-sanity/     # Prod seed templates (test- alias rewrites) + README
├─ scripts/                   # prep-prod-sanity-testfiles.mjs, bddgen chain, reporters
├─ test-prod/                 # ★ PROD SUITE — see §7
│  ├─ features/               # 15 pruned features (@smoke-prod / @sanity-prod)
│  ├─ steps/ pages/ test-data/ utils/   # Rewired TestFiles → ProdTestFiles
│  ├─ ProdTestFiles/          # Prod upload templates (12 module dirs)
│  ├─ playwright.config.ts    # Prod baseURL default
│  └─ .env                    # Prod creds (gitignored)
├─ package.json / yarn.lock   # Deps; `yarn test:prod` entry point
├─ playwright.config.ts       # Root config (to become prod-primary)
├─ .env / .env.example        # Prod creds (gitignored) / prod defaults
├─ README.md                  # Provenance, run commands, prod data gaps
└─ HANDOFF.md                 # This file
```

Also present (copied): `AGENTS.md`, `opencode.jsonc`, `skills-lock.json`,
`test-runner.py`, `playwright.agent-activation.config.ts`, `.opencode/`,
`.cursor/`, `.agents/`, `docs/`, `handoff.md` (original prod-seeding handoff —
**distinct from this HANDOFF.md; do not delete**).

Excluded from copy (local junk): `node_modules/`, `.features-gen/`,
`.generated/` (all levels incl. `ProdTestFiles/*/.generated/`),
`test-results/`, `playwright-report/`, `cucumber-report/`, `.playwright-mcp/`,
`locators/`, `.ci/`, `graphify-out/cache|converted/`, `test-output.txt`.

## 5. Environment Configuration

- **Root `.env` (target: prod-primary):** `BASE_URL=https://icm.pieq.ai/`,
  `E2E_EMAIL*` + `E2E_PASSWORD` = prod credentials (saadiyamalan.a@pieq.ai
  per seed handoff), keep existing GMAIL_*/SLACK_* keys, set
  `REPORT_ENV=prod`, `REPORT_TAG=icm prod`. **Done — merged from
  `test-prod/.env` (BASE_URL, E2E_EMAIL, E2E_PASSWORD, E2E_EMAIL_ADVANCE,
  E2E_EMAIL_AGENCY3, REPORT_ENV, REPORT_BASE_URL); `E2E_EMAIL_ADVANCE` and
  `E2E_EMAIL_AGENCY3` were added as new keys; `REPORT_TAG=icm prod` set.**
- **`test-prod/.env`:** own prod creds (loaded by `utils/loadEnv.ts` from cwd).
- **`.env.example`:** update documented default `BASE_URL` to prod URL.
- Runtime env vars win over `.env` (parent process env wins) — CI or shells
  can override per run.

> ⚠️ Prod **password value** present in `.env` files — never print it, never
> commit it.

## 6. How to Run

From repo root:

```powershell
yarn install                      # first time only
yarn test:prod                    # generate specs + run test-prod suite
yarn test:prod -g "@smoke-prod"   # prod smoke only
yarn test:prod -g "@sanity-prod" # prod sanity only
```

Or directly from `test-prod/` (see `test-prod/README.md`):

```powershell
npx playwright test -g "@smoke-prod"  --retries=0 --reporter=line
npx playwright test -g "@sanity-prod" --retries=0 --reporter=line
```

> ⚠️ `yarn test` (root suite, no `-g` filter) runs the **preprod regression
> features** — now pointed at **prod** by the root `.env`. Do **not** run it
> against prod; those scenarios are not prod-adapted and will create/modify
> real data. Prod-safe entry point is `yarn test:prod` with the
> `@smoke-prod` / `@sanity-prod` tags only.

## 7. Prod Suite Scope (`test-prod/`)

- `smoke/smoke.feature` — `@smoke-prod`
- 11 e2e sanity features — `@sanity-prod`: advance-only, advance-recovery,
  advance-adjustment, advance-commission-only, chargeback,
  commission-statements (renewal), happy-flow, policy-cancellation
  (agency-advance / agency-credit / carrier-advance), mmp-flows
- 3 features present but not prod-tagged (run by their own tags):
  `agent-master/create-agent`, `e2e-transfer-sheet/transfer-sheet`,
  `transfer-sheet/upload-and-check`
- **Excluded per directive:** commission-report and commission-split e2e

## 8. Prod Seed Data — Current State & Gaps

Source of truth: `TestFiles-prod-sanity/README.md` and seed handoff in old repo
(`projects/icm/handoff.md`).

**Done (per checklist):**
- [x] Advance setup: product `test-aetna-aca-advance-july-21` — default 100, monthly 50
- [x] Transfer sheet: Active rule, effective 09/16/2023, agent `test-Agent Test Transfer` (NPN 120876543) + `test-Aetna-Test-Product`
- [x] Prod templates built (`ProdTestFiles/`, aliases rewritten to `test-` via `scripts/prep-prod-sanity-testfiles.mjs`)

**Pending (blocks full `@sanity-prod` pass):**
- [ ] Statement setups **Aetna ACA** / **MLB** missing in prod Statement Setup — trial path = **Aetna ACA**; if `selectStatementType` fails → fix in backend, do not invent UI setups
- [ ] Commission structures on products (template `ACA - Carrier with OVR - Regular`) — not done yet
- [ ] Agent levels / Active status — payment/transfer/chargeback agents still Onboarding / No Level
- [ ] Verify AgentX `600011` — prod LVL5 vs preprod Level I (level assertions may differ)
- Missing agents (if re-seed needed): NPNs `120876543`, `0987654321`, `90065`, `600001`, `600002`, `600003`

**Data mapping:** products/aliases `test-` prefixed; agents matched by NPN
(display names `test-`); `Aetna ACA`/`MLB` statement types → **Aetna ACA**;
`deva.r@pieq.ai` → overridden via `E2E_EMAIL*`.

## 9. Operational Warnings

1. **This repo hits production.** Uploads, charges, transfers executed here
   affect real prod data. Only run what you intend to run.
2. **Excel prep mutates templates.** Advance/cancellation prep auto-increments
   Customer UID and writes it back to the template (`ProdTestFiles/`) so each
   run creates a New Policy. Recovery/chargeback reuse the stored PolicyNumber.
3. **Never commit secrets.** `.env` (root + `test-prod/`) is gitignored —
   verify with `git status` before any commit. No remote exists yet; when
   added, confirm secrets are still ignored before first push.
4. **No shared history with old repo.** From the initial commit onward the
   repos diverge; port changes manually if needed.
5. **First live run pending.** Build verification (done 2026-09-18, no prod
   side effects) covered bddgen generation + `playwright test --list` in root
   and `test-prod/`. Expect failures in modules blocked by §8 gaps until
   re-seed completes.
6. `handoff.md` (lowercase) in the repo root is the **original seeding
   handoff**; this `HANDOFF.md` documents the **repo-creation task**. Keep
   both.

## 10. Next Steps (in order)

Build-phase completion (current task):
1. [x] Prod-primary env wiring (§5) — merge `test-prod/.env` into root
   `.env`, update `.env.example` default to prod.
2. [x] Root `README.md` — clone provenance, run commands, prod data gaps,
   regression-reference warning.
3. [x] `yarn install` (fresh node_modules).
4. [x] Verify (no prod side effects): `yarn bddgen`; test-prod gen chain;
   `npx playwright test --list` in root (839) + `test-prod/` (116 tests, 14
   feature specs — `mmp/validate-mmp-flows.feature` present but `@skip`-tagged
   (pre-existing, blocked by Aetna ACA/MLB statement setups)). Initial commit
   `fe29fbf` created 2026-09-18.
5. [x] `git init` → pre-commit safety check (`git check-ignore .env` +
   `test-prod/.env`, `git status` free of secrets/junk) → single initial
   commit. No remote, no live prod run.

Post-build (operational):
1. [ ] Re-seed prod data gaps (§8): statement setups, commission structures,
   agent levels/Active.
2. [ ] First live run: `yarn test:prod -g "@smoke-prod"` → triage → then
   `-g "@sanity-prod"`.
3. [ ] Create GitHub repo (e.g. `pieq-ai/icm-prod-automation`), add origin,
   push.
4. [ ] (Optional) Add CI: adapt `smoke-on-merge.yml` (old repo root) for prod —
   schedule + `workflow_dispatch`, secrets for prod env + Slack.
5. [ ] Keep this HANDOFF updated as gaps close.

## 11. References

- `test-prod/README.md` — prod module wiring + generate/run chain
- `TestFiles-prod-sanity/README.md` — seed map, run overrides, config checklist
- `scripts/prep-prod-sanity-testfiles.mjs` — regenerate prod templates
- Old repo: `projects/icm/handoff.md` — original prod seeding handoff
- Old repo: `docs/preprod-smoke-after-deploy.md` — CI dispatch pattern (for future prod CI)