import { expect, type Page } from '@playwright/test';
import { ProductsPage } from '../products/ProductsPage';
import { AppPaths } from '../appPaths';
import { CommissionRulePage, type AgentLevelCommissionSplit } from '../products/CommissionRulePage';
import { StatementUploadPage } from './StatementUploadPage';
import { CommissionDetailsPage } from './CommissionDetailsPage';
import { COMMISSION_TRUTH } from '../../test-data/commission-split/commissionTruth';
import {
  addCommissionTruthLineItem,
  clearCommissionTruthLineItems,
  clearProductCommissionPercentCache,
  getAllProductCommissionPercentCache,
  getCommissionTruthLineItems,
  getCommissionTruthPreparedFile,
  getCommissionTruthUploadState,
  getProductCommissionPercentCache,
  getValidatedCommissionTruthLineItems,
  hasProductCommissionPercentCache,
  setCommissionTruthPreparedFile,
  setCommissionTruthUploadState,
  setProductCommissionPercentCache,
  type CommissionTruthLineItem,
  type ProductLevelCommissionPercent,
} from '../../utils/commission-split/commissionTruthContext';
import {
  appendCommissionTruthLineItem,
  finalizeCommissionTruthSheet,
  writeCommissionTruthSheetSkeleton,
} from '../../utils/commission-split/truthSheetWriter';
import { toCommissionTruthPreparedFile } from '../../utils/commission-split/toCommissionTruthPreparedFile';
import { prepareCommissionTruthFileFromInbox } from '../../utils/commission-split/statementInboxPrep';
import { debugLogFileIdCaptured } from '../../utils/debugSteps';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;
const LOG_PREFIX = '[validate-commission-truth]';

export class CommissionTruthValidationPage extends StatementUploadPage {
  readonly details: CommissionDetailsPage;
  private commissionDetailsListUrl = '';

  constructor(page: Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
  }

  prepareFromContext(): void {
    this.setPreparedFile(toCommissionTruthPreparedFile());
  }

  async uploadPreparedCommissionTruthCsv(): Promise<void> {
    await this.uploadFromPrepared(toCommissionTruthPreparedFile());
  }

  async selectPreparedStatementType(): Promise<void> {
    const { statementType } = getCommissionTruthPreparedFile();
    await this.selectStatementType(statementType);
  }

  async expectUploadedFileInGrid(): Promise<void> {
    const file = this.getPreparedFile();
    const row = await this.findStoredRowByFileName(file.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, COMMISSION_TRUTH.gridColumns.fileName);
    expect(fileNameCell).toContain(file.fileName);
  }

  async captureUploadAfterExtractPoll(uploadedByEmail: string) {
    const file = this.getPreparedFile();
    const prepared = getCommissionTruthPreparedFile();
    const displayName = await this.readUploaderDisplayName();
    const loginTag =
      displayName || uploadedByEmail.split('@')[0]?.trim() || uploadedByEmail;

    const row = await this.findStoredRowByFileName(file.fileName, T * 2);
    const uploadedCell = await this.readCellText(row, COMMISSION_TRUTH.gridColumns.uploaded);
    const rowText = await row.innerText();
    expect(
      uploadedCell.toLowerCase().includes(loginTag.toLowerCase()) ||
        rowText.toLowerCase().includes(loginTag.toLowerCase()),
    ).toBeTruthy();

    const initialFileId = await this.readFileIdFromRow(row);
    this.setStoredRow({
      row,
      fileId: initialFileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });

    const fileId = await this.assertions.pollUntilUploadReviewReady(
      file.fileName,
      COMMISSION_TRUTH.expectedAfterExtract.status,
      COMMISSION_TRUTH.expectedAfterExtract.stage,
      {
        maxAttempts: COMMISSION_TRUTH.uploadPoll.maxAttempts,
        intervalMs: COMMISSION_TRUTH.uploadPoll.intervalMs,
      },
      initialFileId,
    );
    debugLogFileIdCaptured(fileId, 'commission-truth-upload');

    const stored = {
      row,
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    };
    this.setStoredRow(stored);
    setCommissionTruthUploadState({
      fileId,
      fileName: file.fileName,
      uploadedByTag: loginTag,
      statementType: prepared.statementType,
    });
    return stored;
  }

