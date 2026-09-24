# Leave Policy vs Hardcoded Rules — Regression Case Plan & Test Data

> **Source of truth for expected behavior:** code inspection of `leave.service.ts`, `leave.config.ts`, `leave-type.service.ts`, `leave-policy.service.ts`, `leave.dao.ts`, `prisma/schema.prisma`, and the dashboards (`employee/+page.server.ts`, `manager/+page.server.ts`, `leaves/+page.svelte`).
> **Summary doc:** `../Leave Policy vs Hardcoded Leave Rules.md` (outside repo) — this plan converts that analysis into executable regression cases with feed/test data.
> **Purpose:** prove that current behavior (hardcoded leave-code rules + partially-followed policy) stays intact after any refactor, and to objectively demonstrate the documented divergences (custom leave type → `0` balance, carry-forward only for `EL`, dashboards only count `CL/SL/EL`, etc.).

---

## 1. Scope & Objective

Regression-test the leave module against **observed** behaviour, not against policy "intent". Every case pins a behaviour that exists in code today, so a green run means "nothing regressed".

| Area | In scope |
|---|---|
| Balance initialization & accrual (`accrueLeaves`) | CL/SL monthly accrual, EL min-service accrual, ML/PL gender+service, generic `gender_specific`, custom/fresh leave type, LOP/LWP skip, employment-type mapping |
| Carry-forward | EL-only logic, annual/total caps, EL `remaining` cap |
| Apply-leave validations (`_applyLeaveCore`) | service days, half-day, gender policy, employment mapping, overlap, CL/SL date rules, CL contiguous rule, EL max 24, ML statutory, PL statutory, LWP monthly cap, document requirement, 2 MB document size |
| Day counting (`calculateLeaveDays`) | ML/LWP calendar days vs working days (weekend + holiday exclusion) |
| LOP overflow | balance exhaustion → primary + LOP split |
| Approval flow (`approveLeaveRequest`) | manager-only, re-validation, balance deduction, attendance record creation, attendance conflict |
| LOP/LWP usage counting (`getMonthlyUsedDays`) | payroll cut-off cycle for LOP, calendar month for LWP, split-request mapping |
| Dashboards & UI | employee/manager balance counters (CL/SL/EL only), leave-card styling membership |
| NOT in scope | Payroll upload, attendance geofence, notifications content (only emitted-event presence) |

---

## 2. Reference Anchor (now)

All date-sensitive cases are written for the reference date:

```
NOW = 2026-09-21 (September 2026)
```

When executing in another window, recompute the derived dates (see case `T-A1` strategy: calendar 2026 with Sep as the target month, or regenerate relative to run month).

---

## 3. Test Environment & Preconditions

1. Clean database (or reverted snapshot) with the schema from `prisma/schema.prisma`.
2. Authenticated admin session (permissions: `leave_type:view`, `leave_policy:view`, `leave:view`, `employee:view`, `attendance:view`, `holiday:view`) and a manager session `profile:view`/`leave:view`.
3. Leave settings configured with `payroll_cut_off_date = 25` (needed for LOP cycle cases).
4. Holiday calendar seeded for 2026 (must include **2026-08-15** and **2026-12-25**) — used by working-day cases.
5. `GEOFENCE_CONFIG`/attendance not required; approvals directly hit the DB via service/API.
6. Execution: API-level (`POST /api/leaves`, `POST /api/leaves/approvals/[cuid]`, `GET /api/employee-...`) or service/DAO unit level. Verify DB state via `leave_balances`, `leave_requests`, `attendance_records`.

---

## 4. Master Data to Feed (Seed Payloads)

### 4.1 Employment types
| `name` | key |
|---|---|
| Permanent | `emp_type_permanent` |
| Contract | `emp_type_contract` |

### 4.2 Employees

| Id | first_name | gender | employment_type | date_of_joining | employment_status | relieving_date | reporting_manager | official_email |
|---|---|---|---|---|---|---|---|---|
| **E1** | Alice | Female | Permanent | 2024-01-15 | active | — | **M1** | alice@test.local |
| **E2** | Bob | Male | Permanent | 2025-04-10 | active | — | **M1** | bob@test.local |
| **E3** | Carol | Female | Contract | 2026-09-01 | active | — | **M1** | carol@test.local |
| **E4** | Dan | Male | Permanent | 2024-06-01 | resigned | 2025-12-31 | **M1** | dan@test.local |
| **E5** | Eve | Female | Permanent | 2023-03-01 | active | — | **M1** | eve@test.local |
| **M1** | Mary (Manager) | Female | Permanent | 2023-01-01 | active | — | — | marymgr@test.local |

