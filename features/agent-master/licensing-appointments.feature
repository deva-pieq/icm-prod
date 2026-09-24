@agent-master @regression-test @icm
Feature: Agent Master — Licensing and Appointments

  Carrier Appointments on Agent Edit: create records first, then search/sort,
  add/edit/delete, refresh. Agency 1 Ops Manager (deva.r@pieq.ai).
  Requires E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for agent master tests

  # ── Seed: create appointments (runs before search/sort) ───────────────────

  @agent-master @regression-test @licensing @seed @TEST-AGT-064-PROD
  Scenario: T064-AGT-LA — Seed carrier appointments for search/sort tests
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I capture current agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I capture carrier appointments record count in agents
    And I add a new carrier appointment with required fields in agents
    Then a success notification appears for appointment save in agents
    And I add a new carrier appointment with required fields in agents
    Then a success notification appears for appointment save in agents
    And I add a new carrier appointment with required fields in agents
    Then a success notification appears for appointment save in agents
    And the carrier appointments record count increased by 3 in agents

  # ── Search / sort (need seeded rows) ──────────────────────────────────────

  @agent-master @regression-test @licensing @search @positive @TEST-AGT-051-PROD
  Scenario: T051-AGT-LA — Search Carrier Appointments by carrier name
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I search carrier appointments for an existing carrier name in agents
    Then the carrier appointments grid shows only matching carrier rows in agents

  @agent-master @regression-test @licensing @sort @positive @TEST-AGT-052-PROD
  Scenario: T052-AGT-LA — Sort Carrier Appointments columns asc and desc
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I clear carrier appointments search in agents
    And I sort carrier appointments column "Carrier" ascending in agents
    Then the carrier appointments grid is sorted by "Carrier" ascending in agents
    When I sort carrier appointments column "Carrier" descending in agents
    Then the carrier appointments grid is sorted by "Carrier" descending in agents

  @agent-master @regression-test @licensing @search @positive @TEST-AGT-053-PROD
  Scenario: T053-AGT-LA — Search with nonexistent keyword shows no records
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I search carrier appointments for "zzz-no-carrier-xyz" in agents
    Then the carrier appointments grid shows no records found in agents

  # ── Landing / table actions ───────────────────────────────────────────────

  @agent-master @regression-test @licensing @positive @TEST-AGT-054-PROD
  Scenario: T054-AGT-LA — Add Appointments opens drawer
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    Then the add appointment drawer is visible in agents

  @agent-master @regression-test @licensing @positive @TEST-AGT-055-PROD
  Scenario: T055-AGT-LA — Delete appointment via kebab menu
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I open kebab on first carrier appointment row in agents
    Then the appointment action menu includes Delete in agents

  @agent-master @regression-test @licensing @positive @TEST-AGT-056-PROD
  Scenario: T056-AGT-LA — Edit appointment via kebab menu
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I open kebab on first carrier appointment row in agents
    And I choose Edit from appointment action menu in agents
    Then the edit appointment drawer or page is visible in agents

  @agent-master @regression-test @licensing @sync @positive @TEST-AGT-057-PROD
  Scenario: T057-AGT-LA — Sync refreshes Carrier Appointments table
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I click sync on carrier appointments grid in agents
    Then the carrier appointments grid is refreshed in agents

  # ── Add Appointment modal ────────────────────────────────────────────────

  @agent-master @regression-test @licensing @positive @TEST-AGT-058-PROD
  Scenario: T058-AGT-LA — Agent Name field is read-only with lock
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    Then the appointment Agent Name field is read-only in agents

  @agent-master @regression-test @licensing @negative @TEST-AGT-059-PROD
  Scenario: T059-AGT-LA — Save disabled when carrier not selected
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    Then the appointment Save button is disabled without carrier in agents

  @agent-master @regression-test @licensing @positive @TEST-AGT-060-PROD
  Scenario: T060-AGT-LA — Carrier dropdown lists active carriers
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    And I open the appointment Carrier dropdown in agents
    Then the appointment Carrier dropdown lists active carriers in agents

  @agent-master @regression-test @licensing @positive @TEST-AGT-061-PROD
  Scenario: T061-AGT-LA — Appointment Date calendar picker opens
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    And I open the appointment date picker in agents
    Then the appointment date picker is visible in agents

  @agent-master @regression-test @licensing @positive @TEST-AGT-062-PROD
  Scenario: T062-AGT-LA — Close drawer without saving
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    And I close the add appointment drawer in agents
    Then the add appointment drawer is closed in agents

  @agent-master @regression-test @licensing @negative @TEST-AGT-063-PROD
  Scenario: T063-AGT-LA — Notes over 255 characters show validation
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    And I enter notes exceeding 255 characters on appointment form in agents
    And I attempt to save the appointment in agents
    Then I see agent validation "Notes must not exceed 255 characters" in agents

  @agent-master @regression-test @licensing @negative @TEST-AGT-065-PROD
  Scenario: T065-AGT-LA — Already-appointed carrier excluded from dropdown
    When I open captured agent edit URL in agents
    And I open Licensing and Appointments tab in agents
    And I click Add Appointments in agents
    Then carriers already in appointments are excluded from Carrier dropdown in agents