# E2E Test Plan — Leave Management & Attendance

> Scope: current `main` of `pieq-ai/hrms` @ `488b0e1` ("Merge pull request #17 from pieq-ai/feature/audit-logs").
> Target environment: `https://people.pieq.ai/` (preprod). Playwright (tests/e2e) + manual/API probes.
> Companion docs: `dependencies-checklist.md` (what I need from you), `findings-v2-mtac.md` (issue status), prior `leave-policy-regression-plan.md`, `module-functionality-checklist.md` (rows AT1–AT17, L1–L12), `leave-test-data-dependencies.md` (seed cuids).

---

## 1. Objective

Verify leave + attendance end-to-end on the hosted app (and against local code) — API contract, UI flows, cross-module state (leave approval → attendance record), RBAC, and time/geofence boundaries. Deliver: pass/fail matrix, blocked list, and reproducible defect reports.

---

## 2. Environment & Prerequisites

| Item | State |
|---|---|
| Hosted app | Reachable — `/api/health` 200; `/api/*` 401 unauthenticated; `/` and `/login` 303 |
| Auth | Keycloak realm `pieq-hrms` @ `preprod.auth.pieq.ai`, OIDC flow via Auth.js |
| Test accounts | **RESOLVED** — PQ008 `deva.r+2@pieq.ai`/`Test@123` (employee, wired to report to PQ009), PQ009 `deva.r+3@pieq.ai`/`Test@123` (manager/admin). `forger` role not created → F1 proved with PQ009 (`attendance_record:view`-holding but non-record-admin) |
| Geofence | 100 m radius, Haversine, office coords from employment's CompanyLocation |
| Data seeds | `npm run db:seed:leave` cuids: `E1..M1`, `lt_cl/lt_sl/lt_lwp/lt_lop`, `lp_cl_cs/lp_cl_s`, `hol_2026_independence`, `et_permanent` |
| Evidence dir | `docs/ui-evidence/` (screenshots); API evidence captured per case |

---

## 3. Test accounts required (blocking)

| Alias | Role / perms | Status |
|---|---|---|
| `admin` | wildcard `*` bootstrap | ⚠️ not supplied; PQ009 acts as manager/admin (HRMS admin dashboard accessible) |
| `manager` | reporting manager of `employee` (via employment) | ✅ **PQ009** `deva.r+3@pieq.ai` — verified `isManager:true`, sees pending approvals |
| `employee` | ordinary employee | ✅ **PQ008** `deva.r+2@pieq.ai` — wired via PUT employment to report to PQ009 (was mis-wired to EMP002; blocking dependency cleared) |
| `forger` (optional) | role with ONLY `attendance_record:view` (no admin) | ❌ not created; F1 proved live using PQ009 (has `attendance_record:view`, lacks record-owner constraints) — severity for view-only non-admin user remains code-level only |

---

## 4. API Contract Cases (leave)

Refs: `src/routes/api/leaves/*`, `src/lib/server/services/leave.service.ts`.

### 4.1 apply / list (L-API-*)
| ID | Case | Expected | Notes |
|---|---|---|---|
| L-API-01 | GET `/api/leaves` (employee) | 200 `{requests, policies, ...}` | |
| L-API-02 | POST apply full-day CL (working days only) | 201; count excludes weekend/holiday; balance decremented | date range wholly inside allowed window |
| L-API-03 | POST apply overlapping an existing request | rejected (409/400) with clear message | |
| L-API-04 | POST apply with balance exceeded | rejected `L12` | policy enforcement |
| L-API-05 | POST apply half-day + session | 201; `is_half_day` stored; attendance half-day math | |
| L-API-06 | POST apply WITH document (any MIME) | 201; GET `[cuid]/document` retrieves; **header/ttl evidenced** | Also negative: disallowed MIME (txt/exe) | 
| L-API-07 | POST apply misleading body keys (unknown keys) | payload-key whitelist applies (400 on unknown) | confirm keys list at `applyLeave` route |
| L-API-08 | POST apply missing `leaveTypeCuid` / invalid cuid | **H3 probe — expect SANITIZED 500 or 400, never raw stack** | current code passes `body.leaveTypeCuid` unvalidated → `leave.dao.getLeaveTypeByCuid` |
| L-API-09 | POST apply on weekend/holiday | weekend counted as 0 for CL; check start/end spanning | |
| L-API-10 | POST maternity fields (ML) | `expectedDeliveryDate`, `isMiscarriage`, `childBirthDate` accepted | |
| L-API-11 | GET `[cuid]` detail | 200; includes `approvals`, `audit`, documents | |
| L-API-12 | PUT update own request | permitted fields only | confirm update exists / semantics |
| L-API-13 | DELETE withdraw | 200; notification emitted; balance credited back (if policy) | pending/approved same? |

