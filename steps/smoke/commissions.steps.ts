import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate statement setup list', async ({ statementSetupPage, page }) => {
  await statementSetupPage.openList();
  await capture(page, 'statement-setup-list');
});

Then('the statement setup list page header is visible on smoke', async ({ statementSetupPage }) => {
  await statementSetupPage.smokeExpectListHeader();
});

When('I smoke navigate statement setup create', async ({ statementSetupPage, page }) => {
  await statementSetupPage.openCreate();
  await capture(page, 'statement-setup-create');
});

Then('the create statement setup page header is visible on smoke', async ({ statementSetupPage }) => {
  await statementSetupPage.smokeExpectCreateHeader();
});

When('I smoke navigate back to statement setup list', async ({ statementSetupPage, page }) => {
  await statementSetupPage.backToList();
  await capture(page, 'statement-setup-list-back');
});

When('I smoke navigate statement setup edit from grid', async ({ statementSetupPage, page }) => {
  await statementSetupPage.openList();
  await statementSetupPage.openEditFromGrid();
  await capture(page, 'statement-setup-edit');
});

Then('the edit statement setup page header is visible on smoke', async ({ statementSetupPage }) => {
  await statementSetupPage.smokeExpectEditHeader();
});
