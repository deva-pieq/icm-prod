@policy-cancellation-agency-advance @e2e @sanity-prod @icm
Feature: Validate Policy Cancellation with Agency Advance

  End-to-end validation of the Policy Cancellation with Agency Advance flow.

  Flow overview:
    1. Prepare an advance-payout statement with an incremented Customer UID (new policy)
    2. Validate the agent is eligible for carrier advance (Settings toggle ON)
    3. Validate the product has an Advance Setup record and capture the monthly value (advance_setup_month)
    4. Upload + Review the advance statement (new-policy tooltip) until Needs Attention
    5. Open the exception via Statement History, hover the warning icon (advance setup tooltip)
    6. Reconcile on Commission Reconciliation: M 1-12 label, no-of-months == advance_setup_month,
       Commission process option, transaction preview ARF=1 / Adjusted=1 / COMMISSION>=2, capture ARF value
    7. Validate ARF amount on Policy Ledger
    8. Upload a Partial Recovery statement (same Customer UID), validate Policy Ledger, capture pending payment
       from Advance Overview (active settlement)
    9. Upload the Cancellation statement, process the Policy Cancellation Exception
       (advance recovery preview amount == pending payment)
    10. Verify advance balance $0 on Historical Settlements (ARF Ledger)
    11. Verify the policy status becomes Cancelled

  Templates (TestFiles/PolicyCancellationAgencyAdvance/):
    Advance:      [MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Advance].xlsx
    Partial Recovery: [MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Recovery].xlsx
    Cancellation: [MLB]AdvanceStatement-PolicyCancellation-AgencyAdvance[Cancellation].xlsx

  The advance template is persisted with the incremented Customer UID after each run so every cycle
  creates a new policy (recovery and cancellation files reuse the stored Customer UID/PolicyNumber).

  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for policy cancellation with advance validation

  @e2e @sanity-prod @TEST-001-Policy-Cancellation-Agency-Advance-PROD
  Scenario: T001-PCA — Policy Cancellation with Agency Advance: advance payout, partial recovery, cancellation, validate

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file (Advance Payout)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation agency advance statement file is prepared from template
    And the Customer UID is incremented by 1 in the policy cancellation prepared file
    And the policy cancellation prepared file is saved with a timestamp suffix
    Then the policy cancellation prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate agent eligibility for carrier advance (Settings toggle)
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared policy cancellation file
    And I navigate to the Agents page in policy cancellation validation
    And I search the Agents grid by agent ID in policy cancellation validation
    Then a row containing the agent ID is displayed in policy cancellation validation
    When I open the agent settings for the matched agent in policy cancellation validation
    Then the carrier advance toggle is enabled in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup and capture the monthly value
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared policy cancellation file
    And I resolve the actual product name from the Products page in policy cancellation validation
    And I navigate to the Advance Setup page in policy cancellation validation
    And I search the Advance Setup grid by product name in policy cancellation validation
    Then a row for the product appears in the Advance Setup grid in policy cancellation validation
    And I capture the advance setup month value in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared advance statement
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation statement upload page
    And I upload the prepared policy cancellation file
    And I select the statement type "Aetna ACA" in policy cancellation validation
    And I submit the policy cancellation upload for processing
    Then the uploaded file appears in the policy cancellation recently uploaded grid
    And the policy cancellation upload extract processing completes and file ID is captured
    And the policy cancellation upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review advance statement (new-policy tooltip)
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation review page for the stored upload
    And every transaction type is "NB" in policy cancellation agency advance validation
    When I click Complete Review on the policy cancellation review page
    Then the policy cancellation upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 6 — Statement History → open exception record for reconciliation
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation validation
    And I search the statement history by stored file ID in policy cancellation validation
    And I click the first statement history record in policy cancellation validation
    And I hover over the warning icon on the statement history record in policy cancellation validation
    Then the policy cancellation statement history tooltip contains "advance setup"
    When I click the record in the statement history grid in policy cancellation validation
    Then the policy cancellation reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Commission process option
    # ─────────────────────────────────────────────────────────────────────────
    Then the commission reconciliation heading is displayed in policy cancellation validation
    And the reconciliation summary contains the stored Policy Number in policy cancellation validation
    When I click the "M 1-12" label in policy cancellation reconciliation
    Then the number of months input matches the captured advance setup month in policy cancellation validation
    When I select the Commission radio button in policy cancellation reconciliation
    Then the transaction preview contains "ARF" once in policy cancellation validation
    And the transaction preview contains "Adjusted" once in policy cancellation validation
    And the transaction preview contains at least 2 "COMMISSION" rows in policy cancellation validation
    When I capture the ARF value from the transaction preview in policy cancellation validation
    When I click the Reconcile button in policy cancellation reconciliation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF + COMMISSION on Policy Ledger after advance payout
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation validation
    And I search the Policies grid by stored Customer UID in policy cancellation validation
    And I click the policy actions ellipse in policy cancellation validation
    And I click "View Ledger" in the policy actions menu in policy cancellation validation
    Then the Policy Ledger page is displayed in policy cancellation validation
    And the Policy Ledger contains a "ARF" earning type row in policy cancellation validation
    And the Policy Ledger contains a "COMMISSION" earning type row in policy cancellation validation
    And the ARF row Amount matches the captured ARF value in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare and upload partial recovery statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation
    And the recovery file is saved with the stored timestamp suffix in policy cancellation

    When I open the policy cancellation statement upload page
    And I upload the prepared policy cancellation recovery file
    And I select the statement type "Aetna ACA" in policy cancellation validation
    And I submit the policy cancellation upload for processing
    Then the uploaded policy cancellation recovery file appears in the recently uploaded grid
    And the policy cancellation recovery upload extract processing completes and file ID is captured
    And the policy cancellation recovery upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation review page for the stored recovery upload
    And I click Complete Review on the policy cancellation review page
    Then the policy cancellation recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 10 — Validate ARF + COMMISSION on Policy Ledger after partial recovery
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation validation
    And I search the Policies grid by stored Customer UID in policy cancellation validation
    And I click the policy actions ellipse in policy cancellation validation
    And I click "View Ledger" in the policy actions menu in policy cancellation validation
    Then the Policy Ledger page is displayed in policy cancellation validation
    And the Policy Ledger contains a "ARF" earning type row in policy cancellation validation
    And the Policy Ledger contains at least 2 "COMMISSION" earning type rows in policy cancellation validation
    And the ARF row Amount matches the captured ARF value in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 11 — Advance Overview (active settlement) → capture pending payment owed by agent
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in policy cancellation validation
    And I search the Advance Overview grid by stored Customer UID in policy cancellation validation
    And I open the first record in the Advance Overview grid in policy cancellation validation
    Then I capture the pending payment owed by the agent in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 12 — Prepare and upload cancellation statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation chargeback statement file is prepared from template
    And the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation
    And the chargeback file is saved with the stored timestamp suffix in policy cancellation

    When I open the policy cancellation statement upload page
    And I upload the prepared policy cancellation chargeback file
    And I select the statement type "Aetna ACA" in policy cancellation validation
    And I submit the policy cancellation upload for processing
    Then the uploaded policy cancellation chargeback file appears in the recently uploaded grid
    And the policy cancellation chargeback upload extract processing completes and file ID is captured
    And the policy cancellation chargeback upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation review page for the stored chargeback upload
    And I click Complete Review on the policy cancellation review page
    Then the policy cancellation chargeback upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 13 — Policy Cancellation Exception
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation validation
    And I search the statement history by stored file ID in policy cancellation validation
    And I click the first statement history record in policy cancellation validation
    And I hover over the warning icon on the statement history record in policy cancellation validation
    Then the policy cancellation statement history tooltip contains "policy cancellation"
    When I click the record in the statement history grid in policy cancellation validation
    And I wait for 3 seconds in policy cancellation validation
    Then the Policy Cancellation Exception page is displayed in policy cancellation validation
    And the policy cancellation exception summary contains the stored Policy Number in policy cancellation validation
    And the advance recovery preview amount matches the captured pending payment in policy cancellation validation
    When I click the proceed button on the Policy Cancellation Exception page in policy cancellation validation
    Then a success toast is displayed for the policy cancellation in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 14 — ARF Ledger (Historical Settlements) → balance $0
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in policy cancellation validation
    And I click the Historical tab in policy cancellation overview
    And I search the Advance Overview grid by stored Customer UID in policy cancellation validation
    And I open the first record in the Advance Overview grid in policy cancellation validation
    Then the balance in the last row of the Advance Overview details grid is "$0.00" in policy cancellation validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 15 — Policy page shows Cancelled status
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation validation
    And I search the Policies grid by stored Customer UID in policy cancellation validation
    Then the policy status contains "Cancelled" in policy cancellation validation
