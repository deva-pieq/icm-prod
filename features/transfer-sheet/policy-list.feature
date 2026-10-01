@transfer-sheet-regression @regression-test @icm
Feature: Transfer Sheet — Transfer Policy List

  Ops Manager Transfer Policy List tab after reconciliation and rule eligibility.
  Separate from @transfer-sheet E2E upload-to-ACH payment path.
  Requires E2E_EMAIL and E2E_PASSWORD in .env.

  Live vs spec (Playwright MCP harvest V20260924):
  # Tab testid: transfer-sheet-tabs-tab-policy-list
  # Grid testid: policy-list-datagrid
  # Columns only: Policy Information | Member | Carrier & Product | Status
  # Carrier Agent / Writing Agent columns removed (not in Columns modal either)
  # Search matches policy / member / product; agent-name search returns 0

  Background:
    Given I am logged into PieQ ICM for transfer sheet regression tests

  @transfer-sheet-regression @regression-test @policy-list @positive @TEST-TS-PL-001-PROD
  Scenario: T001-TS-PL — Transfer Policy List shows policy, member, carrier/product, status
    Given I open the Transfer Sheet page on transfer sheet
    When I open the Transfer Policy List tab on transfer sheet
    Then the Transfer Policy List grid is displayed on transfer sheet
    And the Transfer Policy List shows Policy Information, Member, Carrier & Product, and Status columns on transfer sheet
    And at least one Transfer Policy List row shows non-empty Policy Information and Member on transfer sheet

  @transfer-sheet-regression @regression-test @policy-list @positive @TEST-TS-PL-002-PROD
  Scenario: T002-TS-PL — Inactive or future-effective rules are not listed for processing
    Given I open the Transfer Sheet page on transfer sheet
    When I open the Transfer Policy List tab on transfer sheet
    Then the Transfer Policy List grid is displayed on transfer sheet
    And every Transfer Policy List row has Status "Active" on transfer sheet
    And no Transfer Policy List row shows a future Effective date on transfer sheet