Notes:
- E3 has < min-service-days for most policies → service-days negative paths.
- E4 is resigned with a relieving date → EL resignation path.
- E5 is the long-tenured female used as the **only** valid ML applicant and the **EL carry-forward year-over-year** subject.

### 4.3 Leave types + policies
Rows for `leave_types` (name, code, is_paid, requires_approval) and `leave_policies` (fields as columns).

| code | name | is_paid | policy.annual_limit | max_per_month | carry_forward_allowed | max_carry_forward_days | max_annual_carry_forward_days | min_service_days | allow_half_day | gender_specific | applicable_gender | document_required | document_required_after_days | employment types |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CL | Casual Leave | true | 12 | 2 | false | null | null | 0 | true | false | null | false | null | Permanent |
| SL | Sick Leave | true | 10 | null | false | null | null | 0 | true | false | null | false | null | Permanent, Contract |
| EL | Earned Leave | true | 24 | null | **true** | 24 | 6 | 365 | true | false | null | false | null | Permanent |
| ML | Maternity Leave | true | 180 | null | false | null | null | 240 | false | **true** | **Female** | true | 1 | Permanent |
| PL | Paternity Leave | true | 5 | null | false | null | null | 90 | false | **true** | **Male** | false | null | Permanent |
| LWP | Leave Without Pay | false | 365 | null | false | null | null | 0 | false | false | null | false | null | all (LWP bypasses mapping check) |
| BL | Bereavement Leave (**custom / non-hardcoded code**) | true | 12 | 4 | **true** (set in DB, expected **ignored** by code) | 10 | 4 | 0 | true | false | null | false | null | Permanent |

> **BL is the probe type.** It is **not** in the hardcoded list (`CL, SL, EL, ML, PL`) and is **not** gender-specific — it activates the documented `initialAllocated = 0` path and the ignored carry-forward path.

### 4.4 Holiday calendar (2026)
| name | date |
|---|---|
| Independence Day | 2026-08-15 |
| Christmas | 2026-12-25 |

### 4.5 Leave settings
```
payroll_cut_off_date = 25
```

### 4.6 Drop/create order
1. `leave_requests` → `attendance_records` → `leave_balances` → `leave_policy_employment_types` → `leave_policies` → `leave_types`
2. Holidays → employees → employment records → employment types → leave settings
3. Each case that must, resets the affected employee's `leave_balances` and `leave_requests` to keep counts hermetic.

---

## 5. Regression Cases

Status is the **expected** result pinned to today's code. A failure = behavior drifted (or the documented bug was fixed — flag and confirm intent).

### 5.1 Balance Allocation & Accrual

**L-ACC-01 — CL monthly accrual with full-month credit**
- Rule: `type.code === 'CL'` → `min(annualLimit, monthsAccrued * annualLimit/12)`, join normalized to 1st of month (`leave.service.ts` `accrueLeaves`).
- Feed: run `accrueLeaves(E1, 2026)` (E1 joined 2024-01-15 → accrual join 2024-01-01). Target month = Sep (index 8) → monthsAccrued ≈ 9.
- Expected: CL balance for E1 / 2026 → `allocated_days ≈ 9.00`, `remaining_days ≈ 9.00`, `used_days = 0`. Annual cap: even in November `min(12, 12) = 12`, never `>12`.

**L-ACC-02 — SL monthly accrual** — same as L-ACC-01 for SL (annual limit 10): allocated ≈ `min(10, 9 × 10/12) = 7.5`.

**L-ACC-03 — CL/SL not accrued before joining**
- Rule: serviceStart = `max(accrualJoinDate, yearStart)`; if `serviceStart > serviceEnd` → `monthsAccrued = 0`.
- Feed: `E3` (joined 2026-09-01), accrue for **2025**.
- Expected: CL/SL 2025 balance rows not created (or created with `0` only if pre-existing) — assert **no positive remaining days**; no negative month accrual for years before join.

