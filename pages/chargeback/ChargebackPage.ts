import { expect, type Locator, type Page } from '@playwright/test';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { PoliciesPage } from '../policies/PoliciesPage';
import { AppUrlPatterns } from '../appPaths';
import { CHARGEBACK, type ChargebackRcVariant } from '../../test-data/chargeback/validateChargeback';
import {
  setPolicyNumber,
  setTimestamp,
  setNbFilePath,
  setNbFileName,
  setNbFileId,
  setAgentId,
  setProductName,
  setCarrierName,
  setActiveRcVariant,
  setRcFilePath,
  setRcFileName,
  setRcFileId,
  getPolicyNumber,
  getTimestamp,
  getNbFileId,
  getNbFileName,
  getActiveRcVariant,
  getActiveRcFileId,
  getActiveRcFileName,
  getRcFileId,
} from '../../utils/chargeback/chargebackContext';
import {
  prepareChargebackNbFile,
  prepareChargebackRcFile,
  type ChargebackPreparedFile,
} from '../../utils/chargeback/chargebackExcelPrep';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class ChargebackPage extends StatementUploadPage {
  readonly policies: PoliciesPage;
  private nbFile: ChargebackPreparedFile | null = null;
  private rcFile: ChargebackPreparedFile | null = null;

  readonly cbLoc = {
    statementHistoryHeading: () =>
      this.page.getByRole('heading', { name: /commission statement history/i }),
    historySearchInput: () => this.page.getByRole('textbox', { name: 'Search data grid' }),
    stagesSelectedButton: () => this.page.getByRole('button', { name: /stages selected/i }),
    stageFilterOption: (label: string) =>
      this.page.locator(`//div[contains(@id,'filter-stage-option')]//span[text()='${label}']`)
        .or(this.page.getByRole('option', { name: label })),

    commissionDetailsHeading: () =>
      this.page
        .getByRole('heading', { name: /^Commission\s+(?:Details|Reconciliation)$/i })
        .or(this.page.getByRole('heading', { name: /commission details/i })),
    totalChargebackCard: () => this.page.getByTestId('total-chargeback-card'),
    totalChargebackValue: () =>
      this.page.locator('//div[@data-testid="total-chargeback-card"]//span').first(),

    chargebackRecoveryHeading: () =>
      this.page.getByRole('heading', { name: CHARGEBACK.chargebackRecoveryHeading, exact: true })
        .or(this.page.locator(`//h4[text()="${CHARGEBACK.chargebackRecoveryHeading}"]`)),
    recoveryOptionSplitRadio: () => this.page.getByTestId('recovery-option-split-radio'),
    recoveryOptionAgencyRadio: () => this.page.getByTestId('recovery-option-agency-radio'),
    recoveryOptionAgentRadio: () => this.page.getByTestId('recovery-option-agent-radio'),
    chargebackRationaleInput: () =>
      this.page.locator('#textarea-chargeback-rationale-input')
        .or(this.page.getByTestId('textarea-chargeback-rationale-input')),
    reconcileButton: () =>
      this.page.getByTestId('reconcile-button')
        .or(this.page.getByRole('button', { name: /^reconcile$/i })),

    policyActionsButton: () => this.page.getByTestId(/policy-actions/i),
    viewLedgerMenuItem: () =>
      this.page.getByRole('button', { name: /view ledger|policy ledger/i }),
    policyLedgerGrid: () => this.page.getByTestId('policy-ledger-transactions-datagrid'),
    ledgerRefreshButton: () => this.page.getByTestId('data-grid-refresh-button'),
    ledgerDetailRow: () => this.page.getByTestId('data-grid-detail-row'),
  };

  constructor(page: Page) {
    super(page);
    this.policies = new PoliciesPage(page);
  }

  // ═══ Phase 1 — Prepare NB statement ═════════════════════════════════

  async prepareNbFile(): Promise<void> {
    this.nbFile = await prepareChargebackNbFile();
  }

  storeNbPreparedData(): void {
    if (!this.nbFile) throw new Error('Call prepareNbFile() before storeNbPreparedData()');
    setPolicyNumber(this.nbFile.customerUid);
    setNbFilePath(this.nbFile.absolutePath);
    setNbFileName(this.nbFile.fileName);
    setCarrierName(this.nbFile.carrierName);
    setAgentId(this.nbFile.agentId);
    setProductName(this.nbFile.productName);
    setTimestamp(Date.now());
  }

  // ═══ Upload helpers ═════════════════════════════════════════════════

  async openStatementUploadPage(): Promise<void> {
    await this.openUploadPage();
  }

  async uploadNbFile(): Promise<void> {
    if (!this.nbFile) throw new Error('Call prepareNbFile() before uploading NB');
    this.setPreparedFile({
      absolutePath: this.nbFile.absolutePath,
      fileName: this.nbFile.fileName,
      carrierName: this.nbFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async selectAetnaAcaStatementType(): Promise<void> {
    await this.selectStatementType(CHARGEBACK.statementType);
  }

  async submitUpload(): Promise<void> {
    await this.clickUploadStatement();
  }

  async expectNbFileInGrid(): Promise<void> {
    if (!this.nbFile) throw new Error('No NB file to verify');
    const row = await this.findStoredRowByFileName(this.nbFile.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
  }

  async pollNbExtractAndCaptureFileId(): Promise<void> {
    if (!this.nbFile) throw new Error('No NB file to poll');
    const fileId = await this.assertions.pollPastExtractProcessing(this.nbFile.fileName, {
      maxAttempts: CHARGEBACK.uploadPoll.maxAttempts,
      intervalMs: CHARGEBACK.uploadPoll.intervalMs,
    });
    setNbFileId(fileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName: this.nbFile.fileName });
    this.setStoredRow({
      row,
      fileId,
      fileName: this.nbFile.fileName,
      carrierName: this.nbFile.carrierName,
    });
  }

  async expectNbUploadWaitingReview(): Promise<void> {
    if (!this.nbFile) throw new Error('No NB file to check');
    await this.assertions.expectStoredUploadStatusAndStage(
      this.nbFile.fileName,
      CHARGEBACK.expectedAfterExtract.status,
      CHARGEBACK.expectedAfterExtract.stage,
      getNbFileId(),
    );
  }

  async openNbReviewPage(): Promise<void> {
    if (!this.nbFile) throw new Error('No NB file to review');
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getNbFileId(),
      fileName: this.nbFile.fileName,
    });
    await this.review.openFromRow(row, getNbFileId());
    await waitForAppSettled(this.page, T);
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectNbUploadStageCompleted(): Promise<void> {
    if (!this.nbFile) throw new Error('No NB file to check Completed stage');
    await this.assertions.pollUntilStageCompleted(
      this.nbFile.fileName,
      {
        maxAttempts: CHARGEBACK.uploadPoll.maxAttempts,
        intervalMs: CHARGEBACK.uploadPoll.intervalMs,
      },
      getNbFileId(),
    );
  }

  // ═══ History — Completed filter + stage assert ══════════════════════

  async openStatementHistoryPage(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}/commission-processing/statement-history`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionHistory, { timeout: T });
    await expect(this.cbLoc.statementHistoryHeading()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /**
   * History defaults to 6 stages and excludes Completed. Open the stage filter
   * and select the given stage when the toggle still shows "6 stages selected"
   * (or the option is visibly unchecked). Mirrors StatementHistoryPage.
   */
  private async ensureHistoryStageSelected(stageLabel: string): Promise<void> {
    const toggle = this.cbLoc.stagesSelectedButton();
    if (!(await toggle.isVisible().catch(() => false))) return;

    const toggleText = (await toggle.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    // Completed is the stage typically excluded from the default 6-stage filter.
    const likelyMissingCompleted = /6\s+stages\s+selected/i.test(toggleText);
    if (stageLabel === 'Completed' && !likelyMissingCompleted) return;

    await toggle.click();
    await this.page.waitForTimeout(500);

    const opt = this.page
      .locator(`//div[contains(@id,'filter-stage-option')]//span[text()='${stageLabel}']`)
      .or(this.page.getByRole('option', { name: stageLabel }))
      .first();
    if (await opt.isVisible().catch(() => false)) {
      const parent = opt.locator('xpath=ancestor::div[contains(@id,"filter-stage-option")][1]');
      const selected =
        (await opt.getAttribute('selected').catch(() => null)) ??
        (await parent.getAttribute('aria-selected').catch(() => null)) ??
        (await parent.getAttribute('data-state').catch(() => null));
      const alreadyOn = selected === '' || selected === 'true' || selected === 'checked';
      if (!alreadyOn || (stageLabel === 'Completed' && likelyMissingCompleted)) {
        await opt.click({ force: true });
        await this.page.waitForTimeout(300);
      }
    }
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  async searchHistoryByFileId(fileId: string): Promise<void> {
    const search = this.cbLoc.historySearchInput();
    await expect(search).toBeVisible({ timeout: T });

    await expect
      .poll(
        async () => {
          await this.refreshGrid().catch(() => undefined);
          await this.ensureHistoryStageSelected('Completed');

          if (await search.isVisible().catch(() => false)) {
            await search.fill('');
            await search.fill(fileId);
            await this.page.waitForTimeout(1_500);
          }

          const row = this.page
            .getByRole('grid', { name: 'Data grid' })
            .getByRole('row')
            .filter({ hasNot: this.page.getByRole('columnheader') })
            .filter({ hasText: fileId })
            .first();
          return row.isVisible().catch(() => false);
        },
        { timeout: T, intervals: [3_000, 5_000, 8_000] },
      )
      .toBe(true);

    await waitForAppSettled(this.page, T);
  }

  async expectHistoryRowStage(fileId: string, stage: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: fileId })
      .first();
    await expect(row, `History row for file ID ${fileId} not found`).toBeVisible({ timeout: T });
    await expect(row, `History row stage should contain "${stage}"`).toContainText(
      new RegExp(stage, 'i'),
      { timeout: T },
    );
  }

  async clickHistoryRecordByFileId(fileId: string): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: fileId })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    const lock = this.page.getByTestId('review-lock-modal-acquire');
    if (await lock.isVisible().catch(() => false)) {
      await lock.click();
    }
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
  }

  /** Open commission details for the active RC Needs Attention history row. */
  async clickActiveRcStatementHistoryRecord(): Promise<void> {
    await this.clickHistoryRecordByFileId(getActiveRcFileId());
  }

  async expectCommissionDetailsPageDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
    const heading = this.cbLoc.commissionDetailsHeading().first();
    if (await heading.isVisible().catch(() => false)) {
      await expect(heading).toBeVisible({ timeout: T });
    }
    await waitForAppSettled(this.page, T);
  }

  /**
   * On Commission Details, open the CHARGEBACK line item so the recovery panel appears.
   */
  async clickChargebackRecordOnCommissionDetails(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: /CHARGEBACK/i })
      .first();
    await expect(
      row,
      'Expected a CHARGEBACK row on commission details before opening recovery',
    ).toBeVisible({ timeout: T });
    await row.click();
    const lock = this.page.getByTestId('review-lock-modal-acquire');
    if (await lock.isVisible().catch(() => false)) {
      await lock.click();
    }
    await waitForAppSettled(this.page, T);
  }

  // ═══ Policy Ledger ══════════════════════════════════════════════════

  async navigateToPoliciesPage(): Promise<void> {
    await this.policies.openList();
    await waitForAppSettled(this.page, T);
  }

  async searchPoliciesByStoredPolicyNumber(): Promise<void> {
    await this.policies.searchGrid(getPolicyNumber());
    await this.page.waitForTimeout(2_000);
    await waitForAppSettled(this.page, T * 2);
  }

  async openPolicyLedger(): Promise<void> {
    const btn = this.cbLoc.policyActionsButton();
    await expect(btn.first()).toBeVisible({ timeout: T });
    await btn.first().click();
    await waitForAppSettled(this.page, T);
    const item = this.cbLoc.viewLedgerMenuItem();
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
    const grid = this.cbLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const cell = grid
      .locator('.ag-cell[col-id="earningType"]')
      .filter({ hasText: new RegExp(`^${earningType}$`, 'i') });
    await expect(cell.first(), `Ledger should contain "${earningType}" earning type`).toBeVisible({
      timeout: T,
    });
  }

  async clickLastChargebackRowInLedger(): Promise<void> {
    const grid = this.cbLoc.policyLedgerGrid();
    await expect(grid).toBeVisible({ timeout: T });

    const refresh = this.cbLoc.ledgerRefreshButton();
    if (await refresh.isVisible().catch(() => false)) {
      await refresh.click();
      await waitForAppSettled(this.page, T);
    }

    const cells = grid
      .locator('.ag-cell[col-id="earningType"]')
      .filter({ hasText: /^CHARGEBACK$/i });
    await expect(cells.last(), 'Ledger should contain at least one CHARGEBACK row').toBeVisible({
      timeout: T,
    });
    await cells.last().click({ force: true });
    await waitForAppSettled(this.page, T);
  }

  async expectChargebackDetailContains(labels: readonly string[]): Promise<void> {
    const detail = this.cbLoc.ledgerDetailRow().first();
    await expect(detail).toBeVisible({ timeout: T });
    const text = (await detail.innerText()).replace(/\s+/g, ' ').trim();
    for (const label of labels) {
      expect(text, `CHARGEBACK detail should contain "${label}" (got: ${text})`).toMatch(
        new RegExp(label, 'i'),
      );
    }
  }

  async expectChargebackDetailContainsOnly(allowed: readonly string[]): Promise<void> {
    const detail = this.cbLoc.ledgerDetailRow().first();
    await expect(detail).toBeVisible({ timeout: T });
    const text = (await detail.innerText()).replace(/\s+/g, ' ').trim();

    for (const label of allowed) {
      expect(text, `CHARGEBACK detail should contain "${label}" (got: ${text})`).toMatch(
        new RegExp(label, 'i'),
      );
    }

    const parties = ['Agency', 'Agent', 'Sales Leader'] as const;
    for (const party of parties) {
      if (allowed.some((a) => a.toLowerCase() === party.toLowerCase())) continue;
      expect(text, `CHARGEBACK detail should NOT contain "${party}" (got: ${text})`).not.toMatch(
        new RegExp(`\\b${party}\\b`, 'i'),
      );
    }
  }

  // ═══ RC prepare / upload / review ═══════════════════════════════════

  async prepareRcFile(variant: ChargebackRcVariant): Promise<void> {
    const policyNumber = getPolicyNumber();
    const timestamp = getTimestamp();
    this.rcFile = await prepareChargebackRcFile(variant, policyNumber, timestamp);
    setActiveRcVariant(variant);
    setRcFilePath(variant, this.rcFile.absolutePath);
    setRcFileName(variant, this.rcFile.fileName);
  }

  async uploadActiveRcFile(): Promise<void> {
    if (!this.rcFile) throw new Error('Call prepareRcFile() before uploading RC');
    this.setPreparedFile({
      absolutePath: this.rcFile.absolutePath,
      fileName: this.rcFile.fileName,
      carrierName: this.rcFile.carrierName,
    });
    await super.uploadPreparedFile();
  }

  async expectActiveRcFileInGrid(): Promise<void> {
    const fileName = getActiveRcFileName();
    const row = await this.findStoredRowByFileName(fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    // Drop stale NB fileId so resolveStoredUploadRow matches by RC fileName.
    this.setStoredRow({
      row,
      fileId: '',
      fileName,
      carrierName: CHARGEBACK.carrierName,
    });
  }

  async pollActiveRcExtractAndCaptureFileId(): Promise<void> {
    const variant = getActiveRcVariant();
    const fileName = getActiveRcFileName();
    // Ensure we do not resolve the prior NB BT-* id during extract polling.
    const existing = this.getStoredRow();
    this.setStoredRow({
      row: existing?.row ?? (await this.findStoredRowByFileName(fileName, T * 2)),
      fileId: '',
      fileName,
      carrierName: CHARGEBACK.carrierName,
    });
    const fileId = await this.assertions.pollPastExtractProcessing(fileName, {
      maxAttempts: CHARGEBACK.uploadPoll.maxAttempts,
      intervalMs: CHARGEBACK.uploadPoll.intervalMs,
    });
    setRcFileId(variant, fileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    this.setStoredRow({
      row,
      fileId,
      fileName,
      carrierName: CHARGEBACK.carrierName,
    });
  }

  async expectActiveRcUploadWaitingReview(): Promise<void> {
    await this.assertions.expectStoredUploadStatusAndStage(
      getActiveRcFileName(),
      CHARGEBACK.expectedAfterExtract.status,
      CHARGEBACK.expectedAfterExtract.stage,
      getActiveRcFileId(),
    );
  }

  async openActiveRcReviewPage(): Promise<void> {
    await this.ensureOnUploadPage();
    const row = await this.resolveStoredUploadRow({
      fileId: getActiveRcFileId(),
      fileName: getActiveRcFileName(),
    });
    await this.review.openFromRow(row, getActiveRcFileId());
    await waitForAppSettled(this.page, T);
  }

  async expectActiveRcUploadStage(stage: string): Promise<void> {
    await this.assertions.expectStoredUploadStage(
      getActiveRcFileName(),
      stage,
      getActiveRcFileId(),
    );
  }

  // ═══ Chargeback recovery UI ═════════════════════════════════════════

  async expectTotalChargebackCardNonZero(): Promise<void> {
    const card = this.cbLoc.totalChargebackCard();
    await expect(card).toBeVisible({ timeout: T });
    const valueLoc = this.cbLoc.totalChargebackValue();
    await expect(valueLoc).toBeVisible({ timeout: T });
    const raw = (await valueLoc.innerText()).replace(/\s+/g, ' ').trim();
    const amount = Number.parseFloat(raw.replace(/[$,()]/g, ''));
    expect(
      Number.isFinite(amount) && Math.abs(amount) > 0.001,
      `total-chargeback-card value "${raw}" should be non-zero`,
    ).toBe(true);
  }

  async expectChargebackRecoveryHeadingVisible(): Promise<void> {
    await expect(this.cbLoc.chargebackRecoveryHeading()).toBeVisible({ timeout: T });
  }

  private recoveryRadio(variant: ChargebackRcVariant): Locator {
    if (variant === 'RC1') return this.cbLoc.recoveryOptionSplitRadio();
    if (variant === 'RC2') return this.cbLoc.recoveryOptionAgencyRadio();
    return this.cbLoc.recoveryOptionAgentRadio();
  }

  async ensureRecoveryOptionSelected(variant: ChargebackRcVariant): Promise<void> {
    const radio = this.recoveryRadio(variant);
    await expect(radio).toBeVisible({ timeout: T });
    if (!(await radio.isChecked().catch(() => false))) {
      await radio.click({ force: true });
      await waitForAppSettled(this.page, T);
    }
    await expect(radio, `${variant} recovery option radio should be checked`).toBeChecked({
      timeout: T,
    });
  }

  async fillChargebackRationale(text: string): Promise<void> {
    const input = this.cbLoc.chargebackRationaleInput();
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(text);
  }

  async clickReconcileAndWait(): Promise<void> {
    const btn = this.cbLoc.reconcileButton().first();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await this.page.waitForTimeout(2_000);
    await waitForAppSettled(this.page, T);
  }

  async reconcileActiveRcRecovery(): Promise<void> {
    const variant = getActiveRcVariant();
    const opts = CHARGEBACK.recoveryOptions[variant];
    await this.ensureRecoveryOptionSelected(variant);
    await this.fillChargebackRationale(opts.rationale);
    await this.clickReconcileAndWait();
  }

  async expectActiveRcLedgerDetailParties(): Promise<void> {
    const variant = getActiveRcVariant();
    const opts = CHARGEBACK.recoveryOptions[variant];
    if (opts.detailMustNotContain.length === 0) {
      await this.expectChargebackDetailContains(opts.detailMustContain);
    } else {
      await this.expectChargebackDetailContainsOnly(opts.detailMustContain);
    }
  }

  async searchHistoryForActiveRc(): Promise<void> {
    await this.searchHistoryByFileId(getActiveRcFileId());
  }

  async expectActiveRcHistoryNeedsAttention(): Promise<void> {
    await this.expectHistoryRowStage(getActiveRcFileId(), CHARGEBACK.needsAttentionStage);
  }

  async clickActiveRcHistoryRecord(): Promise<void> {
    await this.clickActiveRcStatementHistoryRecord();
  }

  async searchHistoryForNbCompleted(): Promise<void> {
    await this.searchHistoryByFileId(getNbFileId());
  }

  async expectNbHistoryCompleted(): Promise<void> {
    await this.expectHistoryRowStage(getNbFileId(), CHARGEBACK.completedStage);
  }

  /** Prefer active RC file ID, else NB. */
  protected getKnownStoredFileId(): string {
    try {
      return getActiveRcFileId();
    } catch {
      try {
        return getNbFileId();
      } catch {
        return super.getKnownStoredFileId();
      }
    }
  }

  // expose getters used by steps that need explicit file IDs
  getNbFileIdForSteps(): string {
    return getNbFileId();
  }

  getRcFileIdForSteps(variant: ChargebackRcVariant): string {
    return getRcFileId(variant);
  }

  getNbFileNameForSteps(): string {
    return getNbFileName();
  }
}