### 4.2 approval flow (L-APR-*)
| ID | Case | Expected |
|---|---|---|
| L-APR-01 | Employee GETs their applications | each carries `approvalProgress`/status |
| L-APR-02 | Manager GET `/api/leaves?role=manager` (pending list) | own-reporting pending visible only |
| L-APR-03 | Manager approves `[cuid]` | status `Approved`; attendance upsert `Leave`/`Half Day`/`LOP`; applicant notified |
| L-APR-04 | Manager approves with rejectReason / reject | status `Rejected`; notified |
| L-APR-05 | Non-manager approves someone else's request (incl. self-approve) | **blocked** (reporting-manager check) |
| L-APR-06 | Admin approves (no reporting line) | confirm admin can/can't — document behavior |
| L-APR-07 | Approve when check-in exists w/ Present | **blocked at leave.service block** (attendance status Present/WFH) |
| L-APR-08 | Approve LWP/LOP request | attendance record `LOP`; payroll-cutoff cycle counting |
| L-APR-09 | Approve half-day | attendance `Half Day` for the session date |

### 4.3 leave types / policies / settings (L-CFG-*)
| ID | Case | Expected |
|---|---|---|
| L-CFG-01 | GET/POST/PUT `/api/leave/types` CRUD | `leave_type:view` gate; duplicate code rejected |
| L-CFG-02 | LOP / LWP code not listed for application | `leave.dao:9` filters `LOP` out of pickable types |
| L-CFG-03 | GET `/api/leave/policies` + `[cuid]` full policy object | `leave_policy:view` |
| L-CFG-04 | Policy min-service / gender rule gates apply | an ineligible emp rejected on apply |
| L-CFG-05 | POST/PUT `/api/leaves/settings` (cutoff day) | `payroll_cut_off_date` persisted; LOP cycle uses it |
| L-CFG-06 | accrue: CL/SL monthly credit + from-1st-of-joining-month | balances derived correct for a given `employee`+policy |
| L-CFG-07 | holiday calendar on leave date | weekend *and* holiday both excluded from working days |

### 4.4 RBAC leaves (L-RBAC-*)
| ID | Case | Expected |
|---|---|---|
| L-RBAC-01 | role without `leave:view` hits `/api/leaves*` | 403 w/ role name |
| L-RBAC-02 | write op (`apply`/`approve`) gated by `:view` — confirm **H1** observable | docs say only `leave:view`; probe a `leave_type:view`-only or read-only role | 
| L-RBAC-03 | `:manage` key still unreferenced (grep) + live role assignment challenge | informational |

---

## 5. API Contract Cases (attendance)

Refs: `src/routes/api/attendance/{check-in,check-out,me}`, `src/routes/api/attendance-records`.

