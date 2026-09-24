# Findings Report — v2 (current `main` @ 488b0e1, audit-logs merged)

> Re-examination of prior findings against the FRESH repo (`C:\Users\user\Downloads\hrms`), plus new findings from the leave + attendance white-box maps.
> Prior findings referenced: `docs/exploratory-findings-report.md` (H/M severities). Re-check method = code read (file:line) + where safe, live unauthenticated probe. **Authenticated/live confirmation is deferred until accounts (dependencies 1–3) land.**

Legend: ✅ fixed · 🟡 partial / needs live confirm · ⛔ still present (code) · 🔍 new.

---

## A. Re-check of prior findings

### H-prior (High)
| ID | Prior | New code status | Evidence |
|---|---|---|---|
| H1 | Write endpoints gated on `:view` not `:manage`; `:manage` keys unreferenced (CWE-863) | 🟡 **STILL PRESENT** — all surrounding API write routes still gate on `:view`: `attendance-records/+server.ts:14,49` and `[cuid]/+server.ts:18,45` use `attendance_record:view`; greeting/leave-type read-guard; `:manage` never referenced (grep confirmed zero hits). No separate write-permission key built. | `attendance-records/+server.ts:14,49`; grep `\:manage` → none |
| H2 | Admin dashboard payroll donut: `totalPayroll` seat vs `totalComponents` center; deductions in denominator | 🟡 **PARTIAL** — dashboard now has a reconcile: `admin/+page.server.ts:271` `totalComponents = basic+allowances+deductions+bonuses+reimbursements`; donut uses breakdown-derived values; earlier 2026 fix added `dbGross || grossFromBreakdown` guard. Need live sample to confirm donut vs center now consistent. | `dashboard/admin/+page.server.ts:218-221, 271` |
| H3 | Missing/invalid `leaveTypeCuid` on apply → raw 500 / non-400 | 🟡 **LIKELY STILL PRESENT** — `leave.service.ts:952-954` calls `getLeaveTypeByCuid(input.leaveTypeCuid)` → `leave.dao.ts:9,17` (LOP filter, then query); with `undefined`/garbage CUID the DAO throws; route `+server.ts` only catches known errors; `hooks.server.js` reclassifier (P2002→409 etc.) does **not** map generic invocation errors → sanitized 500. Needs live probe (L-API-08). | `leave.service.ts:952-954`, `leave.dao.ts:9,17`, `hooks.server.js:425-469` |
| M2 | Validation errors returned as 409 not 400; boundary/`ZodError`/`ValidationError` conflated | ⛔ **STILL PRESENT** — `api/designations/+server.ts` still maps `ZodError`/`ValidationError` → 409; attendance routes 409 for business conflicts (ok) but generic validator also uses 409; error-path string searching (`"already"`, `"please check out first"`) is fragile. | `designations/+server.ts:30-38`, `check-in/+server.ts:77`, `response.ts` |
| M3 | `validateDesignationName` returns "cannot be empty or just whitespace" but no presence guard | ⛔ **STILL PRESENT** — `designation.service.ts:32-37` does `name.trim()` directly; undefined → TypeError 500; empty-after-trim only caught when defined. | `designation.service.ts:32-37` |
| M4 | Dashboard new-employee "this month" uses `created_at` | ⛔ **STILL PRESENT (code)** — `admin/+page.server.ts:155-168` filters new hires by `created_at` month; should be employment `date_of_joining`. | `dashboard/admin/+page.server.ts:155-168` |
| M5 | Attendance widget "Check Out" shown when LOP/leave record w/o check-in | 🟡 **PARTIAL** — widget now has an explicit leave branch (`AttendanceWidget.svelte:189`): status `Leave/On Leave/LOP` → badge, buttons hidden, so the LOP case is fixed for that status. But a record with status like `Present` and `check_out_time` null & no check-in (possible via manual CRUD) still shows Check Out. Needs live confirm. | `AttendanceWidget.svelte:160-240` |
| M1 (prior) | Payroll upload: non-.xlsx rejected 415 vs useful error | 🟡 verify in fresh code on live; not re-read this pass (out of leave/attendance scope). | – |

---

## B. New findings (leave + attendance white-box)

