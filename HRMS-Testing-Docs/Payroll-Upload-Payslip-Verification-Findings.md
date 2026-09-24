# Payroll Upload & Payslip Verification — Findings Report

- **Prepared for:** business / HR stakeholders (non-technical)
- **Reference documents:** `EC04_mixed_numeric_formats_synthetic.xlsx` (test payroll file), `HANDOFF-RESUME.md`
- **Environment tested:** preprod HRMS (`https://people.pieq.ai/`), tested 2026-09-22
- **Bottom line:** payroll upload → monthly payslip generation works end-to-end when files follow the expected structure, and the app now correctly reads short month formats like `January26`, `Jan26`, `01-26` and `APR-26`. Salary **components** and **structures** can also be created and assigned to **any employee** based on the real Excel file — but they are not used by the payroll/payslip calculation (payroll is 100% Excel-driven), certain files are silently rejected, and a few payout figures do not add up — details below.

---

## 1. What the testing confirmed (these findings are real)

### 1.1 Payroll upload works, keyed by the employee code ("Emp No")

- Uploaded the real test file (`EC04_mixed_numeric_formats_synthetic.xlsx` — sheet named "April26" but header title "January26", mixed number formats like `20,918` and `86,083`) for **January 2026**.
- **9 of 10 rows created payroll records** (employees PQ001–PQ009). The 10th (PQ010) was **skipped with a clear message** because that employee does not exist in the system — this is correct behaviour, and the rest of the file was still processed.
- A **payslip was generated for each created record**, e.g. "Payslip Thivaghar Manoharan January 2026" for PQ001, with the earnings/deductions pulled straight from the Excel rows (Basic, HRA, Special Allowance, all deductions and Net). Mixed formats (text like `"86,083"` vs numbers) were read correctly.

### 1.2 "January26" / MONTHYY formats are now handled

- Re-uploading the same payroll with the header changed to **`Jan26`**, **`01-26`**, and **`APR-26`** were all parsed to the right month and year.
- Proof: uploading a `Jan26` file for January 2026 rejected every row as "already exists" (because the January records were already created) — i.e. the system understood the period correctly and prevented duplicates. The `APR-26` file uploaded for **April 2026 created 9 new records** (PQ001–PQ009) and generated an April payslip, proving the short-format path works all the way through.

### 1.3 Duplicate prevention is enforced

- Uploading twice for the same employee + month is blocked with a clear per-row message: `A payroll record for employee "PQ001" for 2026-01 already exists.`
- Duplicate rows **inside one file** are also detected: a file with row 4 copied to the end produced `Duplicate row in upload` for the copied row.
- An HR user is therefore protected from accidental double-payslip creation.

### 1.4 Clear validation messages for malformed files (mostly)

| File condition | Result |
|---|---|
| No period header at all | Blocked: "Payroll period could not be extracted from the report header." |
| Blank title (A1 empty) | Blocked with the same message |
| No `Emp No` column at all (header renamed to something unrecognised) | Blocked: "Required column 'Emp No' is missing." |
| Unknown employee code (e.g. PQ999) | That row rejected with "Employee with code PQ999 does not exist" |
| Month selected ≠ month in file (APR-26 file uploaded as January) | Blocked: "Selected payroll period does not match uploaded file period." |

---

## 2. Deviations and issues found (live behaviour to review)

