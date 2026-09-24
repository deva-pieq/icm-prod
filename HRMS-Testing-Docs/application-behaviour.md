# HRMS — Application Behaviour Document

> Purpose: reference for automating E2E scenarios and for manual feature verification.
> Source: code inspection of the `pieq-svelte-app-template` (SvelteKit) repository.
> Status: application is **not yet deployed** to a test environment — all behaviour below describes the intended contract as implemented.

---

## 1. Product Overview

The HRMS (Human Resource Management System) covers employee master data, attendance with GPS geofencing, leave management (types, policies, accruals, approvals), holidays, shifts/shift assignment, salary components/structures, payroll (Excel upload + records + payslips), notifications, and an RBAC matrix (system roles, roles, permissions, role-permissions, master data). Entry is via Single Sign-On (Keycloak OIDC).

### 1.1 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | SvelteKit 2 (Svelte 5), Tailwind CSS 4, shadcn-svelte (bits-ui), lucide-svelte icons |
| Backend | SvelteKit server routes (`+server.ts`), service layer, DAO layer, Prisma ORM |
| Database | PostgreSQL (Prisma schema: `prisma/schema.prisma`) |
| Auth | Auth.js (`@auth/sveltekit`) with Keycloak OIDC provider |
| Deployment | `@sveltejs/adapter-node`, Docker, GitHub Actions (`Preprod-AWS-Service`) → ECR + Terraform |
| Tests | Playwright (`tests/e2e`), Vitest (`tests/unit`) |

### 1.2 Architecture Layers
```
SvelteKit route handler (+server.ts) → service (src/lib/server/services/*) → DAO (src/lib/server/dao/*) → Prisma → PostgreSQL
```
- **36 services**, **33 DAOs**.
- Page layouts gate access with `requirePermission(locals.user, '<perm>', '/dashboard')` (redirect on failure).
- API endpoints gate access with `requirePermission(locals.user, '<perm>')` (403 on failure).
- `+layout.server.ts` at app root resolves the logged-in user's employee via email and computes `isManager` (has subordinates).

### 1.3 Environment & Configuration
- `.env.example` exposes: `API_BASE_URL="https://people.pieq.ai"`, `APP_URL`, `DATABASE_URL`, `SSO_CLIENT_SECRET`, plus optional `OIDC_URL`, `OIDC_REALM`, `OIDC_CLIENT_ID` overrides.
- `src/lib/server/config.js` builds issuer `{OIDC_URL}/realms/{realm}` and JWKS `{issuer}/protocol/openid-connect/certs`; `oidc-defaults.js` provides fallbacks (preprod realm `pieq-sso`).
- Auth callback path: `/auth/callback/keycloak`; sign-in at `/auth/signin`; logout at `/auth/logout`.

---

## 2. Authentication & Authorization (RBAC)

### 2.1 Session flow (`src/hooks.server.js`)
1. Auth.js handle runs (Keycloak OIDC).
2. If authenticated, the user record is **synced** via `authUserService.syncAuthenticatedUser(email)` — this resolves employment, employee, role, and permission set; role/permission info is attached to `locals.user`.
3. BigInt serialization is normalised (BigInt → string) so page loads can return DB ids.
4. Route guard then applies per-page permission checks.

### 2.2 Access model (`src/lib/authz/index.ts`)
- `canAccess(user, permission)`:
  - Returns false for unauthenticated users.
  - `profile:view` is a **default permission granted to every authenticated user**.
  - Permission set comes from the user's role (`user.permissions` array).
  - **Wildcard `*` is supported** (bootstrap admin bypasses all checks).
- `hasRole(user, allowedRoleCuids)` — strict check against the user's `system_role_cuid`.
- Guards (`src/lib/server/guards/permission.guard.ts`):
  - `requireAuth` → 401 `Authentication required`.
  - `requirePermission` → 403 with message `` `${roleName} cannot access ${permission} ...` `` (or 303 redirect to fallback URL when provided).
  - `requireAdmin` → `requirePermission(user, 'dashboard:admin')`.