### 🔍 Critical
| ID | Title | Evidence | Why it matters |
|---|---|---|---|
| F1 | **`attendance_record:view` grants create/update to any attendee** | POST/PUT guards = `attendance_record:view` only (`attendance-records/+server.ts:49`, `[cuid]/+server.ts:45`); service validates data, never authority (`attendance-record.service.ts:99-290`). | Any HR/manager role with the read perm can forge/patch attendance, edit **another employee's** records, flip leave-created `Leave` → `Present` — which then **blocks future re-approval** at `leave.service.ts:1584-1589`. Escalation/CRUD-gap (create/update/delete semantics missing). |

### 🔍 High
| ID | Title | Evidence |
|---|---|---|
| F2 | Status case-inconsistency: writers emit `'Half Day'`, readers enumerate `HalfDay|half_day|Halfday|present|wfh`; dead writer emits `'HalfDay'` | `attendance.service.ts:190` (preserves `'Half Day'`), `leave.service.ts:1540` dead var (`'HalfDay'`), readers `admin/+page.server.ts:320`, `manager/+page.server.ts:304`, `employee/+page.server.ts:119,196-197`. No DB enum (`status String @db.VarChar(20)`). Leads to silently-miscounting dashboards w/ legacy data. |
| F3 | Dashboard attendance denominators/numerators not coherent | Admin %: `presentToday` counts WFH+HalfDay as full present, `Late` excluded; denominator = ALL non-deleted employees, not employment-active (`admin/+page.server.ts:317-323`). Manager team: `Late`→Present, half-day→present (`manager/+page.server.ts:296-313,404-419`). Employee: two different month populations on one card (`employee/+page.server.ts:112-125` vs `149-208`). |
| F4 | UTC-vs-local "today" misalignment (late-evening check-in) | Client `todayStr` = `new Date()` local (`attendance/+page.svelte:4-8`); record `date` = server-local→UTC (`attendance.service.ts:107-114`); `rec.date === data.todayStr` lookups (`:295-301`). Positive-offset TZ, late-evening check-in → widget/calendar mismatch ("Absent" after checking in). `scheduled-jobs.ts:12` shows UTC discipline elsewhere, not applied client-side. |

### 🔍 Medium
| ID | Title | Evidence |
|---|---|---|
| F5 | **`attendance_type` dead concept** — page branches `employee.attendance_type === 'anywhere'` but column doesn't exist (`attendance/+page.svelte:212-218`); fallback enforces geofence regardless. | Single grep hit. |
| F6 | Dead `attendanceStatus` var in leave approval (`leave.service.ts:1540`). | runtime-inert; source of confusion. |
| F7 | **No delete path** for attendance records (no DELETE route/service/UI). CRUD = create/read/update. | intended? confirm with product. |
| F8 | Approval authorization is manager-relation only; admin has no explicit approval permission key → admin must also hold a reporting line to approve (or is excluded). Positive: no extra write-perm needed for managers. | `approvals/[cuid]/+server.ts` + manager resolution. |
| F9 | Half-day leaves allow full-day check-in (eligibility blocks full-day only); no rule forces half-day session; weekend check-in allowed (no service-side weekend rule). | `attendance.service.ts:48-52`; `leave.config` weekend helpers exist but unused in check-in. |
| F10 | Rejected/geofence-failed check-ins not audited (audit only on success writes). | `attendance.service.ts:183-204`. |
| F11 | Leave document handling: **MIME whitelist absent at document route**; content-inline behavior. | document `[cuid]/document` route — verify redirect/inline headers live; prior high5/PW traversal fix unrelated (different subsystem). |
| F12 | `getAttendanceEligibility` runs BEFORE geofence → employee on leave gets "cannot mark" even if outside zone (information asymmetry, minor). | ordering `attendance.service.ts:33-55` before `167-170`. |
| F13 | `CompanyLocation.timezone` unused; all attendance math global UTC/server-local. | `schema.prisma:979-1010` vs attendance service. |

