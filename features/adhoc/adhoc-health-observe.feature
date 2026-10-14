Feature: Adhoc health observe (read-only, recurring)
  As an agency owner
  I want to verify dashboards, navigation, lists, and payables grid visibility
  So that I can detect regressions without mutations

  @ADHOC-HLTH-001 @adhoc @observe @recurring
  Scenario: ADHOC-HLTH-001 - Dashboard baseline and navigation
    Given I am logged in as an agency owner
    Then I should be on the home/dashboard page
    And I should see main navigation items
    And I should be able to see dashboard widgets

  @ADHOC-HLTH-002 @adhoc @observe @recurring
  Scenario: ADHOC-HLTH-002 - Statement History loads (canonical)
    Given I am logged in as an agency owner
    When I navigate to Statements
    Then Statements page should load successfully

  @ADHOC-HLTH-003 @adhoc @observe @recurring
  Scenario: ADHOC-HLTH-003 - Advances page readiness
    Given I am logged in as an agency owner
    When I navigate to Advances
    Then Advances page should load successfully

  @ADHOC-HLTH-004 @adhoc @observe @recurring
  Scenario: ADHOC-HLTH-004 - Payables grid visibility (Payment Ready area)
    Given I am logged in as an agency owner
    When I navigate to Payables
    Then Payables page should load successfully
    And Payables grid should be visible and ready

  @ADHOC-HLTH-005 @adhoc @observe @recurring
  Scenario: ADHOC-HLTH-005 - Payment Processing, Commissions, Settings, Agency smoke
    Given I am logged in as an agency owner
    When I navigate to Payment Processing
    Then Payment Processing page should load successfully
    When I navigate to Commissions
    Then Commissions page should load successfully
    When I navigate to Settings
    Then Settings page should load successfully
    When I navigate to Agency
    Then Agency page should load successfully
