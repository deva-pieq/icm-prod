# Leave Regression — Test Data & Dependencies

Companion to `docs/leave-policy-regression-plan.md`. Defines the exact data seed
(`prisma/seed-leave-regression.ts`), the reference cuids the cases execute
against, and every dependency that must be resolved before the suite is
actionable — with how to resolve each.

## 1. Reference constants (resolved `<...-cuid>` placeholders)

| Plan placeholder | Seed constant `REF.` | cuid value |
|---|---|---|
| `<E1-cuid>` … `<M1-cuid>` | E1..M1 | `emp_alice_2024`, `emp_bob_2025`, `emp_carol_2026`, `emp_dan_2024`, `emp_eve_2023`, `emp_mary_2023` |
| `<empl-E1-cuid>` … | EMPL_E1..M1 | `empl_alice`, `empl_bob`, `empl_carol`, `empl_dan`, `empl_eve`, `empl_mary` |
| `<CL-cuid>` | LT_CL | `lt_cl` |
| `<SL-cuid>` | LT_SL | `lt_sl` |
| `<EL-cuid>` | LT_EL | `lt_el` |
| `<ML-cuid>` | LT_ML | `lt_ml` |
| `<PL-cuid>` | LT_PL | `lt_pl` |
| `<LWP-cuid>` | LT_LWP | `lt_lwp` |
| `<BL-cuid>` | LT_BL | `lt_bl` |
| `<CL-policy-cuid>` | LP_CL | `lp_cl` |
| (same pattern) | LP_SL…LP_BL | `lp_sl` … `lp_bl` |
| `<permanent-cuid>` / `<contract-cuid>` | ET_PERMANENT / ET_CONTRACT | `et_permanent` / `et_contract` |
| Holidays | HOL_INDEPENDENCE / HOL_CHRISTMAS | `hol_2026_independence` (2026-08-15), `hol_2026_christmas` (2026-12-25) |
| Settings | SETT_PAYROLL_CUTOFF | `sett_payroll_cutoff` (`payroll_cutoff` / `{"payroll_cut_off_date":25}`) |
| Department / Designation | DEPT_ENGINEERING / DESIGNATION_ENGINEER | `dept_engineering` / `desg_engineer` |

Prisma itself regenerates these constant maps on every run, so each case uses
the literal cuid. Substitution in SQL: use the `REF` constants directly.

## 2. Setup (once per test database)

```bash
# 1. Test DB up + schema in place (generated client is gitignored -> must generate)
npm run db:generate            # prisma generate  -> src/lib/generated/prisma
DATABASE_URL="postgresql://postgres:password@localhost:5432/hrms_leave_test" npm run db:deploy
#    or:  DATABASE_URL=... npm run db:push
cp .env.example .env.test     # then set DATABASE_URL + SSO vars in .env.test (committed pattern: `!.env.test`)
#    NOTE: .env.test is the repo's convention; test:unit already runs under `dotenv --`

# 2. Seed (full reseed with deterministic cuids)
npx dotenv -e .env.test -- tsx prisma/seed-leave-regression.ts
# Wipe-only (per-case reset helper):
npx dotenv -e .env.test -- tsx prisma/seed-leave-regression.ts --reset
```

`--reset` wipes `leave_requests`, `leave_balances`, `attendance_records`,
leave/policy/type rows, holidays, employments, employees, settings, auth rows,
employment types, designations, departments in FK-safe order. Re-run full seed
to restore.

## 3. Dependencies — what must exist for the plan to run

