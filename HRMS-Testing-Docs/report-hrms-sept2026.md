# PieQ HRMS — QA Test Report (September 2026)

- **Report date:** 2026-09-22
- **Application tested:** PieQ HRMS — preprod environment `https://people.pieq.ai/`
- **Testing window:** 2026-09-21 to 2026-09-22
- **Method:** White-box code review + exploratory UI testing + live API verification (two employee/test accounts, admin account). 24-page UI sweep, live leave/attendance/payroll journeys, and adversarial negative testing.
- **Prepared for:** Business stakeholders, HR, and development team
- **Prepared from:** Consolidated findings in the existing test reports (`exploratory-findings-report.md`, `findings-v2-mtac.md`, `ui-exploratory-report.md`, `Payroll-Upload-Payslip-Verification-Findings.md`, `Leave-Policy-Verification-Discrepancies.md`, `leave-seeding-proof.md`)

---

## Sign-off summary

| Area | Readiness |
|---|---|
| Authentication & login (SSO) | ✅ Strong — verified working |
| Employee data & profile | ✅ Strong — verified working |
| Attendance (check-in / check-out) | 🟡 Good core flow, has an access-control defect + UX gaps |
| Leave management | 🟡 Core lifecycle works, but **policy-driven configuration does not control leave** |
| Payroll / payslips | 🟡 Upload + payslip generation works, **config settings do not feed payslips**, figures don't always add up |
| Dashboard & admin reporting | 🔴 **Not reliable** — key figures are wrong or self-contradictory |
| Access control / roles & permissions | 🔴 **Not safe to trust** — write access is granted by view-only permission |
| Audit history | ❌ Effectively empty after a session of activity |
| Overall readiness for production | 🔴 **NOT READY — fixes required before production rollout** |

---

## 1. Executive summary (read this first)

The HRMS is in **good structural shape** — it is stable (24 pages load clean with zero console errors), the biggest user journeys work end-to-end, and it is protected by login and CSRF. The app is **not yet ready for production** because of four cross-cutting problems, three of which touch money, data trust, and compliance:

### 1.1 — The permission system does not separate "view" from "edit"
Anyone given a **view-only** permission (e.g. "can see the holiday calendar") is **also able to create, edit, and delete** that same data. Worse, it was proven live that a user who can only *view* attendance records can **create a fake "Present" attendance record for another employee**. Today the "read-only" roles that HR believes it is assigning do not exist — every view role is secretly an edit role. This is a security and data-integrity risk, and it must be treated as a blocker for any rollout that relies on role-based access.

### 1.2 — Leave configuration does not control leave
An HR admin can create a leave type (e.g. "Birthday Leave") and set a policy of 10 days a year — but employees are given **0 days**, and their leave requests are **silently accepted as unpaid leave (loss of pay)**. There is no error, no warning. Staff genuinely believe they are on paid leave while their payslips later show deductions. Several policies that HR can configure (e.g. "maximum 2 days per month") are **stored but ignored**; the real rules are hard-coded in the software (e.g. Cash leave capped at 2 days, Earned leave at 24 days). This creates a **false sense of control** — HR thinks it is configuring the rules, but the software runs mostly on its own fixed rules.

### 1.3 — The admin dashboard shows figures that don't match its own charts
The headline "Total Payroll (MTD)" showed ₹2,64,195, while the breakdown chart on the same screen summed to ₹3,11,225 — a gap of ~₹47,000 (18%) that a stakeholder reviewing the numbers cannot explain. "New employees this month" counted 5, but only **2 employees actually joined** this month. Reports built on this dashboard will not stand up to a single question from management.

### 1.4 — Payroll setup screens don't feed payroll
HR can configure salary components and structures, but payslips are generated **100% from the uploaded Excel file** — the configuration has no effect on any payslip. Payslip earnings also do not consistently add up (gross ₹86,083 vs visible earning rows ₹86,868), and "Paid Days" always shows 0.

**The good news:** attendance and leave happy paths work live (check-in, check-out, approve, reject, withdraw, notifications, balance debit), payroll upload is production-ready for the standard file format, and the most serious money-path duplicate ("paying twice for the same employee + month") is correctly blocked.

**Next step for leadership:** budget a short fix sprint to address Section 3 (the priority bug list), make two product decisions (Section 6), and run the follow-up verification (Section 7) before any production go-live.

