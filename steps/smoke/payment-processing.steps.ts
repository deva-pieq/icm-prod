import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Then, When, test } from '../fixtures';

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

When('I smoke navigate payment processing payables', async ({ payablesPage, page }) => {
  await payablesPage.open();
  await capture(page, 'payment-payables');
});

Then('the payment payables page header is visible on smoke', async ({ payablesPage }) => {
  await payablesPage.smokeExpectHeader();
});

When('I smoke navigate payment processing approval', async ({ approvalPage, page }) => {
  await approvalPage.open();
  await capture(page, 'payment-approval');
});

Then('the payment approval page header is visible on smoke', async ({ approvalPage }) => {
  await approvalPage.smokeExpectHeader();
});

When('I smoke open payment approval record and verify authorize button', async ({
  approvalPage,
  page,
}) => {
  await approvalPage.openRecordAndAuthorize();
  await capture(page, 'payment-approval-record');
});

When('I smoke navigate payment processing history', async ({ disbursementPage, page }) => {
  await disbursementPage.open();
  await capture(page, 'payment-history');
});

Then('the disbursement history page header is visible on smoke', async ({ disbursementPage }) => {
  await disbursementPage.smokeExpectHeader();
});

When('I smoke open disbursement history record with finalized chip', async ({
  disbursementPage,
  page,
}) => {
  await disbursementPage.openRecordWithFinalizedChip();
  await capture(page, 'payment-history-record');
});
