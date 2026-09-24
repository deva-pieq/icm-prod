@edit-transaction @regression-test @regression @icm
Feature: Edit Transaction Regression — Download ACH & Edit Batch (Approval)

  Isolated suite for Approval-page ACH download and Edit Batch / Edit Transaction.
  Prepares dynamic ACH Excel (NB + RN), Complete Review, Create Payment, then
  validates Generate and Download ACH, Last Generated timestamp, agent/payable edits
  on the unpaid Approval batch.

  Templates: TestFiles/PaymentModule/ACH/[MLB][NB|RN]PaymentModule-ACH.xlsx
  Ops Manager: Agency3 Ops | Agent: 600001 (ACH)

  Background:
    Given I am logged into PieQ ICM for edit transaction validation
    Given the edit transaction "ACH" cycle files are prepared
    When I upload and complete review for the edit transaction NB statement
    And I upload and complete review for the edit transaction RN statement
    Given an ACH payment batch exists on Approval for edit transaction

  @TEST-ET-001-PROD @regression-test
  Scenario: T001-ET — ACH payment batch is available on Approval
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    Then the selected payment method tab has records on edit transaction
    And the Generate and Download ACH button is visible on edit transaction

  @TEST-ET-002-PROD @regression-test
  Scenario: T002-ET — Download ACH file from Approval page
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    Then the selected payment method tab has records on edit transaction
    And the Generate and Download ACH button is visible on edit transaction
    When I generate and download the ACH file on edit transaction
    Then the ACH file is downloaded from Approval on edit transaction

  @TEST-ET-003-PROD @regression-test
  Scenario: T003-ET — Last Generated timestamp of ACH file on Approval
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    When I generate and download the ACH file on edit transaction
    Then the ACH file is downloaded from Approval on edit transaction
    And the Last Generated timestamp is visible on edit transaction
    When I capture the Last Generated timestamp on edit transaction
    Then the captured Last Generated timestamp has a valid date-time on edit transaction

  @TEST-ET-004-PROD @regression-test
  Scenario: T004-ET — ACH file updates when payable line items change on the batch
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    When I generate and download the ACH file on edit transaction
    And I store the ACH file fingerprint on edit transaction
    And I open Edit Transaction on edit transaction
    And I remove a payable line item on edit transaction
    And I save the Edit Transaction changes on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    And I generate and download the ACH file on edit transaction
    Then the ACH file fingerprint differs from the stored fingerprint on edit transaction

  @TEST-ET-005-PROD @regression-test
  Scenario: T005-ET — Add new payable line items to the batch via Edit Transaction
    Given an ACH payment batch exists on Approval for edit transaction
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I capture the Net Disbursement amount on edit transaction
    And I open Edit Transaction on edit transaction
    And I add a payable line item on edit transaction
    And I save the Edit Transaction changes on edit transaction
    Then the Net Disbursement has increased after Edit Transaction on edit transaction

  @TEST-ET-006-PROD @regression-test
  Scenario: T006-ET — Remove payable line items from the batch via Edit Transaction
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I capture the Net Disbursement amount on edit transaction
    And I open Edit Transaction on edit transaction
    And I remove a payable line item on edit transaction
    And I save the Edit Transaction changes on edit transaction
    Then the Net Disbursement has decreased after Edit Transaction on edit transaction

  @TEST-ET-007-PROD @regression-test
  Scenario: T007-ET — Save payment batch after insert and removal persists
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I open Edit Transaction on edit transaction
    And I add a payable line item on edit transaction
    And I remove a payable line item on edit transaction
    And I save the Edit Transaction changes on edit transaction
    Then the Net Disbursement remains on the payment batch after Edit Transaction on edit transaction

  @TEST-ET-008-PROD @regression-test
  Scenario: T008-ET — Unchecking all payables disables Save Batch
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I open Edit Transaction on edit transaction
    And I uncheck all payable line items on edit transaction
    Then the Save Batch button is disabled on edit transaction
    And the Edit Batch Net Settlement is zero on edit transaction

  @TEST-ET-009-PROD @regression-test
  Scenario: T009-ET — No Generate and Download when ACH tab has no transactions
    # Fresh ACH (Agent Level I) + CHK (Agent Level II) from TestFiles/PaymentModule/{ACH,CHK}
    Given a mixed ACH and Check payment batch exists on Approval for edit transaction
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    And I remove all agents via kebab menu on the ACH tab on edit transaction
    Then the ACH payment method tab has zero records on edit transaction
    And the Generate and Download ACH button is not visible on edit transaction

  @TEST-ET-010-PROD @regression-test
  Scenario: T010-ET — Remove all ACH agents via kebab clears Generate and Download
    Given a mixed ACH and Check payment batch exists on Approval for edit transaction
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I select the "ACH" payment method tab on edit transaction
    Then the Generate and Download ACH button is visible on edit transaction
    When I remove all agents via kebab menu on the ACH tab on edit transaction
    Then the ACH payment method tab has zero records on edit transaction
    And the Generate and Download ACH button is not visible on edit transaction

  @TEST-ET-011-PROD @regression-test
  Scenario: T011-ET — Remove all agents destroys batch and clears Approval list
    Given a mixed ACH and Check payment batch exists on Approval for edit transaction
    When I navigate to Approval on edit transaction
    Then the Payment Batches heading is visible on edit transaction
    When I open the payment batch matching the captured Net Settlement on edit transaction
    And I capture the batch id from the batch title on edit transaction
    When I remove all agents via kebab menu on Approval on edit transaction
    Then I am redirected to the Approval list after the batch is destroyed on edit transaction
    When I navigate to Approval on edit transaction
    And I search Approval by the captured batch id on edit transaction
    Then no Approval batch is listed for the captured batch id on edit transaction
