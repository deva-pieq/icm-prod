# HRMS — Module & Functionality Checklist

> Use for manual feature verification and as the source for automated E2E scenario generation.
> Status column: ☐ Not checked / ✅ Passed / ❌ Failed / ⚠ Blocked. Add date + tester in the Notes column.
> Permissions column lists the guard key required (see `docs/application-behaviour.md` §2.3).

---

## 0. Auth & Access Control

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| A1 | Auth | Sign in via SSO (Keycloak) | Redirect to Keycloak; on success, land on `/dashboard`; session created | public | ☐ |
| A2 | Auth | Unauthenticated route access | `/dashboard`, `/employees`, `/leaves`, etc. redirect unauthenticated users to `/` | – | ☐ |
| A3 | Auth | Logout | Session ends; protected pages become inaccessible | public | ☐ |
| A4 | RBAC | User with no permissions | Only **My Profile** is accessible (`profile:view` default); all other pages redirect to `/dashboard` and APIs return 403 | – | ☐ |
| A5 | RBAC | Wildcard `*` bootstrap admin | Can access every page despite having no explicit permissions | – | ☐ |
| A6 | RBAC | Role without a permission | API call for that permission returns 403 with role name in message | – | ☐ |
| A7 | RBAC | Session→employee resolution | User with `official_email` matching an active employment resolves to an employee (nav shows profile, dashboards personalize) | – | ☐ |

---

## 1. Dashboard

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| D1 | Dashboard | Routing by role | Admin → admin dashboard; finance → finance; others → employee dashboard | `dashboard:admin/finance/employee` | ☐ |
| D2 | Admin | Period selector | Dropdown lists distinct `year-month` from payroll records; default = latest period; URL param `?period=YYYY-MM` honored | `dashboard:admin` | ☐ |
| D3 | Admin | Total employees / new hires | Counts exclude soft-deleted employees; period-scoped counts work | `dashboard:admin` | ☐ |
| D4 | Admin | Active users | Counts employment rows with status `active` | `dashboard:admin` | ☐ |
| D5 | Admin | Payroll totals & MoM trend | Gross/net sums for selected period; previous-month comparison rendered | `dashboard:admin` | ☐ |
| D6 | Admin | Donut breakdown | Breakdown categories computed from payroll `breakdown` keys (basic/allowances/deductions/bonuses/others) | `dashboard:admin` | ☐ |
| D7 | Admin | Upcoming holidays | Shows future holidays sorted ascending (does not show past) | `dashboard:admin` | ☐ |
| D8 | Admin | Today's attendance % | Count present/WFH/HalfDay records for today / total employees | `dashboard:admin` | ☐ |
| D9 | Admin | Active shift widget | Shows today's active shift if the user has an assignment with `effective_from <= today <= effective_to` (or open-ended) | `dashboard:admin` | ☐ |
| D10 | Admin | Today's attendance widget | Shows check-in/out + work duration for today, or empty state | `dashboard:admin` | ☐ |
| D11 | Admin | Resignations card | Counts employment relieved in the selected period; MoM delta shown | `dashboard:admin` | ☐ |
| D12 | Employee | Employee dashboard loads | Personal stats render for the logged-in employee | `dashboard:employee` | ☐ |

---

## 2. Master Data

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| M1 | Master data | List each master | `blood-groups`, `pay-grades`, `nationalities`, `employment-types`, `relation-types`, `document-types`, `countries`, `states`, `skills`, `attendance-sources`, `languages` lists render | `dashboard:view` | ☐ |
| M2 | Master data | Create entry | POST to `/api/master-data/[master]` persists and appears in list | `dashboard:view` | ☐ |
| M3 | Master data | Update entry | PUT to `/api/master-data/[master]/[cuid]` updates label/value | `dashboard:view` | ☐ |
| M4 | Master data | States require country | Creating a state without `country_cuid` fails validation | `dashboard:view` | ☐ |
| M5 | Master data | Countries/states read routes | `/api/countries` and `/api/states` return data | `dashboard:view` | ☐ |

---

## 3. Departments / Designations / Locations

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| B1 | Departments | Create / list / update / delete | Full CRUD; list shows active depts; delete removes | `department:view` | ☐ |
| B2 | Designations | Create / list / update / delete | Full CRUD | `designation:view` | ☐ |
| B3 | Locations | Create / list / update / delete | Full CRUD; lat/lon editable | `location:view` | ☐ |
| B4 | Locations | Geofence anchor | Location with lat/lon used as office anchor for attendance | `location:view` | ☐ |

