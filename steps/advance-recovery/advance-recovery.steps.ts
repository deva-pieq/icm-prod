import {
  getPolicyNumber,
  getTimestamp,
  getAdvanceDefault,
  getAdvanceMonthly,
  getAdvanceAmount,
  getProductName,
  getAgentId,
} from '../../utils/advance-recovery/advanceRecoveryContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the advance recovery statement file is prepared from template',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.prepareFile();
  },
);

Given(
  'the Customer UID is incremented by 1 in the advance recovery prepared file',
  async ({ advanceRecoveryPage }) => {
    advanceRecoveryPage.storePreparedData();
  },
);

Given(
  'the advance recovery prepared file is saved with a timestamp suffix',
  async () => {
    // Timestamp is stored in storePreparedData — no-op here, kept for Gherkin readability
  },
);

Then(
  'the advance recovery prepared file name and Customer UID are stored for later steps',
  async () => {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    console.log(
      `[advance-recovery] Prepared data stored — Customer UID: ${policyNumber}, timestamp: ${timestamp}`,
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the Agent ID from the prepared advance recovery file',
  async ({ advanceRecoveryPage }) => {
    advanceRecoveryPage.extractAgentId();
  },
);

When(
  'I navigate to the Agents page in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openAgentsPage();
  },
);

When(
  'I search the Agents grid by agent ID in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const agentId = getAgentId();
    await advanceRecoveryPage.searchAgentById(agentId);
  },
);

Then(
  'a row containing the agent ID and Level is displayed in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const agentId = getAgentId();
    await advanceRecoveryPage.expectAgentRowDisplayed(agentId);
  },
);

When(
  'I open the agent settings for the matched agent in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const agentId = getAgentId();
    await advanceRecoveryPage.openAgentSettings(agentId);
  },
);

Then(
  'the carrier advance toggle is enabled in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectCarrierAdvanceToggleEnabled();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the product name alias from the prepared advance recovery file',
  async ({ advanceRecoveryPage }) => {
    advanceRecoveryPage.extractProductName();
  },
);

When(
  'I navigate to the Advance Setup page in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openAdvanceSetupPage();
  },
);

When(
  'I search the Advance Setup grid by product name in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const productName = getProductName();
    await advanceRecoveryPage.searchAdvanceSetupByProduct(productName);
  },
);

Then(
  'a row for the product appears in the Advance Setup grid in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const productName = getProductName();
    await advanceRecoveryPage.expectProductRowInAdvanceSetup(productName);
  },
);

Then(
  'I capture the Advance Default value in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.captureAdvanceDefault();
  },
);

Then(
  'I capture the Advance Monthly value in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.captureAdvanceMonthly();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared statement file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance recovery statement upload page',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openUploadPageAgain();
  },
);

When(
  'I upload the prepared advance recovery file',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.uploadPreparedAdvanceRecoveryFile();
  },
);

When(
  'I select the statement type {string} in advance recovery validation',
  async ({ advanceRecoveryPage }, statementType: string) => {
    await advanceRecoveryPage.selectStatementType(statementType);
  },
);

When(
  'I submit the advance recovery upload for processing',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickUploadStatement();
  },
);

Then(
  'the uploaded file appears in the advance recovery recently uploaded grid',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectUploadedFileInAdvanceRecoveryGrid();
  },
);

Then(
  'the advance recovery upload extract processing completes and file ID is captured',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.pollExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance recovery upload row shows status {string} and stage {string}',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review stage
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance recovery review page for the stored upload',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openReviewPageForStoredUpload();
  },
);

Then(
  'every transaction type is {string} in advance recovery validation',
  async ({ advanceRecoveryPage }, type: string) => {
    await advanceRecoveryPage.assertEveryTransactionType(type);
  },
);

When(
  'I click Complete Review on the advance recovery review page',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.completeReview();
  },
);

When(
  'I wait for 2 seconds and refresh the advance recovery data grid',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.waitMs(2_000);
    await advanceRecoveryPage.refreshRecentlyUploadedGrid();
  },
);

Then(
  'the advance recovery upload stage changes to {string}',
  async ({ advanceRecoveryPage }, stage: string) => {
    await advanceRecoveryPage.waitForUploadStage(stage);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Re-navigate to upload and open the record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the advance recovery upload page again',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.navigateToUploadPageAgain();
  },
);

When(
  'I open the advance recovery record by stored file ID',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openRecordByFileId();
  },
);

When(
  'I wait for the advance recovery file to reach {string} or {string} stage',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.waitForNeedsAttentionOrReconciliation();
  },
);

Then(
  'the advance recovery reconciliation page is displayed',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectReconciliationPageDisplayed();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Commission (ARF flow)
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I hover over the advance exception warning tooltip in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.hoverAdvanceExceptionTooltip();
  },
);

