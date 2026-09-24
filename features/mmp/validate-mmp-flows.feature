@mmp @validate-mmp @e2e @sanity-prod @icm
Feature: Marketing Match Program — Statement / Ledger Flows

  E2E MMP flows (T013–T016, T019) plus cap ledger proof.
  Template: TestFiles/MmpTemplate/[MLB]MmpStatement-NB.xlsx
  Statement type: Aetna ACA
  Ops login: agency3OpsCredentials (deva.r+ag3@pieq.ai)
  Agency 3 levels: LVL1 (not Level 1 / SA1), effective start 01/01/2015 via calendar.
  MMP amount: 2000. File1 Commission 1800 + Bonus 200 = 2000.
  One shared agent for all scenarios (create+activate+LVL1+MMP once in Background).
  Customer UID: ATENA-MMP-TEST-A000 then +1 each prep (never reuse).
  Order: table → Bonus-only → NB ledger → RN → monthly cap.

  After statement prep, console prints product name + ops email for Bonus product config.

  Background:
    Given I am logged into PieQ ICM for mmp validation
    And the shared mmp agent is ready with LVL1 and MMP enabled in mmp validation

  @TEST-013-Mmp-Flow-PROD @positive
  Scenario: T013 — MMP table is visible on commission reconciliation page
    Given the mmp single-row statement file is prepared in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 1 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 1 extract processing completes and file ID is captured in mmp validation
    When I open the mmp file 1 review page in mmp validation
    And I complete review on the mmp review page in mmp validation
    And I open the mmp commission details for file 1 in mmp validation
    Then the MMP table is visible on the reconciliation page in mmp validation

  @TEST-019-Mmp-Flow-PROD @positive
  Scenario: T019 — MMP for Bonus earning type
    When I open the created agent edit page in mmp validation
    And I enable MMP with amount 2000 percentage 100 and earning type Bonus only in mmp validation
    Given the mmp single-row statement file is prepared in mmp validation
    When I configure the mmp product Bonus earning type in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 1 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 1 extract processing completes and file ID is captured in mmp validation
    When I open the mmp file 1 review page in mmp validation
    And I complete review on the mmp review page in mmp validation
    And I process the mmp file 1 until Completed in mmp validation
    When I log out and log in as the created agent in mmp validation
    And I open the agent Ledger in mmp validation
    Then the agent ledger shows Bonus credit and MMP debit in mmp validation

  @TEST-015-Mmp-Flow-PROD @positive
  Scenario: T015 — MMP for MLB agent using NB transaction file
    When I open the created agent edit page in mmp validation
    And I enable MMP with amount 2000 percentage 100 and earning types Commission and Bonus in mmp validation
    Given the mmp single-row statement file is prepared in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 1 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 1 extract processing completes and file ID is captured in mmp validation
    When I open the mmp file 1 review page in mmp validation
    And every transaction type is "NB" in mmp validation
    When I complete review on the mmp review page in mmp validation
    And I process the mmp file 1 until Completed in mmp validation
    And I open the mmp commission details for file 1 in mmp validation
    Then the MMP table is visible on the reconciliation page in mmp validation
    When I log out and log in as the created agent in mmp validation
    And I open the agent Ledger in mmp validation
    Then the agent ledger shows MMP deduction rows in mmp validation

  @TEST-016-Mmp-Flow-PROD @positive
  Scenario: T016 — MMP for MLB agent using RN transaction file
    Given the mmp single-row statement file is prepared in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 1 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 1 extract processing completes and file ID is captured in mmp validation
    When I open the mmp file 1 review page in mmp validation
    And I complete review on the mmp review page in mmp validation
    And I process the mmp file 1 until Completed in mmp validation
    Given the mmp renewal statement file is prepared from stored policy in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp renewal file in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp renewal extract processing completes and file ID is captured in mmp validation
    When I open the mmp renewal review page in mmp validation
    And I complete review on the mmp review page in mmp validation
    And I process the mmp renewal until Completed in mmp validation
    When I log out and log in as the created agent in mmp validation
    And I open the agent Ledger in mmp validation
    Then the agent ledger shows MMP deduction rows in mmp validation

  @TEST-014-Mmp-Flow-PROD @positive
  Scenario: T014 — Monthly MMP amount is deducted up to configured max on agent ledger
    Given the mmp single-row statement file is prepared in mmp validation
    Then the mmp product name and ops manager email are reported for human config in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 1 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 1 extract processing completes and file ID is captured in mmp validation
    And the mmp file 1 upload row shows Waiting and Review in mmp validation
    When I open the mmp file 1 review page in mmp validation
    And every transaction type is "NB" in mmp validation
    When I complete review on the mmp review page in mmp validation
    And I process the mmp file 1 until Completed in mmp validation
    Given the mmp multi-row statement file is prepared to exceed MMP cap in mmp validation
    When I open the statement upload page in mmp validation
    And I upload the prepared mmp file 2 in mmp validation
    And I select the mmp statement type in mmp validation
    And I submit the mmp upload for processing in mmp validation
    Then the mmp file 2 extract processing completes and file ID is captured in mmp validation
    And the mmp file 2 upload row shows Waiting and Review in mmp validation
    When I open the mmp file 2 review page in mmp validation
    And I complete review on the mmp review page in mmp validation
    And I process the mmp file 2 until Completed in mmp validation
    When I log out and log in as the created agent in mmp validation
    And I open the agent Ledger in mmp validation
    Then the sum of MMP ledger amounts equals the configured max contribution in mmp validation
