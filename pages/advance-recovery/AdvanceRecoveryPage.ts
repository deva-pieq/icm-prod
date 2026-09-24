import { expect, type Page } from '@playwright/test';
import { AdvanceOnlyPage } from '../advance-only/AdvanceOnlyPage';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ADVANCE_RECOVERY } from '../../test-data/advance-recovery/validateAdvanceRecovery';
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
} from '../../utils/advance-recovery/advanceRecoveryContext';
import type { AdvanceRecoveryPreparedFile } from '../../utils/advance-recovery/advanceRecoveryExcelPrep';
import {
  prepareAdvanceRecoveryStatementFile,
  prepareAdvanceRecoveryRecoveryFile,
} from '../../utils/advance-recovery/advanceRecoveryExcelPrep';
import { AdvanceRecoveryAssertions } from './AdvanceRecoveryAssertions';
import { captureToast, expectCapturedOrLiveToast, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AdvanceRecoveryPage extends AdvanceOnlyPage {
  private readonly arSidebar: IcmSidebarPage;
  readonly arAssertions: AdvanceRecoveryAssertions;
  private arPreparedFile: AdvanceRecoveryPreparedFile | null = null;
  private arRecoveryFile: AdvanceRecoveryPreparedFile | null = null;
  private arLastTooltipText = '';

  /** Advance-recovery specific locators */
  readonly arLoc = {
    transactionPreviewGrid: () =>
      this.page.getByTestId('transaction-preview-grid'),
    arfCell: () =>
      this.page.locator('[col-id="transactionType"]').filter({ hasText: /ARF/i }),
    chargebackRow: () =>
      this.page.locator('.ag-cell[col-id="earningType"]').filter({ hasText: /CHARGEBACK/i }),
    reconcileAdvanceExceptionButton: () =>
      this.page.getByTestId('reconcile-advance-exception-button'),
    toastMessage: () =>
      this.page
        .getByTestId(/toast/)
        .or(this.page.locator('[data-sonner-toast], [role="alert"], [class*="toast"]'))
        .first(),
  };

  constructor(page: Page) {
    super(page);
    this.arSidebar = new IcmSidebarPage(page);
    this.arAssertions = new AdvanceRecoveryAssertions();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 1 — Prepare statement file
  // ═══════════════════════════════════════════════════════════════════════

  async prepareFile(): Promise<void> {
    this.arPreparedFile = await prepareAdvanceRecoveryStatementFile();
  }

  storePreparedData(): void {
    if (!this.arPreparedFile) {
      throw new Error('Call prepareFile() before storePreparedData()');
    }
    setPolicyNumber(this.arPreparedFile.customerUid);
    setPreparedFilePath(this.arPreparedFile.absolutePath);
    setPreparedFileName(this.arPreparedFile.fileName);
    setCarrierName(this.arPreparedFile.carrierName);
    const stamp = Date.now();
    setTimestamp(stamp);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 2 — Validate Agent eligibility for carrier advance
  // ═══════════════════════════════════════════════════════════════════════

  extractAgentId(): void {
    if (!this.arPreparedFile) {
      throw new Error('Call prepareFile() before extractAgentId()');
    }
    setAgentId(this.arPreparedFile.agentId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 3 — Validate product advance setup
  // ═══════════════════════════════════════════════════════════════════════

  extractProductName(): void {
    if (!this.arPreparedFile) {
      throw new Error('Call prepareFile() before extractProductName()');
    }
    setProductName(this.arPreparedFile.productName);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 4 — Upload the prepared statement file
  // ═══════════════════════════════════════════════════════════════════════

  async uploadPreparedAdvanceRecoveryFile(): Promise<void> {
    if (!this.arPreparedFile) {
      throw new Error('Call prepareFile() before upload');
    }
    await this.uploadFromPrepared({
      absolutePath: this.arPreparedFile.absolutePath,
      fileName: this.arPreparedFile.fileName,
      carrierName: this.arPreparedFile.carrierName,
    });
  }

  async expectUploadedFileInAdvanceRecoveryGrid(): Promise<void> {
    if (!this.arPreparedFile) {
      throw new Error('No prepared file to verify');
    }
    const row = await this.findStoredRowByFileName(this.arPreparedFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, ADVANCE_RECOVERY.gridColumns.fileName);
    expect(fileNameCell).toContain(this.arPreparedFile.fileName);
  }

  async pollExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.arPreparedFile) {
      throw new Error('No prepared file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.arPreparedFile.fileName,
      {
        maxAttempts: ADVANCE_RECOVERY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_RECOVERY.uploadPoll.intervalMs,
      },
    );
    setFileId(fileId);

    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: this.arPreparedFile.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: this.arPreparedFile.fileName,
      carrierName: this.arPreparedFile.carrierName,
    });
  }

  async expectUploadStatusWaitingReview(): Promise<void> {
    if (!this.arPreparedFile) {
      throw new Error('No prepared file to check status');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.arPreparedFile.fileName,
      ADVANCE_RECOVERY.expectedAfterExtract.status,
      ADVANCE_RECOVERY.expectedAfterExtract.stage,
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
    this.arLastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectTooltipContainsNewPolicy(): Promise<void> {
    expect(
      this.arLastTooltipText.toLowerCase(),
      `Tooltip should contain "New Policy" but was: "${this.arLastTooltipText}"`,
    ).toContain(ADVANCE_RECOVERY.warningTooltip.newPolicy.toLowerCase());
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectSuccessToast(): Promise<void> {
    await this.review.expectSuccessToastVisible();
  }

  async waitForUploadStage(stage: string): Promise<void> {
    if (!this.arPreparedFile) {
      throw new Error('No prepared file to check stage');
    }
    await this.assertions.expectStoredUploadStage(
      this.arPreparedFile.fileName,
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
    const fileName = this.arPreparedFile?.fileName ?? '';
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
    await expect(this.page).toHaveURL(/commission-details|reconciliation/i, { timeout: T });
    await expect(
      this.page.getByRole('heading', {
        name: /^Commission\s+(?:Details|Reconciliation)$/i,
      }),
    ).toBeVisible({ timeout: T });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 7 — Reconcile with Commission (ARF flow)
  // ═══════════════════════════════════════════════════════════════════════

  async hoverAdvanceExceptionTooltip(): Promise<void> {
    const icon = this.aoLoc.advanceExceptionWarningIcon();
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.aoLoc.advanceExceptionTooltip().first();
    await expect(tooltip).toBeVisible({ timeout: T });
    this.arLastTooltipText = (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectAdvanceExceptionTooltipText(): Promise<void> {
    expect(
      this.arLastTooltipText,
      `Advance exception tooltip should contain expected text but was: "${this.arLastTooltipText}"`,
    ).toContain(ADVANCE_RECOVERY.advanceExceptionTooltip);
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
    const radio = this.aoLoc.advanceRecoveryRadio();
    await expect(radio).toBeVisible({ timeout: T });
    // Decorative -radio-circle span intercepts pointer events on the sr-only input.
    await radio.check({ force: true });
    await waitForAppSettled(this.page, T);
  }

  /**
   * Override parent captures so values land in advanceRecoveryContext
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

  async expectTransactionPreviewContainsArfRow(): Promise<void> {
    const grid = this.arLoc.transactionPreviewGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const arfRow = this.arLoc.arfCell();
    await expect(
      arfRow.first(),
      'Transaction preview should contain an ARF row',
    ).toBeVisible({ timeout: T });
  }

  /**
   * Click reconcile, then capture the success toast immediately.
   * Do not waitForAppSettled first — the toast auto-dismisses during settle.
   */
  async clickReconcileAdvanceExceptionButton(): Promise<void> {
    const btn = this.arLoc.reconcileAdvanceExceptionButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await captureToast(this.page, this.arLoc.toastMessage(), T);
  }

  async expectSuccessToastMessage(): Promise<void> {
    const text = await expectCapturedOrLiveToast(this.page, this.arLoc.toastMessage(), T);
    if (text) {
      expect.soft(text, 'Toast message should contain "success" or "reconcil" (soft)').toMatch(/success|reconcil/i);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 8 — Validate ARF amount and CHARGEBACK on Policy Ledger
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

  async expectPolicyLedgerContainsChargebackRow(): Promise<void> {
    const chargeback = this.arLoc.chargebackRow();
    await expect(
      chargeback.first(),
      'Policy Ledger should contain a row with CHARGEBACK earning type',
    ).toBeVisible({ timeout: T });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 9-10 — Prepare and upload recovery file
  // ═══════════════════════════════════════════════════════════════════════

  async prepareRecoveryFile(): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.arRecoveryFile = await prepareAdvanceRecoveryRecoveryFile(policyNumber, timestamp);
    setRecoveryFilePath(this.arRecoveryFile.absolutePath);
    setRecoveryFileName(this.arRecoveryFile.fileName);
  }

  async uploadRecoveryFile(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('Call prepareRecoveryFile() before uploading');
    }
    await this.uploadFromPrepared({
      absolutePath: this.arRecoveryFile.absolutePath,
      fileName: this.arRecoveryFile.fileName,
      carrierName: this.arRecoveryFile.carrierName,
    });
  }

  async expectRecoveryFileInGrid(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('No recovery file to verify');
    }
    const row = await this.findStoredRowByFileName(this.arRecoveryFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollRecoveryExtractProcessingAndCaptureFileId(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('No recovery file to poll');
    }
    const fileId = await this.assertions.pollPastExtractProcessing(
      this.arRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_RECOVERY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_RECOVERY.uploadPoll.intervalMs,
      },
    );
    setRecoveryFileId(fileId);
  }

  async expectRecoveryUploadStatusWaitingReview(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('No recovery file to check');
    }
    await this.assertions.expectStoredUploadStatusAndStage(
      this.arRecoveryFile.fileName,
      ADVANCE_RECOVERY.expectedAfterExtract.status,
      ADVANCE_RECOVERY.expectedAfterExtract.stage,
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 11 — Review recovery and verify chargeback
  // ═══════════════════════════════════════════════════════════════════════

  async openRecoveryReviewPage(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('No recovery file to review');
    }
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getRecoveryFileId(),
      fileName: this.arRecoveryFile.fileName,
    });
    await this.review.openFromRow(row, getRecoveryFileId());
    await waitForAppSettled(this.page, T);
  }

  async completeRecoveryReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectRecoveryUploadStageCompleted(): Promise<void> {
    if (!this.arRecoveryFile) {
      throw new Error('No recovery file to check Completed stage');
    }
    await this.assertions.pollUntilStageCompleted(
      this.arRecoveryFile.fileName,
      {
        maxAttempts: ADVANCE_RECOVERY.uploadPoll.maxAttempts,
        intervalMs: ADVANCE_RECOVERY.uploadPoll.intervalMs,
      },
      getRecoveryFileId(),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 12 — Validate ADVANCE_EARNED in Policy Ledger (inherited)
  // ═══════════════════════════════════════════════════════════════════════

  // expandCommissionRowInLedger() and expectCommissionDetailsContainAdvanceEarned()
  // are inherited from AdvanceOnlyPage

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 13 — Validate Advance Overview historical record
  // ═══════════════════════════════════════════════════════════════════════

  async navigateToAdvanceOverview(): Promise<void> {
    await this.arSidebar.waitForSidebar();
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${ADVANCE_RECOVERY.advanceOverviewUrl}`, {
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

  // ═══════════════════════════════════════════════════════════════════════
  // Override base class methods
  // ═══════════════════════════════════════════════════════════════════════

  protected getKnownStoredFileId(): string {
    try {
      return getFileId();
    } catch {
      return super.getKnownStoredFileId();
    }
  }
}
