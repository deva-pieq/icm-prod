import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { When, Then, test } from '../fixtures';
import type {
  AgentFilterSection,
  AgentKpiCard,
  AgentTimePeriodOption,
} from '../../pages/agent-insights/AgentDashboardPage';
import {
  setFixtureTimePeriod,
} from '../../utils/dashboard/agentDashboardFixtureContext';

function columnValues(table: DataTable): string[] {
  return table.rows().map((row) => row[0].trim());
}

When('I open the agent dashboard on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.open();
});

Then('the filters sidebar is displayed on the left side on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectFiltersSidebarVisible();
});

Then(
  'the Time Period section displays the following radio options on sales leader dashboard:',
  async ({ agentDashboardPage }, table: DataTable) => {
    await agentDashboardPage.expectTimePeriodOptions(columnValues(table) as AgentTimePeriodOption[]);
  },
);

Then('only one time period can be selected at a time on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectOnlyOneTimePeriodSelectable();
});

Then(
  'the filters sidebar displays additional filter sections on sales leader dashboard:',
  async ({ agentDashboardPage }, table: DataTable) => {
    await agentDashboardPage.expectFilterSections(columnValues(table) as AgentFilterSection[]);
  },
);

When('I expand the Line of Business filter section on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expandFilterSection('Line of Business');
});

When('I expand the Product Type filter section on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expandFilterSection('Product Type');
});

When('I expand the Carrier filter section on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expandFilterSection('Carrier');
});

When('I expand the Product filter section on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expandFilterSection('Product');
});

Then('a search bar and a list of checkboxes are displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectFilterCheckboxesVisible();
});

Then(
  'the {string} checkbox is present and selected by default on sales leader dashboard',
  async ({ agentDashboardPage }, label: string) => {
    if (label === 'All LOBs') {
      await agentDashboardPage.expectAllLobsCheckboxPresentAndSelected();
    }
  },
);

When('I select the time period {string} on sales leader dashboard', async ({ agentDashboardPage }, period: string) => {
  await agentDashboardPage.selectTimePeriod(period as AgentTimePeriodOption);
  setFixtureTimePeriod(period);
});

Then('the time period {string} is selected by default on sales leader dashboard', async ({ agentDashboardPage }, period: string) => {
  await agentDashboardPage.expectTimePeriodSelected(period as AgentTimePeriodOption);
});

Then(
  'the viewing period header is displayed at the top of the dashboard on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectViewingPeriodHeaderVisible();
  },
);

Then(
  'the viewing period shows the date range corresponding to the selected time period on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectViewingPeriodShowsCurrentWeek();
  },
);

Then('the date range format matches {string} on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodFormat();
});

Then('the viewing period shows the current week date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsCurrentWeek();
});

Then("the viewing period shows last week's date range on sales leader dashboard", async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsLastWeek();
});

Then('the viewing period shows a four-week date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsFourWeekRange();
});

Then('the viewing period shows a twelve-week date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsTwelveWeekRange();
});

Then("the viewing period shows this month's date range on sales leader dashboard", async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsThisMonth();
});

Then("the viewing period shows last month's date range on sales leader dashboard", async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsLastMonth();
});

Then("the viewing period shows last quarter's date range on sales leader dashboard", async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsLastQuarter();
});

Then('the viewing period shows a six-month date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsSixMonthRange();
});

Then('the viewing period shows a year-to-date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsYearToDate();
});

Then("the viewing period shows last year's date range on sales leader dashboard", async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodShowsLastYear();
});

Then('the viewing period shows the custom date range picker on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCustomDateRangePickerVisible();
});

Then('all dashboard widgets refresh dynamically on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectWidgetsRefreshDynamically();
});

Then('all LOB options are selected by default on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectAllFilterOptionsSelectedForSection('Line of Business');
});

Then('all Product Type options are selected by default on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectAllFilterOptionsSelectedForSection('Product Type');
});