---

## 2. Scope, environment & method

| Item | Detail |
|---|---|
| Application | PieQ HRMS |
| Environment | Preprod (live-like), `https://people.pieq.ai/` |
| SSO | Keycloak OIDC, realm `pieq-hrms`, client `pieq-app` |
| Server date during tests | 2026-09-21 / 2026-09-22 |
| Accounts used | Administrator `abiney.y@pieq.ai` (EMP002, wildcard access), Employee PQ008, Manager/Admin PQ009 |
| Approaches | ① White-box review of the source code (contracted behaviour vs implementation, `file:line` evidence) ② Exploratory UI testing with Playwright — every sidebar module + notifications ③ Live API verification with real accounts ④ Adversarial "hunt, then try to disprove" pass before anything was logged |
| Scope covered | Auth & access, dashboard, departments/designations, employees, profile, attendance, leave, holidays, shifts, salary components/structures, payroll, notifications, roles/permissions, settings |
| Not in scope | Mobile apps, browser compatibility matrix outside Chromium, performance/load testing, penetration testing |

> **Note on confidence:** every finding marked **CONFIRMED LIVE** was reproduced against the real preprod system with a real account. Items marked **CODE-ONLY** come from source-code review and have not yet been triggered live (many need a second non-admin account or a specific data state). A handful of differences were seen between the deployed build and the source code being reviewed — see Section 5 (known limitations) — so code-only findings are treated as strongly-suspected, not proven.

---

## 3. Priority bug list (for the development team)

Grouped by business impact. A single flat, ticket-ready list follows in Section 4.

### 3.1 Blocks — fix before launch or any pay/HR-sensitive rollout

| ID | Severity | Module | Title | What it means for the business | Evidence status |
|---|---|---|---|---|---|
| B-01 | 🔴 Critical | Security / Attendance | **Users with only "view" access can create and edit records — including forging attendance for other employees** | Read-only roles don't exist; the whole permission model can't be trusted as written. An HR staffer with "view attendance" was able to create a fake "Present" (09:00–18:00) record for a colleague. | ✅ CONFIRMED LIVE |
| B-02 | 🔴 Critical | Leave | **New leave types are silently paid as unpaid (loss of pay)** | An admin creates "Birthday Leave" with 10 days/year → employees get 0 days, and requests succeed as unpaid leave. Staff think they're on holiday; their money is silently deducted. Custom leave types should not be offered until the balance engine honours them. | ✅ CONFIRMED LIVE |
| B-03 | 🔴 High | Access control | **Write operations are protected by "view" permission, not "manage"** — the 10 `:manage` permission keys exist but are never used | Any role that can see a module (holidays, leaves, employees, payroll, roles…) can also change it. Configuring roles gives false confidence. | ⛔ CODE + pattern confirmed |
| B-04 | 🔴 High | Payroll / Dashboard | **Employee payout data changed in the database even though the screen said the save failed** | On the employee "Employment" tab, a change was persisted (manager re-wiring took effect, audit row created) even though the API returned an error "Department is required". If a save looks like it failed but actually went through, users can be misled — or worse, retry and create duplication. Must verify live behaviour and fix the mismatch. | ✅ OBSERVED LIVE (root cause open) |

### 3.2 High — correct before relying on the data

| ID | Severity | Module | Title | Business impact | Evidence status |
|---|---|---|---|---|---|
| H-01 | 🔴 High | Dashboard | **Payroll total contradicts its own breakdown chart** (₹2,64,195 vs ₹3,11,225) | A stakeholder reading the dashboard cannot reconcile the headline number with the chart; percentages are wrong. Reporting trust problem. | ✅ CONFIRMED (UI + code root cause) |
| H-02 | 🔴 High | Leave | **Applying for leave with no leave type causes a server error (HTTP 500) instead of "please choose a leave type"** | Outside systems or a careless form can crash the request silently; the user sees nothing useful. Wrong HTTP status also confuses API integrations. | ✅ CONFIRMED LIVE |
| H-03 | 🟠 High | Dashboard | **"New employees this month" counts employees created in the system, not employees who joined (5 shown vs 2 actual joiners)** | Executive "headcount this month" metric is wrong. | ✅ CONFIRMED |
| H-04 | 🟠 High | Attendance | **Watch widget offers "Check Out" when the user never checked in — clicking it fails with zero feedback** | Staff see the wrong action; the failure is silent. With LOP/no-check-in records the card shows "Check Out" instead of "Check In". | ✅ CONFIRMED (UI + API) |
| H-05 | 🟠 High | Payslip | **Payslip earnings don't add up (gross ₹86,083 vs visible rows ₹86,868); reimbursements treated as an earning but excluded from gross** | Employees who add up the payslip get a different number than the headline gross → complaints and distrust. | ✅ CONFIRMED LIVE |
| H-06 | 🟠 High | Payslip | **"Paid Days" always shows 0** | Payslips carry an uninformative/wrong field employees will notice. | ✅ CONFIRMED LIVE |

