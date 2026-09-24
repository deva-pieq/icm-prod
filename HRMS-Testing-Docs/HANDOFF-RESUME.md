# Hand-off / Resume Doc — PieQ HRMS (Leave + Attendance + Leave-Policy E2E)

> **Purpose:** resume the mtac-style exploratory QA pass on `pieq-ai/hrms` in any new session without re-deriving context.
> **Last updated:** 2026-09-22 (server "today" 2026-09-22, a Tuesday/workday).
> **Status:** Leave lifecycle fully live-confirmed. Attendance happy path live-confirmed (holiday removed by user). Leave seeding done + hardcoded-vs-policy gap proven. Blocking item cleared by user ("try now" → re-point manager wiring).

---

## 1. Mission

Run a gated exploratory/E2E quality pass on the hosted preprod HRMS (`https://people.pieq.ai/`) against the local clone of `pieq-ai/hrms` (HEAD `488b0e1`), focused on **Leave Management** and **Attendance**, and verify the claims of `Leave Policy vs Hardcoded Leave Rules.md`.

Produce/update: E2E plan, dependency checklist, findings report, seeding proof, and this hand-off. Nothing is a bug until reproduced live; avoid destructive ops on preprod; flag test-data residue.

---

## 2. Environment & accounts

| Item | Value |
|---|---|
| App | `https://people.pieq.ai/` (preprod) |
| SSO | Keycloak realm `pieq-hrms` @ `https://preprod.auth.pieq.ai/` (OIDC / Auth.js) |
| Clone | `C:\Users\user\Downloads\hrms` @ `488b0e1` — **live build DIFFERS from clone** (see §8 deviations) |
| Report dir | `C:\Users\user\Downloads\hrms-main\hrms-main\docs\` |
| Temp/browser evidence | `.playwright-mcp\` (page/snapshot/console logs), session-default |

### Accounts
| Account | Password | Employee | Role / notes |
|---|---|---|---|
| `deva.r+2@pieq.ai` | `Test@123` | **PQ008** (`kyvuqsrbvtrd5pwesicplr3l`) | Employee. Reports to PQ009 (we re-wired). DOJ 2026-09-21. |
| `deva.r+3@pieq.ai` | `Test@123` | **PQ009** (`pmk1eox2ou569hoicr56yb3l`) | Manager/Admin (wildcard). Lands on Admin Dashboard. Approves PQ008 leaves. |
| `abiney.y@pieq.ai` | `Test@1234` | **EMP002 Abiney** (`zu8uv8h6zjjc0hcx2wr4uwoo`) | Administrator (wildcard). Male, Full Time, DOJ 2026-09-02. Used for leave seeding. |
| `abiney.y+1@pieq.ai` | `Test@1234` (or `Test@123`) | PQ001 (`o8rzgciovcg6448s20r9kyli`) | **LOGIN FAILS** — unusable. Use `abiney.y@` instead. |

### Session state (as of last run)
- Browser was signed in as **PQ009** (`deva.r+3@pieq.ai`). /select page has "Log out" button.
- PQ008 and PQ009 both have a completed check-in/out record for **2026-09-22** (`i0hbdvtts447kgbcr0o5yyab`, `owaozs2t0hfx26fauugg4rh2`).
- Residue list in §6 — do NOT treat as anomalies; they're our own test data.

### Active dates
- Holidays currently in `/api/holidays`: 2026-10-01 (ZZ QA Holiday), 2026-09-28 (New Leave Day), 2026-09-27 (Tomorrow Holiday one), 2026-10-02 (Tomorrow Holiday), 2027-09-21 (Today Holiday). **None on 2026-09-22** (the prior "today" holiday was removed by user — approval: user does that in the app).
- Leave types/policies now seeded so CL/SL/EL/ML/PL/LWP/BL are available.

---

## 3. How to drive the app in a new session

1. Open Playwright browser, navigate to `https://people.pieq.ai/`, sign in via Keycloak (username/password above).
2. Prefer **API probes via `page.evaluate` + `fetch()`** (same origin, authenticated session, `cache:'no-store'` for GETs). Use UI only for login and spot checks.
3. Sign out via the "Log out"/"Sign out" button on `/select` (or the admin nav) before switching accounts.
4. **API contracts** (important — they differ per endpoint):
   - `POST /api/leaves` (self-apply): **camelCase** `leaveTypeCuid, startDate, endDate, isHalfDay, halfDaySession, reason, document, expectedDeliveryDate, isMiscarriage, childBirthDate`. snake_case keys → field undefined → **H3 500**.
   - `POST/PUT /api/leave/types(/[cuid])`: **snake_case** `name(code), code, description, is_paid, requires_approval, status` (name >5 chars; code ≤20 uppercase+underscore).
   - `POST/PUT /api/leave/policies(/[cuid])`: **snake_case** `leave_type_cuid, employment_type_cuids, annual_limit, max_per_month, carry_forward_allowed, max_carry_forward_days, max_annual_carry_forward_days, document_required, document_required_after_days, min_service_days, allow_half_day, gender_specific, applicable_gender, status`.
   - `POST /api/attendance/check-in`: `{attendance_source_cuid?, latitude, longitude}` → 201 / 400 / 409.
   - `PUT /api/attendance/check-out`: `{latitude, longitude, attendance_record_cuid, check_out_time}` — **check_out_time REQUIRED** (400 `Check-out time is required for pending check-out`). Geofence enforced on checkout too.
   - `POST /api/leaves/approvals/[cuid]`: `{action:'approve'|'reject'}` (manager).
   - `POST /api/leaves/[cuid]` (withdraw; DELETE alias = withdraw too). No hard-delete for leaves or attendance-records.
   - Employees list: `GET /api/employees?search=`. Also `GET /api/attendance/me` and `GET /api/leaves` for employee self state.

