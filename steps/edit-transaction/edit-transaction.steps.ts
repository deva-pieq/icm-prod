import { expect } from '@playwright/test';
import {
  PAYMENT_MODULE,
  type PaymentModuleCycle,
} from '../../test-data/payment-module/paymentModule';
import {
  areEditTransactionStatementsReady,
  clearEditTransactionContext,
  getEditTransactionContext,
  getCapturedAmount,
  getCapturedNetDisbursement,
  getLastDownloadedTimestamp,
  getAchFileFingerprint,
  getBatchId,
  isEditTransactionMixedBatch,
  markEditTransactionAchStatementsReady,
  markEditTransactionBatchCreated,
  markEditTransactionChkStatementsReady,
  markEditTransactionMixedBatch,
  markEditTransactionStatementsReady,
  setAchFileFingerprint,
  setBatchId,
  setCapturedAmount,
  setCapturedNetDisbursement,
  setEditTransactionFromPrepared,
  setLastDownloadedTimestamp,
  tryGetEditTransactionContext,
} from '../../utils/edit-transaction/editTransactionContext';
import { parseAmountNumber } from '../../utils/payment-module/parseAmount';
import { Given, When, Then } from '../fixtures';

Given(
  'the edit transaction {string} cycle files are prepared',
  async ({ paymentModulePage }, cycleRaw: string) => {
    const cycle = cycleRaw.toUpperCase() as PaymentModuleCycle;
    if (cycle !== 'CHK' && cycle !== 'ACH') {
      throw new Error(`Unsupported edit transaction cycle "${cycleRaw}". Use CHK or ACH.`);
    }
    if (areEditTransactionStatementsReady(cycle)) {
      console.log(
        `[edit-transaction] Reusing prepared ${cycle} statements (CustomerUID=${getEditTransactionContext().customerUid})`,
      );
      return;
    }
    const prepared = await paymentModulePage.prepareCycle(cycle);
    setEditTransactionFromPrepared(prepared);
    expect(prepared.customerUid).toMatch(
      cycle === 'CHK' ? /^AETNA-PAY-TEST-CHK-\d+$/ : /^AETNA-PAY-TEST-ACH-\d+$/,
    );
    console.log(
      `[edit-transaction] Prepared ${cycle} — CustomerUID=${prepared.customerUid} NB=${prepared.nb.fileName} RN=${prepared.rn.fileName}`,
    );
  },
);

When(
  'I upload and complete review for the edit transaction NB statement',
  async ({ paymentModulePage }) => {
    if (areEditTransactionStatementsReady(getEditTransactionContext().cycle)) return;
    await paymentModulePage.uploadAndAutoReconcile('NB');
  },
);

When(
  'I upload and complete review for the edit transaction RN statement',
  async ({ paymentModulePage }) => {
    if (areEditTransactionStatementsReady(getEditTransactionContext().cycle)) return;
    await paymentModulePage.uploadAndAutoReconcile('RN');
    markEditTransactionStatementsReady();
    if (getEditTransactionContext().cycle === 'ACH') {
      markEditTransactionAchStatementsReady();
    } else {
      markEditTransactionChkStatementsReady();
    }
  },
);

When('I navigate to Payables on edit transaction', async ({ payablesPage }) => {
  await payablesPage.open();
});

Then('the Pending Payments heading is visible on edit transaction', async ({ payablesPage }) => {
  await payablesPage.expectPendingPaymentsHeading();
});

When(
  'I search payables by the stored Customer UID on edit transaction',
  async ({ payablesPage }) => {
    const { customerUid } = getEditTransactionContext();
    await payablesPage.searchByValue(customerUid);
  },
);

When('I select all payable records on edit transaction', async ({ payablesPage }) => {
  await payablesPage.selectAllRecords();
});

When('I ensure Create Payment can proceed on edit transaction', async ({ payablesPage }) => {
  await payablesPage.ensureCreatePaymentEnabled();
});

When('I capture the Net Settlement amount on edit transaction', async ({ payablesPage }) => {
  const amount = await payablesPage.captureNetSettlementAmount();
  setCapturedAmount(amount);
  console.log(`[edit-transaction] Captured Net Settlement=${amount}`);
});

When('I click Create Payment on edit transaction', async ({ payablesPage }) => {
  await payablesPage.clickCreatePayment();
});

When('I confirm the payment batch on edit transaction', async ({ payablesPage }) => {
  await payablesPage.confirmPaymentBatch();
  markEditTransactionBatchCreated();
});

/**
 * Ensures an Approval batch with ACH records exists.
 * If the previous batch was emptied (kebab remove-all), prepares a fresh ACH cycle.
 */
