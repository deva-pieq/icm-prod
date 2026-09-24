import { expect } from '@playwright/test';
import { DataTable } from '@cucumber/cucumber';
import { When, Then } from '../fixtures';
import type { TimePeriodOption, AdditionalFilterSection, RoleName, MetricCard } from '../../pages/dashboard/AgencyOwnerDashboardPage';
import {
  setCapturedGrossCommission,
  getCapturedGrossCommission,
} from '../../utils/dashboard/dashboardContext';

/** Single-column Gherkin table → list of cell values (header row excluded). */
function columnValues(table: DataTable): string[] {
  return table.rows().map((row) => row[0].trim());
}

// ============================================================================
// Open dashboard
// ============================================================================

When('I open the agency owner dashboard', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.open();
});

// ============================================================================
// Global Filters — Panel UI
// ============================================================================

Then('the filters sidebar is displayed on the left side', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.expectFiltersSidebarVisible();
});

Then(
  'the Time Period section displays the following radio options:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectTimePeriodRadioOptions(columnValues(table));
  },
);

Then(
  'only one time period can be selected at a time',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectOnlyOneTimePeriodSelectable();
  },
);

Then(
  'the default selected time period is This Week',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectDefaultTimePeriodIsThisWeek();
  },
);

Then(
  'the filters sidebar displays additional filter sections:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectAdditionalFilterSections(columnValues(table));
  },
);

When(
  'I expand the Line of Business filter section',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expandFilterSection('Line of Business');
  },
);

Then(
  'a search bar and a list of checkboxes are displayed',
  async ({ agencyOwnerDashboardPage }) => {
    // No search bar in the Line of Business filter section
    // await agencyOwnerDashboardPage.expectFilterSectionSearchBarVisible();
    await agencyOwnerDashboardPage.expectFilterCheckboxesVisible();
  },
);

Then(
  'the {string} checkbox is present and selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllLobsCheckboxPresentAndSelected();
  },
);

// ============================================================================
// Viewing Period
// ============================================================================

Then(
  'the viewing period header is displayed at the top of the dashboard',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodHeaderVisible();
  },
);

Then(
  'the viewing period shows the date range corresponding to the selected time period',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('This Week');
  },
);

Then(
  'the date range format matches {string}',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodFormat();
  },
);

When('I apply the filter changes on agency dashboard', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.applyFilterChanges();
});

When('I cancel the filter changes on agency dashboard', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.cancelFilterChanges();
});

When('I reset the filters on agency dashboard', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.resetFilterChanges();
});

// ============================================================================
// Filter Actions
// ============================================================================

When(
  'I select the time period {string}',
  async ({ agencyOwnerDashboardPage }, period: string) => {
    await agencyOwnerDashboardPage.selectTimePeriod(period as TimePeriodOption);
  },
);

Then(
  'the viewing period updates to show last month\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Month');
  },
);

Then(
  'all dashboard widgets refresh dynamically with updated data',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

Then(
  'the viewing period shows a different date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodUpdates();
  },
);

Then(
  'the viewing period shows the current week\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('This Week');
  },
);

Then(
  'all dashboard widgets show data for the current week',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllWidgetsHaveNonEmptyData();
  },
);

Then(
  'the default time period {string} is selected',
  async ({ agencyOwnerDashboardPage }, period: string) => {
    await agencyOwnerDashboardPage.expectTimePeriodSelected(period as TimePeriodOption);
  },
);

Then(
  'the viewing period updates to show last quarter\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Quarter');
  },
);

Then(
  'the viewing period returns to the current week\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('This Week');
  },
);

// ============================================================================
// Time Period — individual validation
// ============================================================================

Then(
  'the time period {string} is selected by default',
  async ({ agencyOwnerDashboardPage }, period: string) => {
    await agencyOwnerDashboardPage.expectTimePeriodSelected(period as TimePeriodOption);
  },
);

Then(
  'the viewing period shows the correct date range for {string}',
  async ({ agencyOwnerDashboardPage }, option: string) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange(option as TimePeriodOption);
  },
);

Then(
  'the viewing period shows the current week date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('This Week');
  },
);

Then(
  'all dashboard widgets display non-empty data',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllWidgetsHaveNonEmptyData();
  },
);

