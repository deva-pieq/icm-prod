# PieQ HRMS — Exploratory Test Findings Report

- **Target:** https://people.pieq.ai/
- **Environment:** preprod (live-like), admin session `abiney.y@pieq.ai` (EMP002, Engineering, Administrator, wildcard `*` permission)
- **Auth:** Keycloak OIDC — realm `pieq-hrms`, client `pieq-app` (`preprod.auth.pieq.ai`)
- **Server date at test time:** 2026-09-21
- **Method:** white-box source review + live authenticated API probes + 24-page UI sweep + adversarial find/refute/reproduce pass
- **Baseline contracts:** `application-behaviour.md`, `exploratory-sanity-checklist.md`, `module-functionality-checklist.md`

Severity key: **High** = security/data-integrity/user-blocking · **Medium** = incorrect behavior, wrong status, misleading data · **Low** = cosmetic, edge, contract inconsistency.

---

## High

### H1 — Write endpoints gate on `:view` permission, not `:manage` (broken access control, CWE-863)

The permission catalog exposes 35 permissions including 10 explicit write keys:

```
department:manage, designation:manage, holiday:manage, leave_policy:manage,
leave_type:manage, payroll:manage, role:manage, salary_component:manage,
salary_structure:manage, shift_assignment:manage
```

**None of the `:manage` keys are referenced anywhere in the codebase.** Every mutation
gates on the resource's `:view` key instead (only a few collection POSTs additionally
call `requireAdmin`):

| Route | Guard | Expected |
|---|---|---|
| `POST /api/holidays` | `holiday:view` (`holidays/+server.ts:31`) | `holiday:manage` |
| `PUT /api/employees/[cuid]` | `employee:view` (`employees/[cuid]/+server.ts:22`) | `employee:manage`/admin |
| `DELETE /api/employees/[cuid]` | `employee:view` (`employees/[cuid]/+server.ts:39`) | `employee:manage`/admin |
| `POST /api/roles` | `role:view` (`roles/+server.ts`) | `role:manage` |
| `POST /api/salary-components` | `salary_component:view` | `salary_component:manage` |
| `POST /api/shift-assignments` | `shift_assignment:view` | `shift_assignment:manage` |
| `POST /api/leave/types`, `/leave/policies` | `leave_type:view`, `leave_policy:view` | `*:manage` |
| `POST /api/departments`, `/designations` | `*:view` **+ `requireAdmin`** | `*:manage` |

**Impact:** The permission model cannot separate read from write. Any role granted a
view permission implicitly gains create/update/delete on that resource (e.g. a role that
must see the holiday calendar can create/delete holidays).

**Status:** Code-evidenced; not empirically reproduced because only one (wildcard-admin)
credential is available. A non-admin test account is required to prove the escalation.

---

### H2 — Admin dashboard payroll figures are internally inconsistent (user-visible)

On `/dashboard/admin`:

- KPI **TOTAL PAYROLL (MTD) = ₹2,64,195**
- Donut center label = **₹2.64 Lakh**
- Donut legend components: Basic ₹1,55,153 (49.9%) + Allowances ₹97,642 (31.4%) + Deductions ₹43,210 (13.9%) + Bonuses ₹0 + Others ₹15,220 (4.9%) = **₹3,11,225**

The parts sum to ~₹3.11 L while the whole is ~₹2.64 L.

**Cause:** `src/routes/dashboard/admin/+page.server.ts:216–241` adds `deductions` (absolute
value) as a positive slice into `totalComponents = basic + allowances + deductions + bonuses + others`,
then computes percentages against that inflated, mixed-sign base. `totalPayroll` is
`SUM(gross_earnings)` (`:182`), which excludes deductions — so the chart and the KPI can
never reconcile.

**Impact:** Financial summary shown to admins is self-contradictory; percentages do not
represent payroll composition.

---

### H3 — `POST /api/leaves` returns HTTP 500 for missing/invalid `leaveTypeCuid`

Reproduced (authenticated, `application/json`):

| Body | Result |
|---|---|
| `{}` | **500** `{"data":{"error":"An internal database error occurred."}}` |
| `{"leaveTypeCuid":null}` | **500** (same) |
| `{"leaveTypeCuid":123}` | **500** (same) |
| `{"leaveTypeCuid":"bogus"}` | **400** `"Selected Leave Type is invalid or inactive."` ✔ |
| `{"leaveTypeCuid":"","startDate":"","endDate":""}` | **400** ✔ |