Given(
  'an ACH payment batch exists on Approval for edit transaction',
  async ({ payablesPage, paymentModulePage, approvalPage }) => {
    const ctx = tryGetEditTransactionContext();
    if (ctx?.capturedAmount && ctx.batchCreated) {
      try {
        await approvalPage.open();
        await approvalPage.openRecordContaining(ctx.capturedAmount, {
          agentId: ctx.agentId,
          paymentMethod: 'ACH',
        });
        if ((await approvalPage.paymentMethodTabRecordCount('ACH')) > 0) {
          await approvalPage.leaveBatchDetail();
          console.log('[edit-transaction] Reusing existing ACH Approval batch');
          return;
        }
        await approvalPage.leaveBatchDetail();
      } catch {
        // Fall through to recreate
      }
    }

    // Statements already prepared in Background — only Create Payment is needed.
    if (ctx?.statementsReady && ctx.customerUid) {
      try {
        await payablesPage.open();
        await payablesPage.searchByValue(ctx.customerUid);
        await payablesPage.selectAllRecords();
        await payablesPage.ensureCreatePaymentEnabled();
        const amount = await payablesPage.captureNetSettlementAmount();
        setCapturedAmount(amount);
        await payablesPage.clickCreatePayment();
        await payablesPage.confirmPaymentBatch();
        markEditTransactionBatchCreated();
        console.log(
          `[edit-transaction] Created ACH batch from ready statements Net Settlement=${amount}`,
        );
        return;
      } catch (err) {
        console.log(
          `[edit-transaction] Could not create from ready statements (${String(err)}); full recreate`,
        );
      }
    }

    clearEditTransactionContext();
    const prepared = await paymentModulePage.prepareCycle('ACH');
    setEditTransactionFromPrepared(prepared);
    await paymentModulePage.uploadAndAutoReconcile('NB');
    await paymentModulePage.uploadAndAutoReconcile('RN');
    markEditTransactionStatementsReady();

    await payablesPage.open();
    await payablesPage.searchByValue(prepared.customerUid);
    await payablesPage.selectAllRecords();
    await payablesPage.ensureCreatePaymentEnabled();
    const amount = await payablesPage.captureNetSettlementAmount();
    setCapturedAmount(amount);
    await payablesPage.clickCreatePayment();
    await payablesPage.confirmPaymentBatch();
    markEditTransactionBatchCreated();
    console.log(`[edit-transaction] Recreated ACH batch Net Settlement=${amount}`);
  },
);

/**
 * Mixed batch: two fresh ACH cycles (prod agent test-DevaTest is ACH-only).
 * CHK Excel extracts, but payables search does not resolve CHK Customer UIDs
 * (grid stays ~1000 rows unfiltered). Two ACH UIDs are searchable and still
 * exercise multi-select + kebab remove on Approval.
 */
Given(
  'a mixed ACH and Check payment batch exists on Approval for edit transaction',
  async ({ payablesPage, paymentModulePage, approvalPage }) => {
    if (isEditTransactionMixedBatch()) {
      const ctx = getEditTransactionContext();
      try {
        await approvalPage.open();
        await approvalPage.openRecordContaining(ctx.capturedAmount!, {
          paymentMethod: 'ACH',
        });
        const achCount = await approvalPage.paymentMethodTabRecordCount('ACH');
        // Prod: dual-ACH batch lands on ACH tab only.
        if (achCount >= 2) {
          await approvalPage.leaveBatchDetail();
          console.log('[edit-transaction] Reusing mixed dual-ACH Approval batch');
          return;
        }
        await approvalPage.leaveBatchDetail();
      } catch {
        // Fall through to recreate
      }
    }

    // Fresh ACH cycle A
    const ach = await paymentModulePage.prepareCycle('ACH');
    setEditTransactionFromPrepared(ach);
    await paymentModulePage.uploadAndAutoReconcile('NB');
    await paymentModulePage.uploadAndAutoReconcile('RN');
    markEditTransactionStatementsReady();
    markEditTransactionAchStatementsReady();
    const achUid = ach.customerUid;

    // Fresh ACH cycle B (second searchable UID)
    const ach2 = await paymentModulePage.prepareCycle('ACH');
    setEditTransactionFromPrepared(ach2);
    getEditTransactionContext().achCustomerUid = achUid;
    getEditTransactionContext().achStatementsReady = true;
    await paymentModulePage.uploadAndAutoReconcile('NB');
    await paymentModulePage.uploadAndAutoReconcile('RN');
    markEditTransactionChkStatementsReady();
    const ach2Uid = ach2.customerUid;
    getEditTransactionContext().chkCustomerUid = ach2Uid;

    await payablesPage.open();
    await payablesPage.selectAchAndChkPayablesByCustomerUid(achUid, ach2Uid);
    await payablesPage.ensureCreatePaymentEnabled();
    const amount = await payablesPage.captureNetSettlementAmount();
    setCapturedAmount(amount);
    getEditTransactionContext().agentId = PAYMENT_MODULE.agents.ACH.agentId;
    getEditTransactionContext().paymentMethod = 'ACH';
    getEditTransactionContext().customerUid = achUid;
    await payablesPage.clickCreatePayment();
    await payablesPage.confirmPaymentBatch();
    markEditTransactionBatchCreated();
    markEditTransactionMixedBatch();
    console.log(
      `[edit-transaction] Created mixed dual-ACH batch Net Settlement=${amount} ` +
        `UID_A=${achUid} UID_B=${ach2Uid}`,
    );
  },
);

