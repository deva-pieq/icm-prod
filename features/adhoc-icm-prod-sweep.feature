Feature: Adhoc ICM prod sweep (agency owner)
  As an agency owner on https://icm.pieq.ai/
  I want to quickly validate basic and important flows
  So that I have a repeatable sweep report

  @ADHOC-SWEEP-001 @adhoc @smoke-lite
  Scenario: ADHOC-SWEEP-001 - Login as agency owner
    Given I navigate to the login page
    When I login with agency owner credentials
    Then I should be on the home/dashboard page

  @ADHOC-SWEEP-002 @adhoc
  Scenario: ADHOC-SWEEP-002 - Verify dashboards and navigation
    Given I am logged in as an agency owner
    Then I should see main navigation items
    And I should be able to see dashboard widgets

  @ADHOC-SWEEP-003 @adhoc
  Scenario: ADHOC-SWEEP-003 - Statements - basic happy path (list)
    Given I am logged in as an agency owner
    When I navigate to Statements
    Then Statements page should load successfully

  @ADHOC-SWEEP-004 @adhoc
  Scenario: ADHOC-SWEEP-004 - Advances - basic navigation and page readiness
    Given I am logged in as an agency owner
    When I navigate to Advances
    Then Advances page should load successfully

  @ADHOC-SWEEP-005 @adhoc
  Scenario: ADHOC-SWEEP-005 - Payables - navigate to payment ready area
    Given I am logged in as an agency owner
    When I navigate to Payables
    Then Payables page should load successfully

  @ADHOC-SWEEP-006 @adhoc
  Scenario: ADHOC-SWEEP-006 - Payment Processing - navigate
    Given I am logged in as an agency owner
    When I navigate to Payment Processing
    Then Payment Processing page should load successfully

  @ADHOC-SWEEP-007 @adhoc
  Scenario: ADHOC-SWEEP-007 - Chargebacks - navigate and basic load
    Given I am logged in as an agency owner
    When I navigate to Chargebacks
    Then Chargebacks page should load successfully

  @ADHOC-SWEEP-008 @adhoc
  Scenario: ADHOC-SWEEP-008 - Commissions/Reports - navigate
    Given I am logged in as an agency owner
    When I navigate to Commissions
    Then Commissions page should load successfully

  @ADHOC-SWEEP-009 @adhoc
  Scenario: ADHOC-SWEEP-009 - Products/Settings - smoke navigation
    Given I am logged in as an agency owner
    When I navigate to Settings
    Then Settings page should load successfully

  @ADHOC-SWEEP-010 @adhoc
  Scenario: ADHOC-SWEEP-010 - Agency/Agents - smoke navigation
    Given I am logged in as an agency owner
    When I navigate to Agency
    Then Agency page should load successfully
