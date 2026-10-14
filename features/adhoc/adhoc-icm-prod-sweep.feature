@adhoc @adhoc-sweep @observe
Feature: Adhoc ICM sweep - agency owner (read-only, recurring)

  Reusable, non-destructive health sweep for an agency owner on the ICM web app.
  Verifies the core surfaces an agency owner uses (dashboard, statements, payables,
  advances, commissions, settings, products, agents) are reachable and rendered.
  No data is created, edited, approved, paid or uploaded.

  Background:
    Given I am logged into PieQ ICM as agency owner in adhoc sweep

  @ADHOC-SWEEP-001 @recurring
  Scenario: ADHOC-SWEEP-001 - Agency owner dashboard renders metrics and widgets
    Then the agency owner dashboard is displayed in adhoc sweep
    And the dashboard key metrics and widgets are displayed in adhoc sweep

  @ADHOC-SWEEP-002 @recurring
  Scenario: ADHOC-SWEEP-002 - Main sidebar navigation is available
    Then the main navigation is visible in adhoc sweep

  @ADHOC-SWEEP-003 @recurring
  Scenario: ADHOC-SWEEP-003 - Statement history page loads
    When I open statement history in adhoc sweep
    Then the statement history page is displayed in adhoc sweep

  @ADHOC-SWEEP-004 @recurring
  Scenario: ADHOC-SWEEP-004 - Payables (Payment Ready) grid loads
    When I open payables in adhoc sweep
    Then the payables grid is displayed in adhoc sweep

  @ADHOC-SWEEP-005 @recurring
  Scenario: ADHOC-SWEEP-005 - Advance overview loads
    When I open advance overview in adhoc sweep
    Then the advance overview page is displayed in adhoc sweep

  @ADHOC-SWEEP-006 @recurring
  Scenario: ADHOC-SWEEP-006 - Commissions module loads
    When I open commissions in adhoc sweep
    Then the commissions module is displayed in adhoc sweep

  @ADHOC-SWEEP-007 @recurring
  Scenario: ADHOC-SWEEP-007 - Settings (agency configuration) loads
    When I open agency configuration in adhoc sweep
    Then the agency configuration page is displayed in adhoc sweep

  @ADHOC-SWEEP-008 @recurring
  Scenario: ADHOC-SWEEP-008 - Products list loads
    When I open products list in adhoc sweep
    Then the products list is displayed in adhoc sweep

  @ADHOC-SWEEP-009 @recurring
  Scenario: ADHOC-SWEEP-009 - Agents list loads
    When I open agents list in adhoc sweep
    Then the agents list is displayed in adhoc sweep