**Cause (two layers):**
1. `src/lib/server/services/leave.service.ts:915` passes `input.leaveTypeCuid` straight to
   the DAO with no presence/type validation → Prisma throws a validation error whose
   message contains the substring `invocation`.
2. The route catch (`api/leaves/+server.ts:50–57`) returns that raw message with status 400,
   but the global hook `src/hooks.server.js:120–148` keyword-matches `"invocation"` and
   reclassifies it as a database error → status **500**, message sanitized.

**Impact:** Malformed client input yields a 500 (server-error semantics) and hides the real
validation failure. The keyword heuristic is fragile: any legitimate message containing
`table`, `column`, `relation`, `database`, `sql`, etc. will be silently escalated to 500.

---

## Medium

### M1 — `POST /api/payrolls/upload` returns 500 instead of 415/400 for non-form content types

Reproduced same-origin (with `Origin` header to pass SvelteKit CSRF):

- `application/json` body → **500** `{"data":{"error":"Content-Type was not one of \"multipart/form-data\" or \"application/x-www-form-urlencoded\"."}}`
- `text/plain` body → **500** (same)
- `application/x-www-form-urlencoded` body → 400 `"No file provided..."` ✔
- `multipart/form-data` (no file) → 400 `"No file provided..."` ✔

**Cause:** `await request.formData()` throws on the wrong content type and is caught by the
outer handler which maps everything to 500 (`api/payrolls/upload/+server.ts`). Should be 415.

### M2 — Validation errors return HTTP 409 Conflict instead of 400

`src/lib/server/utils/response.ts:25–52`: `handleError` returns **409** for every
`ValidationError` and every `ZodError`. `PUT /api/departments/[cuid]` hard-codes 409 as well
(`departments/[cuid]/+server.ts:38`).

Reproduced: `POST /api/employees {}` → **409** `{"data":{"error":"First name is required","field":"first_name"}}`.
Missing required field is 400-class, not conflict.

### M3 — Internal error message leaked to the client

Reproduced: `POST /api/designations {}` → **400**
`{"data":{"error":"Cannot read properties of undefined (reading 'trim')"}}`.

**Cause:** `src/lib/server/services/designation.service.ts` — `validateDesignationName`
calls `.trim()` on an undefined name; the route's catch (`designations/+server.ts`) returns
the raw `error.message`. No required-field guard before trimming.

### M4 — Dashboard "New Employees this month" uses `created_at`, not `date_of_joining`

`src/routes/dashboard/admin/+page.server.ts:152–157` counts employees by record
`created_at`. UI shows **"5 this month"** for September 2026.

Ground truth from `/api/employees`:

| Emp code | date_of_joining |
|---|---|
| EMP001 Senthil SB | 2018-09-01 |
| EMP002 Abiney Yadav | 2026-09-02 |
| PQ001 Thivaghar Manoharan | 2026-09-02 |
| PQ002 Balamurugan MNN | 2025-05-01 |
| PQ003 Deva Nathan | 2026-07-22 |

Actual September-2026 joiners = **2**, not 5. `newActiveUsers` has the same defect
(`:164–169`, uses employment `created_at`).

### M5 — Attendance widget offers "Check Out" when the user never checked in

`src/lib/components/common/AttendanceWidget.svelte:198–216` chooses the action button by
whether *any* attendance record exists for today, not by whether `check_in_time` is set:

- record + `check_out_time` → "Attendance Marked"
- record (no checkout) → **"Check Out"**
- no record → "Check In"

Today's EMP002 record is `status: LOP` with `check_in_time: null` and `check_out_time: null`
(`/api/attendance/me`), yet the dashboard renders a **"Check Out"** button with Check In
`--:--`. A user who has not checked in should be offered "Check In".

---

## Low

- **L1 — Inconsistent API error envelope.** Top-level `{"error":"Unauthorized"}` (401s) vs
  `{"data":{"error":...}}` (most handlers) vs object-valued `{"data":{"error":{"name":"..."}}}` /
  `{"error":{"general":"..."}}` (holidays, leave policies/types, attendance-records). 
  Consumers must handle three shapes.