### 2.3 Permission keys (observed in code)
| Module | Permission keys |
|---|---|
| Dashboard | `dashboard:view`, `dashboard:admin`, `dashboard:finance`, `dashboard:employee` |
| Profile | `profile:view` (default) |
| Employees | `employee:view` |
| Departments / Designations | `department:view`, `designation:view` |
| Locations | `location:view` |
| Leave | `leave:view` |
| Leave types / policies | `leave_type:view`, `leave_policy:view` |
| Holidays | `holiday:view` |
| Attendance / records | `attendance:view`, `attendance_record:view` |
| Shifts / assignments | `shift:view`, `shift_assignment:view` |
| Salary | `salary_component:view`, `salary_structure:view` |
| Payroll | `payroll:view`, `payroll:upload` (example in guard docs) |
| RBAC | `role:view`, `role_permission:view`, `permission:view`, `system_role:view` |
| Master data / states | `dashboard:view` |

---

## 3. Module Behaviours

### 3.1 Master Data (`/api/master-data/[master]`)
- Supported keys (`src/lib/master-data/master-config.ts`): `blood-groups`, `pay-grades`, `nationalities`, `employment-types`, `relation-types`, `document-types`, `states` (requires `country_cuid`), `countries`, `skills`, `attendance-sources`, `languages`.
- `GET` lists entries; `POST /[master]` creates; `PUT /[master]/[cuid]` updates.
- Validation examples: value names normalized/validated, and `states` must reference an existing country.
- Also standalone `GET /api/countries` and `GET /api/states` routes (states route requires `dashboard:view`).

### 3.2 Departments / Designations / Organization Locations
- **Departments** (`/api/departments`): GET/POST list+create; `[cuid]` GET/PUT/DELETE. Active flag (`status`) on department; list counts only `status: true`.
- **Designations** (`/api/designations`): same CRUD shape.
- **Organization locations** (`/api/organization_location`): GET/POST; `[cuid]` PUT/PATCH/DELETE. Location carries **latitude/longitude** used by the attendance geofence.

### 3.3 Employees (`/api/employees`)
- `GET` (list), `POST` (create), `[cuid]` GET/PUT/DELETE (soft delete — `is_deleted` flag respected by counts and lookups).
- `next-code` GET → generates next employee code (string).
- Attendance view: `attendance-view` GET.
- **Sub-resources** (each GET + PUT on `[cuid]/<sub>`):
  - `addresses`, `bank-details`, `documents` (+ `[docCuid]` GET), `educations`, `employment`, `experiences`, `languages`, `skills`.
- **Employment rules**
  - Employment record holds `employment_status` (`active`, `onboarding`, etc.), `date_of_joining`, `confirmation_date`, `relieving_date`, `official_email`, `reporting_manager_cuid`, `department_cuid`, `designation_cuid`, `location_cuid`, `pay_grade_cuid`, `employment_type_cuid`, `system_role_cuid`.
  - `official_email` is the join key used to resolve the OIDC session to an employee (`resolveEmployee` in `leave.service.ts`; also used by layout loads).
  - Dashboard "active users" counts employment rows where `employment_status: 'active'`.

### 3.4 Profile Self-Service (`/api/profile/[...module]`)
- Spread route for `personal`, `addresses`, `bank-details`, `documents`, `educations`, `employment`, `experiences`, `languages`, `skills`, etc. — GET/POST/PUT.
- **HR-controlled fields** (`src/lib/config/profile.config.ts`) — `emp_code`, `department_cuid`, `designation_cuid`, `role_cuid`, `reporting_manager_cuid`, `employment_status`, `pay_grade_cuid`, `employment_type_cuid`, `location_cuid`, `system_role_cuid`, `date_of_joining`, `confirmation_date`, `relieving_date`, `official_email`.
- Edit modes: `create` | `edit` | `self`. HR-controlled fields are **not editable in `self` mode** (employee cannot change own department/manager/salary-relevant fields).
- Profile route grants `profile:view` to all authenticated users and treats the owner as authorized for their own record.