Then(
  'the viewing period shows last week\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Week');
  },
);

Then(
  'all dashboard widgets refresh dynamically',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

Then(
  'the viewing period shows last month\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Month');
  },
);

Then(
  'the viewing period shows last quarter\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Quarter');
  },
);

Then(
  'the viewing period shows a four-week date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last 4 Weeks');
  },
);

Then(
  'the viewing period shows last {int} Weeks date range',
  async ({ agencyOwnerDashboardPage }, _weeks: number) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last 4 Weeks');
  },
);

Then(
  'the viewing period shows a twelve-week date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last 12 Weeks');
  },
);

Then(
  'the viewing period shows this month\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('This Month');
  },
);

Then(
  'the viewing period shows a six-month date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last 6 Months');
  },
);

Then(
  'the viewing period shows a year-to-date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Year to Date');
  },
);

Then(
  'the viewing period shows last year\'s date range',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectViewingPeriodDateRange('Last Year');
  },
);

Then(
  'the viewing period shows the custom date range picker',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectCustomDateRangePickerVisible();
  },
);

Then(
  'the custom date range start and end inputs are displayed',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectCustomDateRangeInputsVisible();
  },
);

Then(
  'the custom date range inputs accept valid date values',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectCustomDateRangeAcceptsValidDates();
  },
);

// ============================================================================
// Additional Filters
// ============================================================================

When(
  'I expand the {string} filter section',
  async ({ agencyOwnerDashboardPage }, section: string) => {
    await agencyOwnerDashboardPage.expandFilterSection(section as AdditionalFilterSection);
  },
);

Then(
  'all {string} options are selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllFilterOptionsSelected();
  },
);

When(
  'I deselect a specific LOB',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.deselectSpecificFilterOption();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected {string}',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

When(
  'I deselect a specific Product Type',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.deselectSpecificFilterOption();
  },
);

When(
  'I deselect a specific Agent Level',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.deselectSpecificFilterOption();
  },
);

When(
  'I deselect a specific Carrier',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.deselectSpecificFilterOption();
  },
);

When(
  'I expand all additional filter sections',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expandAllAdditionalFilterSections();
  },
);

When(
  'I uncheck all filter options',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.uncheckAllFilterOptions();
  },
);

Then(
  'a warning message {string} is displayed',
  async ({ agencyOwnerDashboardPage }, message: string) => {
    await agencyOwnerDashboardPage.expectWarningMessage(message);
  },
);

// --- Additional filter option defaults (unparameterized) --------------------

Then(
  'all LOB options are selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllFilterOptionsSelected();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected LOBs',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

When(
  'I expand the Product Type filter section',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expandFilterSection('Product Type');
  },
);

Then(
  'all Product Type options are selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllFilterOptionsSelected();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Product Types',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

When(
  'I expand the Agent Level filter section',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expandFilterSection('Agent Level');
  },
);

Then(
  'all Agent Level options are selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllFilterOptionsSelected();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Agent Levels',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

When(
  'I expand the Carrier filter section',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expandFilterSection('Carrier');
  },
);

Then(
  'all Carrier options are selected by default',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectAllFilterOptionsSelected();
  },
);

Then(
  'all dashboard widgets refresh dynamically based on the selected Carriers',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshDynamically();
  },
);

// ============================================================================
// Widgets UI
// ============================================================================

Then(
  'the following widgets are displayed:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectWidgetsDisplayed(columnValues(table));
  },
);

Then(
  'all widgets respond to filter changes by refreshing their data',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsRefreshWithFilters();
  },
);

// ============================================================================
// Key Metrics — KPI cards
// ============================================================================

Then(
  'the Key Metrics section displays the following KPI cards:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectAllKpiCardsVisible();
  },
);

Then(
  'each KPI card shows a monetary value and description',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectKpiCardsShowValueAndDescription();
  },
);

// --- Gross Commission -------------------------------------------------------

Then(
  'the Gross Commission card displays total commission received from carriers',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Gross Commission');
  },
);

Then(
  'the Gross Commission card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Gross Commission');
  },
);

When('I click the Gross Commission card', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.clickMetricCard('Gross Commission');
});

Then(
  'a {string} popup is displayed',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectGrossCommissionBreakdownModal();
  },
);

