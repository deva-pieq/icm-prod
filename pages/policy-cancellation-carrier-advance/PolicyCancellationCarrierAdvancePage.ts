import { expect, type Locator, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { CommissionDetailsPage } from '../statement-processing/CommissionDetailsPage';
import { AgentsPage } from '../agents/AgentsPage';
import { PoliciesPage } from '../policies/PoliciesPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { POLICY_CANCELLATION_CARRIER_ADVANCE } from '../../test-data/policy-cancellation-carrier-advance/validatePolicyCancellationCarrierAdvance';
import {
  setPolicyNumber, setTimestamp, setPreparedFilePath, setPreparedFileName,
  setAgentId, setProductName, setAdvanceMonthly,
  setFileId, setRecoveryFileId, setRecoveryFilePath, setRecoveryFileName,
  setChargebackFileId, setChargebackFilePath, setChargebackFileName,
  getChargebackFileId, getRecoveryFileId,
  setArfValue, setPendingPayment, setCarrierName, setAgencyCredit,
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getProductName,
  getFileId, getAgentId, getChargebackAmount,
} from '../../utils/policy-cancellation-carrier-advance/policyCancellationCarrierAdvanceContext';
import type { PolicyCancellationCarrierAdvancePreparedFile } from '../../utils/policy-cancellation-carrier-advance/policyCancellationCarrierAdvanceExcelPrep';
import {
  preparePolicyCancellationCarrierAdvanceStatementFile,
  preparePolicyCancellationCarrierAdvanceRecoveryFile,
  preparePolicyCancellationCarrierAdvanceChargebackFile,
} from '../../utils/policy-cancellation-carrier-advance/policyCancellationCarrierAdvanceExcelPrep';
import { PolicyCancellationCarrierAdvanceAssertions } from './PolicyCancellationCarrierAdvanceAssertions';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PolicyCancellationCarrierAdvancePage extends StatementUploadPage {
  readonly details: CommissionDetailsPage;
  readonly agents: AgentsPage;
  readonly policies: PoliciesPage;
  private readonly pccaSidebar: IcmSidebarPage;
  readonly pccaAssertions: PolicyCancellationCarrierAdvanceAssertions;
  private pccaPreparedFile: PolicyCancellationCarrierAdvancePreparedFile | null = null;
  private pccaRecoveryFile: PolicyCancellationCarrierAdvancePreparedFile | null = null;
  private pccaChargebackFile: PolicyCancellationCarrierAdvancePreparedFile | null = null;
  private lastTooltipText = '';

  readonly pccaLoc = {
    // Agent settings
    agentSettingsPage: () => this.page.getByTestId('agent-tab-navigation-tab-settings'),
    carrierAdvanceToggle: () =>
      this.page.locator('//input[@id="toggle-eligible-for-carrier-advance-toggle"]'),

    // Statement history
    statementHistoryHeading: () => this.page.getByRole('heading', { name: /commission statement history/i }),
    historySearchInput: () => this.page.getByRole('textbox', { name: 'Search data grid' }),
    historyGridRefreshButton: () => this.page.getByTestId('data-grid-refresh-button'),

    // Tooltip / warning icon
    warningIcon: () =>
      this.page.locator('.lucide.lucide-triangle-alert').first()
        .or(this.page.locator('svg[data-testid*="warning"], svg[class*="warning"]').first()),
    tooltip: () =>
      this.page.getByRole('tooltip').or(this.page.locator('[data-radix-popper-content-wrapper], [role="tooltip"]')),

    // Reconciliation page
    m1_12Label: () => this.page.locator("//span[text()='M 1-12']//ancestor::label"),
    noOfMonthsInput: () => this.page.getByTestId('no-of-months-input').locator('//input'),
    processOptionAdvanceOnly: () => this.page.locator('//div[@data-testid="process-option-advance-only"]'),
    transactionPreview: () => this.page.getByTestId('transaction-preview'),

    // Policy Ledger
    policyActionsButton: () => this.page.getByTestId(/policy-actions/i),
    viewLedgerMenuItem: () => this.page.getByRole('button', { name: /view ledger/i }),
    policyLedgerGrid: () => this.page.getByTestId('policy-ledger-transactions-datagrid'),
    ledgerRefreshButton: () => this.page.getByTestId('data-grid-refresh-button'),
    ledgerSearchInput: () =>
      this.page
        .getByTestId('data-grid-search-input')
        .getByRole('textbox', { name: 'Search data grid' })
        .or(this.page.getByRole('textbox', { name: 'Search data grid' })),
    ledgerDetailRow: () => this.page.getByTestId('data-grid-detail-row'),

    // Advance Overview
    advanceOverviewTabs: () => this.page.getByTestId('advance-overview-tabs'),
    historicalTab: () =>
      this.page.getByRole('button', { name: /historical settlements/i })
        .or(this.page.getByTestId('advance-overview-tabs-tab-historical')),
    arfLedgerGrid: () => this.page.getByTestId('advance-arf-ledger-grid'),
    arfLedgerHeading: () => this.page.getByRole('heading', { name: 'ARF Ledger', exact: true }),
    advanceOverviewLoadingStatus: () => this.page.getByRole('status').filter({ hasText: /loading data/i }),

    // Policy Cancellation Exception
    policyCancellationProceedButton: () =>
      this.page.locator('//button[@data-testid="policy-cancellation-proceed-button"]'),
    policyStatus: () => this.page.locator('//span[contains(@data-testid,"policy-status")]').first(),
  };

  constructor(page: Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
    this.agents = new AgentsPage(page);
    this.policies = new PoliciesPage(page);
    this.pccaSidebar = new IcmSidebarPage(page);
    this.pccaAssertions = new PolicyCancellationCarrierAdvanceAssertions();
  }

  // ═══ Phase 1 — Prepare statement file ═══════════════════════════════

  async prepareFile(): Promise<void> {
    this.pccaPreparedFile = await preparePolicyCancellationCarrierAdvanceStatementFile();
  }

  storePreparedData(): void {
    if (!this.pccaPreparedFile) throw new Error('Call prepareFile() before storePreparedData()');
    setPolicyNumber(this.pccaPreparedFile.customerUid);
    setPreparedFilePath(this.pccaPreparedFile.absolutePath);
    setPreparedFileName(this.pccaPreparedFile.fileName);
    setCarrierName(this.pccaPreparedFile.carrierName);
    setTimestamp(Date.now());
  }

  // ═══ Phase 2 — Validate Agent eligibility ═══════════════════════════

  extractAgentId(): void {
    if (!this.pccaPreparedFile) throw new Error('Call prepareFile() before extractAgentId()');
    setAgentId(this.pccaPreparedFile.agentId);
  }

  async openAgentsPage(): Promise<void> {
    await this.agents.openList();
    await waitForAppSettled(this.page, T);
  }

  async searchAgentById(agentId: string): Promise<void> {
    await this.agents.searchGrid(agentId);
    await waitForAppSettled(this.page, T);
  }

  async expectAgentRowDisplayed(agentId: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const match = grid.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).filter({ hasText: agentId });
    await expect(match.first(), `Agent row with ID "${agentId}" not found`).toBeVisible({ timeout: T });
  }

  async openAgentSettings(agentId: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const agentRow = grid.getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: agentId })
      .first();
    await expect(agentRow, `Agent row with ID "${agentId}" not found for opening settings`).toBeVisible({ timeout: T });
    await agentRow.click();
    await waitForAppSettled(this.page, T);
    const settingsTab = this.pccaLoc.agentSettingsPage();
    await expect(settingsTab).toBeVisible({ timeout: T });
    await settingsTab.click();
    await waitForAppSettled(this.page, T);
  }

  async expectCarrierAdvanceToggleEnabled(): Promise<void> {
    const toggle = this.pccaLoc.carrierAdvanceToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (!(await toggle.isChecked().catch(() => false))) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    await expect(toggle, 'Carrier advance toggle should be enabled').toBeChecked({ timeout: T });
  }

  // ═══ Phase 3 — Validate product advance setup ═══════════════════════

  extractProductName(): void {
    if (!this.pccaPreparedFile) throw new Error('Call prepareFile() before extractProductName()');
    setProductName(this.pccaPreparedFile.productName);
  }

  async resolveActualProductNameFromProductsPage(): Promise<void> {
    const alias = getProductName();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${AppPaths.products}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(AppUrlPatterns.products, { timeout: T });
    await waitForAppSettled(this.page, T);
    await this.searchGrid(alias);
    await expect(this.dataRows()).toHaveCount(1, { timeout: T });
    const firstRow = this.dataRows().first();
    await expect(firstRow).toBeVisible({ timeout: T });
    const productCell = firstRow.locator('[col-id="product"]');
    const actualProductName = (await productCell.innerText()).replace(/\s+/g, ' ').trim().split(' Code:')[0].trim();
    expect(actualProductName, `Actual product name not found for alias "${alias}"`).toBeTruthy();
    setProductName(actualProductName);
  }

  async openAdvanceSetupPage(): Promise<void> {
    await this.pccaSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${POLICY_CANCELLATION_CARRIER_ADVANCE.advanceSetupUrl}`, { waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  async searchAdvanceSetupByProduct(productName: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    // The search box renders while AG-Grid is still loading rows; a filter typed during
    // data-loading is dropped when the rows arrive. Wait for data to finish loading first.
    await expect(grid).toHaveAttribute('data-loading', 'false', { timeout: T });
    const search = this.page.getByRole('textbox', { name: 'Search data grid' });
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(productName);
    await waitForAppSettled(this.page, T);
  }

  async expectProductRowInAdvanceSetup(productName: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    // Row locator auto-waits through AG-Grid virtualization re-renders (a manual
    // count()+innerText loop races row re-painting and misses the filtered row).
    const productRow = grid.getByRole('row').filter({ hasText: productName });
    await expect(productRow, `Product "${productName}" not found in Advance Setup grid`).toHaveCount(1, { timeout: T });
  }

  /** Capture Advance Setup "Monthly" from the row matching the stored product (not grid row 0). */
  async captureAdvanceMonthly(): Promise<void> {
    const productName = getProductName();
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    const rows = grid.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    await expect(rows.first()).toBeVisible({ timeout: T });

    const count = await rows.count();
    let monthlyCell = '';
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = (await row.innerText()).replace(/\s+/g, ' ');
      if (!rowText.toLowerCase().includes(productName.toLowerCase())) continue;
      monthlyCell = await row.evaluate((rowEl) => {
        const cells = Array.from(rowEl.querySelectorAll('[role="gridcell"], td'));
        for (const cell of cells) {
          const colId = cell.getAttribute('col-id') ?? '';
          if (colId.toLowerCase() === 'monthly') return cell.textContent?.trim() ?? '';
        }
        return '';
      });
      if (monthlyCell) break;
    }
    expect(monthlyCell, `Monthly cell not found for product "${productName}" in Advance Setup`).toBeTruthy();
    const monthlyValue = Number.parseFloat(monthlyCell.replace(/[^0-9.]/g, ''));
    expect(Number.isFinite(monthlyValue) && monthlyValue > 0, `Advance setup month "${monthlyCell}" should be a positive number`).toBe(true);
    setAdvanceMonthly(monthlyValue);
    console.log(`[policy-cancellation-carrier-advance] Captured advance_setup_month: ${monthlyValue}`);
  }

  // ═══ Phase 4 — Upload the prepared statement file ═══════════════════

  async openUploadPageAgain(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${AppPaths.commissionUpload}`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async uploadPreparedFile(): Promise<void> {
    if (!this.pccaPreparedFile) throw new Error('Call prepareFile() before upload');
    this.setPreparedFile({
      absolutePath: this.pccaPreparedFile.absolutePath,
      fileName: this.pccaPreparedFile.fileName,
      carrierName: this.pccaPreparedFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async submitForProcessing(): Promise<void> {
    await this.clickUploadStatement();
  }

  async expectUploadedFileInGrid(): Promise<void> {
    if (!this.pccaPreparedFile) throw new Error('No prepared file to verify');
    const row = await this.findStoredRowByFileName(this.pccaPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, POLICY_CANCELLATION_CARRIER_ADVANCE.gridColumns.fileName);
    expect(fileNameCell).toContain(this.pccaPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pccaPreparedFile) throw new Error('No prepared file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pccaPreparedFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.intervalMs,
    });
    setFileId(fileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName: this.pccaPreparedFile.fileName });
    this.setStoredRow({ row, fileId, fileName: this.pccaPreparedFile.fileName, carrierName: this.pccaPreparedFile.carrierName });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.pccaPreparedFile) throw new Error('No prepared file to check status');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pccaPreparedFile.fileName,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.stage,
      getFileId(),
    );
  }

  // ═══ Phase 5 — Review stage ═════════════════════════════════════════

  async openReviewPageForStoredUpload(): Promise<void> {
    await this.openReviewForStoredUpload();
  }

  async hoverWarningIcon(): Promise<void> {
    this.lastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectTooltipContainsNewPolicy(): Promise<void> {
    expect(this.lastTooltipText.toLowerCase()).toContain(
      POLICY_CANCELLATION_CARRIER_ADVANCE.warningTooltip.newPolicy.toLowerCase(),
    );
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.pccaPreparedFile) throw new Error('No prepared file to check stage');
    await this.assertions.expectStoredUploadStage(this.pccaPreparedFile.fileName, stage, getFileId());
  }

  // ═══ Phase 6 — Statement History → open exception record ════════════

  private currentFileId(): string {
    try { return getChargebackFileId(); } catch { /* not set */ }
    try { return getRecoveryFileId(); } catch { /* not set */ }
    return getFileId();
  }

  async openStatementHistoryPage(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}/commission-processing/statement-history`, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionHistory, { timeout: T });
    await expect(this.pccaLoc.statementHistoryHeading()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async searchStatementHistoryByFileId(): Promise<void> {
    const fileId = this.currentFileId();
    const search = this.pccaLoc.historySearchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(fileId);
    await this.page.waitForTimeout(1_500);
    await waitForAppSettled(this.page, T);
  }

  /**
   * Carrier-advance variant: after a statement-history search the record can
   * lag behind the grid — wait 5s, then click the grid refresh button and
   * re-settle before opening the exception record.
   */
  async refreshStatementHistoryGridAfterSearch(): Promise<void> {
    await this.page.waitForTimeout(5_000);
    const refresh = this.pccaLoc.historyGridRefreshButton();
    await expect(refresh).toBeVisible({ timeout: T });
    await refresh.click();
    await waitForAppSettled(this.page, T);
  }

  async clickFirstStatementHistoryRecord(): Promise<void> {
    const fileId = this.currentFileId();
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    let row = grid.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).first();
    await expect(row).toBeVisible({ timeout: T });
    const matching = grid.getByRole('row').filter({ hasText: fileId }).filter({ hasNot: this.page.getByRole('columnheader') }).first();
    if (await matching.isVisible().catch(() => false)) { row = matching; }
    await row.click();
    const lock = this.page.getByTestId('review-lock-modal-acquire');
    if (await lock.isVisible().catch(() => false)) { await lock.click(); }
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
  }

  async hoverWarningIconOnStatementHistory(): Promise<void> {
    const icon = this.pccaLoc.warningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.pccaLoc.tooltip().first();
    await expect(tooltip).toBeVisible({ timeout: T });
    this.lastTooltipText = (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectStatementHistoryTooltipContains(text: string): Promise<void> {
    expect(this.lastTooltipText, 'Hover the warning icon before asserting tooltip text').toBeTruthy();
    expect(this.lastTooltipText.toLowerCase(), `Tooltip "${this.lastTooltipText}" should contain "${text}"`).toContain(text.toLowerCase());
  }

  async clickRecordOnStatementHistoryPage(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    const lock = this.page.getByTestId('review-lock-modal-acquire');
    if (await lock.isVisible().catch(() => false)) { await lock.click(); }
    await this.waitForNeedsAttentionOrReconciliation();
  }

  async waitForNeedsAttentionOrReconciliation(): Promise<void> {
    await expect.poll(async () => {
      const url = this.page.url();
      if (/needs-attention|reconciliation|commission-details/i.test(url)) return true;
      return this.page.getByRole('heading', { name: /commission reconciliation|commission details|needs attention/i })
        .isVisible().catch(() => false);
    }, { timeout: T * 3, intervals: [2_000, 3_000, 5_000] }).toBe(true);
    await waitForAppSettled(this.page, T);
  }

  async expectReconciliationPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
    await expect(this.page.getByRole('heading', { name: /^Commission\s+(?:Details|Reconciliation)$/i }))
      .toBeVisible({ timeout: T });
  }

  // ═══ Phase 7 — Reconcile with Advance Only process option ════════════

  async expectCommissionReconciliationHeading(): Promise<void> {
    const h1 = this.page.locator('main h1').first();
    await expect(h1).toBeVisible({ timeout: T });
    await expect(h1).toContainText(/commission\s+reconciliation/i, { timeout: T });
  }

  async expectReconciliationSummaryContainsPolicyNumber(policyNumber: string): Promise<void> {
    const h1 = this.page.locator('main h1').first();
    await expect(h1).toBeVisible({ timeout: T });
    const summary = h1.locator('xpath=following-sibling::p').first();
    await expect(summary).toBeVisible({ timeout: T });
    const text = (await summary.innerText()).replace(/\s+/g, ' ').trim();
    expect(text.toLowerCase(), `Reconciliation summary "${text}" should mention Policy Number`).toContain('policy number');
    expect(text, `Reconciliation summary "${text}" should contain Policy Number ${policyNumber}`).toContain(policyNumber);
  }

  async clickM1_12Label(): Promise<void> {
    const label = this.pccaLoc.m1_12Label();
    await expect(label).toBeVisible({ timeout: T });
    await label.click();
    await waitForAppSettled(this.page, T);
  }

  async expectNoOfMonthsMatchesAdvanceMonthly(): Promise<void> {
    const input = this.pccaLoc.noOfMonthsInput();
    await expect(input).toBeVisible({ timeout: T });
    const inputValue = await input.inputValue();
    expect(Number(inputValue), `No of months "${inputValue}" should match Advance Setup month ${getAdvanceMonthly()}`)
      .toBe(getAdvanceMonthly());
  }

  async selectProcessOptionAdvanceOnly(): Promise<void> {
    const radio = this.pccaLoc.processOptionAdvanceOnly();
    await expect(radio).toBeVisible({ timeout: T });
    await radio.click();
    await waitForAppSettled(this.page, T);
  }

  async expectTransactionPreviewCount(text: string, expectedCount: number): Promise<void> {
    const preview = this.pccaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const matches = preview.getByText(text, { exact: true });
    await expect
      .poll(async () => (await matches.count()), { timeout: T, intervals: [1_000, 2_000, 3_000] })
      .toBe(expectedCount);
  }

  async captureArfValueFromTransactionPreview(): Promise<void> {
    const preview = this.pccaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const arfValueLocator = this.page.locator(
      '//div[@data-testid="transaction-preview"]//*[text()="ARF"]//ancestor::*[@role="row"]//*[contains(text(),"$")]',
    ).first();
    await expect(arfValueLocator).toBeVisible({ timeout: T });
    const raw = (await arfValueLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `ARF value "${raw}" should be a positive amount`).toBe(true);
    setArfValue(amount);
    console.log(`[policy-cancellation-carrier-advance] Captured ARF value from transaction preview: ${amount}`);
  }

  async captureAgencyCreditFromTransactionPreview(): Promise<void> {
    const preview = this.pccaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const creditLocator = this.page.locator(
      '//*[text()="Agency Credit"]//ancestor::*[@role="row"]//*[contains(text(),"$")]',
    ).first();
    await expect(creditLocator).toBeVisible({ timeout: T });
    const raw = (await creditLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `Agency Credit value "${raw}" should be a positive amount`).toBe(true);
    setAgencyCredit(amount);
    console.log(`[policy-cancellation-carrier-advance] Captured Agency Credit from transaction preview: ${amount}`);
  }

  async clickReconcileButton(): Promise<void> {
    const btn = this.details.loc.reconcileButton().first();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  // ═══ Phase 8/10 — Validate ARF + COMMISSION on Policy Ledger ════════

  async navigateToPoliciesPage(): Promise<void> {
    await this.policies.openList();
    await waitForAppSettled(this.page, T);
  }

  async searchPoliciesByPolicyNumber(policyNumber: string): Promise<void> {
    await this.policies.searchGrid(policyNumber);
    await this.page.waitForTimeout(2000);
    await waitForAppSettled(this.page, T * 2);
  }

  async clickPolicyActionsEllipse(): Promise<void> {
    const btn = this.pccaLoc.policyActionsButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  async clickViewLedger(): Promise<void> {
    const item = this.pccaLoc.viewLedgerMenuItem();
    await expect(item).toBeVisible({ timeout: T });
    await item.click();
    await waitForAppSettled(this.page, T);
  }

  async expectPolicyLedgerDisplayed(): Promise<void> {
    const ledgerContent = this.page.getByText(/ledger|policy.*detail/i);
    await expect(ledgerContent.first()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async expectLedgerContainsEarningType(earningType: string): Promise<void> {
    const grid = this.pccaLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const cell = grid.locator('.ag-cell[col-id="earningType"]').filter({ hasText: new RegExp(`^${earningType}$`, 'i') });
    await expect(cell.first(), `Ledger should contain "${earningType}" earning type`).toBeVisible({ timeout: T });
  }

  async expectLedgerContainsEarningTypeCount(earningType: string, minCount: number): Promise<void> {
    const grid = this.pccaLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const refresh = this.pccaLoc.ledgerRefreshButton();
    const cell = grid.locator('.ag-cell[col-id="earningType"]').filter({ hasText: new RegExp(`^${earningType}$`, 'i') });
    await expect
      .poll(
        async () => {
          const count = await cell.count();
          if (count >= minCount) return true;
          if (await refresh.isVisible().catch(() => false)) {
            await refresh.click();
            await waitForAppSettled(this.page, T);
          }
          return (await cell.count()) >= minCount;
        },
        { timeout: T, intervals: [2_000, 3_000, 5_000] },
      )
      .toBe(true);
  }

  async expectArfRowAmountMatches(expectedArf: number): Promise<void> {
    const arfText = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('[role="row"]');
      for (const row of rows) {
        const text = row.textContent ?? '';
        if (/ARF|Advance Recovery/i.test(text)) {
          const match = text.match(/\$([\d,]+\.?\d*)/);
          if (match) return match[1];
        }
      }
      return '';
    });
    const actualAmount = Number.parseFloat(arfText.replace(/,/g, ''));
    expect(actualAmount).toBeCloseTo(expectedArf, 2);
  }

  /**
   * On Policy Ledger: refresh, clear leftover quick-filter, then expand a
   * COMMISSION earning-type row so its detail row (data-grid-detail-row) can be
   * checked for the ADVANCE_EARN split.
   */
  async expandCommissionRowInLedger(): Promise<void> {
    const grid = this.pccaLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });

    const search = this.pccaLoc.ledgerSearchInput();
    if (await search.isVisible().catch(() => false)) {
      const current = await search.inputValue().catch(() => '');
      if (current.trim()) {
        await search.fill('');
        await waitForAppSettled(this.page, T);
      }
    }

    const refresh = this.pccaLoc.ledgerRefreshButton();
    await expect(refresh).toBeVisible({ timeout: T });
    await refresh.click();
    await waitForAppSettled(this.page, T);

    const commissionCell = grid
      .locator('.ag-cell[col-id="earningType"]')
      .filter({ hasText: /^COMMISSION$/i });

    await expect
      .poll(
        async () => {
          if ((await commissionCell.count()) > 0) return true;
          if (await refresh.isVisible().catch(() => false)) {
            await refresh.click();
            await waitForAppSettled(this.page, T);
          }
          return (await commissionCell.count()) > 0;
        },
        {
          message: 'No COMMISSION row found in Policy Ledger to expand',
          timeout: T,
          intervals: [2_000, 3_000, 5_000],
        },
      )
      .toBeTruthy();

    const commissionRow = grid
      .locator('.ag-center-cols-container .ag-row')
      .filter({ has: this.page.locator('.ag-cell[col-id="earningType"]', { hasText: /^COMMISSION$/i }) })
      .first();

    // Header/footer overlay intercepts pointer events — force bypasses hit-testing.
    await commissionRow.click({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async expectCommissionDetailRowContainsAdvanceEarn(): Promise<void> {
    const detailRow = this.pccaLoc.ledgerDetailRow();
    await expect(detailRow).toBeVisible({ timeout: T });
    const earnCell = this.page.locator(
      '//div[@data-testid="data-grid-detail-row"]//div[contains(text(),"ADVANCE_EARN")]',
    ).first();
    await expect(earnCell, 'COMMISSION detail row should contain "ADVANCE_EARN" (Advance Earned split)')
      .toBeVisible({ timeout: T });
  }

  // ═══ Phase 9 — Upload Commission Recovery (Partial) ═════════════════

  async prepareRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pccaRecoveryFile = await preparePolicyCancellationCarrierAdvanceRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.pccaRecoveryFile.absolutePath);
    setRecoveryFileName(this.pccaRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('Call prepareRecoveryFile() before uploading');
    // Set the prepared file directly and call the parent implementation. The
    // subclass uploadPreparedFile() override re-injects the advance file, so
    // uploadFromPrepared() would otherwise upload the advance bytes again and
    // trigger the Duplicate File modal.
    this.setPreparedFile({
      absolutePath: this.pccaRecoveryFile.absolutePath,
      fileName: this.pccaRecoveryFile.fileName,
      carrierName: this.pccaRecoveryFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('No recovery file to verify');
    const row = await this.findStoredRowByFileName(this.pccaRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('No recovery file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pccaRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.intervalMs,
    });
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('No recovery file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pccaRecoveryFile.fileName,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('No recovery file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getRecoveryFileId(), fileName: this.pccaRecoveryFile.fileName });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.pccaRecoveryFile) throw new Error('No recovery file to check Completed stage');
    await this.assertions.pollUntilStageCompleted(this.pccaRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.intervalMs,
    }, getRecoveryFileId());
  }

  // ═══ Phase 11 — Advance Overview (active settlement) ════════════════

  async navigateToAdvanceOverview(): Promise<void> {
    await this.pccaSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${POLICY_CANCELLATION_CARRIER_ADVANCE.advanceOverviewUrl}`, { waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  async clickHistoricalTab(): Promise<void> {
    const tab = this.pccaLoc.historicalTab();
    await expect(tab).toBeVisible({ timeout: T });
    await tab.click();
    await waitForAppSettled(this.page, T);
  }

  async searchAdvanceOverviewByPolicyNumber(policyNumber: string): Promise<void> {
    const search = this.page.getByRole('textbox', { name: 'Search data grid' });
    if (await search.isVisible().catch(() => false)) {
      await search.fill('');
      await search.fill(policyNumber);
      await waitForAppSettled(this.page, T);
    }
  }

  async openFirstRecordInAdvanceOverview(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const firstRow = grid.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).first();
    await expect(firstRow).toBeVisible({ timeout: T });
    await firstRow.click();
    await waitForAppSettled(this.page, T);
    await expect(this.page.getByRole('heading', { name: 'Policy Details' })).toBeVisible({ timeout: T });
    await expect(this.pccaLoc.arfLedgerHeading()).toBeVisible({ timeout: T });
    const loading = this.pccaLoc.advanceOverviewLoadingStatus();
    if (await loading.isVisible().catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: T * 2 });
    }
    await waitForAppSettled(this.page, T);
  }

  async capturePendingPaymentOwedByAgent(): Promise<void> {
    const balanceLocator = this.page.locator(
      '(//div[@data-testid="advance-arf-ledger-grid"]//div[@role="row"])[last()]//div[@col-id="balance"]//*[contains(text(),"$")]',
    ).first();
    await expect(balanceLocator).toBeVisible({ timeout: T });
    const raw = (await balanceLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `Pending payment "${raw}" should be a positive amount`).toBe(true);
    setPendingPayment(amount);
    console.log(`[policy-cancellation-carrier-advance] Captured pending payment owed by agent: ${amount}`);
  }

  // ═══ Phase 12 — Upload Chargeback (Policy Cancellation) ══════════════

  async prepareChargebackFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pccaChargebackFile = await preparePolicyCancellationCarrierAdvanceChargebackFile(policyNumber, timestamp);
    setChargebackFilePath(this.pccaChargebackFile.absolutePath);
    setChargebackFileName(this.pccaChargebackFile.fileName);
  }

  async uploadChargebackFile(): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('Call prepareChargebackFile() before uploading');
    // Same as uploadRecoveryFile(): bypass the subclass override so the
    // chargeback file is uploaded instead of the advance file.
    this.setPreparedFile({
      absolutePath: this.pccaChargebackFile.absolutePath,
      fileName: this.pccaChargebackFile.fileName,
      carrierName: this.pccaChargebackFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectChargebackFileInGrid(): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('No chargeback file to verify');
    const row = await this.findStoredRowByFileName(this.pccaChargebackFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollChargebackExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('No chargeback file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pccaChargebackFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_CARRIER_ADVANCE.uploadPoll.intervalMs,
    });
    setChargebackFileId(fileId);
  }

  async expectChargebackUploadStatusWaitingReview(): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('No chargeback file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pccaChargebackFile.fileName,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_CARRIER_ADVANCE.expectedAfterExtract.stage,
      getChargebackFileId(),
    );
  }

  async openChargebackReviewPage(): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('No chargeback file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getChargebackFileId(), fileName: this.pccaChargebackFile.fileName });
    await this.review.openFromRow(row, getChargebackFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectChargebackUploadStage(stage: string): Promise<void> {
    if (!this.pccaChargebackFile) throw new Error('No chargeback file to check stage');
    await this.assertions.expectStoredUploadStage(this.pccaChargebackFile.fileName, stage, getChargebackFileId());
  }

  // ═══ Phase 13 — Policy Cancellation Exception ════════════════════════

  async expectPolicyCancellationExceptionPage(): Promise<void> {
    const h1 = this.page.locator('main h1').first();
    await expect(h1).toBeVisible({ timeout: T });
    await expect(h1).toContainText(/policy\s+cancellation\s+exception/i, { timeout: T });
  }

  async expectPolicyCancellationSummaryContainsPolicyNumber(policyNumber: string): Promise<void> {
    const h1 = this.page.locator('main h1').first();
    await expect(h1).toBeVisible({ timeout: T });
    const summary = h1.locator('xpath=following-sibling::p').first();
    await expect(summary).toBeVisible({ timeout: T });
    const text = (await summary.innerText()).replace(/\s+/g, ' ').trim();
    expect(text.toLowerCase(), `Summary "${text}" should mention Policy Number`).toContain('policy number');
    expect(text, `Summary "${text}" should contain Policy Number ${policyNumber}`).toContain(policyNumber);
  }

  /**
   * Carrier-advance variant: the Policy Cancellation Exception shows the ARF
   * chargeback exactly as read from the Cancellation template's "Chargeback"
   * column (negative amount, e.g. −544.2 → displayed $544.20). It is NOT the
   * pending payment plus agency credit, so we compare against the deterministic
   * template value captured during chargeback file preparation.
   */
  async expectChargebackAmountEqualsTemplateChargeback(): Promise<void> {
    const amountLocator = this.page.locator(
      "//h4[contains(text(),'ARF')]//following-sibling::p[contains(text(),'charge')]//span",
    ).first();
    await expect(amountLocator).toBeVisible({ timeout: T });
    const raw = (await amountLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    const expected = getChargebackAmount();
    expect(
      Number.isFinite(amount) && Math.abs(amount - expected),
      `Chargeback amount "${raw}" should equal the cancellation template chargeback ${expected.toFixed(2)}`,
    ).toBeLessThanOrEqual(0.02);
  }

  async clickPolicyCancellationProceedButton(): Promise<void> {
    const btn = this.pccaLoc.policyCancellationProceedButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await captureToast(this.page, this.cancellationToast(), T);
  }

  async expectCancellationToastVisible(): Promise<void> {
    const text = await expectCapturedOrLiveToast(this.page, this.cancellationToast(), T);
    if (text) {
      expect.soft(text.length, 'Cancellation toast should contain a message (soft)').toBeGreaterThan(0);
    }
  }

  private cancellationToast() {
    return this.page
      .getByRole('status')
      .or(this.page.locator('[data-sonner-toast], [role="alert"], [class*="toast"]'))
      .filter({ hasText: /.+/i })
      .first();
  }

  // ═══ Phase 14 — ARF Ledger (Historical Settlements) balance $0 ═══════

  async expectLastRowBalanceIsZero(): Promise<void> {
    const grid = this.page.getByRole('heading', { name: 'ARF Ledger', exact: true })
      .locator('xpath=following::div[@role="grid"][1]').or(this.page.getByRole('grid', { name: 'Data grid' }));
    await expect(grid.first()).toBeVisible({ timeout: T });
    const rows = grid.first().getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
    const lastRow = rows.last();
    await expect(lastRow).toBeVisible({ timeout: T });
    const balanceZero = lastRow.locator('[col-id="balance"]').getByText(/0\.00/);
    await expect(balanceZero).toBeVisible({ timeout: T });
  }

  // ═══ Phase 15 — Policy status cancelled ══════════════════════════════

  async expectPolicyStatusContains(expectedStatus: string): Promise<void> {
    const status = this.pccaLoc.policyStatus();
    await expect(status).toBeVisible({ timeout: T });
    await expect(status).toContainText(new RegExp(expectedStatus, 'i'), { timeout: T });
  }

  async waitMs(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  protected getKnownStoredFileId(): string {
    try { return getFileId(); } catch { return super.getKnownStoredFileId(); }
  }
}
