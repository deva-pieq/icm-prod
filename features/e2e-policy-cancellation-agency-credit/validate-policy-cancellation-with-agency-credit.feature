@policy-cancellation-agency-credit @e2e @sanity-prod @icm
Feature: Validate Policy Cancellation with Agency Credit

  End-to-end validation of the Policy Cancellation with Agency Credit flow.

  Flow overview:
    1. Prepare an advance-payout statement with an incremented Customer UID (new policy)
    2. Validate the agent is NOT eligible for carrier advance (Settings toggle OFF) so the
       money is credited to the agency instead of the agent
    3. Validate the product has an Advance Setup record and capture the monthly value (advance_setup_month)
    4. Upload + Review the advance statement (new-policy tooltip) until Needs Attention
    5. Open the exception via Statement History, hover the warning icon (commission amount
       or period not matched tooltip)
    6. Reconcile on Commission Reconciliation: commission-type radio (Carrier Advance Received –
       Agency Credit) + reconcile rationale, capture Agency Credit from the reconciliation summary
    7. Validate AGENCY_CREDIT on Policy Ledger (amount matches the captured preview value)
    8. Upload a Partial Recovery statement (same Customer UID), validate the AGENCY_DEBIT
       earning type rows and the AGENCY_DEBIT detail row (COMMISSION breakdown)
    9. Upload the Cancellation statement, process the Policy Cancellation Exception
       (agency info banner, Total Chargebacks, Total Earnings, agency debit == Total Earnings − Total Chargebacks)
    10. Verify the policy status becomes Cancelled

  Templates (TestFiles/PolicyCancellationCarrierAgencyCredit/):
    Advance:      [MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Advance].xlsx
    Partial Recovery: [MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Recovery].xlsx
    Cancellation: [MLB]AdvanceStatement-PolicyCancellation-AgencyCredit[Cancellation].xlsx

  The advance template is persisted with the incremented Customer UID after each run so every cycle
  creates a new policy (recovery and cancellation files reuse the stored Customer UID/PolicyNumber).

  Login always uses deva.r@pieq.ai (ignores E2E_EMAIL from .env).

  Background:
    Given I am logged into PieQ ICM for policy cancellation agency credit validation

  @e2e @sanity-prod @TEST-001-Policy-Cancellation-Agency-Credit-PROD
  Scenario: T001-PCAC — Policy Cancellation with Agency Credit: advance payout (agency credit), partial recovery, cancellation, validate

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare statement file (Advance Payout)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation agency credit statement file is prepared from template
    And the Customer UID is incremented by 1 in the policy cancellation agency credit prepared file
    And the policy cancellation agency credit prepared file is saved with a timestamp suffix
    Then the policy cancellation agency credit prepared file name and Customer UID are stored for later steps

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 2 — Validate agent is NOT eligible for advance (Settings toggle OFF)
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the Agent ID from the prepared policy cancellation agency credit file
    And I navigate to the Agents page in policy cancellation agency credit validation
    And I search the Agents grid by agent ID in policy cancellation agency credit validation
    Then a row containing the agent ID is displayed in policy cancellation agency credit validation
    When I open the agent settings for the matched agent in policy cancellation agency credit validation
    Then the advance eligibility toggle is turned off in policy cancellation agency credit validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 3 — Validate product advance setup and capture the monthly value
    # ─────────────────────────────────────────────────────────────────────────
    When I extract the product name alias from the prepared policy cancellation agency credit file
    And I resolve the actual product name from the Products page in policy cancellation agency credit validation
    And I navigate to the Advance Setup page in policy cancellation agency credit validation
    And I search the Advance Setup grid by product name in policy cancellation agency credit validation
    Then a row for the product appears in the Advance Setup grid in policy cancellation agency credit validation
    And I capture the advance setup month value in policy cancellation agency credit validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 4 — Upload the prepared advance statement
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation agency credit statement upload page
    And I upload the prepared policy cancellation agency credit file
    And I select the statement type "Aetna ACA" in policy cancellation agency credit validation
    And I submit the policy cancellation agency credit upload for processing
    Then the uploaded file appears in the policy cancellation agency credit recently uploaded grid
    And the policy cancellation agency credit upload extract processing completes and file ID is captured
    And the policy cancellation agency credit upload row shows status "Waiting" and stage "Review"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 5 — Review advance statement (new-policy tooltip)
    # ─────────────────────────────────────────────────────────────────────────
    When I open the policy cancellation agency credit review page for the stored upload
    And every transaction type is "NB" in policy cancellation agency credit validation
    When I click Complete Review on the policy cancellation agency credit review page
    Then the policy cancellation agency credit upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 6 — Statement History → open exception record for reconciliation
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation agency credit validation
    And I search the statement history by stored file ID in policy cancellation agency credit validation
    And I refresh the statement history grid in policy cancellation agency credit validation
    And I click the first statement history record in policy cancellation agency credit validation
    And I hover over the warning icon on the statement history record in policy cancellation agency credit validation
    Then the policy cancellation agency credit statement history tooltip contains "commission amount or period not matched"
    When I click the record in the statement history grid in policy cancellation agency credit validation
    Then the policy cancellation agency credit reconciliation page is displayed

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 7 — Reconcile with commission type option + rationale
    # ─────────────────────────────────────────────────────────────────────────
    Then the commission reconciliation heading is displayed in policy cancellation agency credit validation
    And the reconciliation summary contains the stored Policy Number in policy cancellation agency credit validation
    When I click the commission type radio in policy cancellation agency credit reconciliation
    And I fill the reconcile rationale in policy cancellation agency credit reconciliation
    When I capture the Agency Credit value from the reconciliation summary in policy cancellation agency credit validation
    And I click the Reconcile button in policy cancellation agency credit reconciliation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 8 — Validate AGENCY_CREDIT on Policy Ledger after advance payout
    # (Agent not eligible → the advance money is credited to the agency)
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation agency credit validation
    And I search the Policies grid by stored Customer UID in policy cancellation agency credit validation
    And I click the policy actions ellipse in policy cancellation agency credit validation
    And I click "View Ledger" in the policy actions menu in policy cancellation agency credit validation
    Then the Policy Ledger page is displayed in policy cancellation agency credit validation
    And the Policy Ledger contains a "AGENCY_CREDIT" earning type row in policy cancellation agency credit validation
    And the AGENCY_CREDIT row Amount matches the captured Agency Credit value in policy cancellation agency credit validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 9 — Prepare and upload partial recovery statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation agency credit recovery statement file is prepared from template
    And the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation agency credit
    And the recovery file is saved with the stored timestamp suffix in policy cancellation agency credit

    When I open the policy cancellation agency credit statement upload page
    And I upload the prepared policy cancellation agency credit recovery file
    And I select the statement type "Aetna ACA" in policy cancellation agency credit validation
    And I submit the policy cancellation agency credit upload for processing
    Then the uploaded policy cancellation agency credit recovery file appears in the recently uploaded grid
    And the policy cancellation agency credit recovery upload extract processing completes and file ID is captured
    And the policy cancellation agency credit recovery upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation agency credit review page for the stored recovery upload
    And I click Complete Review on the policy cancellation agency credit review page
    Then the policy cancellation agency credit recovery upload stage changes to "Completed"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 10 — Validate AGENCY_DEBIT + COMMISSION detail row after partial recovery
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation agency credit validation
    And I search the Policies grid by stored Customer UID in policy cancellation agency credit validation
    And I click the policy actions ellipse in policy cancellation agency credit validation
    And I click "View Ledger" in the policy actions menu in policy cancellation agency credit validation
    Then the Policy Ledger page is displayed in policy cancellation agency credit validation
    And the Policy Ledger contains at least 1 "AGENCY_DEBIT" earning type rows in policy cancellation agency credit validation
    When I click the AGENCY_DEBIT row in the policy ledger in policy cancellation agency credit validation
    Then the AGENCY_DEBIT detail row contains "COMMISSION" in policy cancellation agency credit validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 11 — Prepare and upload cancellation statement (same Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the policy cancellation agency credit chargeback statement file is prepared from template
    And the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation agency credit
    And the chargeback file is saved with the stored timestamp suffix in policy cancellation agency credit

    When I open the policy cancellation agency credit statement upload page
    And I upload the prepared policy cancellation agency credit chargeback file
    And I select the statement type "Aetna ACA" in policy cancellation agency credit validation
    And I submit the policy cancellation agency credit upload for processing
    Then the uploaded policy cancellation agency credit chargeback file appears in the recently uploaded grid
    And the policy cancellation agency credit chargeback upload extract processing completes and file ID is captured
    And the policy cancellation agency credit chargeback upload row shows status "Waiting" and stage "Review"

    When I open the policy cancellation agency credit review page for the stored chargeback upload
    And I click Complete Review on the policy cancellation agency credit review page
    Then the policy cancellation agency credit chargeback upload stage changes to "Needs Attention"

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 12 — Policy Cancellation Exception
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the commission statement history page in policy cancellation agency credit validation
    And I search the statement history by stored file ID in policy cancellation agency credit validation
    And I refresh the statement history grid in policy cancellation agency credit validation
    And I click the first statement history record in policy cancellation agency credit validation
    And I hover over the warning icon on the statement history record in policy cancellation agency credit validation
    Then the policy cancellation agency credit statement history tooltip contains "policy cancellation"
    When I click the record in the statement history grid in policy cancellation agency credit validation
    And I wait for 3 seconds in policy cancellation agency credit validation
    Then the Policy Cancellation Exception page is displayed in policy cancellation agency credit validation
    And the policy cancellation exception summary contains the stored Policy Number in policy cancellation agency credit validation
    And the policy cancellation agency info banner is displayed in policy cancellation agency credit validation
    When I click the Policy Ledger button on the Policy Cancellation Exception page in policy cancellation agency credit validation
    Then I capture the Total Chargebacks value in policy cancellation agency credit validation
    And I capture the Total Earnings value in policy cancellation agency credit validation
    When I close the policy ledger modal in policy cancellation agency credit validation
    And I capture the agency debit value from the advance recovery preview in policy cancellation agency credit validation
    Then the agency debit equals the Total Earnings minus Total Chargebacks in policy cancellation agency credit validation
    When I click the proceed button on the Policy Cancellation Exception page in policy cancellation agency credit validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 13 — Policy page shows Cancelled status
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in policy cancellation agency credit validation
    And I search the Policies grid by stored Customer UID in policy cancellation agency credit validation
    Then the policy status contains "Cancelled" in policy cancellation agency credit validation
