@transfer-sheet-regression @regression-test @icm
Feature: Transfer Sheet — Upload and Check (NB / RN)

  New-business and renewal transfer workflows against an effective Transfer rule.
  Complements @transfer-sheet E2E (payment/ACH) without replacing it.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for transfer sheet regression tests

  @transfer-sheet-regression @upload-check @nb @e2e @sanity-prod @TEST-TS-UC-001-PROD
  Scenario: T001-TS-UC — NB workflow after transfer rule; validate Transfer Policy List
    Given I open the Transfer Sheet page on transfer sheet
    And I ensure a transfer sheet record exists for agent "Test Transfer Agent" product "Aetna-Test-Product" with status "Active" and date 3 years back
    And the transfer agent excel file is prepared for upload
    When I open the commission statement upload page
    And I upload the prepared transfer agent file
    And I select statement type "Aetna ACA"
    And I submit the statement upload
    And I refresh the recently uploaded statements grid
    Then the recently uploaded statements grid shows my upload and I capture the file id
    When I open the review page for the stored upload
    Then the warning tooltip on the review page contains "New Policy"
    When I submit the statement for processing
    And I confirm the statement submission
    And I navigate to needs attention statements
    Then the stored upload row shows status "waiting" and stage "needs attention"
    When I open the stored upload from needs attention
    And the warning tooltip contains "Policy Transfer Required"
    And I click a record with status "Policy Transfer"
    And I select transferring agent "DevaTest Agent"
    And I enter rationale "Testing..."
    And I click reconcile
    And I refresh the grid
    And I reconcile the next record with status "Unmatched" as "DevaTest Agent"
    Then all grid records show "NB" as transaction type and no warning icons
    When I open the Transfer Sheet page on transfer sheet
    And I open the Transfer Policy List tab on transfer sheet
    Then the Transfer Policy List shows a row for Carrier Agent "Test Transfer Agent" and Writing Agent "DevaTest Agent" on transfer sheet

  @transfer-sheet-regression @regression-test @upload-check @nb @positive @TEST-TS-UC-002-PROD
  Scenario: T002-TS-UC — Policy Transfer Mismatch dropdown lists transferring agent
    Given I open the Transfer Sheet page on transfer sheet
    And I ensure a transfer sheet record exists for agent "Test Transfer Agent" product "Aetna-Test-Product" with status "Active" and date 3 years back
    And the transfer agent excel file is prepared for upload
    When I open the commission statement upload page
    And I upload the prepared transfer agent file
    And I select statement type "Aetna ACA"
    And I submit the statement upload
    And I refresh the recently uploaded statements grid
    Then the recently uploaded statements grid shows my upload and I capture the file id
    When I open the review page for the stored upload
    Then the warning tooltip on the review page contains "New Policy"
    When I submit the statement for processing
    And I confirm the statement submission
    And I navigate to needs attention statements
    Then the stored upload row shows status "waiting" and stage "needs attention"
    When I open the stored upload from needs attention
    And I click a record with status "Policy Transfer"
    Then the Policy Transfer Mismatch agent dropdown lists "Test Transfer Agent" on transfer sheet
    And the Policy Transfer Mismatch agent dropdown lists "DevaTest Agent" on transfer sheet

  @transfer-sheet-regression @regression-test @upload-check @rn @positive @TEST-TS-UC-003-PROD
  Scenario: T003-TS-UC — Renewal workflow reaches Ready for Payment without exception
    Given I open the Transfer Sheet page on transfer sheet
    And I ensure a transfer sheet record exists for agent "Test Transfer Agent" product "Aetna-Test-Product" with status "Active" and date 3 years back
    And the transfer agent renewal excel file is prepared for upload
    When I open the commission statement upload page
    And I upload the prepared transfer agent file
    And I select statement type "Aetna ACA"
    And I submit the statement upload
    And I refresh the recently uploaded statements grid
    Then the recently uploaded statements grid shows my upload and I capture the file id
    When I open the review page for the stored upload
    And I submit the statement for processing
    And I confirm the statement submission
    And I navigate to needs attention statements
    Then the stored upload reaches Ready for Payment without Policy Transfer exception on transfer sheet
