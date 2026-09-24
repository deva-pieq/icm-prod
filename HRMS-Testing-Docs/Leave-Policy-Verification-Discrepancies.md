# Leave Policy vs Actual Testing — Discrepancy Report

- **Prepared for:** business / HR stakeholders (non-technical)
- **Reference documents:** `Leave Policy vs Hardcoded Leave Rules.md`, `leave-seeding-proof.md`, `HANDOFF-RESUME.md`, `findings-v2-mtac.md`
- **Environment tested:** preprod HRMS (`https://people.pieq.ai/`), tested 2026-09-22
- **Bottom line:** the most important claims were verified and are real, but **not everything in the policy document was actually tested**. Below is what was confirmed, what still needs testing, and where live behaviour differs from what the document describes.

---

## 1. What the testing confirmed (these findings are real)

- **Custom leave types silently become unpaid leave.** A "Birthday Leave" type was created with a policy allowing 10 days/year, but employees were given **0 days** and every request was silently converted to **Loss of Pay (an unpaid day)**, even though the system accepted the request as successful. Employees see the leave as "applied", but it is unpaid.
- **Creating a new leave type and attaching a policy works for setup only** — the configuration is saved, but the balance engine does not honour it. So a manager setting this up would not see a problem until employees' payslips show deductions.
- **Hardcoded limits are enforced:**
  - Casual Leave (CL): maximum 2 days per single request.
  - Earned Leave (EL): maximum 24 days per single request.
  - Casual Leave cannot be taken for future months or span month boundaries.
  - Casual Leave cannot be taken back-to-back with Earned or Sick Leave.
- **Gender rules work:** Maternity Leave is blocked for male employees; Paternity Leave works for male employees.
- **Half-day rule works:** leave types set as "no half-day" correctly reject half-day requests.
- **Day counting works as documented:** LWP counts calendar days (weekends/holidays included); all other types count working days only.
- **Automatic LOP overflow works:** if an employee requests more days than their balance, the excess days are automatically made unpaid without warning.
- **The `max_per_month` setting is ignored by the system.** A policy set to allow max 2 days/month, but 3 casual leave days were applied in the same month across two requests and both were accepted. This is stored in the system but never enforced.

---

## 2. Claims in the policy document that were NEVER tested (gaps — not disproven, just unverified)

- **Maternity Leave statutory rules not exercised.** The pregnancy-related checks (80 days worked in the preceding 12 months, 8-week advance notice, medical certificate, miscarriage 28 vs 168 day limits) were never actually run with a passing female employee — only the male-rejection rule was confirmed.
- **Paternity Leave boundary rules not exercised.** The 30-day window after the child's birth, the one-time entitlement, and the 5-day maximum per request were not tested at their limits.
- **Sick Leave (SL) future-month rule not directly tested.** The same rule was proven for Casual Leave, and the code applies it to both, but Sick Leave itself was not confirmed live.
- **Sick Leave ↔ Casual Leave contiguity rule tested in only one direction.** The no-back-to-back rule was proven for Casual Leave followed by Earned Leave; the Sick Leave direction was not.
- **Carry-forward not verified.** The company configured carry-forward (up to 24 days, 6/year rollover), but the actual year-end rollover behaviour was never exercised — so whether custom leave types truly ignore carry-forward is based on code reading, not a live test.
- **Minimum service days policy not verified.** All test policies used 0 days of required service, so the "you have not worked here long enough" block was never actually triggered.
- **Document requirement not verified.** The policy that requires a medical certificate/document was set up but the system was never tested to confirm it actually blocks an application without the document.
- **Dashboard figures not verified.** The claim that employee and manager dashboards only count CL/SL/EL balances was reviewed in code but never confirmed against the live screen. If true, a new paid leave type would be missing from the total shown to staff and managers.
- **Leave-card display not verified.** The claim that new leave types get plain/default styling instead of the special cards was not checked on the live UI.
- **Monthly accrual not boundary-tested.** The system allocates 1 day of CL for 1 month of service (consistent with "annual limit ÷ 12"), but the test did not prove the accrual over a full 12 months.
- **Maternity Leave calendar-day counting not verified.** Calendar-day counting was proved for LWP only; Maternity Leave itself was not tested.
- **Casual Leave month-spanning rule only observed indirectly.** The request that crossed a month boundary was rejected because of the "future months" rule, so the specific "must not span two months" rule was not isolated and proven on its own.

---

## 3. Deviations found during testing (live system differs from what the documents describe)

- **The live system is stricter than the code review suggested.** The "no back-to-back leave" rule was applied even in a case where the local code would have allowed the request — live behaviour is stricter than the copy of the source code being reviewed.
- **Balances do not move while a request is pending.** If an employee applies for leave that would push them into unpaid days (LOP), the balance screen still shows the full balance and zero LOP used until a manager approves the request. HR looking at the screen could wrongly believe no LOP is accumulating.
- **Disabled leave types still appear.** A leave type that was turned off (inactive) still shows in the available list, which contradicts what the source code intends (to hide inactive types). This can confuse employees who see a leave type they cannot actually use.
- **Leaving the leave-type field blank on an application causes a technical error (500) instead of a clean "please select a leave type" message.** Not a policy mismatch, but it means the system can crash softly on bad input.
- **Custom leave type approved with 0 balance creates an unpaid (LOP) attendance/record row.** This follows from the confirmed defect above, but it also means once approved, the unpaid day is recorded as fact on the employee's attendance history.

---

## 4. What this means for the business

- **The core risk is real and live:** any new leave type configured via the admin screens today will not pay employees — requests succeed but become unpaid days silently. HR must manually top up balances for every new type until the code is fixed.
- **The system is not "policy-driven":** several settings that HR can configure (annual limit, carry-forward, max per month) are ignored or overridden by hardcoded rules. Configured limits can give a false sense of control.
- **Some serious statutory rules (maternity, paternity limits) are unproven** — they should be validated by a follow-up test before relying on them for real maternity/paternity cases.
- **A full compliance pass is still needed** for the untested items in section 2 before the leave module can be considered safe to operate in production.

---

## 5. Recommended next steps

1. Fix the confirmed defect: custom leave types must receive the configured balance, otherwise all new leave types are effectively unpaid leave.
2. Run a focused follow-up test on the untested items (section 2), especially Maternity/Paternity statutory rules, carry-forward at year end, minimum-service days, and the document-required block.
3. Decide whether `max_per_month` must be enforced and raise it as a requirements gap if so.
4. Verify dashboard totals on the live UI to confirm whether new leave types are missing from the displayed balance.
5. Re-confirm against the deployed system (which is stricter than the code being reviewed) and treat the source code as a hint only until versions match.