### 3.5 Attendance (`/api/attendance`)
- **Check-in** `POST /api/attendance/check-in`:
  - Employee must exist and have an employment record with `date_of_joining`.
  - Date must be within employment period (cannot be before joining or after relieving).
  - Eligibility re-check: not a holiday; no existing status Leave/On Leave/LOP; no approved full-day leave on the date (half-day leave still allows check-in).
  - Cannot have an open record or an existing check-in for today.
  - **GPS mandatory**: latitude/longitude must be present and numeric.
  - Employee must have a `location_cuid` and the location must be configured with valid lat/lon.
  - **Geofence**: `calculateDistance(...)` (Haversine, `src/lib/geofence.ts`) must be ≤ **100 m** (`GEOFENCE_CONFIG.ALLOWED_RADIUS_METERS`) from the office location, else `'You are outside the office zone'`.
  - `attendance_source_cuid` optional — if absent, a **'Web'** attendance source is auto-created (`getOrCreateWebSource`).
  - Duplicate check-in returns `'Already checked in for today'`; open record returns `'An open attendance record already exists for today. Please check out first.'`
  - Result: record with status `Present` (or keeps `Half Day`).
- **Check-out** `PUT /api/attendance/check-out`:
  - Requires an open record for today, OR an explicit `attendanceRecordCuid` (pending check-out).
  - Pending check-out: record must belong to the authenticated employee, must not already be checked out, and cannot be older than **7 days** (`'Pending check-out has expired (grace period is 7 days)'`).
  - `checkOutTimeInput` (when provided) must be valid, later than check-in, and on the **same calendar date** as the attendance record.
  - Same geofence + GPS rules as check-in.
  - `work_duration_minutes = max(0, (checkOut - checkIn) / 60000)`.
- **Today's status** `GET /api/attendance/me` → current record (check-in/out times, work duration, status).
- **History** (`getEmployeeHistory`) spans employment period; if no relieving date, history runs to 2099-12-31 (future scheduled records included).
- Attendance records API (`/api/attendance-records`): list/create + `[cuid]` GET/PUT with filters `employee_cuid`, `date`, `status`, `attendance_source_cuid`.

### 3.6 Leaves
- **Config helpers** (`src/lib/server/config/leave.config.ts`): `calculateLeaveDays`, `isWeekend`, `isHoliday`, `getHolidaysCached` — used to count working days only (weekends/holidays excluded for normal leave codes; ML/LWP count all days).
- **Apply leave** `POST /api/leaves` (input shape `ApplyLeaveInput`):
  - `leaveTypeCuid`, `startDate`, `endDate`, `isHalfDay`, `halfDaySession`, `reason`, `document` ({fileName, mimeType, base64Data}), maternity fields `expectedDeliveryDate`/`isMiscarriage`/`childBirthDate`.
  - Document upload supported (retrievable at `[cuid]/document`).
- **Leave types** (`/api/leave/types`): CRUD; code classification drives behaviour: `CL`, `SL`, `LOP`, `LWP`, `ML` etc.
- **Leave policies** (`/api/leave/policies`): CRUD.
- **Accrual** (`accrueLeaves`):
  - CL/SL accrue monthly on a dynamic schedule based on `date_of_joining`; **full-month credit rule** (join date normalized to 1st of month).
  - Leave balances initialized per year for each active leave type.
  - LOP/LWP counted against a **payroll cut-off cycle** (`getPayrollCutoffDay` from settings, `payroll_cut_off_date`).
- **Approvals** (`POST /api/leaves/approvals/[cuid]`): manager approves/rejects; only managers of the employee can act; approved leaves emit notifications `leaveApproved` / `leaveRejected`.
- **Withdraw** (`DELETE /api/leaves/[cuid]`): emits `leaveWithdrawn`.
- **Settings** (`GET/POST /api/leaves/settings`): leave workflow settings, including payroll cutoff day.
- Applied leave emits `leaveApplied` notification.

