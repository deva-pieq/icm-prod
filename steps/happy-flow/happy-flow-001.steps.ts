import { buildHappyFlowProductData } from '../../test-data/happy-flow/happyFlow001';
import {
  getHappyFlowProductData,
  getHappyFlowUploadState,
  setHappyFlowBatchId,
  setHappyFlowCsvData,
  setHappyFlowProductData,
  setHappyFlowUploadState,
} from '../../utils/happy-flow/happyFlowContext';
import { prepareHappyFlowCsvFile } from '../../utils/happy-flow/happyFlowCsvPrep';
import { toHappyFlowPreparedFile } from '../../utils/happy-flow/happyFlowUpload';
import { smokeCredentials } from '../../utils/loadEnv';
import { Given, When, Then } from '../fixtures';

Given('happy flow 001 product data is prepared', async () => {
  setHappyFlowProductData(buildHappyFlowProductData());
});

When('I open the products page', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.openProductsPage();
});

When('I click add product', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.clickAddProduct();
});

When('I fill the product mandate fields from prepared data', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.fillMandateFields(getHappyFlowProductData());
});

When('I save the new product', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.saveProduct();
});

Then('the product document is loaded', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.expectDocumentLoaded();
});

Then('I am on the products dashboard page', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.expectOnProductsDashboard();
});

When('I open the product from the grid by prepared product name', async ({ happyFlowProductPage }) => {
  const { productName } = getHappyFlowProductData();
  await happyFlowProductPage.openProductFromGridByName(productName);
});

Then('the product edit page title contains the prepared product name', async ({ happyFlowProductPage }) => {
  const { productName } = getHappyFlowProductData();
  await happyFlowProductPage.expectEditPageTitleContains(productName);
});

Then('the product status chip shows {string}', async ({ happyFlowProductPage }, status: string) => {
  await happyFlowProductPage.expectStatusChip(status);
});

When('I open commission structure for the product', async ({ happyFlowProductPage }) => {
  await happyFlowProductPage.openCommissionStructure();
});

When('I select commission type {string}', async ({ happyFlowCommissionRulePage }, type: string) => {
  await happyFlowCommissionRulePage.selectCommissionType(type);
});

When('I save the add commission rule dialog', async ({ happyFlowCommissionRulePage }) => {
  await happyFlowCommissionRulePage.saveAddRuleDialog();
});

Then('I am on the edit commission rule page', async ({ happyFlowCommissionRulePage }) => {
  await happyFlowCommissionRulePage.expectOnEditCommissionRulePage();
});

When(
  'I set the commission rule policy start date to the prepared effective date',
  async ({ happyFlowCommissionRulePage }) => {
    const { effectiveDate } = getHappyFlowProductData();
    await happyFlowCommissionRulePage.setPolicyStartDate(effectiveDate);
  },
);

When('I set policy period slabs to {string}', async ({ happyFlowCommissionRulePage }, value: string) => {
  await happyFlowCommissionRulePage.setPolicyPeriodSlabs(value);
});

When('I save the commission rule policy period changes', async ({ happyFlowCommissionRulePage }) => {
  await happyFlowCommissionRulePage.savePolicyPeriodChanges();
});

When('I select commission template {string}', async ({ happyFlowCommissionRulePage }, template: string) => {
  await happyFlowCommissionRulePage.selectTemplateName(template);
});

When('I publish the commission rule', async ({ happyFlowCommissionRulePage }) => {
  await happyFlowCommissionRulePage.publishRule();
});

Then(
  'I see a sliding notification containing {string}',
  async ({ happyFlowCommissionRulePage }, text: string) => {
    await happyFlowCommissionRulePage.expectSlidingNotificationContaining(text);
  },
);

Given('the happy flow CSV file is prepared', async () => {
  const { carrierProductName } = getHappyFlowProductData();
  const prepared = prepareHappyFlowCsvFile(carrierProductName);
  setHappyFlowCsvData(prepared);
});

When('I upload the prepared happy flow CSV file', async ({ statementUploadPage }) => {
  await statementUploadPage.uploadFromPrepared(toHappyFlowPreparedFile());
});

