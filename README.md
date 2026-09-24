# icm-prod-automation

Standalone Playwright BDD repository for running the ICM automation suite against **production** (`https://icm.pieq.ai/`), separated from the preprod monorepo per lead directive. The preprod regression suite remains in the original repo (`pieq-ai/pieq-test-automation` / `projects/icm`, branch `pieq-icm`); this repo is the home of all prod test work going forward.

## Provenance

| Item | Value |
|---|---|
| Source | `pieq-ai/pieq-test-automation` → `projects/icm` (branch `pieq-icm`) |
| Clone method | Working-tree copy (941 files / 423 dirs, robocopy) — includes uncommitted working-tree changes from 2026-09-18 |
| Git history | Fresh `git init` — no shared history, no link to the old repo |
| Remote | None — local only until a GitHub repo (`pieq-ai/icm-prod-automation`) is created |
| Old repo | Untouched; remains preprod-primary |
| `.env` | Prod credentials — **gitignored, never commit** |

## Run

```powershell
yarn install                    # first time only
yarn test -g "@smoke-prod"      # prod smoke (96 tests)
yarn test -g "@sanity-prod"     # prod sanity (22 tests)
yarn test -g "@TEST-001-smoke-PROD"  # single scenario by ID
yarn bddgen                     # generate specs only
```

> This repo is the authoritative **prod regression suite** — all 44 modules,
> `@sanity-prod` / `@smoke-prod` / `TEST-*-PROD` tagged, pointed at prod
> templates (`TestFiles-prod-sanity/`) with env-driven credentials from `.env`.
> Only run what you intend — it acts on real prod data.

## Repo layout

```
features/  steps/  pages/  test-data/  utils/   # Prod regression suite (44 modules, -prod tags)
TestFiles-prod-sanity/                         # Prod upload templates (12 module dirs) + seed README
TestFiles/                                     # Shared/no-variant templates (statement-processing, happy-flow, …)
scripts/                                       # gen chain, reporters, excel prep
package.json  playwright.config.ts  .env  .env.example
```

## Prod data gaps (block full `@sanity-prod`)

Source of truth: `TestFiles-prod-sanity/README.md` + original seed handoff (`handoff.md`).

- Statement setups **Aetna ACA** / **MLB** → trial path = **Aetna ACA** (`selectStatementType` fix is in the backend, not a UI setup)
- Commission structures on products (template `ACA - Carrier with OVR - Regular`)
- Payment / transfer / chargeback agents still **Onboarding / No Level** — need Active + levels
- AgentX `600011` — prod LVL5 vs preprod Level I (level assertions may differ)
- Missing agents (NPNs): `120876543`, `0987654321`, `90065`, `600001`, `600002`, `600003`

Until re-seed completes, expect failures in `@sanity-prod` modules blocked by these gaps.

## Operational warnings

1. **This repo hits production.** Uploads, charges, and transfers affect real prod data — only run what you intend.
2. **Excel prep mutates templates.** Advance/cancellation prep auto-increments Customer UID and writes it back to the template (`TestFiles-prod-sanity/<module>/`) each run so a New Policy is created. Recovery/chargeback reuse the stored `PolicyNumber`. Generated uploads land in `<template-dir>/.generated/` (gitignored).
3. **Never commit secrets.** Verify with `git status` before any commit; re-confirm ignore rules before first push.

## References

- `TestFiles-prod-sanity/README.md` — seed map, run overrides, config checklist
- `HANDOFF.md` — repo-creation task + build-phase checklist
- Original repo `projects/icm/handoff.md` — prod seeding handoff