### 3.3 Medium — should fix this sprint

| ID | Severity | Module | Title | Business impact | Evidence status |
|---|---|---|---|---|---|
| M-01 | 🟡 Med | Attendance | **Adding a duplicate attendance day shows only a red border — no error message (and screen readers hear nothing)** | HR can't tell why the save was refused; accessibility failure. | ✅ CONFIRMED LIVE |
| M-02 | 🟡 Med | Holidays | **Holidays cannot be deleted or deactivated — a mistyped holiday is permanent** | No way to correct data; holiday calendars can accumulate errors. | ✅ CONFIRMED (UI + API 405) |
| M-03 | 🟡 Med | Payroll | **Failed payroll upload batches cannot be deleted or retried; failure shows no message at the moment of upload** | Failed batches pile up; a failed upload looks "successful" (row appears, no toast) and the reason is hidden in details. Confusing and unmanageable. | ✅ CONFIRMED (UI + API 405) |
| M-04 | 🟡 Med | Leave | **Configured "max days per month" is ignored (3 CL days taken in a month set to max 2)** | HR believes limits are enforced; they are not. Overuse of leave goes uncaught by the config. | ✅ CONFIRMED LIVE |
| M-05 | 🟡 Med | All modules | **Missing/invalid inputs sometimes return "409 Conflict" instead of a normal validation error, and raw internal error text is shown to users ("Cannot read properties of undefined (reading 'trim')")** | Users and integrators see confusing statuses/technical messages instead of friendly field errors. | ✅ CONFIRMED |
| M-06 | 🟡 Med | Payroll upload | **Upload page resets the selected month to September after every upload — easy to upload January data into the wrong month** | Operator error risk; month must be re-selected each time. | ✅ CONFIRMED (UI) |
| M-07 | 🟡 Med | Leave | **Disabled (inactive) leave types still appear in the list employees can choose from** | Staff can pick a leave type that will fail. Confusing. | ✅ CONFIRMED LIVE |
| M-08 | 🟡 Med | Leave | **Balances don't move while a request is pending — HR screen shows full balance and zero loss-of-pay even when leave will push into unpaid days** | HR may believe no LOP is building up until approval. | ✅ CONFIRMED (live observation) |
| M-09 | 🟡 Med | Dashboard | **Attendance % on the dashboard mixes categories inconsistently (half-day counted as full present, late arrivals excluded, denominator counts all staff incl. non-active)** | Attendance rate shown to leadership isn't a true representation. | ⛔ CODE |
| M-10 | 🟡 Med | Attendance | **UTC vs local time mismatch can mark a late-evening check-in as the wrong day ("Absent" right after checking in)** | Attendance correctness problem for late-evening shifts; **highly relevant if staff ever work after 6–7pm**. | ⛔ CODE |
| M-11 | 🟡 Med | Attendance | **Check-out is also blocked outside the office geofence** | If off-site/remote check-out is ever a requirement, it silently won't work. Confirm intended policy. | ✅ OBSERVED LIVE (flagged as possible intended) |
| M-12 | 🟡 Med | Employment | **Partial employee-employment edits can persist despite a validation error (see B-04)** | Same as B-04; API contract for employee updates should be made consistent and safe. | ✅ OBSERVED LIVE |

### 3.4 Low / UX / hygiene — ticket when convenient

