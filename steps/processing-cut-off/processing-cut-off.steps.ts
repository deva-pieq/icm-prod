import { When, Then } from '../fixtures';

When(
  'I open Agency Settings payment processing window for processing cut off',
  async ({ processingCutOffPage }) => {
    await processingCutOffPage.open();
  },
);

When(
  'I select Processing Cut Off Day {string} for processing cut off',
  async ({ processingCutOffPage }, day: string) => {
    await processingCutOffPage.selectCutOffDay(day);
  },
);

When('I save agency settings for processing cut off', async ({ processingCutOffPage }) => {
  await processingCutOffPage.save();
});

Then(
  'the Processing Cut Off Day shows {string} for processing cut off',
  async ({ processingCutOffPage }, day: string) => {
    await processingCutOffPage.expectCutOffDayShows(day);
  },
);

When('I open the operations manager dashboard for processing cut off', async ({
  opsManagerDashboardPage,
  page,
}) => {
  await opsManagerDashboardPage.open();
  // Agency cut-off is read on dashboard mount; hard reload picks up the save
  // that just happened on Agency Settings (SPA sidebar nav keeps stale cycle).
  await page.reload({ waitUntil: 'domcontentloaded' });
  await opsManagerDashboardPage.open();
});

Then(
  'the viewing period weekly cycle runs from {word} through {word} for processing cut off',
  async ({ opsManagerDashboardPage, processingCutOffPage }, startDay: string, endDay: string) => {
    await processingCutOffPage.expectViewingPeriodWeeklyCycle(
      opsManagerDashboardPage,
      startDay,
      endDay,
    );
  },
);

Then('the viewing period date range is clearly displayed for processing cut off', async ({
  opsManagerDashboardPage,
}) => {
  // "Mon DD, YYYY - Mon DD, YYYY" — punctuation harvested live (" - " separator).
  await opsManagerDashboardPage.expectRangeFormatDisplayed();
});

When('I open Statement Upload for processing cut off', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.openUploadPage();
});

Then(
  'the Recently Uploaded active window is {word} through {word} for processing cut off',
  async ({ baseStatementUploadPage, processingCutOffPage }, startDay: string, endDay: string) => {
    await processingCutOffPage.expectActiveUploadWindowBounds(
      baseStatementUploadPage,
      startDay,
      endDay,
    );
  },
);

Then(
  'every visible upload row Uploaded date falls inside that {word} through {word} window for processing cut off',
  async ({ baseStatementUploadPage, processingCutOffPage }, startDay: string, endDay: string) => {
    await processingCutOffPage.expectEveryVisibleUploadRowWithinWindow(
      baseStatementUploadPage,
      startDay,
      endDay,
    );
  },
);
