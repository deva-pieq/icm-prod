import {
  getPolicyNumber,
  getTimestamp,
  getAdvanceDefault,
  getAdvanceMonthly,
  getAdvanceAmount,
  getProductName,
  getAgentId,
} from '../../utils/advance-adjustment/advanceAdjustmentContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the advance adjustment statement file is prepared from template',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.prepareFile();
  },
);

Given(
  'the Customer UID is incremented by 1 in the advance adjustment prepared file',
  async ({ advanceAdjustmentPage }) => {
    advanceAdjustmentPage.storePreparedData();
  },
);

Given(
  'the advance adjustment prepared file is saved with a timestamp suffix',
  async () => {
    // Timestamp is stored in storePreparedData — no-op here, kept for Gherkin readability
  },
);

Then(
  'the advance adjustment prepared file name and Customer UID are stored for later steps',
  async () => {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    console.log(
      `[advance-adjustment] Prepared data stored — Customer UID: ${policyNumber}, timestamp: ${timestamp}`,
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the Agent ID from the prepared advance adjustment file',
  async ({ advanceAdjustmentPage }) => {
    advanceAdjustmentPage.extractAgentId();
  },
);

When(
  'I navigate to the Agents page in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openAgentsPage();
  },
);

When(
  'I search the Agents grid by agent ID in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const agentId = getAgentId();
    await advanceAdjustmentPage.searchAgentById(agentId);
  },
);

Then(
  'a row containing the agent ID and Level is displayed in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const agentId = getAgentId();
    await advanceAdjustmentPage.expectAgentRowDisplayed(agentId);
  },
);

When(
  'I open the agent settings for the matched agent in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const agentId = getAgentId();
    await advanceAdjustmentPage.openAgentSettings(agentId);
  },
);

Then(
  'the carrier advance toggle is enabled in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectCarrierAdvanceToggleEnabled();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the product name alias from the prepared advance adjustment file',
  async ({ advanceAdjustmentPage }) => {
    advanceAdjustmentPage.extractProductName();
  },
);

When(
  'I navigate to the Advance Setup page in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openAdvanceSetupPage();
  },
);

When(
  'I search the Advance Setup grid by product name in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const productName = getProductName();
    await advanceAdjustmentPage.searchAdvanceSetupByProduct(productName);
  },
);

Then(
  'a row for the product appears in the Advance Setup grid in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const productName = getProductName();
    await advanceAdjustmentPage.expectProductRowInAdvanceSetup(productName);
  },
);

Then(
  'I capture the Advance Default value in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.captureAdvanceDefault();
  },
);

Then(
  'I capture the Advance Monthly value in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.captureAdvanceMonthly();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared statement file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance adjustment statement upload page',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openUploadPageAgain();
  },
);

When(
  'I upload the prepared advance adjustment file',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.uploadPreparedAdvanceAdjustmentFile();
  },
);

When(
  'I select the statement type {string} in advance adjustment validation',
  async ({ advanceAdjustmentPage }, statementType: string) => {
    await advanceAdjustmentPage.selectStatementType(statementType);
  },
);

When(
  'I submit the advance adjustment upload for processing',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickUploadStatement();
  },
);

Then(
  'the uploaded file appears in the advance adjustment recently uploaded grid',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectUploadedFileInAdvanceAdjustmentGrid();
  },
);

Then(
  'the advance adjustment upload extract processing completes and file ID is captured',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.pollExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance adjustment upload row shows status {string} and stage {string}',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review stage
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance adjustment review page for the stored upload',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openReviewPageForStoredUpload();
  },
);

Then(
  'every transaction type is {string} in advance adjustment validation',
  async ({ advanceAdjustmentPage }, type: string) => {
    await advanceAdjustmentPage.assertEveryTransactionType(type);
  },
);

When(
  'I click Complete Review on the advance adjustment review page',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.completeReview();
  },
);

When(
  'I wait for 2 seconds and refresh the advance adjustment data grid',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.waitMs(2_000);
    await advanceAdjustmentPage.refreshRecentlyUploadedGrid();
  },
);

Then(
  'the advance adjustment upload stage changes to {string}',
  async ({ advanceAdjustmentPage }, stage: string) => {
    await advanceAdjustmentPage.waitForUploadStage(stage);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Re-navigate to upload and open the record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the advance adjustment upload page again',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.navigateToUploadPageAgain();
  },
);

When(
  'I open the advance adjustment record by stored file ID',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openRecordByFileId();
  },
);