### 🔍 Low / hardening notes
| ID | Note |
|---|---|
| F14 | `LOP` leave type filtered from application list (`leave.dao:9,17,353`) — confirm business intent (LOP normally derived, not applied). |
| F15 | 409/400 string-matching on user-facing messages is fragile to rewording/localization (`check-in/+server.ts:77`, `attendance-records/+server.ts:96-103`). |
| F16 | `work_duration_minutes` always DDL-derived; update paths recompute & overwrite — no persistence of edited duration. |
| F17 | Pending-checkout grace = exactly 7 days; day-8 must fail cleanly. |
| F18 | Holiday/Week-Off/Not-Logged-In are UI-only virtual rows, cannot be persisted for holiday dates (by design; confirm for weekly offs). |

---

## C. Actionable priorities for the team

1. **F1 (critical)** — introduce `attendance_record:create/update` (or owner-equality) enforcement + block mutation of leave-originated records; align with H1 `:manage` scheme. Test: AT-REC-06/07, AT-RBAC-02.
2. **F2** — normalize half-day to single canonical `'Half Day'` on write; DB CHECK/enum. Test: X-02, F2 manual-seed.
3. **F4** — derive client "today at UTC" from server-provided date. Test: UI-AT4 midnight.
4. **F3** — unify population & semantics (employment-active filter; decide Late & Half-day weighting). Test: X-09/10.
5. **H3/M3/M2** — presence-validate `leaveTypeCuid` + `name`; map validation to 400 with clean messages (not 409/raw 500).
6. **M4** — new-hires by `date_of_joining`, not `created_at`.
7. **F7/F11/F9/F10** — product decisions: delete support, doc MIME whitelist, weekend policy, audit-of-rejects.

---

## D. Live confirmation (2026-09-22, preprod, accounts PQ008/PQ009)

### Confirmed live
| ID | Result | Evidence |
|---|---|---|
| H3 | ⛔ **CONFIRMED** — `POST /api/leaves` WITHOUT `leaveTypeCuid` → `500 {"error":"An internal database error occurred."}` (missing required field → 500, should be 400). `leaveTypeCuid: "nonexistentgarbage..."` → correct `400 {"error":"Selected Leave Type is invalid or inactive.","field":"leaveTypeCuid"}`. | PQ008 session, `/api/leaves` POST |
| L-APR-05 | ✅ PASS — non-manager approve → `400 "Unauthorized: You can only approve/reject requests from your direct reports."` (`leave.service.ts:1433`). Same for invalid `action` → `400 "Invalid action."` | PQ009 (admin) approving PQ008 request |
| AT-API-04 | ✅ PASS — check-in on holiday (2026-09-22 = "Tomorrow Holiday") → `400 {"error":{"employee_cuid":"Attendance cannot be marked on holidays"}}` with office coords. Also confirms F12: leave/holiday eligibility is checked BEFORE geofence. | PQ008 session |
| UI-L1 | ✅ PASS — apply SL 1-day leave → request `pending`, notification `Leave Application Submitted` emitted, balance unchanged (2.5 SL). Request: `iipti80iuqcf7t32vwbxasy3`. | UI modal + API |

### RBAC (live)
- PQ008 (employee): `403` on `/api/employees`, `/api/leave/types`, `/api/leave/policies`, `/api/attendance-records`; `200` on `/api/attendance/me`, `/api/leaves`, `/api/leaves/settings`, `/api/holidays`.
- PQ009: `200` on employees / leave-types / leave-policies / attendance-records / holidays / attendance-view (has `dashboard:admin` + wildcard). Relies on UI: PQ009 lands on **Admin Dashboard**.

### ⚠ BLOCKER RESOLVED — org wiring fixed mid-run, approval flow completed
- **Pre-existing data mismatch found live:** PQ008 employment `reporting_manager_cuid` was `zu8uv8h6zjjc0hcx2wr4uwoo` = EMP002 (Abiney), NOT the supplied "manager" PQ009; PQ009 had no direct reports (`isManager:false`).
- **Fix applied (authorized by user "try now"):** `PUT /api/employees/{kyvuqsrbvtrd5pwesicplr3l}/employment { reporting_manager_cuid: pmk1eox2ou569hoicr56yb3l }` → the write **persisted** (PQ008 now reports to PQ009) even though the API returned **409 "Department is required"**. All other employment fields intact; audit row created.
- 🟡 **F20 (new, live):** `PUT /api/employees/[cuid]/employment` with a partial body **mutates the row despite a 409 validation failure**. The service throws after upsert? No — service validates first (`employment.service.ts:45` before `100`)… but live show the change landed despite 409. Root cause hypothesis: the **deployed build differs from this clone commit** (mapToDb strips fields or schema/route behaves differently), OR an upstream hook re-applied. **Do not rely on the 409 as a write-stopping signal here**; verify with a GET after every PUT. (Follow-up: confirm deployed SHA vs 488b0e1.)
- After fix: PQ009 → `isManager:true`, PQ008 request `iipti80iuqcf7t32vwbxasy3` in `pendingApprovals`.

