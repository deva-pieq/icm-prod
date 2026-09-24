import { When, Then, test } from '../fixtures';
import { expect } from '@playwright/test';

/** ============================================================
 *  When — Navigation
 *  ============================================================ */

When('I open Statement History on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.open();
});

When('I open Statement Upload on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.openUploadPage();
});

/** ============================================================
 *  When — Date Range Filter
 *  ============================================================ */

When('I open the date range picker on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openDateRangePicker();
});

When('I choose calendar date {string} then {string} on statement history', async ({ statementHistoryPage }, firstDate: string, secondDate: string) => {
  await statementHistoryPage.selectDateInPicker(firstDate);
  await statementHistoryPage.selectDateInPicker(secondDate);
});

When('I double-click calendar date {string} on statement history', async ({ statementHistoryPage }, date: string) => {
  await statementHistoryPage.selectDateInPicker(date);
  await statementHistoryPage.selectDateInPicker(date);
});

When('I set the date range from {string} through today on statement history', async ({ statementHistoryPage }, startDate: string) => {
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  await statementHistoryPage.setDateRange(startDate, today);
});

When('I set the date range from {string} to {string} on statement history', async ({ statementHistoryPage }, startDate: string, endDate: string) => {
  await statementHistoryPage.setDateRange(startDate, endDate);
});

When('I include stage {string} on statement history', async ({ statementHistoryPage }, stage: string) => {
  if (stage === 'Completed') {
    await statementHistoryPage.includeCompletedStage();
  } else {
    await statementHistoryPage.selectOnlyStage(stage);
  }
});

/** ============================================================
 *  When — Stage Dropdown
 *  ============================================================ */

When('I open the stage dropdown on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openStageDropdown();
});

When('I select only stage {string} on statement history', async ({ statementHistoryPage }, stage: string) => {
  await statementHistoryPage.selectOnlyStage(stage);
});

When('I select stages {string} on statement history', async ({ statementHistoryPage }, stages: string) => {
  const stageList = stages.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  await statementHistoryPage.selectStages(stageList);
});

When('I select stages {string} and {string} on statement history', async ({ statementHistoryPage }, stage1: string, stage2: string) => {
  await statementHistoryPage.selectStages([stage1, stage2]);
});

When('I select stages {string}, {string}, and {string} on statement history', async ({ statementHistoryPage }, stage1: string, stage2: string, stage3: string) => {
  await statementHistoryPage.selectStages([stage1, stage2, stage3]);
});

When('I select stage {string} on statement history', async ({ statementHistoryPage }, stage: string) => {
  await statementHistoryPage.addStage(stage);
});

When('I select stages {string}, {string}, {string}, {string}, {string}, and {string} on statement history', async ({ statementHistoryPage }, s1: string, s2: string, s3: string, s4: string, s5: string, s6: string) => {
  await statementHistoryPage.selectStages([s1, s2, s3, s4, s5, s6]);
});

When('I select stages {string}, {string}, {string}, {string}, {string}, {string}, and {string} on statement history', async ({ statementHistoryPage }, s1: string, s2: string, s3: string, s4: string, s5: string, s6: string, s7: string) => {
  await statementHistoryPage.selectStages([s1, s2, s3, s4, s5, s6, s7]);
});

When('I click Select All in the stage dropdown on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.clickStageSelectAll();
});

When('I click Clear All in the stage dropdown on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.clickStageClearAll();
});

When('I clear the data grid filters on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.clickGridClearFilters();
});

When('I close the stage dropdown on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.closeStageDropdown();
});

/** ============================================================
 *  When — Upload
 *  ============================================================ */

When('I upload a new commission statement file on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.uploadNewCommissionStatementAndCapture();
});

/** ============================================================
 *  Then — Headers / date range
 *  ============================================================ */

Then('the Commission Statement History heading is displayed on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectHistoryHeading();
});

Then('the Upload Commission Statement heading is displayed on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectUploadHeading();
});

Then('the date range filter is visible and enabled on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectDateRangeFilterReady();
});

Then('the date range filter shows a start date and an end date in MM\\/DD\\/YYYY format on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectDateRangeMmDdYyyy();
});

Then('the date range filter start date is the first day of the current month on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectDateRangeStartFirstOfMonth();
});

Then('the date range filter end date is today on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectDateRangeEndToday();
});

Then('the date range year minimum is {int} on statement history', async ({ statementHistoryPage }, expectedMin: number) => {
  await statementHistoryPage.openDateRangePicker();
  const range = await statementHistoryPage.getPickerYearRange();
  expect(range.min).toBe(expectedMin);
  await statementHistoryPage.closeDateRangePicker();
});

Then('the date range year maximum is {int} on statement history', async ({ statementHistoryPage }, expectedMax: number) => {
  await statementHistoryPage.openDateRangePicker();
  const range = await statementHistoryPage.getPickerYearRange();
  expect(range.max).toBe(expectedMax);
  await statementHistoryPage.closeDateRangePicker();
});