- **The app accepts a very wide range of column names for the employee code.** Renaming the `Emp No.` column to `Employee Code` was still accepted (the parser has a long alias list: *Emp No, Employee Code, Emp ID, Staff No, Payroll No, Code*, etc.). This is convenient but means a file with a differently-named column is not necessarily flagged as malformed — acceptable, but worth knowing.
- **Payslip earnings do not add up consistently (likely a display inconsistency).** For PQ001 the payslip lists `Reimbursements ₹785` inside the Earnings table, but the Gross Earnings figure shown is ₹86,083 (the file's explicit "Gross Earnings" column, which excludes reimbursements). The visible earnings rows add up to ₹86,868 ≠ ₹86,083. An employee checking the maths could be confused. This needs a product decision: either show reimbursements separately (not as an earning) or add it into gross.
- **Payslip shows "Paid Days = 0".** Every payslip verified showed 0 paid days even though salaries were uploaded fine. If employees expect to see "paid days = calendar days in month", this is wrong/uninformative.
- **Employee name on payslip comes from the database, not the file.** The file row for PQ001 says "Karthik Menon" but the payslip shows the DB name "Thivaghar Manoharan". Not a bug (DB is the source of truth) but surprises users who review the file against the payslip.
- **File period must match selected period — strictly.** A file correctly saying `APR-26` uploaded while the UI had "January" selected is rejected wholesale. Good defence, but the upload page resets the month to September after each upload, so an operator must remember to re-set the month each time — easy to trip over.
- **Duplicate-file uploads are flagged as a "failed upload" at High severity.** Uploading a fully-duplicate file shows a notification "payroll upload for 1/2026 has failed. 10 row(s) failed validation." The rows were rejected *because they already exist* (not because the file is bad) — the wording/severity may mislead HR into thinking something broke.
- **Salary components & structures CAN be created and assigned (verified live).** It is possible to add the exact salary components from the Excel file (Basic, HRA, Special Allowance, Medical Allowance, Conveyance, Food Allowance, PF, Income Tax, Professional Tax, Meal Pass, Others, Reimbursements) — additional components (PT, TDS, Employer PF, Employer ESI, Employee ESI) can also be created; nothing prevents near-duplicate labels (e.g. "PT" vs "Professional Tax", "TDS" vs "Income Tax") from being created side by side. A salary structure was then created through the UI for **Thivaghar Manoharan (PQ001)** using the file's amounts for Basic/HRA/Special Allowance/PF, and for **Senthil SB (EMP001)** using Conveyance/Professional Tax — both saved and listed immediately, confirming a structure can be added for any employee. Creating a second structure for the same employee replaces the previous one (the old structure is automatically closed with an Effective-To date and status Inactive) — a clean one-active-structure-per-employee rule. **However, none of this feeds the payroll calculation:** payslips pull their figures entirely from the uploaded Excel file, so configuring components today has no effect on payslips.
- **Salary Components / Structures screens were empty, not broken.** The earlier "empty screens" observation was simply an unconfigured system — now that data has been added, the screens list, search, filter, and open detail views correctly (component amounts, earning/deduction types, and a computed Total that nets deductions).

---

## 3. Attendance duplicate-date bug (confirmed live)

While reproducing a related check, the date-edit error behaviour was confirmed live on the Attendance Records page:

- Trying to save an attendance record for an employee on a date **they already have a record for** shows only a **red border on the date field and a red label — with no explanation text at all**. There is no inline message such as "An attendance record already exists for this employee on this date" (other fields, e.g. Employee and Status, correctly show their messages).
- The red highlight even uses `aria-invalid` styling that is never announced to screen readers, so the failure is effectively invisible to accessibility tools.
- **Business impact:** HR trying to add a duplicate day for someone will be blocked with zero feedback — they only see a red outline and cannot tell why the save was refused. This also creates a support/education cost that would be avoided with a clear error line.

*(Related root cause from the code review: the field-level error is generated but never rendered for the date control; a database race condition can also surface as a raw server error if two saves land at the same moment.)*

---

## 4. What this means for the business

- **Payroll processing for the "mixed numeric format" file is production-ready:** employees get payslips keyed by their Emp No, short month formats are handled, and duplicate/pay-in-twice is prevented.
- **Three things to fix before broad rollout:**
  1. The missing date error message on Attendance (section 3) — silent block with no explanation.
  2. The payslip "gross vs reimbursements" presentation (section 2) — payout maths looks wrong to employees even though Net is the true number.
  3. The Salary Structures/Components gap (section 2) — the screens are now proven to work and employees can be assigned structures from the Excel file, but configured components still never flow into payslips (payroll is 100% Excel-driven). Decide whether they ever should.
- **Operational notes:** the upload page resetting the selected month to September after each upload is a trap, and duplicate re-uploads are reported as scary "failed" notifications even though nothing went wrong.

---

## 5. Recommended next steps

1. Add the missing inline error message (and proper `aria-invalid`) for the attendance date field — high priority, small fix, visible to all HR users.
2. Decide the reimbursements/gross display rule for payslips and fix the payslip summary if reimbursements should count toward gross.
3. Resolve whether "Paid Days" should show the days in the payroll month instead of 0.
4. Confirm with product whether salary structures/components are meant to drive payslips; if yes, wire them into the calculation; if no, hide the screens (or keep them as read-only config).
5. Consider keeping the selected Pay Month between uploads, and re-word duplicate-block notifications so "already exists" is not reported as a failure.