### ✅ Approval/reject/withdraw happy paths — CONFIRMED LIVE (after re-wiring)
| ID | Result | Evidence |
|---|---|---|
| L-APR-03 approve | ✅ PASS — `200`, request → `approved`, `approved_by: pmk1eox2ou569hoicr56yb3l`, `approved_at` set | PQ009 POST `/api/leaves/approvals/iipti80...` {action:approve} |
| X-01 attendance upsert | ✅ PASS — attendance record `t78u6nov526035puo9bw8vdd` created (`date 2026-09-23`, status `Leave`, remarks `Approved Leave: Sick Leave`) | GET `/api/attendance-records` |
| Balance debit | ✅ PASS — PQ008 SL `allocated 2.5 → used 1 → remaining 1.5` after approval | GET `/api/leaves` (PQ008) |
| Approval notification | ✅ PASS — PQ008 receives `Leave Request Approved — Your leave request for 1 day(s) starting on 9/23/2026 has been approved.` (`created_by: pmk1...` = PQ009) | GET `/api/notifications` (PQ008) |
| L-APR-04 reject | ✅ PASS — new request `vk0hwk1hh2qubkj31rtqu0k8` → `rejected`, `rejected_by`+`rejected_at` set; **no** attendance record created. | PQ008 apply → PQ009 reject |
| Withdraw | ✅ PASS — request `o5cpvj9qlr89xfu114bc3ntc` → `withdrawn`, `withdrawn_at` set | PQ008 POST `/api/leaves/{cuid}` |
| State guards | ✅ PASS ×4 — re-withdraw 400 `Only pending leave requests can be withdrawn.`; withdraw approved 400 (same); re-approve approved 400 `Leave request is not in pending status.`; approve withdrawn 400 (same) | live probes |
| Duplicate/overlap | ✅ PASS — overlapping period → `400 {error:"You have an overlapping leave request during this period.","field":"startDate"}` | live probe |
| Half-day not allowed | ✅ PASS — SL half-day → `400 "Half-day leaves are not allowed for this leave type."` field `isHalfDay`; weekend-only & holiday-only → `400 "Requested leave period contains only holidays or weekends and counts as 0 days."` | live probes |
| L-API-08 | ⚠ NOTE — **snake_case vs camelCase contract**: API expects `leaveTypeCuid/startDate/endDate` (route `+server.ts:36-47`). Sending snake_case `leave_type_cuid` re-triggers **H3 (500)** because the field is undefined → confirms H3 root cause is missing-required-field, not just bad cuid. Clients must use camelCase. | live probe (snake_case → 500; camelCase → 201) |

### 🔍 F19 (new, live) — manager pending-approvals list is data-agnostic
- `getPendingApprovalsForManager` (`leave.service.ts:650-687`) → `getLeaveRequestsForEmployees` (`leave.dao.ts:372-380`) returns **ALL** subordinate requests with **no `request_status` filter**. Live: PQ009's `pendingApprovals` contains `iipti80...` (`approved`) AND `vk0hwk1...` (`rejected`) — approved/rejected/withdrawn are interleaved into the "pending" queue; the UI must rely on client-side sorting to hide them. Severity: Low/Info; risk if any client assumes list = actionable.