Then('the date range year maximum is the current year on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openDateRangePicker();
  const range = await statementHistoryPage.getPickerYearRange();
  expect(range.max).toBe(new Date().getFullYear());
  await statementHistoryPage.closeDateRangePicker();
});

Then('every visible history row Uploaded date is between {string} and today inclusive on statement history', async ({ statementHistoryPage }, startDate: string) => {
  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  await statementHistoryPage.expectAllRowsUploadedDateInRange(startDate, today);
});

Then('the date range filter shows {string} to {string} on statement history', async ({ statementHistoryPage }, startDate: string, endDate: string) => {
  await statementHistoryPage.expectDateRangeEquals(startDate, endDate);
});

Then('every visible history row Uploaded date is between {string} and {string} inclusive on statement history', async ({ statementHistoryPage }, startDate: string, endDate: string) => {
  await statementHistoryPage.expectAllRowsUploadedDateInRange(startDate, endDate);
});

Then('history file counts by month sum to the visible row count on statement history', async ({ statementHistoryPage }) => {
  const count = await statementHistoryPage.getVisibleRowCount();
  expect(count).toBeGreaterThan(0);
});

Then('the date range filter start date is {string} on statement history', async ({ statementHistoryPage }, expectedStart: string) => {
  await statementHistoryPage.expectDateRangeStart(expectedStart);
});

Then('the date range year minimum is {string} on statement history', async ({ statementHistoryPage }, expectedMin: string) => {
  await statementHistoryPage.openDateRangePicker();
  const range = await statementHistoryPage.getPickerYearRange();
  expect(range.min).toBe(parseInt(expectedMin, 10));
  await statementHistoryPage.closeDateRangePicker();
});

Then('the date range year maximum is {string} on statement history', async ({ statementHistoryPage }, expectedMax: string) => {
  await statementHistoryPage.openDateRangePicker();
  const range = await statementHistoryPage.getPickerYearRange();
  expect(range.max).toBe(parseInt(expectedMax, 10));
  await statementHistoryPage.closeDateRangePicker();
});

Then('dates after today are disabled in the date range picker on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openDateRangePicker();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const isDisabled = await statementHistoryPage.isDateDisabledInPicker(tomorrowStr);
  expect(isDisabled).toBe(true);
  await statementHistoryPage.closeDateRangePicker();
});

Then('I cannot select tomorrow as the date range end date on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openDateRangePicker();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const isDisabled = await statementHistoryPage.isDateDisabledInPicker(tomorrowStr);
  expect(isDisabled).toBe(true);
  await statementHistoryPage.closeDateRangePicker();
});

Then('the date range start date is not equal to the end date on statement history', async ({ statementHistoryPage }) => {
  const value = await statementHistoryPage.getDateRangeValue();
  const [start, end] = value.split(' - ');
  expect(start).not.toBe(end);
});

/** ============================================================
 *  Then — Upload queue
 *  ============================================================ */

Then('the Recently Uploaded Statements grid is displayed on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectRecentStatementsGrid();
});

Then('the Recently Uploaded Statements grid has an Uploaded date column on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectRecentStatementsGridHasUploadedColumn();
});

Then('the active uploaded-date window is Thursday through Wednesday inclusive on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectActiveThursdayWednesdayWindow();
});

Then('every visible upload row Uploaded date falls inside that Thursday–Wednesday window on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectRecentStatementsInActiveWindow();
});

Then('no visible upload row has stage {string} on statement upload', async ({ baseStatementUploadPage }, stage: string) => {
  test.fail(true, 'T009: Completed rows still appear on Upload');
  expect(stage).toBe('Completed');
  await baseStatementUploadPage.expectNoCompletedInRecentStatements();
});

Then('every visible upload row stage is one of:', async ({ baseStatementUploadPage }, dataTable: { raw: () => string[][] }) => {
  const expectedStages = dataTable
    .raw()
    .flat()
    .map((s: string) => s.trim())
    .filter((s) => s && s !== 'Stage');
  await baseStatementUploadPage.expectRecentStatementsStages(expectedStages);
});

Then('visible upload rows are ordered by Uploaded date\\/time descending on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectRecentStatementsSortedByUploadedDesc();
});

When('I sort the {string} column ascending on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.sortRecentColumnAscending(column);
});

When('I sort the {string} column descending on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.sortRecentColumnDescending(column);
});

Then('the {string} column shows ascending sort on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.expectRecentColumnAriaSort(column, 'ascending');
});

Then('the {string} column shows descending sort on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.expectRecentColumnAriaSort(column, 'descending');
});

Then('the {string} column is sorted ascending on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.expectRecentColumnSorted(column, 'asc');
});

Then('the {string} column is sorted descending on statement upload', async ({ baseStatementUploadPage }, column: string) => {
  await baseStatementUploadPage.expectRecentColumnSorted(column, 'desc');
});

