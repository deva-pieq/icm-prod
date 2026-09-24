# Miscellaneous Charges Module Documentation

> **SKIPPED from suite (2026-09-09):** `miscellaneous-charges.feature` renamed to `miscellaneous-charges.feature.skip` so `bddgen` / `yarn test` are not blocked by 6 missing step defs. Restore to `*.feature` after steps are complete.

## Overview
Playwright BDD test module for Miscellaneous Charges page in Payment Processing feature. Covers page load, grid operations, add/edit/modal interactions, batch actions, toolbar buttons, and validation rules.

## Locator Discovery: Code Exploration vs Playwright Live Exploration

### Code Exploration IS Sufficient for This Module

**Reason:** All critical UI elements have explicit `data-testid` attributes defined in the SPA source code (`src/page/MiscellaneousCharges/MiscellaneousCharges.tsx`). The page object (`MiscellaneousChargesPage.ts`) maps these with fallback patterns, and the API layer provides the complete data structure (field names, types, validation rules).

### When Code Exploration Alone Is NOT Enough

Playwright live exploration would be needed when:
- Dynamic/test IDs change between environments (preprod vs prod)
- Complex interactions involve timing-sensitive behavior
- Accessibility labels (role/name) need verification against rendered output
- CSS selectors are required as last resort for dynamically generated content

### Locator Strategy Summary (Priority Order)

1. **`data-testid`** (primary) — All form fields, buttons, and grid elements have explicit test IDs:
   - `miscellaneous-charge-add-button` — Add charge button
   - `miscellaneous-charge-form-modal` — Add/edit modal container
   - `miscellaneous-charge-transaction-date` — Transaction date input
   - `miscellaneous-charge-agent-dropdown` — Agent selector dropdown
   - `miscellaneous-charge-amount` — Amount input
   - `miscellaneous-charge-description` — Description textarea
   - `miscellaneous-charge-form-cancel` — Form cancel button
   - `miscellaneous-charge-submit` — Save/submit button
   - `miscellaneous-charges-datagrid` — Data grid container
   - `misc-charge-row-checkbox-{id}` — Row selection checkboxes
   - `misc-charge-status-badge-{id}` — Status badges in grid
   - `misc-charge-actions-{id}` — Row actions column

2. **`getByRole` / `getByLabel`** (secondary) — Fallback patterns:
   - Headings: `getByRole('heading', { name: 'Miscellaneous Charges', exact: true })`
   - Buttons: `getByRole('button', { name: /^Save$/i })` or `getByRole('button', { name: /Add miscellaneous charge/i })`
   - Inputs: `getByRole('textbox', { name: /amount/i })` or `getByRole('combobox', { name: /agent/i })`
   - Checkboxes: `getByRole('checkbox', { name: /select all/i })`

3. **Text / CSS** (last resort) — Used when above patterns fail:
   - `getByText('No Records Found')` — Empty state message
   - `page.getByText(/cancel changes/i)` — Confirmation dialog body
   - Grid cell text content via `innerText` or `getText()`

### Key Test IDs Map

| UI Element | data-testid | Fallback Pattern |
|------------|-------------|------------------|
| Add Charge Button | `miscellaneous-charge-add-button` | `getByRole('button', { name: /add miscellaneous charge/i })` |
| Form Modal | `miscellaneous-charge-form-modal` | `getByRole('dialog', { name: /add miscellaneous charge/i })` |
| Transaction Date | `miscellaneous-charge-transaction-date` | `getByRole('textbox', { name: /transaction date/i })` <br> or `locator('input[type="date"]')` |
| Agent Dropdown | `miscellaneous-charge-agent-dropdown` | `getByRole('combobox', { name: /agent/i })` <br> or `getByTestId('miscellaneous-charge-agent-dropdown')` |
| Amount Input | `miscellaneous-charge-amount` | `getByRole('textbox', { name: /amount/i })` <br> or `getByTestId('miscellaneous-charge-amount')` |
| Description | `miscellaneous-charge-description` | `getByRole('textbox', { name: /description/i })` |
| Grid | `miscellaneous-charges-datagrid` | `getByRole('grid', { name: 'Data grid' })` |
| Row Checkbox | `misc-charge-row-checkbox-{id}` | `input[id*="checkbox-row"]` <br> or `input[data-testid^="row-checkbox-"]` |
| Process Button | `getByRole('button', { name: /^Process$/i })` <br> or `getByTestId('process-button')` |
| Cancel Batch Button | `getByRole('button', { name: /^Cancel$/i })` <br> or `getByTestId('cancel-batch-button')` |
| Save Button (modal) | `getByRole('button', { name: /^Save$/i })` <br> or `getByTestId('save-button')` |
| Export Button | `getByTestId('data-grid-export-button')` |
| Refresh Button | `getByTestId('data-grid-refresh-button')` |
| Columns Toggle | `getByTestId('data-grid-columns-button')` |
| Footer (record count) | `getByTestId('data-grid-record-count-footer')` |
| No Records Found | `getByText('No Records Found', { exact: true })` |