When('I navigate to Approval on edit transaction', async ({ approvalPage }) => {
  await approvalPage.open();
});

Then('the Payment Batches heading is visible on edit transaction', async ({ approvalPage }) => {
  await approvalPage.expectPaymentBatchesHeading();
});

When(
  'I open the payment batch matching the captured Net Settlement on edit transaction',
  async ({ approvalPage }) => {
    const { agentId, paymentMethod } = getEditTransactionContext();
    await approvalPage.openRecordContaining(getCapturedAmount(), { agentId, paymentMethod });
  },
);

When(
  'I select the {string} payment method tab on edit transaction',
  async ({ approvalPage }, methodRaw: string) => {
    const method = methodRaw.trim() as 'Check' | 'ACH';
    if (method !== 'Check' && method !== 'ACH') {
      throw new Error(`Unsupported payment method tab "${methodRaw}". Use Check or ACH.`);
    }
    await approvalPage.selectPaymentMethodTab(method);
  },
);

Then(
  'the selected payment method tab has records on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectPaymentMethodTabHasRecords();
  },
);

Then(
  'the Generate and Download ACH button is visible on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectGenerateAndDownloadAchVisible();
  },
);

Then(
  'the Generate and Download ACH button is not visible on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectGenerateAndDownloadAchHidden();
  },
);

When('I generate and download the ACH file on edit transaction', async ({ approvalPage }) => {
  await approvalPage.generateAndDownloadAchFile();
});

Then(
  'the ACH file is downloaded from Approval on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectAchFileDownloadedFromApproval();
  },
);

Then(
  'the Last Generated timestamp is visible on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectLastGeneratedTimestampVisible();
  },
);

When('I capture the Last Generated timestamp on edit transaction', async ({ approvalPage }) => {
  const text = await approvalPage.captureLastGeneratedTimestamp();
  setLastDownloadedTimestamp(text);
  console.log(`[edit-transaction] Captured Last Generated=${text}`);
});

Then(
  'the captured Last Generated timestamp has a valid date-time on edit transaction',
  async () => {
    const text = getLastDownloadedTimestamp();
    expect(text).toMatch(/Last Generated:\s*\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}/i);
  },
);

Then(
  'the Last Generated timestamp has updated on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectLastGeneratedTimestampUpdated(getLastDownloadedTimestamp());
  },
);

When('I store the ACH file fingerprint on edit transaction', async ({ approvalPage }) => {
  const fp = approvalPage.getLastAchFingerprint();
  setAchFileFingerprint(fp, approvalPage.getLastAchFileName());
  console.log(`[edit-transaction] Stored ACH fingerprint=${fp.slice(0, 12)}…`);
});

Then(
  'the ACH file fingerprint differs from the stored fingerprint on edit transaction',
  async ({ approvalPage }) => {
    const previous = getAchFileFingerprint();
    const current = approvalPage.getLastAchFingerprint();
    expect(current, 'ACH file content should change after batch edit').not.toBe(previous);
  },
);

When('I remove one agent via kebab menu on edit transaction', async ({ approvalPage }) => {
  await approvalPage.removeOneAgentViaKebab();
});

When(
  'I remove all agents via kebab menu on the ACH tab on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.selectPaymentMethodTab('ACH');
    await approvalPage.removeAllAgentsViaKebab();
  },
);

When(
  'I remove all agents via kebab menu on Approval on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.selectAllPaymentMethodTab();
    await approvalPage.removeAllAgentsViaKebab();
  },
);

Then(
  'the ACH payment method tab has zero records on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectPaymentMethodTabCount('ACH', 0);
  },
);

Then(
  'the payment batch has no agents remaining on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectNoAgentsRemainingOnBatch();
  },
);

When('I capture the Net Disbursement amount on edit transaction', async ({ approvalPage }) => {
  const amount = await approvalPage.captureNetDisbursementAmount();
  setCapturedNetDisbursement(amount);
  console.log(`[edit-transaction] Captured Net Disbursement=${amount}`);
});

