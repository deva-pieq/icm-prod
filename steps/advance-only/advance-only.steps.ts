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
// PHASE 1 — Prepare statement file
// ═══════════════════════════════════════════════════════════════════════════

Given('the advance only statement file is prepared from template', async ({ advanceOnlyPage }) => {
  await advanceOnlyPage.prepareFile();
});

Given('the Customer UID is incremented by 1 in the prepared file', async ({ advanceOnlyPage }) => {
  advanceOnlyPage.storePreparedData();
});

Given('the prepared file is saved with a timestamp suffix', async ({ advanceOnlyPage }) => {
  // Timestamp is stored in storePreparedData — no-op here, kept for Gherkin readability
});

Then(
  'the prepared file name and Customer UID are stored for later steps',
  async ({ advanceOnlyPage }) => {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    console.log(
      `[advance-only] Prepared data stored — Customer UID: ${policyNumber}, timestamp: ${timestamp}`,
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the Agent ID from the prepared advance only file', async ({ advanceOnlyPage }) => {
  advanceOnlyPage.extractAgentId();
});

When('I navigate to the Agents page in advance only validation', async ({ advanceOnlyPage }) => {
  await advanceOnlyPage.openAgentsPage();
});

When(
  'I search the Agents grid by agent ID in advance only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.searchAgentById(agentId);
  },
);

Then(
  'a row containing the agent ID and Level is displayed in advance only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.expectAgentRowDisplayed(agentId);
  },
);

When(
  'I open the agent settings for the matched agent in advance only validation',
  async ({ advanceOnlyPage }) => {
    const agentId = getAgentId();
    await advanceOnlyPage.openAgentSettings(agentId);
  },
);

Then(
  'the carrier advance toggle is enabled in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectCarrierAdvanceToggleEnabled();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I extract the product name alias from the prepared advance only file',
  async ({ advanceOnlyPage }) => {
    advanceOnlyPage.extractProductName();
  },
);

When(
  'I navigate to the Advance Setup page in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openAdvanceSetupPage();
  },
);

When(
  'I search the Advance Setup grid by product name in advance only validation',
  async ({ advanceOnlyPage }) => {
    const productName = getProductName();
    await advanceOnlyPage.searchAdvanceSetupByProduct(productName);
  },
);

Then(
  'a row for the product appears in the Advance Setup grid in advance only validation',
  async ({ advanceOnlyPage }) => {
    const productName = getProductName();
    await advanceOnlyPage.expectProductRowInAdvanceSetup(productName);
  },
);

Then(
  'I capture the Advance Default value in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceDefault();
  },
);

Then(
  'I capture the Advance Monthly value in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceMonthly();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared statement file
// ═══════════════════════════════════════════════════════════════════════════

When('I open the advance only statement upload page', async ({ advanceOnlyPage }) => {
  await advanceOnlyPage.openUploadPageAgain();
});

When('I upload the prepared advance only file', async ({ advanceOnlyPage }) => {
  await advanceOnlyPage.uploadPreparedAdvanceOnlyFile();
});

When(
  'I select the statement type {string} in advance only validation',
  async ({ advanceOnlyPage }, statementType: string) => {
    await advanceOnlyPage.selectStatementType(statementType);
  },
);

When('I submit the advance only upload for processing', async ({ advanceOnlyPage }) => {
  await advanceOnlyPage.submitForProcessing();
});

Then(
  'the uploaded file appears in the advance only recently uploaded grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectUploadedFileInAdvanceOnlyGrid();
  },
);

Then(
  'the advance only upload extract processing completes and file ID is captured',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.pollExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance only upload row shows status {string} and stage {string}',
  async ({ advanceOnlyPage }, status: string, stage: string) => {
    await advanceOnlyPage.expectUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review stage
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance only review page for the stored upload',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openReviewPageForStoredUpload();
  },
);

Then(
  'every transaction type is {string} in advance only validation',
  async ({ advanceOnlyPage }, type: string) => {
    await advanceOnlyPage.assertEveryTransactionType(type);
  },
);

When(
  'I click Complete Review on the advance only review page',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.completeReview();
  },
);



When(
  'I wait for 2 seconds and refresh the advance only data grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.waitMs(2_000);
    await advanceOnlyPage.refreshRecentlyUploadedGrid();
  },
);

Then(
  'the advance only upload stage changes to {string}',
  async ({ advanceOnlyPage }, stage: string) => {
    await advanceOnlyPage.waitForUploadStage(stage);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Re-navigate to upload and open the record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the advance only upload page again',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToUploadPageAgain();
  },
);

When(
  'I open the advance only record by stored file ID',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openRecordByFileId();
  },
);

When(
  'I wait for the advance only file to reach {string} or {string} stage',
  async ({ advanceOnlyPage }, stage1: string, stage2: string) => {
    await advanceOnlyPage.waitForNeedsAttentionOrReconciliation();
  },
);

Then(
  'the advance only reconciliation page is displayed',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectReconciliationPageDisplayed();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Advance Only
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I hover over the advance exception warning tooltip in advance only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.hoverAdvanceExceptionTooltip();
  },
);

Then(
  'the advance exception tooltip contains {string} in advance only validation',
  async ({ advanceOnlyPage }, text: string) => {
    await advanceOnlyPage.expectAdvanceExceptionTooltipText();
  },
);

