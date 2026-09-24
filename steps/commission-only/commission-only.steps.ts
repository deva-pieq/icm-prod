import {
  getPolicyNumber,
  getTimestamp,
  getAdvanceDefault,
  getAdvanceMonthly,
  getAdvanceAmount,
  getProductName,
  getAgentId,
} from '../../utils/advance-only/advanceOnlyContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare commission-only statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the commission only statement file is prepared from template in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.prepareCommissionOnlyFile();
  },
);

Given(
  'the commission only Customer UID is incremented by 1 in the prepared file',
  async ({ advanceOnlyPage }) => {
    advanceOnlyPage.storeCommissionOnlyPreparedData();
  },
);

Given(
  'the commission only prepared file is saved with a timestamp suffix',
  async () => {
    // Timestamp is stored in storeCommissionOnlyPreparedData — no-op here
  },
);

Then(
  'the commission only prepared file name and Customer UID are stored for later steps',
  async () => {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    console.log(
      `[commission-only] Prepared data stored — Customer UID: ${policyNumber}, timestamp: ${timestamp}`,
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the Agent ID from the prepared commission only file',
  async ({ advanceOnlyPage }) => {
    advanceOnlyPage.extractCommissionOnlyAgentId();
  },
);

When(
  'I navigate to the Agents page in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openAgentsPage();
  },
);

When(
  'I search the Agents grid by agent ID in commission only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.searchAgentById(agentId);
  },
);

Then(
  'a row containing the agent ID and Level is displayed in commission only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.expectAgentRowDisplayed(agentId);
  },
);

When(
  'I open the agent settings for the matched agent in commission only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.openAgentSettings(agentId);
  },
);

Then(
  'the carrier advance toggle is enabled in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectCarrierAdvanceToggleEnabled();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the product name alias from the prepared commission only file',
  async ({ advanceOnlyPage }) => {
    advanceOnlyPage.extractCommissionOnlyProductName();
  },
);

When(
  'I navigate to the Advance Setup page in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openAdvanceSetupPage();
  },
);

When(
  'I search the Advance Setup grid by product name in commission only validation',
  async ({ advanceOnlyPage }) => {
    const productName = getProductName();
    await advanceOnlyPage.searchAdvanceSetupByProduct(productName);
  },
);

Then(
  'a row for the product appears in the Advance Setup grid in commission only validation',
  async ({ advanceOnlyPage }) => {
    const productName = getProductName();
    await advanceOnlyPage.expectProductRowInAdvanceSetup(productName);
  },
);

Then(
  'I capture the Advance Default value in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceDefault();
  },
);

Then(
  'I capture the Advance Monthly value in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceMonthly();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared commission-only statement file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the commission only statement upload page',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToCommissionOnlyUploadPage();
  },
);

When(
  'I upload the prepared commission only file',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.uploadPreparedCommissionOnlyFile();
  },
);

When(
  'I select the statement type {string} in commission only validation',
  async ({ advanceOnlyPage }, statementType: string) => {
    await advanceOnlyPage.selectStatementType(statementType);
  },
);

When(
  'I submit the commission only upload for processing',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.submitForProcessing();
  },
);

Then(
  'the uploaded file appears in the commission only recently uploaded grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectCommissionOnlyFileInGrid();
  },
);

Then(
  'the commission only upload extract processing completes and file ID is captured',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.pollCommissionOnlyExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the commission only upload row shows status {string} and stage {string}',
  async ({ advanceOnlyPage }, status: string, stage: string) => {
    await advanceOnlyPage.expectCommissionOnlyUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review stage
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the commission only review page for the stored upload',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openReviewPageForStoredUpload();
  },
);

Then(
  'every transaction type is {string} in commission only validation',
  async ({ advanceOnlyPage }, type: string) => {
    await advanceOnlyPage.assertEveryTransactionType(type);
  },
);

When(
  'I click Complete Review on the commission only review page',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.completeReview();
  },
);

When(
  'I wait for 2 seconds and refresh the commission only data grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.waitMs(5_000);
    await advanceOnlyPage.refreshRecentlyUploadedGrid();
  },
);

Then(
  'the commission only upload stage changes to {string}',
  async ({ advanceOnlyPage }, stage: string) => {
    await advanceOnlyPage.waitForCommissionOnlyUploadStage(stage);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Re-navigate to upload and open the record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the commission only upload page again',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToCommissionOnlyUploadPage();
  },
);

When(
  'I open the commission only record by stored file ID',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openCommissionOnlyRecordByFileId();
  },
);

When(
  'I wait for the commission only file to reach {string} or {string} stage',
  async ({ advanceOnlyPage }, stage1: string, stage2: string) => {
    await advanceOnlyPage.waitForNeedsAttentionOrReconciliation();
  },
);

Then(
  'the commission only reconciliation page is displayed',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectReconciliationPageDisplayed();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Commission Only (KEY DIFFERENCE: commission radio)
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I hover over the advance exception warning tooltip in commission only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.hoverAdvanceExceptionTooltip();
  },
);