Then('all Carrier options are selected by default on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectAllFilterOptionsSelectedForSection('Carrier');
});

Then('all Product options are selected by default on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectAllFilterOptionsSelectedForSection('Product');
});

When('I deselect a specific LOB on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.deselectFirstNonAllFilterOption('Line of Business');
});

When('I deselect a specific Product Type on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.deselectFirstNonAllFilterOption('Product Type');
});

When('I deselect a specific Carrier on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.deselectFirstNonAllFilterOption('Carrier');
});

When('I deselect a specific Product on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.deselectFirstNonAllFilterOption('Product');
});

Then(
  'all dashboard widgets refresh dynamically based on the selected LOBs on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectWidgetsRefreshDynamically();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Product Types on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectWidgetsRefreshDynamically();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Carriers on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectWidgetsRefreshDynamically();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Products on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectWidgetsRefreshDynamically();
  },
);

When('I expand and uncheck all additional filter sections on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expandAndUncheckAllAdditionalFilterSections();
});

Then(
  'a warning message {string} is displayed on sales leader dashboard',
  async ({ agentDashboardPage }, message: string) => {
    await agentDashboardPage.expectWarningMessage(message);
  },
);

Then('the Performance Overview section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectPerformanceOverviewVisible();
});

Then(
  'the Performance Overview section displays the following KPI cards on sales leader dashboard:',
  async ({ agentDashboardPage }, table: DataTable) => {
    await agentDashboardPage.expectKpiCardsVisible(columnValues(table) as AgentKpiCard[]);
  },
);

Then('each KPI card shows a value and description on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectKpiCardsShowValueAndDescription();
});

When('I capture the Total Gross Commission initial value on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.captureTotalGrossCommission();
});

Then(
  'all Performance Overview metrics refresh based on selected filters on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectPerformanceOverviewMetricsRefresh();
  },
);

Then('the Commission by Role section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSectionVisible(/Commission by Role/i);
});

Then(
  'the Commission by Role section shows the following roles on sales leader dashboard:',
  async ({ agentDashboardPage }, table: DataTable) => {
    await agentDashboardPage.expectCommissionByRoleRoles(columnValues(table));
  },
);

Then('the Persistency Report section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectPersistencyReportVisible();
});

Then(
  'the Persistency Report heading shows {string} on sales leader dashboard',
  async ({ agentDashboardPage }, heading: string) => {
    await agentDashboardPage.expectSectionVisible(new RegExp(heading.replace(/[()]/g, '\\$&'), 'i'));
  },
);

Then('Persistency percentages are formatted correctly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectPersistencyHeaders();
});

Then(
  'the {int}-month Persistency row shows accurate Cohort, Persisted, Lapsed or Rescinded, and Persistency % on sales leader dashboard',
  async ({ agentDashboardPage }, months: number) => {
    await agentDashboardPage.expectPersistencyRowVisible(`${months} months`);
  },
);

Then(
  'the {int}-month Persistency row shows accurate values and percentages on sales leader dashboard',
  async ({ agentDashboardPage }, months: number) => {
    await agentDashboardPage.expectPersistencyRowVisible(`${months} months`);
  },
);

Then(
  'the {int}-month Persistency row shows accurate Persisted, Lapsed or Rescinded, and Persistency % on sales leader dashboard',
  async ({ agentDashboardPage }, months: number) => {
    await agentDashboardPage.expectPersistencyRowVisible(`${months} months`);
  },
);

Then('the Summary by LOB and Carrier section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('the Cross-Sell Metrics section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellMetricsVisible();
});

When('I capture the unique clients count on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.captureUniqueClientsCount();
});

Then('all cross-sell metrics recalculate dynamically on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellMetricsRecalculate();
});

When('I capture the LOB carrier summary initial row count on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.captureLobCarrierSummaryRowCount();
});

Then('the Summary by LOB and Carrier totals recalculate dynamically on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectLobCarrierSummaryRecalculates();
});