### 5.1 check-in / check-out (AT-API-*)
| ID | Case | Expected |
|---|---|---|
| AT-API-01 | Check-in inside geofence | 201; `Present`; source web | ✅ LIVE: PQ008→201 `i0hbdvtts447kgbcr0o5yyab`; PQ009→201 `owaozs2t0hfx26fauugg4rh2`; status `Present`, `check_in_latitude/longitude` stored |
| AT-API-02 | Check-in outside geofence (e.g., +200 m offset) | 400 `You are outside the office zone` | ✅ LIVE (PQ009, ~5 km): 400 `{"employee_cuid":"You are outside the office zone"}` — fires AFTER dup/already guards; verified on a fresh no-record user |
| AT-API-03 | Check-in missing/invalid GPS `(0,0)`/NaN/out-of-range | 400 `Invalid GPS coordinates provided.` | ✅ LIVE (PQ009, `{}` body): 400 `Invalid GPS coordinates provided.` (route-level) |
| AT-API-04 | Check-in on holiday | 400 `Attendance cannot be marked on holidays` (checked BEFORE geofence) | ✅ LIVE (2026-09-22 holiday): 400 `Attendance cannot be marked on holidays` — holiday since removed from preprod (user action) |
| AT-API-05 | Check-in on full-day Leave / LOP record / approved full-day | 400 same message |
| AT-API-06 | Check-in on half-day leave | allowed → record preserved `Half Day` |
| AT-API-07 | Duplicate check-in w/ open record | 409 `already/please check out first` | 
| AT-API-08 | Second check-in after closed record | 409 `Already checked in for today` | ✅ LIVE (PQ008 + PQ009): both out-of-zone AND in-zone re-check-in → 409 `{"employee_cuid":"Already checked in for today"}` |
| AT-API-09 | Before DOJ / after relieving | rejected |
| AT-API-10 | Check-out happy path (inside geofence) | 200; duration = diff; `Pending→null` | ✅ LIVE ×2: PQ008 `i0hbdvtts447kgbcr0o5yyab`→200 (`check_out_time` 05:55:17Z, `isPendingCheckout:false`); PQ009 `owaozs2t0hfx26fauugg4rh2`→200. NOTE: `check_out_time` REQUIRED in body (else 400 `Check-out time is required for pending check-out`) |
| AT-API-11 | Check-out custom time same date | respected; duration recomputed | provided ISO `check_out_time` used verbatim (PQ008 05:55:17Z, PQ009 05:57:40Z) |
| AT-API-12 | Check-out before check-in | 400 error | ✅ LIVE (PQ009, nonexistent cuid): 400 `{"employee_cuid":"Selected attendance record does not exist"}` — **check-out enforces geofence too**: out-of-zone attempt (13.082,80.275) while checked in → 400 `You are outside the office zone` (flag: no remote checkout possible) |
| AT-API-13 | Check-out with `attendance_record_cuid` ≠ own | 403/400 (not owned) | partial — ownership not reachable live without 2nd record; service compares owner internally |
| AT-API-14 | Pending check-out (7-day window) | OK within 7d; **day-8 probe → `expired (grace period is 7 days)`** |
| AT-API-15 | Check-out on Leave/LOP day | blocked |
| AT-API-16 | Weekend check-in | **currently allowed** (no service-side weekend rule) → confirm & flag |
| AT-API-17 | `/api/attendance/me` shape | `records`, `pendingRecords`, `employee` (lat/lon/working window) | ✅ LIVE ×2: shape as documented; also leaks sequential `employee.id` (232/…) + records carry `date`/`status`/`isPendingCheckout` |
| AT-API-18 | missing-checkout reminder | triggered after check-in when no prior pending (fire-and-forget) → assert notification |

### 5.2 attendance-records CRUD (AT-REC-*)
| ID | Case | Expected |
|---|---|---|
| AT-REC-01 | GET list + filters (employee/date/status/source) | 200 |
| AT-REC-02 | POST create valid manual record | 201 |
| AT-REC-03 | POST duplicate (employee,date) | 409 `already exists` |
| AT-REC-04 | POST on holiday | 400 hard block (even `status='Holiday'`) |
| AT-REC-05 | POST status `Leave` on day w/ approved full-day leave | allowed (block only for Present/Late/WFH/HalfDay + leave) — verify |
| AT-REC-06 | PUT update another employee's record with `attendance_record:view` | **F1 probe** — currently allowed |
| AT-REC-07 | PUT flip leave-created record `Leave` → `Present` | allowed → then re-approval blocked (leave:1584) — **F1 impact** |
| AT-REC-08 | PUT with non-working status + times | blocked (`Leave/Holiday/LOP` must have no times) |
| AT-REC-09 | PUT `check_in_time`/`check_out_time` overwrite semantics | both re-written from validated values |
| AT-REC-10 | Status any arbitrary garbage string | **currently accepted** (no enum) — flag `N7` |
| AT-REC-11 | DELETE endpoint | **does not exist** — document expected behavior |
| AT-REC-12 | Create with `attendance_source_cuid` master-data validated | non-existent → error |

### 5.3 RBAC attendance (AT-RBAC-*)
| ID | Case | Expected |
|---|---|---|
| AT-RBAC-01 | no `dashboard:view` → check-in/out 403 | 403 |
| AT-RBAC-02 | `attendance_record:view` only user can POST/PUT records | **F1 — currently allowed; intended gate should be write perm** |
| AT-RBAC-03 | `attendance:view` only user (if exists) can check in without record perms | confirm |
| AT-RBAC-04 | list `/api/employees/attendance-view` gate `employee:view` | known perms resolved for active shift |

---

## 6. Cross-module integration cases (leave ⇄ attendance)

| ID | Case | Expected |
|---|---|---|
| X-01 | approve full-day CL on a working day | attendance row `Leave` created (upsert), calendar shows it |
| X-02 | approve half-day CL | row `Half Day`; check-in still allowed same day |
| X-03 | approve LOP/LWP | row `LOP` written; check-in blocked that day |
| X-04 | approve while an open check-in exists (Present) | approval **blocked** (`leave.service:1584-1589`) |
| X-05 | withdraw/reject after attendance row written | attendance row behavior — document (revert? preserve?) |
| X-06 | leave balance after approval vs application | applied debits consistent (approved only?) |
| X-07 | attendance-record editable once leave-created | **F1**: can be flipped → blocks future approvals |
| X-08 | notifications: apply / approve / reject / withdraw / holiday | each emits correct type + priority |
| X-09 | dashboard: admin "% today" vs manager team list vs employee todayAttendance for same day | **F3 probe** — % denominators differ |
| X-10 | dashboard: manager team "On Leave" count = approved leaves today | sense-check |

