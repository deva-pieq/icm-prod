@validate-advance-adjustment @e2e @sanity-prod @icm
Feature: Validate Advance and Adjustment (ARF)

  End-to-end validation of Advance Recovery Flow for Advance and Adjustment products.
  Uploads a prepared Excel statement with a new Customer UID (new policy),
  validates agent eligibility and product advance setup, completes the full
  upload → review → reconcile cycle selecting Commission (Advance and Adjustment),
  then verifies the ARF amount on the policy ledger. A recovery statement follows
  to reverse the advance and validate the $0 balance on the Advance Overview.

  Template: TestFiles/AdvanceAndAdjustment/[MLB]AdvanceStatement-AA.xlsx
  Recovery: TestFiles/AdvanceAndAdjustment/[MLB]AdvanceStatement-AA [Recovery].xlsx
  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for advance adjustment validation

  @e2e @sanity-prod @TEST-001-Advance-Adjustment-ARF-PROD
  Scenario: T001-AA-ARF — Full Advance and Adjustment flow: prepare, upload, reconcile, validate, recover

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance adjustment statement file is prepared from template
    And the Customer UID is incremented by 1 in the advance adjustment prepared file
    And the advance adjustment prepared file is saved with a timestamp suffix
    Then the advance adjustment prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate Agent eligibility for carrier advance
    # ─────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared advance adjustment file
    And I navigate to the Agents page in advance adjustment validation
    And I search the Agents grid by agent ID in advance adjustment validation
    Then a row containing the agent ID and Level is displayed in advance adjustment validation
    When I open the agent settings for the matched agent in advance adjustment validation
    Then the carrier advance toggle is enabled in advance adjustment validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup
    # ─────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared advance adjustment file
    And I navigate to the Advance Setup page in advance adjustment validation
    And I search the Advance Setup grid by product name in advance adjustment validation
    Then a row for the product appears in the Advance Setup grid in advance adjustment validation
    And I capture the Advance Default value in advance adjustment validation
    And I capture the Advance Monthly value in advance adjustment validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared statement file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance adjustment statement upload page
    And I upload the prepared advance adjustment file
    And I select the statement type "Aetna ACA" in advance adjustment validation
    And I submit the advance adjustment upload for processing
    Then the uploaded file appears in the advance adjustment recently uploaded grid
    And the advance adjustment upload extract processing completes and file ID is captured
    And the advance adjustment upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review stage
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance adjustment review page for the stored upload
    And every transaction type is "NB" in advance adjustment validation
    When I click Complete Review on the advance adjustment review page
    When I wait for 2 seconds and refresh the advance adjustment data grid
    Then the advance adjustment upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 6 — Re-navigate to upload and open the record for reconciliation
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the advance adjustment upload page again
    And I open the advance adjustment record by stored file ID
    And I wait for the advance adjustment file to reach "Needs Attention" or "Reconciliation" stage
    Then the advance adjustment reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Advance and Adjustment
    # ─────────────────────────────────────────────────────────────────────
    When I hover over the advance exception warning tooltip in advance adjustment reconciliation
    Then the advance exception tooltip contains "Advance setup exists for this product and the pay-to agent is eligible for carrier advance" in advance adjustment validation
    When I click the advance exception record in advance adjustment reconciliation
    Then the Advance Exception title is displayed in advance adjustment reconciliation
    When I click the "M 1-12" label in advance adjustment reconciliation
    And I select the Commission radio button in advance adjustment reconciliation
    Then the number of months input matches the captured Advance Monthly value in advance adjustment validation
    When I capture the advance amount from the total advance input in advance adjustment validation
    Then the transaction preview grid contains ARF and Adjusted rows
    When I click the reconcile advance exception button in advance adjustment reconciliation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF amount on Policy Ledger
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance adjustment validation
    And I search the Policies grid by stored PolicyNumber in advance adjustment validation
    And I click the policy actions ellipse in advance adjustment validation
    And I click "View Ledger" in the policy actions menu in advance adjustment validation
    Then the Policy Ledger page is displayed in advance adjustment validation
    And the ARF row Amount matches the captured advance amount in advance adjustment validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare recovery statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance adjustment recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber for advance adjustment
    And the recovery file is saved with the stored timestamp suffix for advance adjustment

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 10 — Upload recovery file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance adjustment statement upload page
    And I upload the prepared advance adjustment recovery file
    And I select the statement type "Aetna ACA" in advance adjustment validation
    And I submit the advance adjustment upload for processing
    Then the uploaded recovery file appears in the advance adjustment recently uploaded grid
    And the advance adjustment recovery upload extract processing completes and file ID is captured
    And the advance adjustment recovery upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 11 — Review recovery file and verify chargeback
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance adjustment review page for the stored recovery upload
    When I click Complete Review on the advance adjustment review page
    When I navigate to the advance adjustment upload page again
    Then the advance adjustment recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance adjustment validation
    And I search the Policies grid by stored PolicyNumber in advance adjustment validation
    And I click the policy actions ellipse in advance adjustment validation
    And I click "View Ledger" in the policy actions menu in advance adjustment validation
    Then the Policy Ledger page is displayed in advance adjustment validation
    When I expand a commission row in the Policy Ledger in advance adjustment validation
    Then the commission details contain "ADVANCE_EARNED" in advance adjustment validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 13 — Validate Advance Overview historical record
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in advance adjustment validation
    And I click the Historical tab in advance adjustment overview
    And I search the Advance Overview grid by stored PolicyNumber in advance adjustment validation
    And I open the first record in the Advance Overview grid in advance adjustment validation
    Then the Advance Policy Details card Product field contains the expected product name in advance adjustment validation
    When I click the sort indicator in the Advance Overview details grid in advance adjustment validation
    Then the balance in the first row of the Advance Overview details grid is "$0.00" in advance adjustment validation