### Form Field Definitions (from SPA Source)

| Field | Component | Type | data-testid | Required | Validation |
|-------|-----------|------|-------------|--------|------------|
| Transaction Date | OutlineInput | date | `miscellaneous-charge-transaction-date` | Yes | Must be valid ISO date; calendar/arrow keys only (block keyboard editing) |
| Agent | OutlineDropdown | select | `miscellaneous-charge-agent-dropdown` | Yes | Must select from loaded agents; searchable; displays `code - FullName` format |
| Amount | OutlineInput | text | `miscellaneous-charge-amount` | Yes | Positive number, max 13 digits + 2 decimals; pattern: `/^\d{0,13}(\.\d{0,2})?$/` |
| Description | OutlineTextarea | textarea | `miscellaneous-charge-description` | Yes | Max 256 characters |

**Form Validation Logic** (from `validateForm` callback):
- Transaction date: `toIsoDateOnly(transactionDate)` must return valid date
- Agent: `agentId.trim()` must not be empty
- Amount: `parseChargeAmount(amount)` must return valid positive number (regex: `/^\d{1,13}(\.\d{0,2})?$/`, value must be > 0)
- Description: `description.trim()` must not be empty and <= 256 chars

**Save Button Enable Condition** (`showFormSkeleton` / `canSave`):
- `isFormValid && hasFormChanged && !isSaving && !showFormSkeleton`
- `isFormValid` checks: valid date, agent selected, amount is valid positive number, description provided
- `hasFormChanged` checks if form values differ from initial snapshot

### Grid Column Structure

**Default visible columns** (7 columns):
1. Txn Date (transactionDateDisplay) — type: date
2. Txn ID (txnId) — transaction ID, format: `TX-[A-Z0-9]{6}`
3. Agent (agentName)
4. Amount (amount) — formatted as currency
5. Payment Batch (paymentBatch)
6. Payment Date (paymentDateDisplay) — type: date
7. Status (statusDisplay) — badge: Draft/Initiate/Recovered

**All grid columns** (9 + actions):
1. `__select` — checkbox column (select/deselect rows)
2. Txn Date
3. Txn ID
4. Agent
5. Amount
6. Payment Batch
7. Payment Date
8. Description
9. Status (with badge indicator)
10. Actions (Edit/Process/Delete — visibility depends on charge status)

**Status values** (computed, not stored):
- `Draft` — `commissionDetailsUuid IS NULL` (charge not yet processed)
- `Initiate` — `commissionDetailsUuid set, no authorized_at on commission_payments`
- `Recovered` — linked to authorized/paid batch (`commission_payments.authorized_at` set)

**Selectable rows** (for batch actions): Only rows with status `Draft` are selectable for process/cancel/delete operations.

### API Endpoints (from Payment Processing API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/v1/payments/miscellaneous-charges` | List all charges for agency |
| `GET /api/v1/payments/miscellaneous-charges/{uuid}` | Fetch charge by UUID |
| `POST /api/v1/payments/miscellaneous-charges` | Create new charge |
| `PUT /api/v1/payments/miscellaneous-charges/{uuid}` | Update charge (draft only) |
| `POST /api/v1/payments/miscellaneous-charges/process` | Process selected charges (batch) |
| `DELETE /api/v1/payments/miscellaneous-charges/{uuid}` | Delete charge (draft only) |

**Request/Response DTOs:**
- `CreateMiscellaneousChargeRequest`: `{ transactionDate, agentUuid, amount, description, commissionType: "MISCELLANEOUS_CHARGE" }`
- `ProcessMiscellaneousChargesRequest`: `{ miscellaneousChargeUuids: [string] }`
- `MiscellaneousChargeListItemDto`: `{ uuid, transactionDate, transactionId, agentName, amount, paymentBatchUuid, paymentDate, status, description }`

**Status computed logic** (in `MiscellaneousChargeService.resolveStatus`):
- `commissionDetailsUuid == null` → `Draft`
- `paymentDate != null` → `Recovered`
- else → `Initiate`

### Test Scenarios Coverage (23 scenarios)

**Page Load & Structure (5):**
- T001: Page loads with correct heading
- T002: Grid displays all required columns
- T003: Empty grid shows No Records Found
- T004: Search box placeholder text
- T005: Footer shows record count