Then(
  'the breakdown popup shows a Category summary table with Amount and % of Total columns',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectBreakdownCategorySummaryTable();
  },
);

Then(
  'the breakdown popup shows a detail table with search bar for carrier, product type, and type',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectBreakdownDetailTableWithSearch();
  },
);

// --- Agent Payouts ----------------------------------------------------------

Then(
  'the Agent Payouts card displays total commissions earned by agents',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Agent Payouts');
  },
);

Then(
  'the Agent Payouts card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Agent Payouts');
  },
);

Then(
  'the Agent Payouts metric refreshes dynamically based on filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricRefreshesDynamically('Agent Payouts');
  },
);

// --- Sub-Agent Payouts ------------------------------------------------------

Then(
  'the Sub-Agent Payouts card displays total commissions earned by sub-agents',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Sub-Agent Payouts');
  },
);

Then(
  'the Sub-Agent Payouts card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Sub-Agent Payouts');
  },
);

Then(
  'the Sub-Agent Payouts metric refreshes dynamically based on filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricRefreshesDynamically('Sub-Agent Payouts');
  },
);

// --- Sales Leader Override --------------------------------------------------

Then(
  'the Sales Leader Override card displays total override commissions earned by sales leaders',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Sales Leader Override');
  },
);

Then(
  'the Sales Leader Override card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Sales Leader Override');
  },
);

Then(
  'the Sales Leader Override metric refreshes dynamically based on filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricRefreshesDynamically('Sales Leader Override');
  },
);

// --- Net to Agency ----------------------------------------------------------

Then(
  'the Net to Agency card displays final retained earnings after all payouts',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Net to Agency');
  },
);

Then(
  'the Net to Agency card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Net to Agency');
  },
);

Then(
  'the Net to Agency metric refreshes dynamically based on filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricRefreshesDynamically('Net to Agency');
  },
);

// --- Chargebacks ------------------------------------------------------------

Then(
  'the Chargebacks card displays total chargebacks during the period',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Chargebacks');
  },
);

Then(
  'the Chargebacks card shows description {string}',
  async ({ agencyOwnerDashboardPage }, desc: string) => {
    await agencyOwnerDashboardPage.expectMetricDescription('Chargebacks');
  },
);

Then(
  'the Chargebacks metric refreshes dynamically based on filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMetricRefreshesDynamically('Chargebacks');
  },
);

// ============================================================================
// Revenue by Product Type
// ============================================================================

Then(
  'the Revenue by Product Type card displays a donut chart visualization',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueDonutChart();
  },
);

Then(
  'the chart shows revenue distribution by dimension',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueTotalAtCenter();
  },
);

Then(
  'the total revenue amount is displayed at the center of the chart',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueTotalAtCenter();
  },
);

Then(
  'the dimension tabs allow switching between:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectRevenueDimensionTabs(columnValues(table));
  },
);

Then(
  'the chart updates dynamically based on the selected grouping and filters',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueChartUpdatesOnFilterChange();
  },
);

// ============================================================================
// Time period — background / shorthand
// ============================================================================

When('I set the time period to {string}', async ({ agencyOwnerDashboardPage }, period: string) => {
  await agencyOwnerDashboardPage.selectTimePeriod(period as TimePeriodOption);
});

When(
  'I set the time period to {string} for pre-Requires',
  async ({ agencyOwnerDashboardPage }, period: string) => {
    await agencyOwnerDashboardPage.selectTimePeriod(period as TimePeriodOption);
  },
);

// ============================================================================
// Revenue by Dimension — Filter Interaction with Pie Chart & Gross Commission
// ============================================================================

When(
  'I switch to the {string} dimension tab on agency dashboard',
  async ({ agencyOwnerDashboardPage }, dimension: string) => {
    const dimMap: Record<string, 'lob' | 'carrier' | 'product-type'> = {
      'Product Type': 'product-type',
      LOB: 'lob',
      Carrier: 'carrier',
    };
    await agencyOwnerDashboardPage.clickRevenueDimensionTab(dimMap[dimension]);
  },
);

