import { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { getCommissionAmt, getTransferContext } from '../../utils/transfer-agent/transferSheetContext';
import { Given, When, Then } from '../fixtures';

Given('I open the transfer sheet page', async ({ transferSheetPage }) => {
  await transferSheetPage.openTransferSheetPage();
});

When(
  'I add a transfer sheet record for agent {string} product {string} with status {string} and date 3 years back',
  async ({ transferSheetPage }, agentName: string, product: string, status: string) => {
    await transferSheetPage.addTransferSheetRecord(agentName, product, status, '3 years back');
  },
);

When(
  'I add a transfer sheet record for agent {string} product {string} with status {string} and date {string}',
  async ({ transferSheetPage }, agentName: string, product: string, status: string, dateValue: string) => {
    await transferSheetPage.addTransferSheetRecord(agentName, product, status, dateValue);
  },
);

When(
  'I ensure a transfer sheet record exists for agent {string} product {string} with status {string} and date 3 years back',
  async ({ transferSheetPage }, agentName: string, product: string, status: string) => {
    await transferSheetPage.ensureTransferRecordExists(agentName, product, status);
  },
);

Then('the transfer sheet grid contains the new record', async ({ transferSheetPage }) => {
  const row = transferSheetPage.storedRow;
  if (!row) throw new Error('No transfer sheet record stored');
  await transferSheetPage.expectGridContainsRecord(row.agentName, row.product, row.status);
});

Given('the transfer agent excel file is prepared for upload', async ({ transferStatementPage }) => {
  await transferStatementPage.prepareTransferUploadFile();
});

When('I upload the prepared transfer agent file', async ({ transferStatementPage }) => {
  await transferStatementPage.uploadPreparedTransferFile();
});

Then(
  'the recently uploaded statements grid shows my upload and I capture the file id',
  async ({ transferStatementPage }) => {
    await transferStatementPage.captureUploadAndFileId();
  },
);

Then(
  'the warning tooltip on the review page contains {string}',
  async ({ transferStatementPage }, text: string) => {
    await transferStatementPage.expectWarningTooltipOnReviewContains(text);
  },
);

When('I confirm the statement submission', async ({ transferStatementPage }) => {
  await transferStatementPage.confirmStatementSubmission();
});

When('I navigate to needs attention statements', async ({ transferStatementPage }) => {
  await transferStatementPage.navigateToUploadedStatements();
});

Then(
  'the stored upload row shows status {string} and stage {string}',
  async ({ transferStatementPage }, status: string, stage: string) => {
    await transferStatementPage.expectStoredUploadRowStatusAndStage(status, stage);
  },
);

When('I open the stored upload from needs attention', async ({ transferStatementPage }) => {
  await transferStatementPage.openStoredUploadFromNeedsAttention();
});

// Then('the commission details page shows:', async ({ transferStatementPage }, table: DataTable) => {
//   const rows = table.rows();
//   const expected: { heading?: string; splitCardContains: string[] } = { splitCardContains: [] };
//   for (const [key, value] of rows) {
//     if (key === 'heading') expected.heading = value;
//     if (key === 'split card contains') expected.splitCardContains.push(value);
//   }
//   await transferStatementPage.expectCommissionDetailsPage(expected);
// });

Then(
  'the page subtitle contains the file name, carrier {string}, and upload date',
  async ({ transferStatementPage }, carrier: string) => {
    await transferStatementPage.expectPageSubtitleContainsFileCarrierDate(carrier);
  },
);

Then('the warning tooltip contains {string}', async ({ transferStatementPage }, text: string) => {
  await transferStatementPage.expectReconcileWarningTooltipContains(text);
});

Then(
  'the grid displays records with {string} and status {string}',
  async ({ transferStatementPage }, recordType: string, status: string) => {
    if (/^NB$/i.test(recordType)) await transferStatementPage.expectNBInRecords();
    if (/unmatched/i.test(status)) await transferStatementPage.expectStatusUnmatched();
  },
);

When('I click a record with status {string}', async ({ transferStatementPage }, status: string) => {
  if (/policy transfer/i.test(status)) {
    await transferStatementPage.clickRecordWithPolicyTransfer();
  } else {
    await transferStatementPage.clickNextRecordWithStatus(status);
  }
});

When('I select transferring agent {string}', async ({ transferStatementPage }, name: string) => {
  await transferStatementPage.selectTransferringAgent(name);
});

When('I enter rationale {string}', async ({ transferStatementPage }, text: string) => {
  await transferStatementPage.enterRationale(text);
});

When('I click reconcile', async ({ transferStatementPage }) => {
  await transferStatementPage.clickReconcile();
});

When('I refresh the grid', async ({ transferStatementPage }) => {
  await transferStatementPage.refreshGrid();
});

When('I click the next record with status {string}', async ({ transferStatementPage }, status: string) => {
  await transferStatementPage.clickNextRecordWithStatus(status);
});

When(
  'I reconcile the next record with status {string} as {string}',
  async ({ transferStatementPage }, status: string, agentName: string) => {
    await transferStatementPage.reconcileNextRecord(status, agentName);
  },
);

Then(
  'all grid records show {string} as transaction type and no warning icons',
  async ({ transferStatementPage }, transactionType: string) => {
    await transferStatementPage.expectAllRecordsReconciled(transactionType);
  },
);

Then(
  'I store the agent commission amount as {string}',
  async ({ transferStatementPage }, alias: string) => {
    await transferStatementPage.storeAgentCommissionAmount(alias);
  },
);

When('I navigate to payable line items', async ({ transferPaymentPage }) => {
  await transferPaymentPage.openPayables();
});

When('I search payables by the stored file id', async ({ transferPaymentPage }) => {
  await transferPaymentPage.searchByFileId();
});

When('I select all visible records', async ({ transferPaymentPage }) => {
  await transferPaymentPage.selectAllRecords();
});

Then('the right sidebar shows:', async ({ transferPaymentPage }, table: DataTable) => {
  const rows = Object.fromEntries(table.rows());
  const sidebar = transferPaymentPage.loc.rightSidebar();
  await expect(sidebar).toBeVisible({ timeout: 100_000 });
  if (rows.title) {
    await expect(transferPaymentPage.loc.headingProcessSummary()).toBeVisible();
  }
  if (rows.earning) {
    const earning = rows.earning
      .replace('<commission-amt>', getCommissionAmt())
      .replace('<x1>', getCommissionAmt());
    await transferPaymentPage.assertProcessSummary(earning);
  }
  if (/enabled/i.test(rows['create payment'] ?? '')) {
    await transferPaymentPage.assertCreatePaymentEnabled();
  }
});

When('I click create payment', async ({ transferPaymentPage }) => {
  await transferPaymentPage.clickCreatePayment();
});

When('I confirm the payment batch', async ({ transferPaymentPage }) => {
  await transferPaymentPage.confirmPaymentBatch();
});

Then(
  'the payable records for the stored file are consumed',
  async ({ transferPaymentPage }) => {
    await transferPaymentPage.expectPayablesConsumed();
  },
);

When('I navigate to payment approval', async ({ transferPaymentPage }) => {
  await transferPaymentPage.openApproval();
});

When('I open the first record containing {string}', async ({ transferPaymentPage }, text: string) => {
  await transferPaymentPage.openFirstRecordContaining(text);
});

Then('I capture the batch id starting with {string}', async ({ transferPaymentPage }) => {
  await transferPaymentPage.captureBatchId();
});

When('I click authorize payment', async ({ transferPaymentPage }) => {
  await transferPaymentPage.clickAuthorizePayment();
});

When('I confirm the authorization', async ({ transferPaymentPage }) => {
  await transferPaymentPage.confirmAuthorization();
});

When('I navigate to disbursement history', async ({ transferPaymentPage }) => {
  await transferPaymentPage.openHistory();
});

Then('the page title is {string}', async ({ transferPaymentPage }, title: string) => {
  if (/disbursement history/i.test(title)) {
    await transferPaymentPage.assertDisbursementHistoryTitle();
  }
});

When('I open a record for agent {string}', async ({ transferPaymentPage }, agentName: string) => {
  // The disbursement-history grid lists many batches for the same agent (Deva X, same date,
  // same amount from repeated/concurrent runs). Clicking the first matching row can open a
  // stale batch without the Finalized Settlement chip. Open the exact batch authorized in
  // this scenario via its captured PAY- id instead.
  await transferPaymentPage.openRecordByBatchId();
});

Then('the finalized settlement chip is visible', async ({ transferPaymentPage }) => {
  await transferPaymentPage.assertFinalizedSettlementChipVisible();
});