---

## 4. Completed & live-confirmed (do not re-run unless asked)

### Leave lifecycle (PQ008 ⇄ PQ009, all PASS)
- Apply (UI-L1) → pending + "Leave Application Submitted" notification; balance unchanged until approval.
- Approve (L-APR-03) → `approved`; attendance record `Leave` upserted; balance debited (SL 2.5→1.5); "Leave Request Approved" notification to applicant.
- Reject (L-APR-04) → `rejected`; no attendance record; balance intact.
- Withdraw → `withdrawn`; state guards 400 on any non-pending action.
- Overlap / half-day-not-allowed / weekend-or-holiday-only → 400s with field names.

### Attendance (PQ008 + PQ009, all PASS; holiday was removed to enable this)
- Check-in in-zone `201` (`Present`, lat/lon stored); check-out in-zone `200` (duration computed).
- Out-of-zone check-in `400 You are outside the office zone` (geofence 100 m, Haversine).
- Invalid/missing GPS `400 Invalid GPS coordinates provided.`
- Duplicate check-in `409 Already checked in for today` (guard fires BEFORE geofence).
- Out-of-zone check-out `400` (geofence enforced on checkout too).
- `/api/attendance/me` shape: `{records, pendingRecords, employee}` — leaks sequential `employee.id`.

### Seeding + policy-vs-hardcoded (EMP002)
- Seeds: CL activated + types EL/ML/PL/LWP/BL + 6 policies (Full Time + Contract). See `leave-seeding-proof.md`.
- **Core proof:** custom type **BL `annual_limit:10` → allocated 0**; 1-day apply → `201` `days_from_primary 0, days_from_lop 1` (silent LOP). Matches doc.
- 14 probes; 11 confirmed doc, deviations: `max_per_month` unenforced; pending requests don't move balance rows; live≠clone strictness.