**L-ACC-04 — EL accrues only after min_service_days**
- Rule: eligible date = `accrualJoin + min_service_days` (365 for EL); accrues from `max(eligible, yearStart)`.
- Feed: E1, EL 2026 → eligible 2025-01-15 < 2026; months from 2026-01-01 → ≈ 9 → `allocated ≈ 9 × 24/12 = 18`.
- Feed: E2 (joined 2025-04-10, accrual join 2025-04-01, eligible 2026-04-01), EL 2026 → months from 2026-04-01 to 2026-09-30 → **6.0** months → `allocated = 6 × 24/12 = 12.00`, `remaining = 12.00`.

**L-ACC-05 — EL resigned without relieving date → 0**
- Rule: `employment_status === 'resigned' && !relievingDate` → `initialAllocated = 0`.
- Feed: set E4's employment status to `resigned` with `relieving_date = null`, accrue 2026.
- Expected: EL allocated `0.0`; used/remaining unaffected (remaining = `max(0, 0 + cf - used)`). **Restore E4 after case** (relieving 2025-12-31, status resigned-from-accrual is acceptable with relieving date set).

**L-ACC-06 — ML requires female + service days**
- Rule: `employee.gender !== 'female' → continue` (no balance row); else `serviceDaysNow >= min_service_days (240) → allocate annualLimit(180)`, else `continue`.
- Feed: accrue 2026 for E5 (female, 2023-03-01 → service > 240). Expected: ML balance row **exists**, allocated `180.00`, remaining `180.00`.
- Feed: E2 (male). Expected: **no** ML balance row created (row absent).
- Feed: E1 (female, 2024-01-15 → service > 240): allocated `180.00`.

**L-ACC-07 — PL requires male + service days**
- Rule: `gender !== 'male' → continue`; service `>= 90 → annualLimit` else continue.
- Feed: E2 (male, 2025-04-10, service ≈ 530) → PL allocated `5.00`, remaining `5.00`.
- Feed: E1 (female) → **no** PL balance row.

**L-ACC-08 — Generic gender_specific allocation (custom code path)**
- Rule: `else if (policy.gender_specific)` branch — gender equality + service check → allocate `annualLimit`.
- Feed: add a probe type `TECH` (not in hardcoded list) with `gender_specific = true`, `applicable_gender = Female`, `annual_limit = 8`, `min_service_days = 30`, mapped to Permanent.
- Expected: E5 (female, service ok) → TECH balance allocated `8.00`. E2 (male) → **no** TECH row.
- Cleanup: remove TECH type/policy after case.

**L-ACC-09 — Custom non-gender leave type → allocated 0 (documented defect)**
- Rule: none of the hardcoded branches match BL and `gender_specific = false` → `initialAllocated = 0`.
- Feed: accrue 2026 for E1 with BL type/policy (annual_limit 12).
- Expected: BL `leave_balances` row **exists** with `allocated_days = 0.00`, `remaining_days = 0.00`.
- **This is the key regression pin for the documented "custom leave type gets 0 days" behaviour.**

**L-ACC-10 — Employment-type mapping gates balance creation**
- Rule: if employment has `employment_type_cuid` and policy mapping lacks it → `continue` (skip) unless code is LWP.
- Feed: accrue 2026 for E3 (Contract). CL policy is mapped only to Permanent → **no CL balance row** for E3. SL mapped to both → row exists (accrued from 2026-09-01 → ≈ 1 month → `sl ≈ 0.83`).
- Feed: LWP (always skipped by accrual at the top regardless of mapping — see L-ACC-11).

**L-ACC-11 — LOP/LWP rows skipped during accrual**
- Rule: `if (code === 'LWP' || code === 'LOP') continue;`
- Expected: no `leave_balance` rows created for LWP/LOP in any year.

---

### 5.2 Carry Forward

**L-CF-01 — EL carry-forward year-over-year (caps honoured)**
- Rule (`type.code === 'EL' && year > joinYear`):
  - `unusedAllocated = max(0, prevAllocated - prevUsed)`
  - `cfFromAllocated = min(annualCap=6, unusedAllocated)`
  - `unusedPreviousCarried = max(0, prevCarried - max(0, prevUsed - prevAllocated))`
  - `carriedForward = min(maxCarryForward=24, cfFromAllocated + unusedPreviousCarried)`
  - new EL `remaining = min(maxCarryForward=24, initialAllocated + carriedForward) - used`
