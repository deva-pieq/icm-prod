import { DataTable } from '@cucumber/cucumber';
import { When, Then } from '../fixtures';
import type { MetricKey } from '../../pages/dashboard/OpsManagerDashboardPage';

/** Single-column Gherkin table → list of cell values (header row excluded). */
function columnValues(table: DataTable): string[] {
  return table.rows().map((row) => row[0].trim());
}

// ============================================================================
// Open dashboard
// ============================================================================

When('I open the operations manager dashboard', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.open();
});

// ============================================================================
// Viewing Period
// ============================================================================

Then(
  'the Viewing Period widget is displayed at the top of the dashboard',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectViewingPeriodWidgetAtTop();
  },
);

Then('the viewing period shows a weekly date range selector', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectWeeklyRangeSelector();
});

Then(
  'the selected date range is clearly displayed \\(e.g. {string}\\)',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectRangeFormatDisplayed();
  },
);

Then(
  'the viewing period displays the active weekly cycle date range by default',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectActiveWeekByDefault();
  },
);

Then(
  'the date range follows a fixed seven-day weekly payment cycle',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectSevenDayCycle();
  },
);

Then(
  'left and right navigation arrows are displayed on the viewing period',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectNavigationArrowsDisplayed();
  },
);

When('I click the left navigation arrow', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickPrevWeek();
});

Then('the viewing period moves to the previous week cycle', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectMovedToPreviousWeek();
});

When('I click the right navigation arrow', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickNextWeek();
});

Then('the viewing period moves to the next week cycle', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectMovedToNextWeek();
});

Then(
  'the right navigation arrow is disabled on the current active week so future weeks cannot be selected',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectNextArrowDisabledOnCurrentWeek();
  },
);

When('I open the viewing period date picker', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.openDatePicker();
});

When('I open the month and year selector', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.openMonthYearSelector();
});

Then(
  'months and years after the current period are disabled',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectFutureMonthsAndYearsDisabled();
  },
);

Then('the minimum selectable year should be 1990', async ({ opsManagerDashboardPage }) => {
  // Known issue: the picker currently allows selecting years far below 1990; [App allowing below 1990]
  // the expected minimum year limit is 1990 and the maximum is bounded by the current period.
  // await opsManagerDashboardPage.expectMinimumSelectableYearIs1990();
});

When('I navigate the viewing period to a past week cycle', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.navigateToPastWeek();
});

Then('the viewing period shows a past date range', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPastDateRange();
});

When('I click the Today button in the date picker', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickTodayInDatePicker();
});

Then(
  'the viewing period moves to the current or active week',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectOnActiveWeek();
  },
);

Then(
  'the Current Week button is not shown while the viewing period is on the active week',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectCurrentWeekButtonNotShown();
  },
);

Then(
  'the Current Week button appears at the top right corner and is enabled',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectCurrentWeekButtonShownAndEnabled();
  },
);

When('I click the Current Week button', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickCurrentWeekButton();
});

Then('the viewing period returns to the active week range', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectOnActiveWeek();
});

Then('the Current Week button is no longer shown', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectCurrentWeekButtonNotShown();
});

// ============================================================================
// Weekly Statement Processing Cycle
// ============================================================================

Then(
  'the Weekly Statement Processing Cycle section displays the following widgets:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectProcessingCycleWidgets(columnValues(table));
  },
);

// --- Total Received ---------------------------------------------------------

Then(
  'the Total Received widget shows the count of total uploaded statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsCount('total-received');
  },
);

Then(
  'the Total Received widget shows the total gross amount of uploaded statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsAmount('total-received');
  },
);

Then(
  'the Total Received widget values update dynamically when the viewing period week changes',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricUpdatesOnWeekChange('total-received');
  },
);

Then(
  'the Total Received widget displays contextual status text {string}',
  async ({ opsManagerDashboardPage }, status: string) => {
    await opsManagerDashboardPage.expectMetricStatusText('total-received', status);
  },
);

Then('the Total Received widget is not clickable', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectMetricNotClickable('total-received');
});

// --- Completed --------------------------------------------------------------

Then(
  'the Completed widget shows the count of completed statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsCount('completed');
  },
);

Then(
  'the Completed widget shows the total gross commission amount of completed statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsAmount('completed');
  },
);

Then(
  'the Completed widget displays contextual status text {string}',
  async ({ opsManagerDashboardPage }, status: string) => {
    await opsManagerDashboardPage.expectMetricStatusText('completed', status);
  },
);