### RBAC (live)
- PQ008 (employee): 403 on `/api/employees`, `/api/leave/types`, `/api/leave/policies`, `/api/attendance-records`; 200 on `/api/attendance/me`, `/api/leaves`, `/api/leaves/settings`, `/api/holidays`.
- PQ009: 200 on all (wildcard). PQ009 forged a Present attendance record for another employee with only `attendance_record:view` → **F1 CONFIRMED** (no owner/geofence check; route guards `attendance_record:view` at `src/routes/api/attendance-records/+server.ts:49`, `[cuid]/+server.ts:45`).

---

## 5. Findings recap (see `findings-v2-mtac.md` for full write-ups)

| ID | Severity | Summary | Status |
|---|---|---|---|
| **H1** | High | Write endpoints gate on `:view` not `:manage` (broken access control) — applies to leave-type/policy admin paths too | Pre-existing, confirmed pattern |
| **H3** | High | `POST /api/leaves` missing `leaveTypeCuid` → **500** (H3), not 400. Root cause = camelCase contract; snake_case re-triggers it | CONFIRMED LIVE |
| **F1** | High | `attendance_record:view`-only holder can create/update attendance records for ANY employee (no ownership check) | CONFIRMED LIVE |
| **F19** | Low/Info | Manager `pendingApprovals` list has no status filter — approved/rejected/withdrawn interleaved into "pending" | CONFIRMED LIVE (`leave.dao.ts:372-380`) |
| **F20** | Medium/Info | `PUT /api/employees/[cuid]/employment` partial body **mutated row despite 409** — don't trust 409 as write-stopping; deployed vs clone SHA mismatch suspected. Verify with GET after PUT | OBSERVED LIVE, root cause open |
| L-APR-05 / M2 | — | Approval blocked unless direct report; validation bugs return 409 instead of 400 | Confirmed pattern |
| Custom-type | Confirmed | New leave type + policy → balance 0 → silent LOP | Confirmed (seeding probe) |
| Misc | — | Sequential DB ids leaked in DTOs (leave `id:100-108`, employee `id:232`); `GET /api/leaves/[cuid]` → 405; `/api/leave/settings` (singular) → 404 (canonical is `/api/leaves/settings`); `/api/auth/logout` POST → 404 (logout via Keycloak UI). Live lists inactive CL type (clone filters it) — another live≠clone diff | Logged |

---

## 6. Residue / test data created (owned by these runs — flag or clean, NOT new defects)

| Residue | Detail | Cleanup |
|---|---|---|
| Leave approvals test req | `iipti80iuqcf7t32vwbxasy3` (approved, SL 09-23) + attendance record `t78u6nov526035puo9bw8vdd` | user's declared test; DB/UI cleanup if unwanted |
| Rejected req | `vk0hwk1hh2qubkj31rtqu0k8` | residue only |
| Withdrawn req | `o5cpvj9qlr89xfu114bc3ntc` | residue only |
| Forged attendance record | `f143mu85boxdjdc43veymcqz` (Present for employee `ad53sjjrn0ntdc9enn0znp8z`, 2026-09-24 09:00–18:00) | **no DELETE route → needs DB cleanup** |
| Pre-existing future record | `2026-09-30 / Present / null times` on `ad53...` | prior residue (not ours) |
| Attendance check-in/out | `i0hbdvtts447kgbcr0o5yyab` (PQ008), `owaozs2t0hfx26fauugg4rh2` (PQ009), 2026-09-22 | our happy-path data |
| Seeding residue | 6 types (CL activated `wkh7pz…`, EL `nwma5…`, ML `x5l7z…`, PL `pv0lg…`, LWP `lbdw0…`, BL `g2lf1…`); 6 policies (`svj1l…, mznop…, dt8kt…, bqs1m…, wydr9…, t5cp2…`); pending requests ids **103–108** (CL×2, LWP, PL, BL, EL) on EMP002 | keep types/policies; withdraw pending requests via `POST/DELETE /api/leaves/[cuid]` |

---

## 7. Not yet run / blocked (for a future session)

