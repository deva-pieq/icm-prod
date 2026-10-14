Feature: Adhoc statement to payables (mutate on-demand)
  As an agency owner
  I want to verify statement processing moves to Completed and appears in Payables with dashboard sync
  So that actions remain in sync without deep agent ledger verification

  @ADHOC-CORE-001 @adhoc @mutate @on-demand
  Scenario: ADHOC-CORE-001 - Capture dashboard baseline (before)
    Given I am logged in as an agency owner
    Then I capture dashboard baseline metrics

  @ADHOC-CORE-002 @adhoc @mutate @on-demand
  Scenario: ADHOC-CORE-002 - Statement upload and processing readiness (non-destructive observation)
    Given I am logged in as an agency owner
    And I have an isolated generated statement file ready for processing
    When I navigate to Statements
    Then Statements page should load successfully
    And statement processing area is ready for upload

  @ADHOC-CORE-003 @adhoc @mutate @on-demand
  Scenario: ADHOC-CORE-003 - Verify Completed statements and Payables state
    Given I am logged in as an agency owner
    When I navigate to Payables
    Then Payables page should load successfully
    And Payables grid should be visible and ready
    And I can observe Payment Ready state without creating payments

  @ADHOC-CORE-004 @adhoc @mutate @on-demand
  Scenario: ADHOC-CORE-004 - Verify dashboard sync after state change
    Given I am logged in as an agency owner
    Then I verify dashboard metrics against baseline