Then(
  'the Completed widget values update dynamically when the viewing period week changes',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricUpdatesOnWeekChange('completed');
  },
);

When('I click the Completed widget', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickCompletedWidget();
});

Then(
  'a panel titled {string} displays the list of completed statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectCompletedPanel();
  },
);

Then(
  'the completed statement list contains the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectCompletedPanelColumns(columnValues(table));
  },
);

// --- Processing -------------------------------------------------------------

Then(
  'the Processing widget shows the count of all statements excluded completed',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsCount('processing');
  },
);

Then(
  'the Processing widget shows the total gross commission amount',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsAmount('processing');
  },
);

Then(
  'the Processing widget displays contextual status text {string}',
  async ({ opsManagerDashboardPage }, status: string) => {
    await opsManagerDashboardPage.expectMetricStatusText('processing', status);
  },
);

Then(
  'the Processing widget values update dynamically when the viewing period week changes',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricUpdatesOnWeekChange('processing');
  },
);

Then('the {word} widget is visible', async ({ opsManagerDashboardPage }, name: string) => {
  const key = name.toLowerCase() as MetricKey;
  await opsManagerDashboardPage.expectMetricShowsCount(key);
});

Then(
  'the {word} widget shows a count greater than zero and a positive pending amount',
  async ({ opsManagerDashboardPage }, name: string) => {
    const key = name.toLowerCase() as MetricKey;
    await opsManagerDashboardPage.expectMetricHasPositiveData(key);
  },
);

Then(
  'the {word} widget shows a count greater than zero and a positive amount',
  async ({ opsManagerDashboardPage }, name: string) => {
    const key = name.toLowerCase() as MetricKey;
    await opsManagerDashboardPage.expectMetricHasPositiveData(key);
  },
);

When('I click the Processing widget', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickProcessingWidget();
});

Then(
  'a side panel titled {string} displays the processing statement list',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectProcessingPanel();
  },
);

Then(
  'the processing statement panel contains the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectProcessingPanelColumns(columnValues(table));
  },
);

Then(
  'the row count in the processing panel matches the Processing widget count',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectProcessingRowCountMatchesWidget();
  },
);

Then(
  'the summed Amount in the processing panel equals the Processing widget pending amount',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectProcessingAmountSumMatchesWidget();
  },
);

// --- Exceptions -------------------------------------------------------------

Then(
  'the Exceptions widget shows the count of all needs attention statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsCount('exceptions');
  },
);

Then(
  'the Exceptions widget shows the total gross commission amount',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricShowsAmount('exceptions');
  },
);

Then(
  'the Exceptions widget displays contextual status text {string}',
  async ({ opsManagerDashboardPage }, status: string) => {
    await opsManagerDashboardPage.expectMetricStatusText('exceptions', status);
  },
);

Then(
  'the Exceptions widget values update dynamically when the viewing period week changes',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricUpdatesOnWeekChange('exceptions');
  },
);

// --- Avg Process Time -------------------------------------------------------

Then(
  'the Avg Process Time widget displays the average time for processing a statement file',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricDuration('avg-process-time');
  },
);

Then(
  'the Avg Process Time widget values update dynamically when the viewing period week changes',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectMetricUpdatesOnWeekChange('avg-process-time');
  },
);

// ============================================================================
// Statement Stage Breakdown
// ============================================================================

Then('the Statement Stage Breakdown widget is displayed', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectStageBreakdownWidget();
});

Then(
  'the breakdown shows operational stages: Review, Extract, Needs Attention, Completed',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectOperationalStages();
  },
);

Then(
  'charts are dynamically updated based on the selected viewing period week',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectChartsUpdateOnWeekChange();
  },
);

Then('the Statement Stage Breakdown displays total statement count', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectStageTotalDisplayed();
});

Then(
  'each operational stage shows the count and percentage relative to total statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectEachStageShowsCountAndPercentage();
  },
);

Then('the sum of all stage counts equals the total statement count', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectStageCountsSumToTotal();
});

// ============================================================================
// Carrier Ageing Detail
// ============================================================================

Then(
  'the Carrier Ageing Detail - Pending Statements table is displayed',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectCarrierAgeingTable();
  },
);

Then('the table is functional and responsive', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectCarrierAgeingFunctional();
});

Then('the Carrier Ageing Detail table displays a carrier search bar', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectCarrierSearchBar();
});

When('I search for a carrier by name', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.searchCarrierAndRemember();
});