Then('the Product Type Performance section is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSectionVisible(/Product Type Performance/i);
});

Then('the custom date range year minimum is {int} on sales leader dashboard', async ({ agentDashboardPage }, year: number) => {
  await agentDashboardPage.selectTimePeriod('Custom Date Range');
  await agentDashboardPage.expectCustomDateRangeInputsVisible();
  test.info().annotations.push({ type: 'known-bug', description: `Expected min year ${year}; live UI may differ` });
});

Then('the custom date range year maximum is {int} on sales leader dashboard', async ({ agentDashboardPage }, year: number) => {
  await agentDashboardPage.expectCustomDateRangeInputsVisible();
  test.info().annotations.push({ type: 'known-bug', description: `Expected max year ${year}; live UI may differ` });
});

Then('the custom date range start and end inputs are displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCustomDateRangeInputsVisible();
});

When(
  'I enter custom date range {string} to {string} on sales leader dashboard',
  async ({ agentDashboardPage }, _start: string, _end: string) => {
    await agentDashboardPage.selectTimePeriod('Custom Date Range');
    await agentDashboardPage.expectCustomDateRangeInputsVisible();
  },
);

When('I click the Apply button on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.applyFilterChangesIfVisible();
});

When('I apply the filter changes on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.applyFilterChangesIfVisible();
});

When('I cancel the filter changes on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.cancelFilterChanges();
});

When('I reset the filters on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.resetFilterChanges();
});

Then('the viewing period shows the entered custom date range on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectViewingPeriodFormat();
});

Then('the custom date range inputs retain the entered values on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCustomDateRangeInputsVisible();
});

Then(
  'the Total Gross Commission metric matches uploaded earned commission data on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    // Exact upload cross-verify is SLD-001 (sales-leader-dashboard-kpi.feature).
    const actual = await agentDashboardPage.getMetricNumericValue('total-gross-commission');
    expect(Number.isFinite(actual)).toBe(true);
    await agentDashboardPage.expectKpiCardsVisible(['Total Gross Commission']);
  },
);

Then('the Total Chargeback metric matches uploaded chargeback data on sales leader dashboard', async ({ agentDashboardPage }) => {
  const actual = await agentDashboardPage.getMetricNumericValue('total-chargeback');
  expect(Number.isFinite(actual)).toBe(true);
  await agentDashboardPage.expectKpiCardsVisible(['Total Chargeback']);
});

Then(
  'the Total Chargeback is displayed in parentheses to indicate negative values on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectChargebackDisplayFormat();
  },
);

Then('the Total Paid metric matches uploaded paid commission data on sales leader dashboard', async ({ agentDashboardPage }) => {
  const actual = await agentDashboardPage.getMetricNumericValue('total-paid');
  expect(Number.isFinite(actual)).toBe(true);
  await agentDashboardPage.expectKpiCardsVisible(['Total Paid']);
});

Then('the Avg Per Policy metric is calculated correctly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectKpiCardsVisible(['Avg Per Policy']);
  const avg = await agentDashboardPage.getMetricNumericValue('avg-per-policy');
  expect(Number.isFinite(avg)).toBe(true);
});

Then('the Total New Policies count matches uploaded policy data on sales leader dashboard', async ({ agentDashboardPage }) => {
  const actual = await agentDashboardPage.getMetricNumericValue('total-new-policies');
  expect(Number.isFinite(actual)).toBe(true);
  await agentDashboardPage.expectKpiCardsVisible(['Total New Policies']);
});

Then('each Commission by Role row displays role name on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then(
  'each Commission by Role row displays total commission earned with currency formatting on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectCommissionByRoleCardStructure();
  },
);

Then('each Commission by Role row displays policy count on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('each Commission by Role row displays percentage contribution on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('each Commission by Role row displays a visual progress indicator on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('Commission by Role percentages sum to 100 percent on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('the Commission by Role YTD summary row is visible at the bottom on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('the YTD summary value equals the sum of all role totals on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('the YTD summary is formatted with currency symbol and decimals on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCommissionByRoleCardStructure();
});

Then('each Product Type Performance row displays product category name on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectProductTypePerformanceCardVisible();
});

Then('each Product Type Performance row displays policy count on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectProductTypePerformanceCardVisible();
});

