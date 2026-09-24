@policy-cancellation-carrier-advance @e2e @sanity-prod @icm
Feature: Validate Policy Cancellation with Carrier Advance

  End-to-end validation of the Policy Cancellation with Carrier Advance flow.

  Flow overview:
    1. Prepare an advance-payout statement with an incremented Customer UID (new policy)
    2. Validate the agent is eligible for carrier advance (Settings toggle ON)
    3. Validate the product has an Advance Setup record and capture the monthly value (advance_setup_month)
    4. Upload + Review the advance statement (new-policy tooltip) until Needs Attention
    5. Open the exception via Statement History, hover the warning icon (advance setup tooltip)
    6. Reconcile on Commission Reconciliation: M 1-12 label, no-of-months == advance_setup_month,
       Advance Only process option, transaction preview ARF=1 / Agency Credit=1, capture ARF + Agency Credit
    7. Validate ARF amount on Policy Ledger
    8. Upload a Partial Recovery statement (same Customer UID), validate the COMMISSION detail row
       (ADVANCE_EARN split), capture pending payment from Advance Overview (active settlement)
    9. Upload the Cancellation statement, process the Policy Cancellation Exception
       (chargeback ARF amount == cancellation template Chargeback value)
    10. Verify advance balance $0 on Historical Settlements (ARF Ledger)
    11. Verify the policy status becomes Cancelled

  Templates (TestFiles/PolicyCancellationCarrierAdvance/):
    Advance:      [MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Advance].xlsx
    Partial Recovery: [MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Recovery].xlsx
    Cancellation: [MLB]AdvanceStatement-PolicyCancellation-CarrierAdvance[Cancellation].xlsx

  The advance template is persisted with the incremented Customer UID after each run so every cycle
  creates a new policy (recovery and cancellation files reuse the stored Customer UID/PolicyNumber).

  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for policy cancellation carrier advance validation

  @e2e @sanity-prod @TEST-001-Policy-Cancellation-Carrier-Advance-PROD
  Scenario: T001-PCCA — Policy Cancellation with Carrier Advance: advance payout, partial recovery, cancellation, validate

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file (Advance Payout)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation carrier advance statement file is prepared from template
    And the Customer UID is incremented by 1 in the policy cancellation carrier advance prepared file
    And the policy cancellation carrier advance prepared file is saved with a timestamp suffix
    Then the policy cancellation carrier advance prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate agent eligibility for carrier advance (Settings toggle)
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared policy cancellation carrier advance file
    And I navigate to the Agents page in policy cancellation carrier advance validation
    And I search the Agents grid by agent ID in policy cancellation carrier advance validation
    Then a row containing the agent ID is displayed in policy cancellation carrier advance validation
    When I open the agent settings for the matched agent in policy cancellation carrier advance validation
    Then the carrier advance toggle is enabled in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup and capture the monthly value
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared policy cancellation carrier advance file
    And I resolve the actual product name from the Products page in policy cancellation carrier advance validation
    And I navigate to the Advance Setup page in policy cancellation carrier advance validation
    And I search the Advance Setup grid by product name in policy cancellation carrier advance validation
    Then a row for the product appears in the Advance Setup grid in policy cancellation carrier advance validation
    And I capture the advance setup month value in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared advance statement
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation carrier advance statement upload page
    And I upload the prepared policy cancellation carrier advance file
    And I select the statement type "Aetna ACA" in policy cancellation carrier advance validation
    And I submit the policy cancellation carrier advance upload for processing
    Then the uploaded file appears in the policy cancellation carrier advance recently uploaded grid
    And the policy cancellation carrier advance upload extract processing completes and file ID is captured
    And the policy cancellation carrier advance upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review advance statement (new-policy tooltip)
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation carrier advance review page for the stored upload
    And every transaction type is "NB" in policy cancellation carrier advance validation
    When I click Complete Review on the policy cancellation carrier advance review page
    Then the policy cancellation carrier advance upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 6 — Statement History → open exception record for reconciliation
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation carrier advance validation
    And I search the statement history by stored file ID in policy cancellation carrier advance validation
    And I refresh the statement history grid in policy cancellation carrier advance validation
    And I click the first statement history record in policy cancellation carrier advance validation
    And I hover over the warning icon on the statement history record in policy cancellation carrier advance validation
    Then the policy cancellation carrier advance statement history tooltip contains "advance setup"
    When I click the record in the statement history grid in policy cancellation carrier advance validation
    Then the policy cancellation carrier advance reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with Advance Only process option
    # ─────────────────────────────────────────────────────────────────────────
    Then the commission reconciliation heading is displayed in policy cancellation carrier advance validation
    And the reconciliation summary contains the stored Policy Number in policy cancellation carrier advance validation
    When I click the "M 1-12" label in policy cancellation carrier advance reconciliation
    Then the number of months input matches the captured advance setup month in policy cancellation carrier advance validation
    When I select the Advance Only radio button in policy cancellation carrier advance reconciliation
    Then the transaction preview contains "ARF" once in policy cancellation carrier advance validation
    And the transaction preview contains "Agency Credit" once in policy cancellation carrier advance validation
    When I capture the ARF value from the transaction preview in policy cancellation carrier advance validation
    And I capture the Agency Credit value from the transaction preview in policy cancellation carrier advance validation
    When I click the Reconcile button in policy cancellation carrier advance reconciliation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate ARF on Policy Ledger after advance payout
    # (Advance Only reconcile posts ARF only — COMMISSION rows appear after recovery)
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation carrier advance validation
    And I search the Policies grid by stored Customer UID in policy cancellation carrier advance validation
    And I click the policy actions ellipse in policy cancellation carrier advance validation
    And I click "View Ledger" in the policy actions menu in policy cancellation carrier advance validation
    Then the Policy Ledger page is displayed in policy cancellation carrier advance validation
    And the Policy Ledger contains a "ARF" earning type row in policy cancellation carrier advance validation
    And the ARF row Amount matches the captured ARF value in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare and upload partial recovery statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation carrier advance recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation carrier advance
    And the recovery file is saved with the stored timestamp suffix in policy cancellation carrier advance

    When I open the policy cancellation carrier advance statement upload page
    And I upload the prepared policy cancellation carrier advance recovery file
    And I select the statement type "Aetna ACA" in policy cancellation carrier advance validation
    And I submit the policy cancellation carrier advance upload for processing
    Then the uploaded policy cancellation carrier advance recovery file appears in the recently uploaded grid
    And the policy cancellation carrier advance recovery upload extract processing completes and file ID is captured
    And the policy cancellation carrier advance recovery upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation carrier advance review page for the stored recovery upload
    And I click Complete Review on the policy cancellation carrier advance review page
    Then the policy cancellation carrier advance recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 10 — Validate ARF + COMMISSION detail row after partial recovery
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation carrier advance validation
    And I search the Policies grid by stored Customer UID in policy cancellation carrier advance validation
    And I click the policy actions ellipse in policy cancellation carrier advance validation
    And I click "View Ledger" in the policy actions menu in policy cancellation carrier advance validation
    Then the Policy Ledger page is displayed in policy cancellation carrier advance validation
    And the Policy Ledger contains a "ARF" earning type row in policy cancellation carrier advance validation
    And the ARF row Amount matches the captured ARF value in policy cancellation carrier advance validation
    When I expand a COMMISSION row in the policy ledger in policy cancellation carrier advance validation
    Then the COMMISSION detail row contains "ADVANCE_EARN" in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 11 — Advance Overview (active settlement) → capture pending payment owed by agent
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in policy cancellation carrier advance validation
    And I search the Advance Overview grid by stored Customer UID in policy cancellation carrier advance validation
    And I open the first record in the Advance Overview grid in policy cancellation carrier advance validation
    Then I capture the pending payment owed by the agent in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 12 — Prepare and upload cancellation statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation carrier advance chargeback statement file is prepared from template
    And the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation carrier advance
    And the chargeback file is saved with the stored timestamp suffix in policy cancellation carrier advance

    When I open the policy cancellation carrier advance statement upload page
    And I upload the prepared policy cancellation carrier advance chargeback file
    And I select the statement type "Aetna ACA" in policy cancellation carrier advance validation
    And I submit the policy cancellation carrier advance upload for processing
    Then the uploaded policy cancellation carrier advance chargeback file appears in the recently uploaded grid
    And the policy cancellation carrier advance chargeback upload extract processing completes and file ID is captured
    And the policy cancellation carrier advance chargeback upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation carrier advance review page for the stored chargeback upload
    And I click Complete Review on the policy cancellation carrier advance review page
    Then the policy cancellation carrier advance chargeback upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 13 — Policy Cancellation Exception
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation carrier advance validation
    And I search the statement history by stored file ID in policy cancellation carrier advance validation
    And I refresh the statement history grid in policy cancellation carrier advance validation
    And I click the first statement history record in policy cancellation carrier advance validation
    And I hover over the warning icon on the statement history record in policy cancellation carrier advance validation
    Then the policy cancellation carrier advance statement history tooltip contains "policy cancellation"
    When I click the record in the statement history grid in policy cancellation carrier advance validation
    And I wait for 3 seconds in policy cancellation carrier advance validation
    Then the Policy Cancellation Exception page is displayed in policy cancellation carrier advance validation
    And the policy cancellation exception summary contains the stored Policy Number in policy cancellation carrier advance validation
    And the chargeback ARF amount matches the cancellation template in policy cancellation carrier advance validation
    When I click the proceed button on the Policy Cancellation Exception page in policy cancellation carrier advance validation
    Then a success toast is displayed for the policy cancellation in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 14 — ARF Ledger (Historical Settlements) → balance $0
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Advance Overview page in policy cancellation carrier advance validation
    And I click the Historical tab in policy cancellation carrier advance overview
    And I search the Advance Overview grid by stored Customer UID in policy cancellation carrier advance validation
    And I open the first record in the Advance Overview grid in policy cancellation carrier advance validation
    Then the balance in the last row of the Advance Overview details grid is "$0.00" in policy cancellation carrier advance validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 15 — Policy page shows Cancelled status
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation carrier advance validation
    And I search the Policies grid by stored Customer UID in policy cancellation carrier advance validation
    Then the policy status contains "Cancelled" in policy cancellation carrier advance validation
