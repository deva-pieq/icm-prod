@policy-master @regression-test @icm
Feature: Policy Master — list, search, filter, create, edit, and commission structure

  Ops Manager Policy Master regression (covers .opencode/scenarios/policy-regression.csv 1:1).
  Live labels harvested via Playwright MCP and verified against icm-policy-spa-main /
  icm-policy-api-main sources. Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for policy master tests

  @policy-master @list @TEST-001-Policy-Master-PROD
  Scenario: T001-POL-LST — Policy list page loads with correct heading and subtitle
    When I open the policy master list in policy master
    Then the policy master list heading "Policy" is displayed
    And the policy master subtitle is displayed
    And the Add Policy button is visible on policy master list

  @policy-master @list @TEST-002-Policy-Master-PROD
  Scenario: T002-POL-SUM — Summary cards display total and active policy counts
    When I open the policy master list in policy master
    Then the Total Policies card shows a count with "Across all carriers"
    And the Active Policies card shows a count with "of total"

  @policy-master @list @TEST-003-Policy-Master-PROD
  Scenario: T003-POL-GRD — Grid displays all required columns
    When I open the policy master list in policy master
    Then the policy master grid shows columns "Policy Information", "Member", "Agent", "Carrier & Product", "Status", "Actions"

  @policy-master @list @TEST-004-Policy-Master-PROD
  Scenario: T004-POL-FTR — Footer shows record count
    When I open the policy master list in policy master
    Then the policy master footer shows record count

  @policy-master @list @search @TEST-005-Policy-Master-PROD
  Scenario: T005-POL-SRC — Search placeholder is displayed
    When I open the policy master list in policy master
    Then the policy master search placeholder contains "Search policies"

  @policy-master @list @search @TEST-049-Policy-Master-PROD
  Scenario: T049-POL-HEP — Search helper text is displayed
    When I open the policy master list in policy master
    Then the policy master search helper text is displayed

  @policy-master @list @search @TEST-044-Policy-Master-PROD
  Scenario: T044-POL-SPN — Search filters policies by policy number
    When I open the policy master list in policy master
    When I search policy master for a policy number from the first row
    Then the policy master grid rows all match the search term

  @policy-master @list @search @TEST-045-Policy-Master-PROD
  Scenario: T045-POL-SMN — Search filters policies by member name
    When I open the policy master list in policy master
    When I search policy master for a member text from the first row
    Then the policy master grid rows all match the search term

  @policy-master @list @search @TEST-046-Policy-Master-PROD
  Scenario: T046-POL-SAG — Search filters policies by agent or carrier
    When I open the policy master list in policy master
    When I search policy master for an agent text from the first row
    Then the policy master grid shows at least one matching row

  @policy-master @list @search @TEST-006-Policy-Master-PROD
  Scenario: T006-POL-SNF — Search with no matching results shows empty state
    When I open the policy master list in policy master
    When I search policy master for "zzz-no-policy-xyz"
    Then the policy master grid shows no records found

  @policy-master @list @filter @TEST-007-Policy-Master-PROD
  Scenario: T007-POL-FST — Status filter dropdown lists all status options
    When I open the policy master list in policy master
    Then the policy master status filter shows options "All Status", "Active", "Lapsed", "Cancelled", "Expired"

  @policy-master @list @filter @TEST-008-Policy-Master-PROD
  Scenario: T008-POL-FAC — Filter by Active status narrows grid to Active policies
    When I open the policy master list in policy master
    And I filter policy master by status "Active"
    Then all visible policy master rows have status "Active"

  @policy-master @list @filter @TEST-026-Policy-Master-PROD
  Scenario: T026-POL-LOB — Line of Business filter narrows the grid to selected LOB
    When I open the policy master list in policy master
    When I filter policy master by line of business "Health"
    Then the policy master grid remains populated after filtering

  @policy-master @list @filter @TEST-027-Policy-Master-PROD
  Scenario: T027-POL-CAR — Carrier filter narrows the grid to selected carrier
    When I open the policy master list in policy master
    When I filter policy master by carrier "Aetna"
    Then the first policy master row carrier is "Aetna"

  @policy-master @list @filter @TEST-028-Policy-Master-PROD
  Scenario: T028-POL-FCB — Combining Status and Carrier filters returns intersection
    When I open the policy master list in policy master
    When I select both Active status and carrier "Aetna" in policy master filters
    Then all policy master rows are filtered to status "Active"
    And the first policy master row carrier is "Aetna"

  @policy-master @list @TEST-011-Policy-Master-PROD
  Scenario: T011-POL-CLM — Columns toggle button is visible on policy list
    When I open the policy master list in policy master
    Then the policy master columns toggle is visible

  @policy-master @list @TEST-047-Policy-Master-PROD
  Scenario: T047-POL-EXD — Export grid data to Excel downloads a file
    When I open the policy master list in policy master
    When I export the policy master grid data to excel
    Then an excel file named "policies" is downloaded on policy master

  @policy-master @list @TEST-048-Policy-Master-PROD
  Scenario: T048-POL-RFD — Refresh grid data reloads the grid
    When I open the policy master list in policy master
    When I refresh the policy master grid data
    Then the policy master grid reloads with data

  @policy-master @list @TEST-009-Policy-Master-PROD
  Scenario: T009-POL-EXP — Export button is visible on policy list
    When I open the policy master list in policy master
    Then the policy master export button is visible

  @policy-master @list @TEST-010-Policy-Master-PROD
  Scenario: T010-POL-RFR — Refresh button reloads grid data
    When I open the policy master list in policy master
    Then the policy master refresh button is visible

  @policy-master @list @TEST-025-Policy-Master-PROD
  Scenario: T025-POL-RWD — Grid rows show policy, member, agent and status details
    When I open the policy master list in policy master
    Then the policy master grid row shows policy and member details

  @policy-master @list @actions @TEST-023-Policy-Master-PROD
  Scenario: T023-POL-ACT — Actions kebab menu offers Edit and View Ledger
    When I open the policy master list in policy master
    Then the policy master grid shows action kebab menus

  @policy-master @list @TEST-076-Policy-Master-PROD
  Scenario: T076-POL-LDF — Policy list load failure surfaces error toast
    When the policy master list API fails to load
    Then the policy master load failure toast is displayed

  @policy-master @create @TEST-012-Policy-Master-PROD
  Scenario: T012-POL-ADD — Add Policy button navigates to Create Policy page
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master create page heading "Add Policy" is displayed

  @policy-master @create @validation @TEST-013-Policy-Master-PROD
  Scenario: T013-POL-SDI — Save button is disabled when required fields are empty on create
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master Save button is disabled

  @policy-master @create @validation @TEST-058-Policy-Master-PROD
  Scenario: T058-POL-RFM — Required field validation for empty Create Policy form
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then an empty create policy form enforces required fields via a disabled Save

  @policy-master @create @validation @TEST-038-Policy-Master-PROD
  Scenario: T038-POL-BPN — Blank Policy Number blocks save on create
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master Save button is disabled with blank policy number

  @policy-master @create @validation @TEST-031-Policy-Master-PROD