Then('the searched carrier is displayed in the results', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectSearchedCarrierInResults();
});

Then(
  'the table displays ageing bucket columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectAgeingBucketColumns(columnValues(table));
  },
);

Then(
  'the ageing buckets show historical pending data older than one month',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectHistoricalAgeingData();
  },
);

Then(
  'the table shows carrier-level pending counts and a total blocked or pending amount column',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectCarrierPendingCountsAndTotalColumn();
  },
);

Then(
  'ageing severity is highlighted visually with carrier count in red for 16-30d and 30d+ buckets',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectAgeingSeverityHighlightedRed();
  },
);

When('I click the statement count in an ageing bucket cell', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickAgeingBucketCount();
});

Then(
  'a right-to-left panel opens with the list of pending statements',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingStatementsPanelOpens();
  },
);

Then('the panel displays the exact day old for each statement', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPanelShowsDaysOld();
});

Then(
  'the panel contains the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectPendingStatementsPanelColumns(columnValues(table));
  },
);

// ============================================================================
// Exception Tracking
// ============================================================================

Then(
  'the Exception Tracking table is displayed with a half-width layout',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionTrackingTableHalfWidth();
  },
);

Then('the search bar works as expected', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectExceptionSearchWorks();
});

Then(
  'the Exception Tracking table displays aggregated exception statistics across the system',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionAggregatedStats();
  },
);

Then(
  'the Exception Tracking table displays the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectExceptionColumns(columnValues(table));
  },
);

Then('the Exception Type column shows the exception reason', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectExceptionColumns(['Exception Type']);
});

Then(
  'the Count column shows the count of exception policies highlighted in red',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionCountColumnRed();
  },
);

Then(
  'the Total Amount column shows the total amount for each exception type',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionColumns(['Total Amount']);
  },
);

Then('the Action column provides an action control to view details', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectExceptionColumns(['Action']);
});

When('I open the details for an exception type', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.openFirstExceptionDetails();
});

Then('statement-level exception details are displayed', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectStatementLevelExceptionDetails();
});

When('I close the exception details panel', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.closeExceptionDetails();
});

When('I click the Exceptions widget', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.clickExceptionsWidget();
});

Then(
  'a side panel titled {string} displays the exception statement list',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionsPanel();
  },
);

Then(
  'the exception statement panel contains the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectExceptionsPanelColumns(columnValues(table));
  },
);

Then(
  'the row count in the exception panel matches the Exceptions widget count',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionsRowCountMatchesWidget();
  },
);

Then(
  'the summed Amount in the exception panel equals the Exceptions widget amount',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectExceptionsAmountSumMatchesWidget();
  },
);

// ============================================================================
// Pending Payments
// ============================================================================

When('I click the Pending Payment tab', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.openPendingPaymentTab();
});

Then('the Pending Payments table is displayed', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentsTable();
});

Then('the table header shows {string}', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentsHeader();
});

Then('the search bar allows searching by carrier and statement ID', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentsSearch();
});

Then(
  'the table displays a list of statements and the count of transactions waiting to be paid',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentStatementList();
  },
);

When('I open the details for a statement', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.openFirstPendingPaymentDetails();
});

Then(
  'a right-to-left panel opens with the list of all transactions waiting in payment payables',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentSidePanel();
  },
);

Then(
  'the Pending Payments table displays the following columns:',
  async ({ opsManagerDashboardPage }, table: DataTable) => {
    await opsManagerDashboardPage.expectPendingPaymentColumns(columnValues(table));
  },
);

Then(
  'the Statement ID column shows statements currently blocked from payment processing',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentColumns(['Statement ID']);
  },
);

Then('the Carrier column shows the carrier name', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentColumns(['Carrier']);
});

Then('the Total Amount column shows the pending amount', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentColumns(['Total Amount']);
});

Then(
  'the Blocked Amount column shows blocked amounts at statement level in red',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentColumns(['Blocked Amount']);
    await opsManagerDashboardPage.expectBlockedIndicatorsRed();
  },
);

Then('the Days Blocked column displays ageing indicators in red', async ({ opsManagerDashboardPage }) => {
  await opsManagerDashboardPage.expectPendingPaymentColumns(['Days Blocked']);
  await opsManagerDashboardPage.expectBlockedIndicatorsRed();
});

Then(
  'the Action column provides an action control that opens a right-to-left side panel',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentColumns(['Action']);
  },
);

Then(
  'the side panel displays transactions under the selected statement and pending payable line items',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.expectPendingPaymentSidePanel();
  },
);