Then('the happy flow upload is located and file ID is captured', async ({ statementUploadPage }) => {
  const creds = smokeCredentials();
  if (!creds) throw new Error('Missing E2E credentials');
  const stored = await statementUploadPage.captureUploadByUploader(creds.email);
  const displayName = await statementUploadPage.readUploaderDisplayName();
  const loginTag =
    displayName || creds.email.split('@')[0]?.trim() || creds.email;
  setHappyFlowUploadState({
    fileId: stored.fileId,
    fileName: stored.fileName,
    uploadedByTag: loginTag,
  });
});

When('I wait {int} seconds', async ({ page }, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
});

Then(
  'the stored happy flow upload shows status {string} and stage {string}',
  async ({ statementUploadPage }, status: string, stage: string) => {
    const fileId = await statementUploadPage.expectStoredUploadStatusAndStage(status, stage);
    const current = getHappyFlowUploadState();
    setHappyFlowUploadState({ ...current, fileId });
  },
);

Then('the review URL contains the file ID', async ({ happyFlowStatementPage }) => {
  await happyFlowStatementPage.expectReviewUrlContainsFileId();
});

Then('the review page title is {string}', async ({ happyFlowStatementPage }, title: string) => {
  await happyFlowStatementPage.expectReviewPageTitle(title);
});

Then(
  'the review page subtitle shows the file name and {string}',
  async ({ happyFlowStatementPage }, statementType: string) => {
    await happyFlowStatementPage.expectReviewPageSubtitleWithStatementType(statementType);
  },
);

Then('every transaction type is {string}', async ({ happyFlowStatementPage }, type: string) => {
  await happyFlowStatementPage.assertEveryTransactionType(type);
});

When('I hover over the warning icon on the review page', async ({ happyFlowStatementPage }) => {
  await happyFlowStatementPage.hoverWarningOnReview();
});

Then(
  'the tooltip contains {string} and {string}',
  async ({ happyFlowStatementPage }, text1: string, text2: string) => {
    await happyFlowStatementPage.expectLastTooltipContains(text1, text2);
  },
);

When('I click complete review and confirm', async ({ happyFlowStatementPage }) => {
  await happyFlowStatementPage.completeReviewAndConfirm();
});

Then('the stored happy flow upload shows stage {string}', async ({ statementUploadPage }, stage: string) => {
  const { fileName } = getHappyFlowUploadState();
  const fileId = await statementUploadPage.expectStoredUploadStage(stage);
  const current = getHappyFlowUploadState();
  setHappyFlowUploadState({ ...current, fileId });
});

When('I click the stored happy flow upload record', async ({ happyFlowStatementPage }) => {
  await happyFlowStatementPage.clickStoredHappyFlowUploadRecord();
});

Then('all records show payment status {string}', async ({ happyFlowStatementPage }, status: string) => {
  await happyFlowStatementPage.assertAllRecordsPaymentStatus(status);
});

When('I search payables by the uploaded filename', async ({ transferPaymentPage }) => {
  await transferPaymentPage.searchByFileName();
});

When('I click all records containing the stored file id', async ({ transferPaymentPage }) => {
  await transferPaymentPage.clickAllRecordsContainingStoredFileId();
});

When('I click all records containing the uploaded filename', async ({ transferPaymentPage }) => {
  await transferPaymentPage.clickAllRecordsContainingUploadedFileName();
});

When('I remove agents below $25.00 if required', async ({ transferPaymentPage }) => {
  await transferPaymentPage.removeAgentsBelowThresholdIfRequired();
});

When('I open the record initiated today by {string}', async ({ transferPaymentPage }, name: string) => {
  await transferPaymentPage.openRecordInitiatedTodayBy(name);
});

When('I capture the payment batch id', async ({ transferPaymentPage }) => {
  const id = await transferPaymentPage.captureBatchId();
  setHappyFlowBatchId(id);
});

When('I capture the batch id', async ({ transferPaymentPage }) => {
  const id = await transferPaymentPage.captureBatchId();
  setHappyFlowBatchId(id);
});

Then('the page title contains the batch id', async ({ transferPaymentPage }) => {
  await transferPaymentPage.expectPageTitleContainsBatchId();
});

When('I open a record for the captured batch id', async ({ transferPaymentPage }) => {
  await transferPaymentPage.openRecordForCapturedBatchId();
});
