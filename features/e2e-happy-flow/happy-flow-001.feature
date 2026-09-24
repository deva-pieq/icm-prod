@happy-flow @e2e @sanity-prod @icm @TEST-001-happy-flow-PROD
# if every policy is new policy it will reconcile automatically
# if new business policy entries are more than one, manual reconcile required
Feature: Happy Flow E2E — product, commission, statement, payment

  End-to-end happy path from product creation through commission setup, statement upload,
  reconciliation, and payment finalization.

  Requires E2E_EMAIL and E2E_PASSWORD in .env (Operations Manager).

  Background:
    Given I am logged into PieQ ICM as "operations manager"

  @e2e @sanity-prod @TEST-001-happy-flow-PROD @step-1-10
  Scenario: T001-E2E-HF — Happy flow from product creation through payment finalization
    Given happy flow 001 product data is prepared

    # --- Step 1: Create Product ---
    When I open the products page
    And I click add product
    And I fill the product mandate fields from prepared data
    And I save the new product
    Then the product document is loaded
    And I am on the products dashboard page

    # --- Step 2: Add Commission Structure ---
    When I open the product from the grid by prepared product name
    Then the product edit page title contains the prepared product name
    And the product status chip shows "Active"
    When I open commission structure for the product
    And I click add commission rule
    And I select commission type "Commission"
    And I save the add commission rule dialog
    Then I am on the edit commission rule page

    # --- Step 3: Edit Commission ---
    When I set the commission rule policy start date to the prepared effective date
    And I set policy period slabs to "10"
    And I save the commission rule policy period changes
    And I select commission template "ACA - Carrier with OVR - Regular"
    And I publish the commission rule
    Then I see a sliding notification containing "Rule published successfully"

    # --- Step 4: Prepare CSV file ---
    Given the happy flow CSV file is prepared

    # --- Step 5: Navigate to Statements > Upload ---
    When I open the commission statement upload page
    And I upload the prepared happy flow CSV file
    And I select statement type "Aetna ACA"
    And I submit the statement upload

    # --- Step 6: Locate upload, capture file ID, open review ---
    Then the happy flow upload is located and file ID is captured
    When I wait 2 seconds
    And I refresh the recently uploaded statements grid
    Then the stored happy flow upload shows status "Waiting" and stage "Review"
    When I open the review page for the stored upload

    # --- Step 7: Review Statement File ---
    Then the review URL contains the file ID
    And the review page title is "Review Statement File"
    And the review page subtitle shows the file name and "Aetna ACA"
    And every transaction type is "NB"
    When I click complete review and confirm

    # --- Step 8: Completed upload and ready for payment ---
    When I wait 2 seconds
    And I refresh the recently uploaded statements grid
    Then the stored happy flow upload shows stage "Completed"
    When I click the stored happy flow upload record
    Then all records show payment status "Ready for Payment"

    # --- Step 9: Payment Processing > Payables ---
    When I navigate to payable line items
    And I search payables by the uploaded filename
    And I click all records containing the uploaded filename
    And I remove agents below $25.00 if required
    And I click create payment
    And I confirm the payment batch

    # --- Step 10: Authorize payment and verify history ---
    When I navigate to payment approval
    And I open the record initiated today by "Deva"
    And I capture the payment batch id
    Then the page title contains the batch id
    When I click authorize payment
    And I confirm the authorization
    When I navigate to disbursement history
    Then the page title is "Disbursement History"
    When I open a record for the captured batch id
    Then the finalized settlement chip is visible
