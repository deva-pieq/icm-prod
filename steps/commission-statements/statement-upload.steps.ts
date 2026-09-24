import { smokeCredentials } from '../../utils/loadEnv';
import { getLastStatementUpload } from '../../utils/statementUploadContext';
import { Given, When, Then } from '../fixtures';

Given('the renewal statement upload file is prepared for upload', async ({ statementUploadPage }) => {
  await statementUploadPage.prepareRenewalUploadFile();
});

When('I open the commission statement upload page', async ({ statementUploadPage }) => {
  await statementUploadPage.openUploadPage();
});

Then('the upload process button is disabled', async ({ statementUploadPage }) => {
  await statementUploadPage.expectUploadProcessButtonDisabled();
});

When('I upload the prepared renewal statement file', async ({ statementUploadPage }) => {
  await statementUploadPage.uploadPreparedFile();
});

When('I remove the uploaded statement file', async ({ statementUploadPage }) => {
  await statementUploadPage.removeUploadedFile();
});

When('I select statement type {string}', async ({ statementUploadPage }, statementType: string) => {
  await statementUploadPage.selectStatementType(statementType);
});

Then('the upload process button is enabled', async ({ statementUploadPage }) => {
  await statementUploadPage.expectUploadProcessButtonEnabled();
});

Then('the carrier and product type auto-detect fields are disabled', async ({ statementUploadPage }) => {
  await statementUploadPage.expectAutoDetectFieldsDisabled();
});

When('I submit the statement upload', async ({ statementUploadPage }) => {
  await statementUploadPage.clickUploadStatement();
});

Then('the recently uploaded statements grid shows my upload in progress', async ({ statementUploadPage }) => {
  const creds = smokeCredentials();
  if (!creds) throw new Error('Missing E2E credentials');
  await statementUploadPage.expectRecentlyUploadedInProgress(creds.email);
});

When('I refresh the recently uploaded statements grid', async ({ statementUploadPage }) => {
  await statementUploadPage.refreshRecentlyUploadedGrid();
});

When('I wait for 2 seconds and refresh the data grid', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.waitThenRefreshGrid(2_000);
});

Then('the stored upload row shows status Waiting and stage Review', async ({ statementUploadPage }) => {
  await statementUploadPage.expectStoredRowReviewState();
});

When('I open the review page for the stored upload', async ({ statementUploadPage }) => {
  await statementUploadPage.openReviewForStoredUpload();
});

Then('I see the review statement file page for the stored upload', async ({ statementUploadPage }) => {
  // Page: Review Statement File
  // URL: https://preprod.app.pieq.ai/commission-processing/review [contains]
  await statementUploadPage.expectReviewPageForStoredUpload();
});

When('I submit the statement for processing', async ({ statementUploadPage }) => {
  // Page: Review Statement File
  await statementUploadPage.submitStatementForReview();
});

Then('I see the statement upload success notifications', async ({ statementUploadPage }) => {
  await statementUploadPage.expectSuccessNotifications();
});

When('I open payable line items from the sidebar', async ({ payablesPage }) => {
  await payablesPage.open();
});

Then('the payable line items source trace contains the stored file id', async ({ payablesPage }) => {
  const { fileId } = getLastStatementUpload();
  await payablesPage.assertions.expectSourceTraceContainsFileId(fileId);
});