---

## 4. Employees

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| E1 | Employees | List | Renders employees (soft-deleted hidden) | `employee:view` | ☐ |
| E2 | Employees | Create | New employee created; `next-code` helper returns a usable code | `employee:view` | ☐ |
| E3 | Employees | View detail | Personal + employment tabs render | `employee:view` | ☐ |
| E4 | Employees | Update | PUT updates fields | `employee:view` | ☐ |
| E5 | Employees | Delete (soft) | DELETE marks `is_deleted`; record disappears from list/counts | `employee:view` | ☐ |
| E6 | Employees | Sub-resources: addresses | GET/PUT per employee | `employee:view` | ☐ |
| E7 | Employees | Sub-resources: bank-details | GET/PUT per employee | `employee:view` | ☐ |
| E8 | Employees | Sub-resources: documents | GET/PUT documents; `[docCuid]` GET retrieves a single doc | `employee:view` | ☐ |
| E9 | Employees | Sub-resources: educations / experiences / languages / skills | GET/PUT per employee | `employee:view` | ☐ |
| E10 | Employees | Employment record | Employment status, DOJ, confirmation, relieving, official email, manager, dept/designation/location links | `employee:view` | ☐ |

---

## 5. Profile (Self-Service)

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| P1 | Profile | View own record | All employees can view own profile | `profile:view` (default) | ☐ |
| P2 | Profile | Edit allowed fields | Personal fields editable by the employee | `profile:view` | ☐ |
| P3 | Profile | HR-controlled fields locked in *self* mode | `emp_code`, department, designation, role, manager, employment status, pay grade, employment type, location, system role, DOJ, confirmation/relieving dates, official email — NOT editable by self | `profile:view` | ☐ |
| P4 | Profile | HR edit mode | Admin/HR can edit HR-controlled fields via `edit`/`create` modes | `employee:view` | ☐ |

---

## 6. Attendance

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| AT1 | Attendance | Check-in inside geofence | Success within 100 m of assigned office location; creates status `Present`, source `Web` (auto-created if missing) | `attendance:view` | ☐ |
| AT2 | Attendance | Check-in outside geofence | Fails with `You are outside the office zone` | `attendance:view` | ☐ |
| AT3 | Attendance | Check-in without GPS | Fails: `GPS coordinates are required to mark attendance` | `attendance:view` | ☐ |
| AT4 | Attendance | Check-in on holiday | Fails: `Attendance cannot be marked on holidays` | `attendance:view` | ☐ |
| AT5 | Attendance | Check-in on full-day leave | Fails; half-day leave still allows check-in | `attendance:view` | ☐ |
| AT6 | Attendance | Duplicate check-in | Second check-in fails: `Already checked in for today` | `attendance:view` | ☐ |
| AT7 | Attendance | Open record | Check-in while record open fails: `...Please check out first.` | `attendance:view` | ☐ |
| AT8 | Attendance | Before DOJ / after relieving | Check-in rejected: `Attendance date must be within employee's employment period.` | `attendance:view` | ☐ |
| AT9 | Attendance | Check-out | Completes record; work duration = check-out − check-in (min 0) | `attendance:view` | ☐ |
| AT10 | Attendance | Check-out same-date rule | Custom check-out time must be same calendar date as record | `attendance:view` | ☐ |
| AT11 | Attendance | Check-out before check-in | Fails: `Check-out time must be later than check-in time` | `attendance:view` | ☐ |
| AT12 | Attendance | Pending check-out ≤ 7 days | Can check out a past open record within 7-day grace | `attendance:view` | ☐ |
| AT13 | Attendance | Pending check-out > 7 days | Fails: `Pending check-out has expired (grace period is 7 days)` | `attendance:view` | ☐ |
| AT14 | Attendance | Pending check-out other employee's record | Fails: `...does not belong to the authenticated employee` | `attendance:view` | ☐ |
| AT15 | Attendance | Today status (`/api/attendance/me`) | Reflects current day record / empty state | `attendance:view` | ☐ |
| AT16 | Attendance records | List with filters | Filter by employee, date, status, source | `attendance_record:view` | ☐ |
| AT17 | Attendance records | Create/update | Manual create + update records | `attendance_record:view` | ☐ |

---

