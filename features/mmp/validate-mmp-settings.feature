@mmp @regression-test @mmp-settings @icm
Feature: Marketing Match Program — Agent Settings UI

  Validates MMP controls on Agent → Settings (SNO 1–11).
  Ops login: agency3OpsCredentials (deva.r+ag3@pieq.ai).
  Live app max contribution is $2000/mo (CSV said $1000 — T006 uses live app).

  Background:
    Given I am logged into PieQ ICM for mmp validation

  @TEST-001-Mmp-Settings-PROD @regression-test @positive
  Scenario: T001 — Settings tab MMP section available for existing and new agents
    When I open an existing agent Settings tab in mmp settings validation
    Then the Marketing Match Program section is visible in mmp settings validation
    When I create a new agent and open Settings tab in mmp settings validation
    Then the Marketing Match Program section is visible in mmp settings validation

  @TEST-002-Mmp-Settings-PROD @regression-test @positive
  Scenario: T002 — Opt for Marketing Match Program can be enabled and disabled
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    Then the Marketing Match Program toggle is enabled in mmp settings validation
    When I disable the Marketing Match Program toggle in mmp settings validation
    Then the Marketing Match Program toggle is disabled in mmp settings validation

  @TEST-003-Mmp-Settings-PROD @regression-test @positive
  Scenario: T003 — Opt for Marketing Match Program label and toggle are both clickable
    When I open an existing agent Settings tab in mmp settings validation
    And I click the Marketing Match Program label in mmp settings validation
    Then the Marketing Match Program toggle state has flipped in mmp settings validation
    When I click the Marketing Match Program switch in mmp settings validation
    Then the Marketing Match Program toggle state has flipped in mmp settings validation

  @TEST-004-Mmp-Settings-PROD @regression-test @positive
  Scenario: T004 — Enabling MMP enables contribution amount and earning type fields
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    Then the MMP contribution amount and earning type fields are enabled in mmp settings validation

  @TEST-005-Mmp-Settings-PROD @regression-test @positive
  Scenario: T005 — Disabling MMP disables contribution amount and earning type fields
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I disable the Marketing Match Program toggle in mmp settings validation
    Then the MMP contribution amount and earning type fields are disabled in mmp settings validation

  @TEST-006-Mmp-Settings-PROD @regression-test @negative
  Scenario: T006 — Contribution amount above maximum shows red validation error
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I set MMP contribution amount to "2001" in mmp settings validation
    And I set MMP contribution percentage to "100" in mmp settings validation
    And I select MMP earning types Commission and Bonus in mmp settings validation
    And I click Save on MMP settings in mmp settings validation
    Then the MMP validation error for maximum contribution is shown in mmp settings validation

  @TEST-007-Mmp-Settings-PROD @regression-test @negative
  Scenario: T007 — Empty Deduct from Earning Type blocks save
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I set MMP contribution amount to "100" in mmp settings validation
    And I clear MMP earning types in mmp settings validation
    And I click Save on MMP settings in mmp settings validation
    Then the MMP validation error for earning type is shown in mmp settings validation

  @TEST-008-Mmp-Settings-PROD @regression-test @negative
  Scenario: T008 — Invalid contribution amount zero shows red validation error
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I set MMP contribution amount to "0" in mmp settings validation
    And I select MMP earning types Commission and Bonus in mmp settings validation
    And I click Save on MMP settings in mmp settings validation
    Then the MMP validation error for valid contribution amount is shown in mmp settings validation

  @TEST-009-Mmp-Settings-PROD @regression-test @positive
  Scenario: T009 — Confirmation popup appears when saving MMP settings
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I set MMP contribution amount to "500" in mmp settings validation
    And I set MMP contribution percentage to "100" in mmp settings validation
    And I select MMP earning types Commission and Bonus in mmp settings validation
    And I click Save on MMP settings in mmp settings validation
    Then the MMP settings confirmation dialog is visible in mmp settings validation

  @TEST-010-Mmp-Settings-PROD @regression-test @positive
  Scenario: T010 — Deduct from Earning Type lists Commission Bonus and Override
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    Then the MMP earning type dropdown lists Commission Bonus and Override in mmp settings validation

  @TEST-011-Mmp-Settings-PROD @regression-test @positive
  Scenario: T011 — Select All and Clear All on Deduct from Earning Type
    When I open an existing agent Settings tab in mmp settings validation
    And I enable the Marketing Match Program toggle in mmp settings validation
    And I click Select All on MMP earning types in mmp settings validation
    Then all MMP earning types are selected in mmp settings validation
    When I click Clear All on MMP earning types in mmp settings validation
    Then no MMP earning types remain selected in mmp settings validation