- Feed sequence (E5, EL annual 24 / annualCap 6 / totalCap 24):
  1. 2025: set balance `{allocated: 24, used: 10}` → unused 14 → cf into 2026 = `min(6, 14) = 6`.
  2. accrue 2026.
  3. Expected 2026 EL balance: `allocated ≈ 18 (2026 accrual)`, `carried_forward_days = 6.00`, `remaining = min(24, 18 + 6) = 24`.
- Feed variant (usage beyond allocation consumes carried days):
  1. 2025 balance `{allocated: 24, used: 28}` → `excessUsed = 4` consumed from prevCarried = 2 → retained prevCarried = `max(0, 2-4) = 0`; `cfFromAllocated = min(6, 0) = 0`.
  2. Expected 2026 `carried_forward_days = 0.00`.

**L-CF-02 — Carry-forward ignored for custom type (documented defect)**
- Rule: `type.code === 'EL'` guard only.
- Feed: BL policy `carry_forward_allowed = true`; set E1 2025 BL balance `{allocated: 10, used: 2}`; accrue 2026.
- Expected: 2026 BL `carried_forward_days = 0.00`, `remaining = 0.00` (allocated still 0 from L-ACC-09). Carry-forward config **does not** take effect.

**L-CF-03 — Carry-forward ignored for CL/SL**
- Rule: CL/SL never enter the `EL` branch; only their stored `carried_forward_days` column is re-read by `getAvailableBalanceForMonth`.
- Feed: E1 CL 2025 balance `{allocated: 12, used: 8, carried_forward_days: 4}`; accrue 2026.
- Expected: 2026 CL **allocated** from pure monthly accrual only; stored `carried_forward_days` for 2026 = `0.00` (no forwarding logic ran). (Availability still shows `accrued + 0`.)

---

### 5.3 Apply-Leave Validations

Run each under the employee's authenticated session (or `applyLeaveByCuid`).

**L-APP-01 — Employment type not mapped → rejected (except LWP)**
- Feed: E3 (Contract) applies **CL** (mapped Permanent only) for 2026-09-28..2026-09-29.
- Expected: `ValidationError leaveTypeCuid: 'This leave type is not applicable to your employment type.'` Request **not** created.
- Feed: E3 applies **LWP** → passes mapping check (LWP bypass).

**L-APP-02 — No active policy → rejected**
- Rule: `getLeavePolicyByLeaveType` returns null → throw `'No active Leave Policy found...'`.
- Feed: deactivate BL policy (`status: false`) then apply BL.
- Expected: rejected with the policy message. Restore policy after.

**L-APP-03 — min_service_days enforced**
- Rule: `serviceDays = (startDate - joinDate)/86400000`; `< min_service_days` → error.
- Feed: E3 (joined 2026-09-01) applies **SL** (min 0 → ok) and **EL** (min 365) on 2026-09-28.
- Expected: EL rejected: `Minimum service of 365 days is required... You have 26 days.` SL accepted pending.

**L-APP-04 — gender_specific enforced at apply (not just accrual)**
- Rule: `policy.gender_specific && empGender !== appGender` → error.
- Feed: E2 (male) applies **ML**. Expected: `'This leave type is only applicable to Female employees.'`
- Feed: E1 (female) applies **PL**. Expected: `'...only applicable to Male employees.'`

**L-APP-05 — Half-day require allow_half_day + session**
- Rule (CL/SL allow_half_day= true): `isHalfDay` with session `FN`/`AN` accepted.
- Feed: E1 applies CL half-day `FN` on 2026-09-28. Expected: created, `total_days = 0.50`, `is_half_day = true`, `half_day_session = 'FN'`.
- Rule (EL allow_half_day = false): E1 EL half-day 2026-09-28 | Expected: rejected `'Half-day leaves are not allowed for this leave type.'`
- Rule: session missing/invalid → rejected `'Half-day session (FN/AN) is required.'`

**L-APP-06 — CL max 2 days per request**
- Rule: `workingDaysCount > 2` → error.
- Feed: E1 CL 2026-09-28..2026-09-30 (Mon–Wed, 3 working days).
- Expected: rejected `'Maximum 2 days can be applied in a single Casual Leave request...'`

