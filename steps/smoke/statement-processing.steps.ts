import { expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { ProfilePage } from '../../pages/auth/ProfilePage';
import { agency3OpsCredentials } from '../../utils/loadEnv';
import { prepareStatementUploadFile } from '../../utils/excelStatementPrep';
import {
  setFirstSmokeRun,
  getFirstSmokeRun,
  updateFirstSmokeRun,
  setSecondSmokeRun,
  getSecondSmokeRun,
  updateSecondSmokeRun,
} from '../../utils/smoke/statementProcessingContext';
import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Given, When, Then, test } from '../fixtures';

/**
 * @smoke-statement-processing (T092–T096) always runs as Agency 3 Ops Manager
 * (agency3OpsCredentials() / E2E_EMAIL_AGENCY3). Forces re-login so Background / shared smoke session
 * cannot leave a different agency. Captures persist via statementProcessingContext
 * (memory + disk) so history/ledger scenarios can load prior fileId / Customer UID.
 */
Given('I am logged into PieQ ICM for smoke statement processing', async ({ loginPage, page }) => {
  const { email, password } = agency3OpsCredentials();
  if (await loginPage.isLoggedIn()) {
    await new ProfilePage(page).signOut();
  }
  await loginPage.goto();
  await loginPage.loginWithEmailPasswordToApp(email, password);
});

/** Preprod Carrier Product Name alias on product "Aetna U80 IL" (statement Scale name column). */
const SMOKE_STATEMENT_PRODUCT_ALIAS = '2026 $31 PMPM Medical (Cap 5 applied)';

async function prepareSmokeStatementFile() {
  return prepareStatementUploadFile({
    productAlias: SMOKE_STATEMENT_PRODUCT_ALIAS,
    uniqueCustomerUids: true,
    fileNamePrefix: 'SmokeStatement',
  });
}

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

async function parseFirstCustomerUid(filePath: string): Promise<string> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const sheet = wb.worksheets[0];
  if (!sheet || sheet.rowCount < 2) throw new Error('Prepared Excel has no data rows');
  const headerRow = sheet.getRow(1);
  let uidCol = 1;
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    if (String(cell.value ?? '').trim().toLowerCase() === 'customer uid') uidCol = col;
  });
  const dataRow = sheet.getRow(2);
  return String(dataRow.getCell(uidCol).value ?? '').trim();
}

When('a smoke statement upload file is prepared', async () => {
  const prepared = await prepareSmokeStatementFile();
  const customerUid = await parseFirstCustomerUid(prepared.absolutePath);
  setFirstSmokeRun({ preparedFile: prepared, customerUid, fileId: '' });
});

Then('the first Customer UID is captured from the prepared smoke CSV', async () => {
  const run = getFirstSmokeRun();
  expect(run.customerUid, 'First Customer UID should not be empty').toBeTruthy();
});

When('I upload the prepared smoke statement file', async ({ statementUploadPage }) => {
  const { preparedFile } = getFirstSmokeRun();
  await statementUploadPage.ensureOnUploadPage();
  await statementUploadPage.uploadFromPrepared(preparedFile);
});

Then('the smoke upload appears in the recently uploaded grid', async ({ statementUploadPage }) => {
  const { email } = agency3OpsCredentials();
  await statementUploadPage.expectRecentlyUploadedInProgress(email);
});

Then(
  'the smoke upload shows status {string} and stage {string}',
  async ({ statementUploadPage }, _status: string, _stage: string) => {
    await statementUploadPage.expectStoredRowReviewState();
  },
);

When('I open the review page for the smoke upload', async ({ statementUploadPage }) => {
  await statementUploadPage.openReviewForStoredUpload();
});

When('I complete the review and confirm from smoke', async ({ statementUploadPage }) => {
  await statementUploadPage.completeReviewAndConfirm();
});

Then('the smoke upload shows stage {string}', async ({ statementUploadPage }, _stage: string) => {
  await statementUploadPage.ensureOnUploadPage();
  const fileId = await statementUploadPage.expectStoredUploadStage('Completed');
  updateFirstSmokeRun({ fileId });
});

When('I navigate to commission statement history from smoke', async ({ statementHistoryPage, page }) => {
  await statementHistoryPage.open();
  await capture(page, 'smoke-statement-history');
});

When('I open the commission statement history for the captured file', async ({ statementHistoryPage, page }) => {
  const { fileId } = getFirstSmokeRun();
  await statementHistoryPage.openDetailsByFileId(fileId);
  await capture(page, 'smoke-commission-details');
});

Then('the commission details page heading is visible', async ({ commissionDetailsPage }) => {
  await commissionDetailsPage.expectOnDetailsPage();
});

Then('the commission details records are present', async ({ commissionDetailsPage }) => {
  const count = await commissionDetailsPage.getRecordCountFromFooter();
  expect(count, 'Commission details should have at least 1 record').toBeGreaterThan(0);
});

When('I navigate to the policies page from smoke', async ({ policiesPage, page }) => {
  await policiesPage.openList();
  await capture(page, 'smoke-policies-list');
});

When('I search for the captured Customer UID in policies', async ({ policiesPage }) => {
  const { customerUid } = getFirstSmokeRun();
  await policiesPage.searchGrid(customerUid);
});

When('I click the policy actions kebab menu', async ({ policiesPage }) => {
  await policiesPage.clickPolicyActionsKebeb();
});

When('I click view ledger from the policy actions menu', async ({ policiesPage }) => {
  await policiesPage.clickViewLedger();
});

Then('the policy ledger is displayed with entries', async ({ policiesPage }) => {
  await policiesPage.expectPolicyLedgerHasEntries();
});

// ═══════════════════════════════════════════════════════════════════════
// Run 2 — retry with changed date
// ═══════════════════════════════════════════════════════════════════════

When('a second smoke statement upload file is prepared with changed date', async () => {
  const prepared = await prepareSmokeStatementFile();
  const customerUid = await parseFirstCustomerUid(prepared.absolutePath);
  setSecondSmokeRun({ preparedFile: prepared, customerUid, fileId: '' });
});

Then('the second Customer UID is captured from the prepared smoke CSV', async () => {
  const run = getSecondSmokeRun();
  expect(run.customerUid, 'Second Customer UID should not be empty').toBeTruthy();
});

When('I upload the second prepared smoke statement file', async ({ statementUploadPage }) => {
  const { preparedFile } = getSecondSmokeRun();
  await statementUploadPage.ensureOnUploadPage();
  await statementUploadPage.uploadFromPrepared(preparedFile);
});

Then(
  'the second smoke upload appears in the recently uploaded grid',
  async ({ statementUploadPage }) => {
    const { email } = agency3OpsCredentials();
    await statementUploadPage.expectRecentlyUploadedInProgress(email);
  },
);

Then(
  'the second smoke upload shows status {string} and stage {string}',
  async ({ statementUploadPage }, _status: string, _stage: string) => {
    await statementUploadPage.expectStoredRowReviewState();
  },
);

When('I open the review page for the second smoke upload', async ({ statementUploadPage }) => {
  await statementUploadPage.openReviewForStoredUpload();
});

Then(
  'the second smoke upload shows stage {string}',
  async ({ statementUploadPage }, _stage: string) => {
    await statementUploadPage.ensureOnUploadPage();
    const fileId = await statementUploadPage.expectStoredUploadStage('Completed');
    updateSecondSmokeRun({ fileId });
  },
);

When(
  'I search for the second captured Customer UID in policies',
  async ({ policiesPage }) => {
    const { customerUid } = getSecondSmokeRun();
    await policiesPage.searchGrid(customerUid);
  },
);
