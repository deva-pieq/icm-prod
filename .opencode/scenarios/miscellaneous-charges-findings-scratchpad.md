# Miscellaneous Charges — Exploration Findings (Scratchpad)

**App under test:** https://preprod.app.pieq.ai/payment-processing/miscellaneous-charges
**Env:** Version V20260907.04 · User: Deva X (Operations Manager)
**Date of exploration:** 2026-09-08
**Source repos:** Not provided (payment-processing SPA/API not among given repos). Findings based on live-app exploration only.

---

## 1. Navigation
- Sidebar → **Payment Processing** expands a submenu: **Payables · Approval · History · Miscellaneous Charges**
- Miscellaneous Charges is the active row on this page
- Sidebar also contains: Dashboard, User Management, Carriers, Agents, Products, Policies, Commissions, Advance, Statements, Payment Processing, Settings, Agency Configuration

## 2. Page layout (`/payment-processing/miscellaneous-charges`)
- Heading **"Miscellaneous Charges"** (level 1)
- **"Add Miscellaneous Charge"** button (testid `miscellaneous-charge-add-button`) → opens modal
- Data grid (testid `data-grid`):
  - Header row 1: select-all checkbox (disabled when no data)
  - Header row 2 columns: **Txn Date · Txn ID · Agent · Amount · Payment Batch · Payment Date · Status**
  - Empty state: rowgroup with "No Records Found" + status "No data available"
  - Footer: "Showing all 0 records" (testid `data-grid-record-count-footer`)

### Toolbar
- **Search** placeholder: "Search by agent, amount, date, txn id, status..." — helper "Use this search box to filter the data grid. Results will update as you type."
- **All Agents** filter (testid filter `All Agents`) — "Filter the data grid by agent."
- **All Status** filter (testid `All Status`) — "Filter the data grid by status."
- **Toggle columns** (testid `data-grid-columns-button`)
- **Export grid data to Excel** (testid `data-grid-export-button`)
- **Refresh grid data** (testid `data-grid-refresh-button`)

### Bottom action bar
- **Cancel** button (disabled) · **Process** button (disabled)
- Both disabled when no rows selected / no data. Batch actions for selected rows.

## 3. Add Miscellaneous Charge modal (dialog)
Opened via "Add Miscellaneous Charge" button. Fields:
| Field | Testid | Required | Behavior |
|---|---|---|---|
| Transaction Date | (date input) | ✔ | Defaults to today (observed 09/08/2026); date picker |
| Agent | (dropdown) | ✔ | Searchable dropdown; options "`code - First Last`" (e.g. `90058 - TestAgent0058 TestAgent0058`, `0987654321 - DevaTest Agent`); ~500+ agents incl. TestAgent0006-0058, MmpNew test agents, SAGL sub-agent codes, X001/X002/X003 test hierarchies |
| Amount | `miscellaneous-charge-amount` | ✔ | Textbox; Save remains disabled until valid |
| Description | (textbox named "Description") | ✔ | Free text |

- Header: heading "Add Miscellaneous Charge" (level 2) + "Enter the details for the new miscellaneous charge."
- Close modal button (X)
- Footer: **Cancel** (discards) · **Save** — **Save is disabled until Agent, Amount and Description are filled**
- Amount numeric; entering invalid values keeps Save disabled

### Cancel-with-unsaved-changes guard
When the modal has unsaved edits and user clicks Cancel → second dialog **"Cancel Changes"**:
- Heading "Cancel Changes"
- Body: **"Are you sure you want to cancel? All unsaved changes will be lost."**
- Buttons: **Cancel** (discard changes) · **Keep Editing**

## 4. Batch processing
- Rows in the grid must be selected via checkboxes before batch Cancel / Process activate
- Grid dedup/update after save/proccess; "Payment Batch" and "Payment Date" columns populate after a successful Process
- Empty grid → both buttons disabled

## 4a. End-to-end: Save → Process → Payables (user-observed + live-verified)
- A saved misc charge gets a **dynamic Txn ID** — pattern `TX-` + 6 alphanumeric chars (e.g. `TX-5VYTA7`). **Never hard-code the value**; assert with regex `^TX-[A-Z0-9]{6}$` and capture it per test run
- After Process, the record **leaves the Misc Charges grid** (list now shows pending/unprocessed only) and appears as a **Payables** line item (`/payment-processing/payable-line-items`, heading "Pending Payments")
- Payables row rendering (columns: Uploaded Date · Txn ID · Paid To Agent · Amount · Type · Source Trace · Policy · Carrier / Product · Issue Date):
  - **Txn ID**: `TX-XXXXXX`
  - **Paid To Agent**: agent first + last name
  - **Amount**: currency with 2 decimals; **negative/deduction wrapped in parentheses** — `($100.00)` — vs positive `$360.00`
  - **Type**: `MISCELLANEOUS_CHARGE` (distinct from `COMMISSION` and recovery `MMP` row types)
- Live-verified Payables examples (commissions/recoveries): `TX-8HHKBH / TestAgent0061 / ($290.00) / MMP`, `TX-CRPK9A / TestAgent0061 / $360.00 / COMMISSION`
- Note: `TX-5VYTA7` (agent "Nirmalrajaa K Kathirvel", `($100.00)`, `MISCELLANEOUS_CHARGE`), created by a manual tester on a separate run, was **not visible** under the Deva X session when verified (misc API returned `{"data":[]}`) — treat as tenant/session-scoped evidence for the rendering contract.

## 5. Test data notes
- No records present in preprod grid at exploration time (empty state verified)
- Stable agents for review/charge data: `90058 - TestAgent0058 TestAgent0058`, `0987654321 - DevaTest Agent`
- Txn Date default = current date; Payment Batch / Payment Date columns are populated post-processing (lifecycle continuation into Approval/History not observable without creating data)

## 6. Coverage gaps / assumptions
- Lifecycle after Process (Approval/History pages) and Payment Batch generation require creating a misc charge then processing it; source for payment-processing module not provided, so post-process expectations are based on UI column contract (Payment Batch, Payment Date).
- Approval and History sub-pages appeared empty/slow-loading on preprod during exploration; treat as integration cases once data exists.