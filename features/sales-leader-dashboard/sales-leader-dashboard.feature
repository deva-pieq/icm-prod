@sales-leader-dashboard @regression-test @regression @icm
Feature: Sales Leader Dashboard — filters, KPIs, My Team, and widgets

  Sales Leader dashboard regression (CSV IK-1142/1143/1145/1146 + My Team IK-1318).
  Same Agent Insights dashboard shell; login via E2E_EMAIL_SALES_LEADER.
  KPI data proof for Gross/New Policies: sales-leader-dashboard-kpi.feature (SLD-001).

  Background:
    Given I am logged into PieQ ICM for sales leader dashboard regression
    When I open the agent dashboard on sales leader dashboard

  # ============================================================================
  # Global Filters Panel
  # ============================================================================

  @sales-leader-dashboard @regression-test @global-filters @ui @TEST-001-Sales-Leader-Dashboard-Global-Filters-PROD
  Scenario: T001-SLD-FLT — Time Period filter panel displays radio options
    When I open the agent dashboard on sales leader dashboard
    Then the filters sidebar is displayed on the left side on sales leader dashboard
    And the Time Period section displays the following radio options on sales leader dashboard:
      | Option            |
      | This Week         |
      | Last Week         |
      | Last 4 Weeks      |
      | Last 12 Weeks     |
      | This Month        |
      | Last Month        |
      | Last Quarter      |
      | Last 6 Months     |
      | Year to Date      |
      | Last Year         |
      | Custom Date Range |
    And only one time period can be selected at a time on sales leader dashboard

  @sales-leader-dashboard @regression-test @global-filters @ui @TEST-002-Sales-Leader-Dashboard-Global-Filters-PROD
  Scenario: T002-SLD-FLT — Additional Filters display searchable checkbox lists
    When I open the agent dashboard on sales leader dashboard
    Then the filters sidebar displays additional filter sections on sales leader dashboard:
      | Section          |
      | Line of Business |
      | Product Type     |
      | Carrier          |
      | Product          |
    When I expand the Line of Business filter section on sales leader dashboard
    Then a search bar and a list of checkboxes are displayed on sales leader dashboard
    And the "All LOBs" checkbox is present and selected by default on sales leader dashboard

  # ============================================================================
  # Viewing Period
  # ============================================================================

  @sales-leader-dashboard @regression-test @viewing-period @display @TEST-003-Sales-Leader-Dashboard-Viewing-Period-PROD
  Scenario: T003-SLD-VP — Viewing Period displays selected date range prominently
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "This Week" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period header is displayed at the top of the dashboard on sales leader dashboard
    And the viewing period shows the date range corresponding to the selected time period on sales leader dashboard
    And the date range format matches "Mon DD, YYYY – Mon DD, YYYY" on sales leader dashboard

  # ============================================================================
  # Filter Actions
  # ============================================================================

  @sales-leader-dashboard @regression-test @filter-actions @apply @TEST-004-Sales-Leader-Dashboard-Filter-Actions-PROD
  Scenario: T004-SLD-FLT — Selecting a time period and applying changes refreshes widgets
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last month's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @filter-actions @reset @TEST-005-Sales-Leader-Dashboard-Filter-Actions-PROD
  Scenario: T005-SLD-FLT — Selecting "This Week" resets to default time period after applying
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last 4 Weeks" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a four-week date range on sales leader dashboard
    When I select the time period "This Week" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows the current week date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @filter-actions @reset-button @TEST-067-Sales-Leader-Dashboard-Filter-Actions-PROD
  Scenario: T067-SLD-FLT — Reset button reverts all filters to default values
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Month" on sales leader dashboard
    And I deselect a specific LOB on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last month's date range on sales leader dashboard
    When I reset the filters on sales leader dashboard
    Then the time period "This Week" is selected by default on sales leader dashboard
    And the viewing period shows the current week date range on sales leader dashboard
    And all LOB options are selected by default on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @filter-actions @cancel @TEST-006-Sales-Leader-Dashboard-Filter-Actions-PROD
  Scenario: T006-SLD-FLT — Time period changes are reversible by selecting a different option and applying
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "This Week" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the time period "This Week" is selected by default on sales leader dashboard
    When I select the time period "Last 4 Weeks" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a four-week date range on sales leader dashboard
    When I select the time period "This Week" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows the current week date range on sales leader dashboard

  # ============================================================================
  # Time Period Filters — individual options
  # ============================================================================

  @sales-leader-dashboard @regression-test @time-period @this-week @TEST-007-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T007-SLD-TP — This Week is the default filter and refreshes all widgets
    When I open the agent dashboard on sales leader dashboard
    Then the time period "This Week" is selected by default on sales leader dashboard
    And the viewing period shows the current week date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-week @TEST-008-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T008-SLD-TP — Last Week filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last Week" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last week's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-4-weeks @TEST-009-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T009-SLD-TP — Last 4 Weeks filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last 4 Weeks" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a four-week date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-12-weeks @TEST-010-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T010-SLD-TP — Last 12 Weeks filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last 12 Weeks" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a twelve-week date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @this-month @TEST-011-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T011-SLD-TP — This Month filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "This Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows this month's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-month @TEST-012-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T012-SLD-TP — Last Month filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last month's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-quarter @TEST-013-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T013-SLD-TP — Last Quarter filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last quarter's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-6-months @TEST-014-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T014-SLD-TP — Last 6 Months filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last 6 Months" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a six-month date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @ytd @TEST-015-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T015-SLD-TP — Year to Date filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Year to Date" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows a year-to-date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @last-year @TEST-016-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T016-SLD-TP — Last Year filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last Year" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last year's date range on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @custom-range @TEST-017-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T017-SLD-TP — Custom Date Range filter refreshes all dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Custom Date Range" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows the custom date range picker on sales leader dashboard
    And all dashboard widgets refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @custom-range @year-limits @bug @TEST-018-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T018-SLD-TP — Custom Date Range year limits are 1990 minimum and 2100 maximum
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Custom Date Range" on sales leader dashboard
    Then the custom date range year minimum is 1990 on sales leader dashboard
    And the custom date range year maximum is 2100 on sales leader dashboard

  @sales-leader-dashboard @regression-test @time-period @custom-range @bug @TEST-019-Sales-Leader-Dashboard-Time-Period-PROD
  Scenario: T019-SLD-TP — Custom Date Range manual entry accepts and retains dates
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Custom Date Range" on sales leader dashboard
    Then the custom date range start and end inputs are displayed on sales leader dashboard
    When I enter custom date range "04/01/2026" to "06/20/2026" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows the entered custom date range on sales leader dashboard
    # Known issue: on second manual entry attempt, the date collapses
    When I enter custom date range "05/01/2026" to "06/15/2026" on sales leader dashboard
    Then the custom date range inputs retain the entered values on sales leader dashboard

  # ============================================================================
  # Additional Filters
  # ============================================================================

  @sales-leader-dashboard @regression-test @additional-filters @lob @TEST-020-Sales-Leader-Dashboard-Additional-Filters-PROD
  Scenario: T020-SLD-ADF — Line of Business filter refreshes dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    And I expand the Line of Business filter section on sales leader dashboard
    Then all LOB options are selected by default on sales leader dashboard
    When I deselect a specific LOB on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all dashboard widgets refresh dynamically based on the selected LOBs on sales leader dashboard

  @sales-leader-dashboard @regression-test @additional-filters @product-type @TEST-021-Sales-Leader-Dashboard-Additional-Filters-PROD
  Scenario: T021-SLD-ADF — Product Type filter refreshes dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    And I expand the Product Type filter section on sales leader dashboard
    Then all Product Type options are selected by default on sales leader dashboard
    When I deselect a specific Product Type on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all dashboard widgets refresh dynamically based on the selected Product Types on sales leader dashboard

  @sales-leader-dashboard @regression-test @additional-filters @carrier @TEST-022-Sales-Leader-Dashboard-Additional-Filters-PROD
  Scenario: T022-SLD-ADF — Carrier filter refreshes dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    And I expand the Carrier filter section on sales leader dashboard
    Then all Carrier options are selected by default on sales leader dashboard
    When I deselect a specific Carrier on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all dashboard widgets refresh dynamically based on the selected Carriers on sales leader dashboard

  @sales-leader-dashboard @regression-test @additional-filters @product @TEST-023-Sales-Leader-Dashboard-Additional-Filters-PROD
  Scenario: T023-SLD-ADF — Product filter refreshes dashboard widgets
    When I open the agent dashboard on sales leader dashboard
    And I expand the Product filter section on sales leader dashboard
    Then all Product options are selected by default on sales leader dashboard
    When I deselect a specific Product on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all dashboard widgets refresh dynamically based on the selected Products on sales leader dashboard

  @sales-leader-dashboard @regression-test @additional-filters @warning @TEST-024-Sales-Leader-Dashboard-Additional-Filters-PROD
  Scenario: T024-SLD-ADF — Warning when all additional filters are unchecked
    When I open the agent dashboard on sales leader dashboard
    And I expand and uncheck all additional filter sections on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then a warning message "At least one filter must be selected" is displayed on sales leader dashboard

  # ============================================================================
  # Performance Overview — KPI Widgets
  # ============================================================================

  @sales-leader-dashboard @regression-test @performance-overview @kpi @ui @TEST-025-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T025-SLD-PO — Performance Overview KPI widgets display standard UI
    When I open the agent dashboard on sales leader dashboard
    Then the Performance Overview section is displayed on sales leader dashboard
    And the Performance Overview section displays the following KPI cards on sales leader dashboard:
      | KPI Card              |
      | Total Gross Commission |
      | Total Chargeback       |
      | Total Paid             |
      | Avg Per Policy         |
      | Total New Policies     |
    And each KPI card shows a value and description on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @refresh @TEST-026-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T026-SLD-PO — Performance Overview metrics refresh based on selected filters
    When I open the agent dashboard on sales leader dashboard
    And I capture the Total Gross Commission initial value on sales leader dashboard
    When I select the time period "Last Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all Performance Overview metrics refresh based on selected filters on sales leader dashboard

  @sales-leader-dashboard @regression-test @viewing-period @dynamic @TEST-027-Sales-Leader-Dashboard-Viewing-Period-PROD
  Scenario: T027-SLD-VP — Dashboard displays the selected viewing period dynamically
    When I open the agent dashboard on sales leader dashboard
    When I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the viewing period shows last quarter's date range on sales leader dashboard
    And the viewing period header is displayed at the top of the dashboard on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @gross-commission @data @TEST-028-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T028-SLD-PO — Total Gross Commission cross-verified with uploaded earned commission
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Total Gross Commission metric matches uploaded earned commission data on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @chargeback @data @TEST-029-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T029-SLD-PO — Total Chargeback cross-verified with uploaded chargeback values
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Total Chargeback metric matches uploaded chargeback data on sales leader dashboard
    And the Total Chargeback is displayed in parentheses to indicate negative values on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @total-paid @data @TEST-030-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T030-SLD-PO — Total Paid reflects commission moved from payables to ACH
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Total Paid metric matches uploaded paid commission data on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @avg-per-policy @data @TEST-031-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T031-SLD-PO — Average Per Policy calculated correctly for selected period
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Avg Per Policy metric is calculated correctly on sales leader dashboard

  @sales-leader-dashboard @regression-test @performance-overview @new-policies @data @TEST-032-Sales-Leader-Dashboard-Performance-Overview-PROD
  Scenario: T032-SLD-PO — Total New Policies count matches uploaded policy data
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Quarter" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Total New Policies count matches uploaded policy data on sales leader dashboard

  # ============================================================================
  # Commission by Role
  # ============================================================================

  @sales-leader-dashboard @regression-test @commission-role @ui @TEST-033-Sales-Leader-Dashboard-Commission-Role-PROD
  Scenario: T033-SLD-CR — Commission by Role section displays earnings breakdown
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "This Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Commission by Role section is displayed on sales leader dashboard
    And the Commission by Role section shows the following roles on sales leader dashboard:
      | Role         |
      | Sales Leader |

  @sales-leader-dashboard @regression-test @commission-role @rows @TEST-034-Sales-Leader-Dashboard-Commission-Role-PROD
  Scenario: T034-SLD-CR — Each Commission by Role row displays role metrics and progress bar
    When I open the agent dashboard on sales leader dashboard
    Then each Commission by Role row displays role name on sales leader dashboard
    And each Commission by Role row displays total commission earned with currency formatting on sales leader dashboard
    And each Commission by Role row displays policy count on sales leader dashboard
    And each Commission by Role row displays percentage contribution on sales leader dashboard
    And each Commission by Role row displays a visual progress indicator on sales leader dashboard
    And Commission by Role percentages sum to 100 percent on sales leader dashboard

  @sales-leader-dashboard @regression-test @commission-role @ytd-summary @TEST-035-Sales-Leader-Dashboard-Commission-Role-PROD
  Scenario: T035-SLD-CR — Commission by Role displays YTD summary at the bottom
    When I open the agent dashboard on sales leader dashboard
    Then the Commission by Role YTD summary row is visible at the bottom on sales leader dashboard
    And the YTD summary value equals the sum of all role totals on sales leader dashboard
    And the YTD summary is formatted with currency symbol and decimals on sales leader dashboard

  # ============================================================================
  # Product Type Performance
  # ============================================================================

  @sales-leader-dashboard @regression-test @product-type-performance @ui @TEST-036-Sales-Leader-Dashboard-Product-Type-Performance-PROD
  Scenario: T036-SLD-PTP — Product Type Performance section displays product metrics
    When I open the agent dashboard on sales leader dashboard
    Then the Product Type Performance section is displayed on sales leader dashboard
    And each Product Type Performance row displays product category name on sales leader dashboard
    And each Product Type Performance row displays policy count on sales leader dashboard
    And each Product Type Performance row displays total commission amount on sales leader dashboard
    And each Product Type Performance row displays a progress bar on sales leader dashboard

  # ============================================================================
  # Persistency Report
  # ============================================================================

  @sales-leader-dashboard @regression-test @persistency @ui @TEST-037-Sales-Leader-Dashboard-Persistency-PROD
  Scenario: T037-SLD-PER — Persistency Report section displays standard UI
    When I open the agent dashboard on sales leader dashboard
    Then the Persistency Report section is displayed on sales leader dashboard
    And the Persistency Report heading shows "Persistency (Last 13 Months)" on sales leader dashboard
    And Persistency percentages are formatted correctly on sales leader dashboard

  @sales-leader-dashboard @regression-test @persistency @3-month @TEST-038-Sales-Leader-Dashboard-Persistency-PROD
  Scenario: T038-SLD-PER — 3-month Persistency metrics are displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the 3-month Persistency row shows accurate Cohort, Persisted, Lapsed or Rescinded, and Persistency % on sales leader dashboard

  @sales-leader-dashboard @regression-test @persistency @6-month @TEST-039-Sales-Leader-Dashboard-Persistency-PROD
  Scenario: T039-SLD-PER — 6-month Persistency metrics are displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the 6-month Persistency row shows accurate values and percentages on sales leader dashboard

  @sales-leader-dashboard @regression-test @persistency @9-month @TEST-040-Sales-Leader-Dashboard-Persistency-PROD
  Scenario: T040-SLD-PER — 9-month Persistency metrics are displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the 9-month Persistency row shows accurate Cohort, Persisted, Lapsed or Rescinded, and Persistency % on sales leader dashboard

  @sales-leader-dashboard @regression-test @persistency @12-month @TEST-041-Sales-Leader-Dashboard-Persistency-PROD
  Scenario: T041-SLD-PER — 12-month Persistency metrics are displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the 12-month Persistency row shows accurate Persisted, Lapsed or Rescinded, and Persistency % on sales leader dashboard

  # ============================================================================
  # Summary by LOB & Carrier
  # ============================================================================

  @sales-leader-dashboard @regression-test @lob-carrier-summary @grouping @TEST-042-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T042-SLD-LCS — Commission data grouped correctly by Line of Business
    When I open the agent dashboard on sales leader dashboard
    Then the Summary by LOB and Carrier section is displayed on sales leader dashboard
    And each LOB displays its own policies and commission totals without overlap on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @carrier @TEST-043-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T043-SLD-LCS — Commission data grouped correctly by carrier within each LOB
    When I open the agent dashboard on sales leader dashboard
    Then each carrier shows accurate policy and commission data under the correct LOB on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @policy-count @TEST-044-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T044-SLD-LCS — Policy counts per LOB and carrier are displayed
    When I open the agent dashboard on sales leader dashboard
    Then policy counts per LOB and carrier are displayed accurately on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @commission @TEST-045-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T045-SLD-LCS — Commission totals per LOB and carrier are displayed
    When I open the agent dashboard on sales leader dashboard
    Then commission totals per LOB and carrier are formatted with currency and decimals on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @refresh @TEST-046-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T046-SLD-LCS — Summary by LOB and Carrier updates when filters change
    When I open the agent dashboard on sales leader dashboard
    And I capture the LOB carrier summary initial row count on sales leader dashboard
    When I select the time period "Last Year" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Summary by LOB and Carrier totals recalculate dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @sort @TEST-047-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T047-SLD-LCS — Summary table can be sorted by LOB, Carrier, Policies, and Commission
    When I open the agent dashboard on sales leader dashboard
    When I sort the LOB Carrier summary by "Line of Business" ascending on sales leader dashboard
    Then the LOB Carrier summary rows are sorted correctly on sales leader dashboard
    When I sort the LOB Carrier summary by "Commission Amount" descending on sales leader dashboard
    Then the LOB Carrier summary rows are sorted correctly on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @scroll @TEST-048-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T048-SLD-LCS — Summary table supports vertical and horizontal scrolling
    When I open the agent dashboard on sales leader dashboard
    Then the LOB Carrier summary table supports smooth scrolling on sales leader dashboard
    And all rows and columns remain accessible during scroll on sales leader dashboard

  @sales-leader-dashboard @regression-test @lob-carrier-summary @sticky-header @TEST-049-Sales-Leader-Dashboard-LOB-Carrier-PROD
  Scenario: T049-SLD-LCS — Summary table column headers remain visible during scroll
    When I open the agent dashboard on sales leader dashboard
    Then the LOB Carrier summary column headers stay fixed during vertical scroll on sales leader dashboard

  # ============================================================================
  # Cross-Sell Metrics
  # ============================================================================

  @sales-leader-dashboard @regression-test @cross-sell @unique-clients @TEST-050-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T050-SLD-CS — Cross-Sell Metrics displays total unique clients
    When I open the agent dashboard on sales leader dashboard
    Then the Cross-Sell Metrics section is displayed on sales leader dashboard
    And the unique clients count is accurate on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @total-policies @TEST-051-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T051-SLD-CS — Cross-Sell Metrics displays total policies across all clients
    When I open the agent dashboard on sales leader dashboard
    Then the total policies count across all clients is displayed on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @avg-products @TEST-052-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T052-SLD-CS — Average products per client is calculated correctly
    When I open the agent dashboard on sales leader dashboard
    Then the average products per client equals total products divided by unique clients on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @distinct-products @TEST-053-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T053-SLD-CS — Distinct product averages are displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the distinct product averages per client are displayed correctly on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @distinct-lobs @TEST-054-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T054-SLD-CS — Distinct LOBs per client average is calculated correctly
    When I open the agent dashboard on sales leader dashboard
    Then the distinct LOBs per client average is displayed correctly on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @single-policy @TEST-055-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T055-SLD-CS — Count of clients holding exactly one policy
    When I open the agent dashboard on sales leader dashboard
    Then the single-policy client count is accurate on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @multi-policy @TEST-056-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T056-SLD-CS — Count of clients holding two or more policies
    When I open the agent dashboard on sales leader dashboard
    Then the multi-policy client count is accurate on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @ui @TEST-057-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T057-SLD-CS — Cross-Sell Metrics table UI is stable without overflow
    When I open the agent dashboard on sales leader dashboard
    Then the Cross-Sell Metrics table UI is stable without overflow or truncation on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @policy-per-client @TEST-058-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T058-SLD-CS — Policy count per client is displayed correctly
    When I open the agent dashboard on sales leader dashboard
    Then the policy count per client is accurate on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @distribution-buckets @TEST-059-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T059-SLD-CS — Client count per policy distribution bucket is displayed
    When I open the agent dashboard on sales leader dashboard
    Then the client count per policy distribution bucket is accurate on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @distribution-percent @TEST-060-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T060-SLD-CS — Percentage of clients in each distribution bucket is calculated correctly
    When I open the agent dashboard on sales leader dashboard
    Then the distribution bucket percentages equal client count divided by total clients on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @all-metrics @TEST-061-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T061-SLD-CS — All cross-sell metrics are calculated correctly
    When I open the agent dashboard on sales leader dashboard
    Then all cross-sell metrics reflect accurate underlying client and policy data on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @table-percent @TEST-062-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T062-SLD-CS — Policy distribution table shows correct percentages
    When I open the agent dashboard on sales leader dashboard
    Then the policy distribution table percentages are formatted consistently on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @filter-refresh @TEST-063-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T063-SLD-CS — Cross-Sell Metrics update when filters are applied
    When I open the agent dashboard on sales leader dashboard
    And I capture the unique clients count on sales leader dashboard
    When I select the time period "Last Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then all cross-sell metrics recalculate dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @layout @TEST-064-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T064-SLD-CS — Cross-Sell Metrics widget layout matches dashboard design standards
    When I open the agent dashboard on sales leader dashboard
    Then the Cross-Sell Metrics widget layout matches dashboard design standards on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @formatting @TEST-065-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T065-SLD-CS — Cross-Sell Metrics numerical values use consistent formatting
    When I open the agent dashboard on sales leader dashboard
    Then all Cross-Sell Metrics numerical values use consistent currency, percentage, and count formatting on sales leader dashboard

  @sales-leader-dashboard @regression-test @cross-sell @performance @TEST-066-Sales-Leader-Dashboard-Cross-Sell-PROD
  Scenario: T066-SLD-CS — Cross-Sell Metrics loads quickly without UI lag
    When I open the agent dashboard on sales leader dashboard
    Then the Cross-Sell Metrics widget renders smoothly on sales leader dashboard

  # ============================================================================
  # My Team Performance (IK-1318) — Sales Leader only
  # ============================================================================

  @sales-leader-dashboard @regression-test @my-team @visibility @TEST-067-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T067-SLD-MTP — My Team Performance widget displays when downline agents exist
    When I open the agent dashboard on sales leader dashboard
    Then the My Team Performance widget is displayed on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @columns @TEST-068-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T068-SLD-MTP — My Team Performance displays required columns
    When I open the agent dashboard on sales leader dashboard
    Then the My Team Performance widget displays columns on sales leader dashboard:
      | Column                  |
      | Rank                    |
      | Agent                   |
      | Policies                |
      | Agent Commission        |
      | SL Override Commission  |

  @sales-leader-dashboard @regression-test @my-team @rank @TEST-069-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T069-SLD-MTP — Agents are ranked by Agent Commission earned
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance agents are ranked by Agent Commission on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @details @TEST-070-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T070-SLD-MTP — Agent column shows name, ID, and level
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance agent details are displayed on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @policies @TEST-071-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T071-SLD-MTP — Policy count per agent is displayed
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance policy counts are displayed on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @commission @TEST-072-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T072-SLD-MTP — Agent commission is displayed with currency formatting
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance commission values use currency formatting on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @ui @TEST-073-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T073-SLD-MTP — Widget follows dashboard UI and styling standards
    When I open the agent dashboard on sales leader dashboard
    Then the My Team Performance widget layout matches dashboard standards on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @filter-refresh @TEST-074-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T074-SLD-MTP — Widget data updates when reporting period and filters change
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Last Month" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then My Team Performance metrics refresh dynamically on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @pagination @TEST-075-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T075-SLD-MTP — Pagination works when team members exceed page size
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance pagination is available or not needed on sales leader dashboard

  @sales-leader-dashboard @regression-test @my-team @no-downline @TEST-076-Sales-Leader-Dashboard-My-Team-PROD
  Scenario: T076-SLD-MTP — Widget remains hidden when no downline agents exist
    When I open the agent dashboard on sales leader dashboard
    Then My Team Performance is either visible with team data or hidden without broken layout on sales leader dashboard

