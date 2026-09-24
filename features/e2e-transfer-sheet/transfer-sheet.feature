@transfer-sheet @icm
Feature: Transfer Agent — upload to ACH via Transfer Sheet

  End-to-end transfer agent flow: pre-req transfer sheet setup, negative scenarios,
  excel prep, statement upload, policy transfer reconciliation, payment creation,
  authorization, and disbursement history verification.

  Background:
    Given I am logged into PieQ ICM as "operations manager"

  @e2e @sanity-prod @transfer-agent @upload-to-ach
  Scenario: T001-TS-E2E — Upload transfer agent statement, reconcile policy, create payment, authorize, verify history
    # --- Pre-req: ensure transfer record exists ---
    Given I open the transfer sheet page
    When I ensure a transfer sheet record exists for agent "Test Transfer Agent" product "Aetna-Test-Product" with status "Active" and date 3 years back

    # --- Pre-req: prepare excel file ---
    Given the transfer agent excel file is prepared for upload

    # --- Step 1: upload statement ---
    When I open the commission statement upload page
    And I upload the prepared transfer agent file
    And I select statement type "Aetna ACA"
    And I submit the statement upload

    # --- Step 2: capture file id ---
    When I refresh the recently uploaded statements grid
    Then the recently uploaded statements grid shows my upload and I capture the file id

    # --- Step 3: review statement with warning ---
    When I open the review page for the stored upload
    Then the warning tooltip on the review page contains "New Policy"
    When I submit the statement for processing
    And I confirm the statement submission

    # --- Step 4: reconcile policy transfer ---
    When I navigate to needs attention statements
    Then the stored upload row shows status "waiting" and stage "needs attention"
    When I open the stored upload from needs attention
    # Then the commission details page shows:
    #  | heading             | Commission Details      |
    #  | split card contains | Total Gross Commission  |
    #  | split card contains | Agency $                |
    #  | split card contains | Agent $                 |
    And the page subtitle contains the file name, carrier "Aetna", and upload date
    And the warning tooltip contains "Policy Transfer Required"
    And the grid displays records with "NB" and status "Unmatched"

    When I click a record with status "Policy Transfer"
    And I select transferring agent "DevaTest Agent"
    And I enter rationale "Testing..."
    And I click reconcile

    When I refresh the grid
    And I reconcile the next record with status "Unmatched" as "DevaTest Agent"
    Then all grid records show "NB" as transaction type and no warning icons
    And I store the agent commission amount as "commission-amt"

    # --- Step 5: payables ---
    When I navigate to payable line items
    And I search payables by the stored file id
    And I select all visible records
    Then the right sidebar shows:
      | title         | Process Summary |
      | earning       | <commission-amt>|
      | create payment| enabled         |
    When I click create payment
    And I confirm the payment batch
    Then the payable records for the stored file are consumed

    # --- Step 6: approval ---
    When I navigate to payment approval
    And I open the first record containing "Deva"
    Then I capture the batch id starting with "PAY-"
    When I click authorize payment
    And I confirm the authorization

    # --- Step 7: history ---
    When I navigate to disbursement history
    Then the page title is "Disbursement History"
    When I open a record for agent "DevaTest Agent"
    Then the finalized settlement chip is visible