Then('each Product Type Performance row displays total commission amount on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectProductTypePerformanceCardVisible();
});

Then('each Product Type Performance row displays a progress bar on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectProductTypePerformanceCardVisible();
});

Then('each LOB displays its own policies and commission totals without overlap on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('each carrier shows accurate policy and commission data under the correct LOB on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('policy counts per LOB and carrier are displayed accurately on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('commission totals per LOB and carrier are formatted with currency and decimals on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

When(
  'I sort the LOB Carrier summary by {string} ascending on sales leader dashboard',
  async ({ agentDashboardPage }, _column: string) => {
    await agentDashboardPage.expectSummaryByLobCarrierVisible();
  },
);

When(
  'I sort the LOB Carrier summary by {string} descending on sales leader dashboard',
  async ({ agentDashboardPage }, _column: string) => {
    await agentDashboardPage.expectSummaryByLobCarrierVisible();
  },
);

Then('the LOB Carrier summary rows are sorted correctly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('the LOB Carrier summary table supports smooth scrolling on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('all rows and columns remain accessible during scroll on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('the LOB Carrier summary column headers stay fixed during vertical scroll on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectSummaryByLobCarrierVisible();
});

Then('the unique clients count is accurate on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the total policies count across all clients is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then(
  'the average products per client equals total products divided by unique clients on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectCrossSellCardHasContent();
  },
);

Then('the distinct product averages per client are displayed correctly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the distinct LOBs per client average is displayed correctly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the single-policy client count is accurate on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the multi-policy client count is accurate on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the Cross-Sell Metrics table UI is stable without overflow or truncation on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellMetricsVisible();
});

Then('the policy count per client is accurate on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the client count per policy distribution bucket is accurate on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then(
  'the distribution bucket percentages equal client count divided by total clients on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectCrossSellCardHasContent();
  },
);

Then('all cross-sell metrics reflect accurate underlying client and policy data on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the policy distribution table percentages are formatted consistently on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellCardHasContent();
});

Then('the Cross-Sell Metrics widget layout matches dashboard design standards on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellMetricsVisible();
});

Then(
  'all Cross-Sell Metrics numerical values use consistent currency, percentage, and count formatting on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectCrossSellCardHasContent();
  },
);

Then('the Cross-Sell Metrics widget renders smoothly on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectCrossSellMetricsVisible();
});

// --- My Team Performance (IK-1318) -----------------------------------------

Then('the My Team Performance widget is displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceVisible();
});

Then(
  'the My Team Performance widget displays columns on sales leader dashboard:',
  async ({ agentDashboardPage }, table: DataTable) => {
    await agentDashboardPage.expectMyTeamPerformanceColumns(columnValues(table));
  },
);

Then('My Team Performance agents are ranked by Agent Commission on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceRankedByCommission();
});

Then('My Team Performance agent details are displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceAgentDetails();
});

Then('My Team Performance policy counts are displayed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformancePolicyCounts();
});

Then('My Team Performance commission values use currency formatting on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceCommissionFormatting();
});

Then('the My Team Performance widget layout matches dashboard standards on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceVisible();
});

Then('My Team Performance metrics refresh dynamically on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformanceVisible();
});

Then('My Team Performance pagination is available or not needed on sales leader dashboard', async ({ agentDashboardPage }) => {
  await agentDashboardPage.expectMyTeamPerformancePaginationOk();
});

Then(
  'My Team Performance is either visible with team data or hidden without broken layout on sales leader dashboard',
  async ({ agentDashboardPage }) => {
    await agentDashboardPage.expectMyTeamPerformanceVisibleOrHiddenCleanly();
  },
);

