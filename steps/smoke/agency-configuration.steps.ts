import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { When, Then, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate agency settings', async ({ agencySettingsPage, page }) => {
  await agencySettingsPage.open();
  await capture(page, 'agency-settings');
});

Then('the agency settings page heading is visible', async ({ agencySettingsPage }) => {
  await agencySettingsPage.expectHeadingVisible();
});

When('I smoke navigate data import', async ({ dataImportPage, page }) => {
  await dataImportPage.open();
  await capture(page, 'data-import');
});

Then('the data import page heading is visible', async ({ dataImportPage }) => {
  await dataImportPage.expectHeadingVisible();
});
