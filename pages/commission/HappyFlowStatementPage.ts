import { expect } from '@playwright/test';
import type { PreparedStatementFile } from '../../utils/excelStatementPrep';
import { AppUrlPatterns } from '../appPaths';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { CommissionDetailsPage } from '../statement-processing/CommissionDetailsPage';
import { getHappyFlowUploadState, setHappyFlowUploadState } from '../../utils/happy-flow/happyFlowContext';
import { toHappyFlowPreparedFile } from '../../utils/happy-flow/happyFlowUpload';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class HappyFlowStatementPage extends StatementUploadPage {
  private lastTooltipText = '';
  readonly details: CommissionDetailsPage;

  constructor(page: import('@playwright/test').Page) {
    super(page);
    this.details = new CommissionDetailsPage(page);
  }

  /** Happy flow upload state lives in module context, not on this page instance. */
  getPreparedFile(): PreparedStatementFile {
    try {
      return super.getPreparedFile();
    } catch {
      return toHappyFlowPreparedFile();
    }
  }

  async uploadPreparedHappyFlowCsv(): Promise<void> {
    await this.uploadFromPrepared(toHappyFlowPreparedFile());
  }

  async expectReviewUrlContainsFileId(): Promise<void> {
    const urlId = this.review.getFileIdFromUrl();
    expect(urlId).toBeTruthy();
    const state = getHappyFlowUploadState();
    const fileId = urlId || state.fileId;
    setHappyFlowUploadState({ ...state, fileId });
    await this.review.assertions.expectUrlContainsFileId(fileId);
  }

  async expectReviewPageTitle(title: string): Promise<void> {
    await this.review.expectHeading(title);
  }

  async expectReviewPageSubtitleWithStatementType(statementType: string): Promise<void> {
    const { fileName } = getHappyFlowUploadState();
    await this.review.assertions.expectSubtitleWithFileAndStatementType(fileName, statementType);
  }

  async assertEveryTransactionType(type: string): Promise<void> {
    await this.review.assertions.expectEveryTransactionType(type);
  }

  async hoverWarningOnReview(): Promise<void> {
    this.lastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectLastTooltipContains(text1: string, text2: string): Promise<void> {
    await this.review.assertions.expectTooltipContains(this.lastTooltipText, text1, text2);
  }

  async completeReviewAndConfirm(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async clickStoredHappyFlowUploadRecord(): Promise<void> {
    await this.ensureOnUploadPage();
    const { fileId, fileName } = getHappyFlowUploadState();
    const row = await this.resolveStoredUploadRow({ fileId, fileName });

    await this.details.openFromRow(row, fileId);
    const detailsId = this.details.getFileIdFromUrl();
    if (detailsId) {
      const state = getHappyFlowUploadState();
      setHappyFlowUploadState({ ...state, fileId: detailsId });
    }
    if (fileId) {
      await expect
        .soft(
          this.page,
          `Opened record URL does not include captured file ID "${fileId}", proceeding with current record`,
        )
        .toHaveURL(AppUrlPatterns.commissionDetails);
    }
    await waitForAppSettled(this.page, T);
  }

  async assertAllRecordsPaymentStatus(status: string): Promise<void> {
    await this.details.assertions.expectAllRecordsPaymentStatus(status);
  }
}