**L-APP-07 — CL cannot be future month / span months**
- Rule: for CL, `isStartFuture || isEndFuture` → error; `startYear !== endYear || startMonth !== endMonth` → error.
- Feed: E1, NOW = 2026-09-21: CL 2026-10-05..2026-10-06 (future month) → rejected. CL 2026-09-30..2026-10-01 (spans) → rejected `'cannot span multiple months.'`
- Control: CL 2026-09-28..2026-09-29 → created.

**L-APP-08 — SL future month rejected (end may cross month)**
- Rule: SL only blocks future **start**; end may be in another month.
- Feed: E1 SL 2026-09-30..2026-10-01 → **created** (start not future, end may cross).
- Feed: E1 SL 2026-10-01..2026-10-02 → rejected (future start).

**L-APP-09 — EL max 24 days per request**
- Rule: `workingDaysCount > 24` → rejected.
- Feed: E1 EL 2026-09-28..2026-11-06 (working days ≈ 29 → > 24). Expected: rejected `'A single Earned Leave (EL) request must not exceed 24 days.'`
- Control: EL 2026-10-01..2026-10-09 (working days ≈ 10 ≤ 24) → created if remaining balance allows (EL remaining capped ≤ 24).

**L-APP-10 — CL contiguous with EL/SL blocked**
- Rule: `workingDaysBetween` (weekends/holidays excluded) must be `> 0`; `0` → rejected.
- Feed (E1): approved SL 2026-09-14..2026-09-15; then apply CL 2026-09-16..2026-09-17 (no working day gap).
- Expected: rejected `'Casual Leave cannot be combined or appended with Earned Leave (EL) or Sick Leave (SL) in a continuous leave period.'`
- Control: CL 2026-09-21..2026-09-22 (gap ≥ 1 working day) → created.

**L-APP-11 — ML statutory: EDD required, 80-days worked, 8-week notice, certificate**
- Feed (E1 female, joined 2024-01-15, service ok): ML 2026-11-01..2026-11-30.
- Sub-cases:
  - missing `expectedDeliveryDate` → rejected `'Expected Delivery Date is required for Maternity Leave.'`
  - missing `reason`/doc → rejected `'A supporting medical certificate is mandatory for Maternity Leave.'` (document never optional for ML, even though `document_required_after_days` would allow none for others)
  - EDD 2027-02-15, requested 2026-09-28 → notice = start-to-EDD ≈ 140 days ≥ 56 → **accepted pending** (working days applied).
  - EDD 2026-11-15 (request now) → interval < 56 days → rejected `'...at least 8 weeks before expected delivery.'`
  - Worked-days: employee joined < 80 services days before EDD → rejected with `'...worked at least 80 days during the previous 12 months...' service = N days` (use E3 for this variant).
- Rule cap: `isMiscarriage` → `remainingBalance = min(remaining, 28)`; else `min(remaining, 168)`. Feed: ML with `isMiscarriage=true` → total_days never forced above remaining `28`.

**L-APP-12 — PL statutory: birth date, within 30 days, one-time, max 5**
- Feed (E2 male): PL 2026-10-01..2026-10-05, `childBirthDate = 2026-09-20` (within 30d).
  - missing `childBirthDate` → rejected.
  - `endDate > birth + 30` (e.g., PL 2026-11-01) → rejected `'Paternity Leave must be availed within 1 month of the child's birth.'`
  - one-time: apply a second PL for the same child → rejected `'Paternity Leave is a one-time entitlement...'`
  - cap: `remainingBalance = min(remaining, 5)` — with annual_limit 5, request 7 working days (e.g., 2026-10-12..2026-10-20, birth +30 = 2026-10-20) → `days_from_primary = 5`, `days_from_lop = calendar − 5`.

**L-APP-13 — LWP bypasses primary balance, monthly cap enforced**
- Rule: `daysFromPrimary=0, daysFromLwp=calendarDays`; then `getMonthlyUsedDays(…, 'LWP')` vs `lwpPolicy.annual_limit`.
- Feed (E1): LWP 2026-09-28..2026-09-30 (3 calendar days) → created with `days_from_lwp = 3`, `days_from_primary = 0`, `days_from_lop = 0`.
- Feed: prior LWP already used 364 days this month, request 2 → rejected `'...You can only take 1 LWP day(s) this month (1 day(s) would exceed the monthly cap).'`