---

## 7. UI / E2E journeys (Playwright)

### 7.1 Leave journeys
| ID | Journey |
|---|---|
| UI-L1 | SSO login → `/leaves` → apply full-day CL (choose dates) → confirm balance line → appears in My Applications w/ pending |
| UI-L2 | Manager login → pending list → approve → applicant's list shows Approved |
| UI-L3 | Apply with document upload → doc visible/retrievable |
| UI-L4 | Apply half-day + session select | 
| UI-L5 | Withdraw → status update + balance restore |
| UI-L6 | Leave balance widget consistent with policy accrual |
| UI-L7 | Leave type/policy admin pages CRUD + effect on apply form (dropdown) |

### 7.2 Attendance journeys
| ID | Journey |
|---|---|
| UI-AT1 | Dashboard widget: idle → Check In (mock office GPS) → record present → Check Out → Attendance Marked | ✅ API-verified; UI widget check-in/out not yet driven live in this run |
| UI-AT2 | Widget during approved full-day leave → On Leave badge, no buttons |
| UI-AT3 | Widget during half-day leave → Half Day, check-in allowed |
| UI-AT4 | `/attendance` calendar: today highlight, late-evening boundary (**F4 probe** at local midnight) |
| UI-AT5 | `/attendance-records` list + create/edit modal (UTC→local round-trip) |
| UI-AT6 | Admin dashboard: Today's % + Active Shift + Today's attendance widgets |
| UI-AT7 | Out-of-zone → widget blocks button, page shows `You are outside the office zone` (if surfaced) |

### 7.3 Navigation / cross-links
| ID | Check |
|---|---|
| UI-N1 | Leave list → detail → document open (same-origin inline PDF) |
| UI-N2 | Notification tap → navigates to relevant request/detail |
| UI-N3 | Manager pending approvals reachable + empty state |

---

## 8. Boundary / adversarial (Rained-Out / Bad Neighborhood)

1. **H3**: raw-500 syntax — POST apply with missing/invalid `leaveTypeCuid`; capture response body/headers; assert not a stack.
2. **M2**: force a `ValidationError` (e.g., invalid date) → assert 400, **not** current 409.
3. **M3**: designation POST `{}` empty body / `name` absent → assert 400 w/ clean message, no TypeError.
4. **F1**: `attendance_record:view`-only role POST/PUT crossing employee boundaries.
5. **F4**: UTC-vs-local: late-evening check-in in a positive-offset TZ → UI shows Absent.
6. **F2**: mutated record w/ `Halfday`/`half_day`/`present` (via direct DB if allowed, else via API garbage status) → dashboard counts | flag drift.
7. **N6**: document upload `.txt`/`.exe` MIME + inline-content path traversal probe (follow-up to the fixed high5/PW traversal).
8. **409 vs 400 string-match fragility**: localized/rewrapped messages degrade error codes (noted, low).
9. **Concurrency**: two approvers / check-in double-tap race → no 500; one wins.
10. **Pagination** on leave list / attendance-records list.

---

## 9. Execution order (gated)

1. User supplies accounts + env (dependencies doc). ✅ done (PQ008/PQ009).
2. **Stage 1 — API probes** §4–5. ✅ leave full lifecycle + attendance check-in/out live-confirmed (2026-09-22, holiday removed).
3. **Stage 2 — Code-side spot recs** H3/M2/M3/F1/F2/F4. ✅ H3 (reproduced → 500 on snake_case, clean on camel), F1 live, F19 live, F20 observed.
4. **Stage 3 — UI journeys** §7 happy path. ⏳ UI-L1 (apply) done; L2/L3/L5 partially API-level; UI attendance widget pumps remaining.
5. **Stage 4 — boundaries** §8 + RBAC negatives. ⏳ RBAC matrix done; out-of-zone check-in/out done; pending-checkout 7-day window + weekend + before-DOJ remain.
6. **Stage 5 — audit-logs verification** (write ops leave audit rows incl. document/approval events). ⏳ partial (employment PUT audit row seen).
7. **Stage 6 — Report**: pass/fail matrix update into `module-functionality-checklist.md` + defect write-ups. ⏳ in progress.

---

## 10. Definition of done

- Every case has verdict + evidence (response body/screenshot/audit row).
- All Blocked items enumerated with the exact dependency.
- Defect candidates each carry: repro, expected vs actual, severity, file:line, suggested fix.
- Findings doc (`findings-v2-mtac.md`) refreshed with live-confirmed status.