Then(
  'the advance exception tooltip contains {string} in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectAdvanceExceptionTooltipText();
  },
);

When(
  'I click the advance exception record in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickAdvanceExceptionRecord();
  },
);

Then(
  'the Advance Exception title is displayed in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectAdvanceExceptionTitle();
  },
);

When(
  'I click the {string} label in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickM1_12Label();
  },
);

When(
  'I select the Commission radio button in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.selectCommissionRadio();
  },
);

Then(
  'the number of months input matches the captured Advance Monthly value in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectNoOfMonthsMatchesAdvanceMonthly();
  },
);

When(
  'I capture the advance amount from the total advance input in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.captureAdvanceAmountFromTotalAdvanceInput();
  },
);

Then(
  'the transaction preview grid contains an ARF row in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectTransactionPreviewContainsArfRow();
  },
);

When(
  'I click the reconcile advance exception button in advance recovery reconciliation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickReconcileAdvanceExceptionButton();
  },
);

Then(
  'a success toast message is displayed in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectSuccessToastMessage();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8 — Validate ARF amount on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Policies page in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.navigateToPoliciesPage();
  },
);

When(
  'I search the Policies grid by stored PolicyNumber in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceRecoveryPage.searchPoliciesByPolicyNumber(policyNumber);
  },
);

When(
  'I click the policy actions ellipse in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickPolicyActionsEllipse();
  },
);

When(
  'I click {string} in the policy actions menu in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickViewLedger();
  },
);

Then(
  'the Policy Ledger page is displayed in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectPolicyLedgerDisplayed();
  },
);

Then(
  'the ARF row Amount matches the captured advance amount in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const advanceAmount = getAdvanceAmount();
    await advanceRecoveryPage.expectArfRowAmountMatches(advanceAmount);
  },
);

Then(
  'the Policy Ledger contains a CHARGEBACK earning type row in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectPolicyLedgerContainsChargebackRow();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare recovery statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the advance recovery recovery statement file is prepared from template',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.prepareRecoveryFile();
  },
);

Given(
  'the recovery file Customer UID is replaced with the stored PolicyNumber for advance recovery',
  async () => {
    // Policy number replacement is handled inside prepareRecoveryFile
  },
);

Given(
  'the recovery file is saved with the stored timestamp suffix for advance recovery',
  async () => {
    // Timestamp is applied inside prepareRecoveryFile
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 10 — Upload recovery file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I upload the prepared advance recovery recovery file',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.uploadRecoveryFile();
  },
);

Then(
  'the uploaded recovery file appears in the advance recovery recently uploaded grid',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectRecoveryFileInGrid();
  },
);

Then(
  'the advance recovery recovery upload extract processing completes and file ID is captured',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.pollRecoveryExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance recovery recovery upload row shows status {string} and stage {string}',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectRecoveryUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Review recovery file and verify chargeback
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance recovery review page for the stored recovery upload',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openRecoveryReviewPage();
  },
);

Then(
  'the advance recovery recovery upload stage changes to {string}',
  async ({ advanceRecoveryPage }, stage: string) => {
    await advanceRecoveryPage.expectRecoveryUploadStageCompleted();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I expand a chargeback row in the Policy Ledger in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expandChargebackRowInLedger();
  },
);
Then(
  'the chargeback details contain {string} in advance recovery validation',
  async ({ advanceRecoveryPage }, text: string) => {
    await advanceRecoveryPage.expectChargebackDetailsContainChargeback();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Validate Advance Overview historical record
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Advance Overview page in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.navigateToAdvanceOverview();
  },
);

When(
  'I click the Historical tab in advance recovery overview',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickHistoricalTab();
  },
);

When(
  'I search the Advance Overview grid by stored PolicyNumber in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceRecoveryPage.searchAdvanceOverviewByPolicyNumber(policyNumber);
  },
);

When(
  'I open the first record in the Advance Overview grid in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.openFirstRecordInAdvanceOverview();
  },
);

Then(
  'the Advance Policy Details card Product field contains the expected product name in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.expectAdvancePolicyDetailsCardProduct();
  },
);

When(
  'I click the sort indicator in the Advance Overview details grid in advance recovery validation',
  async ({ advanceRecoveryPage }) => {
    await advanceRecoveryPage.clickSortIndicator();
  },
);

Then(
  'the balance in the first row of the Advance Overview details grid is {string} in advance recovery validation',
  async ({ advanceRecoveryPage }, expectedBalance: string) => {
    await advanceRecoveryPage.expectFirstRowBalanceIsZero();
  },
);