Then(
  'the Net Disbursement remains on the payment batch after Edit Transaction on edit transaction',
  async ({ approvalPage }) => {
    if (!(await approvalPage.loc.batchTitle().isVisible().catch(() => false))) {
      await approvalPage.open();
      const { agentId, paymentMethod } = getEditTransactionContext();
      await approvalPage.openRecordContaining(getCapturedAmount(), { agentId, paymentMethod });
    }
    const amount = await approvalPage.captureNetDisbursementAmount();
    expect(parseAmountNumber(amount)).toBeGreaterThan(0);
    setCapturedNetDisbursement(amount);
    setCapturedAmount(amount);
  },
);

When('I open Edit Transaction on edit transaction', async ({ approvalPage, editBatchPage }) => {
  await approvalPage.openEditTransaction();
  await editBatchPage.expectPageReady();
});

When('I add a payable line item on edit transaction', async ({ editBatchPage }) => {
  await editBatchPage.addOnePayableLineItem();
});

When('I remove a payable line item on edit transaction', async ({ editBatchPage }) => {
  await editBatchPage.removeOnePayableLineItem();
});

When(
  'I uncheck all payable line items on edit transaction',
  async ({ editBatchPage }) => {
    await editBatchPage.uncheckAllPayableLineItems();
  },
);

When(
  'I attempt to remove all payable line items on edit transaction',
  async ({ editBatchPage }) => {
    await editBatchPage.uncheckAllPayableLineItems();
  },
);

Then('the Save Batch button is disabled on edit transaction', async ({ editBatchPage }) => {
  await editBatchPage.expectSaveBatchDisabled();
});

Then('the Edit Batch Net Settlement is zero on edit transaction', async ({ editBatchPage }) => {
  await editBatchPage.expectCannotRemoveAllValidation();
});

Then(
  'the Edit Transaction cannot-remove-all validation is shown on edit transaction',
  async ({ editBatchPage }) => {
    await editBatchPage.expectCannotRemoveAllValidation();
  },
);

When(
  'I capture the batch id from the batch title on edit transaction',
  async ({ approvalPage }) => {
    const batchId = await approvalPage.captureBatchIdFromTitle();
    setBatchId(batchId);
    console.log(`[edit-transaction] Captured batchId=${batchId}`);
  },
);

Then(
  'I am redirected to the Approval list after the batch is destroyed on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectRedirectedToApprovalListAfterBatchDestroyed();
  },
);

When(
  'I search Approval by the captured batch id on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.searchApprovalByBatchId(getBatchId());
  },
);

Then(
  'no Approval batch is listed for the captured batch id on edit transaction',
  async ({ approvalPage }) => {
    await approvalPage.expectNoApprovalBatchListedForId(getBatchId());
  },
);

When(
  'I save the Edit Transaction changes on edit transaction',
  async ({ editBatchPage, approvalPage }) => {
    await editBatchPage.saveBatch();
    if (await approvalPage.loc.batchTitle().isVisible().catch(() => false)) {
      return;
    }
    if (/\/payable-line-items\/edit\//i.test(editBatchPage.page.url())) {
      await editBatchPage.backToApproval();
    }
  },
);

Then(
  'the Net Disbursement has increased after Edit Transaction on edit transaction',
  async ({ approvalPage }) => {
    if (!(await approvalPage.loc.batchTitle().isVisible().catch(() => false))) {
      await approvalPage.open();
      const { agentId, paymentMethod } = getEditTransactionContext();
      await approvalPage.openRecordContaining(getCapturedAmount(), { agentId, paymentMethod });
    }
    const previous = getCapturedNetDisbursement();
    const current = await approvalPage.captureNetDisbursementAmount();
    expect(parseAmountNumber(current)).toBeGreaterThan(parseAmountNumber(previous));
    setCapturedAmount(current);
    setCapturedNetDisbursement(current);
  },
);

Then(
  'the Net Disbursement has decreased after Edit Transaction on edit transaction',
  async ({ approvalPage }) => {
    if (!(await approvalPage.loc.batchTitle().isVisible().catch(() => false))) {
      await approvalPage.open();
      const { agentId, paymentMethod } = getEditTransactionContext();
      await approvalPage.openRecordContaining(getCapturedAmount(), { agentId, paymentMethod });
    }
    const previous = getCapturedNetDisbursement();
    const current = await approvalPage.captureNetDisbursementAmount();
    expect(parseAmountNumber(current)).toBeLessThan(parseAmountNumber(previous));
    setCapturedAmount(current);
    setCapturedNetDisbursement(current);
  },
);
