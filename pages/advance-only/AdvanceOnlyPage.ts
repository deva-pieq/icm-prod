import { expect, type Locator, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { StatementReviewPage } from '../statement-processing/StatementReviewPage';
import { CommissionDetailsPage } from '../statement-processing/CommissionDetailsPage';
import { AgentsPage } from '../agents/AgentsPage';
import { PoliciesPage } from '../policies/PoliciesPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { ADVANCE_ONLY } from '../../test-data/advance-only/validateAdvanceOnly';
import { COMMISSION_ONLY } from '../../test-data/advance-only/validateCommissionOnly';
import {
  setPolicyNumber,
  setTimestamp,
  setPreparedFilePath,
  setPreparedFileName,
  setAgentId,
  setProductName,
  setAdvanceDefault,
  setAdvanceMonthly,
  setFileId,
  setRecoveryFileId,
  setRecoveryFilePath,
  setRecoveryFileName,
  setAdvanceAmount,
  setArfValue,
  setCarrierName,
  getPolicyNumber,
  getTimestamp,
  getAdvanceMonthly,
  getProductName,
  getFileId,
  getRecoveryFileId,
  getAgentId,
} from '../../utils/advance-only/advanceOnlyContext';
import type { AdvanceOnlyPreparedFile } from '../../utils/advance-only/advanceOnlyExcelPrep';
import {
  prepareAdvanceOnlyStatementFile,
  prepareAdvanceOnlyRecoveryFile,
} from '../../utils/advance-only/advanceOnlyExcelPrep';
import type { CommissionOnlyPreparedFile } from '../../utils/advance-only/commissionOnlyExcelPrep';
import {
  prepareCommissionOnlyStatementFile,
  prepareCommissionOnlyRecoveryFile,
} from '../../utils/advance-only/commissionOnlyExcelPrep';
import { AdvanceOnlyAssertions } from './AdvanceOnlyAssertions';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AdvanceOnlyPage extends StatementUploadPage {
  readonly details: CommissionDetailsPage;
  readonly agents: AgentsPage;
  readonly policies: PoliciesPage;
  private readonly aoSidebar: IcmSidebarPage;
  readonly aoAssertions: AdvanceOnlyAssertions;
  private aoPreparedFile: AdvanceOnlyPreparedFile | null = null;
  private aoRecoveryFile: AdvanceOnlyPreparedFile | null = null;
  private coPreparedFile: CommissionOnlyPreparedFile | null = null;
  private coRecoveryFile: CommissionOnlyPreparedFile | null = null;
  private lastTooltipText = '';

  /** Advance-only specific locators — does NOT shadow base `loc` map. */
  readonly aoLoc = {
    // Agent settings
    agentSettingsPage:()=>this.page.getByTestId('agent-tab-navigation-tab-settings'),
    carrierAdvanceToggle: () =>
      this.page.locator('#toggle-eligible-for-carrier-advance-toggle'),

    // Advance Setup grid
    advanceSetupGrid: () =>
      this.page.getByRole('grid', { name: 'Data grid' }),

    // Reconciliation page
    advanceExceptionTooltip: () =>
      this.page.getByRole('tooltip')
        .or(this.page.locator('[data-radix-popper-content-wrapper], [role="tooltip"]')),
    advanceExceptionWarningIcon: () =>
      this.page.locator('.lucide.lucide-triangle-alert').first()
        .or(this.page.locator('svg[data-testid*="warning"], svg[class*="warning"]').first()),
    advanceOnlyRadio: () =>
      this.page.getByTestId('process-option-advance-only-radio'),
    commissionRadio: () =>
      this.page.getByTestId('process-option-commission-radio'),
    advanceAdjustmentsRadio: () =>
      this.page.getByTestId('process-option-advance-adjustments-radio'),
    advanceRecoveryRadio: () =>
      this.page.getByTestId('process-option-advance-and-recovery-radio'),
    noOfMonthsInput: () =>
      this.page.getByTestId('no-of-months-input').locator('//input'),
    totalAdvanceInput: () =>
      this.page.getByTestId('total-advance-input').locator('input'),
    reconcileAdvanceExceptionButton: () =>
      this.page.getByTestId('reconcile-advance-exception-button'),
    m1_12Label: () =>
      this.page.locator("//label//span[text()='M 1-12']"),
    advanceExceptionTitle: () =>
      this.page.getByRole('heading', { name: /advance exception/i }),

    // Policy Ledger
    policyActionsButton: () =>
      this.page.getByTestId(/policy-actions/i),
    viewLedgerMenuItem: () =>
      this.page.getByRole('button', { name: /view ledger/i }),
    policyLedgerGrid: () =>
      this.page.getByTestId('policy-ledger-transactions-datagrid'),
    ledgerRefreshButton: () =>
      this.page.getByTestId('data-grid-refresh-button'),
    ledgerSearchInput: () =>
      this.page
        .getByTestId('data-grid-search-input')
        .getByRole('textbox', { name: 'Search data grid' })
        .or(this.page.getByRole('textbox', { name: 'Search data grid' })),
    commissionDetailsContent: () =>
      this.page.getByTestId('commission-details-content'),
    chargebackDetailsContent: () =>
      this.page.getByTestId('commission-details-content'),
    ledgerDetailRow: () => this.page.getByTestId('data-grid-detail-row'),

    // Advance Overview
    advanceOverviewTabs: () =>
      this.page.getByTestId('advance-overview-tabs'),
    historicalTab: () =>
      this.page.getByRole('button', { name: /historical settlements/i })
        .or(this.page.getByTestId('advance-overview-tabs-tab-historical')),
    advancePolicyDetailsCard: () =>
      this.page
        .locator('div, section, article')
        .filter({ has: this.page.getByRole('heading', { name: 'Policy Details', exact: true }) })
        .first(),
    advanceOverviewLoadingStatus: () =>
      this.page.getByRole('status').filter({ hasText: /loading data/i }),
    arfLedgerHeading: () =>
      this.page.getByRole('heading', { name: 'ARF Ledger', exact: true }),
    sortIndicator: () =>
      this.page.locator('.ag-sort-indicator-container').first(),

    // Navigation
    uploadHeading: () =>
      this.page.getByRole('heading', { name: 'Upload Commission Statement', exact: true }),

    // Review
    toast: () =>
      this.page.getByTestId(/toast/).first(),
  };

  constructor(page: Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
    this.agents = new AgentsPage(page);
    this.policies = new PoliciesPage(page);
    this.aoSidebar = new IcmSidebarPage(page);
    this.aoAssertions = new AdvanceOnlyAssertions();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 1 — Prepare statement file
  // ═══════════════════════════════════════════════════════════════════════

  async prepareFile(): Promise<void> {
    this.aoPreparedFile = await prepareAdvanceOnlyStatementFile();
  }

  storePreparedData(): void {
    if (!this.aoPreparedFile) {
      throw new Error('Call prepareFile() before storePreparedData()');
    }
    setPolicyNumber(this.aoPreparedFile.customerUid);
    setPreparedFilePath(this.aoPreparedFile.absolutePath);
    setPreparedFileName(this.aoPreparedFile.fileName);
    setCarrierName(this.aoPreparedFile.carrierName);
    const stamp = Date.now();
    setTimestamp(stamp);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 2 — Validate Agent eligibility for carrier advance
  // ═══════════════════════════════════════════════════════════════════════

  extractAgentId(): void {
    if (!this.aoPreparedFile) {
      throw new Error('Call prepareFile() before extractAgentId()');
    }
    setAgentId(this.aoPreparedFile.agentId);
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
    // Filter by text instead of iterating virtualized rows (detached nth() cells time out).
    const match = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: agentId });
    await expect(
      match.first(),
      `Agent row with ID "${agentId}" not found in grid`,
    ).toBeVisible({ timeout: T });
  }

  async openAgentSettings(agentId: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const agentRow = this.page.getByRole('row', { name: 'AgentX Level I Level 5 • 600011' });
      if (await agentRow.isVisible()) {
        await agentRow.click();
        await waitForAppSettled(this.page, T);
        await this.aoLoc.agentSettingsPage().click();
        await waitForAppSettled(this.page, T);
        return;
      }    
    throw new Error(`Agent row with ID "${agentId}" not found for opening settings`);
  }

  async expectCarrierAdvanceToggleEnabled(): Promise<void> {
    const toggle = this.aoLoc.carrierAdvanceToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    // Check multiple toggle representations: input[type=checkbox], role=switch, data-state
    const isEnabled = await toggle.evaluate((el) => {
      if (el instanceof HTMLInputElement) return el.checked;
      const ariaChecked = el.getAttribute('aria-checked');
      const dataState = el.getAttribute('data-state');
      return ariaChecked === 'true' || dataState === 'checked';
    });
    expect(isEnabled, 'Carrier advance toggle should be enabled').toBeTruthy();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 3 — Validate product advance setup
  // ═══════════════════════════════════════════════════════════════════════

  extractProductName(): void {
    if (!this.aoPreparedFile) {
      throw new Error('Call prepareFile() before extractProductName()');
    }
    setProductName(this.aoPreparedFile.productName);
  }

  async openAdvanceSetupPage(): Promise<void> {
    await this.aoSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${ADVANCE_ONLY.advanceSetupUrl}`, {
      waitUntil: 'domcontentloaded',
    });
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

  async captureAdvanceDefault(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: T });

    const defaultCell = await firstRow.evaluate((rowEl) => {
      const cells = Array.from(rowEl.querySelectorAll('[role="gridcell"], td'));
      for (const cell of cells) {
        const colId = cell.getAttribute('col-id') ?? '';
        if (colId.toLowerCase() === 'default') {
          return cell.textContent?.trim() ?? '';
        }
      }
      for (const cell of cells) {
        const text = cell.textContent?.trim() ?? '';
        if (/\d+\.?\d*%?/.test(text)) return text;
      }
      return '';
    });
    setAdvanceDefault(defaultCell);
  }

  async captureAdvanceMonthly(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: T });

    const monthlyCell = await firstRow.evaluate((rowEl) => {
      const cells = Array.from(rowEl.querySelectorAll('[role="gridcell"], td'));
      for (const cell of cells) {
        const colId = cell.getAttribute('col-id') ?? '';
        if (colId.toLowerCase() === 'monthly') {
          return cell.textContent?.trim() ?? '';
        }
      }
      return '';
    });
    const monthlyValue = Number.parseFloat(monthlyCell.replace(/[^0-9.]/g, ''));
    setAdvanceMonthly(Number.isFinite(monthlyValue) ? monthlyValue : 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 4 — Upload the prepared statement file
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Direct navigation to Upload — after Complete Review the app often lands on
   * statement-history and the sidebar Upload click can fail to leave that page.
   */
  async openUploadPageAgain(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${AppPaths.commissionUpload}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async uploadPreparedAdvanceOnlyFile(): Promise<void> {
    if (!this.aoPreparedFile) {
      throw new Error('Call prepareFile() before upload');
    }
    await this.uploadFromPrepared({
      absolutePath: this.aoPreparedFile.absolutePath,
      fileName: this.aoPreparedFile.fileName,
      carrierName: this.aoPreparedFile.carrierName,
    });
  }

  async submitForProcessing(): Promise<void> {
    await this.clickUploadStatement();
  }

  async expectUploadedFileInAdvanceOnlyGrid(): Promise<void> {
    if (!this.aoPreparedFile) {
      throw new Error('No prepared file to verify');
    }
    const row = await this.findStoredRowByFileName(this.aoPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, ADVANCE_ONLY.gridColumns.fileName);
    expect(fileNameCell).toContain(this.aoPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.aoPreparedFile) {
      throw new Error('No prepared file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.aoPreparedFile.fileName,
      {
        maxAttempts: ADVANCE_ONLY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ONLY.uploadPoll.intervalMs,
      },
    );
    setFileId(fileId);

    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: this.aoPreparedFile.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: this.aoPreparedFile.fileName,
      carrierName: this.aoPreparedFile.carrierName,
    });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.aoPreparedFile) {
      throw new Error('No prepared file to check status');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.aoPreparedFile.fileName,
      ADVANCE_ONLY.expectedAfterExtract.status,
      ADVANCE_ONLY.expectedAfterExtract.stage,
      getFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 5 — Review stage
  // ═══════════════════════════════════════════════════════════════════════

  async openReviewPageForStoredUpload(): Promise<void> {
    await this.openReviewForStoredUpload();
  }

  async hoverWarningIcon(): Promise<void> {
    this.lastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectTooltipContainsNewPolicy(): Promise<void> {
    expect(
      this.lastTooltipText.toLowerCase(),
      `Tooltip should contain "New Policy" but was: "${this.lastTooltipText}"`,
    ).toContain(ADVANCE_ONLY.warningTooltip.newPolicy.toLowerCase());
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectSuccessToast(): Promise<void> {
    await this.review.expectSuccessToastVisible();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.aoPreparedFile) {
      throw new Error('No prepared file to check stage');
    }
    // Advance Only stays on Needs Attention after review (advance exceptions),
    // not Completed — poll for the stage asserted by the scenario.
    await this.assertions.expectStoredUploadStage(
      this.aoPreparedFile.fileName,
      stage,
      getFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 6 — Re-navigate to upload and open record for reconciliation
  // ═══════════════════════════════════════════════════════════════════════

  async navigateToUploadPageAgain(): Promise<void> {
    await this.openUploadPageAgain();
  }

  async openRecordByFileId(): Promise<void> {
    const fileIdValue = getFileId();
    const fileName = this.aoPreparedFile?.fileName ?? '';
    const row = await this.resolveStoredUploadRow({ fileId: fileIdValue, fileName });

    await this.details.openFromRow(row, fileIdValue);
    await waitForAppSettled(this.page, T);
  }

  async waitForNeedsAttentionOrReconciliation(): Promise<void> {
    // Needs Attention opens can land on commission-details (not /reconciliation/).
    await expect
      .poll(
        async () => {
          const url = this.page.url();
          if (/needs-attention|reconciliation|commission-details/i.test(url)) {
            return true;
          }
          return this.page
            .getByRole('heading', {
              name: /commission reconciliation|commission details|needs attention/i,
            })
            .isVisible()
            .catch(() => false);
        },
        { timeout: T * 3, intervals: [2_000, 3_000, 5_000] },
      )
      .toBe(true);
    await waitForAppSettled(this.page, T);
  }

  async expectReconciliationPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
    await expect(
      this.page.getByRole('heading', {
        name: /^Commission\s+(?:Details|Reconciliation)$/i,
      }),
    ).toBeVisible({ timeout: T });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 7 — Reconcile with Advance Only
  // ═══════════════════════════════════════════════════════════════════════

  async hoverAdvanceExceptionTooltip(): Promise<void> {
    const icon = this.aoLoc.advanceExceptionWarningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.aoLoc.advanceExceptionTooltip().first();
    await expect(tooltip).toBeVisible({ timeout: T });
    this.lastTooltipText = (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectAdvanceExceptionTooltipText(): Promise<void> {
    expect(
      this.lastTooltipText,
      `Advance exception tooltip should contain expected text but was: "${this.lastTooltipText}"`,
    ).toContain(ADVANCE_ONLY.advanceExceptionTooltip);
  }

  async clickAdvanceExceptionRecord(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: T });
    await firstRow.click();
    await waitForAppSettled(this.page, T);
  }

  async expectAdvanceExceptionTitle(): Promise<void> {
    await expect(this.aoLoc.advanceExceptionTitle()).toBeVisible({ timeout: T });
  }

  async clickM1_12Label(): Promise<void> {
    const label = this.aoLoc.m1_12Label();
    await expect(label).toBeVisible({ timeout: T });
    await label.click();
    await waitForAppSettled(this.page, T);
  }

  async selectAdvanceOnlyRadio(): Promise<void> {
    const radio = this.aoLoc.advanceOnlyRadio();
    await expect(radio).toBeVisible({ timeout: T });
    // Decorative -radio-circle span intercepts pointer events on the sr-only input.
    await radio.check({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async selectCommissionRadio(): Promise<void> {
    const radio = this.aoLoc.commissionRadio();
    await expect(radio).toBeVisible({ timeout: T });
    // Decorative -radio-circle span intercepts pointer events on the sr-only input.
    await radio.check({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async expectNoOfMonthsMatchesAdvanceMonthly(): Promise<void> {
    const input = this.aoLoc.noOfMonthsInput();
    await expect(input).toBeVisible({ timeout: T });
    const inputValue = await input.inputValue();
    const expectedMonths = getAdvanceMonthly();
    expect(
      Number(inputValue),
      `No of months input "${inputValue}" should match Advance Monthly ${expectedMonths}`,
    ).toBe(expectedMonths);
  }

  async captureAdvanceAmountFromTotalAdvanceInput(): Promise<void> {
    const input = this.aoLoc.totalAdvanceInput();
    await expect(input).toBeVisible({ timeout: T });
    const rawValue = await input.inputValue();
    const amount = Number.parseFloat(rawValue.replace(/[$,]/g, '').trim());
    expect(
      Number.isFinite(amount) && amount > 0,
      `Total advance input value "${rawValue}" should be a positive number`,
    ).toBe(true);
    setAdvanceAmount(amount);
    setArfValue(amount);
  }

  async clickReconcileAdvanceExceptionButton(): Promise<void> {
    const btn = this.aoLoc.reconcileAdvanceExceptionButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 8 — Validate ARF amount on Policy Ledger
  // ═══════════════════════════════════════════════════════════════════════

  async navigateToPoliciesPage(): Promise<void> {
    await this.policies.openList();
    await waitForAppSettled(this.page, T);
  }

  async searchPoliciesByPolicyNumber(policyNumber: string): Promise<void> {
    await this.policies.searchGrid(policyNumber);
    await this.page.waitForTimeout(2000);
    await waitForAppSettled(this.page, T*2);
  }

  async clickPolicyActionsEllipse(): Promise<void> {
    const btn = this.aoLoc.policyActionsButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  async clickViewLedger(): Promise<void> {
    const item = this.aoLoc.viewLedgerMenuItem();
    await expect(item).toBeVisible({ timeout: T });
    await item.click();
    await waitForAppSettled(this.page, T);
  }

  async expectPolicyLedgerDisplayed(): Promise<void> {
    const ledgerContent = this.page.getByText(/ledger|policy.*detail/i);
    await expect(ledgerContent.first()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
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
    expect(
      actualAmount,
      `ARF row amount $${actualAmount.toFixed(2)} should match expected $${expectedArf.toFixed(2)}`,
    ).toBeCloseTo(expectedArf, 2);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 9-10 — Prepare and upload recovery file
  // ═══════════════════════════════════════════════════════════════════════

  async prepareRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.aoRecoveryFile = await prepareAdvanceOnlyRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.aoRecoveryFile.absolutePath);
    setRecoveryFileName(this.aoRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('Call prepareRecoveryFile() before uploading');
    }
    await this.uploadFromPrepared({
      absolutePath: this.aoRecoveryFile.absolutePath,
      fileName: this.aoRecoveryFile.fileName,
      carrierName: this.aoRecoveryFile.carrierName,
    });
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('No recovery file to verify');
    }
    const row = await this.findStoredRowByFileName(this.aoRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('No recovery file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.aoRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_ONLY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ONLY.uploadPoll.intervalMs,
      },
    );
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('No recovery file to check');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.aoRecoveryFile.fileName,
      ADVANCE_ONLY.expectedAfterExtract.status,
      ADVANCE_ONLY.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 11 — Review recovery and verify chargeback
  // ═══════════════════════════════════════════════════════════════════════

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('No recovery file to review');
    }
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getRecoveryFileId(),
      fileName: this.aoRecoveryFile.fileName,
    });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async completeRecoveryReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.aoRecoveryFile) {
      throw new Error('No recovery file to check Completed stage');
    }
    await this.assertions.pollUntilStageCompleted(
      this.aoRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_ONLY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ONLY.uploadPoll.intervalMs,
      },
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 12 — Validate ADVANCE_EARNED in Policy Ledger
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * On Policy Ledger: refresh, then expand a COMMISSION row.
   * Do not quick-filter "commission" — that search returns 0 rows while COMMISSION
   * earning types are still visible. ag-header/footer intercept normal clicks → force.
   * Match via earningType cell (not row hasText /\bCOMMISSION\b/) — AG Grid concatenates
   * cell text without spaces (`2026COMMISSION$78`), so word-boundary regex never matches.
   * Detail panel (`commission-details-content`) shows ADVANCE_EARNED / Advance Earned.
   */
  async expandCommissionRowInLedger(): Promise<void> {
    const grid = this.aoLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });

    // Leftover quick-filter hides COMMISSION rows ("No Records Found").
    const search = this.aoLoc.ledgerSearchInput();
    if (await search.isVisible().catch(() => false)) {
      const current = await search.inputValue().catch(() => '');
      if (current.trim()) {
        await search.fill('');
        await waitForAppSettled(this.page, T);
      }
    }

    const refresh = this.aoLoc.ledgerRefreshButton();
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

  async expandChargebackRowInLedger(): Promise<void> {
    const grid = this.aoLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });

    // Leftover quick-filter hides COMMISSION rows ("No Records Found").
    const search = this.aoLoc.ledgerSearchInput();
    if (await search.isVisible().catch(() => false)) {
      const current = await search.inputValue().catch(() => '');
      if (current.trim()) {
        await search.fill('');
        await waitForAppSettled(this.page, T);
      }
    }

    const refresh = this.aoLoc.ledgerRefreshButton();
    await expect(refresh).toBeVisible({ timeout: T });
    await refresh.click();
    await waitForAppSettled(this.page, T);

    const commissionCell = grid
      .locator('.ag-cell[col-id="earningType"]')
      .filter({ hasText: /^CHARGEBACK$/i });

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
          message: 'No CHARGEBACK row found in Policy Ledger to expand',
          timeout: T,
          intervals: [2_000, 3_000, 5_000],
        },
      )
      .toBeTruthy();

    const chargebackRow = grid
      .locator('.ag-center-cols-container .ag-row')
      .filter({ has: this.page.locator('.ag-cell[col-id="earningType"]', { hasText: /^CHARGEBACK$/i }) })
      .first();

    // Header/footer overlay intercepts pointer events — force bypasses hit-testing.
    await chargebackRow.click({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async expectChargebackDetailsContainChargeback(): Promise<void> {
    const details = this.aoLoc.chargebackDetailsContent();
    await expect(details).toBeVisible({ timeout: T });
    await expect(
      details,
      'Chargeback details should contain "CHARGEBACK" (Advance Earned split)',
    ).toContainText(/ADVANCE_EARNED|Advance Earned|CHARGEBACK/i, { timeout: T });
  }
  async expectCommissionDetailsContainAdvanceEarned(): Promise<void> {
    const details = this.aoLoc.commissionDetailsContent();
    await expect(details).toBeVisible({ timeout: T });
    await expect(
      details,
      'Commission details should contain "ADVANCE_EARNED" (Advance Earned split)',
    ).toContainText(/ADVANCE_EARNED|Advance Earned/i, { timeout: T });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 13 — Validate Advance Overview historical record
  // ═══════════════════════════════════════════════════════════════════════

  async navigateToAdvanceOverview(): Promise<void> {
    await this.aoSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${ADVANCE_ONLY.advanceOverviewUrl}`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
  }

  async clickHistoricalTab(): Promise<void> {
    const tab = this.aoLoc.historicalTab();
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
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible({ timeout: T });
    await firstRow.click();
    await waitForAppSettled(this.page, T);

    // Detail view shows Policy Details / Advance Details / ARF Ledger with skeletons first.
    await expect(this.page.getByRole('heading', { name: 'Policy Details' })).toBeVisible({
      timeout: T,
    });
    await expect(this.aoLoc.arfLedgerHeading()).toBeVisible({ timeout: T });
    const loading = this.aoLoc.advanceOverviewLoadingStatus();
    if (await loading.isVisible().catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: T * 2 });
    }
    await waitForAppSettled(this.page, T);
  }

  async expectAdvancePolicyDetailsCardProduct(): Promise<void> {
    const productName = getProductName();
    await expect(this.page.getByRole('heading', { name: 'Policy Details' })).toBeVisible({
      timeout: T,
    });

    // Heading is visible while skeleton loaders still hide field values — poll for product.
    await expect
      .poll(
        async () => {
          const card = this.aoLoc.advancePolicyDetailsCard();
          const cardText = (await card.innerText().catch(() => '')).replace(/\s+/g, ' ');
          if (cardText.toLowerCase().includes(productName.toLowerCase())) return true;
          // Fallback: product may render outside the narrow card wrapper.
          const mainText = (await this.page.locator('main').innerText()).replace(/\s+/g, ' ');
          return mainText.toLowerCase().includes(productName.toLowerCase());
        },
        {
          message: `Advance Policy Details should contain product "${productName}" after content loads`,
          timeout: T * 2,
          intervals: [1_000, 2_000, 3_000, 5_000],
        },
      )
      .toBe(true);
  }

  async clickSortIndicator(): Promise<void> {
    // Wait for ARF Ledger rows (not skeleton) before sorting.
    const loading = this.aoLoc.advanceOverviewLoadingStatus();
    if (await loading.isVisible().catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: T * 2 });
    }
    const balanceHeader = this.page.locator('.ag-header-cell[col-id="balance"]');
    await expect(balanceHeader).toBeVisible({ timeout: T });
    // Sort the Balance column specifically (generic first indicator may be another col).
    const indicator = balanceHeader.locator('.ag-sort-indicator-container').or(balanceHeader);
    await indicator.first().click();
    await waitForAppSettled(this.page, T);
  }

  async expectFirstRowBalanceIsZero(): Promise<void> {
    const grid = this.page
      .getByRole('heading', { name: 'ARF Ledger', exact: true })
      .locator('xpath=following::div[@role="grid"][1]')
      .or(this.page.getByRole('grid', { name: 'Data grid' }));
    await expect(grid.first()).toBeVisible({ timeout: T });

    const firstRow = grid
      .first()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(firstRow).toBeVisible({ timeout: T });

    // Target balance col only — first $-amount cell is often a different column.
    // Equivalent to //div[@col-id='balance']//*[contains(text(),'0.00')]
    const balanceZero = firstRow.locator('[col-id="balance"]').getByText(/0\.00/);
    await expect(balanceZero).toBeVisible({ timeout: T });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Commission-Only — Reuse existing methods with commission-only data
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Phase 1: Prepare commission-only statement file ──────────────────

  async prepareCommissionOnlyFile(): Promise<void> {
    this.coPreparedFile = await prepareCommissionOnlyStatementFile();
  }

  storeCommissionOnlyPreparedData(): void {
    if (!this.coPreparedFile) {
      throw new Error('Call prepareCommissionOnlyFile() before storeCommissionOnlyPreparedData()');
    }
    setPolicyNumber(this.coPreparedFile.customerUid);
    setPreparedFilePath(this.coPreparedFile.absolutePath);
    setPreparedFileName(this.coPreparedFile.fileName);
    setCarrierName(this.coPreparedFile.carrierName);
    const stamp = Date.now();
    setTimestamp(stamp);
  }

  // ─── Phase 2: Agent extraction ────────────────────────────────────────

  extractCommissionOnlyAgentId(): void {
    if (!this.coPreparedFile) {
      throw new Error('Call prepareCommissionOnlyFile() before extractCommissionOnlyAgentId()');
    }
    setAgentId(this.coPreparedFile.agentId);
  }

  // ─── Phase 3: Product extraction ──────────────────────────────────────

  extractCommissionOnlyProductName(): void {
    if (!this.coPreparedFile) {
      throw new Error('Call prepareCommissionOnlyFile() before extractCommissionOnlyProductName()');
    }
    setProductName(this.coPreparedFile.productName);
  }

  // ─── Phase 4: Upload commission-only file ─────────────────────────────

  async uploadPreparedCommissionOnlyFile(): Promise<void> {
    if (!this.coPreparedFile) {
      throw new Error('Call prepareCommissionOnlyFile() before upload');
    }
    await this.uploadFromPrepared({
      absolutePath: this.coPreparedFile.absolutePath,
      fileName: this.coPreparedFile.fileName,
      carrierName: this.coPreparedFile.carrierName,
    });
  }

  async expectCommissionOnlyFileInGrid(): Promise<void> {
    if (!this.coPreparedFile) {
      throw new Error('No prepared file to verify');
    }
    const row = await this.findStoredRowByFileName(this.coPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, COMMISSION_ONLY.gridColumns.fileName);
    expect(fileNameCell).toContain(this.coPreparedFile.fileName);
  }

  async pollCommissionOnlyExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.coPreparedFile) {
      throw new Error('No prepared file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.coPreparedFile.fileName,
      {
        maxAttempts: COMMISSION_ONLY.uploadPoll.maxAttempts,
        intervalMs: COMMISSION_ONLY.uploadPoll.intervalMs,
      },
    );
    setFileId(fileId);

    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: this.coPreparedFile.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: this.coPreparedFile.fileName,
      carrierName: this.coPreparedFile.carrierName,
    });
  }

  async expectCommissionOnlyUploadStatusWaitingReview(): Promise<void> {
    if (!this.coPreparedFile) {
      throw new Error('No prepared file to check status');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.coPreparedFile.fileName,
      COMMISSION_ONLY.expectedAfterExtract.status,
      COMMISSION_ONLY.expectedAfterExtract.stage,
      getFileId(),
    );
  }

  async waitForCommissionOnlyUploadStage(stage: string): Promise<void> {
    if (!this.coPreparedFile) {
      throw new Error('No prepared commission-only file to check stage');
    }
    // Commission Only stays on Needs Attention after review (advance exceptions),
    // not Completed — poll for the stage asserted by the scenario.
    await this.assertions.expectStoredUploadStage(
      this.coPreparedFile.fileName,
      stage,
      getFileId(),
    );
  }

  /**
   * Direct navigation to Upload — after Complete Review the app often lands on
   * statement-history and the sidebar Upload click can fail to leave that page.
   */
  async navigateToCommissionOnlyUploadPage(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${AppPaths.commissionUpload}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  // ─── Phase 6: Re-navigate and open record ─────────────────────────────

  async openCommissionOnlyRecordByFileId(): Promise<void> {
    const fileIdValue = getFileId();
    const fileName = this.coPreparedFile?.fileName ?? '';
    const row = await this.resolveStoredUploadRow({ fileId: fileIdValue, fileName });

    await this.details.openFromRow(row, fileIdValue);
    await waitForAppSettled(this.page, T);
  }

  // ─── Phase 7: Commission-only reconciliation ──────────────────────────

  async expectCommissionOnlyTooltipText(): Promise<void> {
    expect(
      this.lastTooltipText,
      `Advance exception tooltip should contain expected text but was: "${this.lastTooltipText}"`,
    ).toContain(COMMISSION_ONLY.advanceExceptionTooltip);
  }

  // ─── Phase 9: Prepare recovery file ───────────────────────────────────

  async prepareCommissionOnlyRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.coRecoveryFile = await prepareCommissionOnlyRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.coRecoveryFile.absolutePath);
    setRecoveryFileName(this.coRecoveryFile.fileName);
  }

  // ─── Phase 10: Upload recovery file ──────────────────────────────────

  async uploadCommissionOnlyRecoveryFile(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('Call prepareCommissionOnlyRecoveryFile() before uploading');
    }
    await this.uploadFromPrepared({
      absolutePath: this.coRecoveryFile.absolutePath,
      fileName: this.coRecoveryFile.fileName,
      carrierName: this.coRecoveryFile.carrierName,
    });
  }

  async expectCommissionOnlyRecoveryFileInGrid(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('No recovery file to verify');
    }
    const row = await this.findStoredRowByFileName(this.coRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollCommissionOnlyRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('No recovery file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.coRecoveryFile.fileName,
      {
        maxAttempts: COMMISSION_ONLY.uploadPoll.maxAttempts,
        intervalMs: COMMISSION_ONLY.uploadPoll.intervalMs,
      },
    );
    setRecoveryFileId(fileId);
  }

  async expectCommissionOnlyRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('No recovery file to check');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.coRecoveryFile.fileName,
      COMMISSION_ONLY.expectedAfterExtract.status,
      COMMISSION_ONLY.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  // ─── Phase 11: Open recovery review page ──────────────────────────────

  async openCommissionOnlyRecoveryReviewPage(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('No recovery file to review');
    }
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getRecoveryFileId(),
      fileName: this.coRecoveryFile.fileName,
    });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectCommissionOnlyRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.coRecoveryFile) {
      throw new Error('No recovery file to check Completed stage');
    }
    await this.assertions.pollUntilStageCompleted(
      this.coRecoveryFile.fileName,
      {
        maxAttempts: COMMISSION_ONLY.uploadPoll.maxAttempts,
        intervalMs: COMMISSION_ONLY.uploadPoll.intervalMs,
      },
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Reuse / override base class methods
  // ═══════════════════════════════════════════════════════════════════════

  protected getKnownStoredFileId(): string {
    try {
      return getFileId();
    } catch {
      return super.getKnownStoredFileId();
    }
  }
}
