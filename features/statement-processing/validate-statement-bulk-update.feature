@validate-statement-processing @regression-test @statement-bulk-update @icm
Feature: Validate Statement Review Bulk Update

  Bulk-update regression on the commission statement Review stage.
  Uses a 500-row statement generated from the HappyFlow U65 template
  ([MLB NEW]HappyFlowChangeCheckRunDate.xlsx via prepareLargeStatementFile).

  Upload once (@TEST-BU-000-Statement-Processing-PROD), then each field case reuses the same Review page.

  Flow (every field case):
    1. Select all rows via review-bulk-header-select-all
    2. Click review-bulk-update-button → Bulk Update modal
    3. Field to Update + New Value + Rationale
    4. Click review-bulk-modal-submit
    5. Wait for review toast; assert selected rows show the new value

  Run full suite: yarn test -g "@statement-bulk-update"
  Single field (after setup): yarn test -g "@TEST-BU-000-Statement-Processing-PROD|@TEST-BU-006-Statement-Processing-PROD"

  Background:
    Given I am logged into PieQ ICM for statement processing validation

  # ─────────────────────────────────────────────────────────────────────────
  # BU-000 — One-time upload to Review (shared by BU-001…BU-014)
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-000-Statement-Processing-PROD @regression-test
  Scenario: Upload 500-row statement to Review for bulk update
    Given the statement processing large file is prepared with 500 data rows
    When I open the statement processing upload page
    And I upload the prepared statement processing large file
    And I select the statement type "Aetna ACA" in statement processing validation
    And I submit the statement processing upload for processing
    Then the statement processing large file extract processing completes and file ID is captured
    And the statement processing large file row shows status "Waiting" and stage "Review"
    When I open the statement processing review page for the stored upload
    Then the statement processing review page shows record count 500
    And the statement processing review is stored for bulk update scenarios

  # ─────────────────────────────────────────────────────────────────────────
  # BU-001 — Policy Number
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-001-Statement-Processing-PROD @regression-test
  Scenario: Validate Policy Number field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Policy Number" to "BULK-PN-E2E-001" with rationale "E2E bulk update policy number" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Policy Number" with value "BULK-PN-E2E-001" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-002 — Policy Holder Name
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-002-Statement-Processing-PROD @regression-test
  Scenario: Validate Policy Holder Name field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Policy Holder Name" to "BULK HOLDER E2E" with rationale "E2E bulk update policy holder name" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Policy Holder Name" with value "BULK HOLDER E2E" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-003 — Agent Id
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-003-Statement-Processing-PROD @regression-test
  Scenario: Validate Agent Id field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Agent Id" to "600001" with rationale "E2E bulk update agent id" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Agent Id" with value "600001" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-004 — Agent Name
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-004-Statement-Processing-PROD @regression-test
  Scenario: Validate Agent Name field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Agent Name" to "BULK AGENT E2E" with rationale "E2E bulk update agent name" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Agent Name" with value "BULK AGENT E2E" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-005 — Address
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-005-Statement-Processing-PROD @regression-test
  Scenario: Validate Address field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Address" to "99 Bulk Update St, Malvern, PA 19355" with rationale "E2E bulk update address" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Address" with value "99 Bulk Update St, Malvern, PA 19355" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-006 — Gross Comm
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-006-Statement-Processing-PROD @regression-test
  Scenario: Validate Gross Comm field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Gross Comm" to "55.00" with rationale "E2E bulk update gross commission" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Gross Comm" with value "55.00" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-007 — Earned Comm
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-007-Statement-Processing-PROD @regression-test
  Scenario: Validate Earned Comm field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Earned Comm" to "48.40" with rationale "E2E bulk update earned commission" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Earned Comm" with value "48.40" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-008 — Product Name
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-008-Statement-Processing-PROD @regression-test
  Scenario: Validate Product Name field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Product Name" to "BULK-PRODUCT-E2E" with rationale "E2E bulk update product name" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Product Name" with value "BULK-PRODUCT-E2E" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-009 — Total Members
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-009-Statement-Processing-PROD @regression-test
  Scenario: Validate Total Members field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Total Members" to "2" with rationale "E2E bulk update total members" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Total Members" with value "2" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-010 — Issue Date
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-010-Statement-Processing-PROD @regression-test
  Scenario: Validate Issue Date field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Issue Date" to "01/15/2024" with rationale "E2E bulk update issue date" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Issue Date" with value "01/15/2024" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-011 — Paid to Date
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-011-Statement-Processing-PROD @regression-test
  Scenario: Validate Paid to Date field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Paid to Date" to "02/15/2024" with rationale "E2E bulk update paid to date" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Paid to Date" with value "02/15/2024" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-012 — Premium
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-012-Statement-Processing-PROD @regression-test
  Scenario: Validate Premium field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Premium" to "549.00" with rationale "E2E bulk update premium" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Premium" with value "549.00" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-013 — Commission %
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-013-Statement-Processing-PROD @regression-test
  Scenario: Validate Commission % field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Commission %" to "10" with rationale "E2E bulk update commission percent" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Commission %" with value "10" on statement processing review

  # ─────────────────────────────────────────────────────────────────────────
  # BU-014 — Chargeback
  # ─────────────────────────────────────────────────────────────────────────
  @TEST-BU-014-Statement-Processing-PROD @regression-test
  Scenario: Validate Chargeback field using Bulk Update
    Given the statement processing review is open for bulk update
    When I bulk update review field "Chargeback" to "0" with rationale "E2E bulk update chargeback" on statement processing review
    Then the review bulk update toast is shown on statement processing review
    And selected review rows show field "Chargeback" with value "0" on statement processing review
