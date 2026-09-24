import { expect } from '@playwright/test';
import type { PaymentModuleCycle } from '../../test-data/payment-module/paymentModule';
import {
  arePaymentModuleStatementsReady,
  getPaymentModuleContext,
  getBatchId,
  getCapturedAmount,
  getCapturedNetDisbursement,
  markPaymentModuleStatementsReady,
  setBatchId,
  setCapturedAmount,
  setCapturedNetDisbursement,
} from '../../utils/payment-module/paymentModuleContext';
import { parseAmountNumber } from '../../utils/payment-module/parseAmount';
import { Given, When, Then } from '../fixtures';

Given(
  'the payment module {string} cycle files are prepared',
  async ({ paymentModulePage }, cycleRaw: string) => {
    const cycle = cycleRaw.toUpperCase() as PaymentModuleCycle;
    if (cycle !== 'CHK' && cycle !== 'ACH') {
      throw new Error(`Unsupported payment module cycle "${cycleRaw}". Use CHK or ACH.`);
    }
    // Shared across scenarios in this feature — skip re-prep when already ready.
    if (arePaymentModuleStatementsReady(cycle)) {
      console.log(`[payment-module] Reusing prepared ${cycle} statements (CustomerUID=${getPaymentModuleContext().customerUid})`);
      return;
    }
    const prepared = await paymentModulePage.prepareCycle(cycle);
    expect(prepared.customerUid).toMatch(
      cycle === 'CHK' ? /^AETNA-PAY-TEST-CHK-\d+$/ : /^AETNA-PAY-TEST-ACH-\d+$/,
    );
    console.log(
      `[payment-module] Prepared ${cycle} — CustomerUID=${prepared.customerUid} NB=${prepared.nb.fileName} RN=${prepared.rn.fileName}`,
    );
  },
);

When(
  'I upload and complete review for the payment module NB statement',
  async ({ paymentModulePage }) => {
    if (arePaymentModuleStatementsReady(getPaymentModuleContext().cycle)) return;
    await paymentModulePage.uploadAndAutoReconcile('NB');
  },
);

When(
  'I upload and complete review for the payment module RN statement',
  async ({ paymentModulePage }) => {
    if (arePaymentModuleStatementsReady(getPaymentModuleContext().cycle)) return;
    await paymentModulePage.uploadAndAutoReconcile('RN');
    markPaymentModuleStatementsReady();
  },
);

When('I navigate to Payables on payment module', async ({ payablesPage }) => {
  await payablesPage.open();
});

Then('the Pending Payments heading is visible on payment module', async ({ payablesPage }) => {
  await payablesPage.expectPendingPaymentsHeading();
});

Then('the payables grid shows expected columns on payment module', async ({ payablesPage }) => {
  await payablesPage.expectPayablesGridColumns();
});

When(
  'I search payables by the stored Customer UID on payment module',
  async ({ payablesPage }) => {
    const { customerUid } = getPaymentModuleContext();
    await payablesPage.searchByValue(customerUid);
  },
);

When(
  'I check the first payable row checkbox on payment module',
  async ({ payablesPage }) => {
    await payablesPage.checkFirstRowCheckbox();
  },
);

When(
  'I check a payable row with amount less than {int} on payment module',
  async ({ payablesPage }, maxExclusive: number) => {
    await payablesPage.checkRowWithAmountLessThan(maxExclusive);
  },
);

When(
  'I uncheck all payable row checkboxes on payment module',
  async ({ payablesPage }) => {
    await payablesPage.uncheckAllRowCheckboxes();
  },
);

When(
  'I check payable row checkboxes at indexes {string} on payment module',
  async ({ payablesPage }, indexesRaw: string) => {
    const indexes = indexesRaw
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));
    expect(indexes.length, 'Provide at least one checkbox index').toBeGreaterThan(0);
    await payablesPage.checkRowCheckboxesByIndexes(indexes);
  },
);

When('I select all payable records on payment module', async ({ payablesPage }) => {
  await payablesPage.selectAllRecords();
});

Then('the process summary container is visible on payment module', async ({ payablesPage }) => {
  await payablesPage.expectProcessSummaryVisible();
});

Then(
  'the process summary shows Agents and Net Settlement on payment module',
  async ({ payablesPage }) => {
    await payablesPage.expectProcessSummaryMetrics();
  },
);

Then(
  'the process summary container is not visible on payment module',
  async ({ payablesPage }) => {
    await payablesPage.expectProcessSummaryHidden();
  },
);

Then(
  'the Create Payment button is visible and enabled on payment module',
  async ({ payablesPage }) => {
    await payablesPage.expectCreatePaymentVisibleAndEnabled();
  },
);

Then(
  'the Create Payment button is visible and disabled on payment module',
  async ({ payablesPage }) => {
    await payablesPage.expectCreatePaymentVisibleAndDisabled();
  },
);