Then(
  'the advance exception tooltip contains {string} in commission only validation',
  async ({ advanceOnlyPage }, text: string) => {
    await advanceOnlyPage.expectCommissionOnlyTooltipText();
  },
);

When(
  'I click the advance exception record in commission only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickAdvanceExceptionRecord();
  },
);

Then(
  'the Advance Exception title is displayed in commission only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectAdvanceExceptionTitle();
  },
);

When(
  'I click the {string} label in commission only reconciliation',
  async ({ advanceOnlyPage }, label: string) => {
    await advanceOnlyPage.clickM1_12Label();
  },
);

When(
  'I select the Commission Only radio button in commission only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.selectCommissionRadio();
  },
);

Then(
  'the number of months input matches the captured Advance Monthly value in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectNoOfMonthsMatchesAdvanceMonthly();
  },
);

When(
  'I capture the advance amount from the total advance input in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceAmountFromTotalAdvanceInput();
  },
);

When(
  'I click the reconcile advance exception button in commission only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickReconcileAdvanceExceptionButton();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8 — Validate ARF amount on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Policies page in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToPoliciesPage();
  },
);

When(
  'I search the Policies grid by stored PolicyNumber in commission only validation',
  async ({ advanceOnlyPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceOnlyPage.searchPoliciesByPolicyNumber(policyNumber);
  },
);

When(
  'I click the policy actions ellipse in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickPolicyActionsEllipse();
  },
);

When(
  'I click {string} in the policy actions menu in commission only validation',
  async ({ advanceOnlyPage }, menuItem: string) => {
    await advanceOnlyPage.clickViewLedger();
  },
);

Then(
  'the Policy Ledger page is displayed in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectPolicyLedgerDisplayed();
  },
);

Then(
  'the ARF row Amount matches the captured advance amount in commission only validation',
  async ({ advanceOnlyPage }) => {
    const advanceAmount = getAdvanceAmount();
    await advanceOnlyPage.expectArfRowAmountMatches(advanceAmount);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare recovery statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the commission only recovery statement file is prepared from template',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.prepareCommissionOnlyRecoveryFile();
  },
);

Given(
  'the commission only recovery file Customer UID is replaced with the stored PolicyNumber',
  async () => {
    // Policy number replacement is handled inside prepareCommissionOnlyRecoveryFile
  },
);

Given(
  'the commission only recovery file is saved with the stored timestamp suffix',
  async () => {
    // Timestamp is applied inside prepareCommissionOnlyRecoveryFile
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 10 — Upload recovery file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I upload the prepared commission only recovery file',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.uploadCommissionOnlyRecoveryFile();
  },
);

Then(
  'the uploaded recovery file appears in the commission only recently uploaded grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectCommissionOnlyRecoveryFileInGrid();
  },
);

Then(
  'the commission only recovery upload extract processing completes and file ID is captured',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.pollCommissionOnlyRecoveryExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the commission only recovery upload row shows status {string} and stage {string}',
  async ({ advanceOnlyPage }, status: string, stage: string) => {
    await advanceOnlyPage.expectCommissionOnlyRecoveryUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Review recovery file and verify chargeback
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the commission only review page for the stored recovery upload',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openCommissionOnlyRecoveryReviewPage();
  },
);

Then(
  'the commission only recovery upload stage changes to {string}',
  async ({ advanceOnlyPage }, stage: string) => {
    await advanceOnlyPage.expectCommissionOnlyRecoveryUploadStageCompleted();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I expand a commission row in the Policy Ledger in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expandCommissionRowInLedger();
  },
);

Then(
  'the commission details contain {string} in commission only validation',
  async ({ advanceOnlyPage }, text: string) => {
    await advanceOnlyPage.expectCommissionDetailsContainAdvanceEarned();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Validate Advance Overview historical record
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Advance Overview page in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToAdvanceOverview();
  },
);

When(
  'I click the Historical tab in commission only overview',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickHistoricalTab();
  },
);

When(
  'I search the Advance Overview grid by stored PolicyNumber in commission only validation',
  async ({ advanceOnlyPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceOnlyPage.searchAdvanceOverviewByPolicyNumber(policyNumber);
  },
);

When(
  'I open the first record in the Advance Overview grid in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openFirstRecordInAdvanceOverview();
  },
);

Then(
  'the Advance Policy Details card Product field contains the expected product name in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectAdvancePolicyDetailsCardProduct();
  },
);

When(
  'I click the sort indicator in the Advance Overview details grid in commission only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickSortIndicator();
  },
);

Then(
  'the balance in the first row of the Advance Overview details grid is {string} in commission only validation',
  async ({ advanceOnlyPage }, expectedBalance: string) => {
    await advanceOnlyPage.expectFirstRowBalanceIsZero();
  },
);