Scenario: T031-POL-FNM — First Name rejects non-alphabetic characters
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I fill a valid policy form with premium on policy master create
    When I enter first name "John123" on policy master create
    And I try to save the policy master create
    Then the policy master validation error "Name must contain only alphabets and spaces" is displayed

  @policy-master @create @validation @TEST-059-Policy-Master-PROD
  Scenario: T059-POL-PHN — Phone No validation requires exactly 10 digits
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I fill a valid policy form with premium on policy master create
    When I enter phone number "12345" on policy master create
    And I try to save the policy master create
    Then the policy master phone validation error is displayed

  @policy-master @create @validation @TEST-060-Policy-Master-PROD
  Scenario: T060-POL-ZIP — Zip Code validation requires 5 or 9 digits
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I fill a valid policy form with premium on policy master create
    When I enter zip code "12" on policy master create
    And I try to save the policy master create
    Then the policy master zip validation error is displayed

  @policy-master @create @validation @TEST-061-Policy-Master-PROD
  Scenario: T061-POL-DTE — Date fields enforce only MM/DD/YYYY via read-only pickers
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master date fields are read-only masked pickers

  @policy-master @create @dropdown @TEST-014-Policy-Master-PROD
  Scenario: T014-POL-ENT — Enrollment Type dropdown lists all four options
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the Enrollment Type dropdown shows options "Not Applicable", "New to Medicare", "Not New to Medicare", "New to Advantage with Drug Plan"

  @policy-master @create @dropdown @TEST-029-Policy-Master-PROD
  Scenario: T029-POL-PST — Policy Status dropdown lists all status options
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master status dropdown lists all status options

  @policy-master @create @validation @TEST-030-Policy-Master-PROD
  Scenario: T030-POL-TRM — Termination Date becomes required for non-active status
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master termination date is required for non-active status

  @policy-master @create @dropdown @TEST-035-Policy-Master-PROD
  Scenario: T035-POL-PRD — Selecting a Product auto-fills Carrier, Type and LOB read-only
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then a product selection auto-fills carrier and line of business on policy master create

  @policy-master @create @dropdown @TEST-036-Policy-Master-PROD
  Scenario: T036-POL-AGT — Agent dropdowns are searchable with code - name options
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master agent dropdown is searchable with code dash name

  @policy-master @create @dropdown @TEST-015-Policy-Master-PROD
  Scenario: T015-POL-MBR — Member Type dropdown lists Individual, Group and Worksite
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the Member Type dropdown shows options "Individual", "Group", "Worksite"

  @policy-master @create @dropdown @TEST-037-Policy-Master-PROD
  Scenario: T037-POL-STT — State dropdown lists US states
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master state dropdown lists US states

  @policy-master @create @validation @TEST-034-Policy-Master-PROD
  Scenario: T034-POL-DAT — Effective Date is a read-only MM/DD/YYYY date picker
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master effective date is a read-only date picker

  @policy-master @create @validation @TEST-062-Policy-Master-PROD
  Scenario: T062-POL-PRM — Premium Amount is optional
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I fill a valid policy form without premium on policy master create
    Then the policy master Save button is enabled without premium

  @policy-master @create @validation @TEST-077-Policy-Master-PROD
  Scenario: T077-POL-NEG — Negative Premium Amount is rejected
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I fill a valid policy form with premium on policy master create
    When I enter a negative premium amount on policy master create
    And I try to save the policy master create
    Then the policy master negative premium validation error is displayed

  @policy-master @create @commission @TEST-039-Policy-Master-PROD
  Scenario: T039-POL-GRD — Commission Structure tab is guarded until policy is saved
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    Then the policy master commission guard toast is displayed

  @policy-master @create @validation @TEST-069-Policy-Master-PROD
  Scenario: T069-POL-ADB — Application Date after Effective Date is rejected
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I set application date after the effective date on policy master create
    Then the policy master application date must be before effective error is displayed

  @policy-master @create @validation @TEST-075-Policy-Master-PROD
  Scenario: T075-POL-ADE — Application Date equal to Effective Date is rejected
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I set application date equal to the effective date on policy master create
    Then the policy master application date must be before effective error is displayed

  @policy-master @create @validation @TEST-070-Policy-Master-PROD
  Scenario: T070-POL-DOB — DOB cannot be in the future (backend rule)
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I set a future date of birth on policy master create
    And I try to save the policy master create
    Then the policy master future date of birth error is displayed

  @policy-master @create @validation @TEST-071-Policy-Master-PROD
  Scenario: T071-POL-STC — Member state must be covered by the selected product
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I set member state "IL" on policy master create
    And I try to save the policy master create
    Then the policy master product state coverage error is displayed

