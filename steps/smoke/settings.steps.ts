import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate settings prompts', async ({ promptsPage, page }) => {
  await promptsPage.open();
  await capture(page, 'settings-prompts');
});

Then('the settings prompts page header is visible on smoke', async ({ promptsPage }) => {
  await promptsPage.smokeExpectHeader();
});

When('I smoke navigate settings commission templates', async ({ commissionTemplatesPage, page }) => {
  await commissionTemplatesPage.open();
  await capture(page, 'settings-commission-templates');
});

Then('the settings commission templates page header is visible on smoke', async ({
  commissionTemplatesPage,
}) => {
  await commissionTemplatesPage.smokeExpectHeader();
});

When('I smoke navigate settings transfer sheet', async ({ transferSheetPage, page }) => {
  await transferSheetPage.openTransferSheetPage();
  await capture(page, 'settings-transfer-sheet');
});

Then('the settings transfer sheet page header is visible on smoke', async ({ transferSheetPage }) => {
  await transferSheetPage.smokeExpectHeader();
});

When('I smoke navigate settings agency configuration', async ({ agencyConfigPage, page }) => {
  await agencyConfigPage.open();
  await capture(page, 'settings-agency-configuration');
});

Then('the settings agency configuration page header is visible on smoke', async ({
  agencyConfigPage,
}) => {
  await agencyConfigPage.smokeExpectHeader();
});