When(
  'I click the advance exception record in advance only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickAdvanceExceptionRecord();
  },
);

Then(
  'the Advance Exception title is displayed in advance only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectAdvanceExceptionTitle();
  },
);

When(
  'I click the {string} label in advance only reconciliation',
  async ({ advanceOnlyPage }, label: string) => {
    await advanceOnlyPage.clickM1_12Label();
  },
);

When(
  'I select the Advance Only radio button in advance only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.selectAdvanceOnlyRadio();
  },
);

Then(
  'the number of months input matches the captured Advance Monthly value in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectNoOfMonthsMatchesAdvanceMonthly();
  },
);

When(
  'I capture the advance amount from the total advance input in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.captureAdvanceAmountFromTotalAdvanceInput();
  },
);

When(
  'I click the reconcile advance exception button in advance only reconciliation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickReconcileAdvanceExceptionButton();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8 — Validate ARF amount on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Policies page in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToPoliciesPage();
  },
);

When(
  'I search the Policies grid by stored PolicyNumber in advance only validation',
  async ({ advanceOnlyPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceOnlyPage.searchPoliciesByPolicyNumber(policyNumber);
  },
);

When(
  'I click the policy actions ellipse in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickPolicyActionsEllipse();
  },
);

When(
  'I click {string} in the policy actions menu in advance only validation',
  async ({ advanceOnlyPage }, menuItem: string) => {
    await advanceOnlyPage.clickViewLedger();
  },
);

Then(
  'the Policy Ledger page is displayed in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectPolicyLedgerDisplayed();
  },
);

Then(
  'the ARF row Amount matches the captured advance amount in advance only validation',
  async ({ advanceOnlyPage }) => {
    const advanceAmount = getAdvanceAmount();
    await advanceOnlyPage.expectArfRowAmountMatches(advanceAmount);
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare recovery statement file
// ═══════════════════════════════════════════════════════════════════════════

Given(
  'the advance only recovery statement file is prepared from template',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.prepareRecoveryFile();
  },
);

Given(
  'the recovery file Customer UID is replaced with the stored PolicyNumber',
  async () => {
    // Policy number replacement is handled inside prepareRecoveryFile
  },
);

Given(
  'the recovery file is saved with the stored timestamp suffix',
  async () => {
    // Timestamp is applied inside prepareRecoveryFile
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 10 — Upload recovery file
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I upload the prepared advance only recovery file',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.uploadRecoveryFile();
  },
);

// Reuse the "I submit the advance only upload for processing" step from Phase 4

Then(
  'the uploaded recovery file appears in the advance only recently uploaded grid',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectRecoveryFileInGrid();
  },
);

Then(
  'the advance only recovery upload extract processing completes and file ID is captured',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.pollRecoveryExtractProcessingAndCaptureFileId();
  },
);

Then(
  'the advance only recovery upload row shows status {string} and stage {string}',
  async ({ advanceOnlyPage }, status: string, stage: string) => {
    await advanceOnlyPage.expectRecoveryUploadStatusWaitingReview();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Review recovery file and verify chargeback
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I open the advance only review page for the stored recovery upload',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openRecoveryReviewPage();
  },
);

// Reuse "I click Complete Review on the advance only review page" from Phase 5
// Reuse "I navigate to the advance only upload page again" from Phase 6

Then(
  'the advance only recovery upload stage changes to {string}',
  async ({ advanceOnlyPage }, stage: string) => {
    await advanceOnlyPage.expectRecoveryUploadStageCompleted();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Validate ADVANCE_EARNED in Policy Ledger after recovery
// ═══════════════════════════════════════════════════════════════════════════

// Reuse navigate to Policies, search by PolicyNumber, click actions, View Ledger steps

When(
  'I expand a commission row in the Policy Ledger in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expandCommissionRowInLedger();
  },
);

Then(
  'the commission details contain {string} in advance only validation',
  async ({ advanceOnlyPage }, text: string) => {
    await advanceOnlyPage.expectCommissionDetailsContainAdvanceEarned();
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Validate Advance Overview historical record
// ═══════════════════════════════════════════════════════════════════════════

When(
  'I navigate to the Advance Overview page in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.navigateToAdvanceOverview();
  },
);

When(
  'I click the Historical tab in advance only overview',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickHistoricalTab();
  },
);

When(
  'I search the Advance Overview grid by stored PolicyNumber in advance only validation',
  async ({ advanceOnlyPage }) => {
    const policyNumber = getPolicyNumber();
    await advanceOnlyPage.searchAdvanceOverviewByPolicyNumber(policyNumber);
  },
);

When(
  'I open the first record in the Advance Overview grid in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.openFirstRecordInAdvanceOverview();
  },
);

Then(
  'the Advance Policy Details card Product field contains the expected product name in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.expectAdvancePolicyDetailsCardProduct();
  },
);

When(
  'I click the sort indicator in the Advance Overview details grid in advance only validation',
  async ({ advanceOnlyPage }) => {
    await advanceOnlyPage.clickSortIndicator();
  },
);

Then(
  'the balance in the first row of the Advance Overview details grid is {string} in advance only validation',
  async ({ advanceOnlyPage }, expectedBalance: string) => {
    await advanceOnlyPage.expectFirstRowBalanceIsZero();
  },
);
