@agent-master @regression-test @level-hierarchy @icm
Feature: Agent Master — Level and Hierarchy

  Agent Level history and Reporting Manager on the Agent Edit Level & Hierarchy tab.
  Agency 1 Ops Manager (deva.r@pieq.ai). Requires E2E_PASSWORD in .env.
  One unique seed agent is created before scenarios and reused for all cases.

  Background:
    Given I am logged into PieQ ICM for agent master tests
    And a unique seed agent exists for level hierarchy

  # ── Agent levels ─────────────────────────────────────────────────────────

  @agent-master @regression-test @level @positive @TEST-AGT-034-PROD
  Scenario: T034-AGT-LVL — Add Agent Level opens level entry drawer
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I click Add Agent Level in agents
    Then the add agent level drawer is visible in agents

  @agent-master @regression-test @level @positive @TEST-AGT-035-PROD
  Scenario: T035-AGT-LVL — Add a level with effective start date
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I add agent level with a valid effective start date in agents
    Then the agent level appears in the Agent Level table in agents
    And the current level label appears when today is in range in agents

  @agent-master @regression-test @level @positive @TEST-AGT-036-PROD
  Scenario: T036-AGT-LVL — Add multiple levels with effective start dates
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I add multiple agent levels with non-overlapping effective dates in agents
    Then the Agent Level table shows multiple level rows in agents

  @agent-master @regression-test @level @negative @TEST-AGT-037-PROD
  Scenario: T037-AGT-LVL — No delete or effective end date edit on level history
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    Then agent level history has no delete or editable end date in agents

  @agent-master @regression-test @level @negative @TEST-AGT-038-PROD
  Scenario: T038-AGT-LVL — Overlapping effective start date is blocked
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I try to add agent level with overlapping effective start date in agents
    Then overlapping agent level date is blocked in agents

  @agent-master @regression-test @level @positive @TEST-AGT-039-PROD
  Scenario: T039-AGT-LVL — Added levels are excluded from level dropdown
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I capture add-level dropdown options then dismiss with Escape in agents
    Then assigned agent level names are absent from the add-level dropdown in agents

  @agent-master @regression-test @level @positive @TEST-AGT-040-PROD
  Scenario: T040-AGT-LVL — Effective start date is updatable without overlap
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I edit an agent level effective start date to a non-overlapping date in agents
    Then the agent level effective start date is updated in agents

  @agent-master @regression-test @level @positive @TEST-AGT-041-PROD
  Scenario: T041-AGT-LVL — Add Agent Level disabled after all levels assigned
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I add all available agent levels with valid dates in agents
    Then the Add Agent Level button is disabled in agents

  # ── Reporting manager ────────────────────────────────────────────────────

  @agent-master @regression-test @reporting @positive @TEST-AGT-042-PROD
  Scenario: T042-AGT-RPT — End date auto-fills when a later reporting record is added
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I add reporting manager from the list with start date "07/28/2026" in agents
    Then the newest reporting manager end date is "No End Date" in agents
    When I add reporting manager from the list with start date "08/21/2026" in agents
    Then the last reporting manager row end date is auto-populated in agents
    And the newest reporting manager end date is "No End Date" in agents

  @agent-master @regression-test @reporting @negative @TEST-AGT-043-PROD
  Scenario: T043-AGT-RPT — Overlapping reporting date range is blocked
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I add reporting manager from the list with start date "07/28/2026" in agents
    And I add reporting manager from the list with start date "08/21/2026" in agents
    And I add a different reporting manager with overlapping start date "08/18/2026" in agents
    Then reporting manager overlapping date inline error is shown in agents

  @agent-master @regression-test @reporting @positive @TEST-AGT-044-PROD
  Scenario: T044-AGT-RPT — Only one Current flag in level and reporting tables
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    Then at most one Current flag appears in Agent Level table in agents
    And at most one Current flag appears in Agent Reporting table in agents

  @agent-master @regression-test @reporting @validation @TEST-AGT-045-PROD
  Scenario: T045-AGT-RPT — Blank reporting manager blocks submit
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I open Add Reporting Manager in agents
    And I leave reporting manager blank and attempt save in agents
    Then reporting manager required field error is shown in agents

  @agent-master @regression-test @reporting @negative @TEST-AGT-046-PROD
  Scenario: T046-AGT-RPT — Non-existent agent id shows no results
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I open Add Reporting Manager in agents
    And I search reporting manager for nonexistent id "ZZZ-NO-AGENT-999" in agents
    Then reporting manager selection shows no results in agents

  @agent-master @regression-test @reporting @positive @TEST-AGT-047-PROD
  Scenario: T047-AGT-RPT — Agent level kebab shows Edit only
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I open kebab on first agent level row in agents
    Then the agent level row action menu shows only Edit in agents

  @agent-master @regression-test @reporting @negative @TEST-AGT-048-PROD
  Scenario: T048-AGT-RPT — Already-added manager not listed again
    When I open the Agents list in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I open Add Reporting Manager in agents
    Then already-added reporting manager names are excluded from selection in agents

  @agent-master @regression-test @reporting @negative @TEST-AGT-049-PROD
  Scenario: T049-AGT-RPT — Onboarding in Progress agents excluded from manager list
    When I open the Agents list in agents
    And I capture the seeded agent as the onboarding agent in agents
    And I open the seeded agent edit in agents
    And I open Level and Hierarchy tab in agents
    And I open Add Reporting Manager in agents
    And I search reporting manager for the captured onboarding agent in agents
    Then the captured onboarding agent is excluded from manager selection in agents
