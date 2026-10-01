import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { StatementUploadPage } from './StatementUploadPage';
import { CommissionDetailsPage } from './CommissionDetailsPage';
import { NeedsAttentionPage } from './NeedsAttentionPage';
import { StatementHistoryPage } from './StatementHistoryPage';
import { TRANSFER_SHEET } from '../../test-data/transfer-agent/transferSheet';
import type { PreparedTransferFile } from '../../utils/transfer-agent/excelTransferPrep';
import {
  prepareTransferAgentRenewalUploadFile,
  prepareTransferAgentUploadFile,
} from '../../utils/transfer-agent/excelTransferPrep';
import {
  getTransferContext,
  setTransferContext,
  type TransferSheetContext,
} from '../../utils/transfer-agent/transferSheetContext';
import { escapeRegex } from '../../utils/escapeRegex';
import { debugLogFileIdCaptured } from '../../utils/debugSteps';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class TransferStatementPage extends StatementUploadPage {
  agentCommissionAmount = '';
  readonly details: CommissionDetailsPage;
  readonly needsAttention: NeedsAttentionPage;
  readonly uploadedStatements: StatementUploadPage;

  constructor(page: Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
    this.needsAttention = new NeedsAttentionPage(page);
    this.uploadedStatements = new StatementUploadPage(page);
  }

  async prepareTransferUploadFile(): Promise<PreparedTransferFile> {
    const prepared = await prepareTransferAgentUploadFile();
    this.setPreparedFile(prepared);
    return prepared;
  }

  getPreparedTransferFile(): PreparedTransferFile {
    return this.getPreparedFile() as PreparedTransferFile;
  }

  async uploadPreparedTransferFile() {
    await this.uploadPreparedFile();
  }

  async expectSuccessNotificationContaining(text: string) {
    await this.details.assertions.expectSuccessNotificationContaining(text);
  }

  async expectWarningTooltipContains(text: string) {
    const tooltipText = await this.review.hoverWarningIcon();
    await this.review.assertions.expectTooltipContains(tooltipText, text);
  }

  async expectWarningTooltipOnReviewContains(text: string) {
    await this.expectWarningTooltipContains(text);
  }

  async confirmStatementSubmission() {
    await this.review.confirmSubmissionIfVisible();
  }

  async navigateToNeedsAttention() {
    await this.needsAttention.open();
  }

  async navigateToUploadedStatements() {
    await this.uploadedStatements.openUploadPage();
  }

  protected getKnownStoredFileId(): string {
    const fromRow = this.getStoredRow()?.fileId;
    if (fromRow) return fromRow;
    try {
      return getTransferContext().fileId;
    } catch {
      return '';
    }
  }

  private async findStoredUploadRow(): Promise<Locator> {
    const file = this.getPreparedFile();
    return this.resolveStoredUploadRow({
      fileId: this.getKnownStoredFileId(),
      fileName: file.fileName,
    });
  }

  async expectStoredUploadRowStatusAndStage(status: string, stage: string) {
    const fileName = this.getPreparedFile().fileName;
    const statusPattern = new RegExp(escapeRegex(status), 'i');
    const stagePattern = new RegExp(escapeRegex(stage), 'i');
    let statusText = '';
    let stageText = '';

    // Stage renders in the grid; Status has no grid column on this page, so it is
    // read from the carrierfiles payload. AG Grid remounts rows on each refresh —
    // re-resolve the row inside every poll attempt.
    await expect
      .poll(
        async () => {
          try {
            statusText = await this.readCarrierFileStatusFromList(fileName);
            const row = await this.findStoredUploadRow();
            stageText = (await this.readCellText(row, TRANSFER_SHEET.gridColumns.stage)).trim();
          } catch {
            return `pending:${statusText || '(empty)'}:${stageText || '(empty)'}`;
          }
          const matched = statusPattern.test(statusText) && stagePattern.test(stageText);
          return matched ? 'matched' : `pending:${statusText || '(empty)'}:${stageText || '(empty)'}`;
        },
        { timeout: T * 2, intervals: [1_500, 2_500] },
      )
      .toBe('matched');

    expect(statusText, `carrierfiles status for ${fileName}`).toMatch(statusPattern);
    expect(stageText, `upload grid Stage for ${fileName}`).toMatch(stagePattern);
  }

  async openStoredUploadFromNeedsAttention() {
    const row = await this.findStoredUploadRow();
    await this.details.openFromRow(row, this.getKnownStoredFileId());
  }

  async openStoredUploadFromUploadPage() {
    await this.navigateToUploadedStatements();
    const row = await this.findStoredUploadRow();
    await this.details.openFromRow(row, this.getKnownStoredFileId());
  }

  async expectCommissionDetailsPage(expected: { heading?: string; splitCardContains?: string[] }) {
    if (expected.heading) {
      await expect(this.details.loc.heading(expected.heading)).toBeVisible({ timeout: T });
    }
    if (expected.splitCardContains?.length) {
      await this.details.assertions.expectSplitCardContains(...expected.splitCardContains);
    }
  }

  async storeAgentCommissionAmount(alias: string) {
    this.agentCommissionAmount = await this.details.parseAgentCommissionAmount();
    const prepared = this.getPreparedTransferFile();
    const base = (() => {
      try {
        return getTransferContext();
      } catch {
        return {
          fileId: '',
          fileName: prepared.fileName,
          carrierName: prepared.carrierName,
          policyNumber: prepared.policyNumber,
          customerUid: prepared.customerUid,
        };
      }
    })();
    const commissionKey =
      alias === TRANSFER_SHEET.contextKeys.commissionAmt ? 'commissionAmt' : 'agentCommissionAmount';
    setTransferContext({
      ...base,
      agentCommissionAmount: this.agentCommissionAmount,
      [commissionKey]: this.agentCommissionAmount,
      policyNumber: base.policyNumber ?? prepared.policyNumber,
      customerUid: base.customerUid ?? prepared.customerUid,
    });
  }

  async expectPageSubtitleContainsFileCarrierDate(carrier: string) {
    const file = this.getPreparedFile();
    await this.details.assertions.expectPageSubtitleContainsFileCarrierDate(
      file.fileName,
      carrier,
      file.carrierName,
    );
  }

  async expectReconcileWarningTooltipContains(text: string) {
    await this.details.assertions.expectReconcileWarningTooltipContains(text);
  }

  async expectNBInRecords() {
    await this.details.assertions.expectNBInRecords();
  }

  async expectStatusUnmatched() {
    await this.details.assertions.expectStatusUnmatched();
  }

  async expectAllRecordsReconciled(earningType?: string) {
    await this.details.assertions.expectAllRecordsReconciled(earningType);
  }

  async clickRecordWithPolicyTransfer() {
    await this.details.clickRecordWithPolicyTransfer();
  }

  async selectTransferringAgent(name: string) {
    await this.details.selectTransferringAgent(name);
  }

  async expectTransferringAgentListed(name: string) {
    await this.details.expectTransferringAgentListed(name);
  }

  async prepareTransferRenewalUploadFile() {
    const prepared = await prepareTransferAgentRenewalUploadFile();
    this.setPreparedFile(prepared);
    return prepared;
  }

  async expectStoredUploadReadyForPaymentWithoutPolicyTransfer() {
    const fileName = this.getPreparedFile().fileName;
    let stageText = '';
    // AG Grid remounts on refresh — re-resolve row each poll (same as status assert).
    await expect
      .poll(
        async () => {
          try {
            await this.refreshRecentlyUploadedGrid();
            const row = await this.findStoredUploadRow();
            stageText = (await this.readCellText(row, TRANSFER_SHEET.gridColumns.stage)).trim();
          } catch {
            return `pending:${stageText || '(empty)'}`;
          }
          if (/ready for payment|completed|paid/i.test(stageText)) return 'matched';
          return `pending:${stageText || '(empty)'}`;
        },
        { timeout: T * 2, intervals: [1_500, 2_500] },
      )
      .toBe('matched');
    expect(stageText, `upload grid Stage for ${fileName}`).toMatch(
      /ready for payment|completed|paid/i,
    );
    expect(stageText.toLowerCase()).not.toMatch(/needs? attention/i);
    const row = await this.findStoredUploadRow();
    const rowText = (await row.innerText()).toLowerCase();
    expect(rowText).not.toMatch(/policy transfer required/);
  }

  async enterRationale(text: string) {
    await this.details.enterRationale(text);
  }

  async clickReconcile() {
    await this.details.clickReconcile();
  }

  async refreshGrid() {
    await this.refreshRecentlyUploadedGrid();
  }

  async clickNextRecordWithStatus(status: string) {
    await this.details.clickNextRecordWithStatus(status);
  }

  async reconcileNextRecord(status: string, agentName: string) {
    await this.details.reconcileNextRecord(status, agentName);
  }

  async captureUploadAndFileId() {
    const file = this.getPreparedTransferFile();
    await this.refreshRecentlyUploadedGrid();
    await expect(this.grid()).toBeVisible({ timeout: T });

    const row = await this.findStoredRowByFileName(file.fileName);
    const fileId = await this.readFileIdFromRow(row);
    debugLogFileIdCaptured(fileId, 'transfer-upload');
    const stored = {
      row,
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    };
    this.setStoredRow(stored);
    const ctx: TransferSheetContext = {
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
      preparedFilePath: file.absolutePath,
      policyNumber: file.policyNumber,
      customerUid: file.customerUid,
    };
    setTransferContext(ctx);
  }
}
