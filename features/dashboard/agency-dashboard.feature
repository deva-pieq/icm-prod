@agency-dashboard @regression-test @icm
Feature: Agency Owner Dashboard — filters, key metrics, widgets, and role distribution

  Validation of the Agency Owner dashboard: Global Filters (Time Period, Additional
  Filters), Viewing Period, Key Metrics KPI cards, Revenue by Product Type, Top
  Performers by Revenue, 12-Month Revenue Trend, and Commission Distribution by Role.

  Requires E2E_EMAIL_OWNER and E2E_PASSWORD in .env (Agency Owner).

  Background:
    Given I am logged into PieQ ICM for agency dashboard tests
    When I open the agency owner dashboard
    And I set the time period to "Year to Date" for pre-Requires

  # ============================================================================
  # Global Filters Panel
  # ============================================================================

  @agency-dashboard @regression-test @global-filters @ui @TEST-001-Agency-Dashboard-Global-Filters-PROD
  Scenario: T001-AGD-FLT — Global Filters Panel displays left-side filter panel with Time Period filters
    When I open the agency owner dashboard
    Then the filters sidebar is displayed on the left side
    And the Time Period section displays the following radio options:
      | Option               |
      | This Week            |
      | Last Week            |
      | Last 4 Weeks         |
      | Last 12 Weeks        |
      | This Month           |
      | Last Month           |
      | Last Quarter         |
      | Last 6 Months        |
      | Year to Date         |
      | Last Year            |
      | Custom Date Range    |
    And only one time period can be selected at a time
    When I select the time period "This Week"
    Then the time period "This Week" is selected by default

  @agency-dashboard @regression-test @global-filters @ui @TEST-002-Agency-Dashboard-Global-Filters-PROD
  Scenario: T002-AGD-FLT — Additional Filters display searchable checkbox lists
    When I open the agency owner dashboard
    Then the filters sidebar displays additional filter sections:
      | Section          |
      | Line of Business |
      | Product Type     |
      | Agent Level      |
      | Carrier          |
    When I expand the Line of Business filter section
    Then a search bar and a list of checkboxes are displayed
    And the "All LOBs" checkbox is present and selected by default

  # ============================================================================
  # Viewing Period
  # ============================================================================

  @agency-dashboard @regression-test @viewing-period @display @TEST-003-Agency-Dashboard-Viewing-Period-PROD
  Scenario: T003-AGD-VP — Viewing Period displays selected date range prominently
    When I open the agency owner dashboard
    And I select the time period "This Week"
    Then the viewing period header is displayed at the top of the dashboard
    And the viewing period shows the date range corresponding to the selected time period
    And the date range format matches "Mon DD, YYYY – Mon DD, YYYY"

  # ============================================================================
  # Filter Actions
  # ============================================================================

  @agency-dashboard @regression-test @filter-actions @apply @TEST-004-Agency-Dashboard-Filter-Actions-PROD
  Scenario: T004-AGD-FLT — Selecting a time period and applying changes refreshes widgets
    When I open the agency owner dashboard
    And I select the time period "Last Month"
    Then the viewing period shows last month's date range
    And all dashboard widgets refresh dynamically with updated data

  @agency-dashboard @regression-test @filter-actions @reset @TEST-005-Agency-Dashboard-Filter-Actions-PROD
  Scenario: T005-AGD-FLT — Selecting "This Week" resets to default time period after applying
    When I open the agency owner dashboard
    And I select the time period "Last 4 Weeks"
    Then the viewing period shows a four-week date range
    When I select the time period "This Week"
    Then the viewing period shows the current week's date range
    And all dashboard widgets show data for the current week

  @agency-dashboard @regression-test @filter-actions @cancel @TEST-006-Agency-Dashboard-Filter-Actions-PROD
  Scenario: T006-AGD-FLT — Time period changes are reversible by selecting a different option and applying
    When I open the agency owner dashboard
    And I select the time period "This Week"
    Then the time period "This Week" is selected by default
    When I select the time period "Last 4 Weeks"
    Then the viewing period shows last 4 Weeks date range
    When I select the time period "This Week"
    Then the viewing period shows the current week's date range

  # ============================================================================
  # Time Period Filters — all options validation
  # ============================================================================

  @agency-dashboard @regression-test @time-period @all @TEST-007-Agency-Dashboard-Time-Period-PROD @bug
  Scenario Outline: T007-AGD-TP — All time period radios display correct expected date ranges
    When I open the agency owner dashboard
    And I select the time period "<Option>"
    Then the viewing period shows the correct date range for "<Option>"

    Examples:
      | Option          |
      | Last Week       |
      | Last 4 Weeks    |
      | Last 12 Weeks   |
      | This Month      |
      | Last Month      |
      | Last Quarter    |
      | Last 6 Months   |
      | Year to Date    |
      | Last Year       |

  @agency-dashboard @regression-test @time-period @custom-range @TEST-008-Agency-Dashboard-Time-Period-PROD @bug
  Scenario: T008-AGD-TP — Custom Date Range filter refreshes dashboard widgets
    When I open the agency owner dashboard
    When I select the time period "Custom Date Range"
    Then the viewing period shows the custom date range picker
    And all dashboard widgets refresh dynamically

  @agency-dashboard @regression-test @time-period @custom-range @manual @TEST-009-Agency-Dashboard-Time-Period-PROD @bug
  Scenario: T009-AGD-TP — Custom Date Range manual entry
    When I open the agency owner dashboard
    When I select the time period "Custom Date Range"
    Then the custom date range start and end inputs are displayed
    # Known issue: on second manual entry attempt, the date collapses (IK-known-bug)
    And the custom date range inputs accept valid date values
    And I click apply button
    And the date range format matches "Mon DD, YYYY – Mon DD, YYYY"

  # ============================================================================
  # Additional Filters
  # ============================================================================

  @agency-dashboard @regression-test @additional-filters @lob @TEST-019-Agency-Dashboard-Additional-Filters-PROD
  Scenario: T019-AGD-ADF — Line of Business filter refreshes dashboard widgets
    When I open the agency owner dashboard
    And I expand the Line of Business filter section
    Then all LOB options are selected by default
    And I capture the Gross commission initial value
    When I deselect a specific LOB
    Then all dashboard widgets refresh dynamically based on the selected LOBs
    And I validate current Gross commission is lessthan or equals to capture initial one
    When I switch to the "LOB" dimension tab on agency dashboard
    And I wait for the Pie Chart to load on agency dashboard
    And the pie chart legend shows checked filter labels from "Line of Business" on agency dashboard

  @agency-dashboard @regression-test @additional-filters @product-type @TEST-020-Agency-Dashboard-Additional-Filters-PROD
  Scenario: T020-AGD-ADF — Product Type filter refreshes dashboard widgets
    When I open the agency owner dashboard
    And I expand the Product Type filter section
    Then all Product Type options are selected by default
    And I capture the Gross commission initial value
    When I deselect a specific Product Type
    Then all dashboard widgets refresh dynamically based on the selected Product Types
    And I validate current Gross commission is lessthan or equals to capture initial one
    And I wait for the Pie Chart to load on agency dashboard
    And the pie chart legend shows checked filter labels from "Product Type" on agency dashboard

  @agency-dashboard @regression-test @additional-filters @agent-level @TEST-021-Agency-Dashboard-Additional-Filters-PROD
  Scenario: T021-AGD-ADF — Agent Level filter refreshes dashboard widgets
    When I open the agency owner dashboard
    And I expand the Agent Level filter section
    Then all Agent Level options are selected by default
    And I capture the Gross commission initial value
    When I deselect a specific Agent Level
    Then all dashboard widgets refresh dynamically based on the selected Agent Levels
    And I validate current Gross commission is lessthan or equals to capture initial one

  @agency-dashboard @regression-test @additional-filters @carrier @TEST-022-Agency-Dashboard-Additional-Filters-PROD @bug
  # T022-AGD-ADF: KNOWN BUG — MCP-proven 2026-09-02 (preprod): deselecting a Carrier then Apply fires the
  # key-metrics API with ~330 carrierUuids → CORS preflight blocked ("No 'Access-Control-Allow-Origin'")
  # → all metric widgets disappear (gross-commission testid count 0, loader stuck), so the
  # "validate Gross commission <= initial" assertion cannot read the metric. Pending app fix.
  # Do not weaken the assertion while the app is broken.
  Scenario: T022-AGD-ADF — Carrier filter refreshes dashboard widgets
    When I open the agency owner dashboard
    And I expand the Carrier filter section
    Then all Carrier options are selected by default
    And I capture the Gross commission initial value
    When I deselect a specific Carrier
    Then all dashboard widgets refresh dynamically based on the selected Carriers
    And I validate current Gross commission is lessthan or equals to capture initial one
    When I switch to the "Carrier" dimension tab on agency dashboard
    And I wait for the Pie Chart to load on agency dashboard
    And the pie chart legend shows checked filter labels from "Carrier" on agency dashboard

  @agency-dashboard @regression-test @additional-filters @warning @TEST-052-Agency-Dashboard-Additional-Filters-PROD
  Scenario: T052-AGD-ADF — Warning when all additional filters are unchecked
    When I open the agency owner dashboard
    And I expand and uncheck all additional filter sections
    Then a warning message "At least one filter must be selected" is displayed

  # ============================================================================
  # Widgets UI
  # ============================================================================

  @agency-dashboard @regression-test @widgets @ui @TEST-023-Agency-Dashboard-Widgets-UI-PROD
  Scenario: T023-AGD-WDG — Dashboard widgets UI standards and dynamic refresh
    When I open the agency owner dashboard
    Then the following widgets are displayed:
      | Widget                         |
      | Key Metrics                    |
      | Revenue by Product Type        |
      | Commission Distribution by Role |
      | Top Performers by Revenue      |
      | 12-Month Revenue Trend         |
    And all widgets respond to filter changes by refreshing their data

  # ============================================================================
  # Key Metrics
  # ============================================================================

  @agency-dashboard @regression-test @key-metrics @kpi @TEST-024-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T024-AGD-KM — Key Metrics KPI cards display financial metrics
    When I open the agency owner dashboard
    Then the Key Metrics section displays the following KPI cards:
      | KPI Card               |
      | Gross Commission       |
      | Agent Payouts          |
      | Sub-Agent Payouts      |
      | Sales Leader Override  |
      | Net to Agency          |
      | Chargebacks            |
    And each KPI card shows a monetary value and description

  @agency-dashboard @regression-test @key-metrics @gross-commission @TEST-025-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T025-AGD-KM — Gross Commission KPI card with breakdown popup
    When I open the agency owner dashboard
    Then the Gross Commission card displays total commission received from carriers
    And the Gross Commission card shows description "From carriers"
    When I click the Gross Commission card
    Then a "Total Revenue Breakdown" popup is displayed
    And the breakdown popup shows a Category summary table with Amount and % of Total columns
    And the breakdown popup shows a detail table with search bar for carrier, product type, and type
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @key-metrics @agent-payouts @TEST-026-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T026-AGD-KM — Agent Payouts KPI card
    When I open the agency owner dashboard
    Then the Agent Payouts card displays total commissions earned by agents
    And the Agent Payouts card shows description "To agents"
    And the Agent Payouts metric refreshes dynamically based on filters

  @agency-dashboard @regression-test @key-metrics @sub-agent-payouts @TEST-027-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T027-AGD-KM — Sub-Agent Payouts KPI card
    When I open the agency owner dashboard
    Then the Sub-Agent Payouts card displays total commissions earned by sub-agents
    And the Sub-Agent Payouts card shows description "To sub agents"
    And the Sub-Agent Payouts metric refreshes dynamically based on filters

  @agency-dashboard @regression-test @key-metrics @sales-leader-override @TEST-028-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T028-AGD-KM — Sales Leader Override KPI card
    When I open the agency owner dashboard
    Then the Sales Leader Override card displays total override commissions earned by sales leaders
    And the Sales Leader Override card shows description "Management"
    And the Sales Leader Override metric refreshes dynamically based on filters

  @agency-dashboard @regression-test @key-metrics @net-to-agency @TEST-029-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T029-AGD-KM — Net to Agency KPI card
    When I open the agency owner dashboard
    Then the Net to Agency card displays final retained earnings after all payouts
    And the Net to Agency card shows description "Owner profit"
    And the Net to Agency metric refreshes dynamically based on filters

  @agency-dashboard @regression-test @key-metrics @chargebacks @TEST-030-Agency-Dashboard-Key-Metrics-PROD
  Scenario: T030-AGD-KM — Chargebacks KPI card
    When I open the agency owner dashboard
    Then the Chargebacks card displays total chargebacks during the period
    And the Chargebacks card shows description "Deductions"
    And the Chargebacks metric refreshes dynamically based on filters

  # ============================================================================
  # Revenue by Product Type
  # ============================================================================

  @agency-dashboard @regression-test @revenue-lob @chart @TEST-031-Agency-Dashboard-Revenue-LOB-PROD
  Scenario: T031-AGD-RL — Revenue by Product Type chart and dimension grouping
    When I open the agency owner dashboard
    Then the Revenue by Product Type card displays a donut chart visualization
    And the chart shows revenue distribution by dimension
    And the total revenue amount is displayed at the center of the chart
    And the dimension tabs allow switching between:
      | Dimension     |
      | Product Type  |
      | Carrier       |
      | LOB           |
    And the chart updates dynamically based on the selected grouping and filters

  # ============================================================================
  # Revenue by Dimension — Filter Interaction with Pie Chart & Gross Commission
  # ============================================================================

  @agency-dashboard @regression-test @revenue-filter @dynamic @TEST-057-Agency-Dashboard-Revenue-Filter-PROD
  Scenario: T057-AGD-RF — Select two carriers and validate pie chart legend updates
    When I expand the Carrier filter section
    And I uncheck all carrier filter options
    And I select carrier filter options "BCBS of OK" and "Aetna"
    And I apply the filter changes on agency dashboard
    When I switch to the "Carrier" dimension tab on agency dashboard
    And I wait for the Pie Chart to load on agency dashboard
    Then the revenue pie chart legend only shows the selected carriers on agency dashboard
    And the gross commission value is greater than zero

  @agency-dashboard @regression-test @revenue-filter @dynamic @TEST-058-Agency-Dashboard-Revenue-Filter-PROD @bug
  # @bug: Agent Level filter has LVL1/LVL2/SA1 codes, not "Agent" label
  Scenario: T058-AGD-RF — Agent Level filter changes gross commission
    Then I capture the current gross commission value
    When I expand the Agent Level filter section
    And I uncheck all agent level filter options
    And I select agent level filter option "LVL1"
    And I apply the filter changes on agency dashboard
    Then the gross commission value is different from the previously captured value
    And the gross commission value is greater than zero

  # ============================================================================
  # Top Performers by Revenue
  # ============================================================================

  @agency-dashboard @regression-test @top-performers @ui @TEST-032-Agency-Dashboard-Top-Performers-PROD
  Scenario: T032-AGD-TP — Top Performers by Revenue widget UI
    When I open the agency owner dashboard
    Then the Top Performers by Revenue widget displays ranked performance cards
    And each performer card shows:
      | Field                      |
      | Agent Name                 |
      | Total Revenue Contribution |
      | Revenue Split Distribution |

  @agency-dashboard @regression-test @top-performers @split @TEST-033-Agency-Dashboard-Top-Performers-PROD
  Scenario: T033-AGD-TP — Top Performers show contribution split across roles
    When I open the agency owner dashboard
    Then the top performer cards display revenue split across Agent Revenue, Sales Leader Revenue, and Sub-Agent Revenue

  @agency-dashboard @regression-test @top-performers @ordering @TEST-034-Agency-Dashboard-Top-Performers-PROD
  Scenario: T034-AGD-TP — Top Performers sorted in descending revenue order
    When I open the agency owner dashboard
    Then the top performers are arranged in descending revenue order

  @agency-dashboard @regression-test @top-performers @visualization @TEST-035-Agency-Dashboard-Top-Performers-PROD
  Scenario: T035-AGD-TP — Revenue split visualization displays correctly
    When I open the agency owner dashboard
    Then the revenue split bars are color-coded by contribution type
    And the stacked bar segments represent Agent, Sales Leader, and Sub-Agent portions

  @agency-dashboard @regression-test @top-performers @dynamic @TEST-036-Agency-Dashboard-Top-Performers-PROD
  Scenario: T036-AGD-TP — Top Performers metrics refresh with filters
    When I open the agency owner dashboard
    Then the Top Performers by Revenue widget refreshes dynamically based on filter changes

  # ============================================================================
  # 12-Month Revenue Trend
  # ============================================================================

  @agency-dashboard @regression-test @revenue-trend @ui @TEST-037-Agency-Dashboard-Revenue-Trend-PROD
  Scenario: T037-AGD-RT — 12-Month Revenue Trend chart UI
    When I open the agency owner dashboard
    Then the 12-Month Revenue Trend widget displays a multi-line trend chart
    And the chart shows trend lines for:
      | Trend Line       |
      | Total Revenue    |
      | Commission       |
      | Bonus            |
      | Overrides        |

  @agency-dashboard @regression-test @revenue-trend @accuracy @TEST-038-Agency-Dashboard-Revenue-Trend-PROD
  Scenario: T038-AGD-RT — Revenue Trend lines display accurately
    When I open the agency owner dashboard
    Then the trend lines for Total Revenue, Commission, Bonus, and Overrides are displayed for all months
    And the trend chart updates based on filters and date ranges

  # ============================================================================
  # Commission Distribution by Role
  # ============================================================================

  @agency-dashboard @regression-test @commission-role @ui @TEST-039-Agency-Dashboard-Commission-Role-PROD
  Scenario: T039-AGD-CR — Commission Distribution by Role chart UI
    When I open the agency owner dashboard
    Then the Commission Distribution by Role widget displays the commission split chart
    And the chart shows role names with commission amounts and percentages

  @agency-dashboard @regression-test @commission-role @display @TEST-040-Agency-Dashboard-Commission-Role-PROD
  Scenario: T040-AGD-CR — Chart shows commission split, percentage, and people count
    When I open the agency owner dashboard
    Then the Commission Distribution chart displays for each role:
      | Role         |
      | Agent        |
      | Agency       |
      | Sales Leader |
      | Sub-agents   |
    And each role shows commission amount, percentage, and number of people

  @agency-dashboard @regression-test @commission-role @agent-detail @TEST-041-Agency-Dashboard-Commission-Role-PROD
  Scenario: T041-AGD-CR — Clicking Agent shows detail popup
    When I open the agency owner dashboard
    When I click the Agent role in Commission Distribution
    Then a role details panel is displayed with commission, number of agents, average, and percentage of total
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @agent-performers @TEST-042-Agency-Dashboard-Commission-Role-PROD
  Scenario: T042-AGD-CR — Agent detail popup shows Top Performers table
    When I open the agency owner dashboard
    When I click the Agent role in Commission Distribution
    Then the role details panel shows a "Top Performers in This Role" table
    And the table contains columns: Name, Level, Policies, Commission
    And the table data cross-references with key metrics data
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @agency-detail @TEST-043-Agency-Dashboard-Commission-Role-PROD
  Scenario: T043-AGD-CR — Clicking Agency Owner shows detail popup
    When I open the agency owner dashboard
    And I set the time period to "Year to Date"
    When I click the Agency Owner role in Commission Distribution
    Then a role details panel is displayed with commission, number of agencies, average, and percentage of total
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @agency-performers @TEST-044-Agency-Dashboard-Commission-Role-PROD
  Scenario: T044-AGD-CR — Agency Owner detail popup shows Top Performers table
    When I open the agency owner dashboard
    And I set the time period to "Year to Date"
    When I click the Agency Owner role in Commission Distribution
    Then the role details panel shows a "Top Performers in This Role" table
    And the table contains columns: Name, Level, Policies, Commission
    And the table data cross-references with key metrics data
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @sales-leader-detail @TEST-045-Agency-Dashboard-Commission-Role-PROD
  Scenario: T045-AGD-CR — Clicking Sales Leader shows detail popup
    When I open the agency owner dashboard
    When I click the Sales Leader role in Commission Distribution
    Then a role details panel for Sales Leader is displayed with commission, number of people, average, and percentage of total
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @sales-leader-performers @TEST-046-Agency-Dashboard-Commission-Role-PROD
  Scenario: T046-AGD-CR — Sales Leader detail popup shows Top Performers table
    When I open the agency owner dashboard
    When I click the Sales Leader role in Commission Distribution
    Then the role details panel shows a "Top Performers in This Role" table
    And the table contains columns: Name, Level, Policies, Commission
    And the table data cross-references with key metrics data
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @sub-agent-detail @TEST-047-Agency-Dashboard-Commission-Role-PROD
  Scenario: T047-AGD-CR — Clicking Sub-agent shows detail popup
    When I open the agency owner dashboard
    And I set the time period to "Year to Date"
    When I click the Sub-agent role in Commission Distribution
    Then a role details panel for Sub-agent is displayed with commission, number of people, average, and percentage of total
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @sub-agent-performers @TEST-048-Agency-Dashboard-Commission-Role-PROD
  Scenario: T048-AGD-CR — Sub-agent detail popup shows Top Performers table
    When I open the agency owner dashboard
    And I set the time period to "Year to Date"
    When I click the Sub-agent role in Commission Distribution
    Then the role details panel shows a "Top Performers in This Role" table
    And the table contains columns: Name, Level, Policies, Commission
    And the table data cross-references with key metrics data
    When I close the sidebar modal on agency dashboard

  @agency-dashboard @regression-test @commission-role @total @TEST-049-Agency-Dashboard-Commission-Role-PROD
  Scenario: T049-AGD-CR — Total Commission Distributed amount matches all roles
    When I open the agency owner dashboard
    Then the total commission distributed amount equals the sum of all role commissions

  @agency-dashboard @regression-test @commission-role @percentage @TEST-050-Agency-Dashboard-Commission-Role-PROD
  Scenario: T050-AGD-CR — Role percentages sum to 100%
    When I open the agency owner dashboard
    Then the sum of all role percentages equals 100%

  # ============================================================================
  # Year Limit
  # ============================================================================

  @agency-dashboard @regression-test @year-limit @custom-range @TEST-051-Agency-Dashboard-Year-Limit-PROD
  Scenario: T051-AGD-YL — Year limits for Custom Date Range
    When I open the agency owner dashboard
    When I select the time period "Custom Date Range"
    Then the agency dashboard minimum selectable year should be 1990
    # Known issue: the app currently allows selecting years below 1990; the expected
    # minimum year limit is 1990 and the maximum is 2100.
    And the agency dashboard maximum selectable year should be 2100