**L-APP-14 — LOP overflow (primary + LOP split)**
- Rule: `workingDaysCount > remainingBalance` → `daysFromPrimary = remainingBalance`, `daysFromLop = calendarDaysCount - daysFromPrimary`.
- Feed: **BL** (remaining `0` from L-ACC-09): E1 BL 2026-09-28..2026-09-30 (3 working days).
- Expected: `days_from_primary = 0.00`, `days_from_lop = 3.00`, `total_days = 3.00`. Record created **pending**.
- Control imbalance for a loaded type: give E1 SL remaining 3 (used 4 of 7.5) then SL 2026-09-28..2026-09-30 (3wd) → `days_from_primary = 3, days_from_lop = 0`; then request 5-days with 3 remaining → `primary 3, lop 2` (as in source doc example).

**L-APP-15 — Overlapping requests rejected**
- Rule: overlaps within same/other active request; half-day FN/AN handled separately.
- Feed: E1 SL 2026-09-28..2026-09-29 approved, then CL 2026-09-29..2026-09-30 → rejected `'You have an overlapping leave request during this period.'`
- Feed: same-date half-day CL `FN` on 2026-09-28 after approved `FN` SL → rejected; `AN` session → created (no overlap).

**L-APP-16 — Document_required / document_required_after_days**
- Rule (non-ML): `totalDays >= reqAfter && !document` → rejected.
- Feed: BL policy `document_required = true, document_required_after_days = 2`; E1 BL 3 days no doc → rejected `'A supporting document is required for leave requests of 2 days or more.'`
- Control: BL 1 day no doc → created; BL 3 days with doc → created.
- Size rule: document `base64Data` rendering to > 2 MB → rejected `'Uploaded document must be less than or equal to 2 MB.'`

**L-APP-17 — Zero-day request (Weekend/holiday only) rejected**
- Rule: `calculateLeaveDays(...) === 0` → rejected `'Requested leave period contains only holidays or weekends...'`
- Feed: E1 CL **2026-12-25** (Friday, Christmas holiday) → rejected. (ML/LWP on same date → counted, see L-CAL-01.)

**L-CAL-01 — Calendar vs working-day counting**
- Rule: `ML`/`LWP` → count every day; others exclude Sat/Sun + holidays.
- Feed (E1): EL **2026-08-17..2026-08-21** (Mon–Fri, no holiday) → `total_days = 5`, calendar = 5.
- Feed: EL **2026-12-21..2026-12-28** (Mon–Mon) — working days = Mon 21, Tue 22, Wed 23, Thu 24, Mon 28 (Fri 25 = Christmas holiday, Sat 26 + Sun 27 = weekend) → `total_days = 5`, calendar = 8.
- Same **2026-12-21..2026-12-28** window as **LWP** (mapped to all): `days_from_lwp = 8`. Same window as **ML**: calendar days `8`.
- Also asserted in **L-APP-13** (LWP uses calendar days).

---

### 5.4 Approval Flow

**L-APPROVE-01 — Only direct manager can approve/reject**
- Rule: `targetEmployment.reporting_manager_cuid !== approver.cuid` → `'Unauthorized: You can only approve/reject requests from your direct reports.'`
- Feed: E1 request approved by self / by non-manager M1-substitute → rejected.

**L-APPROVE-02 — Re-validation on approval (gender / service / balance)**
- Feed: create a pending BL request for E1 (0 balance, LOP-only) then approve → must **fail** on balance re-check `'Insufficient leave balance. Available: 0'` **only when `days_from_primary > 0`**. For pure LOP request (`days_from_primary = 0`) approval should succeed.
- Feed: pending EL for E2 (min-service ok at apply) — mutate E2 `date_of_joining` to 2026-09-01 after apply, then approve → rejected `'Employee does not meet the minimum service days...'`. Restore E2 DOJ after.

**L-APPROVE-03 — Approval deducts balance + writes attendance**
- Feed: E1 EL 2026-09-28..2026-09-29 (2 wd) approve as M1.
- Expected:
  - EL 2026 balance: `used_days += 2`, `remaining_days -= 2`.
  - `attendance_records` rows for 2026-09-28, 09-29 with `status = 'Leave'`, remark `'Approved Leave: Earned Leave'`. No rows for weekend/holiday inside window.
  - Notification `leaveApproved` emitted.