When(
  'I wait for the advance adjustment file to reach {string} or {string} stage',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.waitForNeedsAttentionOrReconciliation();
  },
);

Then(
  'the advance adjustment reconciliation page is displayed',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectReconciliationPageDisplayed();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Advance and Adjustment
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I hover over the advance exception warning tooltip in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.hoverAdvanceExceptionTooltip();
  },
);

Then(
  'the advance exception tooltip contains {string} in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectAdvanceExceptionTooltipText();
  },
);

When(
  'I click the advance exception record in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickAdvanceExceptionRecord();
  },
);

Then(
  'the Advance Exception title is displayed in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectAdvanceExceptionTitle();
  },
);

When(
  'I click the {string} label in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickM1_12Label();
  },
);

When(
  'I select the Commission radio button in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.selectCommissionRadio();
  },
);

Then(
  'the number of months input matches the captured Advance Monthly value in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectNoOfMonthsMatchesAdvanceMonthly();
  },
);

When(
  'I capture the advance amount from the total advance input in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.captureAdvanceAmountFromTotalAdvanceInput();
  },
);

Then(
  'the transaction preview grid contains ARF and Adjusted rows',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectTransactionPreviewContainsArfAndAdjusted();
  },
);

When(
  'I click the reconcile advance exception button in advance adjustment reconciliation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickReconcileAdvanceExceptionButton();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8 — Validate ARF amount on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Policies page in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.navigateToPoliciesPage();
  },
);

When(
  'I search the Policies grid by stored PolicyNumber in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceAdjustmentPage.searchPoliciesByPolicyNumber(policyNumber);
  },
);

When(
  'I click the policy actions ellipse in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickPolicyActionsEllipse();
  },
);

When(
  'I click {string} in the policy actions menu in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickViewLedger();
  },
);

Then(
  'the Policy Ledger page is displayed in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectPolicyLedgerDisplayed();
  },
);

Then(
  'the ARF row Amount matches the captured advance amount in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const advanceAmount = getAdvanceAmount();
    await advanceAdjustmentPage.expectArfRowAmountMatches(advanceAmount);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare recovery statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the advance adjustment recovery statement file is prepared from template',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.prepareRecoveryFile();
  },
);

Given(
  'the recovery file Customer UID is replaced with the stored PolicyNumber for advance adjustment',
  async () => {
    // Policy number replacement is handled inside prepareRecoveryFile
  },
);

Given(
  'the recovery file is saved with the stored timestamp suffix for advance adjustment',
  async () => {
    // Timestamp is applied inside prepareRecoveryFile
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 10 — Upload recovery file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I upload the prepared advance adjustment recovery file',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.uploadRecoveryFile();
  },
);

Then(
  'the uploaded recovery file appears in the advance adjustment recently uploaded grid',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectRecoveryFileInGrid();
  },
);

Then(
  'the advance adjustment recovery upload extract processing completes and file ID is captured',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.pollRecoveryExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance adjustment recovery upload row shows status {string} and stage {string}',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectRecoveryUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Review recovery file and verify chargeback
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance adjustment review page for the stored recovery upload',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openRecoveryReviewPage();
  },
);

Then(
  'the advance adjustment recovery upload stage changes to {string}',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectRecoveryUploadStageCompleted();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I expand a commission row in the Policy Ledger in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expandCommissionRowInLedger();
  },
);

Then(
  'the commission details contain {string} in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectCommissionDetailsContainAdvanceEarned();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Validate Advance Overview historical record
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Advance Overview page in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.navigateToAdvanceOverview();
  },
);

When(
  'I click the Historical tab in advance adjustment overview',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickHistoricalTab();
  },
);

When(
  'I search the Advance Overview grid by stored PolicyNumber in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceAdjustmentPage.searchAdvanceOverviewByPolicyNumber(policyNumber);
  },
);

When(
  'I open the first record in the Advance Overview grid in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.openFirstRecordInAdvanceOverview();
  },
);

Then(
  'the Advance Policy Details card Product field contains the expected product name in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectAdvancePolicyDetailsCardProduct();
  },
);

When(
  'I click the sort indicator in the Advance Overview details grid in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.clickSortIndicator();
  },
);

Then(
  'the balance in the first row of the Advance Overview details grid is {string} in advance adjustment validation',
  async ({ advanceAdjustmentPage }) => {
    await advanceAdjustmentPage.expectFirstRowBalanceIsZero();
  },
);
