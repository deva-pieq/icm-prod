@agent-master @regression-test @icm
Feature: Agent Master — Create Agent

  Add Agent form: save state, abort/keep editing, duplicates, E2E create.
  Agency 1 Ops Manager (deva.r@pieq.ai). Requires E2E_PASSWORD in .env.

  Background:
    Given I am logged into PieQ ICM for agent master tests

  @agent-master @create @e2e @sanity-prod @TEST-AGT-019-PROD
  Scenario: T019-AGT-CRT — Create agent with all valid credentials
    When I open the Agents list in agents
    And I click Add Agent in agents
    And I fill all required agent fields with unique valid data in agents
    And I click Save on the agent form in agents
    And I confirm Save expecting success toast on the create agent modal in agents
    Then a success notification appears for agent save in agents
    And I search the agents grid for the newly created agent in agents
    And the agents grid shows the new agent with status "Onboarding in Progress" in agents

  @agent-master @create @e2e @sanity-prod @status @TEST-AGT-020-PROD
  Scenario: T020-AGT-CRT — New agent stays Onboarding in Progress until email activation
    When I open the Agents list in agents
    And I click Add Agent in agents
    And I fill all required agent fields with unique valid data in agents
    And I click Save on the agent form in agents
    And I confirm Save expecting success toast on the create agent modal in agents
    Then a success notification appears for agent save in agents
    And the first agents grid row shows the new agent id or email with status "Onboarding in Progress" in agents

  @agent-master @regression-test @create @validation @positive @TEST-AGT-021-PROD
  Scenario: T021-AGT-CRT — Save stays disabled while mandatory fields are empty
    When I open the Agents list in agents
    And I click Add Agent in agents
    Then the agent form Save button is disabled in agents
    When I fill only some mandatory agent fields leaving others empty in agents
    Then the agent form Save button is disabled in agents

  @agent-master @regression-test @create @abort @positive @TEST-AGT-022-PROD
  Scenario: T022-AGT-CRT — Abort agent creation via Cancel Changes
    When I open the Agents list in agents
    And I click Add Agent in agents
    And I fill any one agent field in agents
    And I click back on the agent form in agents
    Then the Cancel Changes modal appears in agents
    When I confirm abort agent creation in agents
    Then I am on the Agents list in agents

  @agent-master @regression-test @create @abort @positive @TEST-AGT-023-PROD
  Scenario: T023-AGT-CRT — Keep Editing resumes agent creation
    When I open the Agents list in agents
    And I click Add Agent in agents
    And I fill any one agent field in agents
    And I click back on the agent form in agents
    Then the Cancel Changes modal appears in agents
    When I choose Keep Editing on cancel changes modal in agents
    Then I remain on the Add Agent form in agents

  @agent-master @regression-test @create @negative @duplicate @TEST-AGT-024-PROD
  Scenario: T024-AGT-CRT — Duplicate Agent Id, Email, and NPN show inline errors
    When I open the Agents list in agents
    And I click Add Agent in agents
    And I fill agent form with duplicate agent id "7470776" email "deva.r+prod@pieq.ai" and npn "0987654321" in agents
    And I click Save on the agent form in agents
    And I confirm Save on the create agent modal in agents
    Then I see duplicate agent validation errors for user code email and npn in agents
