# UI Exploratory Test Report — PieQ HRMS

- **Application:** https://people.pieq.ai
- **Build under test:** preprod (server date 2026-09-21)
- **Tester:** exploratory pass via Playwright (Chromium), authenticated as `abiney.y@pieq.ai` (Administrator, EMP002, wildcard `*`)
- **Evidence directory:** `docs/ui-evidence/`
- **Scope:** functional UI walkthrough of every module reachable from the sidebar + notifications; validated against DOM/API (screenshots captured for review).

> Severity: **High** = wrong data / broken core flow; **Medium** = user-facing defect or missing capability; **Low** = UX/cosmetic/inconsistency. Findings marked *(API)* are corroborated by the API/logic report in `docs/exploratory-findings-report.md`.

---

## H-1. Dashboard payroll total contradicts its own donut breakdown
- **Severity:** High *(API: H2)*
- **URL:** `/dashboard/admin`
- **Steps**
  1. Open `/dashboard` (redirects to `/dashboard/admin`).
  2. Read the KPI **TOTAL PAYROLL (MTD)**.
  3. Sum the five donut slices under **Payroll Summary** (`Basic Salary`, `Allowances`, `Deductions`, `Bonuses`, `Others`).
- **Expected:** KPI total equals the sum of the breakdown slices.
- **Actual:** KPI = **₹2,64,195**; slices = ₹1,55,153 + ₹97,642 + ₹43,210 + ₹0 + ₹15,220 = **₹3,11,225** (≈17.8% higher; percentages sum to 100.1%). Deductions are added as a positive slice.
- **Evidence:** `dashboard-01-admin.png`

## H-2. Attendance widget offers "Check Out" with no check-in; confirm fails silently
- **Severity:** High *(API: M5)*
- **URL:** `/dashboard/admin` → "My Attendance" card
- **Steps**
  1. Open the dashboard with a day that has **no check-in** (widget shows `Status: LOP`, `Check In --:--`, `Check Out --:--`).
  2. Observe the only action button is **Check Out** (should be Check In).
  3. Click **Check Out** → confirm dialog "Confirm Check Out" → click **Check Out**.
- **Expected:** Either the button is "Check In", or the check-out is rejected with a visible message.
- **Actual:** `PUT /api/attendance/check-out` → **400**. No toast, no inline error, no console error, widget unchanged — the user gets zero feedback.
- **Evidence:** `dashboard-02-checkout-confirm.png`

## H-3. "New employees this month" metric is wrong
- **Severity:** High *(API: M4)*
- **URL:** `/dashboard/admin` → **TOTAL EMPLOYEES** card
- **Steps**
  1. Open the dashboard and read the "N this month" subtitle.
  2. Compare with `GET /api/employees` `date_of_joining`.
- **Expected:** Count of employees whose `date_of_joining` is in the current month (= **2** for Sep-2026).
- **Actual:** Shows **"5 this month"** — computed from `created_at` (all 5 seeded records were created in the same month), not `date_of_joining`.
- **Evidence:** `dashboard-01-admin.png`

## M-1. "Apply Leave" submits nothing and shows no validation
- **Severity:** Medium
- **URL:** `/leaves` → **Apply Leave** dialog
- **Steps**
  1. Open `/leaves`, click **Apply Leave**.
  2. Leave all required fields empty (Leave Type, Start Date, End Date, Reason).
  3. Click **Apply**.
- **Expected:** Inline validation (or the button disabled).
- **Actual:** Button is **enabled** with empty required fields; clicking it sends **no POST**, shows **no error text, no `aria-invalid`, no toast** — a silent no-op. Only `GET /api/leaves` is observed.
- **Evidence:** `leaves-01-apply-empty-submit.png`

## M-2. Inconsistent name normalization across modules (Department title-cases, others don't)
- **Severity:** Medium
- **URL:** `/departments`, `/designations`, `/holidays`, `/salary-components`
- **Steps**
  1. Create a Department named `ZZ QA Test Dept`.
  2. Create a Designation named `ZZ QA Designation`, a Holiday `ZZ QA Holiday`, and a Salary Component `ZZ QA Component`.
  3. `GET /api/departments`, `/api/designations`, `/api/holidays`, `/api/salary-components`.
- **Expected:** Consistent normalization of user-entered names.
- **Actual:** Department is auto-title-cased → **`Zz Qa Test Dept`** (acronyms mangled). Designation/Holiday/Salary Component are stored **verbatim** (`ZZ QA Designation`, `ZZ QA Holiday`, `ZZ QA Component`).
- **Evidence:** API responses (see below).