### 🔍 F1 — CONFIRMED LIVE (write with read-only permission)
- PQ009 (has `attendance_record:view`) → `POST /api/attendance-records` created a **`Present` record for ANOTHER employee** (`ad53sjjrn0ntdc9enn0znp8z`, date 2026-09-24, full 09:00–18:00) → `201 {cuid: f143mu85boxdjdc43veymcqz}`. No geofence, no source linkage, no employee-ownership check. Route guard = `attendance_record:view` (`+server.ts:49`, `[cuid]/+server.ts:45`).
- **Cleanup note:** no DELETE route for attendance-records → the probe record `f143mu85boxdjdc43veymcqz` **must be removed in DB by the user** (or flagged to data team). Also pre-existing future record `2026-09-30 / Present / null times` on same employee (prior residue).

### RBAC (live, updated)
- PQ008 (employee): `403` on `/api/employees`, `/api/leave/types`, `/api/leave/policies`, `/api/attendance-records`; `200` on `/api/attendance/me`, `/api/leaves`, `/api/leaves/settings`, `/api/holidays`.
- PQ009: `200` on employees / leave-types / leave-policies / attendance-records / holidays / attendance-view (admin wildcard). Landed on **Admin Dashboard**.

### Misc live observations (updated)
- `GET /api/leaves/{cuid}` → `405 GET method not allowed` (list-only API).
- `/api/leave/types` seeded with CL `status:false` (inactive) + SL active — SL is the only selectable leave.
- **Sequential DB `id` leaked in API DTOs** (`id: "100"`, `101`, `102` on leave requests) — minor info-disclosure/enumeration surface; consider stripping internal ids from serialized responses.
- `POST /api/leaves` returns `201` on create (correct), `GET /api/leaves` returns `200`.
- Check-in on holiday (2026-09-22) → `400 "Attendance cannot be marked on holidays"` (AT-API-04 PASS). Holiday since removed from preprod by user → attendance happy path run below.

### ✅ Attendance happy path + boundaries — CONFIRMED LIVE (2026-09-22, after holiday removed)
| ID | Result | Evidence |
|---|---|---|
| AT-API-01 check-in in-zone | ✅ PASS — `201 {"message":"Checked in successfully","cuid":"i0hbdvtts447kgbcr0o5yyab"}` (PQ008) and `owaozs2t0hfx26fauugg4rh2` (PQ009); record `status Present`, `check_in_latitude/longitude` stored | POST `/api/attendance/check-in` {lat 13.03875054, lng 80.23465202} |
| AT-API-10 check-out happy | ✅ PASS — `200`, `check_out_time` set, `isPendingCheckout:false`; **body REQUIRES `check_out_time`** (else `400 {"employee_cuid":"Check-out time is required for pending check-out"}`); works with full ISO | PUT `/api/attendance/check-out` |
| AT-API-08 duplicate check-in | ✅ PASS — second check-in in-zone AND out-of-zone → `409 {"employee_cuid":"Already checked in for today"}` (dup guard fires BEFORE geofence) | PQ008 + PQ009 |
| AT-API-02 check-in out-of-zone | ✅ PASS — ~5 km away → `400 {"employee_cuid":"You are outside the office zone"}` (verified on fresh no-record user PQ009 so geofence was reached) | POST check-in {13.082, 80.275} |
| AT-API-03 invalid GPS | ✅ PASS — `{}` body → `400 "Invalid GPS coordinates provided."` (route-level) | POST check-in |
| Check-out geofence | ⚠ **INTENTIONAL? flag** — check-out ALSO enforces geofence: out-of-zone check-out (13.082,80.275) while checked in → `400 "You are outside the office zone"`. If remote/official-off-site checkout is a requirement, this blocks it. | PUT check-out {13.082, 80.275, cuid owaoz...} |
| Check-out nonexistent record | ✅ PASS — unknown cuid → `400 {"employee_cuid":"Selected attendance record does not exist"}` | PUT check-out |
| `/api/attendance/me` | ✅ PASS — `{records, pendingRecords, employee}` shape; also leaks sequential `employee.id` (232) — same id-leak family as leave `id:100/101/102` | GET |

Remaining (not run): check-in on Leave/LOP day (AT-API-05/06/15), before-DOJ (AT-API-09), pending-checkout 7-day window (AT-API-14), weekend check-in (AT-API-16), check-in with open record (AT-API-07 — needs a record left open, creates residue), missing-checkout reminder notification (AT-API-18).