### 3.7 Holidays (`/api/holidays`)
- CRUD; `[cuid]` GET/PUT.
- Validation: **schedule only up to year 2099**; duplicate-date check per year.
- Upcoming holidays are surfaced on dashboards (sorted ascending from today).
- New holiday emits `holidayCreated` notification.

### 3.8 Shifts & Shift Assignments
- **Shifts** (`/api/shifts`): CRUD with `name`, `start_time`, `end_time`; PUT/PATCH/DELETE on `[cuid]`.
- **Shift assignments** (`/api/shift-assignments`): CRUD; fields include `employee_cuid`, `shift_cuid`, `status` (bool), `effective_from`, `effective_to` (nullable = open-ended).
- Active assignment for a date = `status: true` AND `effective_from <= date` AND (`effective_to >= date` OR `effective_to IS NULL`).
- Assignment/change emits `shiftAssigned` / `shiftReassigned` notifications to the employee.
- Dashboard shows the user's active shift for today.

### 3.9 Salary Components & Structures
- **Salary components** (`/api/salary-components`): CRUD (`name`, type/amount info).
- **Salary structures** (`/api/salary-structures`): CRUD; supports per-structure components (`[cuid]/components`) and employees (`[cuid]/employees`).
- Used as the reference data for payroll components (basic/allowances/deductions/bonuses classification on dashboards is heuristic by key names).