@policy-master @create @validation @TEST-078-Policy-Master-PROD
  Scenario: T078-POL-FLF — Create Policy server failure keeps form data and shows an error
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When the policy master create API fails to save
    When I fill a valid policy form with premium on policy master create
    And I try to save the policy master create
    Then an error is displayed on the policy master create form
    And the policy master create form retains the entered values

  @policy-master @create @TEST-063-Policy-Master-PROD
  Scenario: T063-POL-DUP — Duplicate policy number is rejected for the same carrier
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I create a valid policy on policy master
    Then the policy master policy is created successfully
    When I again create the same policy on policy master
    Then the policy master duplicate policy error is displayed

  @policy-master @create @happy-path @TEST-064-Policy-Master-PROD
  Scenario: T064-POL-CRE — Create policy happy path with valid data
    When I open the policy master list in policy master
    When I click the Add Policy button on policy master
    When I create a valid policy on policy master
    Then the policy master policy is created successfully
    And the created policy appears in the policy master grid

  @policy-master @edit @TEST-016-Policy-Master-PROD
  Scenario: T016-POL-EDT — Clicking a policy row navigates to Edit Policy page
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the policy master edit page is displayed with prefilled data

  @policy-master @edit @TEST-018-Policy-Master-PROD
  Scenario: T018-POL-EDH — Edit page heading shows policy number and carrier
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the policy master edit heading is displayed

  @policy-master @edit @TEST-017-Policy-Master-PROD
  Scenario: T017-POL-PFD — Product and Agent fields are disabled in Edit mode
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the Product and Agent fields are disabled in policy master edit

  @policy-master @edit @validation @TEST-065-Policy-Master-PROD
  Scenario: T065-POL-TRE — Editing status to non-active enforces Termination Date
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I change the policy status to "Cancelled" in policy master edit
    Then the policy master Save button is disabled without termination date
    And the policy master termination date field is displayed

  @policy-master @edit @validation @TEST-074-Policy-Master-PROD
  Scenario: T074-POL-TBE — Termination Date before Effective Date is rejected
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I change the policy status to "Cancelled" in policy master edit
    When I set a termination date before the effective date on policy master
    Then the policy master termination after effective error is displayed

