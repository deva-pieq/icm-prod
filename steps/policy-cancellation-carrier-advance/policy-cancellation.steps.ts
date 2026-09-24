import {
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getArfValue,
  getProductName, getAgentId,
} from '../../utils/policy-cancellation-carrier-advance/policyCancellationCarrierAdvanceContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement file (Advance Payout)
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation carrier advance statement file is prepared from template', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.prepareFile();
});

Given('the Customer UID is incremented by 1 in the policy cancellation carrier advance prepared file', async ({ policyCancellationCarrierAdvancePage }) => {
  policyCancellationCarrierAdvancePage.storePreparedData();
});

Given('the policy cancellation carrier advance prepared file is saved with a timestamp suffix', async () => {
  // Timestamp is stored in storePreparedData — no-op for Gherkin readability
});

Then('the policy cancellation carrier advance prepared file name and Customer UID are stored for later steps', async () => {
  const policyNumber = getPolicyNumber();
  const timestamp = getTimestamp();
  console.log(`[policy-cancellation-carrier-advance] Prepared data — Customer UID: ${policyNumber}, timestamp: ${timestamp}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance (Settings toggle)
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the Agent ID from the prepared policy cancellation carrier advance file', async ({ policyCancellationCarrierAdvancePage }) => {
  policyCancellationCarrierAdvancePage.extractAgentId();
});

When('I navigate to the Agents page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openAgentsPage();
});

When('I search the Agents grid by agent ID in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationCarrierAdvancePage.searchAgentById(agentId);
});

Then('a row containing the agent ID is displayed in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationCarrierAdvancePage.expectAgentRowDisplayed(agentId);
});

When('I open the agent settings for the matched agent in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationCarrierAdvancePage.openAgentSettings(agentId);
});

Then('the carrier advance toggle is enabled in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectCarrierAdvanceToggleEnabled();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup and capture the monthly value
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the product name alias from the prepared policy cancellation carrier advance file', async ({ policyCancellationCarrierAdvancePage }) => {
  policyCancellationCarrierAdvancePage.extractProductName();
});

When('I resolve the actual product name from the Products page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.resolveActualProductNameFromProductsPage();
});

When('I navigate to the Advance Setup page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openAdvanceSetupPage();
});

When('I search the Advance Setup grid by product name in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const productName = getProductName();
  await policyCancellationCarrierAdvancePage.searchAdvanceSetupByProduct(productName);
});

Then('a row for the product appears in the Advance Setup grid in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const productName = getProductName();
  await policyCancellationCarrierAdvancePage.expectProductRowInAdvanceSetup(productName);
});

Then('I capture the advance setup month value in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.captureAdvanceMonthly();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared advance statement
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation carrier advance statement upload page', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openUploadPageAgain();
});

When('I upload the prepared policy cancellation carrier advance file', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.uploadPreparedFile();
});

When('I select the statement type {string} in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, statementType: string) => {
  await policyCancellationCarrierAdvancePage.selectStatementType(statementType);
});

When('I submit the policy cancellation carrier advance upload for processing', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.submitForProcessing();
});

Then('the uploaded file appears in the policy cancellation carrier advance recently uploaded grid', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectUploadedFileInGrid();
});

Then('the policy cancellation carrier advance upload extract processing completes and file ID is captured', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.pollExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation carrier advance upload row shows status {string} and stage {string}', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectUploadStatusWaitingReview();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review advance statement (new-policy tooltip)
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation carrier advance review page for the stored upload', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openReviewPageForStoredUpload();
});

Then('every transaction type is {string} in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, type: string) => {
  await policyCancellationCarrierAdvancePage.assertEveryTransactionType(type);
});

When('I click Complete Review on the policy cancellation carrier advance review page', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.completeReview();
});

Then('the policy cancellation carrier advance upload stage changes to {string}', async ({ policyCancellationCarrierAdvancePage }, stage: string) => {
  await policyCancellationCarrierAdvancePage.waitForUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Statement History → open exception record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the commission statement history page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openStatementHistoryPage();
});

When('I search the statement history by stored file ID in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.searchStatementHistoryByFileId();
});

When('I refresh the statement history grid in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.refreshStatementHistoryGridAfterSearch();
});

When('I click the first statement history record in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickFirstStatementHistoryRecord();
});

When('I hover over the warning icon on the statement history record in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.hoverWarningIconOnStatementHistory();
});

Then('the policy cancellation carrier advance statement history tooltip contains {string}', async ({ policyCancellationCarrierAdvancePage }, text: string) => {
  await policyCancellationCarrierAdvancePage.expectStatementHistoryTooltipContains(text);
});

When('I click the record in the statement history grid in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickRecordOnStatementHistoryPage();
});

Then('the policy cancellation carrier advance reconciliation page is displayed', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectReconciliationPageDisplayed();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Advance Only process option
// ═══════════════════════════════════════════════════════════════════════════

Then('the commission reconciliation heading is displayed in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectCommissionReconciliationHeading();
});

Then('the reconciliation summary contains the stored Policy Number in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationCarrierAdvancePage.expectReconciliationSummaryContainsPolicyNumber(policyNumber);
});

When('I click the {string} label in policy cancellation carrier advance reconciliation', async ({ policyCancellationCarrierAdvancePage }, label: string) => {
  await policyCancellationCarrierAdvancePage.clickM1_12Label();
});

Then('the number of months input matches the captured advance setup month in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectNoOfMonthsMatchesAdvanceMonthly();
});

When('I select the Advance Only radio button in policy cancellation carrier advance reconciliation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.selectProcessOptionAdvanceOnly();
});

Then('the transaction preview contains {string} once in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, text: string) => {
  await policyCancellationCarrierAdvancePage.expectTransactionPreviewCount(text, 1);
});

When('I capture the ARF value from the transaction preview in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.captureArfValueFromTransactionPreview();
});

When('I capture the Agency Credit value from the transaction preview in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.captureAgencyCreditFromTransactionPreview();
});

When('I click the Reconcile button in policy cancellation carrier advance reconciliation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickReconcileButton();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8/10 — Validate ARF + COMMISSION on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the Policies page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.navigateToPoliciesPage();
});

When('I search the Policies grid by stored Customer UID in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationCarrierAdvancePage.searchPoliciesByPolicyNumber(policyNumber);
});

When('I click the policy actions ellipse in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickPolicyActionsEllipse();
});

When('I click {string} in the policy actions menu in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, menuItem: string) => {
  await policyCancellationCarrierAdvancePage.clickViewLedger();
});

Then('the Policy Ledger page is displayed in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectPolicyLedgerDisplayed();
});

Then('the Policy Ledger contains a {string} earning type row in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, earningType: string) => {
  await policyCancellationCarrierAdvancePage.expectLedgerContainsEarningType(earningType);
});

Then('the Policy Ledger contains at least {int} {string} earning type rows in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, minCount: number, earningType: string) => {
  await policyCancellationCarrierAdvancePage.expectLedgerContainsEarningTypeCount(earningType, minCount);
});

Then('the ARF row Amount matches the captured ARF value in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const arfValue = getArfValue();
  await policyCancellationCarrierAdvancePage.expectArfRowAmountMatches(arfValue);
});

When('I expand a COMMISSION row in the policy ledger in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expandCommissionRowInLedger();
});

Then('the COMMISSION detail row contains {string} in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, earningType: string) => {
  await policyCancellationCarrierAdvancePage.expectCommissionDetailRowContainsAdvanceEarn();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare and upload partial recovery statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation carrier advance recovery statement file is prepared from template', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.prepareRecoveryFile();
});

Given('the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation carrier advance', async () => {
  // Policy number replacement is handled inside prepareRecoveryFile
});

Given('the recovery file is saved with the stored timestamp suffix in policy cancellation carrier advance', async () => {
  // Timestamp is applied inside prepareRecoveryFile
});

When('I upload the prepared policy cancellation carrier advance recovery file', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.uploadRecoveryFile();
});

Then('the uploaded policy cancellation carrier advance recovery file appears in the recently uploaded grid', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectRecoveryFileInGrid();
});

Then('the policy cancellation carrier advance recovery upload extract processing completes and file ID is captured', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.pollRecoveryExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation carrier advance recovery upload row shows status {string} and stage {string}', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectRecoveryUploadStatusWaitingReview();
});

When('I open the policy cancellation carrier advance review page for the stored recovery upload', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openRecoveryReviewPage();
});

Then('the policy cancellation carrier advance recovery upload stage changes to {string}', async ({ policyCancellationCarrierAdvancePage }, stage: string) => {
  await policyCancellationCarrierAdvancePage.expectRecoveryUploadStageCompleted();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Advance Overview (active settlement) → capture pending payment
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the Advance Overview page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.navigateToAdvanceOverview();
});

When('I click the Historical tab in policy cancellation carrier advance overview', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickHistoricalTab();
});

When('I search the Advance Overview grid by stored Customer UID in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationCarrierAdvancePage.searchAdvanceOverviewByPolicyNumber(policyNumber);
});

When('I open the first record in the Advance Overview grid in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openFirstRecordInAdvanceOverview();
});

Then('I capture the pending payment owed by the agent in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.capturePendingPaymentOwedByAgent();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Prepare and upload cancellation statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation carrier advance chargeback statement file is prepared from template', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.prepareChargebackFile();
});

Given('the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation carrier advance', async () => {
  // Policy number replacement is handled inside prepareChargebackFile
});

Given('the chargeback file is saved with the stored timestamp suffix in policy cancellation carrier advance', async () => {
  // Timestamp is applied inside prepareChargebackFile
});

When('I upload the prepared policy cancellation carrier advance chargeback file', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.uploadChargebackFile();
});

Then('the uploaded policy cancellation carrier advance chargeback file appears in the recently uploaded grid', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectChargebackFileInGrid();
});

Then('the policy cancellation carrier advance chargeback upload extract processing completes and file ID is captured', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.pollChargebackExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation carrier advance chargeback upload row shows status {string} and stage {string}', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectChargebackUploadStatusWaitingReview();
});

When('I open the policy cancellation carrier advance review page for the stored chargeback upload', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.openChargebackReviewPage();
});

Then('the policy cancellation carrier advance chargeback upload stage changes to {string}', async ({ policyCancellationCarrierAdvancePage }, stage: string) => {
  await policyCancellationCarrierAdvancePage.expectChargebackUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Policy Cancellation Exception
// ═══════════════════════════════════════════════════════════════════════════

When('I wait for {int} seconds in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, seconds: number) => {
  await policyCancellationCarrierAdvancePage.waitMs(seconds * 1000);
});

Then('the Policy Cancellation Exception page is displayed in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectPolicyCancellationExceptionPage();
});

Then('the policy cancellation exception summary contains the stored Policy Number in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationCarrierAdvancePage.expectPolicyCancellationSummaryContainsPolicyNumber(policyNumber);
});

Then('the chargeback ARF amount matches the cancellation template in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectChargebackAmountEqualsTemplateChargeback();
});

When('I click the proceed button on the Policy Cancellation Exception page in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.clickPolicyCancellationProceedButton();
});

Then('a success toast is displayed for the policy cancellation in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }) => {
  await policyCancellationCarrierAdvancePage.expectCancellationToastVisible();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 14 — ARF Ledger (Historical Settlements) → balance $0
// ═══════════════════════════════════════════════════════════════════════════

Then('the balance in the last row of the Advance Overview details grid is {string} in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, expectedBalance: string) => {
  await policyCancellationCarrierAdvancePage.expectLastRowBalanceIsZero();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 15 — Policy page shows Cancelled status
// ═══════════════════════════════════════════════════════════════════════════

Then('the policy status contains {string} in policy cancellation carrier advance validation', async ({ policyCancellationCarrierAdvancePage }, expectedStatus: string) => {
  await policyCancellationCarrierAdvancePage.expectPolicyStatusContains(expectedStatus);
});
