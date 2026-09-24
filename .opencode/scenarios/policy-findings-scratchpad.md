# Policy Module — Exploration Findings (Scratchpad)

**App under test:** https://preprod.app.pieq.ai/policy
**Env:** Version V20260907.04 · User: Deva X (Operations Manager)
**Sources:** `icm-policy-spa-main` (SPA), `icm-policy-api-main` (Kotlin API)
**Date of exploration:** 2026-09-08

---

## 1. Policy List Page (`/policy`)

### Landing
- URL: `/policy` · Title: "Policies"
- Page heading `Policy` (level 1), subtitle: "Manage policy records with complete member, agent, and financial information"
- `Add Policy` button (testid `add-new-policy`) → navigates to `/policy/create`

### Summary cards
- **Total Policies** card (testid `total-policies-card`) — observed `5,428`, subtitle "Across all carriers"
- **Active Policies** card (testid `active-policies-card`) — observed `5,428`, subtitle "100.0% of total"
- Data source: `GET /api/v1/policy?limit=100` → `{data, totalPolicies, activePolicies}`

### Data grid (AG Grid, testid `policy-datagrid`)
Columns:
| Header | Content |
|---|---|
| Policy Information | Policy No (primary color) + `Effective: MM/DD/YYYY` (export: 2 cols) |
| Member | Full name (+ DOB / phone sub-lines) |
| Agent | Full name + `{level} • {code}` |
| Carrier & Product | Carrier (bold) + Product (muted) |
| Status | Badge `policy-status-{uuid}` |
| Actions | Kebab `policy-actions-{uuid}` → **Edit** (`/policy/edit/{uuid}`), **View Ledger** (`/policy/ledger/{uuid}`) |

- Status badge colors: Active→primary-soft, Pending→warning, Cancelled→danger, Expired/Lapsed→neutral, Suspended→warning, "in force"→success
- Row click → `/policy/edit/{uuid}` (kebab actions cell excluded)
- `rowHeight 55`, `headerHeight 45`
- Empty state: "No Records Found"
- Footer: "Showing all 100 records" (testid `data-grid-record-count-footer`)

### Toolbar
- **Search** (placeholder: "Search policies by number, member, agent or carrier...") — 400ms debounce, server-side. Server search matches policy number, member names, agent names/codes, product names.
- **Status filter** (default "All Status"): `All Status | Active | Lapsed | Cancelled | Expired`
- **LOB filter** (default "All Lines of Business"): `All | ACA | Employer Group | Health | life | Life | Senior Products`
- **Carrier filter** (default "All Carriers"): ~350 options incl. Aetna, Allstate, Ambetter, AmeriHealth, Anthem, Assurity, BCBS (IL/AZ/NM/OK/TX), Capital Blue Cross, Cigna, Devoted health, Humana, Kaiser, Metro, Molina, Oscar, Select Health, UPMC, plus many `Auto Carrier *` test carriers. Alphabetically sorted.
- **Columns** toggle (testid `data-grid-columns-button`)
- **Export grid data to Excel** (testid `data-grid-export-button`, filename `policies`)
- **Refresh grid data** (testid `data-grid-refresh-button`)
- Filters sentinel `all`; server params: `carrier`, `status`, `lineOfBusiness`, `search` (only when ≠ `all`)

### API list endpoint (GET `/api/v1/policy`)
- Query params: `limit`, `offset`, `lineOfBusiness`, `status`, `carrier`, `search`
- Validations: "Limit must be 0 or greater" / "Limit must be a valid number"; "Offset must be 0 or greater"; "Must be a valid UUID" (lob/carrier)
- Response: `{data, totalPolicies, activePolicies}`

---

## 2. Create Policy (`/policy/create`) — also powers Edit (`/policy/edit/{uuid}` via EditPolicy)

