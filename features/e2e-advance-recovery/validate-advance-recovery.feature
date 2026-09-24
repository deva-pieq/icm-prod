@validate-advance-recovery @e2e @sanity-prod @icm
Feature: Validate Advance and Recovery (ARF)

  End-to-end validation of Advance Recovery Flow.
  Uploads a prepared Excel statement with a new Customer UID (new policy),
  validates agent eligibility and product advance setup, completes the full
  upload → review → reconcile cycle selecting Commission (which produces ARF),
  then verifies the ARF amount on the policy ledger with CHARGEBACK earning type.
  A recovery statement follows to reverse the advance and validate $0 balance
  on the Advance Overview.

  Template: TestFiles/AdvanceAndRecovery/[MLB]AdvanceStatement-AR.xlsx
  Recovery: TestFiles/AdvanceAndRecovery/[MLB]AdvanceStatement-AR [Recovery].xlsx
  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for advance recovery validation

  @e2e @sanity-prod @TEST-001-Advance-Recovery-ARF-PROD
  Scenario: T001-AR-ARF — Full Advance Recovery flow: prepare, upload, reconcile, validate, recover

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance recovery statement file is prepared from template
    And the Customer UID is incremented by 1 in the advance recovery prepared file
    And the advance recovery prepared file is saved with a timestamp suffix
    Then the advance recovery prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate Agent eligibility for carrier advance
    # ─────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared advance recovery file
    And I navigate to the Agents page in advance recovery validation
    And I search the Agents grid by agent ID in advance recovery validation
    Then a row containing the agent ID and Level is displayed in advance recovery validation
    When I open the agent settings for the matched agent in advance recovery validation
    Then the carrier advance toggle is enabled in advance recovery validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup
    # ─────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared advance recovery file
    And I navigate to the Advance Setup page in advance recovery validation
    And I search the Advance Setup grid by product name in advance recovery validation
    Then a row for the product appears in the Advance Setup grid in advance recovery validation
    And I capture the Advance Default value in advance recovery validation
    And I capture the Advance Monthly value in advance recovery validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared statement file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance recovery statement upload page
    And I upload the prepared advance recovery file
    And I select the statement type "Aetna ACA" in advance recovery validation
    And I submit the advance recovery upload for processing
    Then the uploaded file appears in the advance recovery recently uploaded grid
    And the advance recovery upload extract processing completes and file ID is captured
    And the advance recovery upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review stage
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance recovery review page for the stored upload
    And every transaction type is "NB" in advance recovery validation
    When I click Complete Review on the advance recovery review page
    When I wait for 2 seconds and refresh the advance recovery data grid
    Then the advance recovery upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 6 — Re-navigate to upload and open the record for reconciliation
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the advance recovery upload page again
    And I open the advance recovery record by stored file ID
    And I wait for the advance recovery file to reach "Needs Attention" or "Reconciliation" stage
    Then the advance recovery reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Commission (ARF flow)
    # ─────────────────────────────────────────────────────────────────────
    When I hover over the advance exception warning tooltip in advance recovery reconciliation
    Then the advance exception tooltip contains "Advance setup exists for this product and the pay-to agent is eligible for carrier advance" in advance recovery validation
    When I click the advance exception record in advance recovery reconciliation
    Then the Advance Exception title is displayed in advance recovery reconciliation
    When I click the "M 1-12" label in advance recovery reconciliation
    And I select the Commission radio button in advance recovery reconciliation
    Then the number of months input matches the captured Advance Monthly value in advance recovery validation
    When I capture the advance amount from the total advance input in advance recovery validation
    And the transaction preview grid contains an ARF row in advance recovery validation
    When I click the reconcile advance exception button in advance recovery reconciliation
    Then a success toast message is displayed in advance recovery validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF amount on Policy Ledger
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance recovery validation
    And I search the Policies grid by stored PolicyNumber in advance recovery validation
    And I click the policy actions ellipse in advance recovery validation
    And I click "View Ledger" in the policy actions menu in advance recovery validation
    Then the Policy Ledger page is displayed in advance recovery validation
    And the ARF row Amount matches the captured advance amount in advance recovery validation
    And the Policy Ledger contains a CHARGEBACK earning type row in advance recovery validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare recovery statement file
    # ─────────────────────────────────────────────────────────────────────
    Given the advance recovery recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber for advance recovery
    And the recovery file is saved with the stored timestamp suffix for advance recovery

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 10 — Upload recovery file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance recovery statement upload page
    And I upload the prepared advance recovery recovery file
    And I select the statement type "Aetna ACA" in advance recovery validation
    And I submit the advance recovery upload for processing
    Then the uploaded recovery file appears in the advance recovery recently uploaded grid
    And the advance recovery recovery upload extract processing completes and file ID is captured
    And the advance recovery recovery upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 11 — Review recovery file
    # ─────────────────────────────────────────────────────────────────────
    When I open the advance recovery review page for the stored recovery upload
    When I click Complete Review on the advance recovery review page
    When I navigate to the advance recovery upload page again
    Then the advance recovery recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in advance recovery validation
    And I search the Policies grid by stored PolicyNumber in advance recovery validation
    And I click the policy actions ellipse in advance recovery validation
    And I click "View Ledger" in the policy actions menu in advance recovery validation
    Then the Policy Ledger page is displayed in advance recovery validation
    When I expand a chargeback row in the Policy Ledger in advance recovery validation
    Then the chargeback details contain "CHARGEBACK" in advance recovery validation

    # ─────────────────────────────────────────────────────────────────────
    # PHASE 13 — Validate Advance Overview historical record
    # ─────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in advance recovery validation
    And I click the Historical tab in advance recovery overview
    And I search the Advance Overview grid by stored PolicyNumber in advance recovery validation
    And I open the first record in the Advance Overview grid in advance recovery validation
    Then the Advance Policy Details card Product field contains the expected product name in advance recovery validation
    When I click the sort indicator in the Advance Overview details grid in advance recovery validation
    Then the balance in the first row of the Advance Overview details grid is "$0.00" in advance recovery validation