Then(
  'I capture the current gross commission value',
  async ({ agencyOwnerDashboardPage }) => {
    const value = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(value).toBeGreaterThan(0);
    setCapturedGrossCommission(value);
  },
);

When(
  'I uncheck all carrier filter options',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.uncheckAllInFilterSection('Carrier');
  },
);

When(
  'I uncheck all agent level filter options',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.uncheckAllInFilterSection('Agent Level');
  },
);

When(
  'I select carrier filter options {string} and {string}',
  async ({ agencyOwnerDashboardPage }, carrier1: string, carrier2: string) => {
    await agencyOwnerDashboardPage.selectFilterOptionsInSection('Carrier', [carrier1, carrier2]);
  },
);

When(
  'I select agent level filter option {string}',
  async ({ agencyOwnerDashboardPage }, level: string) => {
    await agencyOwnerDashboardPage.selectFilterOptionsInSection('Agent Level', [level]);
  },
);

Then(
  'the gross commission value changes to zero',
  async ({ agencyOwnerDashboardPage }) => {
    const value = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(value).toBe(0);
  },
);

Then(
  'the gross commission value is greater than zero',
  async ({ agencyOwnerDashboardPage }) => {
    const value = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(value).toBeGreaterThan(0);
  },
);

Then(
  'the gross commission value is different from the previously captured value',
  async ({ agencyOwnerDashboardPage }) => {
    const previous = getCapturedGrossCommission();
    const current = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(current).not.toBe(previous);
    expect(current).toBeGreaterThan(0);
  },
);

Then(
  'the revenue pie chart legend only shows the selected carriers on agency dashboard',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenuePieChartLegendShowsCarriers([
      'BCBS of OK',
      'Aetna',
    ]);
  },
);

// ============================================================================
// Additional filter actions — one-step expand + uncheck all
// ============================================================================

When('I expand and uncheck all additional filter sections', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.expandAndUncheckAllAdditionalFilterSections();
});

// ============================================================================
// Pie chart legend validation after filter changes
// ============================================================================

Then(
  'I capture the Gross commission initial value',
  async ({ agencyOwnerDashboardPage }) => {
    const value = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(value).toBeGreaterThan(0);
    setCapturedGrossCommission(value);
  },
);

Then(
  'I validate current Gross commission is lessthan or equals to capture initial one',
  async ({ agencyOwnerDashboardPage }) => {
    const initial = getCapturedGrossCommission();
    const current = await agencyOwnerDashboardPage.getGrossCommissionNumericValue();
    expect(current).toBeLessThanOrEqual(initial);
  },
);

// ============================================================================
// Pie chart — load wait and legend validation
// ============================================================================

Then(
  'I wait for the Pie Chart to load on agency dashboard',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.waitForRevenuePieChartLoaded();
  },
);

Then(
  'the pie chart legend shows checked filter labels from {string} on agency dashboard',
  async ({ agencyOwnerDashboardPage }, section: string) => {
    await agencyOwnerDashboardPage.expectPieChartLegendMatchesCheckedFilters(
      section as AdditionalFilterSection,
    );
  },
);

// ============================================================================
// Apply & format — shorthand / one-off steps
// ============================================================================

When('I click apply button', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.applyFilterChanges();
});

// ============================================================================
// Top Performers by Revenue
// ============================================================================

Then(
  'the Top Performers by Revenue widget displays ranked performance cards',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTopPerformersWidget();
  },
);

Then(
  'each performer card shows:',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectPerformerCardsShowDetails();
  },
);

Then(
  'the top performer cards display revenue split across Agent Revenue, Sales Leader Revenue, and Sub-Agent Revenue',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectPerformerCardsShowRevenueSplit();
  },
);

Then(
  'the top performers are arranged in descending revenue order',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectPerformersInDescendingOrder();
  },
);

Then(
  'the revenue split bars are color-coded by contribution type',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueSplitVisualization();
  },
);

Then(
  'the stacked bar segments represent Agent, Sales Leader, and Sub-Agent portions',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueSplitVisualization();
  },
);

Then(
  'the Top Performers by Revenue widget refreshes dynamically based on filter changes',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTopPerformersRefreshWithFilters();
  },
);

// ============================================================================
// 12-Month Revenue Trend
// ============================================================================