## 7. Leaves

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| L1 | Leave types | CRUD | Types with codes (CL/SL/ML/LOP/LWP/…) | `leave_type:view` | ☐ |
| L2 | Leave policies | CRUD | Policies listing CRUD | `leave_policy:view` | ☐ |
| L3 | Leaves | Apply (full day) | Creates request; working days counted (weekends/holidays excluded for standard codes) | `leave:view` | ☐ |
| L4 | Leaves | Apply (half day) | Half-day flag + session; `isHalfDay` honoured in accrual and attendance eligibility | `leave:view` | ☐ |
| L5 | Leaves | Apply with document | Supporting document uploaded and retrievable via `[cuid]/document` | `leave:view` | ☐ |
| L6 | Leaves | Maternity fields | `expectedDeliveryDate`, `isMiscarriage`, `childBirthDate` accepted | `leave:view` | ☐ |
| L7 | Leaves | Approval | Manager approves/rejects (`/approvals/[cuid]`); applicant notified | `leave:view` | ☐ |
| L8 | Leaves | Withdraw | DELETE withdraws request; notification emitted | `leave:view` | ☐ |
| L9 | Leaves | CL/SL monthly accrual | Accrual reflects joining date (full-month credit rule from 1st of joining month) | – (background) | ☐ |
| L10 | Leaves | LOP/LWP payroll-cutoff counting | LOP/LWP counts use `payroll_cut_off_date` cycles from settings | – (background) | ☐ |
| L11 | Leaves | Settings | GET/POST leave settings incl. cutoff day | `leave:view` | ☐ |
| L12 | Leaves | Insufficient balance | Request exceeding balance is rejected (if enforced by policy) | `leave:view` | ☐ |

---

## 8. Holidays

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| H1 | Holidays | CRUD | Create/list/update holidays | `holiday:view` | ☐ |
| H2 | Holidays | Duplicate date | Duplicate date in same year rejected | `holiday:view` | ☐ |
| H3 | Holidays | Year limit | Scheduling beyond 2099 rejected | `holiday:view` | ☐ |
| H4 | Holidays | Holiday effect on attendance | Holiday blocks attendance check-in (see AT4) | – | ☐ |
| H5 | Holidays | Notification | New holiday creates broadcast notification | – | ☐ |

---

## 9. Shifts & Shift Assignments

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| S1 | Shifts | CRUD | Shift name/start/end editable | `shift:view` | ☐ |
| S2 | Shift assignments | Assign | Assign employee+shift with effective dates; active = status true & effective window | `shift_assignment:view` | ☐ |
| S3 | Shift assignments | Overlapping/open-ended | Open-ended (`effective_to` null) stays active forever; window overlap handled per business rule | `shift_assignment:view` | ☐ |
| S4 | Shift assignments | Notification | Assigned/reassigned employee gets notification | `shift_assignment:view` | ☐ |
| S5 | Shift assignments | Dashboard integration | User's active shift appears on dashboard | – | ☐ |

---

## 10. Salary Components & Structures

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| SC1 | Salary components | CRUD | Component name/type/amount CRUD | `salary_component:view` | ☐ |
| SC2 | Salary structures | CRUD | Structure CRUD | `salary_structure:view` | ☐ |
| SC3 | Salary structures | Components per structure | `[cuid]/components` list works | `salary_structure:view` | ☐ |
| SC4 | Salary structures | Employees per structure | `[cuid]/employees` list works | `salary_structure:view` | ☐ |

---

## 11. Payroll

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| PY1 | Payroll records | List / detail | GET `/api/payrolls` and `[cuid]` render; payslip page loads | `payroll:view` | ☐ |
| PY2 | Payroll | Upload valid workbook | Rows parsed; employee codes matched; record(s) processed; gross/net/breakdown persisted | `payroll:view` | ☐ |
| PY3 | Payroll | Header variants | Handles `Emp No`/`Employee Code`/`ID` variants, month name/number, `Salary Details for the month ...` title | `payroll:view` | ☐ |
| PY4 | Payroll | Non-numeric component | Row fails with `'<Component> must be numeric.'` and lands in failures | `payroll:view` | ☐ |
| PY5 | Payroll | Missing employee code | Row fails: `Employee code is required` | `payroll:view` | ☐ |
| PY6 | Payroll | Month/year out of range | Row fails with range reason | `payroll:view` | ☐ |
| PY7 | Payroll | Bad file type | `.csv`/`.txt` rejected (extension/MIME validation) | `payroll:view` | ☐ |
| PY8 | Payroll | Duplicate employee+month+year | Duplicate detected; skipped row recorded | `payroll:view` | ☐ |
| PY9 | Payroll | Upload batch + failures | Upload batch created; `failures` and `records` endpoints reflect per-row outcome | `payroll:view` | ☐ |
| PY10 | Payroll | Notification | Batch success → `payrollProcessed`; failures → `payrollFailed` (high priority) | – | ☐ |
| PY11 | Payroll | Dashboard integration | Selected period totals match uploaded payroll | – | ☐ |