## M-3. Holidays cannot be deleted or deactivated
- **Severity:** Medium
- **URL:** `/holidays`
- **Steps**
  1. Open `/holidays`, open a row's **Actions** menu → only **Edit** is offered (no Delete).
  2. `DELETE /api/holidays/{cuid}` → **405 "DELETE method not allowed"**.
  3. `PUT /api/holidays/{cuid}` with `{"status":false}` → 400 `Invalid, unexpected or misspelled key: "status"`.
- **Expected:** Holidays can be removed/disabled like other master data.
- **Actual:** No removal path at all (UI or API). A mistyped holiday is permanent. (By contrast, Departments/Designations/Salary Components soft-disable via `DELETE` → `{"message":"Successfully disabled"}`, `status:false`.)
- **Evidence:** `holidays` module + API probes.

## M-4. Payroll upload batches cannot be deleted or retried
- **Severity:** Medium
- **URL:** `/payrolls`
- **Steps**
  1. Open `/payrolls`, open a row's **Actions** menu → only **View Details**.
  2. `DELETE /api/payroll-uploads/{cuid}` → **405**.
- **Expected:** Ability to remove a bad upload or retry it.
- **Actual:** Failed batches accumulate permanently. Existing data already shows 3 of 4 batches **Failed** (`0/0`), with no way to clear them.
- **Evidence:** `payroll-01-upload-failed.png`

## M-5. Payroll upload failure gives no immediate feedback
- **Severity:** Medium
- **URL:** `/payrolls`
- **Steps**
  1. Select a corrupt `.xlsx` (valid extension, invalid content) and click **Upload Payroll**.
- **Expected:** A toast/inline message explaining the failure.
- **Actual:** `POST /api/payrolls/upload` → 200, the file picker resets, a new row appears as **Failed / 0-0**, and **no message is shown**. The reason (`Unsupported ZIP Compression method 513`) is only visible after opening **View Details**.
- **Evidence:** `payroll-01-upload-failed.png`, `payroll-02-detail-upload-failed.png`

## L-1. Audit History is effectively empty
- **Severity:** Low
- **URL:** `/audit-history`
- **Steps:** Open `/audit-history` after performing many mutations (create department/designation/holiday/salary-component, toggle permissions, upload payroll, assign shift).
- **Expected:** Audit entries for those configuration/transaction changes (the page states "trace configurations and transactions modifications across the HRMS").
- **Actual:** **1 record total** — a single `Auth / LOGIN / SUCCESS`. Configuration changes are not captured.
- **Evidence:** `audit-history-01.png`

## L-2. Permission matrix auto-saves with no Save button or confirmation
- **Severity:** Low
- **URL:** `/role-permissions`
- **Steps:** Toggle any checkbox in the 34×6 matrix; reload.
- **Expected:** Explicit save, or a confirmation that the change persisted.
- **Actual:** Change persists immediately (verified 7→8 checked, then reverted), with **no Save button and no toast**. Easy to change production permissions accidentally.
- **Evidence:** `role-permissions-01-matrix.png`

## L-3. Two disconnected role systems
- **Severity:** Low
- **URL:** `/roles` vs `/system-roles` vs `/role-permissions`
- **Steps:** Create a role in `/roles` (e.g. "Backend Developer"); open `/role-permissions`.
- **Expected:** The new role appears in the permission matrix.
- **Actual:** Matrix only contains the 6 system roles (Admin, Employee, Finance, HR, Manager, SuperUser). Custom roles get no permissions and cannot be managed.
- **Evidence:** `role-permissions-01-matrix.png`

## L-4. Leave Type name duplicated as subtitle
- **Severity:** Low
- **URL:** `/leave-types`
- **Steps:** Open `/leave-types` and read the **Leave Name** column.
- **Expected:** Name plus a distinct description.
- **Actual:** The secondary line repeats the name (`Casual Leave` / `Casual Leave`), because the description equals the name.

## L-5. Discard button labelled "Cancel" in unsaved-changes dialog
- **Severity:** Low
- **URL:** `/departments` (and other dialogs)
- **Steps:** Open Create Department, type a name, click **Cancel**.
- **Expected:** Clear wording ("Discard" / "Keep editing").
- **Actual:** A confirm dialog titled "Cancel Changes" offers **Keep Editing** and **Cancel**, where "Cancel" *discards* the edits — ambiguous.
- **Evidence:** `departments-02-create-dialog.png`

