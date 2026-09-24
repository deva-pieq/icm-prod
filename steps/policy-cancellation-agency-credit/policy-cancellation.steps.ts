import {
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getProductName,
  getAgentId, getAgencyCredit,
} from '../../utils/policy-cancellation-agency-credit/policyCancellationAgencyCreditContext';
import { Given, When, Then } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1 — Prepare statement file (Advance Payout)
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation agency credit statement file is prepared from template', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.prepareFile();
});

Given('the Customer UID is incremented by 1 in the policy cancellation agency credit prepared file', async ({ policyCancellationAgencyCreditPage }) => {
  policyCancellationAgencyCreditPage.storePreparedData();
});

Given('the policy cancellation agency credit prepared file is saved with a timestamp suffix', async () => {
  // Timestamp is stored in storePreparedData — no-op for Gherkin readability
});

Then('the policy cancellation agency credit prepared file name and Customer UID are stored for later steps', async () => {
  const policyNumber = getPolicyNumber();
  const timestamp = getTimestamp();
  console.log(`[policy-cancellation-agency-credit] Prepared data — Customer UID: ${policyNumber}, timestamp: ${timestamp}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — Validate agent is NOT eligible for advance (Settings toggle OFF)
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the Agent ID from the prepared policy cancellation agency credit file', async ({ policyCancellationAgencyCreditPage }) => {
  policyCancellationAgencyCreditPage.extractAgentId();
});

When('I navigate to the Agents page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openAgentsPage();
});

When('I search the Agents grid by agent ID in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyCreditPage.searchAgentById(agentId);
});

Then('a row containing the agent ID is displayed in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyCreditPage.expectAgentRowDisplayed(agentId);
});

When('I open the agent settings for the matched agent in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const agentId = getAgentId();
  await policyCancellationAgencyCreditPage.openAgentSettings(agentId);
});

Then('the advance eligibility toggle is turned off in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectAdvanceEligibilityToggleDisabled();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3 — Validate product advance setup and capture the monthly value
// ═══════════════════════════════════════════════════════════════════════════

When('I extract the product name alias from the prepared policy cancellation agency credit file', async ({ policyCancellationAgencyCreditPage }) => {
  policyCancellationAgencyCreditPage.extractProductName();
});

When('I resolve the actual product name from the Products page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.resolveActualProductNameFromProductsPage();
});

When('I navigate to the Advance Setup page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openAdvanceSetupPage();
});

When('I search the Advance Setup grid by product name in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const productName = getProductName();
  await policyCancellationAgencyCreditPage.searchAdvanceSetupByProduct(productName);
});

Then('a row for the product appears in the Advance Setup grid in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const productName = getProductName();
  await policyCancellationAgencyCreditPage.expectProductRowInAdvanceSetup(productName);
});

Then('I capture the advance setup month value in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.captureAdvanceMonthly();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4 — Upload the prepared advance statement
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation agency credit statement upload page', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openUploadPageAgain();
});

When('I upload the prepared policy cancellation agency credit file', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.uploadPreparedFile();
});

When('I select the statement type {string} in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, statementType: string) => {
  await policyCancellationAgencyCreditPage.selectStatementType(statementType);
});

When('I submit the policy cancellation agency credit upload for processing', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.submitForProcessing();
});

Then('the uploaded file appears in the policy cancellation agency credit recently uploaded grid', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectUploadedFileInGrid();
});

Then('the policy cancellation agency credit upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.pollExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation agency credit upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectUploadStatusWaitingReview();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 5 — Review advance statement (new-policy tooltip)
// ═══════════════════════════════════════════════════════════════════════════

When('I open the policy cancellation agency credit review page for the stored upload', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openReviewPageForStoredUpload();
});

Then('every transaction type is {string} in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, type: string) => {
  await policyCancellationAgencyCreditPage.assertEveryTransactionType(type);
});

When('I click Complete Review on the policy cancellation agency credit review page', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.completeReview();
});

Then('the policy cancellation agency credit upload stage changes to {string}', async ({ policyCancellationAgencyCreditPage }, stage: string) => {
  await policyCancellationAgencyCreditPage.waitForUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6 — Statement History → open exception record for reconciliation
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the commission statement history page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openStatementHistoryPage();
});

When('I search the statement history by stored file ID in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.searchStatementHistoryByFileId();
});

When('I refresh the statement history grid in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.refreshStatementHistoryGridAfterSearch();
});

When('I click the first statement history record in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickFirstStatementHistoryRecord();
});

When('I hover over the warning icon on the statement history record in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.hoverWarningIconOnStatementHistory();
});

Then('the policy cancellation agency credit statement history tooltip contains {string}', async ({ policyCancellationAgencyCreditPage }, text: string) => {
  await policyCancellationAgencyCreditPage.expectStatementHistoryTooltipContains(text);
});

When('I click the record in the statement history grid in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickRecordOnStatementHistoryPage();
});

Then('the policy cancellation agency credit reconciliation page is displayed', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectReconciliationPageDisplayed();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — Reconcile with commission-type option + rationale
// ═══════════════════════════════════════════════════════════════════════════

Then('the commission reconciliation heading is displayed in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectCommissionReconciliationHeading();
});

Then('the reconciliation summary contains the stored Policy Number in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyCreditPage.expectReconciliationSummaryContainsPolicyNumber(policyNumber);
});

When('I click the commission type radio in policy cancellation agency credit reconciliation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickCommissionTypeRadio();
});

When('I fill the reconcile rationale in policy cancellation agency credit reconciliation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.fillReconcileRationale();
});

When('I capture the Agency Credit value from the reconciliation summary in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.captureAgencyCreditFromReconciliationSummary();
});

When('I click the Reconcile button in policy cancellation agency credit reconciliation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickReconcileButton();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 8/10 — Validate AGENCY_CREDIT / AGENCY_DEBIT on Policy Ledger
// ═══════════════════════════════════════════════════════════════════════════

When('I navigate to the Policies page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.navigateToPoliciesPage();
});

When('I search the Policies grid by stored Customer UID in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyCreditPage.searchPoliciesByPolicyNumber(policyNumber);
});

When('I click the policy actions ellipse in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickPolicyActionsEllipse();
});

When('I click {string} in the policy actions menu in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, menuItem: string) => {
  await policyCancellationAgencyCreditPage.clickViewLedger();
});

Then('the Policy Ledger page is displayed in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectPolicyLedgerDisplayed();
});

Then('the Policy Ledger contains a {string} earning type row in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, earningType: string) => {
  await policyCancellationAgencyCreditPage.expectLedgerContainsEarningType(earningType);
});

Then('the Policy Ledger contains at least {int} {string} earning type rows in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, minCount: number, earningType: string) => {
  await policyCancellationAgencyCreditPage.expectLedgerContainsEarningTypeCount(earningType, minCount);
});

Then('the AGENCY_CREDIT row Amount matches the captured Agency Credit value in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const agencyCredit = getAgencyCredit();
  await policyCancellationAgencyCreditPage.expectAgencyCreditRowAmountMatches(agencyCredit);
});

When('I click the AGENCY_DEBIT row in the policy ledger in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickAgencyDebitRowInLedger();
});

Then('the AGENCY_DEBIT detail row contains {string} in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, text: string) => {
  await policyCancellationAgencyCreditPage.expectAgencyDebitDetailRowContainsCommission();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9 — Prepare and upload partial recovery statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation agency credit recovery statement file is prepared from template', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.prepareRecoveryFile();
});

Given('the recovery file Customer UID is replaced with the stored PolicyNumber in policy cancellation agency credit', async () => {
  // Policy number replacement is handled inside prepareRecoveryFile
});

Given('the recovery file is saved with the stored timestamp suffix in policy cancellation agency credit', async () => {
  // Timestamp is applied inside prepareRecoveryFile
});

When('I upload the prepared policy cancellation agency credit recovery file', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.uploadRecoveryFile();
});

Then('the uploaded policy cancellation agency credit recovery file appears in the recently uploaded grid', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectRecoveryFileInGrid();
});

Then('the policy cancellation agency credit recovery upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.pollRecoveryExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation agency credit recovery upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectRecoveryUploadStatusWaitingReview();
});

When('I open the policy cancellation agency credit review page for the stored recovery upload', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openRecoveryReviewPage();
});

Then('the policy cancellation agency credit recovery upload stage changes to {string}', async ({ policyCancellationAgencyCreditPage }, stage: string) => {
  await policyCancellationAgencyCreditPage.expectRecoveryUploadStageCompleted();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 11 — Prepare and upload cancellation statement
// ═══════════════════════════════════════════════════════════════════════════

Given('the policy cancellation agency credit chargeback statement file is prepared from template', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.prepareChargebackFile();
});

Given('the chargeback file Customer UID is replaced with the stored PolicyNumber in policy cancellation agency credit', async () => {
  // Policy number replacement is handled inside prepareChargebackFile
});

Given('the chargeback file is saved with the stored timestamp suffix in policy cancellation agency credit', async () => {
  // Timestamp is applied inside prepareChargebackFile
});

When('I upload the prepared policy cancellation agency credit chargeback file', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.uploadChargebackFile();
});

Then('the uploaded policy cancellation agency credit chargeback file appears in the recently uploaded grid', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectChargebackFileInGrid();
});

Then('the policy cancellation agency credit chargeback upload extract processing completes and file ID is captured', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.pollChargebackExtractProcessingAndCaptureFileId();
});

Then('the policy cancellation agency credit chargeback upload row shows status {string} and stage {string}', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectChargebackUploadStatusWaitingReview();
});

When('I open the policy cancellation agency credit review page for the stored chargeback upload', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.openChargebackReviewPage();
});

Then('the policy cancellation agency credit chargeback upload stage changes to {string}', async ({ policyCancellationAgencyCreditPage }, stage: string) => {
  await policyCancellationAgencyCreditPage.expectChargebackUploadStage(stage);
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 12 — Policy Cancellation Exception
// ═══════════════════════════════════════════════════════════════════════════

When('I wait for {int} seconds in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, seconds: number) => {
  await policyCancellationAgencyCreditPage.waitMs(seconds * 1000);
});

Then('the Policy Cancellation Exception page is displayed in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectPolicyCancellationExceptionPage();
});

Then('the policy cancellation exception summary contains the stored Policy Number in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  const policyNumber = getPolicyNumber();
  await policyCancellationAgencyCreditPage.expectPolicyCancellationSummaryContainsPolicyNumber(policyNumber);
});

Then('the policy cancellation agency info banner is displayed in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectAgencyInfoBannerDisplayed();
});

When('I click the Policy Ledger button on the Policy Cancellation Exception page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickPolicyLedgerModalButton();
});

Then('I capture the Total Chargebacks value in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.captureTotalChargeback();
});

Then('I capture the Total Earnings value in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.captureTotalEarnings();
});

When('I close the policy ledger modal in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.closePolicyLedgerModal();
});

When('I capture the agency debit value from the advance recovery preview in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.captureAgencyDebitFromPreview();
});

Then('the agency debit equals the Total Earnings minus Total Chargebacks in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.expectAgencyDebitEqualsEarningsMinusChargeback();
});

When('I click the proceed button on the Policy Cancellation Exception page in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }) => {
  await policyCancellationAgencyCreditPage.clickPolicyCancellationProceedButton();
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 13 — Policy page shows Cancelled status
// ═══════════════════════════════════════════════════════════════════════════

Then('the policy status contains {string} in policy cancellation agency credit validation', async ({ policyCancellationAgencyCreditPage }, expectedStatus: string) => {
  await policyCancellationAgencyCreditPage.expectPolicyStatusContains(expectedStatus);
});