### Tabs (testid `policy-tab-navigation`)
- **General** · **Commission Structure**
- **Guard:** In create mode with unsaved policy, clicking Commission Structure shows toast: **"Please save the policy to proceed accessing commission structure."** (tab does not switch)
- General error banner testid `general-error`

### Policy Information section (testid `policy-information-section`)
| Field | Testid | Required | Notes |
|---|---|---|---|
| Policy No | `policy-no-input` | ✔ | free text |
| Policy Type | `policy-type-dropdown` | – | options from `GET /api/v1/policy/type` |
| Enrollment Type | `enrollment-type-dropdown` | ✔ | **Not Applicable / New to Medicare / Not New to Medicare / New to Advantage with Drug Plan** (API ints 0..3) |
| Application Date | `application-date-input` | – | MM/DD/YYYY |
| Number of Dependents | `number-of-dependents-input` | – | spinbutton, default 0; + dependents history grid |
| Premium Amount | `premium-amount-input` | optional | `$` prefixed spinbutton |
| Policy Status | `policy-status-dropdown` | ✔ | **Active / Lapsed / Cancelled / Expired** (0/1/2/3) |
| Sub-Type | `policy-subtype-dropdown` | – | from `GET /api/v1/policy/subtype` |
| Effective Date | `effective-date-input` | ✔ | MM/DD/YYYY |
| Termination Date | `termination-date-input` | conditional | **required when status = Lapsed/Cancelled/Expired** → "Termination Date is required" |
| Commission Amount | `commission-amount-input` | – | `$` prefixed |

### Product Information section (testid `product-information-section`)
- Product Name `product-name-dropdown` (`Select Product` until chosen) — required
- On selection: **Carrier Name, Product Type, Line of Business auto-filled + disabled**
- Product→carrier/LOB binding from `GET /api/v1/products`; when carrier type selected → `GET /api/v1/products/by-carrier-type/{carrierId}/{typeId}?alias=`
- No-match banner testid `product-match-error-banner`

### Agent Information section (testid `agent-information-section`)
- **Carrier Agent*** `carrier-agent-dropdown`
- **Producing/Writing Agent*** `producing-agent-dropdown` (field error testid `agent-id-error`)
- **Pay-to Agent*** `pay-to-agent-dropdown`
- Options: searchable "`code - First Last`" from `GET /api/v1/users/agents` (e.g. `90058 - TestAgent0058 TestAgent0058`)
- Reporting manager names via `{...}-reporting-manager-name`
- In Edit mode all three agent buttons are **disabled** (read-only)

### Member information section (testid `member-section`)
| Field | Testid | Required | Validation |
|---|---|---|---|
| First Name | `first-name-input` | ✔ | "Name must contain only alphabets and spaces" |
| Last Name | `last-name-input` | ✔ | same |
| Member Type | `member-type-dropdown` | – | **Individual / Group / Worksite** (0/1/2) |
| Date of Birth | `date-of-birth-input` | – | MM/DD/YYYY, not in future |
| Phone No | `phone-no-input` | – | 10-digit, auto-mask `(123) 45-…`; "Phone number must be exactly 10 digits" |
| Street Address | `street-address-input` | – | |
| City | `city-input` | – | |
| State | `state-dropdown` | – | ~50 US states (`US_STATES`) |
| Zip Code | `zip-code-input` | – | "ZIP code must be 5 or 9 digits" |

### Required-field summary (frontend `validateForm`)
Required: policyNo, policyStatus, enrollmentType, productName, agentId (producing), payToAgent, carrierAgent, firstName, lastName, effectiveDate.
Default message: "`{camelCaseField} is required`" except carrierAgent → **"Carrier agent is required"**.
Premium Amount is **optional**.

### Date validation (frontend)
- `effectiveDate`: accepts MM/DD/YYYY or YYYY-MM-DD → else **"Invalid date format (MM/DD/YYYY)"**
- `applicationDate / terminationDate / dateOfBirth`: strict MM/DD/YYYY → **"Invalid date format (MM/DD/YYYY)"**

