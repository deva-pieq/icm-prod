@agent-master @regression-test @icm
Feature: Agent Master — Organisation Tree

  Organisation tree on Level & Hierarchy: node content, You badge, expand/collapse, zoom, pan.
  Uses agent ANTHONY HUNSBERGER (7146581). Agency 1 Ops Manager (deva.r@pieq.ai).
  Requires E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for agent master tests
    When I open the Agents list in agents
    And I search the agents grid for "ANTHONY HUNSBERGER" in agents
    Then the agents grid shows rows matching "ANTHONY HUNSBERGER" in agents
    And I open agent edit for grid row matching "ANTHONY HUNSBERGER" in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-066-PROD
  Scenario: T066-AGT-ORG — Tree nodes show Avatar, Name, Level, Organisation
    When I open Organisation Tree view in agents
    Then organisation tree shows agent "ANTHONY HUNSBERGER" in agents
    And organisation tree nodes show avatar name level and organisation in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-067-PROD
  Scenario: T067-AGT-ORG — You badge only on the current agent node
    When I open Organisation Tree view in agents
    Then the You badge appears only on the current agent node in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-068-PROD
  Scenario: T068-AGT-ORG — Level on cards matches records; hidden when no level
    When I open Organisation Tree view in agents
    Then organisation tree level labels match agent level records in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-069-PROD
  Scenario: T069-AGT-ORG — Expand and collapse parent nodes
    When I open Organisation Tree view in agents
    And I collapse a parent organisation tree node in agents
    Then the parent node direct reports are hidden in agents
    When I expand that parent organisation tree node in agents
    Then the parent node direct reports are visible in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-070-PROD
  Scenario: T070-AGT-ORG — Zoom controls enlarge shrink and reset
    When I open Organisation Tree view in agents
    And I zoom in on organisation tree in agents
    Then organisation tree scale is larger than default in agents
    When I zoom out on organisation tree in agents
    Then organisation tree scale is smaller than after zoom in in agents
    When I reset organisation tree zoom to 1:1 in agents
    Then organisation tree scale is at default in agents

  @agent-master @regression-test @org-tree @positive @TEST-AGT-071-PROD
  Scenario: T071-AGT-ORG — Horizontal and vertical panning
    When I open Organisation Tree view in agents
    And I pan the organisation tree canvas in agents
    Then organisation tree viewport changes after pan in agents
