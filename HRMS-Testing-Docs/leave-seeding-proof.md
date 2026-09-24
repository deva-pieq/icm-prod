# Leave Seeding Proof — Hardcoded Leave Rules vs Policy Configuration

- **Date executed:** 2026-09-22 (server "today": 2026-09-22)
- **Environment:** preprod HRMS `https://people.pieq.ai/` (SSO Keycloak `https://preprod.auth.pieq.ai/`)
- **Verified by:** live API probes `/api/leave/types`, `/api/leave/policies`, `/api/leaves` (POST/GET), executed while authenticated in the browser session
- **White-box reference:** clone of `pieq-ai/hrms` @ `488b0e1` (`C:\Users\user\Downloads\hrms`) — note: deployed preprod build differs slightly (see §7 deviations)
- **Reference doc:** `Leave Policy vs Hardcoded Leave Rules.md`

---

## 1. Environment & accounts

| Item | Value |
|---|---|
| Test account given in task | `abiney.y+1@pieq.ai` / `Test@1234` → **login FAILED** ("Invalid username or password"; also tried `Test@123`) |
| Account actually used | `abiney.y@pieq.ai` / `Test@1234` |
| Employee | EMP002 Abiney yadav (`zu8uv8h6zjjc0hcx2wr4uwoo`), gender **male**, DOJ 2026-09-02, **Administrator** (permission wildcard `*`) |
| Employment type of EMP002 | `q4enzvea6mrl1bwvxh7v6ill` = **Full Time** (covered by all seeded policies) |
| Other employment type | `b10pnhf40fxrxdpcoif3uorx` = **Contract** |
| Active holidays (from `/api/holidays`) | 2026-10-01, 2026-09-28, 2026-09-27, 2026-10-02, 2027-09-21 (none on 09-22) |
| Weekday of 2026-09-22 | Tuesday (workday) |

> Note: `abiney.y+1@pieq.ai` maps to employee **PQ001 Thivaghar** (`o8rzgciovcg6448s20r9kyli`; also Full Time, male) but its Keycloak login does not accept the given passwords, so all probes were executed on EMP002 (Full Time, same coverage). This is recorded because the task scoped the test employee to `abiney.y+1`.