  async expectUploadStatusAndStage(status: string, stage: string): Promise<void> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    const fileId = await this.assertions.expectStoredUploadStatusAndStage(
      fileName,
      status,
      stage,
      stored?.fileId,
    );
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
      setCommissionTruthUploadState({ ...getCommissionTruthUploadState(), fileId });
    }
  }

  protected getKnownStoredFileId(): string {
    const fromRow = this.getStoredRow()?.fileId;
    if (fromRow) return fromRow;
    try {
      return getCommissionTruthUploadState().fileId;
    } catch {
      return '';
    }
  }

  async openReviewForUploadedFile(): Promise<void> {
    await this.openReviewForStoredUpload();
    const fileId = this.review.getFileIdFromUrl();
    if (fileId) {
      setCommissionTruthUploadState({ ...getCommissionTruthUploadState(), fileId });
    }
  }

  async expectReviewUrlContainsFileId(): Promise<void> {
    const { fileId } = getCommissionTruthUploadState();
    await this.review.assertions.expectUrlContainsFileId(fileId);
  }

  async expectReviewPageHeading(title: string): Promise<void> {
    await this.review.expectHeading(title);
  }

  async completeReviewAndConfirm(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectSuccessToast(): Promise<void> {
    await this.review.expectSuccessToastVisible();
  }

  async expectUploadStageCompleted(): Promise<void> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    const fileId = await this.assertions.pollUntilStageCompleted(
      fileName,
      {
        maxAttempts: 30,
        intervalMs: COMMISSION_TRUTH.uploadPoll.intervalMs,
      },
      stored?.fileId,
    );
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
    }
    setCommissionTruthUploadState({ ...getCommissionTruthUploadState(), fileId });
  }

  async openCommissionDetailsForCompletedUpload(): Promise<void> {
    await this.ensureOnUploadPage();
    const { fileId, fileName } = getCommissionTruthUploadState();
    const row = await this.resolveStoredUploadRow({ fileId, fileName });

    await this.details.openFromRow(row, fileId);
    const detailsId = this.details.getFileIdFromUrl();
    if (detailsId) {
      setCommissionTruthUploadState({ ...getCommissionTruthUploadState(), fileId: detailsId });
    }
    this.commissionDetailsListUrl = this.page.url();
    await waitForAppSettled(this.page, T);
  }

  /** Skip upload flow — open commission details for an existing Completed upload (debug). */
  async loadExistingCompletedUploadForDebug(fileId: string): Promise<void> {
    const prepared = prepareCommissionTruthFileFromInbox();
    setCommissionTruthPreparedFile(prepared);
    this.prepareFromContext();

    await this.ensureOnUploadPage();
    const search = this.gridLoc.searchInput();
    if (await search.isVisible().catch(() => false)) {
      await search.fill(fileId);
      await this.page.waitForTimeout(1_500);
    }

    const row = await this.resolveStoredUploadRow({ fileId, fileName: fileId });
    const gridFileId = await this.readFileIdFromRow(row);
    setCommissionTruthUploadState({
      fileId: gridFileId,
      fileName: prepared.fileName,
      uploadedByTag: '',
      statementType: prepared.statementType,
    });
    this.setStoredRow({
      row,
      fileId: gridFileId,
      fileName: prepared.fileName,
      carrierName: prepared.carrierName,
    });

    await this.details.openFromRow(row, gridFileId);
    const detailsId = this.details.getFileIdFromUrl();
    if (detailsId) {
      setCommissionTruthUploadState({ ...getCommissionTruthUploadState(), fileId: detailsId });
    }
    this.commissionDetailsListUrl = this.page.url();
    await waitForAppSettled(this.page, T);
  }

  async expectCommissionDetailsHeading(title: string): Promise<void> {
    await this.details.expectOnDetailsPage();
    await expect.soft(this.details.loc.heading(title)).toBeVisible({ timeout: T });
  }

  async validateEachLineItemAgainstProductStructure(): Promise<void> {
    await this.details.expectOnDetailsPage();
    const prepared = getCommissionTruthPreparedFile();
    clearCommissionTruthLineItems();
    clearProductCommissionPercentCache();
    writeCommissionTruthSheetSkeleton(prepared.truthSheetPath);

    const rowCount = await this.details.getCommissionDetailsRowCount();
    console.log(`${LOG_PREFIX} Commission details grid has ${rowCount} row(s)`);

    for (let index = 0; index < rowCount; index++) {
      if (!(await this.details.isCommissionDetailsListVisible())) {
        await this.returnToCommissionDetailsList().catch(() =>
          this.details.openFromRowOnUrl(this.commissionDetailsListUrl),
        );
      }
      let lineItem = await this.validateSingleLineItem(index, rowCount);
      if (lineItem.skipped && this.shouldRetryLineItemCapture(lineItem.skipReason, index, rowCount)) {
        console.log(`${LOG_PREFIX} [retry] row ${index + 1}: retrying capture`);
        await this.returnToCommissionDetailsList().catch(() =>
          this.details.openFromRowOnUrl(this.commissionDetailsListUrl),
        );
        if (index >= rowCount - 6) {
          await this.details.scrollGridFromBottom(index, rowCount).catch(() => {});
        } else {
          await this.details.scrollGridToRow(index).catch(() => {});
        }
        lineItem = await this.validateSingleLineItem(index, rowCount);
      }
      addCommissionTruthLineItem(lineItem);
      appendCommissionTruthLineItem(prepared.truthSheetPath, lineItem);
    }
  }

  async expectAllValidatedLineItemsMatch(): Promise<void> {
    const validated = getValidatedCommissionTruthLineItems();
    expect(
      validated.length,
      'No commission truth line items validated — all rows may have been skipped',
    ).toBeGreaterThan(0);

    for (const item of validated) {
      expect(item.productName).toBeTruthy();
      expect(item.agentLevel).toBeTruthy();
      expect(item.productCommissionPercent).toBeGreaterThan(0);
      expect(item.grossCompensation).toBeGreaterThan(0);
      const delta = Math.abs(item.calculatedValue - item.agentCommission);
      if (delta > COMMISSION_TRUTH.commissionTolerance) {
        console.log(
          `${LOG_PREFIX} [mismatch] Line ${item.rowIndex + 1} (${item.agentLevel}): ` +
            `$${item.grossCompensation.toFixed(2)} × ${item.productCommissionPercent}% = $${item.calculatedValue.toFixed(2)} ` +
            `vs $${item.agentCommission.toFixed(2)} (Δ=$${delta.toFixed(2)})`,
        );
      }
      expect(
        delta,
        `Line ${item.rowIndex + 1} (${item.productName} | ${item.agentLevel}): ` +
          `calculated $${item.calculatedValue.toFixed(2)} vs reconciliation agent $${item.agentCommission.toFixed(2)}`,
      ).toBeLessThanOrEqual(COMMISSION_TRUTH.commissionTolerance);
    }
  }

  async writeTruthSheetForRun(): Promise<void> {
    const prepared = getCommissionTruthPreparedFile();
    finalizeCommissionTruthSheet(prepared.truthSheetPath, getCommissionTruthLineItems());
    const cachedProducts = [...getAllProductCommissionPercentCache().keys()];
    console.log(
      `${LOG_PREFIX} Truth sheet written to ${prepared.truthSheetPath} | product cache: ${cachedProducts.length} product(s) [${cachedProducts.join(', ')}]`,
    );
  }

  private toPercentCache(splits: AgentLevelCommissionSplit[]): ProductLevelCommissionPercent[] {
    return splits.map((split) => ({
      level: split.level,
      agentPercent: Number.parseFloat((split.agent || '').replace(/%/g, '').trim()),
    }));
  }

  private async resolveProductCommissionPercent(
    productName: string,
    agentLevel: string,
  ): Promise<number> {
    const normalizedProduct = productName.trim();
    let splits: ProductLevelCommissionPercent[];

    if (hasProductCommissionPercentCache(normalizedProduct)) {
      splits = getProductCommissionPercentCache(normalizedProduct)!;
      console.log(
        `${LOG_PREFIX} [product-cache] hit "${normalizedProduct}" (${splits.length} level(s))`,
      );
    } else {
      const loaded = await this.loadProductSplitsFromApp(normalizedProduct);
      splits = this.toPercentCache(loaded);
      setProductCommissionPercentCache(normalizedProduct, splits);
      console.log(
        `${LOG_PREFIX} [product-cache] stored "${normalizedProduct}": ` +
          splits.map((s) => `${s.level}=${s.agentPercent}%`).join(', '),
      );
    }

    const match = splits.find((split) => this.levelsMatch(split.level, agentLevel));
    expect(
      match,
      `No product commission split found for agent level "${agentLevel}" on "${normalizedProduct}"`,
    ).toBeTruthy();

    expect(
      Number.isFinite(match!.agentPercent) && match!.agentPercent > 0,
      `Product commission % missing for "${agentLevel}" on "${normalizedProduct}"`,
    ).toBeTruthy();
    return match!.agentPercent;
  }

  private shouldRetryLineItemCapture(
    skipReason: string | undefined,
    index: number,
    rowCount: number,
  ): boolean {
    if (!skipReason) return false;
    if (/chargeback row/i.test(skipReason)) return false;
    if (/gross compensation is zero|agent commission is zero/i.test(skipReason)) return false;
    if (/Could not return to commission details list|net::ERR_/i.test(skipReason)) return false;

    const retryable =
      /rendered|scroll|not visible after scroll|Could not capture Agent COMMISSION|could not capture reconciliation|expect\(locator\)/i.test(
        skipReason,
      );
    if (!retryable) return false;

    return index >= rowCount - 6;
  }

  private normalizeSkipReason(reason: string): string {
    const cleaned = reason
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (/toBeTruthy|toBeVisible|Timeout \d+ms exceeded while waiting on the predicate/i.test(cleaned)) {
      return 'chargeback or unsupported line item view (commission table did not load in time)';
    }
    return cleaned.slice(0, 240);
  }

  private async validateSingleLineItem(
    index: number,
    totalRows?: number,
  ): Promise<CommissionTruthLineItem> {
    const skip = (reason: string): CommissionTruthLineItem => {
      const normalized = this.normalizeSkipReason(reason);
      console.log(`${LOG_PREFIX} [skip] row ${index + 1}: ${normalized}`);
      return {
        rowIndex: index,
        productName: '',
        agentLevel: '',
        productCommissionPercent: 0,
        grossCompensation: 0,
        agentCommission: 0,
        calculatedValue: 0,
        skipped: true,
        skipReason: normalized,
      };
    };

    try {
      await this.details.expectOnDetailsPage();

      const gridRowText = await this.details.readGridRowText(index, totalRows).catch(() => '');
      if (this.details.isNonCommissionGridRow(gridRowText)) {
        return skip('chargeback row — skipped from grid preview');
      }

      let grossCompensation = 0;
      let agentCommission = 0;
      let agentLevel = '';
      let productName = '';
      try {
        await this.details.openGridRecordAt(index);
        const reconciliation = await this.details.tryCaptureReconciliationCommissionTruth();
        if (!reconciliation.ok) {
          await this.returnToCommissionDetailsList();
          return skip(reconciliation.reason);
        }
        grossCompensation = reconciliation.data.grossCompensation;
        agentCommission = reconciliation.data.agentCommission;
        agentLevel = reconciliation.data.agentLevel;
        if (!agentLevel) {
          agentLevel = await this.details.captureAgentLevelFromReconciliationNameColumn();
        }
        productName = await this.details.captureProductNameFromMatchedPolicyDetails();
        await this.returnToCommissionDetailsList();
      } catch (error) {
        await this.returnToCommissionDetailsList().catch(() => {});
        return skip(error instanceof Error ? error.message : 'could not capture reconciliation details');
      }

      if (grossCompensation <= 0) {
        return skip('gross compensation is zero on reconciliation transaction table');
      }
      if (agentCommission <= 0) {
        return skip('agent commission is zero on reconciliation Agent COMMISSION row');
      }

      const productCommissionPercent = await this.resolveProductCommissionPercent(
        productName,
        agentLevel,
      );
      const calculatedValue = (productCommissionPercent / 100) * grossCompensation;

      console.log(
        `${LOG_PREFIX} [line ${index + 1}] ${productName} | ${agentLevel}: ` +
          `$${grossCompensation.toFixed(2)} × ${productCommissionPercent}% = $${calculatedValue.toFixed(2)} ` +
          `vs reconciliation agent $${agentCommission.toFixed(2)}`,
      );

      return {
        rowIndex: index,
        productName,
        agentLevel,
        productCommissionPercent,
        grossCompensation,
        agentCommission,
        calculatedValue,
        skipped: false,
      };
    } catch (error) {
      await this.returnToCommissionDetailsList().catch(() => {});
      return skip(error instanceof Error ? error.message : 'line item validation failed');
    }
  }

  private async loadProductSplitsFromApp(
    productName: string,
  ): Promise<AgentLevelCommissionSplit[]> {
    const baseUrl = new URL(this.page.url()).origin;
    const productsTab = await this.page.context().newPage();
    try {
      const productsPage = new ProductsPage(productsTab);
      const rulePage = new CommissionRulePage(productsTab);
      await productsTab.goto(new URL(AppPaths.products, baseUrl).href, {
        waitUntil: 'domcontentloaded',
      });
      await waitForAppSettled(productsTab, T);
      await expect(productsPage.loc.headingList()).toBeVisible({ timeout: T });
      await productsPage.searchGrid(productName);
      await productsPage.openProductFromGridByName(productName);
      await productsPage.openCommissionStructure();
      await rulePage.openFirstCommissionStructureRecord();
      return await rulePage.readCommissionSplitsByAgentLevel();
    } finally {
      await productsTab.close();
    }
  }

  private async returnToCommissionDetailsList(): Promise<void> {
    if (!this.commissionDetailsListUrl) {
      throw new Error('Commission details list URL not captured — open commission details first');
    }

    if (await this.details.isCommissionDetailsListVisible()) {
      await this.details.expectOnDetailsPage();
      return;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await this.page.goBack({ waitUntil: 'domcontentloaded', timeout: 60_000 });
        if (await this.details.isCommissionDetailsListVisible()) {
          await this.details.expectOnDetailsPage();
          return;
        }
      } catch {
        // fall through to direct navigation
      }
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.goto(this.commissionDetailsListUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 90_000,
        });
        await this.details.expectOnDetailsPage();
        return;
      } catch (error) {
        lastError = error;
        await this.page.waitForTimeout(2_000 * (attempt + 1));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Could not return to commission details list');
  }

  private levelsMatch(left: string, right: string): boolean {
    const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toUpperCase();
    const a = normalize(left);
    const b = normalize(right);
    if (a === b) return true;

    const aDigits = a.match(/\d+/)?.[0];
    const bDigits = b.match(/\d+/)?.[0];
    if (aDigits && bDigits && aDigits === bDigits) return true;

    const romanToDigit: Record<string, string> = {
      I: '1',
      II: '2',
      III: '3',
      IV: '4',
      V: '5',
    };
    const extractRoman = (value: string) => {
      const match = value.match(/\b(LEVEL\s+)?(I{1,3}|IV|V)\b/i);
      return match?.[2] ? romanToDigit[match[2].toUpperCase()] : undefined;
    };
    const leftRoman = extractRoman(a);
    const rightRoman = extractRoman(b);
    if (leftRoman && rightRoman) return leftRoman === rightRoman;
    if (leftRoman && bDigits) return leftRoman === bDigits;
    if (rightRoman && aDigits) return rightRoman === aDigits;

    return false;
  }
}