| # | Dependency | Why it blocks | Resolution | Owned by |
|---|---|---|---|---|
| D1 | Disposable PostgreSQL with `DATABASE_URL` | `db.ts` throws if unset; seed wipes data | Point `.env.test` at `hrms_leave_test`, never shared/prod. Seed prints target DB host on run. | DB owner |
| D2 | `prisma generate` output | `src/lib/generated` is gitignored; seed + app import `$lib/generated/prisma/client.js` | `npm run db:generate` | repo |
| D3 | Settings row `payroll_cutoff` → `{"payroll_cut_off_date":25}` | `getPayrollCutoffDay()` throws without it; every L-COUNT-01 cycle + recount uses it | Seeded (`sett_payroll_cutoff`). Do not `saveSetting` a second row — DAO always reads latest `created_at`, so duplicates silently change cutoff day | seed |
| D4 | 2026 holidays seeded | `calculateLeaveDays`/`getHolidaysCached` count working days using them; L-APP-17 (2026-12-25) and L-CAL-01 (Aug/Christmas windows) require these holidays | Seeded. **Cache is year-agnostic**: `getHolidaysCached()` reads ALL rows, so prune any pre-existing holiday rows (seed does) | seed |
| D5 | Holiday cache invalidation when seeding/writing holidays in-process | `getHolidaysCached` memoizes; a holiday inserted/skipped after first read silently changes all later date math | Seed runs in its own process (cache starts cold). If tests write holidays at runtime, call `invalidateHolidayCache()` from `leave.config.ts` | suite/seed |
| D6 | Employees + employments with `official_email`, `keycloak_sub`, `system_role_cuid`, `reporting_manager_cuid` | API calls resolve identity via `auth.dao.findAuthUserByKeycloakSub` (joins employments↔employees↔system_roles) and leave logic via `getActiveEmploymentByOfficialEmail`; approval path walks `reporting_manager_cuid` (E1…E5→M1) | Seeded: e.g. `alice@test.local`, `kc-sub-e1`, `sr_employee`, `empl_mary` | seed |
| D7 | Keycloak test users + OIDC sessions (API-level runs only) | `hooks.server.js` reads `session.user.id`; `syncAuthenticatedUser` rejects login (`403 'User not found in HRMS database'`) if `keycloak_sub` unknown, or if `system_role_cuid` is null | Provision Keycloak realm users matching `kc-sub-*`/`.test.local` emails for E1, E2, E5, M1 (whoever logs in). Seed gives employments valid non-null `keycloak_sub` + `system_role_cuid` | IAM/SRE |
| D8 | Permissions + role mappings | `permissionGuard.requirePermission` (e.g. `leave:view`, `leave_policy:view`) returns 403 without them | Seeded: `sr_employee`/`sr_manager` + 10 `permissions` + `role_permissions`. Manager role adds `leave_approval:view` for L-APPROVE-* | seed |
| D9 | Time freeze / NOW anchor = 2026-09-21 | `accrueLeaves`, `applyLeave`, getYear-, `new Date()`-driven accrual counts — expected values (9.00 CL, 7.5 SL, 12.00 EL, etc.) are pinned to NOW = 2026-09-21. Running later shifts accrual months | Options: (a) unit-level `vi.setSystemTime(new Date('2026-09-21T00:00:00Z'))` like existing `tests/unit`; (b) API/local run on 2026-09-21; (c) env override + seed `new Date()` shim. Pick one per run and record it | suite |
| D10 | Clean `leave_balances` / `leave_requests` before each case | Plan §4.6 keeps counts hermetic; left-over rows clobber balance assertions | Pre-case reset: run `--reset` (wipes all) then reseed, or script `leaveBalance.deleteMany` + `leaveRequest.deleteMany` for the affected employees | suite |
| D11 | No leftover `leave_balances` from past (year-agnostic LOP/LWP recounts) | `getMonthlyUsedDays` only counts approved requests; stale approved rows drift L-COUNT-01/02 | Same reset as D10 | suite |
| D12 | `min_service_days` semantics (days vs months) reviewed | L-ACC-11 / L-APP-12 depend on the `EL min_service_days = 365` gate; wrong unit flips the pass—fail boundary | Confirm against `leave.service.ts` `calculateMonthsDiff` in review step of plan | reviewer |

## 4. What the seed intentionally does NOT create

- **Leave balances / requests** — each case seeds its own (e.g. L-ACC-09 BL row,
  L-CF-01 2025 EL carry, L-APP-14 pure-LOP BL request). Balances must not be
  pre-seeded or accrual assertions won't cover the write path.
- **TECH probe type** (L-ACC-08) — created ad-hoc in the case with
  `gender_specific=true`, `applicable_gender=Female`, `annual_limit=8`,
  `min_service_days=30`; keep it out of base data so it doesn't pollute D7
  dashboards.
- **Attendance records** — only where a case needs them (L-COUNT recalcs).

## 5. Load / mangled-`$lib` note

`db.ts` imports `$lib/generated/prisma/client.js`. If a clone checkouts out with
mangled `$libln.js` imports (`src/...` showing `$libln`) the checkout is broken —
regenerate via `prepare` (`svelte-kit sync`) before anything else.

## 6. Exit criteria

1. `npm run db:generate` succeeds and `src/lib/generated/prisma/client.js` exists.
2. Full seed + `--reset` round-trip runs green against a throwaway DB.
3. Reference constant map printed by the seed matches §1.
4. A one-pass dry run of L-ACC-01..03, L-COUNT-01, L-APP-17 assertions (the
   date-anchored cases) passes under the D9 time anchor.