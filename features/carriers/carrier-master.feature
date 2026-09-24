@carrier-master @regression-test @icm
Feature: Carrier Master — create, validate, search, filter, sort, and edit

  Ops Manager Carrier Master regression. Live labels harvested via Playwright MCP.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Skipped (Not Automatable / Hold):
  T002 full contact+dates details, T007 product linking, T020 multi-user concurrency,
  T021 agency isolation, T030 large-dataset performance.

  Live vs CSV:
  # Carrier Type is ACA, HEALTH, OVR, SENIOR PRODUCT (uppercase; no Dental) — extensible: new types may be added
  # Status is Active, Inactive (no Terminated)
  # List column is "Carrier" not "Carrier Name"
  # Name rejects special characters; Save shows carrier-name-error; Cancel returns to list
  # Last Review must be greater than Appointment Date
  # Phone strips letters (no inline error)
  # Name max 50 chars: over-max Save shows carrier-name-error; valid max Save redirects to list

  Background:
    Given I am logged into PieQ ICM for carrier master tests

  @carrier-master @regression-test @create @positive @TEST-001-Carrier-Master-PROD
  Scenario: T001-CAR-CRT — Create carrier with all mandatory fields
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    Then I am on the Carriers list in carriers
    And the carrier list shows the saved carrier name with status "Active" in carriers
    And the carrier list shows the saved carrier code in carriers

  @carrier-master @regression-test @create @dropdown @TEST-003-Carrier-Master-PROD
  Scenario: T003-CAR-TYP — Validate Carrier Type dropdown values
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I open the Carrier Type dropdown in carriers
    Then the Carrier Type dropdown lists known live categories with more than two options in carriers

  @carrier-master @regression-test @create @dropdown @TEST-004-Carrier-Master-PROD
  Scenario: T004-CAR-STS — Validate Status dropdown values
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I open the Status dropdown on add carrier in carriers
    Then the Status dropdown shows Active and Inactive with unset default in carriers

  @carrier-master @regression-test @create @search @TEST-005-Carrier-Master-PROD
  Scenario: T005-CAR-SRN — Create carrier and verify search by name
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier name in carriers
    Then the carrier list shows the saved carrier name with status "Active" in carriers

  @carrier-master @regression-test @create @search @TEST-006-Carrier-Master-PROD
  Scenario: T006-CAR-SRC — Create carrier and verify search by code
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier code in carriers
    Then the carrier list shows the saved carrier code in carriers

  @carrier-master @regression-test @create @cancel @TEST-008-Carrier-Master-PROD
  Scenario: T008-CAR-CAN — Cancel button behavior on Add Carrier
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I click Cancel on the add carrier form in carriers
    Then I am on the Carriers list in carriers
    And the saved carrier name is not in the carrier list in carriers

  @carrier-master @regression-test @create @notes @TEST-009-Carrier-Master-PROD
  Scenario: T009-CAR-NTE — Notes field valid input within 250 characters
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I set carrier notes to 250 characters in carriers
    And I save the carrier in carriers
    Then I am on the Carriers list in carriers
    And the carrier list shows the saved carrier name with status "Active" in carriers

  @carrier-master @regression-test @create @validation @TEST-010-Carrier-Master-PROD
  Scenario: T010-CAR-MAN — Missing mandatory fields blocks Save
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields leaving all blank in carriers
    Then the carrier Save button is disabled in carriers

  @carrier-master @regression-test @create @negative @TEST-011-Carrier-Master-PROD
  Scenario: T011-CAR-DUP — Duplicate Carrier Code shows error
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    Then I am on the Carriers list in carriers
    When I open the add carrier form in carriers
    And I try to create another carrier with the saved carrier code in carriers
    And I save the carrier in carriers
    Then I see the duplicate carrier code error in carriers
    When I open the Carriers list in carriers
    Then the carrier list shows exactly one row for the saved carrier code in carriers

  @carrier-master @regression-test @create @validation @TEST-012-Carrier-Master-PROD
  Scenario: T012-CAR-EML — Invalid email format in contact info
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I set carrier email to "not-an-email" in carriers
    And I click Save on the add carrier form in carriers
    Then I see the invalid email error on add carrier in carriers
    And I remain on the add carrier form in carriers

  @carrier-master @regression-test @create @validation @TEST-013-Carrier-Master-PROD
  Scenario: T013-CAR-PHN — Invalid phone number format
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I set carrier phone to "abcdef" in carriers
    Then the phone field rejects alphabetic input in carriers

  @carrier-master @regression-test @create @validation @TEST-015-Carrier-Master-PROD
  Scenario: T015-CAR-DRL — Appointment Date later than Last Review Date
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I set appointment date to "01/01/2026" in carriers
    And I set last review date to "01/01/2025" in carriers
    And I click Save on the add carrier form in carriers
    Then I see last review must be after appointment date in carriers

  @carrier-master @regression-test @create @validation @negative @TEST-016-Carrier-Master-PROD
  Scenario: T016-CAR-SPC — Carrier Name with special characters
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill unique mandatory carrier fields with special characters in the name in carriers
    And I click Save on the add carrier form in carriers
    Then I see the carrier name special-character inline error in carriers
    When I click Cancel on the add carrier form in carriers
    Then I am on the Carriers list in carriers
    And the saved carrier name is not in the carrier list in carriers

  @carrier-master @regression-test @create @validation @positive @TEST-017-Carrier-Master-PROD
  Scenario: T017-CAR-MAX — Maximum field lengths
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill max-length values on the add carrier form in carriers
    And I save the carrier in carriers
    Then I see the carrier name max-length inline error in carriers
    And I remain on the add carrier form in carriers
    When I set the carrier name to 50 characters in carriers
    And I save the carrier in carriers
    Then I am on the Carriers list in carriers
    And the carrier list shows the saved carrier name with status "Active" in carriers

  @carrier-master @regression-test @create @positive @TEST-018-Carrier-Master-PROD
  Scenario: T018-CAR-RPD — Rapid multiple Save clicks
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I click Save 3 times quickly on the add carrier form in carriers
    Then I am on the Carriers list in carriers
    And the carrier list shows exactly one row for the saved carrier code in carriers

  @carrier-master @regression-test @create @TEST-019-Carrier-Master-PROD
  Scenario: T019-CAR-RFR — Refresh during form entry
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I enter a carrier name only on the add form in carriers
    And I refresh the add carrier form in carriers
    Then the add carrier form fields are empty in carriers

  @carrier-master @regression-test @list @TEST-022-Carrier-Master-PROD
  Scenario: T022-CAR-LST — Validate carrier list loads
    When I open the Carriers list in carriers
    Then the carrier list shows columns from the CSV in carriers
    And the carrier grid shows the Actions column after horizontal scroll in carriers

  @carrier-master @regression-test @list @search @TEST-023-Carrier-Master-PROD
  Scenario: T023-CAR-SNM — Search by carrier name
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier name in carriers
    Then the carrier list shows the saved carrier name with status "Active" in carriers

  @carrier-master @regression-test @list @search @TEST-024-Carrier-Master-PROD
  Scenario: T024-CAR-SCD — Search by carrier code
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier code in carriers
    Then the carrier list shows the saved carrier code in carriers

  @carrier-master @regression-test @list @filter @TEST-025-Carrier-Master-PROD
  Scenario: T025-CAR-FAC — Filter by Active status
    When I open the Carriers list in carriers
    And I filter carriers by status "Active" in carriers
    Then all visible carrier rows have status "Active" in carriers

  @carrier-master @regression-test @list @filter @TEST-026-Carrier-Master-PROD
  Scenario: T026-CAR-FIN — Filter by Inactive status
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with status "Inactive" in carriers
    And I save the carrier in carriers
    And I filter carriers by status "Inactive" in carriers
    Then all visible carrier rows have status "Inactive" in carriers

  @carrier-master @regression-test @list @sort @TEST-027-Carrier-Master-PROD
  Scenario: T027-CAR-SRT — Sorting columns
    When I open the Carriers list in carriers
    And I clear the carrier search in carriers
    And I sort the "Carrier" column in carriers
    Then the "Carrier" column is sorted asc in carriers
    When I sort the "Carrier" column in carriers
    Then the "Carrier" column is sorted desc in carriers

  @carrier-master @regression-test @list @search @TEST-028-Carrier-Master-PROD
  Scenario: T028-CAR-INV — Search with invalid input
    When I open the Carriers list in carriers
    And I search carriers for "zzz-no-carrier-xyz" in carriers
    Then the carrier grid shows no records found in carriers

  @carrier-master @regression-test @list @filter @TEST-029-Carrier-Master-PROD
  Scenario: T029-CAR-EMP — Filter combination with no results
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier name in carriers
    And I filter carriers by status "Inactive" in carriers
    Then the carrier grid shows no records found in carriers

  @carrier-master @regression-test @list @filter @search @TEST-031-Carrier-Master-PROD
  Scenario: T031-CAR-CMB — Combined search and filter
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I search carriers for the saved carrier name in carriers
    And I filter carriers by status "Active" in carriers
    Then the carrier list shows the saved carrier name with status "Active" in carriers

  @carrier-master @regression-test @edit @TEST-032-Carrier-Master-PROD
  Scenario: T032-CAR-EDT — Edit carrier details
    When I open the Carriers list in carriers
    And I open the add carrier form in carriers
    And I fill mandatory carrier fields with unique valid data in carriers
    And I save the carrier in carriers
    And I open edit for the saved carrier in carriers
    And I change the carrier name on edit in carriers
    And I save the edited carrier in carriers
    Then I am on the Carriers list in carriers
    And the edited carrier name is shown in the list in carriers
