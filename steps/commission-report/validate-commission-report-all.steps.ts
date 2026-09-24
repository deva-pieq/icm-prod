import fs from 'node:fs';
import { expect } from '@playwright/test';
import { prepareCommissionReportFileFromInbox } from '../../utils/commission-report/inboxStatementPrep';
import {
  getCommissionReportPreparedFile,
  setCommissionReportPreparedFile,
} from '../../utils/commission-report/commissionReportContext';
import { COMMISSION_REPORT } from '../../test-data/commission-report/validateCommissionReport';
import { smokeCredentials } from '../../utils/loadEnv';
import { Given, When, Then } from '../fixtures';

Given(
  'a commission report all statement file is prepared from the inbox',
  async ({ commissionReportValidationPage }) => {
    const prepared = await prepareCommissionReportFileFromInbox({
      reportSheetFilePrefix: COMMISSION_REPORT.reportSheetFilePrefixAll,
    });
    setCommissionReportPreparedFile(prepared);
    commissionReportValidationPage.prepareFromContext();
  },
);

When('I open the commission report all upload page', async ({ commissionReportValidationPage }) => {
  await commissionReportValidationPage.openUploadPage();
});

When(
  'I upload the prepared commission report all statement file',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.uploadPreparedCommissionReportFile();
  },
);

When(
  'I pick the statement type from the prepared commission report all file',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.selectPreparedStatementType();
  },
);

When(
  'I submit the upload for processing in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.clickUploadStatement();
  },
);

Then(
  'the uploaded file appears in the recently uploaded grid in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.expectUploadedFileInGrid();
  },
);

Then(
  'extract processing completes and the file ID is captured in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    const creds = smokeCredentials();
    if (!creds) throw new Error('Missing E2E credentials');
    await commissionReportValidationPage.captureUploadAfterExtractPoll(creds.email);
  },
);

Then(
  'the upload row shows status {string} and stage {string} in commission report all validation',
  async ({ commissionReportValidationPage }, status: string, stage: string) => {
    await commissionReportValidationPage.expectUploadStatusAndStage(status, stage);
  },
);

When(
  'I open the review page for the uploaded file in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.openReviewForUploadedFile();
  },
);

Then(
  'the review page URL contains {string} in commission report all validation',
  async ({ commissionReportValidationPage }, fragment: string) => {
    if (fragment === '/review/') {
      await commissionReportValidationPage.expectReviewUrlContainsFileId();
      return;
    }
    throw new Error(`Unsupported review URL fragment assertion: "${fragment}"`);
  },
);

Then(
  'the review page heading is {string} in commission report all validation',
  async ({ commissionReportValidationPage }, title: string) => {
    await commissionReportValidationPage.expectReviewPageHeading(title);
  },
);

When(
  'I capture review lines and policy Agency Sales Leader Agent commission values in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.captureReviewAndPolicyAllRolesCommissionData();
  },
);

Then(
  'the commission report all CSV skeleton is written with expected amounts in commission report all validation',
  async () => {
    const prepared = getCommissionReportPreparedFile();
    expect(fs.existsSync(prepared.reportSheetPath)).toBeTruthy();
    const content = fs.readFileSync(prepared.reportSheetPath, 'utf8');
    expect(content).toContain('LineItem');
    expect(content).toContain('TotalMembers');
    expect(content).toContain('value x TotalMembers');
    expect(content).toContain('Role');
    expect(content).toMatch(/Agency|Sales Leader|Agent/);
  },
);

When(
  'I complete the review and confirm in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.ensureOnReviewThenComplete();
  },
);

Then(
  'a success toast notification appears in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.expectSuccessToast();
  },
);

When(
  'I wait for 3 seconds and refresh the data grid in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.waitThenRefreshGrid(3_000);
  },
);

Then(
  'the upload stage changes to {string} in commission report all validation',
  async ({ commissionReportValidationPage }, stage: string) => {
    if (/completed/i.test(stage)) {
      await commissionReportValidationPage.expectUploadStageCompleted();
      return;
    }
    throw new Error(`Unsupported upload stage assertion: "${stage}"`);
  },
);

When(
  'I open view commission report from the upload kebab in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.returnToUploadAndOpenCommissionReport();
  },
);

When(
  'I fill Agency Sales Leader Agent Split Amounts from the commission report into the CSV in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.fillAllRolesCommissionFromReportIntoCsv();
  },
);

Then(
  'calculated value times members equals commission from report for every role line in commission report all validation',
  async ({ commissionReportValidationPage }) => {
    await commissionReportValidationPage.writeAndAssertCommissionReportAllCsv();
  },
);

Then('the commission report all CSV file is finalized for this statement run', async () => {
  const prepared = getCommissionReportPreparedFile();
  expect(fs.existsSync(prepared.reportSheetPath)).toBeTruthy();
  expect(prepared.reportSheetPath).toMatch(/commission-report-all-\d+\.csv$/);
  const content = fs.readFileSync(prepared.reportSheetPath, 'utf8');
  expect(content).toMatch(/TRUE|FALSE/);
  expect(content).toContain('Role');
  expect(content).toContain('Summary');
});