| ID | Severity | Module | Title | Business impact | Evidence status |
|---|---|---|---|---|---|
| L-01 | 🟢 Low | Leave | **Manager "Pending Approvals" list mixes in already-approved and rejected requests** | Manager queue looks cluttered; a client could act on the wrong status. | ✅ CONFIRMED LIVE |
| L-02 | 🟢 Low | Audit | **Audit History shows ~nothing (one login record) despite a full session of changes** | The audit trail — a compliance core feature — is effectively empty. | ✅ CONFIRMED (UI) |
| L-03 | 🟢 Low | Roles | **Permission matrix saves with no Save button / no confirmation — one click changes production permissions** | Accidental permission changes with no undo or notice. | ✅ CONFIRMED (UI) |
| L-04 | 🟢 Low | Roles | **Two disconnected role systems (custom roles get no permissions, cannot be managed)** | Admins can create roles that do nothing. | ✅ CONFIRMED (UI) |
| L-05 | 🟢 Low | Leave UI | **"Apply Leave" with empty required fields silently submits nothing — no validation, no error** | Form gives no feedback; users may think they applied. | ✅ CONFIRMED (UI) |
| L-06 | 🟢 Low | Setup | **"Next employee code" returns PQ-formatted codes while the directory uses EMP format — two code schemes coexist** | Inconsistent employee reference numbering. | ✅ CONFIRMED |
| L-07 | 🟢 Low | Attendance | **An attendance record dated in the future exists** (2026-09-23 while server was 09-21), overnight shift renders without dates (checkout appears earlier than check-in) | Confusing calendar/legacy data. | ✅ OBSERVED |
| L-08 | 🟢 Low | API | **Sequential database IDs leaked in API responses (leave `id: 100–108`, employee `id: 232`)** | Minor information disclosure that can help enumeration. | ✅ OBSERVED LIVE |
| L-09 | 🟢 Low | API | **Inconsistent error format across APIs (3 different shapes)**; some routes return 405 instead of 404; `/profile` returns a bare 403 for logged-out users instead of redirecting to login | Integrators must handle multiple formats; small-print UX. | ✅ CONFIRMED |
| L-10 | 🟢 Low | Payroll | **Duplicate re-upload of an already-loaded month is reported as a scary "upload has failed" notification** | HR may think something broke when nothing did. | ✅ CONFIRMED LIVE |
| L-11 | 🟢 Low | Payroll | **No per-month de-duplication warning at upload time (two September batches coexist)** | Duplicate/split month batches possible without warning. | ✅ CONFIRMED |
| L-12 | 🟢 Low | Settings | **Settings page is an empty stub ("controls will be added as modules mature")** — leave cutoff setting claims exist but page is a placeholder | Admin expectations vs reality mismatch. | ✅ CONFIRMED (UI) |
| L-13 | 🟢 Low | UX | **"Cancel" in the discard dialog actually discards your edits; discard buttons inconsistently labelled; leave-type description duplicates its name** | Wording accuracy / polish. | ✅ CONFIRMED (UI) |
| L-14 | 🟢 Low | Various | **Master-data names normalised differently per module (departments auto-title-cased, "ZZ QA" → "Zz Qa"; designations/holidays stored verbatim)** — acronyms get mangled | Inconsistent data presentation. | ✅ CONFIRMED |
| L-15 | 🟢 Low | Docs/data | **Junk permission key "new_world" sits in the permission catalog; SQLite-style id / payroll "next code" residue** | Config hygiene. | ✅ CONFIRMED |
| L-16 | 🟢 Low | Nav | **Navigation link `/organization-locations` 404s (correct route uses an underscore)** | Broken nav path. | ✅ CONFIRMED |

---

## 4. Master bug backlog (flat, ticket-ready)