| Item | Blocker / requirement |
|---|---|
| AT-API-05/15 — check-in on Leave/LOP day | leave-created attendance record exists (09-23) → could probe that day once date permits or via date tricks |
| AT-API-06 — check-in on half-day leave | no half-day-friendly type (SL/BL `allow_half_day:false`) |
| AT-API-09 — check-in before DOJ / after relieving | need a second non-active employee or date setup |
| AT-API-14 — pending check-out 7-day grace window, day-8 expiry | requires leaving a record open 8 days (creates residue) |
| AT-API-16 — weekend check-in behavior | weekend check-in appears allowed by code (no weekend rule) → confirm + flag |
| AT-API-07 — duplicate check-in w/ open record (409) | needs an intentionally open record |
| X-02/X-03 — half-day / LOP attendance rows | no half-day type; LOP type filtered from UI |
| UI-AT1..7 — attendance widget journeys | API-level verified; UI widget flow not yet driven live |
| F20 root cause — deployed SHA vs clone `488b0e1` | needs deployed commit identity / git access or DB inspect |
| Forger role (F1 severity for non-admin view-only user) | role not created; proved via admin PQ009 instead |
| Audit-logs deep check (Stage 5) | partial only (employment PUT audit row seen) |
| EL carry-forward year-rollover | not exercised (year boundary) |

---

## 8. Deviations between live build and clone @ `488b0e1` (verify against deployed source before trusting clone)

1. **EL⇄CL sandwich strictness:** live rejects `EL 09-29..09-30` appended after `CL 09-23..09-25` (gap 09-26 Fri + weekend) with "Casual Leave cannot be combined or appended with EL or SL"; clone's `workingDaysBetween` (`leave.service.ts:1144-1151`) would allow it.
2. **Inactive types listed:** live `GET /api/leave/types` returns CL while `status:false`; clone DAO filters to `status:true` (+ excludes LOP).
3. **Employment PUT writes despite 409** (F20): clone validates before transaction (`employment.service.ts:45` vs ~100); live persisted anyway.
4. Practical implication: always confirm behavior **live**; treat clone as white-box hint only.

---

## 9. Next moves (recommended order)

1. **If no new instruction:** consolidate — update `e2e-leave-attendance-plan.md` and `module-functionality-checklist.md` verdicts to match `findings-v2-mtac.md` + `leave-seeding-proof.md` (gap: plan doc AT-API statuses now need the attendance results + seeding links).
2. **Cleanup pass (ask user first):** withdraw EMP002 pending requests 103–108 (leave API) and request DB-side removal of forged attendance record `f143mu8...`.
3. **Optional deep-dives (user-gated):** F20 root cause, forger-role F1 severity, check-in on leave-day (09-23), weekend check-in flag, audit-logs matrix.
4. **Report:** final pass/fail matrix + severity-ranked defect list to the user.

---

## 10. Reference files

| File | Contents |
|---|---|
| `docs\e2e-leave-attendance-plan.md` | Test plan §4–10; AT-API statuses partially updated, still needs seeding/tail verdicts |
| `docs\dependencies-checklist.md` | What was needed + status (accounts resolved) |
| `docs\findings-v2-mtac.md` | Full finding write-ups + section D live confirmations |
| `docs\leave-seeding-proof.md` | Seeding payloads, balance snapshot, 14 probes, deviations, residue |
| `docs\exploratory-findings-report.md` | Prior-run findings (H1/H3/M1-M5 etc., pre-live) |
| `C:\Users\user\Downloads\Leave Policy vs Hardcoded Leave Rules.md` | Reference doc the seeding proves |
| Code (clone): `src/lib/server/services/leave.service.ts` (accrueLeaves/applyLeave), `leave.dao.ts` (F19, listLeaveTypes), `src/routes/api/leave/types|policies/+server.ts` (snake_case contract), `src/routes/api/leaves/+server.ts` (camelCase), `src/routes/api/attendance*(check-in|check-out|records)`, `src/lib/geofence.ts` (100 m) |