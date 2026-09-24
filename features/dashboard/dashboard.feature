@dashboard @regression-test @icm
Feature: Dashboard — widgets, viewing period, and operational metrics

  Validation of the Operations Manager dashboard: Viewing Period, Weekly Statement
  Processing Cycle widgets, Statement Stage Breakdown, Carrier Ageing Detail, Exception
  Tracking, and Pending Payments.

  Requires E2E_EMAIL and E2E_PASSWORD in .env (Operations Manager).

  Background:
    Given I am logged into PieQ ICM as "operations manager"

  # ============================================================================
  # Weekly Viewing Period
  # ============================================================================

  @dashboard @regression-test @viewing-period @ui @TEST-001-dashboard-viewing-period-PROD
  Scenario: T001-DASH-VP — Viewing Period widget displays weekly range selector
    When I open the operations manager dashboard
    Then the Viewing Period widget is displayed at the top of the dashboard
    And the viewing period shows a weekly date range selector
    And the selected date range is clearly displayed (e.g. "Jun 23, 2026 - Jun 29, 2026")

  @dashboard @regression-test @viewing-period @cycle @TEST-002-dashboard-viewing-period-PROD
  Scenario: T002-DASH-VP — Viewing period displays default active weekly cycle date range
    When I open the operations manager dashboard
    Then the viewing period displays the active weekly cycle date range by default
    And the date range follows a fixed seven-day weekly payment cycle

  @dashboard @regression-test @viewing-period @navigation @TEST-003-dashboard-viewing-period-PROD
  Scenario: T003-DASH-VP — Navigation arrows allow moving between weeks
    When I open the operations manager dashboard
    Then left and right navigation arrows are displayed on the viewing period
    When I click the left navigation arrow
    Then the viewing period moves to the previous week cycle
    When I click the right navigation arrow
    Then the viewing period moves to the next week cycle
    And the right navigation arrow is disabled on the current active week so future weeks cannot be selected

  @dashboard @regression-test @viewing-period @limits @TEST-004-dashboard-viewing-period-PROD
  Scenario: T004-DASH-VP — Year limits of the viewing period date picker
    When I open the operations manager dashboard
    And I open the viewing period date picker
    And I open the month and year selector
    Then months and years after the current period are disabled
    # Known issue: the picker currently allows selecting years far below 1990; the expected minimum year limit is 1990 and the maximum is bounded by the current period.
    And the minimum selectable year should be 1990

  @dashboard @regression-test @viewing-period @today @TEST-005-dashboard-viewing-period-PROD
  Scenario: T005-DASH-VP — Today button in the date picker returns viewing period to current week
    When I open the operations manager dashboard
    And I navigate the viewing period to a past week cycle
    Then the viewing period shows a past date range
    When I open the viewing period date picker
    And I click the Today button in the date picker
    Then the viewing period moves to the current or active week

  @dashboard @regression-test @viewing-period @current-week @TEST-006-dashboard-viewing-period-PROD
  Scenario: T006-DASH-VP — Current Week button state based on viewing period
    When I open the operations manager dashboard
    Then the Current Week button is not shown while the viewing period is on the active week
    When I navigate the viewing period to a past week cycle
    Then the Current Week button appears at the top right corner and is enabled
    When I click the Current Week button
    Then the viewing period returns to the active week range
    And the Current Week button is no longer shown

  # ============================================================================
  # Weekly Statement Processing Cycle
  # ============================================================================

  @dashboard @regression-test @processing-cycle @widgets @TEST-001-dashboard-processing-cycle-PROD
  Scenario: T001-DASH-PC — Weekly Statement Processing Cycle displays metric values in separate widgets
    When I open the operations manager dashboard
    Then the Weekly Statement Processing Cycle section displays the following widgets:
      | Widget             |
      | Total Received     |
      | Completed          |
      | Processing         |
      | Exceptions         |
      | Avg Process Time   |

  @dashboard @regression-test @processing-cycle @total-received @TEST-002-dashboard-processing-cycle-PROD
  Scenario: T002-DASH-PC — Total Received widget displays uploaded statement metrics
    When I open the operations manager dashboard
    Then the Total Received widget shows the count of total uploaded statements
    And the Total Received widget shows the total gross amount of uploaded statements
    And the Total Received widget values update dynamically when the viewing period week changes
    And the Total Received widget displays contextual status text "this week"
    And the Total Received widget is not clickable

  @dashboard @regression-test @processing-cycle @completed @TEST-003-dashboard-processing-cycle-PROD
  Scenario: T003-DASH-PC — Completed widget displays completed statement metrics
    When I open the operations manager dashboard
    Then the Completed widget shows the count of completed statements
    And the Completed widget shows the total gross commission amount of completed statements
    And the Completed widget displays contextual status text "Paid"
    And the Completed widget values update dynamically when the viewing period week changes

  @dashboard @regression-test @processing-cycle @completed-click @TEST-004-dashboard-processing-cycle-PROD
  Scenario: T004-DASH-PC — Clicking Completed widget opens completed statement list panel
    When I open the operations manager dashboard
    When I click the Completed widget
    Then a panel titled "Completed Statements" displays the list of completed statements
    And the completed statement list contains the following columns:
      | Column       |
      | Statement ID |
      | Carrier      |
      | Received Date |
      | Amount       |
      | Stage        |
      | Days Old     |

  @dashboard @regression-test @processing-cycle @processing @TEST-005-dashboard-processing-cycle-PROD
  Scenario: T005-DASH-PC — Processing widget displays pending statement metrics
    When I open the operations manager dashboard
    Then the Processing widget shows the count of all statements excluded completed
    And the Processing widget shows the total gross commission amount
    And the Processing widget displays contextual status text "Pending"
    And the Processing widget values update dynamically when the viewing period week changes

  @dashboard @regression-test @processing-cycle @exceptions @TEST-006-dashboard-processing-cycle-PROD
  Scenario: T006-DASH-PC — Exceptions widget displays needs attention metrics
    When I open the operations manager dashboard
    Then the Exceptions widget shows the count of all needs attention statements
    And the Exceptions widget shows the total gross commission amount
    And the Exceptions widget displays contextual status text "Blocked"
    And the Exceptions widget values update dynamically when the viewing period week changes

  @dashboard @regression-test @processing-cycle @avg-time @TEST-007-dashboard-processing-cycle-PROD
  Scenario: T007-DASH-PC — Average Processing Time widget displays average processing duration
    When I open the operations manager dashboard
    Then the Avg Process Time widget displays the average time for processing a statement file
    And the Avg Process Time widget values update dynamically when the viewing period week changes

  # ============================================================================
  # Statement Stage Breakdown
  # ============================================================================

  @dashboard @regression-test @stage-breakdown @ui @TEST-001-dashboard-stage-breakdown-PROD
  Scenario: T001-DASH-SB — Statement Stage Breakdown displays visualization widgets
    When I open the operations manager dashboard
    Then the Statement Stage Breakdown widget is displayed
    And the breakdown shows operational stages: Review, Extract, Needs Attention, Completed
    And charts are dynamically updated based on the selected viewing period week

  @dashboard @regression-test @stage-breakdown @calculation @TEST-002-dashboard-stage-breakdown-PROD
  Scenario: T002-DASH-SB — Statement Stage Breakdown calculation matches total counts
    When I open the operations manager dashboard
    Then the Statement Stage Breakdown displays total statement count
    And each operational stage shows the count and percentage relative to total statements
    And the sum of all stage counts equals the total statement count

  # ============================================================================
  # Carrier Ageing Detail — Pending Statements
  # ============================================================================

  @dashboard @regression-test @carrier-ageing @ui @TEST-001-dashboard-carrier-ageing-PROD
  Scenario: T001-DASH-CA — Carrier Ageing Detail - Pending Statements table UI
    When I open the operations manager dashboard
    Then the Carrier Ageing Detail - Pending Statements table is displayed
    And the table is functional and responsive

  @dashboard @regression-test @carrier-ageing @buckets @TEST-002-dashboard-carrier-ageing-PROD
  Scenario: T002-DASH-CA — Search bar and ageing bucket display
    When I open the operations manager dashboard
    Then the Carrier Ageing Detail table displays a carrier search bar
    When I search for a carrier by name
    Then the searched carrier is displayed in the results
    And the table displays ageing bucket columns:
      | Bucket |
      | 0-7d   |
      | 8-15d  |
      | 16-30d |
      | 30d+   |
    And the ageing buckets show historical pending data older than one month
    And the table shows carrier-level pending counts and a total blocked or pending amount column
    And ageing severity is highlighted visually with carrier count in red for 16-30d and 30d+ buckets

  @dashboard @regression-test @carrier-ageing @pending-panel @TEST-003-dashboard-carrier-ageing-PROD
  Scenario: T003-DASH-CA — Clicking ageing bucket number opens pending statements panel
    When I open the operations manager dashboard
    When I click the statement count in an ageing bucket cell
    Then a right-to-left panel opens with the list of pending statements
    And the panel displays the exact day old for each statement
    And the panel contains the following columns:
      | Column       |
      | Statement ID |
      | Carrier      |
      | Received Date |
      | Amount       |
      | Stage        |
      | Days Old     |

  @dashboard @regression-test @processing-cycle @processing-click @TEST-008-dashboard-processing-cycle-PROD
  Scenario: T008-DASH-PC — Clicking Processing widget opens side panel with matching amounts
    When I open the operations manager dashboard
    Then the Processing widget is visible
    When I click the left navigation arrow
    Then the Processing widget shows a count greater than zero and a positive pending amount
    When I click the Processing widget
    Then a side panel titled "Processing Statements" displays the processing statement list
    And the processing statement panel contains the following columns:
      | Column       |
      | Statement ID |
      | Carrier      |
      | Received Date |
      | Amount       |
      | Stage        |
      | Days Old     |
    And the row count in the processing panel matches the Processing widget count
    And the summed Amount in the processing panel equals the Processing widget pending amount

  # ============================================================================
  # Exception Tracking Table
  # ============================================================================

  @dashboard @regression-test @exception-tracking @ui @TEST-001-dashboard-exception-tracking-PROD
  Scenario: T001-DASH-ET — Exception Tracking Table UI and layout
    When I open the operations manager dashboard
    Then the Exception Tracking table is displayed with a half-width layout
    And the search bar works as expected
    And the Exception Tracking table displays aggregated exception statistics across the system

  @dashboard @regression-test @exception-tracking @columns @TEST-002-dashboard-exception-tracking-PROD
  Scenario: T002-DASH-ET — Exception Tracking table columns
    When I open the operations manager dashboard
    Then the Exception Tracking table displays the following columns:
      | Column       |
      | Exception Type |
      | Count        |
      | Total Amount |
      | Action       |
    And the Exception Type column shows the exception reason
    And the Count column shows the count of exception policies highlighted in red
    And the Total Amount column shows the total amount for each exception type
    And the Action column provides an action control to view details
    When I open the details for an exception type
    Then statement-level exception details are displayed
    When I close the exception details panel

  @dashboard @regression-test @exception-tracking @details @TEST-003-dashboard-exception-tracking-PROD
  Scenario: T003-DASH-ET — Clicking Exceptions widget opens side panel with matching amounts
    When I open the operations manager dashboard
    Then the Exceptions widget is visible
    When I click the left navigation arrow
    Then the Exceptions widget shows a count greater than zero and a positive amount
    When I click the Exceptions widget
    Then a side panel titled "Exception Statements" displays the exception statement list
    And the exception statement panel contains the following columns:
      | Column       |
      | Statement ID |
      | Carrier      |
      | Received Date |
      | Amount       |
      | Stage        |
      | Days Old     |
    And the row count in the exception panel matches the Exceptions widget count
    And the summed Amount in the exception panel equals the Exceptions widget amount

  # ============================================================================
  # Pending Payments Table
  # ============================================================================

  @dashboard @regression-test @pending-payments @ui @TEST-001-dashboard-pending-payments-PROD
  Scenario: T001-DASH-PP — Pending Payments table UI
    When I open the operations manager dashboard
    And I click the Pending Payment tab
    Then the Pending Payments table is displayed
    And the table header shows "Payment Blockers - Requires Immediate Attention"
    And the search bar allows searching by carrier and statement ID

  @dashboard @regression-test @pending-payments @details @TEST-002-dashboard-pending-payments-PROD
  Scenario: T002-DASH-PP — Pending payment details of statements
    When I open the operations manager dashboard
    And I click the Pending Payment tab
    Then the table displays a list of statements and the count of transactions waiting to be paid
    When I open the details for a statement
    Then a right-to-left panel opens with the list of all transactions waiting in payment payables

  @dashboard @regression-test @pending-payments @columns @TEST-003-dashboard-pending-payments-PROD
  Scenario: T003-DASH-PP — Pending Payments table columns
    When I open the operations manager dashboard
    And I click the Pending Payment tab
    Then the Pending Payments table displays the following columns:
      | Column        |
      | Statement ID  |
      | Carrier       |
      | Total Amount  |
      | Blocked Amount |
      | Days Blocked  |
      | Action        |
    And the Statement ID column shows statements currently blocked from payment processing
    And the Carrier column shows the carrier name
    And the Total Amount column shows the pending amount
    And the Blocked Amount column shows blocked amounts at statement level in red
    And the Days Blocked column displays ageing indicators in red
    And the Action column provides an action control that opens a right-to-left side panel
    And the side panel displays transactions under the selected statement and pending payable line items