### Dependents history grid (testid `dependents-history-grid`)
- Columns: No of Dependents / Start Date / End Date / Actions
- Rules: active record `noOfDependents ≥ 1`; start date required; end date required when >1 record; end > start (not equal); "Current" end cannot overlap next start
- Toasts: "Please add start date in the dependents history record." / "End date must be greater than start date in dependents history." / `A record with "Current" end date cannot overlap with the next record's start date.` / "Dependents history has overlapping or invalid date ranges."

### Save flow
- Save button (testid `save-policy-button`) **disabled until required fields valid**
- `POST /api/v1/policy` (create; headers `X-SERVICE-NAME: pieq-insurance-app`) · `PUT /api/v1/policy/{uuid}` (update; 30s timeout, 3 retries)
- On success → navigate back to list + toast
- Cancel button (testid `cancel-button`) → navigates to `/policy` (with changes → beforeunload guard)

### Backend validations (server-side, mirrored to form fields)
- **"This policy number already exists for this carrier. Please enter a valid policy number."** (unique per carrier; update self-exempt) — code `POLICY_NUMBER_EXISTS`
- "Please provide a policy number." / "Please provide the first name." / last name / effective date (MISSING_REQUIRED_FIELD)
- **"The application date must be before the effective date."**
- **"The termination date must be after the effective date."**
- **"Please provide a valid date of birth. The date cannot be in the future."**
- "Please provide a valid phone number with exactly 10 digits."
- "Please provide a valid zipcode with either 5 or 9 digits."
- "Invalid status ... Valid statuses are: 0 (Active), 1 (Lapsed), 2 (Cancelled), 3 (Expired)."
- **Member state coverage:** "Product state coverage information is not available for the selected product." / "Product does not provide coverage for member state '{state}'." — member state must be in product `state_coverage` CSV or product covers `ALL`
- Reminder: server only enforces version ≥1 + non-empty split on commission (no %-sums-100 server check — frontend-owned)

### HTTP endpoints (API `icm-policy-api-main`, base `/api/v1/policy`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/policy` | list (params: limit/offset/status/lineOfBusiness/carrier/search) |
| GET | `/policy/{uuid}` | get one |
| POST | `/policy` | create |
| PUT | `/policy/{uuid}` | update |
| DELETE | `/policy/{uuid}` | cancel (Active→Cancelled only, requires active) |
| POST | `/policy/commission` | save policy commissions (array) |
| PUT | `/policy/commission/{uuid}` | update commission |
| GET | `/policy/{uuid}/commissions` | get commissions (with effectiveDate+paidToDate filter: both required) |
| GET | `/policy/type` `/policy/subtype` | type/sub-type option lists |
| GET | `/policy/exists/{policyNumber}` | dup-number check (carrierUuid required param) |
| GET | `/policy/payto` `/policy/team` | scoped lists |
| POST | `/policy/data-import` + `/data-import/validate` | bulk import |

---

## 3. Edit Policy (`/policy/edit/{uuid}`)

- Loads `GET /api/v1/policy/{uuid}`; header shows **policy number (h1)** + "Carrier: {carrier}" + status chip (e.g. `ACTIVE`)
- Back button (testid `back-button`)
- Error states: "Policy UUID is required" / "No authentication token available" / "Failed to load policy. Please try again." (screen: "Error Loading Policy" + `go-back-button`)
- Prefills General + Commission Structure from response
- **Product/Agent fields disabled** in edit (product name, carrier agent, writing agent, pay-to agent)

---

## 4. Commission Structure tab (create + edit; testid `commission-structure-section`)

### Existing rule cards
- Cards per commission type, label format **"{V1} | {M1-No limit} | {value}"** e.g. `Commission V1 | M1-No limit | 10%`, `Bonus V1 | M1-No limit | $200.00` (testid `{type}-commission-button`, `{type}-badge`)
- `Add Commission Type` button (testid `add-commission-type-button`) opens drawer (testid `add-commission-type-drawer`)

