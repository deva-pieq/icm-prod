@agent-dashboard @regression-test @icm
Feature: Agent Dashboard — filters, performance overview, widgets, and cross-sell metrics

  Validation of the Agent dashboard: Global Filters (Time Period, Additional
  Filters), Viewing Period, Performance Overview KPI cards, Commission by Role,
  Product Type Performance, Persistency Report, Summary by LOB & Carrier, and
  Cross-Sell Metrics.

  Requires E2E_EMAIL_AGENT and E2E_PASSWORD in .env (Agent role).

  Background:
    Given I am logged into PieQ ICM for agent dashboard tests
    When I open the agent dashboard

  # ============================================================================
  # Global Filters Panel
  # ============================================================================

  @agent-dashboard @regression-test @global-filters @ui @TEST-001-Agent-Dashboard-Global-Filters-PROD
  Scenario: T001-AGT-FLT — Time Period filter panel displays radio options
    When I open the agent dashboard
    Then the filters sidebar is displayed on the left side on agent dashboard
    And the Time Period section displays the following radio options on agent dashboard:
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
    And only one time period can be selected at a time on agent dashboard

  @agent-dashboard @regression-test @global-filters @ui @TEST-002-Agent-Dashboard-Global-Filters-PROD
  Scenario: T002-AGT-FLT — Additional Filters display searchable checkbox lists
    When I open the agent dashboard
    Then the filters sidebar displays additional filter sections on agent dashboard:
      | Section          |
      | Line of Business |
      | Product Type     |
      | Carrier          |
      | Product          |
    When I expand the Line of Business filter section on agent dashboard
    Then a search bar and a list of checkboxes are displayed on agent dashboard
    And the "All LOBs" checkbox is present and selected by default on agent dashboard

  # ============================================================================
  # Viewing Period
  # ============================================================================

  @agent-dashboard @regression-test @viewing-period @display @TEST-003-Agent-Dashboard-Viewing-Period-PROD
  Scenario: T003-AGT-VP — Viewing Period displays selected date range prominently
    When I open the agent dashboard
    And I select the time period "This Week" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period header is displayed at the top of the dashboard on agent dashboard
    And the viewing period shows the date range corresponding to the selected time period on agent dashboard
    And the date range format matches "Mon DD, YYYY – Mon DD, YYYY" on agent dashboard

  # ============================================================================
  # Filter Actions
  # ============================================================================

  @agent-dashboard @regression-test @filter-actions @apply @TEST-004-Agent-Dashboard-Filter-Actions-PROD
  Scenario: T004-AGT-FLT — Selecting a time period and applying changes refreshes widgets
    When I open the agent dashboard
    And I select the time period "Last Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last month's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @filter-actions @reset @TEST-005-Agent-Dashboard-Filter-Actions-PROD
  Scenario: T005-AGT-FLT — Selecting "This Week" resets to default time period after applying
    When I open the agent dashboard
    And I select the time period "Last 4 Weeks" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a four-week date range on agent dashboard
    When I select the time period "This Week" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows the current week date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @filter-actions @reset-button @TEST-067-Agent-Dashboard-Filter-Actions-PROD
  Scenario: T067-AGT-FLT — Reset button reverts all filters to default values
    When I open the agent dashboard
    And I select the time period "Last Month" on agent dashboard
    And I deselect a specific LOB on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last month's date range on agent dashboard
    When I reset the filters on agent dashboard
    Then the time period "This Week" is selected by default on agent dashboard
    And the viewing period shows the current week date range on agent dashboard
    And all LOB options are selected by default on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @filter-actions @cancel @TEST-006-Agent-Dashboard-Filter-Actions-PROD
  Scenario: T006-AGT-FLT — Time period changes are reversible by selecting a different option and applying
    When I open the agent dashboard
    And I select the time period "This Week" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the time period "This Week" is selected by default on agent dashboard
    When I select the time period "Last 4 Weeks" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a four-week date range on agent dashboard
    When I select the time period "This Week" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows the current week date range on agent dashboard

  # ============================================================================
  # Time Period Filters — individual options
  # ============================================================================

  @agent-dashboard @regression-test @time-period @this-week @TEST-007-Agent-Dashboard-Time-Period-PROD
  Scenario: T007-AGT-TP — This Week is the default filter and refreshes all widgets
    When I open the agent dashboard
    Then the time period "This Week" is selected by default on agent dashboard
    And the viewing period shows the current week date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-week @TEST-008-Agent-Dashboard-Time-Period-PROD
  Scenario: T008-AGT-TP — Last Week filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last Week" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last week's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-4-weeks @TEST-009-Agent-Dashboard-Time-Period-PROD
  Scenario: T009-AGT-TP — Last 4 Weeks filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last 4 Weeks" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a four-week date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-12-weeks @TEST-010-Agent-Dashboard-Time-Period-PROD
  Scenario: T010-AGT-TP — Last 12 Weeks filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last 12 Weeks" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a twelve-week date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @this-month @TEST-011-Agent-Dashboard-Time-Period-PROD
  Scenario: T011-AGT-TP — This Month filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "This Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows this month's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-month @TEST-012-Agent-Dashboard-Time-Period-PROD
  Scenario: T012-AGT-TP — Last Month filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last month's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-quarter @TEST-013-Agent-Dashboard-Time-Period-PROD
  Scenario: T013-AGT-TP — Last Quarter filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last Quarter" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last quarter's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-6-months @TEST-014-Agent-Dashboard-Time-Period-PROD
  Scenario: T014-AGT-TP — Last 6 Months filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last 6 Months" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a six-month date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @ytd @TEST-015-Agent-Dashboard-Time-Period-PROD
  Scenario: T015-AGT-TP — Year to Date filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows a year-to-date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @last-year @TEST-016-Agent-Dashboard-Time-Period-PROD
  Scenario: T016-AGT-TP — Last Year filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Last Year" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last year's date range on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @custom-range @TEST-017-Agent-Dashboard-Time-Period-PROD
  Scenario: T017-AGT-TP — Custom Date Range filter refreshes all dashboard widgets
    When I open the agent dashboard
    When I select the time period "Custom Date Range" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows the custom date range picker on agent dashboard
    And all dashboard widgets refresh dynamically on agent dashboard

  @agent-dashboard @regression-test @time-period @custom-range @year-limits @bug @TEST-018-Agent-Dashboard-Time-Period-PROD
  Scenario: T018-AGT-TP — Custom Date Range year limits are 1990 minimum and 2100 maximum
    When I open the agent dashboard
    When I select the time period "Custom Date Range" on agent dashboard
    Then the custom date range year minimum is 1990 on agent dashboard
    And the custom date range year maximum is 2100 on agent dashboard

  @agent-dashboard @regression-test @time-period @custom-range @manual @bug @TEST-019-Agent-Dashboard-Time-Period-PROD
  Scenario: T019-AGT-TP — Custom Date Range manual entry accepts and retains dates
    When I open the agent dashboard
    When I select the time period "Custom Date Range" on agent dashboard
    Then the custom date range start and end inputs are displayed on agent dashboard
    When I enter custom date range "04/01/2026" to "06/20/2026" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows the entered custom date range on agent dashboard
    # Known issue: on second manual entry attempt, the date collapses
    When I enter custom date range "05/01/2026" to "06/15/2026" on agent dashboard
    Then the custom date range inputs retain the entered values on agent dashboard

  # ============================================================================
  # Additional Filters
  # ============================================================================

  @agent-dashboard @regression-test @additional-filters @lob @TEST-020-Agent-Dashboard-Additional-Filters-PROD
  Scenario: T020-AGT-ADF — Line of Business filter refreshes dashboard widgets
    When I open the agent dashboard
    And I expand the Line of Business filter section on agent dashboard
    Then all LOB options are selected by default on agent dashboard
    When I deselect a specific LOB on agent dashboard
    And I click the Apply button on agent dashboard
    Then all dashboard widgets refresh dynamically based on the selected LOBs on agent dashboard

  @agent-dashboard @regression-test @additional-filters @product-type @TEST-021-Agent-Dashboard-Additional-Filters-PROD
  Scenario: T021-AGT-ADF — Product Type filter refreshes dashboard widgets
    When I open the agent dashboard
    And I expand the Product Type filter section on agent dashboard
    Then all Product Type options are selected by default on agent dashboard
    When I deselect a specific Product Type on agent dashboard
    And I click the Apply button on agent dashboard
    Then all dashboard widgets refresh dynamically based on the selected Product Types on agent dashboard

  @agent-dashboard @regression-test @additional-filters @carrier @TEST-022-Agent-Dashboard-Additional-Filters-PROD
  Scenario: T022-AGT-ADF — Carrier filter refreshes dashboard widgets
    When I open the agent dashboard
    And I expand the Carrier filter section on agent dashboard
    Then all Carrier options are selected by default on agent dashboard
    When I deselect a specific Carrier on agent dashboard
    And I click the Apply button on agent dashboard
    Then all dashboard widgets refresh dynamically based on the selected Carriers on agent dashboard

  @agent-dashboard @regression-test @additional-filters @product @TEST-023-Agent-Dashboard-Additional-Filters-PROD
  Scenario: T023-AGT-ADF — Product filter refreshes dashboard widgets
    When I open the agent dashboard
    And I expand the Product filter section on agent dashboard
    Then all Product options are selected by default on agent dashboard
    When I deselect a specific Product on agent dashboard
    And I click the Apply button on agent dashboard
    Then all dashboard widgets refresh dynamically based on the selected Products on agent dashboard

  @agent-dashboard @regression-test @additional-filters @warning @TEST-024-Agent-Dashboard-Additional-Filters-PROD
  Scenario: T024-AGT-ADF — Warning when all additional filters are unchecked
    When I open the agent dashboard
    And I expand and uncheck all additional filter sections on agent dashboard
    And I click the Apply button on agent dashboard
    Then a warning message "At least one filter must be selected" is displayed on agent dashboard

  # ============================================================================
  # Performance Overview — KPI Widgets
  # ============================================================================

  @agent-dashboard @regression-test @performance-overview @kpi @ui @TEST-025-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T025-AGT-PO — Performance Overview KPI widgets display standard UI
    When I open the agent dashboard
    Then the Performance Overview section is displayed on agent dashboard
    And the Performance Overview section displays the following KPI cards on agent dashboard:
      | KPI Card              |
      | Total Gross Commission |
      | Total Chargeback       |
      | Total Paid             |
      | Avg Per Policy         |
      | Total New Policies     |
    And each KPI card shows a value and description on agent dashboard

  @agent-dashboard @regression-test @performance-overview @refresh @TEST-026-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T026-AGT-PO — Performance Overview metrics refresh based on selected filters
    When I open the agent dashboard
    And I capture the Total Gross Commission initial value on agent dashboard
    When I select the time period "Last Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then all Performance Overview metrics refresh based on selected filters on agent dashboard

  @agent-dashboard @regression-test @viewing-period @dynamic @TEST-027-Agent-Dashboard-Viewing-Period-PROD
  Scenario: T027-AGT-VP — Dashboard displays the selected viewing period dynamically
    When I open the agent dashboard
    When I select the time period "Last Quarter" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the viewing period shows last quarter's date range on agent dashboard
    And the viewing period header is displayed at the top of the dashboard on agent dashboard

  @agent-dashboard @regression-test @performance-overview @gross-commission @data @manual @TEST-028-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T028-AGT-PO — Total Gross Commission cross-verified with uploaded earned commission
    When I open the agent dashboard
    And I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Total Gross Commission metric matches uploaded earned commission data on agent dashboard

  @agent-dashboard @regression-test @performance-overview @chargeback @data @manual @TEST-029-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T029-AGT-PO — Total Chargeback cross-verified with uploaded chargeback values
    When I open the agent dashboard
    And I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Total Chargeback metric matches uploaded chargeback data on agent dashboard
    And the Total Chargeback is displayed in parentheses to indicate negative values on agent dashboard

  @agent-dashboard @regression-test @performance-overview @total-paid @data @manual @TEST-030-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T030-AGT-PO — Total Paid reflects commission moved from payables to ACH
    When I open the agent dashboard
    And I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Total Paid metric matches uploaded paid commission data on agent dashboard

  @agent-dashboard @regression-test @performance-overview @avg-per-policy @data @manual @TEST-031-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T031-AGT-PO — Average Per Policy calculated correctly for selected period
    When I open the agent dashboard
    And I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Avg Per Policy metric is calculated correctly on agent dashboard

  @agent-dashboard @regression-test @performance-overview @new-policies @data @manual @TEST-032-Agent-Dashboard-Performance-Overview-PROD
  Scenario: T032-AGT-PO — Total New Policies count matches uploaded policy data
    When I open the agent dashboard
    And I select the time period "Year to Date" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Total New Policies count matches uploaded policy data on agent dashboard

  # ============================================================================
  # Commission by Role
  # ============================================================================

  @agent-dashboard @regression-test @commission-role @ui @TEST-033-Agent-Dashboard-Commission-Role-PROD
  Scenario: T033-AGT-CR — Commission by Role section displays earnings breakdown
    When I open the agent dashboard
    And I select the time period "Last Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Commission by Role section is displayed on agent dashboard
    And the Commission by Role section shows the following roles on agent dashboard:
      | Role          |
      | Agent         |
      | Sales Leader  |

  @agent-dashboard @regression-test @commission-role @rows @TEST-034-Agent-Dashboard-Commission-Role-PROD
  Scenario: T034-AGT-CR — Each Commission by Role row displays role metrics and progress bar
    When I open the agent dashboard
    Then each Commission by Role row displays role name on agent dashboard
    And each Commission by Role row displays total commission earned with currency formatting on agent dashboard
    And each Commission by Role row displays policy count on agent dashboard
    And each Commission by Role row displays percentage contribution on agent dashboard
    And each Commission by Role row displays a visual progress indicator on agent dashboard
    And Commission by Role percentages sum to 100 percent on agent dashboard

  @agent-dashboard @regression-test @commission-role @ytd-summary @TEST-035-Agent-Dashboard-Commission-Role-PROD
  Scenario: T035-AGT-CR — Commission by Role displays YTD summary at the bottom
    When I open the agent dashboard
    Then the Commission by Role YTD summary row is visible at the bottom on agent dashboard
    And the YTD summary value equals the sum of all role totals on agent dashboard
    And the YTD summary is formatted with currency symbol and decimals on agent dashboard

  # ============================================================================
  # Product Type Performance
  # ============================================================================

  @agent-dashboard @regression-test @product-type-performance @ui @TEST-036-Agent-Dashboard-Product-Type-Performance-PROD
  Scenario: T036-AGT-PTP — Product Type Performance section displays product metrics
    When I open the agent dashboard
    Then the Product Type Performance section is displayed on agent dashboard
    And each Product Type Performance row displays product category name on agent dashboard
    And each Product Type Performance row displays policy count on agent dashboard
    And each Product Type Performance row displays total commission amount on agent dashboard
    And each Product Type Performance row displays a progress bar on agent dashboard

  # ============================================================================
  # Persistency Report
  # ============================================================================

  @agent-dashboard @regression-test @persistency @ui @TEST-037-Agent-Dashboard-Persistency-PROD
  Scenario: T037-AGT-PER — Persistency Report section displays standard UI
    When I open the agent dashboard
    Then the Persistency Report section is displayed on agent dashboard
    And the Persistency Report heading shows "Persistency (Last 13 Months)" on agent dashboard
    And Persistency percentages are formatted correctly on agent dashboard

  @agent-dashboard @regression-test @persistency @3-month @TEST-038-Agent-Dashboard-Persistency-PROD
  Scenario: T038-AGT-PER — 3-month Persistency metrics are displayed correctly
    When I open the agent dashboard
    Then the 3-month Persistency row shows accurate Cohort, Persisted, Lapsed or Rescinded, and Persistency % on agent dashboard

  @agent-dashboard @regression-test @persistency @6-month @TEST-039-Agent-Dashboard-Persistency-PROD
  Scenario: T039-AGT-PER — 6-month Persistency metrics are displayed correctly
    When I open the agent dashboard
    Then the 6-month Persistency row shows accurate values and percentages on agent dashboard

  @agent-dashboard @regression-test @persistency @9-month @TEST-040-Agent-Dashboard-Persistency-PROD
  Scenario: T040-AGT-PER — 9-month Persistency metrics are displayed correctly
    When I open the agent dashboard
    Then the 9-month Persistency row shows accurate Cohort, Persisted, Lapsed or Rescinded, and Persistency % on agent dashboard

  @agent-dashboard @regression-test @persistency @12-month @TEST-041-Agent-Dashboard-Persistency-PROD
  Scenario: T041-AGT-PER — 12-month Persistency metrics are displayed correctly
    When I open the agent dashboard
    Then the 12-month Persistency row shows accurate Persisted, Lapsed or Rescinded, and Persistency % on agent dashboard

  # ============================================================================
  # Summary by LOB & Carrier
  # ============================================================================

  @agent-dashboard @regression-test @lob-carrier-summary @grouping @TEST-042-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T042-AGT-LCS — Commission data grouped correctly by Line of Business
    When I open the agent dashboard
    Then the Summary by LOB and Carrier section is displayed on agent dashboard
    And each LOB displays its own policies and commission totals without overlap on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @carrier @TEST-043-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T043-AGT-LCS — Commission data grouped correctly by carrier within each LOB
    When I open the agent dashboard
    Then each carrier shows accurate policy and commission data under the correct LOB on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @policy-count @TEST-044-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T044-AGT-LCS — Policy counts per LOB and carrier are displayed
    When I open the agent dashboard
    Then policy counts per LOB and carrier are displayed accurately on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @commission @TEST-045-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T045-AGT-LCS — Commission totals per LOB and carrier are displayed
    When I open the agent dashboard
    Then commission totals per LOB and carrier are formatted with currency and decimals on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @refresh @TEST-046-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T046-AGT-LCS — Summary by LOB and Carrier updates when filters change
    When I open the agent dashboard
    And I capture the LOB carrier summary initial row count on agent dashboard
    When I select the time period "Last Year" on agent dashboard
    And I click the Apply button on agent dashboard
    Then the Summary by LOB and Carrier totals recalculate dynamically on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @sort @TEST-047-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T047-AGT-LCS — Summary table can be sorted by LOB, Carrier, Policies, and Commission
    When I open the agent dashboard
    When I sort the LOB Carrier summary by "Line of Business" ascending on agent dashboard
    Then the LOB Carrier summary rows are sorted correctly on agent dashboard
    When I sort the LOB Carrier summary by "Commission Amount" descending on agent dashboard
    Then the LOB Carrier summary rows are sorted correctly on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @scroll @TEST-048-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T048-AGT-LCS — Summary table supports vertical and horizontal scrolling
    When I open the agent dashboard
    Then the LOB Carrier summary table supports smooth scrolling on agent dashboard
    And all rows and columns remain accessible during scroll on agent dashboard

  @agent-dashboard @regression-test @lob-carrier-summary @sticky-header @TEST-049-Agent-Dashboard-LOB-Carrier-PROD
  Scenario: T049-AGT-LCS — Summary table column headers remain visible during scroll
    When I open the agent dashboard
    Then the LOB Carrier summary column headers stay fixed during vertical scroll on agent dashboard

  # ============================================================================
  # Cross-Sell Metrics
  # ============================================================================

  @agent-dashboard @regression-test @cross-sell @unique-clients @TEST-050-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T050-AGT-CS — Cross-Sell Metrics displays total unique clients
    When I open the agent dashboard
    Then the Cross-Sell Metrics section is displayed on agent dashboard
    And the unique clients count is accurate on agent dashboard

  @agent-dashboard @regression-test @cross-sell @total-policies @TEST-051-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T051-AGT-CS — Cross-Sell Metrics displays total policies across all clients
    When I open the agent dashboard
    Then the total policies count across all clients is displayed on agent dashboard

  @agent-dashboard @regression-test @cross-sell @avg-products @TEST-052-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T052-AGT-CS — Average products per client is calculated correctly
    When I open the agent dashboard
    Then the average products per client equals total products divided by unique clients on agent dashboard

  @agent-dashboard @regression-test @cross-sell @distinct-products @TEST-053-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T053-AGT-CS — Distinct product averages are displayed correctly
    When I open the agent dashboard
    Then the distinct product averages per client are displayed correctly on agent dashboard

  @agent-dashboard @regression-test @cross-sell @distinct-lobs @TEST-054-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T054-AGT-CS — Distinct LOBs per client average is calculated correctly
    When I open the agent dashboard
    Then the distinct LOBs per client average is displayed correctly on agent dashboard

  @agent-dashboard @regression-test @cross-sell @single-policy @TEST-055-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T055-AGT-CS — Count of clients holding exactly one policy
    When I open the agent dashboard
    Then the single-policy client count is accurate on agent dashboard

  @agent-dashboard @regression-test @cross-sell @multi-policy @TEST-056-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T056-AGT-CS — Count of clients holding two or more policies
    When I open the agent dashboard
    Then the multi-policy client count is accurate on agent dashboard

  @agent-dashboard @regression-test @cross-sell @ui @TEST-057-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T057-AGT-CS — Cross-Sell Metrics table UI is stable without overflow
    When I open the agent dashboard
    Then the Cross-Sell Metrics table UI is stable without overflow or truncation on agent dashboard

  @agent-dashboard @regression-test @cross-sell @policy-per-client @TEST-058-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T058-AGT-CS — Policy count per client is displayed correctly
    When I open the agent dashboard
    Then the policy count per client is accurate on agent dashboard

  @agent-dashboard @regression-test @cross-sell @distribution-buckets @TEST-059-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T059-AGT-CS — Client count per policy distribution bucket is displayed
    When I open the agent dashboard
    Then the client count per policy distribution bucket is accurate on agent dashboard

  @agent-dashboard @regression-test @cross-sell @distribution-percent @TEST-060-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T060-AGT-CS — Percentage of clients in each distribution bucket is calculated correctly
    When I open the agent dashboard
    Then the distribution bucket percentages equal client count divided by total clients on agent dashboard

  @agent-dashboard @regression-test @cross-sell @all-metrics @TEST-061-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T061-AGT-CS — All cross-sell metrics are calculated correctly
    When I open the agent dashboard
    Then all cross-sell metrics reflect accurate underlying client and policy data on agent dashboard

  @agent-dashboard @regression-test @cross-sell @table-percent @TEST-062-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T062-AGT-CS — Policy distribution table shows correct percentages
    When I open the agent dashboard
    Then the policy distribution table percentages are formatted consistently on agent dashboard

  @agent-dashboard @regression-test @cross-sell @filter-refresh @TEST-063-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T063-AGT-CS — Cross-Sell Metrics update when filters are applied
    When I open the agent dashboard
    And I capture the unique clients count on agent dashboard
    When I select the time period "Last Month" on agent dashboard
    And I click the Apply button on agent dashboard
    Then all cross-sell metrics recalculate dynamically on agent dashboard

  @agent-dashboard @regression-test @cross-sell @layout @TEST-064-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T064-AGT-CS — Cross-Sell Metrics widget layout matches dashboard design standards
    When I open the agent dashboard
    Then the Cross-Sell Metrics widget layout matches dashboard design standards on agent dashboard

  @agent-dashboard @regression-test @cross-sell @formatting @TEST-065-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T065-AGT-CS — Cross-Sell Metrics numerical values use consistent formatting
    When I open the agent dashboard
    Then all Cross-Sell Metrics numerical values use consistent currency, percentage, and count formatting on agent dashboard

  @agent-dashboard @regression-test @cross-sell @performance @TEST-066-Agent-Dashboard-Cross-Sell-PROD
  Scenario: T066-AGT-CS — Cross-Sell Metrics loads quickly without UI lag
    When I open the agent dashboard
    Then the Cross-Sell Metrics widget renders smoothly on agent dashboard
