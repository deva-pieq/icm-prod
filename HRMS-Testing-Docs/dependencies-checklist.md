# Dependencies — What I Need From You to Execute E2E

> Green-lit target: `https://people.pieq.ai/` (preprod). Each item is BLOCKING unless marked optional.
> These are the concrete asks; once you supply them I can run the full plan (`e2e-leave-attendance-plan.md`) end-to-end.

---

## 1. Test accounts (BLOCKING — cannot run anything authenticated without these)

| # | Account | Who/what | What I need | Why |
|---|---|---|---|---|
| D1 | **Admin** | bootstrap wildcard `abin*` admin (e.g. `abiney.y@pieq.ai` — is it current?) | username + password + confirm still wildcard `*` | all-modules access; setup helper data |
| D2 | **Employee** | a real user w/ employment + `official_email` matching SSO | username + password + their emp code | apply leaves, check-in/out own record |
| D3 | **Manager** | employee who is the reporting manager of D2 in employment | username + password (can reuse D2 if they have a manager reporting to them — tell me the tree) | approve/reject flow, team dashboard |
| D4 | **RBAC-forger (optional)** | a role with ONLY `attendance_record:view`, no `:manage`, no admin | role name + a user in it | prove F1 write-permission escalation |

> If it's easier, give me a realm/service-account token with a scoped set of users, or a throwaway env where I can self-provision. Say which.

---

## 2. Data & environment facts (BLOCKING for exact assertions)

| # | Item | Why |
|---|---|---|
| D5 | **Current "today" anchor** | Accrual/cutoff LOP math depends on calendar. I last ran against `2026-09-21`. Give me the date you want the run anchored to (or confirm "use whatever today is; I'll recompute"). |
| D6 | **Leave policy config** | Confirm seed cuids still valid (`lt_cl`, `lp_cl_cs`, `lp_cl_s`, `hol_2026_independence`) or that I may create fresh policies/types for tests. |
| D7 | **Office location w/ lat/lon** | Confirm D2/D3's employment has `location_cuid` → CompanyLocation with real coords (geofence 100 m). I need the office coords to compute in/out-zone test points. |
| D8 | **Employment windows** | DOJ / relieving for D2, D3 so check-in-window tests are unambiguous. |
| D9 | **DB access (optional but ideal)** | Read-only `DATABASE_URL` to verify upserted attendance rows, audit rows, and to seed the F2 "wrong status spelling" record. If not possible, I use only API evidence. |
| D10 | **Timezone config** | What TZ does the server run in? (Code uses `new Date()` server-local + UTC serialization.) Needed to design the F4 midnight-boundary test. |

---

## 3. Environment state (needed for clean runs)

| # | Ask | Why |
|---|---|---|
| D11 | Can I **mutate** preprod data (create leave requests, approve, check in/out, create/update attendance records, create holidays/policies)? | The plan writes live data. If NO, I'll restrict to a dedicated "test employee" you seed, and all deletes/cleanup done at the end. |
| D12 | Is there a **reset/restore** path (seed, snapshot, or DB reset) for the users I touch? | So I can clean up; also for D4 role creation. |
| D13 | Confirm **Playwright/browser session** tolerated in that env (MFA? captcha on login? device-forced?) | Deterministic, headless-friendly. If MFA, I need a way (dev token) or manual session handoff. |
| D14 | **Cron/notifications** — may I trigger `/api/notifications/cron` or is there a real scheduler? | N6 / notification-assertion cases; avoids waiting for real midnight triggers. |

---

## 4. Code-run access (optional — speeds up fixes & local regression)

| # | Ask | Why |
|---|---|---|
| D15 | **Local env** instructions (Postgres + Keycloak or your dev script: `.env`, `docker`/`podman` compose, seed commands) | Enables running `npm run test:e2e` + `test:unit` locally and reproducing F1–F6 against a sandbox. If only preprod is available, skip. |
| D16 | Permission to run `git log`/`gh pr` to diff commits | Already read-only; no ask needed. (Included for completeness.) |

---

## 5. Non-negotiables / guardrails (do before I start)

| # | Item |
|---|---|
| D17 | Confirm your **ownership of the preprod instance** (avoid touching a hostile target). |
| D18 | Priority order if conflicts: **no destructive/irreversible ops**; prefer REST-created test data that I clean up; empty-state and read-only cases first. |

---

## Summary of critical path

1. D1–D3 accounts (+ D11 mutation OK, D12 reset path) → I begin Stage 1 API probes.
2. D5–D8 facts → I finalize exact expected values.
3. D13 (auth tolerances) → I begin Stage 3 UI journeys.
4. D9/D15 optional → accelerates fix verification.

**Once you reply with D1–D8 (and D11–D13), I can start immediately.** Everything else is parallel/optional.