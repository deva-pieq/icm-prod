import { prepareCommissionTruthFileFromInbox } from '../../utils/commission-split/statementInboxPrep';
import { setCommissionTruthPreparedFile } from '../../utils/commission-split/commissionTruthContext';
import { smokeCredentials } from '../../utils/loadEnv';
import { Given, When, Then } from '../fixtures';

Given(
  'a completed commission truth upload is loaded for line item debugging',
  async ({ commissionTruthValidationPage }) => {
    const fileId = process.env.COMMISSION_TRUTH_REUSE_FILE_ID?.trim();
    if (!fileId) {
      throw new Error(
        'Set COMMISSION_TRUTH_REUSE_FILE_ID in .env to a Completed Oscar U65 CS upload (e.g. BT-JB9HYQ)',
      );
    }
    await commissionTruthValidationPage.loadExistingCompletedUploadForDebug(fileId);
  },
);

Given(
  'a commission truth statement file is prepared from the inbox drop folder',
  async ({ commissionTruthValidationPage }) => {
    const prepared = prepareCommissionTruthFileFromInbox();
    setCommissionTruthPreparedFile(prepared);
    commissionTruthValidationPage.prepareFromContext();
  },
);

When('I open the commission split upload page', async ({ commissionTruthValidationPage }) => {
  await commissionTruthValidationPage.openUploadPage();
});

When('I submit the upload for processing', async ({ commissionTruthValidationPage }) => {
  await commissionTruthValidationPage.clickUploadStatement();
});

When('I upload the prepared commission truth CSV file', async ({ commissionTruthValidationPage }) => {
  await commissionTruthValidationPage.uploadPreparedCommissionTruthCsv();
});

When(
  'I pick the statement type from the prepared commission truth file',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.selectPreparedStatementType();
  },
);

Then(
  'the uploaded file appears in the recently uploaded grid in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.expectUploadedFileInGrid();
  },
);

Then(
  'extract processing completes and the file ID is captured in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    const creds = smokeCredentials();
    if (!creds) throw new Error('Missing E2E credentials');
    await commissionTruthValidationPage.captureUploadAfterExtractPoll(creds.email);
  },
);

Then(
  'the upload row shows status {string} and stage {string} in commission truth validation',
  async ({ commissionTruthValidationPage }, status: string, stage: string) => {
    await commissionTruthValidationPage.expectUploadStatusAndStage(status, stage);
  },
);

When(
  'I open the review page for the uploaded file in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.openReviewForUploadedFile();
  },
);

Then(
  'the review page URL contains {string} in commission truth validation',
  async ({ commissionTruthValidationPage }, fragment: string) => {
    if (fragment === '/review/') {
      await commissionTruthValidationPage.expectReviewUrlContainsFileId();
      return;
    }
    throw new Error(`Unsupported review URL fragment assertion: "${fragment}"`);
  },
);

Then(
  'the review page heading is {string} in commission truth validation',
  async ({ commissionTruthValidationPage }, title: string) => {
    await commissionTruthValidationPage.expectReviewPageHeading(title);
  },
);

When(
  'I complete the review and confirm in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.completeReviewAndConfirm();
  },
);

Then(
  'a success toast notification appears in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.expectSuccessToast();
  },
);

Then(
  'the upload stage changes to {string} in commission truth validation',
  async ({ commissionTruthValidationPage }, stage: string) => {
    if (/completed/i.test(stage)) {
      await commissionTruthValidationPage.expectUploadStageCompleted();
      return;
    }
    throw new Error(`Unsupported upload stage assertion: "${stage}"`);
  },
);

When(
  'I navigate to commission details for the completed upload in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.openCommissionDetailsForCompletedUpload();
  },
);

Then(
  'the commission details page heading is {string} in commission truth validation',
  async ({ commissionTruthValidationPage }, title: string) => {
    await commissionTruthValidationPage.expectCommissionDetailsHeading(title);
  },
);

When(
  'I validate each commission line item against product structure in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.validateEachLineItemAgainstProductStructure();
  },
);

Then(
  'calculated commission equals captured agent commission for every validated line item in commission truth validation',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.expectAllValidatedLineItemsMatch();
  },
);

Then(
  'the commission truth sheet file is written for this statement run',
  async ({ commissionTruthValidationPage }) => {
    await commissionTruthValidationPage.writeTruthSheetForRun();
  },
);

When('I wait for 3 seconds and refresh the data grid', async ({ baseStatementUploadPage }) => {
  await baseStatementUploadPage.waitThenRefreshGrid(3_000);
});