@policy-master @edit @navigation @TEST-066-Policy-Master-PROD
  Scenario: T066-POL-DSC �?" Cancel with unsaved changes discards and returns to list
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I modify the policy number in policy master edit
    And I click cancel on policy master edit
    Then I am on the policy master list page

  @policy-master @edit @navigation @TEST-024-Policy-Master-PROD
  Scenario: T024-POL-BCK — Back navigation returns to policy list
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I navigate back from policy master edit
    Then I am on the policy master list page

  @policy-master @commission @TEST-019-Policy-Master-PROD
  Scenario: T019-POL-CST — Commission Structure tab is visible on edit page
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the Commission Structure tab is visible in policy master

  @policy-master @commission @TEST-020-Policy-Master-PROD
  Scenario: T020-POL-CSC — Commission Structure section loads after clicking tab
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the Commission Structure section is visible in policy master

  @policy-master @commission @TEST-051-Policy-Master-PROD
  Scenario: T051-POL-RUL — Commission tab renders existing rule cards with captions
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master existing commission rule cards are displayed with captions

  @policy-master @commission @TEST-021-Policy-Master-PROD
  Scenario: T021-POL-ADD — Add Commission Type button opens drawer
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I click the Add Commission Type button in policy master
    Then the Add Commission Type drawer is visible in policy master

  @policy-master @commission @TEST-040-Policy-Master-PROD
  Scenario: T040-POL-PAY — Payout Method and Payment Frequency options are listed
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I click the Add Commission Type button in policy master
    Then the policy master commission payout and frequency options are displayed

  @policy-master @commission @validation @TEST-043-Policy-Master-PROD
  Scenario: T043-POL-BLK — Commission split below 100 percent blocks save
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master commission save is blocked with split below one hundred percent

  @policy-master @commission @validation @TEST-022-Policy-Master-PROD
  Scenario: T022-POL-SPL — Commission split above 100 percent shows error and blocks save
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I alter the opening split to exceed one hundred percent on policy master
    Then the commission split cap error is displayed
    And the policy master commission save is blocked above one hundred percent

  @policy-master @commission @TEST-042-Policy-Master-PROD
  Scenario: T042-POL-SPT — Commission split hierarchy totals 100 percent with dollar split
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master commission split totals one hundred percent

  @policy-master @commission @validation @TEST-054-Policy-Master-PROD
  Scenario: T054-POL-MTH — Month From after Month To shows validation error
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I set month from "12" and month to "3" on policy master commission
    Then the policy master month range error is displayed

  @policy-master @commission @validation @TEST-055-Policy-Master-PROD
  Scenario: T055-POL-PMX — Commission percentage above maximum limit is rejected
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I enter percentage "1000" on policy master commission
    Then the policy master percentage max error is displayed

  @policy-master @commission @TEST-068-Policy-Master-PROD
  Scenario: T068-POL-CLC — Calculated Commission Amount equals Premium x Percentage
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master calculated commission amount equals premium times percentage