---

## 12. Notifications

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| N1 | Notifications | List | `/api/notifications` returns notifications for user | `dashboard:view` | ☐ |
| N2 | Notifications | Mark single read | PATCH `[cuid]/read` updates; unread-count decrements | `dashboard:view` | ☐ |
| N3 | Notifications | Mark all read | PATCH `read-all` updates all; unread-count = 0 | `dashboard:view` | ☐ |
| N4 | Notifications | Delete | DELETE `[cuid]` removes | `dashboard:view` | ☐ |
| N5 | Notifications | Unread count | `unread-count` returns correct number | `dashboard:view` | ☐ |
| N6 | Notifications | Cron endpoint | GET/POST `/api/notifications/cron` triggers daily job; birthdays + work anniversaries emitted | `dashboard:view` | ☐ |

---

## 13. Roles & Permissions (RBAC)

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| R1 | Roles | CRUD | Role create/list/update/delete | `role:view` | ☐ |
| R2 | Permissions | CRUD | Permission create; duplicate key → `Permission already exists`; keys normalized to lowercase | `permission:view` | ☐ |
| R3 | Role-permissions | Assign | POST assigns permission to role | `role_permission:view` | ☐ |
| R4 | Role-permissions | Unassign | DELETE `[roleCuid]/[permissionCuid]` removes mapping | `role_permission:view` | ☐ |
| R5 | Role-permissions | Module grouping | List groups permissions by prefix module (`getPermissionModule`) | `role_permission:view` | ☐ |
| R6 | System roles | CRUD | System role create/list/update/delete | `system_role:view` | ☐ |
| R7 | RBAC | Permission propagation | After assigning a permission to a role, user's `permissions` include it on next load / login | – | ☐ |

---

## 14. Settings & Placeholders

| # | Module | Functionality | Expected behaviour | Permission | Status |
|---|--------|---------------|--------------------|------------|--------|
| SE1 | Settings | Page renders | Placeholder text: "Settings controls will be added as HRMS modules mature." | – | ☐ |
| SE2 | Settings | Leave payroll cutoff stored | Leave settings POST persists `payroll_cut_off_date`; LOP cycle uses it | `leave:view` | ☐ |

---

## 15. Cross-Cutting / Non-Functional

| # | Item | Check | Status |
|---|------|-------|--------|
| X1 | Empty states | Every list page shows a sane empty state (no crash, no perpetual spinner) | ☐ |
| X2 | Loading states | Slow responses show loading indicator; double-submit prevented on forms (create/apply/upload) | ☐ |
| X3 | Error states | API failure surfaces a readable error, not an unhandled exception | ☐ |
| X4 | Numerical formatting | Currency/percent widgets render correct values (0, negative trend, big numbers) | ☐ |
| X5 | Timezone | UTC date normalization consistent across attendance/leave/holiday/dashboard period filters | ☐ |
| X6 | Accessibility | Forms have labels; buttons describe actions; keyboard navigable | ☐ |
| X7 | Responsive | Core journeys usable at mobile/tablet widths | ☐ |
| X8 | Console cleanliness | No unexpected console errors during journeys (diagnostic logs expected) | ☐ |

---

## Suggested E2E tour mapping (top priority)
1. **Happy path (Business District)**: SSO → employee dashboard → profile view → check-in (mock GPS at office) → check-out → apply leave → view leaves list.
2. **Payroll (Money tour)**: create salary component/structure → upload valid Excel → records created → payslip renders → failures page for a bad row.
3. **Admin (FedEx tour)**: create department/designation/location → create employee (full) → assign shift → schedule holiday → run notifications cron.
4. **RBAC (Bad Neighborhood)**: user without `payroll:view` → 403 on `/api/payrolls`; without `employee:view` → redirect from `/employees`.
5. **Boundary (Rained-Out)**: check-in outside geofence, duplicate check-in, holiday check-in, leave on weekend count, holiday year > 2099, payroll bad MIME, pending check-out at day 8.