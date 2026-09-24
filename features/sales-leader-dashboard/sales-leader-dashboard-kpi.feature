@sales-leader-dashboard @regression-test @regression @icm
Feature: Sales Leader Dashboard — Aetna ACA KPI increment

  Regression proof that processing an Aetna ACA commission statement for a
  downline agent (Agent ID 600004, Agency 3) increments the Sales Leader
  dashboard Performance Overview KPIs (Total Gross Commission, Total New
  Policies) under Year to Date.

  Flow:
    1. Login as Sales Leader → open Agent Dashboard → YTD → capture KPI baseline
    2. Switch to Agency 3 Ops → prepare Aetna ACA for agent 600004 → upload →
       Complete Review → Completed
    3. Switch back to Sales Leader → YTD → assert Gross and New Policies increased

  Credentials:
    - Sales Leader: E2E_EMAIL_SALES_LEADER / E2E_PASSWORD
    - Ops upload: Agency 3 via agency3OpsCredentials()

  Background:
    Given I am logged into PieQ ICM for sales leader dashboard regression

  @sales-leader-dashboard @regression-test @kpi @TEST-001-Sales-Leader-Dashboard-KPI-PROD
  Scenario: SLD-001 — Aetna ACA for agent 600004 increments Sales Leader YTD KPIs
    When I open the agent dashboard on sales leader dashboard
    And I select the time period "Year to Date" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    And I capture Performance Overview KPI baseline on sales leader dashboard
    When I switch to Agency 3 Ops Manager login in sales leader dashboard regression
    And the sales leader dashboard statement file is prepared for agent "600004"
    And I open the statement upload page in sales leader dashboard regression
    And I upload the prepared sales leader dashboard statement file
    And I select the statement type "Aetna ACA" in sales leader dashboard regression
    And I submit the statement upload for processing in sales leader dashboard regression
    Then the sales leader dashboard upload extract processing completes and file ID is captured
    And the sales leader dashboard upload row shows status "Waiting" and stage "Review"
    When I open the statement review page for the stored upload in sales leader dashboard regression
    And I click Complete Review on the statement review page in sales leader dashboard regression
    Then the sales leader dashboard upload stage changes to "Completed"
    # Direct-selling statement for the sales leader's own NPN (0987654321) — seeds the
    # "Agent" role for T033 Commission by Role in the current period.
    And the sales leader dashboard statement file is prepared for agent "0987654321"
    And I open the statement upload page in sales leader dashboard regression
    And I upload the prepared sales leader dashboard statement file
    And I select the statement type "Aetna ACA" in sales leader dashboard regression
    And I submit the statement upload for processing in sales leader dashboard regression
    Then the sales leader dashboard upload extract processing completes and file ID is captured
    And the sales leader dashboard upload row shows status "Waiting" and stage "Review"
    When I open the statement review page for the stored upload in sales leader dashboard regression
    And I click Complete Review on the statement review page in sales leader dashboard regression
    Then the sales leader dashboard upload stage changes to "Completed"
    When I switch to Sales Leader login in sales leader dashboard regression
    And I open the agent dashboard on sales leader dashboard
    And I select the time period "Year to Date" on sales leader dashboard
    And I click the Apply button on sales leader dashboard
    Then the Total Gross Commission is greater than the captured baseline on sales leader dashboard
    And the Total New Policies is at least the captured baseline on sales leader dashboard
    And the Avg Per Policy metric is visible on sales leader dashboard