## L-6. Internal parser error shown to end users
- **Severity:** Low
- **URL:** `/payrolls/{cuid}`
- **Steps:** Upload a corrupt spreadsheet, open its **View Details**.
- **Expected:** A user-friendly message.
- **Actual:** Raw library text surfaced: **"Unsupported ZIP Compression method 513"**.
- **Evidence:** `payroll-02-detail-upload-failed.png`

## L-7. No per-month de-duplication of payroll uploads
- **Severity:** Low
- **URL:** `/payrolls`
- **Steps:** Select a file, keep Pay Month = September, click **Upload Payroll** (a "3/10 Partial" September batch already exists).
- **Expected:** Warning/dedup, since the page says "One record will be created per employee per month".
- **Actual:** A second September batch is created unconditionally (existing data already has multiple September batches).

## L-8. Settings page is an empty stub
- **Severity:** Low
- **URL:** `/settings`
- **Steps:** Open `/settings`.
- **Actual:** Only "Settings controls will be added as HRMS modules mature." No controls. The item is still shown in the sidebar (and as a dashboard Quick Action).

## L-9. Transient 500 on first client-side nav to payroll details
- **Severity:** Low (not reproducible)
- **URL:** `/payrolls/{cuid}`
- **Steps:** From `/payrolls`, open a row → **View Details** (client-side navigation) on a session loaded before a redeploy.
- **Actual (once):** Page rendered **"500 Internal Error"**; console showed the route chunk `_app/immutable/nodes/48.C4pUc5PL.js` returning **404** (`Failed to fetch dynamically imported module`). A full reload then worked, and subsequent client-side navigation worked. Looks like a stale client build/chunk after deployment.
- **Evidence:** console log captured 2026-09-21T10:49.

---

## Data-consistency observations (informational)
- **Salary Components = 0** and **Salary Structures = 0**, yet **3 payroll records** exist with `gross_earnings`, `total_deduction`, `breakdown`. Payroll breakdowns are not backed by any configured components/structures.
- **Stats vs rows** on `/attendance-records`: summary reports Total 5 / Present 0 / Half Day 1 / LOP 1 / Not Logged In 3 while all 5 rows are dated the same day.
- **Attendance calendar** shows a future-dated (Sep 23) `PRESENT` row with `05:00 AM` checkout and `02:03 PM` check-in over 14h57m (overnight shift rendered without dates; checkout appears earlier than check-in).
- **Nav item `/organization-locations`** (hyphen) 404s; the correct route is `/organization_locations` (underscore).

## Verified working (no defect)
- Payroll **file-type validation**: selecting `bad-upload.txt` shows `Invalid file type: "bad-upload.txt". Only .xlsx and .xls files are accepted.` and keeps **Upload Payroll** disabled.
- **Upload gating**: Upload Payroll disabled until a file is chosen.
- **Duplicate Department name** → inline error `Department name "Engineering" already exists` (HTTP 409).
- **Employee create wizard**: step tabs do not bypass validation; Save disabled until required fields are filled.
- **Save gating** in Add Department / Designation / Holiday / Role / Salary Component / Salary Structure dialogs (disabled when required fields empty).
- **Soft-disable semantics** work: `DELETE` on departments/designations/salary-components sets `status:false` ("Successfully disabled"); bogus id → **404** with a proper message.
- **Notifications** bell/badge and panel render correctly.
- Locations, Shifts, Shift Assignments, Leave Types, Leave Policies lists render with correct counts.

## Leftover test data (could not be removed)
| Entity | Value | Status |
|---|---|---|
| Holiday | `ZZ QA Holiday` (2026-10-01, Regional) | **Cannot be removed** — no delete path (M-3) |
| Payroll upload | `ZZ_QA_test.xlsx` (Sep-2026, Failed) | **Cannot be removed** — no delete path (M-4) |
| Department | `Zz Qa Test Dept` | Soft-disabled (`status:false`) |
| Designation | `ZZ QA Designation` | Soft-disabled (`status:false`) |
| Salary Component | `ZZ QA Component` | Soft-disabled (`status:false`) |

## Method / reproduction notes
- Auth: `people.pieq.ai` → Keycloak `preprod.auth.pieq.ai` → `/select` → "Open HRMS".
- All findings confirmed via DOM (`evaluate`) and/or captured network responses; screenshots in `docs/ui-evidence/`.
- Only an admin account was available, so authorization (403) behaviour could not be exercised from the UI.
