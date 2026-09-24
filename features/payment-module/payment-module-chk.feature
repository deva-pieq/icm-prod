@payment-module @regression-test @payment-chk @regression @icm
Feature: Payment Module Regression — Check (Aetna ACA)

  Regression coverage for Check payment method on MLB New.
  Prepares dynamic CHK Excel (NB + RN share one Customer UID), uploads with
  Complete Review (auto-reconcile), then validates Create Payment, Approval,
  Check tab authorization, and Disbursement History (Check has no ACH payout file).

  Templates: TestFiles/PaymentModule/CHK/[MLB][NB|RN]PaymentModule-CHK.xlsx
  Ops Manager: deva.r+ag3@pieq.ai | Agent: 600002 (Check)

  Background:
    Given I am logged into PieQ ICM for payment module validation
    Given the payment module "CHK" cycle files are prepared
    When I upload and complete review for the payment module NB statement
    And I upload and complete review for the payment module RN statement

  @TEST-PAY-CHK-001-PROD @regression-test
  Scenario: T001-PAY-CHK — Create Payment enabled when selection can proceed
    When I navigate to Payables on payment module
    Then the Pending Payments heading is visible on payment module
    And the payables grid shows expected columns on payment module
    When I search payables by the stored Customer UID on payment module
    And I check the first payable row checkbox on payment module
    Then the process summary container is visible on payment module
    And the process summary shows Agents and Net Settlement on payment module
    # Create Payment stays disabled while "Remove agents below $25.00 to proceed" is visible
    When I ensure Create Payment can proceed on payment module
    Then the Create Payment button is visible and enabled on payment module

  @TEST-PAY-CHK-002-PROD @regression-test
  Scenario: T002-PAY-CHK — Process summary hidden when all unchecked
    When I navigate to Payables on payment module
    Then the Pending Payments heading is visible on payment module
    When I search payables by the stored Customer UID on payment module
    And I check the first payable row checkbox on payment module
    Then the process summary container is visible on payment module
    When I uncheck all payable row checkboxes on payment module
    Then the process summary container is not visible on payment module

  @TEST-PAY-CHK-003-PROD @regression-test
  Scenario: T003-PAY-CHK — Create Payment enabled for multiple pending payments
    When I navigate to Payables on payment module
    Then the Pending Payments heading is visible on payment module
    When I search payables by the stored Customer UID on payment module
    And I check payable row checkboxes at indexes "0,1" on payment module
    Then the process summary container is visible on payment module
    When I ensure Create Payment can proceed on payment module
    Then the Create Payment button is visible and enabled on payment module

  @TEST-PAY-CHK-004-PROD @regression-test
  Scenario: T004-PAY-CHK — Create Payment disabled when selected amount is below $25
    When I navigate to Payables on payment module
    Then the Pending Payments heading is visible on payment module
    When I search payables by the stored Customer UID on payment module
    And I check a payable row with amount less than 25 on payment module
    Then the process summary container is visible on payment module
    And the process summary shows remove agents below threshold message on payment module
    And the Create Payment button is visible and disabled on payment module

  @TEST-PAY-CHK-005-PROD @regression-test
  Scenario: T005-PAY-CHK — Capture Net Settlement and create payment
    When I navigate to Payables on payment module
    Then the Pending Payments heading is visible on payment module
    When I search payables by the stored Customer UID on payment module
    And I select all payable records on payment module
    And I ensure Create Payment can proceed on payment module
    Then the process summary container is visible on payment module
    When I capture the Net Settlement amount on payment module
    And I click Create Payment on payment module
    And I confirm the payment batch on payment module

  @TEST-PAY-CHK-006-PROD @regression-test
  Scenario: T006-PAY-CHK — Approval Net Disbursement matches captured amount
    When I navigate to Approval on payment module
    Then the Payment Batches heading is visible on payment module
    When I open the payment batch matching the captured Net Settlement on payment module
    And I capture the Net Disbursement amount on payment module
    Then the Net Disbursement equals the captured Net Settlement on payment module

  @TEST-PAY-CHK-007-PROD @regression-test
  Scenario: T007-PAY-CHK — Check tab authorize payment
    When I navigate to Approval on payment module
    Then the Payment Batches heading is visible on payment module
    When I open the payment batch matching the captured Net Settlement on payment module
    And I select the "Check" payment method tab on payment module
    Then the selected payment method tab has records on payment module
    When I capture the batch id from the batch title on payment module
    And I click Authorize Payment on payment module
    And I confirm the authorization on payment module

  @TEST-PAY-CHK-008-PROD @regression-test
  Scenario: T008-PAY-CHK — Check payout file is not downloadable
    When I navigate to Disbursement History on payment module
    Then the Disbursement History heading is visible on payment module
    And the disbursement history grid shows expected columns on payment module
    When I search disbursement history by the captured payment id on payment module
    Then the disbursement history row for the captured payment id is visible on payment module
    And the disbursement history row Net Disbursement matches the captured amount on payment module
    When I download the Check payout and verify file is not available on payment module
