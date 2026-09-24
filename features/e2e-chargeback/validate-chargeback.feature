@validate-chargeback @e2e @sanity-prod @icm
Feature: Validate Chargeback Recovery Options

  End-to-end validation of Chargeback recovery for Aetna ACA statements.

  Flow overview:
    1. Prepare NB statement from template with incremented Customer UID (new policy)
    2. Upload NB → Complete Review → Completed → Policy Ledger shows COMMISSION
    3. Upload RC1 (As Per Split) → Needs Attention → open history record → commission details
       → total chargeback card → open CHARGEBACK row → reconcile with split radio
       → Policy Ledger CHARGEBACK detail contains Agency, Agent, Sales Leader
    4. Upload RC2 (Agency) → Needs Attention → open history record → commission details
       → total chargeback card → open CHARGEBACK row → reconcile with agency radio
       → Policy Ledger CHARGEBACK detail contains only Agency
    5. Upload RC3 (Agent) → Needs Attention → open history record → commission details
       → total chargeback card → open CHARGEBACK row → reconcile with agent radio
       → Policy Ledger CHARGEBACK detail contains only Agent

  Templates (TestFiles/Chargeback/):
    NB:  Chargeback+AG1+AetnaACA[NB].xlsx
    RC1: Chargeback+AG1+AetnaACA[RC1]AsPerSplit.xlsx
    RC2: Chargeback+AG1+AetnaACA[RC2]Agency.xlsx
    RC3: Chargeback+AG1+AetnaACA[RC3]Agent.xlsx

  NB increments and persists Customer UID; RC1/RC2/RC3 reuse the stored PolicyNumber.
  Login always uses deva.r@pieq.ai (Agency 1 / Ops Manager).

  Background:
    Given I am logged into PieQ ICM for chargeback validation

  @e2e @sanity-prod @TEST-001-Chargeback-Recovery-Options-PROD
  Scenario: T001-CBK — Chargeback NB commission then RC1/RC2/RC3 recovery options

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 1 — Prepare NB statement (unique Customer UID)
    # ─────────────────────────────────────────────────────────────────────────
    Given the chargeback NB statement file is prepared from template
    And the chargeback NB Customer UID is incremented and stored in chargeback validation
    And the chargeback NB prepared file is saved with a timestamp suffix

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 2 — Upload NB → Complete Review → Completed
    # ─────────────────────────────────────────────────────────────────────────
    When I open the chargeback statement upload page
    And I upload the prepared chargeback NB file
    And I select the statement type "Aetna ACA" in chargeback validation
    And I submit the chargeback upload for processing
    Then the uploaded chargeback NB file appears in the recently uploaded grid
    And the chargeback NB upload extract processing completes and file ID is captured
    And the chargeback NB upload row shows status "Waiting" and stage "Review"

    When I open the chargeback review page for the stored NB upload
    And I click Complete Review on the chargeback review page
    Then the chargeback NB upload stage changes to "Completed"

    When I navigate to the commission statement history page in chargeback validation
    And I search the statement history by stored NB file ID in chargeback validation
    Then the statement history row stage is "Completed" for the NB file in chargeback validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 3 — Policy Ledger after NB shows COMMISSION
    # ─────────────────────────────────────────────────────────────────────────
    When I navigate to the Policies page in chargeback validation
    And I search the Policies grid by stored Policy Number in chargeback validation
    And I click the policy actions kebab and open Policy Ledger in chargeback validation
    Then the Policy Ledger page is displayed in chargeback validation
    And the Policy Ledger contains a "COMMISSION" earning type row in chargeback validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 4 — RC1 As Per Split
    # ─────────────────────────────────────────────────────────────────────────
    Given the chargeback RC1 statement file is prepared from template in chargeback validation
    And the RC file Customer UID is replaced with the stored PolicyNumber in chargeback validation

    When I open the chargeback statement upload page
    And I upload the prepared chargeback RC file
    And I select the statement type "Aetna ACA" in chargeback validation
    And I submit the chargeback upload for processing
    Then the uploaded chargeback RC file appears in the recently uploaded grid
    And the chargeback RC upload extract processing completes and file ID is captured
    And the chargeback RC upload row shows status "Waiting" and stage "Review"

    When I open the chargeback review page for the stored RC upload
    And I click Complete Review on the chargeback review page
    Then the chargeback RC upload stage changes to "Needs Attention"

    When I navigate to the commission statement history page in chargeback validation
    And I search the statement history by stored RC file ID in chargeback validation
    Then the statement history row stage is "Needs Attention" for the RC file in chargeback validation
    When I click the record in the statement history grid in chargeback validation
    Then the commission details page is displayed in chargeback validation
    And the total chargeback card shows a non-zero value in chargeback validation
    When I click the CHARGEBACK record on the commission details page in chargeback validation
    Then the Chargeback Recovery Required heading is displayed in chargeback validation
    When I ensure the recovery option radio is selected for the active RC in chargeback validation
    And I enter the chargeback rationale for the active RC in chargeback validation
    And I click Reconcile on the chargeback recovery page
    And I wait for 2 seconds in chargeback validation

    When I navigate to the Policies page in chargeback validation
    And I search the Policies grid by stored Policy Number in chargeback validation
    And I click the policy actions kebab and open Policy Ledger in chargeback validation
    Then the Policy Ledger page is displayed in chargeback validation
    And the Policy Ledger contains a "CHARGEBACK" earning type row in chargeback validation
    When I click the last CHARGEBACK row in the Policy Ledger in chargeback validation
    Then the CHARGEBACK detail row matches the active RC recovery parties in chargeback validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 5 — RC2 Agency
    # ─────────────────────────────────────────────────────────────────────────
    Given the chargeback RC2 statement file is prepared from template in chargeback validation
    And the RC file Customer UID is replaced with the stored PolicyNumber in chargeback validation

    When I open the chargeback statement upload page
    And I upload the prepared chargeback RC file
    And I select the statement type "Aetna ACA" in chargeback validation
    And I submit the chargeback upload for processing
    Then the uploaded chargeback RC file appears in the recently uploaded grid
    And the chargeback RC upload extract processing completes and file ID is captured
    And the chargeback RC upload row shows status "Waiting" and stage "Review"

    When I open the chargeback review page for the stored RC upload
    And I click Complete Review on the chargeback review page
    Then the chargeback RC upload stage changes to "Needs Attention"

    When I navigate to the commission statement history page in chargeback validation
    And I search the statement history by stored RC file ID in chargeback validation
    Then the statement history row stage is "Needs Attention" for the RC file in chargeback validation
    When I click the record in the statement history grid in chargeback validation
    Then the commission details page is displayed in chargeback validation
    And the total chargeback card shows a non-zero value in chargeback validation
    When I click the CHARGEBACK record on the commission details page in chargeback validation
    Then the Chargeback Recovery Required heading is displayed in chargeback validation
    When I ensure the recovery option radio is selected for the active RC in chargeback validation
    And I enter the chargeback rationale for the active RC in chargeback validation
    And I click Reconcile on the chargeback recovery page
    And I wait for 2 seconds in chargeback validation

    When I navigate to the Policies page in chargeback validation
    And I search the Policies grid by stored Policy Number in chargeback validation
    And I click the policy actions kebab and open Policy Ledger in chargeback validation
    Then the Policy Ledger page is displayed in chargeback validation
    And the Policy Ledger contains a "CHARGEBACK" earning type row in chargeback validation
    When I click the last CHARGEBACK row in the Policy Ledger in chargeback validation
    Then the CHARGEBACK detail row matches the active RC recovery parties in chargeback validation

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 6 — RC3 Agent
    # ─────────────────────────────────────────────────────────────────────────
    Given the chargeback RC3 statement file is prepared from template in chargeback validation
    And the RC file Customer UID is replaced with the stored PolicyNumber in chargeback validation

    When I open the chargeback statement upload page
    And I upload the prepared chargeback RC file
    And I select the statement type "Aetna ACA" in chargeback validation
    And I submit the chargeback upload for processing
    Then the uploaded chargeback RC file appears in the recently uploaded grid
    And the chargeback RC upload extract processing completes and file ID is captured
    And the chargeback RC upload row shows status "Waiting" and stage "Review"

    When I open the chargeback review page for the stored RC upload
    And I click Complete Review on the chargeback review page
    Then the chargeback RC upload stage changes to "Needs Attention"

    When I navigate to the commission statement history page in chargeback validation
    And I search the statement history by stored RC file ID in chargeback validation
    Then the statement history row stage is "Needs Attention" for the RC file in chargeback validation
    When I click the record in the statement history grid in chargeback validation
    Then the commission details page is displayed in chargeback validation
    And the total chargeback card shows a non-zero value in chargeback validation
    When I click the CHARGEBACK record on the commission details page in chargeback validation
    Then the Chargeback Recovery Required heading is displayed in chargeback validation
    When I ensure the recovery option radio is selected for the active RC in chargeback validation
    And I enter the chargeback rationale for the active RC in chargeback validation
    And I click Reconcile on the chargeback recovery page
    And I wait for 2 seconds in chargeback validation

    When I navigate to the Policies page in chargeback validation
    And I search the Policies grid by stored Policy Number in chargeback validation
    And I click the policy actions kebab and open Policy Ledger in chargeback validation
    Then the Policy Ledger page is displayed in chargeback validation
    And the Policy Ledger contains a "CHARGEBACK" earning type row in chargeback validation
    When I click the last CHARGEBACK row in the Policy Ledger in chargeback validation
    Then the CHARGEBACK detail row matches the active RC recovery parties in chargeback validation
