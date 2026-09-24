import { expect, type Page } from '@playwright/test';
import { AdvanceOnlyPage } from '../advance-only/AdvanceOnlyPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { ADVANCE_ADJUSTMENT } from '../../test-data/advance-adjustment/validateAdvanceAdjustment';
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
} from '../../utils/advance-adjustment/advanceAdjustmentContext';
import type { AdvanceAdjustmentPreparedFile } from '../../utils/advance-adjustment/advanceAdjustmentExcelPrep';
import {
  prepareAdvanceAdjustmentStatementFile,
  prepareAdvanceAdjustmentRecoveryFile,
} from '../../utils/advance-adjustment/advanceAdjustmentExcelPrep';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AdvanceAdjustmentPage extends AdvanceOnlyPage {
  private readonly aaSidebar: IcmSidebarPage;
  private aaPreparedFile: AdvanceAdjustmentPreparedFile | null = null;
  private aaRecoveryFile: AdvanceAdjustmentPreparedFile | null = null;
  private aaLastTooltipText = '';

  /** Advance-adjustment specific locators */
  readonly aaLoc = {
    transactionPreviewGrid: () =>
      this.page.getByTestId('transaction-preview-grid'),
    arfCell: () =>
      this.page.locator('[col-id="transactionType"]').filter({ hasText: /ARF/i }),
    adjustedTextCell: () =>
      this.page.locator('[col-id="transactionType"]').filter({ hasText: /Adjustment/i }),
    reconcileAdvanceExceptionButton: () =>
      this.page.getByTestId('reconcile-advance-exception-button'),
  };

  constructor(page: Page) {
    super(page);
    this.aaSidebar = new IcmSidebarPage(page);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 1 — Prepare statement file
  // ═══════════════════════════════════════════════════════════════════════

  async prepareFile(): Promise<void> {
    this.aaPreparedFile = await prepareAdvanceAdjustmentStatementFile();
  }

  storePreparedData(): void {
    if (!this.aaPreparedFile) {
      throw new Error('Call prepareFile() before storePreparedData()');
    }
    setPolicyNumber(this.aaPreparedFile.customerUid);
    setPreparedFilePath(this.aaPreparedFile.absolutePath);
    setPreparedFileName(this.aaPreparedFile.fileName);
    setCarrierName(this.aaPreparedFile.carrierName);
    const stamp = Date.now();
    setTimestamp(stamp);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 2 — Validate Agent eligibility for carrier advance
  // ═══════════════════════════════════════════════════════════════════════

  extractAgentId(): void {
    if (!this.aaPreparedFile) {
      throw new Error('Call prepareFile() before extractAgentId()');
    }
    setAgentId(this.aaPreparedFile.agentId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 3 — Validate product advance setup
  // ═══════════════════════════════════════════════════════════════════════

  extractProductName(): void {
    if (!this.aaPreparedFile) {
      throw new Error('Call prepareFile() before extractProductName()');
    }
    setProductName(this.aaPreparedFile.productName);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 4 — Upload the prepared statement file
  // ═══════════════════════════════════════════════════════════════════════

  async uploadPreparedAdvanceAdjustmentFile(): Promise<void> {
    if (!this.aaPreparedFile) {
      throw new Error('Call prepareFile() before upload');
    }
    await this.uploadFromPrepared({
      absolutePath: this.aaPreparedFile.absolutePath,
      fileName: this.aaPreparedFile.fileName,
      carrierName: this.aaPreparedFile.carrierName,
    });
  }

  async expectUploadedFileInAdvanceAdjustmentGrid(): Promise<void> {
    if (!this.aaPreparedFile) {
      throw new Error('No prepared file to verify');
    }
    const row = await this.findStoredRowByFileName(this.aaPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, ADVANCE_ADJUSTMENT.gridColumns.fileName);
    expect(fileNameCell).toContain(this.aaPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.aaPreparedFile) {
      throw new Error('No prepared file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.aaPreparedFile.fileName,
      {
        maxAttempts: ADVANCE_ADJUSTMENT.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ADJUSTMENT.uploadPoll.intervalMs,
      },
    );
    setFileId(fileId);

    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: this.aaPreparedFile.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: this.aaPreparedFile.fileName,
      carrierName: this.aaPreparedFile.carrierName,
    });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.aaPreparedFile) {
      throw new Error('No prepared file to check status');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.aaPreparedFile.fileName,
      ADVANCE_ADJUSTMENT.expectedAfterExtract.status,
      ADVANCE_ADJUSTMENT.expectedAfterExtract.stage,
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
    this.aaLastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectTooltipContainsNewPolicy(): Promise<void> {
    expect(
      this.aaLastTooltipText.toLowerCase(),
      `Tooltip should contain "New Policy" but was: "${this.aaLastTooltipText}"`,
    ).toContain(ADVANCE_ADJUSTMENT.warningTooltip.newPolicy.toLowerCase());
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectSuccessToast(): Promise<void> {
    await this.review.expectSuccessToastVisible();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.aaPreparedFile) {
      throw new Error('No prepared file to check stage');
    }
    await this.assertions.expectStoredUploadStage(
      this.aaPreparedFile.fileName,
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
    const fileName = this.aaPreparedFile?.fileName ?? '';
    const row = await this.resolveStoredUploadRow({ fileId: fileIdValue, fileName });

    await this.details.openFromRow(row, fileIdValue);
    await waitForAppSettled(this.page, T);
  }

  async waitForNeedsAttentionOrReconciliation(): Promise<void> {
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
  // Phase 7 — Reconcile with Advance and Adjustment
  // ═══════════════════════════════════════════════════════════════════════

  async hoverAdvanceExceptionTooltip(): Promise<void> {
    const icon = this.aoLoc.advanceExceptionWarningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.aoLoc.advanceExceptionTooltip().first();
    await expect(tooltip).toBeVisible({ timeout: T });
    this.aaLastTooltipText = (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectAdvanceExceptionTooltipText(): Promise<void> {
    expect(
      this.aaLastTooltipText,
      `Advance exception tooltip should contain expected text but was: "${this.aaLastTooltipText}"`,
    ).toContain(ADVANCE_ADJUSTMENT.advanceExceptionTooltip);
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

  async selectCommissionRadio(): Promise<void> {
    const radio = this.aoLoc.advanceAdjustmentsRadio();
    await expect(radio).toBeVisible({ timeout: T });
    await radio.check({ force: true });
    await waitForAppSettled(this.page, T);
  }

  /**
   * Override parent captures so values land in advanceAdjustmentContext
   * (parent AdvanceOnlyPage writes to advanceOnlyContext).
   */
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

  async expectTransactionPreviewContainsArfAndAdjusted(): Promise<void> {
    const grid = this.aaLoc.transactionPreviewGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const arfRow = this.aaLoc.arfCell();
    await expect(
      arfRow.first(),
      'Transaction preview should contain an ARF row',
    ).toBeVisible({ timeout: T });
    const adjustedRow = this.aaLoc.adjustedTextCell();
    await expect(
      adjustedRow.first(),
      'Transaction preview should contain an Adjusted row',
    ).toBeVisible({ timeout: T });
  }

  async clickReconcileAdvanceExceptionButton(): Promise<void> {
    const btn = this.aaLoc.reconcileAdvanceExceptionButton();
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
    await waitForAppSettled(this.page, T * 2);
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
    this.aaRecoveryFile = await prepareAdvanceAdjustmentRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.aaRecoveryFile.absolutePath);
    setRecoveryFileName(this.aaRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('Call prepareRecoveryFile() before uploading');
    }
    await this.uploadFromPrepared({
      absolutePath: this.aaRecoveryFile.absolutePath,
      fileName: this.aaRecoveryFile.fileName,
      carrierName: this.aaRecoveryFile.carrierName,
    });
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('No recovery file to verify');
    }
    const row = await this.findStoredRowByFileName(this.aaRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('No recovery file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.aaRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_ADJUSTMENT.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ADJUSTMENT.uploadPoll.intervalMs,
      },
    );
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('No recovery file to check');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.aaRecoveryFile.fileName,
      ADVANCE_ADJUSTMENT.expectedAfterExtract.status,
      ADVANCE_ADJUSTMENT.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 11 — Review recovery and verify chargeback
  // ═══════════════════════════════════════════════════════════════════════

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('No recovery file to review');
    }
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getRecoveryFileId(),
      fileName: this.aaRecoveryFile.fileName,
    });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async completeRecoveryReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.aaRecoveryFile) {
      throw new Error('No recovery file to check Completed stage');
    }
    await this.assertions.pollUntilStageCompleted(
      this.aaRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_ADJUSTMENT.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_ADJUSTMENT.uploadPoll.intervalMs,
      },
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 12 — Validate ADVANCE_EARNED in Policy Ledger
  // ═══════════════════════════════════════════════════════════════════════

  // expandCommissionRowInLedger() and expectCommissionDetailsContainAdvanceEarned()
  // are inherited from AdvanceOnlyPage

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 13 — Validate Advance Overview historical record
  // ═══════════════════════════════════════════════════════════════════════

  async navigateToAdvanceOverview(): Promise<void> {
    await this.aaSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${ADVANCE_ADJUSTMENT.advanceOverviewUrl}`, {
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

    await expect
      .poll(
        async () => {
          const card = this.aoLoc.advancePolicyDetailsCard();
          const cardText = (await card.innerText().catch(() => '')).replace(/\s+/g, ' ');
          if (cardText.toLowerCase().includes(productName.toLowerCase())) return true;
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
    const loading = this.aoLoc.advanceOverviewLoadingStatus();
    if (await loading.isVisible().catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: T * 2 });
    }
    const balanceHeader = this.page.locator('.ag-header-cell[col-id="balance"]');
    await expect(balanceHeader).toBeVisible({ timeout: T });
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

    const balanceZero = firstRow.locator('[col-id="balance"]').getByText(/0\.00/);
    await expect(balanceZero).toBeVisible({ timeout: T });
  }

  protected getKnownStoredFileId(): string {
    try {
      return getFileId();
    } catch {
      return super.getKnownStoredFileId();
    }
  }
}
