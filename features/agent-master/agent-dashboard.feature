@agent-master @regression-test @icm
Feature: Agent Master — Agents list (dashboard)

  Agent Master list page: KPIs, search, status filter, column toggles, sort,
  rearrange, refresh, kebab/row navigation.
  Agency 1 Ops Manager (deva.r@pieq.ai). Requires E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for agent master tests

  # ── KPI ──────────────────────────────────────────────────────────────────

  @agent-master @regression-test @kpi @positive @TEST-AGT-001-PROD
  Scenario: T001-AGT-KPI — Key Points metrics show registered and active agents
    When I open the Agents list in agents
    Then the Agents list shows KPI Total Number of Registered Agents in agents
    And the Agents list shows KPI Active Agent Number with percentage in agents

  # ── Search ───────────────────────────────────────────────────────────────

  @agent-master @regression-test @search @positive @TEST-AGT-002-PROD
  Scenario: T002-AGT-SRH — Search agents grid by name
    When I open the Agents list in agents
    And I search the agents grid for "deva demo" in agents
    Then the agents grid shows rows matching "deva demo" in agents

  @agent-master @regression-test @search @positive @TEST-AGT-003-PROD
  Scenario: T003-AGT-SRH — Search agents grid by email
    When I open the Agents list in agents
    And I search the agents grid for "deva.r+1@pieq.ai" in agents
    Then the agents grid shows rows matching "deva.r+1@pieq.ai" in agents

  @agent-master @regression-test @search @positive @TEST-AGT-004-PROD
  Scenario: T004-AGT-SRH — Search agents grid by NPN
    When I open the Agents list in agents
    And I search the agents grid for "8900910981" in agents
    Then the agents grid shows rows matching "8900910981" in agents

  @agent-master @regression-test @search @negative @TEST-AGT-005-PROD
  Scenario Outline: T005-AGT-SRH — Search with invalid terms shows no results
    When I open the Agents list in agents
    And I search the agents grid for "<query>" in agents
    Then the agents grid shows no matching records in agents

    Examples:
      | query      |
      | waterfall  |
      | kyoto      |
      | sharingan  |
      | tintin     |

  # ── Status filter ────────────────────────────────────────────────────────

  @agent-master @regression-test @filter @status @positive @TEST-AGT-006-PROD
  Scenario: T006-AGT-FLT — Status filter defaults to All Status
    When I open the Agents list in agents
    Then the agents status filter shows "All Status" in agents

  @agent-master @regression-test @filter @status @positive @TEST-AGT-007-PROD
  Scenario Outline: T007-AGT-FLT — Filter agents grid by status
    When I open the Agents list in agents
    And I filter agents by status "<status>" in agents
    Then all visible agents grid rows have status "<status>" in agents

    Examples:
      | status                  |
      | Active                  |
      | Inactive                |
      | Onboarding in Progress  |
      | Pending                 |

  @agent-master @regression-test @filter @reset @positive @TEST-AGT-008-PROD
  Scenario: T008-AGT-FLT — Reset / remove filter restores original grid
    When I open the Agents list in agents
    And I search the agents grid for "deva demo" in agents
    And I filter agents by status "Active" in agents
    And I clear agents grid filters in agents
    Then the agents grid filters are cleared in agents
    And the agents grid has records displayed in agents

  # ── Column toggles ───────────────────────────────────────────────────────

  @agent-master @regression-test @columns @positive @TEST-AGT-009-PROD
  Scenario: T009-AGT-COL — Column toggle applies only after Apply
    When I open the Agents list in agents
    And I open column visibility panel in agents
    And I uncheck grid column "Agent" without applying in agents
    Then grid column "Agent" is still visible in agents
    When I apply column visibility changes in agents
    Then grid column "Agent" is not visible in agents

  @agent-master @regression-test @columns @positive @TEST-AGT-010-PROD
  Scenario: T010-AGT-COL — Cannot uncheck the last visible column
    When I open the Agents list in agents
    And I open column visibility panel in agents
    And I attempt to uncheck all agent grid columns in agents
    Then the last column toggle remains checked and disabled in agents

  @agent-master @regression-test @columns @positive @TEST-AGT-011-PROD
  Scenario: T011-AGT-COL — Reset column toggles restores default columns
    When I open the Agents list in agents
    And I toggle off grid column "Agent" in agents
    And I reset column visibility in agents
    Then grid column "Agent" is visible in agents

  @agent-master @regression-test @columns @search @observation @TEST-AGT-012-PROD
  Scenario: T012-AGT-COL — Search by name still works when Agent column is hidden
    When I open the Agents list in agents
    And I toggle off grid column "Agent" in agents
    And I search the agents grid for "Thomas kucan" in agents
    Then the agents grid shows rows matching "Thomas kucan" in agents

  # ── Sort / resize / rearrange ────────────────────────────────────────────

  @agent-master @regression-test @sort @positive @TEST-AGT-013-PROD
  Scenario: T013-AGT-SRT — Sort agents grid ascending, descending, then reset
    When I open the Agents list in agents
    And I clear the agents grid search in agents
    And I sort agents column "Agent" ascending in agents
    Then the agents grid is sorted by "Agent" ascending in agents
    When I sort agents column "Agent" descending in agents
    Then the agents grid is sorted by "Agent" descending in agents
    When I sort agents column "Agent" to clear sort in agents
    Then the agents grid sort is cleared for "Agent" in agents

  @agent-master @regression-test @columns @resize @positive @TEST-AGT-014-PROD
  Scenario: T014-AGT-RSZ — User can resize an agents grid column
    When I open the Agents list in agents
    And I resize agents grid column "Agent" wider in agents
    Then agents grid column "Agent" width increased in agents

  @agent-master @regression-test @columns @rearrange @positive @TEST-AGT-015-PROD
  Scenario: T015-AGT-ARR — User can rearrange agent grid columns
    When I open the Agents list in agents
    And I open column visibility panel in agents
    And I rearrange agents grid column "Agent" after "Status" in agents
    And I apply column visibility changes in agents
    Then agents grid column order places "Agent" after "Status" in agents

  # ── Refresh / actions / row click ────────────────────────────────────────

  @agent-master @regression-test @sync @positive @TEST-AGT-016-PROD
  Scenario: T016-AGT-REF — Refresh button reloads agents grid
    When I open the Agents list in agents
    And I capture agents grid record fingerprint in agents
    And I click refresh on agents grid in agents
    Then the agents grid is refreshed in agents

  @agent-master @regression-test @action @positive @TEST-AGT-017-PROD
  Scenario: T017-AGT-ACT — Kebab Edit navigates to Agent Edit page
    When I open the Agents list in agents
    And I open agent edit via action kebab in agents
    Then I am on the Agent Edit page in agents

  @agent-master @regression-test @records @positive @TEST-AGT-018-PROD
  Scenario: T018-AGT-ROW — Clicking a grid row navigates to Agent Edit page
    When I open the Agents list in agents
    And I open agent edit by clicking grid record in agents
    Then I am on the Agent Edit page in agents