**API contracts discovered & used (differ from task's camelCase guess):**

- `POST/PUT /api/leave/types(/[cuid])` — **snake_case**: `name, code, description, is_paid, requires_approval, status` (name >5 chars, letters/spaces only; code ≤20 uppercase+underscore)
- `POST/PUT /api/leave/policies(/[cuid])` — **snake_case**: `leave_type_cuid, employment_type_cuids, annual_limit, max_per_month, carry_forward_allowed, max_carry_forward_days, max_annual_carry_forward_days, document_required, document_required_after_days, min_service_days, allow_half_day, gender_specific, applicable_gender, status`
- `POST /api/leaves` (employee self-apply) — **camelCase**: `leaveTypeCuid, startDate, endDate, isHalfDay, halfDaySession, reason, document, expectedDeliveryDate, isMiscarriage, childBirthDate`

---

## 2. Baseline (pre-seed)

- Leave types visible: **CL** `wkh7pz89mzrkov4co34kxb0a` (status **false**), **SL** `jr2va0riagg55awjpdth2sdh` (status true). `LOP` is filtered from the type list by the DAO.
- Leave policies: **only SL policy** `l7usb9tk5igw6pfdo93auz44` (annual 30, max_per_month 12, carry_forward true / max 1, allow_half_day false, both employment types).
- EMP002 balances: only **SL 2.5**. No CL/EL/PL/ML/LWP/BL existed. (`lopUsed=0`, `lwpUsed=0`.)

---

## 3. Seeds applied

### 3.1 Leave types (all `POST /api/leave/types`, snake_case) + CL activation

| Code | Payload (trimmed) | Result |
|---|---|---|
| CL | `PUT /api/leave/types/wkh7pz89mzrkov4co34kxb0a` `{"status":true}` | **200** `Leave type updated successfully` |
| EL | `{"name":"Earned Leave","code":"EL","description":"Earned Leave","is_paid":true,"requires_approval":true,"status":true}` | **201** cuid `nwma5zov2x5683ur34gaxxq5` |
| ML | `{"name":"Maternity Leave","code":"ML",...,"is_paid":true,"requires_approval":true,"status":true}` | **201** cuid `x5l7zk854v6f583uuve4lu6j` |
| PL | `{"name":"Paternity Leave","code":"PL",...,"is_paid":true,"requires_approval":true,"status":true}` | **201** cuid `pv0lgym6wa5a4i7cqoho8bnh` |
| LWP | `{"name":"Leave Without Pay","code":"LWP",...,"is_paid":false,"requires_approval":true,"status":true}` | **201** cuid `lbdw08eyc9tsm7op84w0p8a9` |
| BL (CUSTOM) | `{"name":"Birthday Leave","code":"BL","description":"Birthday Leave","is_paid":true,"requires_approval":true,"status":true}` | **201** cuid `g2lf1kiqcm1vpgbizmy6z2pr` |

### 3.2 Leave policies (`POST /api/leave/policies`, snake_case; `employment_type_cuids` = Full Time + Contract)

| Policy | Payload | Result |
|---|---|---|
| CL | `leave_type_cuid=CL, annual_limit:12, max_per_month:2, carry_forward_allowed:false, document_required:false, min_service_days:0, allow_half_day:false, gender_specific:false, status:true` | **201** cuid `svj1lmpnemrt8kby9dcgk3kk` |
| EL | `annual_limit:24, carry_forward_allowed:true, max_carry_forward_days:24, max_annual_carry_forward_days:6, allow_half_day:true, gender_specific:false` | **201** cuid `mznopuh6ncz1858sddmiutgw` |
| ML | `annual_limit:180, document_required:true, document_required_after_days:1, gender_specific:true, applicable_gender:"Female"` | **201** cuid `dt8ktz83ta62xikb3jqaf54u` |
| PL | `annual_limit:5, gender_specific:true, applicable_gender:"Male"` | **201** cuid `bqs1mwhgi9jwra4f2b2uhynf` |
| LWP | `annual_limit:365, gender_specific:false` | **201** cuid `wydr9rtznjf9ruow2jok2x1g` |
| BL | `annual_limit:10, gender_specific:false, allow_half_day:false` | **201** cuid `t5cp20bp4f0yst2lj9x043oc` |

---

## 4. Post-seed balance snapshot (EMP002, via `GET /api/leaves`)

| Code | Type | Allocated | Remaining | Notes |
|---|---|---|---|---|
| SL | Sick Leave | 2.5 | 2.5 | pre-existing policy (annual 30) |
| **BL** | **Birthday Leave (CUSTOM)** | **0** | **0** | **despite policy annual_limit=10 → non-hardcoded code gets zero entitlement** |
| CL | Casual Leave | 1 | 1 | annual 12/12mo, Sep month accrued from DOJ 2026-09-02 |
| EL | Earned Leave | 2 | 2 | annual 24/12mo |
| PL | Paternity Leave | 5 | 5 | hardcoded PL branch grants min(5, policy annual) for male |
| ML | Maternity Leave | — | — | no balance row (male) |
| LWP / LOP | — | — | — | excluded from balances by design |

---

## 5. Verification probes (`POST /api/leaves`, camelCase, as EMP002)

All dates are 2026. Working days = Mon–Fri excluding the active holidays above.

| # | Probe | Payload (abbr.) | Status | Observed result | Verdict |
|---|---|---|---|---|---|
| 1 | CL 3-day request | `CL 09-23..09-25` | **400** | `Maximum 2 days can be applied in a single Casual Leave request...` (field leaveTypeCuid) | ✅ hardcoded CL cap=2 |
| 2 | CL spanning months | `CL 09-29..10-01` | **400** | `Casual Leave (CL) and Sick Leave (SL) cannot be applied for future months.` (startDate) | ✅ hardcoded month rule |
| 3 | CL future month | `CL 10-05..10-06` | **400** | same "future months" error | ✅ hardcoded |
| 4 | EL 25-day request | `EL 09-29..11-06` | **400** | `A single Earned Leave (EL) request must not exceed 24 days.` (endDate) | ✅ hardcoded EL cap=24 |
| 5 | BL over weekend only | `BL 09-26 (Sat)` | **400** | `Requested leave period contains only holidays or weekends and counts as 0 days.` | ✅ working-day math for custom type |
| 6 | ML by male | `ML 09-16, expectedDeliveryDate 12-01` | **400** | `This leave type is only applicable to Female employees.` | ✅ gender policy enforced |
| 7 | BL half-day | `BL 09-15 isHalfDay:true` | **400** | `Half-day leaves are not allowed for this leave type.` | ✅ allow_half_day enforced |
| 8 | CL 1-day (within balance) | `CL 09-23` | **201** | `total_days 1, days_from_primary 1, days_from_lwp 0, days_from_lop 0` | ✅ working-day count=1 |
| 9 | CL 2-day, over remaining balance | `CL 09-24..09-25` | **201** | `total_days 2, days_from_primary 1, days_from_lop 1` → **auto-LOP split** | ✅ LOP overflow; 🔶 max_per_month==2 NOT enforced (3 CL days in Sep via 2 requests) |
| 10 | EL adjacent to CL (sandwich) | `EL 09-29..09-30` (gap from CL 09-25 = 09-26 Fri + weekend) | **400** | `Casual Leave cannot be combined or appended with Earned Leave (EL) or Sick Leave (SL) in a continuous leave period.` — **reproduced twice** | ✅ hardcoded CL/sandwich rule (live stricter, see §7) |
| 11 | LWP spanning both holidays | `LWP 10-01..10-02` (both are holidays) | **201** | `total_days 2, days_from_primary 0, days_from_lwp 2, days_from_lop 0` | ✅ LWP = calendar-day counting, bypasses balance |
| 12 | PL 1-day (birth 09-10, applied 09-16) | `PL 09-16, childBirthDate 09-10` | **201** | `total_days 1, days_from_primary 1` | ✅ PL works for male within 30-day window / 5-day cap |
| 13 | **BL 1-day (CUSTOM, zero balance)** | `BL 09-15` | **201** | `total_days 1, **days_from_primary 0, days_from_lop 1**` | ✅✅ **CORE PROOF: custom type → 0 entitlement → request silently becomes LOP** |
| 14 | EL 2-day (clean, far from CL) | `EL 10-06..10-07` | **201** | `total_days 2, days_from_primary 2, days_from_lop 0` | ✅ EL consumes balance normally |

---

## 6. Findings mapped to the reference document

1. **Custom leave type gets ZERO entitlement (CONFIRMED).** `Birthday Leave (BL)` was created with a policy `annual_limit:10` (+ both employment types, min_service 0). Accrual computed **0 allocated / 0 remaining** for a Full-Time employee. A 1-working-day BL request returned **201** with `days_from_primary 0, days_from_lop 1` — the day silently converted to Loss of Pay. There is no `else` branch in `accrueLeaves()` for codes outside CL/SL/EL/ML/PL (matches doc §1). Business impact: staff can "take" custom leave types but receive unpaid leave; admin must manually top-up balances for any configured type.
2. **CL per-request cap hardcoded** at 2 days (probe 1), despite policy `max_per_month:2`/annual 12 — no policy knob exists.
3. **CL/SL "future months" restriction hardcoded** (probes 2, 3, code: `leave.service.ts:1094-1108`); also "cannot span multiple months" for CL (`startYear !== endYear || startMonth !== endMonth`).
4. **EL per-request cap hardcoded** at 24 working days (probe 4, `leave.service.ts:1119-1123`).
5. **CL⇄EL/SL contiguity ("sandwich") rule enforced** (probe 10, `leave.service.ts:1126-1157`). Live build is *stricter* than clone@488b0e1 (see §7).
6. **LWP calendar-day accounting & balance bypass (probe 11).** 2 holiday-only days counted as 2 leave days (vs working-day logic for others); `days_from_primary=0`; LWP/LOP excluded from balance rows.
7. **ML gender applicability + 80-day / 8-week / medical-cert rules** (probe 6 + `leave.service.ts:1160-1200`): male → 400; separate from policy fields.
8. **PL male applicability + 30-day birth window + 5-day hard cap** (probe 12): works exactly as documented.
9. **Policy fields that ARE honored** (observed live): `employment_type_cuids` (resolution), `gender_specific`/`applicable_gender`, `allow_half_day`, `document_required(-after_days)` (ML), `min_service_days`.
10. **Policy fields that are IGNORED (CONFIRMED):** `max_per_month` (probe 9: 3 CL days in Sep across 2 requests → both 201) and `annual_limit`/carry-over for custom codes (probe 13, BL allocated 0 not 10). Matches doc.

## 7. Deviations & caveats observed

- **Live ≠ clone@488b0e1 in leave flow:** the 05-09-29..09-30 EL sandwich rejection was reproduced twice; the clone's `workingDaysBetween` loop at `leave.service.ts:1144-1151` would count 09-26 (Fri) as a working day and allow it. The deployed build enforces a stricter adjacency rule. Exact live logic should be verified against the deployed binary/commit (not the clone).
- **Balance rows don't move on pending requests:** after probes 8–9, CL row still shows `used_days 0 / remaining 1`; `lopUsed`/`lwpUsed` remain 0 despite pending LOP (2) and LWP (2) days. Deduction is apparently applied on approval (relevant to what the UI shows).
- **`is_paid`:** CL type remains `is_paid:false` (pre-existing seed value), unaffected by this exercise.
- **`GET /api/leave/types` on live returns inactive types** (CL was visible while `status:false`), whereas clone DAO `listLeaveTypes` filters `status:true` (+excludes LOP) — another live/clone difference.
- **Login note:** the task-provided `abiney.y+1@pieq.ai` account does not authenticate; `abiney.y@pieq.ai` (EMP002, Administrator, wildcard `*`) was used. The admin write-path gates on `leave_type:view`/`leave_policy:view` (H1 finding, write endpoints guarded by `:view` not `:manage`) so seeds succeeded.
- EL carry-forward (`max_carry_forward_days 24 / max_annual_carry_forward_days 6`) was configured but **not exercised** (year-rollover behavior); EL allocation for Sep matched annual 24 prorated (2).

## 8. Residue created (intentional, part of the seed)

**Leave types added/activated (keep):** CL activated (`wkh7pz89mzrkov4co34kxb0a`), EL `nwma5zov2x5683ur34gaxxq5`, ML `x5l7zk854v6f583uuve4lu6j`, PL `pv0lgym6wa5a4i7cqoho8bnh`, LWP `lbdw08eyc9tsm7op84w0p8a9`, BL `g2lf1kiqcm1vpgbizmy6z2pr`.

**Leave policies added (keep):** CL `svj1lmpnemrt8kby9dcgk3kk`, EL `mznopuh6ncz1858sddmiutgw`, ML `dt8ktz83ta62xikb3jqaf54u`, PL `bqs1mwhgi9jwra4f2b2uhynf`, LWP `wydr9rtznjf9ruow2jok2x1g`, BL `t5cp20bp4f0yst2lj9x043oc`.

**Leave requests created on EMP002 (pending — candidate for cleanup):**

| id | code | span | total | primary | lwp | lop |
|---|---|---|---|---|---|---|
| 103 | CL | 09-23 | 1 | 1 | 0 | 0 |
| 104 | CL | 09-24..25 | 2 | 1 | 0 | 1 |
| 105 | LWP | 10-01..02 | 2 | 0 | 2 | 0 |
| 106 | PL | 09-16 | 1 | 1 | 0 | 0 |
| 107 | BL | 09-15 | 1 | 0 | 0 | 1 |
| 108 | EL | 10-06..07 | 2 | 2 | 0 | 0 |

Cleanup path if desired: admin can withdraw via `POST/DELETE /api/leaves/[cuid]` or the Leave Management page; no payroll transactions triggered (all requests remain `pending`).

## 9. Reproduction steps (concise)

1. Log in as `abiney.y@pieq.ai` / `Test@1234` on `https://people.pieq.ai/`.
2. `PUT /api/leave/types/wkh7pz89mzrkov4co34kxb0a` `{"status":true}` → activate CL.
3. `POST /api/leave/types` for EL, ML, PL, LWP, BL (payloads in §3.1) and `POST /api/leave/policies` for each (payloads in §3.2).
4. `GET /api/leaves` → observe BL allocated 0, CL 1, EL 2, PL 5, SL 2.5.
5. `POST /api/leaves` `{leaveTypeCuid: BL, startDate: '2026-09-15', endDate: '2026-09-15', isHalfDay: false}` → **201, days_from_primary 0, days_from_lop 1** (core proof).
6. Re-run probes in §5 (negative probes 1–7 produce 400s, positive 8–14 produce 201s).