### Commission Configuration (testid `commission-structure-section`)
| Field | Testid | Values |
|---|---|---|
| Rule Name | `rule-name-input` | free text (e.g. "COMMISSION Aetna Aetna-Test-Product") |
| Commission Type | `commission-type-dropdown` | **Commission / Renewal / Bonus / Override** (1-4) |
| Month From | `month-from-input` | 1..12 — **1** |
| Payout Method | `payout-method-input` | **PERCENTAGE / Fixed Fee** (1=Fixed Fee, 2=Percentage) |
| Payment Frequency | `payment-frequency-dropdown` | **Monthly / Quarterly / Half Yearly / Annual** (1-4) |
| Month To | `month-to-input` | blank = ongoing; must ≥ month from |
| Percentage % | `percentage-...` | up to 4 digits + 2 decimals, **max 999** |
| Fee Amount | `fee-amount-input` | $ |
| Calculated Commission Amount | `calculated-commission-amount-input` | **Premium × %** (read-only calc) |
| Premium Amount | shown from policy | |

- FMV product: payout method forced to Fixed Fee → toast **"Product is FMV. Payout method changed from percentage to fixed fee."**; warning **"This product is FMV and requires a fixed fee payout method. Change payout method to Fixed Fee."**

### Commission Split Hierarchy
- 4 fixed rows: **Agency / Sales Leader / Agent / Sub Agent**
- Row fields: Role (dropdown), Name (agent dropdown), Level (text), % (Split), $ (Share), Actions (Delete split)
- Testids: `split-role-*`, `split-name-*`, `split-level-*`, `split-dollar-*`, `split-share-dollars-*`, `delete-split-*`
- Example observed (premium $18,000, 10% = $1,800): Agency 5% $90 / Sales Leader 20% $360 / Agent 75% $1,350 / Sub Agent 0% $0
- Footer: **"Total: 100.00%" / "Expected: 100.00%"** — split-% must total 100
- Cap error testid `commission-hierarchy-split-cap-error`; message when splits exceed 100%: **"These splits cannot add up to more than 100%. Reduce another split or enter a smaller value."** — displayed as inputs are altered; save/update blocked until corrected
- `Save Commissions` button (testid `save-commissions-button`) disabled until valid; `Preview Ledger` button opens modal (testid `commission-ledger-preview`) with Month/Commission Type/Frequency/Amount/Status table (Receivable/Paid/Pending badges)

### Commission endpoints
- `POST /api/v1/policy/commission` (array, forced version 1) · `PUT /api/v1/policy/commission/{uuid}` (version optimistic-lock)

---

## 5. Enums reference
| Concept | Values |
|---|---|
| Policy status | 0 Active / 1 Lapsed / 2 Cancelled / 3 Expired |
| Commission type | 1 Commission / 2 Renewal / 3 Bonus / 4 Override |
| Payout method | 1 Fixed Fee / 2 Percentage |
| Payment frequency | 1 Monthly / 2 Quarterly / 3 Half Yearly / 4 Annual |
| Enrollment type | 0 Not Applicable / 1 New to Medicare / 2 Not New to Medicare / 3 New to Advantage with Drug Plan |
| Member type | 0 Individual / 1 Group / 2 Worksite |
| Split roles | Agency / Sales Leader / Agent / Sub Agent |

## 6. Test data notes
- Stable test agents: `90058 - TestAgent0058`, `90057 - TestAgent0057`, `0987654321 - DevaTest Agent` (LVL1)
- Stable test products: `Aetna-Test-Product` (Carrier Aetna, type ACA, LOB Health), `Atena-ACA-Test-08Sep2026-*` (ephemeral)
- Stable policies: `ATENA-MMP-TEST-A076` (Aetna), `TRAN001-A00-*` (Aetna/DevaTest)
- Product state coverage verified on test product; LOB filter values: ACA, Employer Group, Health, life, Life, Senior Products