**L-APPROVE-04 — Split LOP request writes LOP attendance**
- Feed: approve E1's BL 3-day request (pure LOP, L-APP-14).
- Expected: 3 attendance rows `status = 'LOP'`, remark `'Approved Leave: Bereavement Leave (incl. 3 LOP days)'`; no balance movement (days_from_primary = 0).
- Feed variant: one request with daysFromPrimary 3 / daysFromLop 2 → first 3 dates `Leave`, last 2 `LOP`, remark `(incl. 2 LOP days)`.

**L-APPROVE-05 — Attendance conflict blocks approval**
- Rule: existing record `Present | Holiday | WFH` → `ValidationError ... already exists with status 'Present'`.
- Feed: E1 has a `Present` record on 2026-09-29; approve EL overlapping that date → rejected. (Existing `Leave`/`Half Day` records are overwritten/updated.)

**L-APPROVE-06 — LWP attendance uses calendar days**
- Feed: approve E1 LWP 2026-12-21..2026-12-28 (L-CAL-01 window incl. weekend + holiday).
- Expected: attendance rows for **8** dates, all `status = 'LOP'` (leaveType is LWP; code path `'LOP'`), remark LWP.

---

### 5.5 LOP/LWP Usage Counting (Payroll Cut-off)

**L-COUNT-01 — LOP counted against payroll cut-off cycle**
- Rule: LOP cycle = `[prev month 26 … this month 25]` (cutoff 25); LWP = calendar month.
- Feed: `payroll_cut_off_date = 25`, so **Sep 2026 LOP cycle = 2026-08-26..2026-09-25**, **Oct 2026 cycle = 2026-09-26..2026-10-25**.
- Feed: LOP-only approved request **2026-09-24..2026-09-28** (calendar days, LOP counts all) → `getMonthlyUsedDays(Sep,'LOP') = 2` (24, 25), `getMonthlyUsedDays(Oct,'LOP') = 3` (26, 27, 28).
- Boundary: a request spanning a cycle boundary splits — 3 days before cutoff land in the old month's cycle, days from the 26th in the new month's cycle.

**L-COUNT-02 — LWP counted per calendar month**
- Rule: `belongsToPeriod = utcD.getUTCMonth() === month && FullYear === year`.
- Feed: LWP approved over 2026-09-30..2026-10-02 → Sep shows `+1` (30th), Oct shows `+2` (1st, 2nd).

**L-COUNT-03 — Split requests: primary first, then LWP, then LOP**
- Feed: request `days_from_primary=3, days_from_lwp=2, days_from_lop=1` over working dates → first 3 dates primary, next 2 LWP, last 1 LOP; per-cycle counters attribute each day to correct bucket.

---

### 5.6 Dashboards & UI

**L-DASH-01 — Employee dashboard balance counter counts only CL/SL/EL**
- Rule: filter `['CL','SL','EL']` (`employee/+page.server.ts`).
- Feed: E1 with balances — CL 9, SL 7.5, EL 18, ML 180, BL 0 (all remaining).
- Expected: `leaveBalanceCount = 9 + 7.5 + 18 = 34.5`. ML and BL excluded from the count. **The count ignores ML’s 180 and BL entirely.**

**L-DASH-02 — Manager dashboard same filter (CL/SL/EL only)**
- Feed: M1 view of E1; expected total balance counter excludes ML/BL.

**L-DASH-03 — Leave card styling membership**
- Rule: `leaves/+page.svelte` custom styling for `EL, CL, SL, ML, PL`.
- Feed: render leave cards for a user with CL/SL/EL/ML/PL/BL balances.
- Expected: CL/SL/EL/ML/PL cards use their styled variant; **BL falls back to default/neutral styling**.

**L-DASH-04 — LOP/LWP excluded from joined balances**
- Rule: `filteredBalances` removes codes `LOP`/`LWP`; they surface via `lopUsed`/`lwpUsed` fields only.
- Expected: leave details payload `balances` excludes LOP/LWP; `lopUsed`/`lwpUsed` present and correct.

---

## 6. Data-Feed Payload Examples (API)

Request bodies use the real input shape `ApplyLeaveInput`.