| # | Severity | Module | Title | Status |
|---|---|---|---|---|
| 1 | Critical | Attendance | Attendance write access granted by view permission; forgery proven (B-01) | ✅ live |
| 2 | Critical | Leave | Custom leave types silently become unpaid leave (B-02) | ✅ live |
| 3 | High | Access | `:manage` permission keys unused; all writes keyed on `:view` (B-03) | ⛔ code |
| 4 | High | Employment | PUT employment persists despite 409 error (B-04 / M-12) | ✅ live |
| 5 | High | Dashboard | Payroll total ≠ breakdown sum (H-01) | ✅ live |
| 6 | High | Leave | Blank leave type → HTTP 500 not a clean error (H-02) | ✅ live |
| 7 | High | Dashboard | New hires counted by created-date not join-date (H-03) | ✅ live |
| 8 | High | Attendance | Check Out offered without check-in; silent failure (H-04) | ✅ live |
| 9 | High | Payslip | Gross ≠ sum of earnings rows; reimbursements presentation (H-05) | ✅ live |
| 10 | High | Payslip | Paid Days always 0 (H-06) | ✅ live |
| 11 | Medium | Attendance | Duplicate-date save: red border only, no message (M-01) | ✅ live |
| 12 | Medium | Holidays | No delete/deactivate path (M-02) | ✅ live |
| 13 | Medium | Payroll | No delete/retry for failed batches; silent upload failure (M-03) | ✅ live |
| 14 | Medium | Leave | `max_per_month` policy ignored (M-04) | ✅ live |
| 15 | Medium | API | 409-vs-400 validation status; leaked internal errors (M-05) | ✅ live |
| 16 | Medium | Payroll | Month resets to September after upload (M-06) | ✅ live |
| 17 | Medium | Leave | Inactive leave types still selectable (M-07) | ✅ live |
| 18 | Medium | Leave | Pending requests don't move balance/LOP display (M-08) | ✅ live |
| 19 | Medium | Dashboard | Attendance % semantics inconsistent (M-09) | ⛔ code |
| 20 | Medium | Attendance | UTC vs local day mismatch late evening (M-10) | ⛔ code |
| 21 | Medium | Attendance | Check-out geofenced = off-site checkout blocked (M-11) | ✅ live |
| 22 | Low | Leave | Pending-approvals list unfiltered (L-01) | ✅ live |
| 23 | Low | Audit | Audit history effectively empty (L-02) | ✅ live |
| 24 | Low | Roles | Permission matrix auto-saves, no confirmation (L-03) | ✅ live |
| 25 | Low | Roles | Custom roles disconnected from permission matrix (L-04) | ✅ live |
| 26 | Low | Leave | Apply-leave form silent no-op when empty (L-05) | ✅ live |
| 27 | Low | Employees | Two employee-code schemes (PQ vs EMP) (L-06) | ✅ live |
| 28 | Low | Attendance | Future-dated record; overnight rendering (L-07) | ✅ live |
| 29 | Low | API | Internal sequential IDs leaked (L-08) | ✅ live |
| 30 | Low | API | Inconsistent error envelopes; 405 vs 404; /profile 403 (L-09) | ✅ live |
| 31 | Low | Payroll | Duplicate-month re-upload flagged as "failed" (L-10) | ✅ live |
| 32 | Low | Payroll | No month-level duplicate upload guard (L-11) | ✅ live |
| 33 | Low | Settings | Settings page empty stub (L-12) | ✅ live |
| 34 | Low | UX | Discard/cancel wording; duplicate descriptions (L-13) | ✅ live |
| 35 | Low | Master data | Inconsistent name normalisation ("ZZ QA"→"Zz Qa") (L-14) | ✅ live |
| 36 | Low | Config | Junk permission key; code-generation residue (L-15) | ✅ live |
| 37 | Low | Nav | Broken `/organization-locations` link (L-16) | ✅ live |

---

## 5. Known limitations of this test pass

- **Deployed build ≠ source code being reviewed.** Several behaviours observed live differ from what the reviewed code predicts (leave rules stricter on the live server; inactive leave types visible on live but filtered in code; employment PUT persisting despite validation error). Code-based findings should be re-confirmed against the exact deployed commit before they are closed. Treat the reviewed source as a strong hint, not the truth.
- **Only one non-admin pair was available.** Severity of the attendance-forgery defect (B-01) was proven with an admin whose role includes view access; a real "view-only, non-admin" role should also be exercised to fully scope how far a low-privilege user can go.
- **Statutory and long-horizon rules were not fully exercised:** maternity leave (works for a qualifying female employee), paternity 30-day window boundary, year-end carry-forward, minimum-service-day block, document-required block, full-year monthly accrual. Arguably the highest-compliance-value follow-up.
- **Not tested:** load/performance, browser compatibility outside Chromium, penetration testing, iOS/Android.

---

## 6. Product decisions requested (from the findings)