- **L2 — `employees/next-code` returns `PQ004`** while the directory also uses `EMP###`
  (EMP001, EMP002). Two code schemes coexist.
- **L3 — Future-dated attendance.** `/api/attendance/me` returns a record dated **2026-09-23**
  (two days after server "today" 2026-09-21) with a 14h57m work duration.
- **L4 — Dead mock data in the page server.** `expenses = totalPayroll * 0.05` (`:263`, comment
  "mocked at 5%") and `performanceReviews: 22 / +4` (`:345–346`, comment "Static mock matching
  image"). Currently computed but not rendered on the admin dashboard — must not be surfaced
  to users as real metrics.
- **L5 — Anonymous `/profile` returns 403** `"Your account is not linked to an employee
  profile."` instead of redirecting to sign-in. Unauthenticated users should get a
  login redirect (all other protected pages do).
- **L6 — `GET /api/roles/{cuid}` returns 405** `"GET method not allowed"` (should be 404 for a
  missing/invalid resource). Junk permission key **`new_world`** exists in the permission
  catalog alongside real keys.

---

## Verified OK / Refuted

**Passed**
- Auth guard: every protected page redirects to Keycloak when unauthenticated; every probed
  `/api/*` returns **401** unauthenticated (`/api/employees`, `/api/payrolls`, `/api/leaves`,
  `/api/departments`, `/api/attendance/me`, `/api/notifications`).
- CSRF protection is active (cross-site form-content-type POSTs → 403).
- All 24 UI routes return HTTP 200 with **zero console errors**:
  `/dashboard`, `/dashboard/admin`, `/profile`, `/employees`, `/departments`, `/designations`,
  `/roles`, `/system-roles`, `/permissions`, `/role-permissions`, `/leave-types`,
  `/leave-policies`, `/leaves`, `/attendance`, `/attendance-records`, `/holidays`, `/shifts`,
  `/shift-assignments`, `/salary-components`, `/salary-structures`, `/payrolls`,
  `/notifications`, `/settings`, `/organization_locations`.
- Employees list renders correctly (5 rows, counts: Total 5 / Completed 1 / Pending 4);
  employee detail exposes all 9 sub-tabs (Personal, Employment, Address, Education,
  Experience, Skills, Languages, Documents, Bank Details).

**Refuted (hypotheses that did not hold up)**
- "Master data has no update/delete endpoints" — **false**: `PUT`/`DELETE` exist on the
  `[cuid]` routes (e.g. `employees/[cuid]/+server.ts`, `departments/[cuid]/+server.ts`). The
  earlier method scan missed them due to a regex/SQL-path artifact.
- "Check Out label duplicated in the attendance widget" — **false**: one is the static time
  label, the other is the action button.
- "Holidays accept `holiday:view` *and* `requireAdmin` like departments" — **false**: holidays
  POST has no `requireAdmin` guard, only `holiday:view` (strengthens H1).

---

## Priority summary

| ID | Severity | Issue |
|---|---|---|
| H1 | High | Write ops gated by `:view`; `:manage` keys unused (access control) |
| H2 | High | Dashboard payroll parts ≠ total (₹3,11,225 vs ₹2,64,195) |
| H3 | High | `POST /api/leaves` 500 on missing/invalid `leaveTypeCuid` |
| M1 | Medium | Payroll upload 500 instead of 415 |
| M2 | Medium | Validation errors return 409 instead of 400 |
| M3 | Medium | Internal `.trim()` error leaked to client (designations) |
| M4 | Medium | "New employees this month" counts `created_at`, not `date_of_joining` |
| M5 | Medium | Attendance widget shows "Check Out" without a check-in |
| L1–L6 | Low | Error-envelope inconsistency, next-code scheme mix, future-dated attendance, dead mocks, 403 vs redirect, 405 vs 404, junk permission key |

## Suggested next tests (not yet executed)
- Provision a non-admin (Employee/HR) test account and re-run the mutation matrix against H1.
- Leave-apply happy path and payroll-upload happy path with valid files (mutates preprod data).
- Duplicate-name behavior for departments/designations/roles (idempotency / 409 correctness).
- GPS / geofence boundaries for check-in (permission-denied, out-of-range coordinates).