```json
// CL half-day (E1)
{
  "leaveTypeCuid": "<CL-cuid>",
  "startDate": "2026-09-28",
  "endDate": "2026-09-28",
  "isHalfDay": true,
  "halfDaySession": "FN",
  "reason": "personal work"
}

// EL 2-day (E1) — expect days_from_primary = 2, no LOP
{
  "leaveTypeCuid": "<EL-cuid>",
  "startDate": "2026-09-28",
  "endDate": "2026-09-29",
  "isHalfDay": false,
  "reason": "planned leave"
}

// BL 3-day (E1) — custom type with 0 balance → days_from_primary 0, days_from_lop 3
{
  "leaveTypeCuid": "<BL-cuid>",
  "startDate": "2026-09-28",
  "endDate": "2026-09-30",
  "isHalfDay": false,
  "reason": "bereavement"
}

// ML (E1) female, acceptable window
{
  "leaveTypeCuid": "<ML-cuid>",
  "startDate": "2026-11-02",
  "endDate": "2026-11-30",
  "isHalfDay": false,
  "expectedDeliveryDate": "2027-02-15",
  "reason": "maternity",
  "document": { "fileName": "cert.pdf", "mimeType": "application/pdf", "base64Data": "<base64 <= 2MB>" }
}

// PL (E2) male
{
  "leaveTypeCuid": "<PL-cuid>",
  "startDate": "2026-10-01",
  "endDate": "2026-10-05",
  "isHalfDay": false,
  "childBirthDate": "2026-09-20",
  "reason": "paternity"
}

// LWP (E3 contract, bypasses mapping)
{
  "leaveTypeCuid": "<LWP-cuid>",
  "startDate": "2026-09-28",
  "endDate": "2026-09-30",
  "isHalfDay": false,
  "reason": "unpaid"
}
```

Approval: `POST /api/leaves/approvals/<requestCuid>` body `{ action: 'approve' }` (or reject) as the manager session.

Direct DB balance seeding helper rows (for carry-forward / used-day cases):

```sql
-- EL 2025 baseline for E5 (L-CF-01). cuid() is client-generated in Prisma — supply an app-generated cuid value here.
INSERT INTO leave_balances (cuid, employee_cuid, leave_type_cuid, year, allocated_days, used_days, remaining_days, carried_forward_days, created_by)
VALUES ('test-el-2025-0001', '<E5-cuid>', '<EL-cuid>', 2025, 24, 10, 14, 0, 'test');
```

---

## 7. Traceability Matrix

| Case | Code anchor | Doc behaviour | Expected |
|---|---|---|---|
| L-ACC-01/02 | `accrueLeaves` CL/SL branch | monthly accrual | alloc = accrued |
| L-ACC-09 | `accrueLeaves` no-else | custom → 0 | alloc 0 / rem 0 |
| L-CF-01 | EL carry-forward block | caps honoured | cf ≤ 24, annual ≤ 6 |
| L-CF-02 | `type.code === 'EL'` guard | custom ignored | cf 0 |
| L-APP-06..10 | `_applyLeaveCore` CL/EL rules | hardcoded limits | rejected msgs |
| L-APP-11/12 | ML/PL statutory blocks | hardcoded statutory rules | rejected/accepted |
| L-APP-13 | LWP bypass + cap | LWP monthly cap | split correct |
| L-APP-14 | overflow split | automatic LOP | primary + LOP |
| L-CAL-01 | `calculateLeaveDays` | ML/LWP calendar | els working |
| L-COUNT-01..03 | `getMonthlyUsedDays` | cutoff cycle | per-bucket |
| L-DASH-01/02 | dashboard filters | CL/SL/EL only | count excludes others |
| L-DASH-03 | card styling | 5 codes styled | BL default |

---

## 8. Execution Notes & Exit Criteria

1. Reset the affected employee's balances/requests between cases sharing an employee (fastest: re-seed the 4.2/4.3 fixtures per suite).
2. **Exit criteria — regression:** zero case deviations from the "Expected" column.
3. **Exit criteria — improvement triage:** if the team intends to fix the documented divergences (custom → 0, EL-only carry-forward, CL/SL/EL dashboard filter), re-baseline L-ACC-09, L-CF-02, L-DASH-01/02/03 as **positive** cases after the code change, and re-run the rest to prove no unintended drift.
4. Record deviations with: case id, feed used, actual vs expected, DB rows for balance/attendance, error message body.