@validate-advance-only @e2e @sanity-prod @icm
Feature: Validate Advance Only (ARF)

  End-to-end validation of Advance Recovery Flow for Advance Only products.
  Uploads a prepared Excel statement with a new Customer UID (new policy),
  validates agent eligibility and product advance setup, completes the full
  upload → review → reconcile cycle selecting Advance Only, then verifies
  the ARF amount on the policy ledger. A recovery statement follows to
  reverse the advance and validate the $0 balance on the Advance Overview.

  Template: TestFiles/AdvanceOnlyTemplate/[MLB]AdvanceStatement-AdvanceOnly.xlsx
  Recovery: TestFiles/AdvanceOnlyTemplate/[MLB]AdvanceStatement-AdvanceOnly[Recovery].xlsx
  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for advance only validation

  @e2e @sanity-prod @TEST-001-Advance-Only-ARF-PROD
  Scenario: T001-AO-ARF — Full Advance Only flow: prepare, upload, reconcile, validate, recover

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance only statement file is prepared from template
    And the Customer UID is incremented by 1 in the prepared file
    And the prepared file is saved with a timestamp suffix
    Then the prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate Agent eligibility for carrier advance
    # ─────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared advance only file
    And I navigate to the Agents page in advance only validation
    And I search the Agents grid by agent ID in advance only validation
    Then a row containing the agent ID and Level is displayed in advance only validation
    When I open the agent settings for the matched agent in advance only validation
    Then the carrier advance toggle is enabled in advance only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup
    # ─────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared advance only file
    And I navigate to the Advance Setup page in advance only validation
    And I search the Advance Setup grid by product name in advance only validation
    Then a row for the product appears in the Advance Setup grid in advance only validation
    And I capture the Advance Default value in advance only validation
    And I capture the Advance Monthly value in advance only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared statement file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance only statement upload page
    And I upload the prepared advance only file
    And I select the statement type "Aetna ACA" in advance only validation
    And I submit the advance only upload for processing
    Then the uploaded file appears in the advance only recently uploaded grid
    And the advance only upload extract processing completes and file ID is captured
    And the advance only upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review stage
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance only review page for the stored upload
    And every transaction type is "NB" in advance only validation
    When I click Complete Review on the advance only review page
    When I wait for 2 seconds and refresh the advance only data grid
    Then the advance only upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 6 — Re-navigate to upload and open the record for reconciliation
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the advance only upload page again
    And I open the advance only record by stored file ID
    And I wait for the advance only file to reach "Needs Attention" or "Reconciliation" stage
    Then the advance only reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Advance Only
    # ─────────────────────────────────────────────────────────────────────
    When I hover over the advance exception warning tooltip in advance only reconciliation
    Then the advance exception tooltip contains "Advance setup exists for this product and the pay-to agent is eligible for carrier advance" in advance only validation
    When I click the advance exception record in advance only reconciliation
    Then the Advance Exception title is displayed in advance only reconciliation
    When I click the "M 1-12" label in advance only reconciliation
    And I select the Advance Only radio button in advance only reconciliation
    Then the number of months input matches the captured Advance Monthly value in advance only validation
    When I capture the advance amount from the total advance input in advance only validation
    When I click the reconcile advance exception button in advance only reconciliation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF amount on Policy Ledger
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance only validation
    And I search the Policies grid by stored PolicyNumber in advance only validation
    And I click the policy actions ellipse in advance only validation
    And I click "View Ledger" in the policy actions menu in advance only validation
    Then the Policy Ledger page is displayed in advance only validation
    And the ARF row Amount matches the captured advance amount in advance only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare recovery statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance only recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber
    And the recovery file is saved with the stored timestamp suffix

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 10 — Upload recovery file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance only statement upload page
    And I upload the prepared advance only recovery file
    And I select the statement type "Aetna ACA" in advance only validation
    And I submit the advance only upload for processing
    Then the uploaded recovery file appears in the advance only recently uploaded grid
    And the advance only recovery upload extract processing completes and file ID is captured
    And the advance only recovery upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 11 — Review recovery file and verify chargeback
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance only review page for the stored recovery upload
    When I click Complete Review on the advance only review page
    When I navigate to the advance only upload page again
    Then the advance only recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance only validation
    And I search the Policies grid by stored PolicyNumber in advance only validation
    And I click the policy actions ellipse in advance only validation
    And I click "View Ledger" in the policy actions menu in advance only validation
    Then the Policy Ledger page is displayed in advance only validation
    When I expand a commission row in the Policy Ledger in advance only validation
    Then the commission details contain "ADVANCE_EARNED" in advance only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 13 — Validate Advance Overview historical record
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in advance only validation
    And I click the Historical tab in advance only overview
    And I search the Advance Overview grid by stored PolicyNumber in advance only validation
    And I open the first record in the Advance Overview grid in advance only validation
    Then the Advance Policy Details card Product field contains the expected product name in advance only validation
    When I click the sort indicator in the Advance Overview details grid in advance only validation
    Then the balance in the first row of the Advance Overview details grid is "$0.00" in advance only validation
