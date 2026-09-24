@agent-master @regression-test @icm
Feature: Agent Master — Edit Agent and shared form validation

  Edit Agent flows plus shared create/edit field validations.
  Agency 1 Ops Manager (deva.r@pieq.ai). Requires E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for agent master tests

  # ── Edit E2E / save state ─────────────────────────────────────────────────

  @agent-master @regression-test @edit @negative @duplicate @TEST-AGT-025-PROD
  Scenario: T025-AGT-EDT — Duplicate phone shows inline error on save
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I set the phone number to an existing agent phone in agents
    And I click Save on the agent form in agents
    And I confirm Save on the create agent modal in agents
    Then I see agent phone already exists validation in agents

  @agent-master @regression-test @edit @validation @positive @TEST-AGT-026-PROD
  Scenario: T026-AGT-EDT — Save disabled by default and when mandatory cleared
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    Then the agent form Save button is disabled in agents
    When I change editable agent fields with valid inputs in agents
    Then the agent form Save button is enabled in agents
    When I clear a mandatory agent field in agents
    Then the agent form Save button is disabled in agents

  @agent-master @regression-test @edit @validation @positive @TEST-AGT-027-PROD
  Scenario: T027-AGT-EDT — Email is not editable
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    Then the agent email field is not editable in agents

  # ── Edit form validations ────────────────────────────────────────────────

  @agent-master @regression-test @edit @validation @negative @TEST-AGT-028-PROD
  Scenario: T028-AGT-EDT — Name fields reject more than 50 characters
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I enter more than 50 characters in agent first and last name in agents
    And I click Save on the agent form in agents
    And I confirm Save on the create agent modal in agents
    Then I see agent validation "First name must not exceed 50 characters" in agents
    And I see agent validation "Last name must not exceed 50 characters" in agents

  @agent-master @regression-test @edit @validation @negative @TEST-AGT-029-PROD
  Scenario: T029-AGT-EDT — Physical mailing address field limits
    # Save enables only when all required fields (incl. bank details) are filled
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I enter oversized street address and city with valid zip on agent form in agents
    And I click Save on the agent form in agents
    And I confirm Save on the create agent modal in agents
    Then I see agent validation "Address must not exceed 100 characters" in agents
    And I see agent validation "City must not exceed 25 characters" in agents

  @agent-master @regression-test @edit @validation @negative @TEST-AGT-030-PROD
  Scenario: T030-AGT-EDT — Tax ID and W-9 Name invalid inputs
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I enter invalid tax id and oversized w9 name on agent form in agents
    And I click Save on the agent form in agents
    Then I see agent tax reporting validation errors in agents

  @agent-master @regression-test @edit @validation @ui @TEST-AGT-031-PROD
  Scenario: T031-AGT-EDT — Tax Type dropdown and Tax ID do not overlap
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Tax Type dropdown on agent form in agents
    And I hover Tax ID on agent form in agents
    Then tax type and tax id fields do not overlap in agents