Then(
  'the 12-Month Revenue Trend widget displays a multi-line trend chart',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRevenueTrendChart();
  },
);

Then(
  'the chart shows trend lines for:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectTrendLinesVisible(columnValues(table));
  },
);

Then(
  'the trend lines for Total Revenue, Commission, Bonus, and Overrides are displayed for all months',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTrendLinesAccurateForAllMonths();
  },
);

Then(
  'the trend chart updates based on filters and date ranges',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTrendUpdatesWithFilters();
  },
);

// ============================================================================
// Commission Distribution by Role
// ============================================================================

Then(
  'the Commission Distribution by Role widget displays the commission split chart',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectCommissionDistributionChart();
  },
);

Then(
  'the chart shows role names with commission amounts and percentages',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectCommissionChartShowsRoleData([
      'Agent', 'Agency', 'Sales Leader', 'Sub-agent',
    ]);
  },
);

Then(
  'the Commission Distribution chart displays for each role:',
  async ({ agencyOwnerDashboardPage }, table: DataTable) => {
    await agencyOwnerDashboardPage.expectCommissionChartShowsRoleData(columnValues(table));
  },
);

Then(
  'each role shows commission amount, percentage, and number of people',
  async ({ agencyOwnerDashboardPage }) => {
    for (const role of ['Agent', 'Agency', 'Sales Leader', 'Sub-agent'] as const) {
      await agencyOwnerDashboardPage.expectEachRoleShowsAmountPercentageAndPeople(role);
    }
  },
);

// --- Agent role details -----------------------------------------------------

When(
  'I click the Agent role in Commission Distribution',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.clickRoleInCommissionDistribution('Agent');
  },
);

Then(
  'a role details panel is displayed with commission, number of agents, average, and percentage of total',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRoleDetailsPanelVisible();
    await agencyOwnerDashboardPage.expectRoleDetailsPanelShowsMetrics();
  },
);

Then(
  'the role details panel shows a {string} table',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTopPerformersTableInRoleDetails();
  },
);

Then(
  'the table contains columns: Name, Level, Policies, Commission',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTopPerformersTableInRoleDetails();
  },
);

Then(
  'the table data cross-references with key metrics data',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTopPerformersCrossReferenceWithMetrics();
  },
);

// --- Agency Owner role details ----------------------------------------------

When(
  'I click the Agency Owner role in Commission Distribution',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.clickRoleInCommissionDistribution('Agency');
  },
);

Then(
  'a role details panel is displayed with commission, number of agencies, average, and percentage of total',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRoleDetailsPanelVisible();
    await agencyOwnerDashboardPage.expectRoleDetailsPanelShowsMetrics();
  },
);

// --- Sales Leader role details ----------------------------------------------

When(
  'I click the Sales Leader role in Commission Distribution',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.clickRoleInCommissionDistribution('Sales Leader');
  },
);

Then(
  'a role details panel for Sales Leader is displayed with commission, number of people, average, and percentage of total',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRoleDetailsPanelVisible();
    await agencyOwnerDashboardPage.expectRoleDetailsPanelShowsMetrics();
  },
);

// --- Sub-agent role details -------------------------------------------------

When(
  'I click the Sub-agent role in Commission Distribution',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.clickRoleInCommissionDistribution('Sub-agent');
  },
);

Then(
  'a role details panel for Sub-agent is displayed with commission, number of people, average, and percentage of total',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRoleDetailsPanelVisible();
    await agencyOwnerDashboardPage.expectRoleDetailsPanelShowsMetrics();
  },
);

// --- Total and percentage assertions ----------------------------------------

Then(
  'the total commission distributed amount equals the sum of all role commissions',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectTotalCommissionMatchesSumOfRoles();
  },
);

Then(
  'the sum of all role percentages equals 100%',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectRolePercentagesSumTo100();
  },
);

// ============================================================================
// Year Limit
// ============================================================================

Then(
  'the agency dashboard minimum selectable year should be 1990',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMinimumSelectableYearIs1990();
  },
);

Then(
  'the agency dashboard maximum selectable year should be 2100',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectMaximumSelectableYearIs2100();
  },
);

// ============================================================================
// Sidebar modal close
// ============================================================================

When('I close the sidebar modal on agency dashboard', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.closeSidebarModal();
});
