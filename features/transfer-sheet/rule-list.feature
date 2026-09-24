@transfer-sheet-regression @regression-test @icm
Feature: Transfer Sheet — Rule List CRUD and validations

  Ops Manager Transfer Sheet Rule List regression.
  Separate from @transfer-sheet E2E upload-to-ACH flow.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Live vs spec (Playwright MCP harvest):
  # URL: /commission-statement-processing/transfer-sheet
  # Tabs: Rule List | Transfer Policy List
  # Columns: S.No, Agent as per Statement, Product, Effective Date, Status, Actions
  # No Last Updated column in UI (T006 asserts S.No ascending display order)
  # Add form: mandatory Agent/Product/Effective Date/Status; submit disabled until filled
  # Unique(Agent+Product) — records cannot be deleted, only edited
  # Effective Date: calendar picker only (no manual text entry)

  Background:
    Given I am logged into PieQ ICM for transfer sheet regression tests

  @transfer-sheet-regression @regression-test @rule-list @positive @TEST-TS-RL-001-PROD
  Scenario: T001-TS-RL — Add Transfer Sheet record with mandatory fields
    # Unique(Agent+Product). Select product at position 1 → Save; on duplicate error pick next product.
    Given I open the Transfer Sheet page on transfer sheet
    When I add a unique Transfer Sheet rule preferring agent "Paul Miller" product "Aetna-Test-Product" with status "Active" and date 3 years back on transfer sheet
    Then the Transfer Sheet Rule List shows the newly added record on transfer sheet

  @transfer-sheet-regression @regression-test @rule-list @negative @TEST-TS-RL-002-PROD
  Scenario: T002-TS-RL — Cannot add Transfer Sheet record without mandatory fields
    Given I open the Transfer Sheet page on transfer sheet
    When I open the Add Transfer form on transfer sheet
    Then the Add Transfer submit button is disabled on transfer sheet
    And the Add Transfer form remains open on transfer sheet

  @transfer-sheet-regression @regression-test @rule-list @positive @TEST-TS-RL-003-PROD
  Scenario: T003-TS-RL — Toggle first record Active/Inactive status round-trip
    # Click first row → flip Active↔Inactive → Save → reopen same row → flip back → Save
    Given I open the Transfer Sheet page on transfer sheet
    When I open the edit form for the first Transfer Sheet Rule List record on transfer sheet
    And I flip the Transfer Sheet status and save on transfer sheet
    Then the Transfer Sheet Rule List shows the edited record with the flipped status on transfer sheet
    When I open the edit form for the same Transfer Sheet record on transfer sheet
    And I flip the Transfer Sheet status and save on transfer sheet
    Then the Transfer Sheet Rule List shows the edited record with the original status on transfer sheet

  @transfer-sheet-regression @regression-test @rule-list @negative @TEST-TS-RL-004-PROD
  Scenario: T004-TS-RL — Cannot add duplicate agent-product Transfer Sheet rule
    # Use first Rule List row (live Unique(Agent+Product)); assert sliding duplicate toast.
    Given I open the Transfer Sheet page on transfer sheet
    And I capture the first Transfer Sheet Rule List record on transfer sheet
    When I open the Add Transfer form on transfer sheet
    And I fill mandatory Transfer Sheet fields from the captured first record with status "Active" and date 3 years back on transfer sheet
    And I click Add Transfer on transfer sheet
    Then a duplicate Transfer Sheet rule error is shown on transfer sheet
    And the Add Transfer form remains open on transfer sheet

  @transfer-sheet-regression @regression-test @rule-list @positive @TEST-TS-RL-005-PROD
  Scenario: T005-TS-RL — Same agent can have rules for different products
    # If same agent already appears twice in Rule List → pass.
    # Else capture once-only agent → add same agent + different product (T001 unique-product retry).
    Given I open the Transfer Sheet page on transfer sheet
    When I ensure same agent has Transfer Sheet rules for different products on transfer sheet
    Then the Transfer Sheet Rule List shows an agent with at least two different products on transfer sheet

  @transfer-sheet-regression @regression-test @rule-list @observation @TEST-TS-RL-006-PROD
  Scenario: T006-TS-RL — Rule List grid rows are ordered by S.No ascending
    # Spec asked for Last Updated ascending; live Rule List has no Last Updated column (Toggle Columns: Agent, Product, Effective Date, Status only).
    Given I open the Transfer Sheet page on transfer sheet
    Then the Transfer Sheet Rule List S.No values are in ascending order on transfer sheet
