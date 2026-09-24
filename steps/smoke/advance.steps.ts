import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate advance overview', async ({ advanceOverviewRegressionPage, page }) => {
  await advanceOverviewRegressionPage.smokeOpenViaSidebar();
  await capture(page, 'advance-overview');
});

Then('the advance overview page header is visible on smoke', async ({ advanceOverviewRegressionPage }) => {
  await advanceOverviewRegressionPage.smokeExpectHeader();
});

When('I smoke navigate advance setup', async ({ advanceSetupRegressionPage, page }) => {
  await advanceSetupRegressionPage.smokeOpenViaSidebar();
  await capture(page, 'advance-setup');
});

Then('the advance setup page header is visible on smoke', async ({ advanceSetupRegressionPage }) => {
  await advanceSetupRegressionPage.smokeExpectHeader();
});