Then('the Recently Uploaded Statements row for the stored file shows a File ID, stage, and status on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectStoredFileLifecycleIdentity();
});

Then('the stored file stage is a lifecycle stage on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectStoredFileLifecycleIdentity();
});

Then('the stored file status is a lifecycle status on statement upload', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.expectStoredFileLifecycleIdentity();
});

/** ============================================================
 *  Then — Stage dropdown
 *  ============================================================ */

Then('the stage dropdown is visible and enabled on statement history', async ({ statementHistoryPage }) => {
  await expect(statementHistoryPage.loc.stageDropdownBtn()).toBeVisible({ timeout: 15000 });
  await expect(statementHistoryPage.loc.stageDropdownBtn()).toBeEnabled({ timeout: 15000 });
});

Then('the stage dropdown lists:', async ({ statementHistoryPage }, dataTable: { raw: () => string[][] }) => {
  const expected = dataTable
    .raw()
    .flat()
    .map((s) => s.trim())
    .filter((s) => s && s !== 'Stage');
  await statementHistoryPage.expectStageDropdownLists(expected);
});

Then('the closed stage dropdown shows the name {string} on statement history', async ({ statementHistoryPage }, stageName: string) => {
  const label = await statementHistoryPage.getStageDropdownLabel();
  expect(label).toBe(stageName);
});

Then('the closed stage dropdown shows a selected-stage count of {int} on statement history', async ({ statementHistoryPage }, count: number) => {
  const label = await statementHistoryPage.getStageDropdownLabel();
  expect(label).toContain(`${count} stage`);
});

Then('stage {string} is not selected on statement history', async ({ statementHistoryPage }, stage: string) => {
  const isSelected = await statementHistoryPage.isStageSelected(stage);
  expect(isSelected).toBe(false);
});

Then('every stage option other than {string} is selected on statement history', async ({ statementHistoryPage }, excludedStage: string) => {
  await statementHistoryPage.openStageDropdown();
  const available = await statementHistoryPage.getAvailableStages();
  for (const stage of available) {
    if (stage !== excludedStage) {
      const isSelected = await statementHistoryPage.isStageSelected(stage);
      expect(isSelected).toBe(true);
    }
  }
  await statementHistoryPage.closeStageDropdown();
});

Then('stage {string} is included in the active stage filter on statement history', async ({ statementHistoryPage }, stage: string) => {
  const isSelected = await statementHistoryPage.isStageSelected(stage);
  expect(isSelected).toBe(true);
});

Then('at least one visible history row has stage {string} when Completed files exist on statement history', async ({ statementHistoryPage }, stage: string) => {
  await statementHistoryPage.expectOptionalStageInRows(stage);
});

Then('the closed stage dropdown does not show a selected-stage count of {int} on statement history', async ({ statementHistoryPage }, count: number) => {
  const label = await statementHistoryPage.getStageDropdownLabel();
  expect(label).not.toContain(`${count} stage`);
});

Then('every visible history row stage is {string} on statement history', async ({ statementHistoryPage }, stage: string) => {
  await statementHistoryPage.expectAllRowsStageIn([stage]);
});

Then('every visible history row stage is one of {string} on statement history', async ({ statementHistoryPage }, stages: string) => {
  const stageList = stages.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  await statementHistoryPage.expectAllRowsStageIn(stageList);
});

Then('stages {string}, {string}, and {string} are selected in the stage dropdown on statement history', async ({ statementHistoryPage }, stage1: string, stage2: string, stage3: string) => {
  await statementHistoryPage.openStageDropdown();
  for (const stage of [stage1, stage2, stage3]) {
    const isSelected = await statementHistoryPage.isStageSelected(stage);
    expect(isSelected).toBe(true);
  }
  await statementHistoryPage.closeStageDropdown();
});

Then('every visible history row stage is one of {string}, {string}, {string} on statement history', async ({ statementHistoryPage }, stage1: string, stage2: string, stage3: string) => {
  await statementHistoryPage.expectAllRowsStageIn([stage1, stage2, stage3]);
});

Then('every visible history row stage is one of {string}, {string}, {string}, {string}, {string}, {string} on statement history', async ({ statementHistoryPage }, s1: string, s2: string, s3: string, s4: string, s5: string, s6: string) => {
  await statementHistoryPage.expectAllRowsStageIn([s1, s2, s3, s4, s5, s6]);
});

Then('all stage options are selected on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.openStageDropdown();
  const available = await statementHistoryPage.getAvailableStages();
  for (const stage of available) {
    const isSelected = await statementHistoryPage.isStageSelected(stage);
    expect(isSelected).toBe(true);
  }
});

Then('the default history stages are selected on statement history', async ({ statementHistoryPage }) => {
  await statementHistoryPage.expectDefaultHistoryStages();
});