### 3.10 Payroll
- **Records** (`/api/payrolls`): GET list; `[cuid]` GET detail; payslip page at `payroll-records/[cuid]/payslip`.
- **Upload** (`POST /api/payrolls/upload`):
  - Accepts an Excel workbook (.xlsx/.xls; MIME types `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, fallback `application/octet-stream`).
  - Parser (`excel-parser.ts`): header detection is **case-insensitive, punctuation-stripped**; supports variants of employee identity columns (`Emp No`, `Employee Code`, `ID`, …), name columns, month/year columns (names `January..December` or numbers), and optional file title line `Salary Details for the month ...`.
  - All other numeric columns are stored into `breakdown`; reserved columns (gross/deduction/net/DOJ/DOB/PAN/UAN/PF/ESIC, etc.) are excluded from breakdown.
  - Row validation (`payroll.validator.ts`): employee code required; month 1–12; year 2000–9999; every component cell must be numeric; per-row failures recorded with row number + reason.
  - **Duplicate rule**: employee+month+year already processed → duplicate detection; skipped rows tracked.
  - Upload is wrapped in an **upload batch** (`payroll-uploads` API: GET, `[cuid]` GET, `failures` GET, `records` GET).
  - Success/failure emits `payrollProcessed` / `payrollFailed` (high priority) notifications.
- Dashboard aggregates per selected period (month/year) with MoM trends and component breakdown via key-name heuristics.

### 3.11 Notifications
- **Enums** (`notification.enums.ts`):
  - Category: `birthday`, `holiday`, `announcement`, `payroll`, `leave`, `attendance`, `system`.
  - Priority: `low`, `medium`, `high`, `urgent`.
  - Type: `info`, `success`, `warning`, `error`.
  - Target: `broadcast`, `employee`, `role`, `department`, `manager`.
- **Templates** (observed): `employeeJoined`, `holidayCreated`, `leaveApplied`, `leaveApproved`, `leaveRejected`, `leaveWithdrawn`, `payrollProcessed`, `payrollFailed`, `birthday`, `workAnniversary`, `shiftAssigned`, `shiftReassigned`.
- **API** (`/api/notifications`): GET/POST list+create; `[cuid]` DELETE; `[cuid]/read` PATCH (mark read); `read-all` PATCH; `unread-count` GET; `cron` GET/POST (scheduled job trigger endpoint).
  - All notification endpoints require `dashboard:view`.
- **Scheduled jobs** (`src/lib/server/services/scheduled-jobs.ts`): `processDailyNotifications()` broadcasts **birthdays** and **work anniversaries** among active employees daily.

### 3.12 Roles, Permissions, Role-Permissions, System Roles
- **Roles** (`/api/roles`): CRUD; `[cuid]` GET/PUT/DELETE.
- **Permissions** (`/api/permissions`): CRUD; permission keys normalized (trim/lowercase) and **unique** (`'Permission already exists'` on duplicate).
- **Role-permissions** (`/api/role-permissions`): `GET` list, `POST` assign permission to role, `DELETE /[roleCuid]/[permissionCuid]` unassign. `getPermissionModule(key)` groups by the prefix before `_`.
- **System roles** (`/api/system-roles`): CRUD; the user's `system_role_cuid` drives `hasRole` checks (dashboard variants etc.).
- These are used to build `locals.user.permissions` at login (via auth DAO aggregation of role permissions).

### 3.13 Dashboards (`/dashboard`)
- Entry redirects by capability: `dashboard:admin` → `/dashboard/admin`, `dashboard:finance` → `/dashboard/finance`, else `dashboard:employee` → `/dashboard/employee` (also `[cuid=cuid]` variant).
- **Admin dashboard** data (per selected period):
  - Stats: total employees, new employees this month, active users, new active users, active departments, total payroll (gross + net), expenses MTD (**mocked at 5% of payroll**), deductions, MoM trends.
  - Payroll component donut: classification by key-name heuristics (deduction keys, basic keys, bonus keys, other keys).
  - Bottom row: new hires, resignations (relieving_date in period), present today %, upcoming holidays count, **mock performance reviews** (`22` / trend `4` static).
  - Personal widgets: active shift for today, today's attendance status.
- **Employee** dashboard: employee-centric view (attendance today, shift, leave summary).

---

## 4. Cross-Cutting Contracts

### 4.1 Error semantics
- Validation failures throw `ValidationError(field, message)` / `AttendanceValidationError` / `AttendanceMultiValidationError` → surfaced as HTTP errors by handlers.
- AuthN/AuthZ: `401 Authentication required`; `403 <role> cannot access <perm> ...`; layout-level redirect (303) to `/dashboard` when a fallback URL is configured.
- API data shape: list endpoints typically return `{ data: [...] }`; detail endpoints return the entity.

### 4.2 Dates & Time
- Attendance/leave/holiday dates are normalized to **UTC midnight** (`Date.UTC(y, m, d)`) for comparisons.
- Dashboards compute month periods from `url.searchParams.get('period')` (`YYYY-MM`), defaulting to the latest existing payroll period, else current month.
- Holidays can only be scheduled through the year 2099.

### 4.3 Soft-delete & counting
- Employees use `is_deleted` soft delete; employee counts filter `is_deleted: false`.
- Departments use `status` boolean for "active"; dashboard counts only `status: true`.
- Shift assignments use `status: true` for active assignments.

### 4.4 Serialization
- `BigInt` values are serialized to strings globally (hooks) so Prisma bigint ids (e.g., permission ids) round-trip through JSON.

---

## 5. API Surface Summary

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | health check |
| GET | `/api/countries` | public(ish) | countries list |
| GET | `/api/states` | `dashboard:view` | states list |
| GET/POST | `/api/master-data/[master]` | `dashboard:view` | master data list/create |
| PUT | `/api/master-data/[master]/[cuid]` | `dashboard:view` | master data update |
| GET/POST | `/api/departments`, `[cuid]` GET/PUT/DELETE | `department:view` | department CRUD |
| GET/POST | `/api/designations`, `[cuid]` GET/PUT/DELETE | `designation:view` | designation CRUD |
| GET/POST | `/api/organization_location`, `[cuid]` PUT/PATCH/DELETE | `location:view` | location CRUD (geofence anchor) |
| GET/POST | `/api/employees`, `[cuid]` GET/PUT/DELETE | `employee:view` | employee CRUD |
| GET/PUT | `/api/employees/[cuid]/addresses` (bank-details, educations, employment, experiences, languages, skills) | `employee:view` | employee sub-resources |
| GET/PUT | `/api/employees/[cuid]/documents`, `[docCuid]` GET | `employee:view` | employee documents |
| GET | `/api/employees/attendance-view`, `/api/employees/next-code` | `employee:view` | helpers |
| GET/POST/PUT | `/api/profile/[...module]` | `profile:view` | self-service profile (per-module) |
| POST | `/api/attendance/check-in` | `attendance:view` | geofenced check-in |
| PUT | `/api/attendance/check-out` | `attendance:view` | check-out / pending check-out |
| GET | `/api/attendance/me` | `attendance:view` | today's record |
| GET/POST | `/api/attendance-records`, `[cuid]` GET/PUT | `attendance_record:view` | attendance records CRUD |
| GET/POST | `/api/holidays`, `[cuid]` GET/PUT | `holiday:view` | holiday calendar |
| GET/POST | `/api/leave/types`, `[cuid]` GET/PUT | `leave_type:view` | leave types |
| GET/POST | `/api/leave/policies`, `[cuid]` GET/PUT | `leave_policy:view` | leave policies |
| GET/POST | `/api/leaves`, `[cuid]` POST(update)/DELETE | `leave:view` | leave requests |
| GET | `/api/leaves/[cuid]/document` | `leave:view` | leave supporting doc |
| POST | `/api/leaves/approvals/[cuid]` | `leave:view` | approve/reject leave |
| GET/POST | `/api/leaves/settings` | `leave:view` | leave settings (incl. payroll cutoff) |
| GET/POST | `/api/shifts`, `[cuid]` PUT/PATCH/DELETE | `shift:view` | shift CRUD |
| GET/POST | `/api/shift-assignments`, `[cuid]` GET/PUT/DELETE | `shift_assignment:view` | shift assignment |
| GET/POST | `/api/salary-components`, `[cuid]` GET/PUT/DELETE | `salary_component:view` | salary components |
| GET/POST | `/api/salary-structures`, `[cuid]` GET/POST/PUT/DELETE, `[cuid]/components`, `[cuid]/employees` | `salary_structure:view` | salary structures |
| GET | `/api/payrolls`, `[cuid]` GET | `payroll:view` | payroll records |
| POST | `/api/payrolls/upload` | `payroll:view` | Excel payroll upload |
| GET | `/api/payroll-uploads`, `[cuid]` GET, `[cuid]/failures`, `[cuid]/records` | `payroll:view` | upload batches & failures |
| GET/POST | `/api/roles`, `[cuid]` GET/PUT/DELETE | `role:view` | roles CRUD |
| GET/POST | `/api/permissions`, `[cuid]` GET/PUT/DELETE | `permission:view` | permission catalog |
| GET/POST | `/api/role-permissions`, DELETE `/api/role-permissions/[roleCuid]/[permissionCuid]` | `role_permission:view` | role↔permission mapping |
| GET/POST | `/api/system-roles`, `[cuid]` GET/PUT/DELETE | `system_role:view` | system roles CRUD |
| GET/POST | `/api/notifications`, `[cuid]` DELETE, `[cuid]/read`, `read-all`, `unread-count`, `cron` | `dashboard:view` | notifications + scheduled jobs |

## 6. Known Placeholders / Non-Functioning Areas (for E2E expectations)
- **Settings page** (`/settings`): placeholder — "Settings controls will be added as HRMS modules mature."
- **Admin dashboard performance reviews**: hard-coded (`22`, trend `4`) — not backed by data.
- **Expenses MTD**: mocked at 5% of payroll.
- **Existing e2e test**: `tests/e2e/dashboard.spec.ts` is `test.skip` — no live e2e coverage yet.
- Diagnostic `console.log` calls exist in `canAccess` (`[AUTHZ DIAGNOSTIC]`) and in server code (`[DIAG-3]`, `[DIAG-7]`) — noise, not functional features.