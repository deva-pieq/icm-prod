@validate-commission-only @commission-only @e2e @sanity-prod @icm
Feature: Validate Commission Only (ARF)

  End-to-end validation of Advance Recovery Flow for Commission Only products.
  Uploads a prepared Excel statement with a new Customer UID (new policy),
  validates agent eligibility and product advance setup, completes the full
  upload → review → reconcile cycle selecting Commission Only, then verifies
  the ARF amount on the policy ledger. A recovery statement follows to
  reverse the advance and validate the $0 balance on the Advance Overview.

  Template: TestFiles/CommissionOnlyTemplate/[MLB]AdvanceStatement-CommissionOnly.xlsx
  Recovery: TestFiles/CommissionOnlyTemplate/[MLB]AdvanceStatement - Commission Only [Recovery].xlsx
  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for commission only validation

  @e2e @sanity-prod @TEST-001-Commission-Only-Validate-Commission-Split-PROD
  Scenario: T001-CO-ARF — Full Commission Only flow: prepare, upload, reconcile, validate, recover

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare commission-only statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the commission only statement file is prepared from template in commission only validation
    And the commission only Customer UID is incremented by 1 in the prepared file
    And the commission only prepared file is saved with a timestamp suffix
    Then the commission only prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate Agent eligibility for carrier advance
    # ─────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared commission only file
    And I navigate to the Agents page in commission only validation
    And I search the Agents grid by agent ID in commission only validation
    Then a row containing the agent ID and Level is displayed in commission only validation
    When I open the agent settings for the matched agent in commission only validation
    Then the carrier advance toggle is enabled in commission only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup
    # ─────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared commission only file
    And I navigate to the Advance Setup page in commission only validation
    And I search the Advance Setup grid by product name in commission only validation
    Then a row for the product appears in the Advance Setup grid in commission only validation
    And I capture the Advance Default value in commission only validation
    And I capture the Advance Monthly value in commission only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared commission-only statement file
    # ─────────────────────────────────────────────────────────────────────
    When I open the commission only statement upload page
    And I upload the prepared commission only file
    And I select the statement type "Aetna ACA" in commission only validation
    And I submit the commission only upload for processing
    Then the uploaded file appears in the commission only recently uploaded grid
    And the commission only upload extract processing completes and file ID is captured
    And the commission only upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review stage
    # ─────────────────────────────────────────────────────────────────────
    When I open the commission only review page for the stored upload
    And every transaction type is "NB" in commission only validation
    When I click Complete Review on the commission only review page
    When I wait for 2 seconds and refresh the commission only data grid
    Then the commission only upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 6 — Re-navigate to upload and open the record for reconciliation
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the commission only upload page again
    And I open the commission only record by stored file ID
    And I wait for the commission only file to reach "Needs Attention" or "Reconciliation" stage
    Then the commission only reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Commission Only
    # ─────────────────────────────────────────────────────────────────────
    # KEY DIFFERENCE: uses Commission radio button, not Advance Only radio
    When I hover over the advance exception warning tooltip in commission only reconciliation
    Then the advance exception tooltip contains "Advance setup exists for this product and the pay-to agent is eligible for carrier advance" in commission only validation
    When I click the advance exception record in commission only reconciliation
    Then the Advance Exception title is displayed in commission only reconciliation
    When I click the "M 1-12" label in commission only reconciliation
    And I select the Commission Only radio button in commission only reconciliation
    Then the number of months input matches the captured Advance Monthly value in commission only validation
    When I capture the advance amount from the total advance input in commission only validation
    When I click the reconcile advance exception button in commission only reconciliation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF amount on Policy Ledger
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in commission only validation
    And I search the Policies grid by stored PolicyNumber in commission only validation
    And I click the policy actions ellipse in commission only validation
    And I click "View Ledger" in the policy actions menu in commission only validation
    Then the Policy Ledger page is displayed in commission only validation
    And the ARF row Amount matches the captured advance amount in commission only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare recovery statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the commission only recovery statement file is prepared from template
    And the commission only recovery file Customer UID is replaced with the stored PolicyNumber
    And the commission only recovery file is saved with the stored timestamp suffix

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 10 — Upload recovery file
    # ─────────────────────────────────────────────────────────────────────
    When I open the commission only statement upload page
    And I upload the prepared commission only recovery file
    And I select the statement type "Aetna ACA" in commission only validation
    And I submit the commission only upload for processing
    Then the uploaded recovery file appears in the commission only recently uploaded grid
    And the commission only recovery upload extract processing completes and file ID is captured
    And the commission only recovery upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 11 — Review recovery file and verify chargeback
    # ─────────────────────────────────────────────────────────────────────
    When I open the commission only review page for the stored recovery upload
    When I click Complete Review on the commission only review page
    When I navigate to the commission only upload page again
    Then the commission only recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in commission only validation
    And I search the Policies grid by stored PolicyNumber in commission only validation
    And I click the policy actions ellipse in commission only validation
    And I click "View Ledger" in the policy actions menu in commission only validation
    Then the Policy Ledger page is displayed in commission only validation
    When I expand a commission row in the Policy Ledger in commission only validation
    Then the commission details contain "ADVANCE_EARNED" in commission only validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 13 — Validate Advance Overview historical record
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in commission only validation
    And I click the Historical tab in commission only overview
    And I search the Advance Overview grid by stored PolicyNumber in commission only validation
    And I open the first record in the Advance Overview grid in commission only validation
    Then the Advance Policy Details card Product field contains the expected product name in commission only validation
    When I click the sort indicator in the Advance Overview details grid in commission only validation
    Then the balance in the first row of the Advance Overview details grid is "$0.00" in commission only validation