@policy-master @commission @TEST-052-Policy-Master-PROD
  Scenario: T052-POL-PRV — Preview Ledger button is disabled until a commission change
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master preview ledger button is disabled in policy master edit

  @policy-master @commission @TEST-053-Policy-Master-PROD
  Scenario: T053-POL-SVC — Save Commissions persists commission structure
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    When I click save commissions in policy master
    Then the policy master commissions are saved successfully

  @policy-master @commission @bug @TEST-056-Policy-Master-PROD
  Scenario: T056-POL-FMV — FMV product with Percentage payout forces Fixed Fee
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master FMV fixed fee requirement is displayed for FMV products
    # Known issue: only surfaces when the selected policy uses an FMV product; otherwise section shows PERCENTAGE normally

  @policy-master @commission @validation @bug @TEST-057-Policy-Master-PROD
  Scenario: T057-POL-SUB — Sub-agent split without reporting manager error
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master sub-agent reporting hierarchy is consistent
    # Known issue: requires a sub-agent split configured with incomplete reporting hierarchy

  @policy-master @commission @bug @TEST-072-Policy-Master-PROD
  Scenario: T072-POL-EMN — Commission rule with empty rule name is rejected
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master commission rule name validation error is displayed
    # Known issue (divergence): SPA auto-generates read-only rule names; no empty-name path exists

  @policy-master @commission @bug @TEST-073-Policy-Master-PROD
  Scenario: T073-POL-DUP — Duplicate commission rule cannot be added
    When I open the policy master list in policy master
    When I open policy master edit by row click
    When I click the Commission Structure tab in policy master
    Then the policy master duplicate commission rule is rejected
    # Known issue (divergence): one commission pill per type+month; no duplicate path exists

  @policy-master @member @bug @TEST-079-Policy-Master-PROD
  Scenario: T079-POL-DTH — Dependents history To date before From date is rejected
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the policy master dependents history invalid date range error is displayed
    # Known issue (divergence): dependents history grid is not wired into the policy form (number-of-dependents field only)

  @policy-master @member @bug @TEST-080-Policy-Master-PROD
  Scenario: T080-POL-DTD — Dependents history entry without From or To date is rejected
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the policy master dependents history missing date error is displayed
    # Known issue (divergence): dependents history grid is not wired into the policy form

  @policy-master @member @TEST-081-Policy-Master-PROD
  Scenario: T081-POL-DNO — Dependents No accepts only a valid positive number
    When I open the policy master list in policy master
    When I open policy master edit by row click
    Then the policy master dependents number validation is consistent