1. **Salary components & structures — do they ever feed payslips?** Today they are config-only (payroll is 100% Excel-driven). If they are meant to compute pay, wire them in; if not, hide or mark the screens read-only so HR doesn't configure them in vain.
2. **Check-out geofence — should off-site/remote check-out be allowed?** Currently blocked outside the office zone.
3. **Leaderboard of "failed" response:** should duplicate-month uploads be styled as "already exists (informational)", not "failed (alarm)"?
4. **Reimbursements on payslip:** show separately, or count into gross so the numbers add up?
5. **"Paid Days" display:** show month calendar days instead of 0.
6. **Attendance-record editing by HR:** should HR editing attendance, and manual edits, always create an audit entry — and should leave-created records be editable at all?

---

## 7. Recommended next steps

### For the development team (suggested fix order)
1. **Access control rework (B-01, B-03):** use the existing `:manage` keys on every write endpoint; enforce record ownership for attendance; block mutation of leave-originated attendance records. This is the highest-risk item.
2. **Leave balance engine (B-02, M-04):** honour policy `annual_limit`/`max_per_month` for every configured leave type (not just hard-coded codes); if balance is zero, refuse the request instead of silently routing to LOP.
3. **Validation hardening (H-02, M-05):** presence-validate all required fields; return a clean **400** with a friendly message; never leak raw JS/DB errors; stop escalating messages to 500 via keyword matching.
4. **Dashboard corrections (H-01, H-03, M-09):** make the payroll KPI equal the sum of the chart; count new hires by join date; standardise attendance-rate semantics.
5. **Payslip presentation (H-05, H-06):** reconcile gross vs earnings rows; fix "Paid Days".
6. **UX gap closure (M-01, M-03, M-06, M-07, L-01, L-05):** attendance duplicate-date message, payroll batch delete/retry + toasts, keep selected month, hide inactive leave types, filter pending-approvals, validate apply-leave form.
7. **Hygiene (L-02–L-16):** audit capture, permission-matrix confirmation, role unification, error-envelope consistency, remove junk keys/IDs/legacy data.
8. **Re-verify B-04/F20** once the deployed commit is known — confirm whether the "writes despite 409" is a bug or a stale-build artefact.

### For QA (follow-up verification campaigns)
- Exercise **maternity/paternity statutory rules** with a qualifying employee, **monthly accrual over a full year**, **year-end carry-forward**, **minimum-service block**, **document-required block**.
- Re-test attendance at **weekend, before-join-date, half-day leave, pending-check-out day 8 (grace expiry)**.
- Drive the **attendance widget journeys live** (UI-AT1..7) and the **forger role** with a real read-only non-admin account.
- Full **audit-logs matrix** once audit capture is fixed.
- Confirm all Backlog items against the **exact deployed build** after fixes deploy.

### For leadership / HR
- **Do not assign "view-only" roles and expect read-only behaviour** until B-01/B-03 are fixed.
- **Do not add a new leave type through the admin UI and rely on it paying employees** until B-02 is fixed; top-up balances manually in the meantime if a new type is business-critical.
- Treat **dashboard figures as unofficial** until H-01/H-03 are fixed; verify against payroll exports for any internal decision.
- Schedule the product decisions in Section 6 with the payroll and leave owners.

---

## 8. Appendix — verified working (no defects found)

These give confidence that the platform foundation is sound:

- **Auth:** every protected page redirects to SSO when logged out; all probed APIs return 401 when unauthenticated; CSRF protection active; logout works.
- **Employees:** list renders correctly with counts and all 9 sub-tabs (Personal, Employment, Address, Education, Experience, Skills, Languages, Documents, Bank Details); create wizard enforces required fields; save-gating works.
- **Leave lifecycle (live):** apply → notification → manager approves → status updated → attendance record created → balance debited → approval notification; reject/withdraw paths correct; overlapping-period, half-day-not-allowed, weekend-only, and gender rules all rejected cleanly; random invalid actions rejected.
- **Attendance (live):** in-zone check-in creates a Present record with location; out-of-zone check-in rejected ("outside the office zone"); duplicate check-in rejected; missing GPS rejected; unknown record rejected.
- **Payroll:** valid workbook upload processes rows (9/10, unknown employee skipped with a clear message); short month headers (Jan26, 01-26, APR-26) parsed correctly; duplicate employee+month blocked per-row and in-file; payslips generated per record; extension validation works (`.txt` refused); upload gating works.
- **Master data & admin modules:** duplicate department names rejected inline; soft-disable (delete → inactive) works with proper 404s for bogus ids; shifts, shift assignments, leave types, leave policies, locations list correctly; notifications bell/badge/panel render correctly.