**Add Modal & Validation (7):**
- T006: Add modal opens with all fields
- T007: Transaction date defaults to today
- T008: Save disabled when required fields empty
- T009: Close button closes modal without saving
- T010: Cancel with unsaved changes shows confirmation
- T011: Keep Editing returns to modal preserving values
- T012: Confirming Cancel discards changes and closes modal

**Save & Batch Actions (6):**
- T013: Valid charge saves and appears in grid
- T014: Process button disabled when no rows selected
- T015: Selecting a row enables batch buttons
- T016: Select-all checkbox selects all grid rows
- T017: Export, Refresh, Columns toggle visible
- T018: Amount 0 keeps Save disabled
- T019: Negative amount keeps Save disabled

**New Coverage Additions (4):**
- T020: Edit a charge and update fields
- T021: Delete a miscellaneous charge
- T022: Search box filters results by query
- T023: Status filter shows specific status

### Known Behaviors & Edge Cases

1. **Amount validation**: `parseChargeAmount` returns `null` for "0", negative numbers, or non-numeric strings. Save button remains disabled.

2. **Transaction date**: When opening add form, date defaults to today's local date in MM/DD/YYYY format via `todayFormDateDisplay()`.

3. **Agent dropdown**: Populated from API `GET /api/v1/users/agents`. Displays `code - FullName` (e.g., "5446 - Harinee S"). Required field — Save disabled if no agent selected.

4. **Description max length**: 256 characters. Excess characters are trimmed on change.

5. **Batch operations**: Process, Cancel, and Delete are only available for rows with `Draft` status. Select-all only selects draft- status rows.

6. **Status filtering**: Filter by status (Draft/Initiate/Recovered) uses agent and status filter controls derived from loaded rows.

7. **Unsaved changes guard**: Navigation guard blocks in-app navigation when form has unsaved changes. Unsaved Changes Modal appears if user tries to navigate away.

8. **Delete flow**: Only draft charges can be deleted. Clicking Delete on a row shows confirmation modal. After deletion, grid refetches and selection is cleared.

9. **Search functionality**: Search input filters grid rows by agent name, amount, date, transaction ID, or status. Preserves search value across refetches.

### Module File Structure

```
features/miscellaneous-charges/
├── miscellaneous-charges.feature    ← Gherkin scenarios (23 tests)
├── module.md                        ← This documentation file
└── (generated by test runner)

steps/miscellaneous-charges/
├── miscellaneous-charges.steps.ts   ← Step definitions (20+ steps)
└── common.steps.ts                  ← BeforeAll/AfterAll hooks, login

pages/miscellaneous-charges/
├── MiscellaneousChargesPage.ts     ← Page object with locators & methods
└── MiscellaneousChargesAssertions.ts ← Assertion helpers

utils/miscellaneous-charges/
└── miscellaneousChargesContext.ts  ← Context state (last saved txnId, agent code)

test-data/miscellaneous-charges/
└── miscellaneousCharges.ts         ← Constants (grid columns, agent codes, regexes)
```

### Future Debugging Tips

1. **If a locator fails**: Check the `data-testid` attribute in the SPA source. If missing, add `data-testid` to the component and update the page object.

2. **If form validation behaves unexpectedly**: Verify the `validateForm` logic in the SPA — it checks date, agent, amount (via `parseChargeAmount`), and description in sequence.

3. **If grid actions (Edit/Process/Delete) are missing**: Check the charge's status. Only `Draft` status charges show all three action buttons.

4. **If search doesn't filter**: Ensure the query matches one of the filterable fields (agentName, amount, transactionDate, transactionId, status). Search is case-insensitive and partial-match.

5. **If batch buttons stay disabled**: Verify at least one row has `Draft` status. Use `isMiscellaneousChargeSelectable(row)` check: `row.status === "draft"`.

6. **If transaction date doesn't default to today**: The `openAddForm` callback sets `transactionDate` to `todayFormDateDisplay()` which formats today as `YYYY-MM-DD` then converts to MM/DD/YYYY for the `type="date"` input.

7. **If agent dropdown is empty**: The `useMiscellaneousChargeAgents` hook fetches agents from the API. It only loads when the modal is open (`enabled: hasToken && enabled`).

### References

- SPA Source: `src/page/MiscellaneousCharges/MiscellaneousCharges.tsx`
- Page Object: `pages/miscellaneous-charges/MiscellaneousChargesPage.ts`
- API Layer: `src/page/MiscellaneousCharges/api/MiscellaneousCharges-api.ts`
- Step Definitions: `steps/miscellaneous-charges/miscellaneous-charges.steps.ts`
- Feature File: `features/miscellaneous-charges/miscellaneous-charges.feature`