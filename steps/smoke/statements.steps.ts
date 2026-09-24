import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate commission statements upload', async ({ statementUploadPage, page }) => {
  await statementUploadPage.openUploadPage();
  await capture(page, 'statements-upload');
});

Then('the commission statements upload page header is visible on smoke', async ({ statementUploadPage }) => {
  await statementUploadPage.smokeExpectUploadHeader();
});

When('I smoke navigate commission statements history', async ({ statementHistoryPage, page }) => {
  await statementHistoryPage.open();
  await capture(page, 'statements-history');
});

Then('the commission statements history page header is visible on smoke', async ({ statementHistoryPage }) => {
  await statementHistoryPage.smokeExpectHistoryHeader();
});

When('I smoke navigate commission statement details from history grid', async ({
  statementHistoryPage,
  page,
}) => {
  await statementHistoryPage.openDetailsFromGrid();
  await capture(page, 'statements-history-details');
});

Then('the commission statement details page header is visible on smoke', async ({ statementHistoryPage }) => {
  await statementHistoryPage.smokeExpectDetailsHeader();
});

When('I smoke navigate commission statements needs attention', async ({ needsAttentionPage, page }) => {
  await needsAttentionPage.open();
  await capture(page, 'statements-needs-attention');
});

Then('the needs attention page header is visible on smoke', async ({ needsAttentionPage }) => {
  await needsAttentionPage.smokeExpectHeader();
});