Then(
  'the process summary shows remove agents below threshold message on payment module',
  async ({ payablesPage }) => {
    await payablesPage.expectRemoveAgentsBelowThresholdMessage();
  },
);

When('I ensure Create Payment can proceed on payment module', async ({ payablesPage }) => {
  await payablesPage.ensureCreatePaymentEnabled();
});

When('I capture the Net Settlement amount on payment module', async ({ payablesPage }) => {
  const amount = await payablesPage.captureNetSettlementAmount();
  setCapturedAmount(amount);
  console.log(`[payment-module] Captured Net Settlement=${amount}`);
});

When('I click Create Payment on payment module', async ({ payablesPage }) => {
  await payablesPage.clickCreatePayment();
});

When('I confirm the payment batch on payment module', async ({ payablesPage }) => {
  await payablesPage.confirmPaymentBatch();
});

When('I navigate to Approval on payment module', async ({ approvalPage }) => {
  await approvalPage.open();
});

Then('the Payment Batches heading is visible on payment module', async ({ approvalPage }) => {
  await approvalPage.expectPaymentBatchesHeading();
});

When(
  'I open the payment batch matching the captured Net Settlement on payment module',
  async ({ approvalPage }) => {
    // CHK=600002/Check vs ACH=600001/ACH — amount alone can open the other cycle's batch.
    const { agentId, paymentMethod } = getPaymentModuleContext();
    await approvalPage.openRecordContaining(getCapturedAmount(), { agentId, paymentMethod });
  },
);

When('I capture the Net Disbursement amount on payment module', async ({ approvalPage }) => {
  const amount = await approvalPage.captureNetDisbursementAmount();
  setCapturedNetDisbursement(amount);
  console.log(`[payment-module] Captured Net Disbursement=${amount}`);
});

Then(
  'the Net Disbursement equals the captured Net Settlement on payment module',
  async () => {
    expect(parseAmountNumber(getCapturedNetDisbursement())).toBeCloseTo(
      parseAmountNumber(getCapturedAmount()),
      2,
    );
  },
);

When(
  'I select the {string} payment method tab on payment module',
  async ({ approvalPage }, methodRaw: string) => {
    const method = methodRaw.trim() as 'Check' | 'ACH';
    if (method !== 'Check' && method !== 'ACH') {
      throw new Error(`Unsupported payment method tab "${methodRaw}". Use Check or ACH.`);
    }
    await approvalPage.selectPaymentMethodTab(method);
  },
);

Then(
  'the selected payment method tab has records on payment module',
  async ({ approvalPage }) => {
    await approvalPage.expectPaymentMethodTabHasRecords();
  },
);

When(
  'I capture the batch id from the batch title on payment module',
  async ({ approvalPage }) => {
    // CHK must capture from Check tab (agent 600002); ACH from ACH tab (agent 600001).
    const { paymentMethod, agentId } = getPaymentModuleContext();
    const batchId = await approvalPage.captureBatchIdFromTitle(paymentMethod);
    setBatchId(batchId);
    console.log(
      `[payment-module] Captured batchId=${batchId} method=${paymentMethod} agent=${agentId}`,
    );
  },
);

When('I click Authorize Payment on payment module', async ({ approvalPage }) => {
  await approvalPage.clickAuthorizePayment();
});

When('I confirm the authorization on payment module', async ({ approvalPage }) => {
  await approvalPage.confirmAuthorization();
});

When('I navigate to Disbursement History on payment module', async ({ disbursementPage }) => {
  await disbursementPage.open();
});

Then(
  'the Disbursement History heading is visible on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectHeadingVisible();
  },
);

Then(
  'the disbursement history grid shows expected columns on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectGridColumns();
  },
);

When(
  'I search disbursement history by the captured payment id on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.searchByPaymentId(getBatchId());
  },
);

Then(
  'the disbursement history row for the captured payment id is visible on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectRowForPaymentId(getBatchId());
  },
);

Then(
  'the disbursement history row Net Disbursement matches the captured amount on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectRowNetDisbursementMatches(getBatchId(), getCapturedAmount());
  },
);

When(
  'I click download for the captured batch id on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.clickDownloadForBatchId(getBatchId());
  },
);

When(
  'I download the Check payout and verify file is not available on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.clickDownloadAndExpectPayoutUnavailable(getBatchId());
  },
);

When(
  'I download the ACH payout file for the captured payment id on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.downloadAchPayoutFile(getBatchId());
  },
);

Then(
  'the ACH payout file is downloaded on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectAchPayoutFileDownloaded();
  },
);

Then(
  'the disbursement toast shows payout file not available on payment module',
  async ({ disbursementPage }) => {
    await disbursementPage.expectPayoutFileNotAvailableToast();
  },
);
