import { expect, type Locator, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { CommissionDetailsPage } from '../statement-processing/CommissionDetailsPage';
import { AgentsPage } from '../agents/AgentsPage';
import { PoliciesPage } from '../policies/PoliciesPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { POLICY_CANCELLATION_AGENCY_CREDIT } from '../../test-data/policy-cancellation-agency-credit/validatePolicyCancellationAgencyCredit';
import {
  setPolicyNumber, setTimestamp, setPreparedFilePath, setPreparedFileName,
  setAgentId, setProductName, setAdvanceMonthly,
  setFileId, setRecoveryFileId, setRecoveryFilePath, setRecoveryFileName,
  setChargebackFileId, setChargebackFilePath, setChargebackFileName,
  getChargebackFileId, getRecoveryFileId,
  setAgencyCredit, setTotalChargeback, setTotalEarnings, setAgencyDebit, setCarrierName,
  getPolicyNumber, getTimestamp, getAdvanceMonthly, getProductName,
  getFileId, getAgentId, getTotalChargeback, getTotalEarnings, getAgencyDebit,
} from '../../utils/policy-cancellation-agency-credit/policyCancellationAgencyCreditContext';
import type { PolicyCancellationAgencyCreditPreparedFile } from '../../utils/policy-cancellation-agency-credit/policyCancellationAgencyCreditExcelPrep';
import {
  preparePolicyCancellationAgencyCreditStatementFile,
  preparePolicyCancellationAgencyCreditRecoveryFile,
  preparePolicyCancellationAgencyCreditChargebackFile,
} from '../../utils/policy-cancellation-agency-credit/policyCancellationAgencyCreditExcelPrep';
import { PolicyCancellationAgencyCreditAssertions } from './PolicyCancellationAgencyCreditAssertions';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PolicyCancellationAgencyCreditPage extends StatementUploadPage {
  readonly details: CommissionDetailsPage;
  readonly agents: AgentsPage;
  readonly policies: PoliciesPage;
  private readonly pcacSidebar: IcmSidebarPage;
  readonly pcacAssertions: PolicyCancellationAgencyCreditAssertions;
  private pcacPreparedFile: PolicyCancellationAgencyCreditPreparedFile | null = null;
  private pcacRecoveryFile: PolicyCancellationAgencyCreditPreparedFile | null = null;
  private pcacChargebackFile: PolicyCancellationAgencyCreditPreparedFile | null = null;
  private lastTooltipText = '';

  readonly pcacLoc = {
    // Agent settings
    agentSettingsPage: () => this.page.getByTestId('agent-tab-navigation-tab-settings'),
    advanceEligibilityToggle: () =>
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
    commissionTypeRadio: () =>
      this.page.locator('//input[@data-testid="commission-type-radio-radio"][@value="__carrier_advance_agency_credit__"]'),
    rationaleTextarea: () => this.page.locator('//textarea[@id="textarea-rationale-input"]'),
    reconcileButton: () => this.page.locator('//button[@data-testid="reconcile-commission-button"]'),
    extractedCommissionAmount: () =>
      this.page.locator('//h5[contains(text(),"From Extracted Line Item")]/following-sibling::span[1]'),

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

    // Policy Cancellation Exception
    agencyInfoBanner: () => this.page.locator('//div[@data-testid="policy-cancellation-agency-info-banner"]'),
    viewPolicyLedgerButton: () => this.page.locator('//button[@data-testid="view-policy-ledger-button"]'),
    totalChargebacksValue: () => this.page.locator("//span[text()='Total Chargebacks']//following-sibling::span").first(),
    totalEarningsValue: () => this.page.locator("//span[text()='Total Earnings']//following-sibling::span").first(),
    modalCloseButton: () => this.page.getByTestId('modal-close-button'),
    policyCancellationProceedButton: () =>
      this.page.locator('//button[@data-testid="policy-cancellation-proceed-button"]'),
    policyStatus: () => this.page.locator('//span[contains(@data-testid,"policy-status")]').first(),
  };

  constructor(page: Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
    this.agents = new AgentsPage(page);
    this.policies = new PoliciesPage(page);
    this.pcacSidebar = new IcmSidebarPage(page);
    this.pcacAssertions = new PolicyCancellationAgencyCreditAssertions();
  }

  // ═══ Phase 1 — Prepare statement file ═══════════════════════════════

  async prepareFile(): Promise<void> {
    this.pcacPreparedFile = await preparePolicyCancellationAgencyCreditStatementFile();
  }

  storePreparedData(): void {
    if (!this.pcacPreparedFile) throw new Error('Call prepareFile() before storePreparedData()');
    setPolicyNumber(this.pcacPreparedFile.customerUid);
    setPreparedFilePath(this.pcacPreparedFile.absolutePath);
    setPreparedFileName(this.pcacPreparedFile.fileName);
    setCarrierName(this.pcacPreparedFile.carrierName);
    setTimestamp(Date.now());
  }

  // ═══ Phase 2 — Validate agent is NOT eligible for advance ════════════

  extractAgentId(): void {
    if (!this.pcacPreparedFile) throw new Error('Call prepareFile() before extractAgentId()');
    setAgentId(this.pcacPreparedFile.agentId);
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
    const settingsTab = this.pcacLoc.agentSettingsPage();
    await expect(settingsTab).toBeVisible({ timeout: T });
    await settingsTab.click();
    await waitForAppSettled(this.page, T);
  }

  /**
   * Agency Credit variant: the agent is NOT eligible for advance payment, so
   * the "eligible for advance" toggle must be turned OFF. If it is currently
   * ON, switch it off to establish the scenario precondition.
   */
  async expectAdvanceEligibilityToggleDisabled(): Promise<void> {
    const toggle = this.pcacLoc.advanceEligibilityToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (await toggle.isChecked().catch(() => false)) {
      await toggle.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    await expect(toggle, 'Agent should NOT be eligible for advance — toggle must be OFF').not.toBeChecked({ timeout: T });
  }

  // ═══ Phase 3 — Validate product advance setup ═══════════════════════

  extractProductName(): void {
    if (!this.pcacPreparedFile) throw new Error('Call prepareFile() before extractProductName()');
    setProductName(this.pcacPreparedFile.productName);
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
    await this.pcacSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${POLICY_CANCELLATION_AGENCY_CREDIT.advanceSetupUrl}`, { waitUntil: 'domcontentloaded' });
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
    console.log(`[policy-cancellation-agency-credit] Captured advance_setup_month: ${monthlyValue}`);
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
    if (!this.pcacPreparedFile) throw new Error('Call prepareFile() before upload');
    this.setPreparedFile({
      absolutePath: this.pcacPreparedFile.absolutePath,
      fileName: this.pcacPreparedFile.fileName,
      carrierName: this.pcacPreparedFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async submitForProcessing(): Promise<void> {
    await this.clickUploadStatement();
  }

  async expectUploadedFileInGrid(): Promise<void> {
    if (!this.pcacPreparedFile) throw new Error('No prepared file to verify');
    const row = await this.findStoredRowByFileName(this.pcacPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, POLICY_CANCELLATION_AGENCY_CREDIT.gridColumns.fileName);
    expect(fileNameCell).toContain(this.pcacPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcacPreparedFile) throw new Error('No prepared file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcacPreparedFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.intervalMs,
    });
    setFileId(fileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName: this.pcacPreparedFile.fileName });
    this.setStoredRow({ row, fileId, fileName: this.pcacPreparedFile.fileName, carrierName: this.pcacPreparedFile.carrierName });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcacPreparedFile) throw new Error('No prepared file to check status');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcacPreparedFile.fileName,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.status,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.stage,
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
      POLICY_CANCELLATION_AGENCY_CREDIT.warningTooltip.newPolicy.toLowerCase(),
    );
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.pcacPreparedFile) throw new Error('No prepared file to check stage');
    if (!AppUrlPatterns.commissionUpload.test(this.page.url())) {
      await this.openUploadPageAgain();
    }
    await this.assertions.expectStoredUploadStage(this.pcacPreparedFile.fileName, stage, getFileId());
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
    await expect(this.pcacLoc.statementHistoryHeading()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async searchStatementHistoryByFileId(): Promise<void> {
    const fileId = this.currentFileId();
    const search = this.pcacLoc.historySearchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(fileId);
    await this.page.waitForTimeout(1_500);
    await waitForAppSettled(this.page, T);
  }

  /**
   * Agency-credit variant: after a statement-history search the record can lag
   * behind the grid — wait 5s, then click the grid refresh button and re-settle
   * before opening the exception record.
   */
  async refreshStatementHistoryGridAfterSearch(): Promise<void> {
    await this.page.waitForTimeout(5_000);
    const refresh = this.pcacLoc.historyGridRefreshButton();
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
    const icon = this.pcacLoc.warningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.pcacLoc.tooltip().first();
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

  // ═══ Phase 7 — Reconcile with commission-type option ═════════════════

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

  async clickCommissionTypeRadio(): Promise<void> {
    const radio = this.pcacLoc.commissionTypeRadio();
    await expect(radio).toBeVisible({ timeout: T });
    await radio.click({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async fillReconcileRationale(): Promise<void> {
    const textarea = this.pcacLoc.rationaleTextarea();
    await expect(textarea).toBeVisible({ timeout: T });
    await textarea.fill(POLICY_CANCELLATION_AGENCY_CREDIT.reconcileRationale);
    await waitForAppSettled(this.page, T);
  }

  async captureAgencyCreditFromReconciliationSummary(): Promise<void> {
    const amountLocator = this.pcacLoc.extractedCommissionAmount();
    await expect(amountLocator).toBeVisible({ timeout: T });
    const raw = (await amountLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `Agency Credit value "${raw}" should be a positive amount`).toBe(true);
    setAgencyCredit(amount);
    console.log(`[policy-cancellation-agency-credit] Captured Agency Credit from reconciliation summary: ${amount}`);
  }

  async clickReconcileButton(): Promise<void> {
    const btn = this.pcacLoc.reconcileButton().or(this.details.loc.reconcileButton().first());
    await expect(btn.first()).toBeVisible({ timeout: T });
    await btn.first().click();
    await waitForAppSettled(this.page, T);
  }

  // ═══ Phase 8/10 — Validate AGENCY_CREDIT / AGENCY_DEBIT on Policy Ledger ══

  async navigateToPoliciesPage(): Promise<void> {
    try {
      await this.page.reload();
    } catch {
      // The beforeunload guard may interrupt the reload; waitForAppSettled below
      // re-syncs with whichever document wins before we interact with the sidebar.
    }
    await waitForAppSettled(this.page, T);
    const sidebar = this.page.getByRole('navigation', { name: 'Sidebar navigation' });
    const nav = sidebar.getByTestId('sidebar-nav-item-policy')
      .or(sidebar.getByRole('button', { name: /^Policies$/i }));
    await expect(nav.first()).toBeVisible({ timeout: T });
    await nav.first().click();
    await this.dismissUnsavedChangesModal();
    await expect(this.page).toHaveURL(AppUrlPatterns.policies, { timeout: T });
    await expect(this.policies.loc.headingList()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /**
   * The app shows a "Cancel Changes" route-guard modal when navigating away from
   * a page whose form still has unsaved state (the reconciliation form keeps its
   * radio/rationale after a completed reconcile). Confirm the discard so the
   * navigation proceeds. No-op when the modal is absent.
   */
  private async dismissUnsavedChangesModal(): Promise<void> {
    const confirm = this.page.getByTestId('unsaved-changes-confirm');
    try {
      await confirm.waitFor({ state: 'visible', timeout: 1500 });
      await confirm.click();
      await waitForAppSettled(this.page, T);
    } catch {
      // no unsaved-changes modal — navigation is clean
    }
  }

  async searchPoliciesByPolicyNumber(policyNumber: string): Promise<void> {
    await this.policies.searchGrid(policyNumber);
    await this.page.waitForTimeout(2000);
    await waitForAppSettled(this.page, T * 2);
  }

  async clickPolicyActionsEllipse(): Promise<void> {
    const btn = this.pcacLoc.policyActionsButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  async clickViewLedger(): Promise<void> {
    const item = this.pcacLoc.viewLedgerMenuItem();
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
    const grid = this.pcacLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const cell = grid.locator('.ag-cell[col-id="earningType"]').filter({ hasText: new RegExp(`^${earningType}$`, 'i') });
    await expect(cell.first(), `Ledger should contain "${earningType}" earning type`).toBeVisible({ timeout: T });
  }

  async expectLedgerContainsEarningTypeCount(earningType: string, minCount: number): Promise<void> {
    const grid = this.pcacLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const refresh = this.pcacLoc.ledgerRefreshButton();
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

  async expectAgencyCreditRowAmountMatches(expectedAgencyCredit: number): Promise<void> {
    const amountLocator = this.page.locator(
      '//div[@data-testid="policy-ledger-transactions-datagrid"]//*[text()="AGENCY_CREDIT"]//ancestor::*[@role="row"]//*[contains(text(),"$")]',
    ).first();
    await expect(amountLocator).toBeVisible({ timeout: T });
    const raw = (await amountLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(Number.isFinite(amount), `AGENCY_CREDIT amount "${raw}" should be numeric`).toBe(true);
    expect(Math.abs(amount - expectedAgencyCredit), `AGENCY_CREDIT amount "${raw}" should equal captured Agency Credit ${expectedAgencyCredit}`)
      .toBeLessThanOrEqual(0.02);
  }

  /**
   * On Policy Ledger: refresh, clear leftover quick-filter, then click the
   * AGENCY_DEBIT row so its detail row (data-grid-detail-row) can be checked
   * for the COMMISSION breakdown.
   */
  async clickAgencyDebitRowInLedger(): Promise<void> {
    const grid = this.pcacLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });

    const search = this.pcacLoc.ledgerSearchInput();
    if (await search.isVisible().catch(() => false)) {
      const current = await search.inputValue().catch(() => '');
      if (current.trim()) {
        await search.fill('');
        await waitForAppSettled(this.page, T);
      }
    }

    const refresh = this.pcacLoc.ledgerRefreshButton();
    await expect(refresh).toBeVisible({ timeout: T });
    await refresh.click();
    await waitForAppSettled(this.page, T);

    const debitCell = this.page.locator(
      '//div[@data-testid="policy-ledger-transactions-datagrid"]//*[text()="AGENCY_DEBIT"]',
    ).first();
    await expect(debitCell).toBeVisible({ timeout: T });
    // Header/footer overlay intercepts pointer events — force bypasses hit-testing.
    await debitCell.click({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async expectAgencyDebitDetailRowContainsCommission(): Promise<void> {
    const detailRow = this.page.locator('//div[@data-testid="data-grid-detail-row"]').first();
    await expect(detailRow).toBeVisible({ timeout: T });
    const commission = this.page.locator(
      '//div[@data-testid="data-grid-detail-row"]//div[contains(text(),"COMMISSION")]',
    ).first();
    await expect(commission, 'AGENCY_DEBIT detail row should contain "COMMISSION"').toBeVisible({ timeout: T });
  }

  // ═══ Phase 9 — Upload Commission Recovery (Partial) ═════════════════

  async prepareRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pcacRecoveryFile = await preparePolicyCancellationAgencyCreditRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.pcacRecoveryFile.absolutePath);
    setRecoveryFileName(this.pcacRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('Call prepareRecoveryFile() before uploading');
    // Set the prepared file directly and call the parent implementation. The
    // subclass uploadPreparedFile() override re-injects the advance file, so
    // uploadFromPrepared() would otherwise upload the advance bytes again and
    // trigger the Duplicate File modal.
    this.setPreparedFile({
      absolutePath: this.pcacRecoveryFile.absolutePath,
      fileName: this.pcacRecoveryFile.fileName,
      carrierName: this.pcacRecoveryFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('No recovery file to verify');
    const row = await this.findStoredRowByFileName(this.pcacRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('No recovery file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcacRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.intervalMs,
    });
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('No recovery file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcacRecoveryFile.fileName,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.status,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('No recovery file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getRecoveryFileId(), fileName: this.pcacRecoveryFile.fileName });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.pcacRecoveryFile) throw new Error('No recovery file to check Completed stage');
    await this.assertions.pollUntilStageCompleted(this.pcacRecoveryFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.intervalMs,
    }, getRecoveryFileId());
  }

  // ═══ Phase 11 — Upload Chargeback (Policy Cancellation) ══════════════

  async prepareChargebackFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.pcacChargebackFile = await preparePolicyCancellationAgencyCreditChargebackFile(policyNumber, timestamp);
    setChargebackFilePath(this.pcacChargebackFile.absolutePath);
    setChargebackFileName(this.pcacChargebackFile.fileName);
  }

  async uploadChargebackFile(): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('Call prepareChargebackFile() before uploading');
    // Same as uploadRecoveryFile(): bypass the subclass override so the
    // chargeback file is uploaded instead of the advance file.
    this.setPreparedFile({
      absolutePath: this.pcacChargebackFile.absolutePath,
      fileName: this.pcacChargebackFile.fileName,
      carrierName: this.pcacChargebackFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectChargebackFileInGrid(): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('No chargeback file to verify');
    const row = await this.findStoredRowByFileName(this.pcacChargebackFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollChargebackExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('No chargeback file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.pcacChargebackFile.fileName, {
      maxAttempts: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.maxAttempts,
      intervalMs: POLICY_CANCELLATION_AGENCY_CREDIT.uploadPoll.intervalMs,
    });
    setChargebackFileId(fileId);
  }

  async expectChargebackUploadStatusWaitingReview(): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('No chargeback file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.pcacChargebackFile.fileName,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.status,
      POLICY_CANCELLATION_AGENCY_CREDIT.expectedAfterExtract.stage,
      getChargebackFileId(),
    );
  }

  async openChargebackReviewPage(): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('No chargeback file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({ fileId: getChargebackFileId(), fileName: this.pcacChargebackFile.fileName });
    await this.review.openFromRow(row, getChargebackFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectChargebackUploadStage(stage: string): Promise<void> {
    if (!this.pcacChargebackFile) throw new Error('No chargeback file to check stage');
    await this.assertions.expectStoredUploadStage(this.pcacChargebackFile.fileName, stage, getChargebackFileId());
  }

  // ═══ Phase 12 — Policy Cancellation Exception ════════════════════════

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

  async expectAgencyInfoBannerDisplayed(): Promise<void> {
    const banner = this.pcacLoc.agencyInfoBanner();
    await expect(banner).toBeVisible({ timeout: T });
    const p = banner.locator('xpath=//p').first();
    await expect(p).toBeVisible({ timeout: T });
    const text = (await p.innerText()).replace(/\s+/g, ' ').trim();
    expect(text.toLowerCase(), `Agency info banner "${text}" should describe the agency credit`)
      .toContain(POLICY_CANCELLATION_AGENCY_CREDIT.agencyInfoBannerText.toLowerCase());
  }

  async clickPolicyLedgerModalButton(): Promise<void> {
    const btn = this.pcacLoc.viewPolicyLedgerButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
    await expect(this.pcacLoc.totalChargebacksValue()).toBeVisible({ timeout: T });
  }

  async captureTotalChargeback(): Promise<void> {
    const loc = this.pcacLoc.totalChargebacksValue();
    await expect(loc).toBeVisible({ timeout: T });
    const raw = (await loc.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$(),]/g, ''));
    expect(Number.isFinite(amount), `Total Chargebacks "${raw}" should be numeric`).toBe(true);
    setTotalChargeback(amount);
    console.log(`[policy-cancellation-agency-credit] Captured Total Chargebacks: ${amount}`);
  }

  async captureTotalEarnings(): Promise<void> {
    const loc = this.pcacLoc.totalEarningsValue();
    await expect(loc).toBeVisible({ timeout: T });
    const raw = (await loc.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$(),]/g, ''));
    expect(Number.isFinite(amount), `Total Earnings "${raw}" should be numeric`).toBe(true);
    setTotalEarnings(amount);
    console.log(`[policy-cancellation-agency-credit] Captured Total Earnings: ${amount}`);
  }

  async closePolicyLedgerModal(): Promise<void> {
    const close = this.pcacLoc.modalCloseButton();
    await expect(close).toBeVisible({ timeout: T });
    await close.click();
    await waitForAppSettled(this.page, T);
  }

  async captureAgencyDebitFromPreview(): Promise<void> {
    const amountLocator = this.page.locator(
      '//div[@data-testid="policy-cancellation-advance-recovery-preview"]//*[contains(text(),"Agency")]//ancestor::*[@role="row"]//div[@col-id="amountFormatted"]//span[contains(text(),"$")]',
    ).first();
    await expect(amountLocator).toBeVisible({ timeout: T });
    const raw = (await amountLocator.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$(),]/g, ''));
    expect(Number.isFinite(amount) && amount > 0, `Agency debit "${raw}" should be a positive amount`).toBe(true);
    setAgencyDebit(amount);
    console.log(`[policy-cancellation-agency-credit] Captured agency debit from advance recovery preview: ${amount}`);
  }

  async expectAgencyDebitEqualsEarningsMinusChargeback(): Promise<void> {
    const expected = getTotalEarnings() - getTotalChargeback();
    const actual = getAgencyDebit();
    expect(
      Math.abs(actual - expected),
      `Agency debit ${actual} should equal Total Earnings (${getTotalEarnings()}) minus Total Chargebacks (${getTotalChargeback()}) = ${expected}`,
    ).toBeLessThanOrEqual(0.02);
  }

  async clickPolicyCancellationProceedButton(): Promise<void> {
    const btn = this.pcacLoc.policyCancellationProceedButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  // ═══ Phase 13 — Policy status cancelled ══════════════════════════════

  async expectPolicyStatusContains(expectedStatus: string): Promise<void> {
    const status = this.pcacLoc.policyStatus();
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
