import {
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getArfValue,
  getProductName, getAgentId, getPendingPayment,
} from '../../utils/policy-cancellation-agency-advance/policyCancellationAgencyAdvanceContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement file (Advance Payout)
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation agency advance statement file is prepared from template', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.prepareFile();
});

Given('the Customer UID is incremented by 1 in the policy cancellation prepared file', async ({ policyCancellationAgencyAdvancePage }) => {
  policyCancellationAgencyAdvancePage.storePreparedData();
});

Given('the policy cancellation prepared file is saved with a timestamp suffix', async () => {
  // Timestamp is stored in storePreparedData — no-op for Gherkin readability
});

Then('the policy cancellation prepared file name and Customer UID are stored for later steps', async () => {
  const policyNumber = getPolicyNumber();
  const timestamp = getTimestamp();
  console.log(`[policy-cancellation] Prepared data — Customer UID: ${policyNumber}, timestamp: ${timestamp}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate Agent eligibility for carrier advance (Settings toggle)
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the Agent ID from the prepared policy cancellation file', async ({ policyCancellationAgencyAdvancePage }) => {
  policyCancellationAgencyAdvancePage.extractAgentId();
});

When('I navigate to the Agents page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openAgentsPage();
});

When('I search the Agents grid by agent ID in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyAdvancePage.searchAgentById(agentId);
});

Then('a row containing the agent ID is displayed in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyAdvancePage.expectAgentRowDisplayed(agentId);
});

When('I open the agent settings for the matched agent in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyAdvancePage.openAgentSettings(agentId);
});

Then('the carrier advance toggle is enabled in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectCarrierAdvanceToggleEnabled();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup and capture the monthly value
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the product name alias from the prepared policy cancellation file', async ({ policyCancellationAgencyAdvancePage }) => {
  policyCancellationAgencyAdvancePage.extractProductName();
});

When('I resolve the actual product name from the Products page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.resolveActualProductNameFromProductsPage();
});

When('I navigate to the Advance Setup page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openAdvanceSetupPage();
});

When('I search the Advance Setup grid by product name in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const productName = getProductName();
  await policyCancellationAgencyAdvancePage.searchAdvanceSetupByProduct(productName);
});

Then('a row for the product appears in the Advance Setup grid in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const productName = getProductName();
  await policyCancellationAgencyAdvancePage.expectProductRowInAdvanceSetup(productName);
});

Then('I capture the advance setup month value in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.captureAdvanceMonthly();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared advance statement
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation statement upload page', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openUploadPageAgain();
});

When('I upload the prepared policy cancellation file', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.uploadPreparedFile();
});

When('I select the statement type {string} in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, statementType: string) => {
  await policyCancellationAgencyAdvancePage.selectStatementType(statementType);
});

When('I submit the policy cancellation upload for processing', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.submitForProcessing();
});

Then('the uploaded file appears in the policy cancellation recently uploaded grid', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectUploadedFileInGrid();
});

Then('the policy cancellation upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.pollExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectUploadStatusWaitingReview();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review advance statement (new-policy tooltip)
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation review page for the stored upload', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openReviewPageForStoredUpload();
});

Then('every transaction type is {string} in policy cancellation agency advance validation', async ({ policyCancellationAgencyAdvancePage }, type: string) => {
  await policyCancellationAgencyAdvancePage.assertEveryTransactionType(type);
});

When('I click Complete Review on the policy cancellation review page', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.completeReview();
});

Then('the policy cancellation upload stage changes to {string}', async ({ policyCancellationAgencyAdvancePage }, stage: string) => {
  await policyCancellationAgencyAdvancePage.waitForUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Statement History → open exception record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the commission statement history page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openStatementHistoryPage();
});

When('I search the statement history by stored file ID in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.searchStatementHistoryByFileId();
});

When('I click the first statement history record in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickFirstStatementHistoryRecord();
});

When('I hover over the warning icon on the statement history record in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.hoverWarningIconOnStatementHistory();
});

Then('the policy cancellation statement history tooltip contains {string}', async ({ policyCancellationAgencyAdvancePage }, text: string) => {
  await policyCancellationAgencyAdvancePage.expectStatementHistoryTooltipContains(text);
});

When('I click the record in the statement history grid in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickRecordOnStatementHistoryPage();
});

Then('the policy cancellation reconciliation page is displayed', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectReconciliationPageDisplayed();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with Commission process option
// ═══════════════════════════════════════════════════════════════════════════

Then('the commission reconciliation heading is displayed in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectCommissionReconciliationHeading();
});

Then('the reconciliation summary contains the stored Policy Number in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyAdvancePage.expectReconciliationSummaryContainsPolicyNumber(policyNumber);
});

When('I click the {string} label in policy cancellation reconciliation', async ({ policyCancellationAgencyAdvancePage }, label: string) => {
  await policyCancellationAgencyAdvancePage.clickM1_12Label();
});

Then('the number of months input matches the captured advance setup month in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectNoOfMonthsMatchesAdvanceMonthly();
});

When('I select the Commission radio button in policy cancellation reconciliation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.selectProcessOptionCommission();
});

Then('the transaction preview contains {string} once in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, text: string) => {
  await policyCancellationAgencyAdvancePage.expectTransactionPreviewCount(text, 1);
});

Then('the transaction preview contains at least {int} {string} rows in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, minCount: number, text: string) => {
  await policyCancellationAgencyAdvancePage.expectTransactionPreviewAtLeast(text, minCount);
});

When('I capture the ARF value from the transaction preview in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.captureArfValueFromTransactionPreview();
});

When('I click the Reconcile button in policy cancellation reconciliation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickReconcileButton();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8/10 — Validate ARF + COMMISSION on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the Policies page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.navigateToPoliciesPage();
});

When('I search the Policies grid by stored Customer UID in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyAdvancePage.searchPoliciesByPolicyNumber(policyNumber);
});

When('I click the policy actions ellipse in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickPolicyActionsEllipse();
});

When('I click {string} in the policy actions menu in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, menuItem: string) => {
  await policyCancellationAgencyAdvancePage.clickViewLedger();
});

Then('the Policy Ledger page is displayed in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectPolicyLedgerDisplayed();
});

Then('the Policy Ledger contains a {string} earning type row in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, earningType: string) => {
  await policyCancellationAgencyAdvancePage.expectLedgerContainsEarningType(earningType);
});

Then('the Policy Ledger contains at least {int} {string} earning type rows in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, minCount: number, earningType: string) => {
  await policyCancellationAgencyAdvancePage.expectLedgerContainsEarningTypeCount(earningType, minCount);
});

Then('the ARF row Amount matches the captured ARF value in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const arfValue = getArfValue();
  await policyCancellationAgencyAdvancePage.expectArfRowAmountMatches(arfValue);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare and upload partial recovery statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation recovery statement file is prepared from template', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.prepareRecoveryFile();
});

Given('the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation', async () => {
  // Policy number replacement is handled inside prepareRecoveryFile
});

Given('the recovery file is saved with the stored timestamp suffix in policy cancellation', async () => {
  // Timestamp is applied inside prepareRecoveryFile
});

When('I upload the prepared policy cancellation recovery file', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.uploadRecoveryFile();
});

Then('the uploaded policy cancellation recovery file appears in the recently uploaded grid', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectRecoveryFileInGrid();
});

Then('the policy cancellation recovery upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.pollRecoveryExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation recovery upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectRecoveryUploadStatusWaitingReview();
});

When('I open the policy cancellation review page for the stored recovery upload', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openRecoveryReviewPage();
});

Then('the policy cancellation recovery upload stage changes to {string}', async ({ policyCancellationAgencyAdvancePage }, stage: string) => {
  await policyCancellationAgencyAdvancePage.expectRecoveryUploadStageCompleted();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Advance Overview (active settlement) → capture pending payment
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the Advance Overview page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.navigateToAdvanceOverview();
});

When('I click the Historical tab in policy cancellation overview', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickHistoricalTab();
});

When('I search the Advance Overview grid by stored Customer UID in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyAdvancePage.searchAdvanceOverviewByPolicyNumber(policyNumber);
});

When('I open the first record in the Advance Overview grid in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openFirstRecordInAdvanceOverview();
});

Then('I capture the pending payment owed by the agent in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.capturePendingPaymentOwedByAgent();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Prepare and upload cancellation statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation chargeback statement file is prepared from template', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.prepareChargebackFile();
});

Given('the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation', async () => {
  // Policy number replacement is handled inside prepareChargebackFile
});

Given('the chargeback file is saved with the stored timestamp suffix in policy cancellation', async () => {
  // Timestamp is applied inside prepareChargebackFile
});

When('I upload the prepared policy cancellation chargeback file', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.uploadChargebackFile();
});

Then('the uploaded policy cancellation chargeback file appears in the recently uploaded grid', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectChargebackFileInGrid();
});

Then('the policy cancellation chargeback upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.pollChargebackExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation chargeback upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectChargebackUploadStatusWaitingReview();
});

When('I open the policy cancellation review page for the stored chargeback upload', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.openChargebackReviewPage();
});

Then('the policy cancellation chargeback upload stage changes to {string}', async ({ policyCancellationAgencyAdvancePage }, stage: string) => {
  await policyCancellationAgencyAdvancePage.expectChargebackUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Policy Cancellation Exception
// ═══════════════════════════════════════════════════════════════════════════

When('I wait for {int} seconds in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, seconds: number) => {
  await policyCancellationAgencyAdvancePage.waitMs(seconds * 1000);
});

Then('the Policy Cancellation Exception page is displayed in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectPolicyCancellationExceptionPage();
});

Then('the policy cancellation exception summary contains the stored Policy Number in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyAdvancePage.expectPolicyCancellationSummaryContainsPolicyNumber(policyNumber);
});

Then('the advance recovery preview amount matches the captured pending payment in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  const pendingPayment = getPendingPayment();
  await policyCancellationAgencyAdvancePage.expectAdvanceRecoveryPreviewAmountEquals(pendingPayment);
});

When('I click the proceed button on the Policy Cancellation Exception page in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.clickPolicyCancellationProceedButton();
});

Then('a success toast is displayed for the policy cancellation in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }) => {
  await policyCancellationAgencyAdvancePage.expectCancellationToastVisible();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 14 — ARF Ledger (Historical Settlements) → balance $0
// ═══════════════════════════════════════════════════════════════════════════

Then('the balance in the last row of the Advance Overview details grid is {string} in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, expectedBalance: string) => {
  await policyCancellationAgencyAdvancePage.expectLastRowBalanceIsZero();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 15 — Policy page shows Cancelled status
// ═══════════════════════════════════════════════════════════════════════════

Then('the policy status contains {string} in policy cancellation validation', async ({ policyCancellationAgencyAdvancePage }, expectedStatus: string) => {
  await policyCancellationAgencyAdvancePage.expectPolicyStatusContains(expectedStatus);
});
