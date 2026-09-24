@smoke-prod @regression-test @icm
Feature: Smoke — PieQ ICM preprod navigation

  Module navigation smoke for https://preprod.app.pieq.ai/
  Operations manager (E2E_EMAIL), agent (E2E_EMAIL_AGENT), and agency owner (E2E_EMAIL_OWNER)
  require E2E_PASSWORD in .env.
  Validates URL and page header (data-testid with fallbacks) after document load.
  Uses soft assertions so a scenario reports all failures.

  Background:
    Given I am logged into PieQ ICM for smoke tests

  @smoke-prod @regression-test @smoke-modules @sidebar-user-management @TEST-001-smoke-PROD
  Scenario: T001-SMK-UM — User Management list page and header
    When I smoke navigate user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-user-management @TEST-002-smoke-PROD
  Scenario: T002-SMK-UM — Add User page and header
    When I smoke navigate user management list
    And I smoke navigate user management add user
    Then the add user page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-user-management @TEST-003-smoke-PROD
  Scenario: T003-SMK-UM — Back from Add User returns to list
    When I smoke navigate user management list
    And I smoke navigate user management add user
    And I smoke navigate back to user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-user-management @TEST-004-smoke-PROD
  Scenario: T004-SMK-UM — Edit user via grid row click, header and back
    When I smoke navigate user management list
    And I smoke open user management edit by clicking grid record
    Then the edit user page header is visible on smoke
    When I smoke navigate back to user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-user-management @TEST-005-smoke-PROD
  Scenario: T005-SMK-UM — Edit user via action kebab, header and back
    When I smoke navigate user management list
    And I smoke open user management edit via action kebab
    Then the edit user page header is visible on smoke
    When I smoke navigate back to user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-carriers @TEST-006-smoke-PROD
  Scenario: T006-SMK-CAR — Carriers list page and header
    When I smoke navigate carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-carriers @TEST-007-smoke-PROD
  Scenario: T007-SMK-CAR — Create Carrier page and header
    When I smoke navigate carriers list
    And I smoke navigate carriers create
    Then the create carrier page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-carriers @TEST-008-smoke-PROD
  Scenario: T008-SMK-CAR — Back from create returns to Carriers list
    When I smoke navigate carriers list
    And I smoke navigate carriers create
    And I smoke navigate back to carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-carriers @TEST-009-smoke-PROD
  Scenario: T009-SMK-CAR — Edit carrier via grid row click and back
    When I smoke navigate carriers list
    And I smoke open carriers edit by clicking grid record
    When I smoke navigate back to carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-carriers @TEST-010-smoke-PROD
  Scenario: T010-SMK-CAR — Edit carrier via action kebab and back
    When I smoke navigate carriers list
    And I smoke open carriers edit via action kebab
    When I smoke navigate back to carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agents @TEST-011-smoke-PROD
  Scenario: T011-SMK-AGN — Agents list page and header
    When I smoke navigate agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agents @TEST-012-smoke-PROD
  Scenario: T012-SMK-AGN — Add Agent page and header
    When I smoke navigate agents list
    And I smoke navigate agents add
    Then the add agent page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agents @TEST-013-smoke-PROD
  Scenario: T013-SMK-AGN — Back from Add Agent returns to Agents list
    When I smoke navigate agents list
    And I smoke navigate agents add
    And I smoke navigate back to agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agents @TEST-014-smoke-PROD
  Scenario: T014-SMK-AGN — Edit agent via grid row click, header and back
    When I smoke navigate agents list
    And I smoke open agents edit by clicking grid record
    Then the edit agent page header is visible on smoke
    When I smoke navigate back to agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agents @TEST-015-smoke-PROD
  Scenario: T015-SMK-AGN — Edit agent via action kebab, header and back
    When I smoke navigate agents list
    And I smoke open agents edit via action kebab
    Then the edit agent page header is visible on smoke
    When I smoke navigate back to agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-016-smoke-PROD
  Scenario: T016-SMK-PRD — Products master list page and header
    When I smoke navigate products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-017-smoke-PROD
  Scenario: T017-SMK-PRD — Create Product page and header
    When I smoke navigate products list
    And I smoke navigate products create
    Then the create product page header is visible on products smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-018-smoke-PROD
  Scenario: T018-SMK-PRD — Back from create returns to Products list
    When I smoke navigate products list
    And I smoke navigate products create
    And I smoke navigate back to products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-019-smoke-PROD
  Scenario: T019-SMK-PRD — Edit Product via grid row click, header and back
    When I smoke navigate products list
    And I smoke open products edit by clicking grid record
    Then the edit product page header is visible on products smoke
    When I smoke navigate back to products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-020-smoke-PROD
  Scenario: T020-SMK-PRD — Edit Product via action kebab, header and back
    When I smoke navigate products list
    And I smoke open products edit via action kebab
    Then the edit product page header is visible on products smoke
    When I smoke navigate back to products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-products @TEST-021-smoke-PROD
  Scenario: T021-SMK-PRD — Product commission structure page
    When I smoke navigate products list
    And I smoke open products edit via action kebab
    And I smoke open product commission structure from edit page

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-022-smoke-PROD
  Scenario: T022-SMK-POL — Policies list page and header
    When I smoke navigate policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-023-smoke-PROD
  Scenario: T023-SMK-POL — Create Policy page and header
    When I smoke navigate policies list
    And I smoke navigate policies create
    Then the create policy page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-024-smoke-PROD
  Scenario: T024-SMK-POL — Back from create returns to Policies list
    When I smoke navigate policies list
    And I smoke navigate policies create
    And I smoke navigate back to policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-025-smoke-PROD
  Scenario: T025-SMK-POL — Edit policy via grid row click and back
    When I smoke navigate policies list
    And I smoke open policies edit by clicking grid record
    When I smoke navigate back to policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-026-smoke-PROD
  Scenario: T026-SMK-POL — Edit policy via action kebab and back
    When I smoke navigate policies list
    And I smoke open policies edit via action kebab
    When I smoke navigate back to policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-policies @TEST-027-smoke-PROD
  Scenario: T027-SMK-POL — Policy commission configuration page
    When I smoke navigate policy commission configuration

  @smoke-prod @regression-test @smoke-modules @sidebar-commission-management @TEST-028-smoke-PROD
  Scenario: T028-SMK-CMS — Statement Setup list page and header
    When I smoke navigate statement setup list
    Then the statement setup list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-commission-management @TEST-029-smoke-PROD
  Scenario: T029-SMK-CMS — Create statement setup page and header
    When I smoke navigate statement setup list
    And I smoke navigate statement setup create
    Then the create statement setup page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-commission-management @TEST-030-smoke-PROD
  Scenario: T030-SMK-CMS — Back from create returns to Statement Setup list
    When I smoke navigate statement setup list
    And I smoke navigate statement setup create
    And I smoke navigate back to statement setup list
    Then the statement setup list page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-commission-management @TEST-031-smoke-PROD
  Scenario: T031-SMK-CMS — Edit statement setup from grid and header
    When I smoke navigate statement setup edit from grid
    Then the edit statement setup page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-statements @TEST-032-smoke-PROD
  Scenario: T032-SMK-STM — Commission statements upload page and header
    When I smoke navigate commission statements upload
    Then the commission statements upload page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-statements @TEST-033-smoke-PROD
  Scenario: T033-SMK-STM — Commission statements history page and header
    When I smoke navigate commission statements history
    Then the commission statements history page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-statements @TEST-035-smoke-PROD
  Scenario: T035-SMK-STM — Needs Attention page and header
    When I smoke navigate commission statements needs attention
    Then the needs attention page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-payment-processing @TEST-036-smoke-PROD
  Scenario: T036-SMK-PAY — Payables page and header
    When I smoke navigate payment processing payables
    Then the payment payables page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-payment-processing @TEST-037-smoke-PROD
  Scenario: T037-SMK-PAY — Payment approval page and header
    When I smoke navigate payment processing approval
    Then the payment approval page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-payment-processing @TEST-038-smoke-PROD
  Scenario: T038-SMK-PAY — Open payment approval record and authorize control
    When I smoke navigate payment processing approval
    And I smoke open payment approval record and verify authorize button

  @smoke-prod @regression-test @smoke-modules @sidebar-payment-processing @TEST-039-smoke-PROD
  Scenario: T039-SMK-PAY — Disbursement history page and header
    When I smoke navigate payment processing history
    Then the disbursement history page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-payment-processing @TEST-040-smoke-PROD
  Scenario: T040-SMK-PAY — Open disbursement history record with finalized chip
    When I smoke navigate payment processing history
    And I smoke open disbursement history record with finalized chip

  @smoke-prod @regression-test @smoke-modules @sidebar-settings @TEST-041-smoke-PROD
  Scenario: T041-SMK-SET — Settings Prompts page and header
    When I smoke navigate settings prompts
    Then the settings prompts page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-settings @TEST-042-smoke-PROD
  Scenario: T042-SMK-SET — Settings Commission Templates page and header
    When I smoke navigate settings commission templates
    Then the settings commission templates page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-settings @TEST-043-smoke-PROD
  Scenario: T043-SMK-SET — Settings Transfer Sheet page and header
    When I smoke navigate settings transfer sheet
    Then the settings transfer sheet page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-settings @TEST-044-smoke-PROD
  Scenario: T044-SMK-SET — Settings Agency Configuration page and header
    When I smoke navigate settings agency configuration
    Then the settings agency configuration page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-agency-configuration @TEST-045-smoke-PROD
  Scenario: T045-SMK-AGC — Agency Settings page under Agency Configuration
    When I smoke navigate agency settings
    Then the agency settings page heading is visible

  @smoke-prod @regression-test @smoke-modules @sidebar-agency-configuration @TEST-046-smoke-PROD
  Scenario: T046-SMK-DIM — Data Import page under Agency Configuration
    When I smoke navigate data import
    Then the data import page heading is visible

  @smoke-prod @regression-test @smoke-modules @sidebar-advance @TEST-047-smoke-PROD
  Scenario: T047-SMK-ADV — Advance Overview page and header
    When I smoke navigate advance overview
    Then the advance overview page header is visible on smoke

  @smoke-prod @regression-test @smoke-modules @sidebar-advance @TEST-048-smoke-PROD
  Scenario: T048-SMK-ADV — Advance Setup page and header
    When I smoke navigate advance setup
    Then the advance setup page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @TEST-049-smoke-PROD
  Scenario: T049-SMK-ROL — Operations manager profile role after login
    Then my profile role should be "Operations Manager"

  @smoke-prod @regression-test @smoke-role @agent @TEST-050-smoke-PROD
  Scenario: T050-SMK-AGT — Agent role profile after login
    Given I am logged into PieQ ICM as "agent"
    Then my profile role should be "Agent"

  @smoke-prod @regression-test @smoke-role @agent @TEST-051-smoke-PROD
  Scenario: T051-SMK-AGT — Agent dashboard navigation and header
    Given I am logged into PieQ ICM as "agent"
    When I smoke open agent dashboard
    Then the agent dashboard header is visible on smoke

  @smoke-prod @regression-test @smoke-role @agent @TEST-052-smoke-PROD
  Scenario: T052-SMK-AGT — Agent dashboard components visible
    Given I am logged into PieQ ICM as "agent"
    When I smoke open agent dashboard
    Then the filters sidebar is visible on agent dashboard smoke
    And the viewing period header is visible on agent dashboard smoke
    And the Performance Overview section is visible on agent dashboard smoke
    And the Total Gross Commission metric is visible on agent dashboard smoke
    And the Commission by Role section is visible on agent dashboard smoke
    And the Product Type Performance section is visible on agent dashboard smoke
    And the Persistency Report section is visible on agent dashboard smoke
    And the Summary by LOB and Carrier section is visible on agent dashboard smoke
    And the Cross-Sell Metrics section is visible on agent dashboard smoke

  @smoke-prod @regression-test @smoke-role @agent @TEST-053-smoke-PROD
  Scenario: T053-SMK-AGT — Agent Book of Business navigation and header
    Given I am logged into PieQ ICM as "agent"
    When I smoke navigate agent book of business
    Then the agent book of business page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @agent @TEST-054-smoke-PROD
  Scenario: T054-SMK-AGT — Agent Book of Business components visible
    Given I am logged into PieQ ICM as "agent"
    When I smoke navigate agent book of business
    Then the Book of Business heading is visible on agent book of business smoke
    And the Book of Business data grid is visible on agent book of business smoke

  @smoke-prod @regression-test @smoke-role @agent @TEST-055-smoke-PROD
  Scenario: T055-SMK-AGT — Agent Ledger navigation and header
    Given I am logged into PieQ ICM as "agent"
    When I smoke navigate agent ledger
    Then the agent ledger page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @agent @TEST-056-smoke-PROD
  Scenario: T056-SMK-AGT — Agent Ledger components visible
    Given I am logged into PieQ ICM as "agent"
    When I smoke navigate agent ledger
    Then the Ledger heading is visible on agent ledger smoke
    And the Ledger data grid is visible on agent ledger smoke

  @smoke-prod @regression-test @smoke-role @owner @TEST-057-smoke-PROD
  Scenario: T057-SMK-OWN — Agency owner dashboard navigation and header
    Given I am logged into PieQ ICM as "agency owner"
    Then my profile role should be "Agency Owner"
    When I smoke open agency owner dashboard
    Then the agency owner dashboard header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @TEST-058-smoke-PROD
  Scenario: T058-SMK-OWN — Agency owner dashboard components visible
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke open agency owner dashboard
    Then the filters sidebar is visible on agency dashboard smoke
    And the viewing period header is visible on agency dashboard smoke
    And the Key Metrics region is visible on agency dashboard smoke
    And the Gross Commission metric is visible on agency dashboard smoke
    And the Agent Payouts metric is visible on agency dashboard smoke
    And the Sub-agent Payouts metric is visible on agency dashboard smoke
    And the Sales Leader Override metric is visible on agency dashboard smoke
    And the Net to Agency metric is visible on agency dashboard smoke
    And the Chargebacks metric is visible on agency dashboard smoke
    And the Revenue by Product Type section is visible on agency dashboard smoke
    And the Commission Distribution by Role section is visible on agency dashboard smoke
    And the Top Performers by Revenue section is visible on agency dashboard smoke
    And the 12-Month Revenue Trend section is visible on agency dashboard smoke

  @smoke-prod @regression-test @smoke-role @owner @TEST-059-smoke-PROD
  Scenario: T059-SMK-OWN — Agency owner dashboard This Month filter
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke open agency owner dashboard
    And I set dashboard time filter to "This Month"
    Then dashboard shows date range from start of this month through today

  # ── Agency owner sidebar module parity (ops modules under E2E_EMAIL_OWNER) ──
  # Statement Setup nav is absent for owner — Commission Setup is used (T075).

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-user-management @TEST-060-smoke-PROD
  Scenario: T060-SMK-OWN-UM — User Management list page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-user-management @TEST-061-smoke-PROD
  Scenario: T061-SMK-OWN-UM — Add User page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate user management list
    And I smoke navigate user management add user
    Then the add user page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-user-management @TEST-062-smoke-PROD
  Scenario: T062-SMK-OWN-UM — Edit user via grid row click as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate user management list
    And I smoke open user management edit by clicking grid record
    Then the edit user page header is visible on smoke
    When I smoke navigate back to user management list
    Then the user management list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-carriers @TEST-063-smoke-PROD
  Scenario: T063-SMK-OWN-CAR — Carriers list page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-carriers @TEST-064-smoke-PROD
  Scenario: T064-SMK-OWN-CAR — Create Carrier page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate carriers list
    And I smoke navigate carriers create
    Then the create carrier page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-carriers @TEST-065-smoke-PROD
  Scenario: T065-SMK-OWN-CAR — Edit carrier via grid as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate carriers list
    And I smoke open carriers edit by clicking grid record
    When I smoke navigate back to carriers list
    Then the carriers list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-agents @TEST-066-smoke-PROD
  Scenario: T066-SMK-OWN-AGN — Agents list page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-agents @TEST-067-smoke-PROD
  Scenario: T067-SMK-OWN-AGN — Add Agent page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate agents list
    And I smoke navigate agents add
    Then the add agent page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-agents @TEST-068-smoke-PROD
  Scenario: T068-SMK-OWN-AGN — Edit agent via grid as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate agents list
    And I smoke open agents edit by clicking grid record
    Then the edit agent page header is visible on smoke
    When I smoke navigate back to agents list
    Then the agents list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-products @TEST-069-smoke-PROD
  Scenario: T069-SMK-OWN-PRD — Products list page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-products @TEST-070-smoke-PROD
  Scenario: T070-SMK-OWN-PRD — Create Product page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate products list
    And I smoke navigate products create
    Then the create product page header is visible on products smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-products @TEST-071-smoke-PROD
  Scenario: T071-SMK-OWN-PRD — Edit Product via grid as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate products list
    And I smoke open products edit by clicking grid record
    Then the edit product page header is visible on products smoke
    When I smoke navigate back to products list
    Then the products list page header is visible on products smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-policies @TEST-072-smoke-PROD
  Scenario: T072-SMK-OWN-POL — Policies list page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-policies @TEST-073-smoke-PROD
  Scenario: T073-SMK-OWN-POL — Create Policy page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate policies list
    And I smoke navigate policies create
    Then the create policy page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-policies @TEST-074-smoke-PROD
  Scenario: T074-SMK-OWN-POL — Edit policy via grid as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate policies list
    And I smoke open policies edit by clicking grid record
    When I smoke navigate back to policies list
    Then the policies list page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-commission-management @TEST-075-smoke-PROD
  Scenario: T075-SMK-OWN-CMS — Commission Setup page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate commission setup as agency owner
    Then the commission setup page header is visible on owner smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-statements @TEST-076-smoke-PROD
  Scenario: T076-SMK-OWN-STM — Statement upload page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate commission statements upload
    Then the commission statements upload page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-statements @TEST-077-smoke-PROD
  Scenario: T077-SMK-OWN-STM — Statement history page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate commission statements history
    Then the commission statements history page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-statements @TEST-078-smoke-PROD
  Scenario: T078-SMK-OWN-STM — Needs Attention page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate commission statements needs attention
    Then the needs attention page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-payment-processing @TEST-079-smoke-PROD
  Scenario: T079-SMK-OWN-PAY — Payables page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate payment processing payables
    Then the payment payables page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-payment-processing @TEST-080-smoke-PROD
  Scenario: T080-SMK-OWN-PAY — Payment approval page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate payment processing approval
    Then the payment approval page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-payment-processing @TEST-081-smoke-PROD
  Scenario: T081-SMK-OWN-PAY — Disbursement history page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate payment processing history
    Then the disbursement history page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-settings @TEST-082-smoke-PROD
  Scenario: T082-SMK-OWN-SET — Settings Prompts page and header as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate settings prompts
    Then the settings prompts page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-settings @TEST-083-smoke-PROD
  Scenario: T083-SMK-OWN-SET — Settings Commission Templates as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate settings commission templates
    Then the settings commission templates page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-settings @TEST-084-smoke-PROD
  Scenario: T084-SMK-OWN-SET — Settings Transfer Sheet as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate settings transfer sheet
    Then the settings transfer sheet page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-agency-configuration @TEST-085-smoke-PROD
  Scenario: T085-SMK-OWN-AGC — Agency Settings as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate agency settings
    Then the agency settings page heading is visible

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-agency-configuration @TEST-086-smoke-PROD
  Scenario: T086-SMK-OWN-DIM — Data Import as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate data import
    Then the data import page heading is visible

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-advance @TEST-087-smoke-PROD
  Scenario: T087-SMK-OWN-ADV — Advance Overview as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate advance overview
    Then the advance overview page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @owner @owner-modules @sidebar-advance @TEST-088-smoke-PROD
  Scenario: T088-SMK-OWN-ADV — Advance Setup as agency owner
    Given I am logged into PieQ ICM as "agency owner"
    When I smoke navigate advance setup
    Then the advance setup page header is visible on smoke

  @smoke-prod @regression-test @smoke-role @ops-dashboard @TEST-089-smoke-PROD
  Scenario: T089-SMK-DSH — Operations manager dashboard navigation and header
    Given I am logged into PieQ ICM as "operations manager"
    Then my profile role should be "Operations Manager"
    When I smoke open operations manager dashboard
    Then the operations manager dashboard header is visible on smoke

  @smoke-prod @regression-test @smoke-role @ops-dashboard @TEST-090-smoke-PROD
  Scenario: T090-SMK-DSH — Operations manager dashboard components visible
    Given I am logged into PieQ ICM as "operations manager"
    When I smoke open operations manager dashboard
    Then the Viewing Period widget is visible on ops manager dashboard smoke
    And the Weekly Statement Processing Cycle section is visible on ops manager dashboard smoke
    And the Total Received metric is visible on ops manager dashboard smoke
    And the Statement Stage Breakdown section is visible on ops manager dashboard smoke
    And the Carrier Ageing Detail section is visible on ops manager dashboard smoke
    And the Exception Tracking section is visible on ops manager dashboard smoke

  @smoke-prod @regression-test @smoke-logout @TEST-091-smoke-PROD
  Scenario: T091-SMK-OUT — Sign out from PieQ ICM
    Given I am logged into PieQ ICM as "operations manager"
    When I sign out from PieQ ICM
    Then I am logged out of PieQ ICM

  # Agency 3 Ops Manager only (deva.r+ag3@pieq.ai + E2E_PASSWORD) — ignores E2E_EMAIL.
  # Split phases so each scenario has its own timeout; later steps load fileId / Customer UID
  # from the prior capture (in-memory + TestFiles/StatementUpload/.generated/smoke-statement-session.json).
  # Family: yarn test -g "@smoke-statement-processing"
  # Cascade: T092 → T034/T093/T094; T095 → T096

  @smoke-prod @regression-test @smoke-statement-processing @TEST-092-smoke-PROD
  Scenario: T092-SMK-STM — Statement upload to Completed (run 1)
    Given I am logged into PieQ ICM for smoke statement processing
    When a smoke statement upload file is prepared
    Then the first Customer UID is captured from the prepared smoke CSV
    When I open the commission statement upload page
    And I upload the prepared smoke statement file
    And I select statement type "Aetna ACA"
    And I submit the statement upload
    And the smoke upload appears in the recently uploaded grid
    And the smoke upload shows status "Uploaded" and stage "Review"
    When I open the review page for the smoke upload
    And I complete the review and confirm from smoke
    And I refresh the recently uploaded statements grid
    And I wait 60 seconds
    And I refresh the recently uploaded statements grid
    Then the smoke upload shows stage "Completed"

  # T034 uses run-1 Completed record from T092 (captured fileId) so the history grid has a row.
  @smoke-prod @regression-test @smoke-statement-processing @TEST-034-smoke-PROD
  Scenario: T034-SMK-STM — Commission statement details from history grid
    Given I am logged into PieQ ICM for smoke statement processing
    When I navigate to commission statement history from smoke
    And I open the commission statement history for the captured file
    Then the commission details page heading is visible
    And the commission details records are present

  @smoke-prod @regression-test @smoke-statement-processing @TEST-093-smoke-PROD
  Scenario: T093-SMK-STM — Commission history details for completed upload
    Given I am logged into PieQ ICM for smoke statement processing
    When I navigate to commission statement history from smoke
    And I open the commission statement history for the captured file
    Then the commission details page heading is visible
    And the commission details records are present

  @smoke-prod @regression-test @smoke-statement-processing @TEST-094-smoke-PROD
  Scenario: T094-SMK-STM — Policy ledger for run 1 Customer UID
    Given I am logged into PieQ ICM for smoke statement processing
    When I navigate to the policies page from smoke
    And I search for the captured Customer UID in policies
    And I click the policy actions kebab menu
    And I click view ledger from the policy actions menu
    Then the policy ledger is displayed with entries

  @smoke-prod @regression-test @smoke-statement-processing @TEST-095-smoke-PROD
  Scenario: T095-SMK-STM — Statement upload to Completed (run 2, changed date)
    Given I am logged into PieQ ICM for smoke statement processing
    When a second smoke statement upload file is prepared with changed date
    Then the second Customer UID is captured from the prepared smoke CSV
    When I open the commission statement upload page
    And I upload the second prepared smoke statement file
    And I select statement type "Aetna ACA"
    And I submit the statement upload
    And the second smoke upload appears in the recently uploaded grid
    And the second smoke upload shows status "Uploaded" and stage "Review"
    When I open the review page for the second smoke upload
    And I complete the review and confirm from smoke
    And I refresh the recently uploaded statements grid
    And I wait 60 seconds
    And I refresh the recently uploaded statements grid
    Then the second smoke upload shows stage "Completed"

  @smoke-prod @regression-test @smoke-statement-processing @TEST-096-smoke-PROD
  Scenario: T096-SMK-STM — Policy ledger for run 2 Customer UID
    Given I am logged into PieQ ICM for smoke statement processing
    When I navigate to the policies page from smoke
    And I search for the second captured Customer UID in policies
    And I click the policy actions kebab menu
    And I click view ledger from the policy actions menu
    Then the policy ledger is displayed with entries
