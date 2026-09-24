import { expect, type Locator, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { CommissionDetailsPage } from '../statement-processing/CommissionDetailsPage';
import { AgentsPage } from '../agents/AgentsPage';
import { PoliciesPage } from '../policies/PoliciesPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { POLICY_CANCELLATION_ADVANCE } from '../../test-data/policy-cancellation-agency-advance/validatePolicyCancellationAgencyAdvance';
import {
  setPolicyNumber, setTimestamp, setPreparedFilePath, setPreparedFileName,
  setAgentId, setProductName, setAdvanceMonthly,
  setFileId, setRecoveryFileId, setRecoveryFilePath, setRecoveryFileName,
  setChargebackFileId, setChargebackFilePath, setChargebackFileName,
  getChargebackFileId, getRecoveryFileId,
  setArfValue, setPendingPayment, setCarrierName,
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getProductName,
  getFileId, getAgentId,
} from '../../utils/policy-cancellation-agency-advance/policyCancellationAgencyAdvanceContext';
import type { PolicyCancellationPreparedFile } from '../../utils/policy-cancellation-agency-advance/policyCancellationAgencyAdvanceExcelPrep';
import {
  preparePolicyCancellationStatementFile,
  preparePolicyCancellationRecoveryFile,
  preparePolicyCancellationChargebackFile,
} from '../../utils/policy-cancellation-agency-advance/policyCancellationAgencyAdvanceExcelPrep';
import { PolicyCancellationAgencyAdvanceAssertions } from './PolicyCancellationAgencyAdvanceAssertions';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PolicyCancellationAgencyAdvancePage extends StatementUploadPage {
  readonly details: CommissionDetailsPage;
  readonly agents: AgentsPage;
  readonly policies: PoliciesPage;
  private readonly pcaSidebar: IcmSidebarPage;
  readonly pcaAssertions: PolicyCancellationAgencyAdvanceAssertions;
  private pcaPreparedFile: PolicyCancellationPreparedFile | null = null;
  private pcaRecoveryFile: PolicyCancellationPreparedFile | null = null;
  private pcaChargebackFile: PolicyCancellationPreparedFile | null = null;
  private lastTooltipText = '';

  readonly pcaLoc = {
    // Agent settings
    agentSettingsPage: () => this.page.getByTestId('agent-tab-navigation-tab-settings'),
    carrierAdvanceToggle: () =>
      this.page.locator('//input[@id="toggle-eligible-for-carrier-advance-toggle"]'),

    // Statement history
    statementHistoryHeading: () => this.page.getByRole('heading', { name: /commission statement history/i }),
    historySearchInput: () => this.page.getByRole('textbox', { name: 'Search data grid' }),

    // Tooltip / warning icon
    warningIcon: () =>
      this.page.locator('.lucide.lucide-triangle-alert').first()
        .or(this.page.locator('svg[data-testid*="warning"], svg[class*="warning"]').first()),
    tooltip: () =>
      this.page.getByRole('tooltip').or(this.page.locator('[data-radix-popper-content-wrapper], [role="tooltip"]')),

    // Reconciliation page
    m1_12Label: () => this.page.locator("//span[text()='M 1-12']//ancestor::label"),
    noOfMonthsInput: () => this.page.getByTestId('no-of-months-input').locator('//input'),
    processOptionCommission: () => this.page.locator('//div[@data-testid="process-option-commission"]'),
    transactionPreview: () => this.page.getByTestId('transaction-preview'),

    // Policy Ledger
    policyActionsButton: () => this.page.getByTestId(/policy-actions/i),
    viewLedgerMenuItem: () => this.page.getByRole('button', { name: /view ledger/i }),
    policyLedgerGrid: () => this.page.getByTestId('policy-ledger-transactions-datagrid'),
    ledgerRefreshButton: () => this.page.getByTestId('data-grid-refresh-button'),

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
    this.pcaSidebar = new IcmSidebarPage(page);
    this.pcaAssertions = new PolicyCancellationAgencyAdvanceAssertions();
  }

  // ═══ Phase 1 — Prepare statement file ═══════════════════════════════

  async prepareFile(): Promise<void> {
    this.pcaPreparedFile = await preparePolicyCancellationStatementFile();
  }

  storePreparedData(): void {
    if (!this.pcaPreparedFile) throw new Error('Call prepareFile() before storePreparedData()');
    setPolicyNumber(this.pcaPreparedFile.customerUid);
    setPreparedFilePath(this.pcaPreparedFile.absolutePath);
    setPreparedFileName(this.pcaPreparedFile.fileName);
    setCarrierName(this.pcaPreparedFile.carrierName);
    setTimestamp(Date.now());
  }

  // ═══ Phase 2 — Validate Agent eligibility ═══════════════════════════

  extractAgentId(): void {
    if (!this.pcaPreparedFile) throw new Error('Call prepareFile() before extractAgentId()');
    setAgentId(this.pcaPreparedFile.agentId);
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
    const settingsTab = this.pcaLoc.agentSettingsPage();
    await expect(settingsTab).toBeVisible({ timeout: T });
    await settingsTab.click();
    await waitForAppSettled(this.page, T);
  }

  async expectCarrierAdvanceToggleEnabled(): Promise<void> {
    const toggle = this.pcaLoc.carrierAdvanceToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (!(await toggle.isChecked().catch(() => false))) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    await expect(toggle, 'Carrier advance toggle should be enabled').toBeChecked({ timeout: T });
  }

  // ═══ Phase 3 — Validate product advance setup ═══════════════════════

  extractProductName(): void {
    if (!this.pcaPreparedFile) throw new Error('Call prepareFile() before extractProductName()');
    setProductName(this.pcaPreparedFile.productName);
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
    await this.pcaSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${POLICY_CANCELLATION_ADVANCE.advanceSetupUrl}`, { waitUntil: 'domcontentloaded' });
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
    console.log(`[policy-cancellation] Captured advance_setup_month: ${monthlyValue}`);
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
    if (!this.pcaPreparedFile) throw new Error('Call prepareFile() before upload');
    this.setPreparedFile({
      absolutePath: this.pcaPreparedFile.absolutePath,
      fileName: this.pcaPreparedFile.fileName,
      carrierName: this.pcaPreparedFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async submitForProcessing(): Promise<void> {
    await this.clickUploadStatement();
  }

  async expectUploadedFileInGrid(): Promise<void> {
    if (!this.pcaPreparedFile) throw new Error('No prepared file to verify');
    const row = await this.findStoredRowByFileName(this.pcaPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, POLICY_CANCELLATION_ADVANCE.gridColumns.fileName);
    expect(fileNameCell).toContain(this.pcaPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcaPreparedFile) throw new Error('No prepared file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcaPreparedFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_ADVANCE.uploadPoll.intervalMs,
    });
    setFileId(fileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName: this.pcaPreparedFile.fileName });
    this.setStoredRow({ row, fileId, fileName: this.pcaPreparedFile.fileName, carrierName: this.pcaPreparedFile.carrierName });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcaPreparedFile) throw new Error('No prepared file to check status');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcaPreparedFile.fileName,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.stage,
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
      POLICY_CANCELLATION_ADVANCE.warningTooltip.newPolicy.toLowerCase(),
    );
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.pcaPreparedFile) throw new Error('No prepared file to check stage');
    await this.assertions.expectStoredUploadStage(this.pcaPreparedFile.fileName, stage, getFileId());
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
    await expect(this.pcaLoc.statementHistoryHeading()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async searchStatementHistoryByFileId(): Promise<void> {
    const fileId = this.currentFileId();
    const search = this.pcaLoc.historySearchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(fileId);
    await this.page.waitForTimeout(1_500);
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
    const icon = this.pcaLoc.warningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.pcaLoc.tooltip().first();
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

  // ═══ Phase 7 — Reconcile with Commission process option ═════════════

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
    const label = this.pcaLoc.m1_12Label();
    await expect(label).toBeVisible({ timeout: T });
    await label.click();
    await waitForAppSettled(this.page, T);
  }

  async expectNoOfMonthsMatchesAdvanceMonthly(): Promise<void> {
    const input = this.pcaLoc.noOfMonthsInput();
    await expect(input).toBeVisible({ timeout: T });
    const inputValue = await input.inputValue();
    expect(Number(inputValue), `No of months "${inputValue}" should match Advance Setup month ${getAdvanceMonthly()}`)
      .toBe(getAdvanceMonthly());
  }

  async selectProcessOptionCommission(): Promise<void> {
    const radio = this.pcaLoc.processOptionCommission();
    await expect(radio).toBeVisible({ timeout: T });
    await radio.click();
    await waitForAppSettled(this.page, T);
  }

  async expectTransactionPreviewCount(text: string, expectedCount: number): Promise<void> {
    const preview = this.pcaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const matches = preview.getByText(text, { exact: true });
    await expect
      .poll(async () => (await matches.count()), { timeout: T, intervals: [1_000, 2_000, 3_000] })
      .toBe(expectedCount);
  }

  async expectTransactionPreviewAtLeast(text: string, minCount: number): Promise<void> {
    const preview = this.pcaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const matches = preview.getByText(text, { exact: true });
    await expect
      .poll(async () => (await matches.count()), { timeout: T, intervals: [1_000, 2_000, 3_000] })
      .toBeGreaterThanOrEqual(minCount);
  }

  async captureArfValueFromTransactionPreview(): Promise<void> {
    const preview = this.pcaLoc.transactionPreview();
    await expect(preview).toBeVisible({ timeout: T });
    const arfValueLocator = this.page.locator(
      '//div[@data-testid="transaction-preview"]//*[text()="ARF"]//ancestor::*[@role="row"]//*[contains(text(),"$")]',
    ).first();
    await expect(arfValueLocator).toBeVisible({ timeout: T });
    const raw = (await arfValueLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `ARF value "${raw}" should be a positive amount`).toBe(true);
    setArfValue(amount);
    console.log(`[policy-cancellation] Captured ARF value from transaction preview: ${amount}`);
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
    const btn = this.pcaLoc.policyActionsButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  async clickViewLedger(): Promise<void> {
    const item = this.pcaLoc.viewLedgerMenuItem();
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
    const grid = this.pcaLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const cell = grid.locator('.ag-cell[col-id="earningType"]').filter({ hasText: new RegExp(`^${earningType}$`, 'i') });
    await expect(cell.first(), `Ledger should contain "${earningType}" earning type`).toBeVisible({ timeout: T });
  }

  async expectLedgerContainsEarningTypeCount(earningType: string, minCount: number): Promise<void> {
    const grid = this.pcaLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const refresh = this.pcaLoc.ledgerRefreshButton();
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

  // ═══ Phase 9 — Upload Commission Recovery (Partial) ═════════════════

  async prepareRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pcaRecoveryFile = await preparePolicyCancellationRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.pcaRecoveryFile.absolutePath);
    setRecoveryFileName(this.pcaRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('Call prepareRecoveryFile() before uploading');
    // Set the prepared file directly and call the parent implementation. The
    // subclass uploadPreparedFile() override re-injects the advance file, so
    // uploadFromPrepared() would otherwise upload the advance bytes again and
    // trigger the Duplicate File modal.
    this.setPreparedFile({
      absolutePath: this.pcaRecoveryFile.absolutePath,
      fileName: this.pcaRecoveryFile.fileName,
      carrierName: this.pcaRecoveryFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('No recovery file to verify');
    const row = await this.findStoredRowByFileName(this.pcaRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('No recovery file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcaRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_ADVANCE.uploadPoll.intervalMs,
    });
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('No recovery file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcaRecoveryFile.fileName,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('No recovery file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getRecoveryFileId(), fileName: this.pcaRecoveryFile.fileName });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.pcaRecoveryFile) throw new Error('No recovery file to check Completed stage');
    await this.assertions.pollUntilStageCompleted(this.pcaRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_ADVANCE.uploadPoll.intervalMs,
    }, getRecoveryFileId());
  }

  // ═══ Phase 11 — Advance Overview (active settlement) ════════════════

  async navigateToAdvanceOverview(): Promise<void> {
    await this.pcaSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${POLICY_CANCELLATION_ADVANCE.advanceOverviewUrl}`, { waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  async clickHistoricalTab(): Promise<void> {
    const tab = this.pcaLoc.historicalTab();
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
    await expect(this.pcaLoc.arfLedgerHeading()).toBeVisible({ timeout: T });
    const loading = this.pcaLoc.advanceOverviewLoadingStatus();
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
    console.log(`[policy-cancellation] Captured pending payment owed by agent: ${amount}`);
  }

  // ═══ Phase 12 — Upload Chargeback (Policy Cancellation) ══════════════

  async prepareChargebackFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pcaChargebackFile = await preparePolicyCancellationChargebackFile(policyNumber, timestamp);
    setChargebackFilePath(this.pcaChargebackFile.absolutePath);
    setChargebackFileName(this.pcaChargebackFile.fileName);
  }

  async uploadChargebackFile(): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('Call prepareChargebackFile() before uploading');
    // Same as uploadRecoveryFile(): bypass the subclass override so the
    // chargeback file is uploaded instead of the advance file.
    this.setPreparedFile({
      absolutePath: this.pcaChargebackFile.absolutePath,
      fileName: this.pcaChargebackFile.fileName,
      carrierName: this.pcaChargebackFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectChargebackFileInGrid(): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('No chargeback file to verify');
    const row = await this.findStoredRowByFileName(this.pcaChargebackFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollChargebackExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('No chargeback file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcaChargebackFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_ADVANCE.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_ADVANCE.uploadPoll.intervalMs,
    });
    setChargebackFileId(fileId);
  }

  async expectChargebackUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('No chargeback file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcaChargebackFile.fileName,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.status,
      POLICY_CANCELLATION_ADVANCE.expectedAfterExtract.stage,
      getChargebackFileId(),
    );
  }

  async openChargebackReviewPage(): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('No chargeback file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getChargebackFileId(), fileName: this.pcaChargebackFile.fileName });
    await this.review.openFromRow(row, getChargebackFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectChargebackUploadStage(stage: string): Promise<void> {
    if (!this.pcaChargebackFile) throw new Error('No chargeback file to check stage');
    await this.assertions.expectStoredUploadStage(this.pcaChargebackFile.fileName, stage, getChargebackFileId());
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

  async expectAdvanceRecoveryPreviewAmountEquals(expected: number): Promise<void> {
    const amountLocator = this.page.locator(
      '//div[@data-testid="policy-cancellation-advance-recovery-preview"]//*[contains(text(),"Advance Recovery")]//ancestor::*[@role="row"]//div[@col-id="amountFormatted"]//span[contains(text(),"$")]',
    ).first();
    await expect(amountLocator).toBeVisible({ timeout: T });
    const raw = (await amountLocator.innerText()).replace(/\s+/g, ' ').trim();
    const normalized = raw.replace(/[(),]/g, '');
    const amount = Number.parseFloat(normalized.replace(/[$,]/g, ''));
    expect(Math.abs(amount - expected), `Advance recovery preview amount "${raw}" should equal pending payment ${expected}`)
      .toBeLessThanOrEqual(0.02);
  }

  async clickPolicyCancellationProceedButton(): Promise<void> {
    const btn = this.pcaLoc.policyCancellationProceedButton();
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
    const status = this.pcaLoc.policyStatus();
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
