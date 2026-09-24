import { expect } from '@playwright/test';
import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
import type { PreparedStatementFile } from '../../utils/excelStatementPrep';
import { escapeRegex } from '../../utils/escapeRegex';
import { debugLogAssertion, debugLogFileIdCaptured } from '../../utils/debugSteps';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import type { StatementUploadPage, RecentlyUploadedRow } from './StatementUploadPage';

const T = smokeStepTimeoutMs;

export type UploadGridPollOptions = {
  maxAttempts?: number;
  intervalMs?: number;
};

export class StatementUploadAssertions {
  constructor(private readonly uploadPage: StatementUploadPage) {}

  private logAssertion(label: string, actual: unknown, expected: unknown, passed: boolean): void {
    debugLogAssertion(label, actual, expected, passed);
  }

  private async readStatusAndStage(
    fileName: string,
    fileId?: string,
  ): Promise<{
    row: Awaited<ReturnType<StatementUploadPage['resolveStoredUploadRow']>>;
    status: string;
    stage: string;
  }> {
    await this.uploadPage.ensureOnUploadPage();
    const row = await this.uploadPage.resolveStoredUploadRow({ fileId, fileName });
    const { status, stage } = await this.uploadPage.readUploadRowStatusAndStage(row);
    return { row, status, stage };
  }

  /**
   * Poll upload grid when status/stage is Extract + Processing.
   * Refreshes every `intervalMs` up to `maxAttempts`, then throws.
   */
  /**
   * Poll until upload grid shows the expected status + stage (e.g. Waiting / Review).
   */
  async pollUntilUploadReviewReady(
    fileName: string,
    status: string,
    stage: string,
    options: UploadGridPollOptions = {},
    fileId?: string,
  ): Promise<string> {
    const intervalMs = options.intervalMs ?? 2_000;
    const maxAttempts = options.maxAttempts ?? 30;
    const timeoutMs = Math.max(T * 3, maxAttempts * intervalMs);
    const statusPattern = new RegExp(escapeRegex(status), 'i');
    const stagePattern = new RegExp(escapeRegex(stage), 'i');

    let resolvedFileId = '';

    await expect
      .poll(
        async () => {
          try {
            await this.uploadPage.refreshRecentlyUploadedGrid();
            const { row, status: statusText, stage: stageText } = await this.readStatusAndStage(
              fileName,
              fileId,
            );

            if (statusPattern.test(statusText) && stagePattern.test(stageText)) {
              resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
              this.logAssertion('uploadStatus', statusText, statusPattern, true);
              this.logAssertion('uploadStage', stageText, stagePattern, true);
              return 'ready';
            }

            return `waiting:${statusText || '(empty)'}:${stageText || '(empty)'}`;
          } catch (error) {
            return `waiting:lookup:${error instanceof Error ? error.message : 'row lookup failed'}`;
          }
        },
        { timeout: timeoutMs, intervals: [intervalMs, intervalMs, intervalMs * 2] },
      )
      .toBe('ready');

    if (!resolvedFileId) {
      const { row } = await this.readStatusAndStage(fileName, fileId);
      resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
    }
    return resolvedFileId;
  }

  async pollPastExtractProcessing(
    fileName: string,
    options: UploadGridPollOptions = {},
    fileId?: string,
  ): Promise<string> {
    const intervalMs = options.intervalMs ?? 2_000;
    const maxAttempts = options.maxAttempts ?? 3;
    const timeoutMs = Math.max(T * 3, maxAttempts * intervalMs);

    let resolvedFileId = '';

    await expect
      .poll(
        async () => {
          await this.uploadPage.refreshRecentlyUploadedGrid();
          const { row, status, stage } = await this.readStatusAndStage(fileName, fileId);

          const isExtractProcessing = /extract/i.test(status) && /processing/i.test(stage);
          const isStillUploaded =
            /uploaded/i.test(stage) &&
            !/waiting|review|completed|attention|extract|processing/i.test(status);

          if (!isExtractProcessing && !isStillUploaded) {
            resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
            return 'ready';
          }

          return `processing:${status || '(empty)'}:${stage}`;
        },
        { timeout: timeoutMs, intervals: [intervalMs, intervalMs, intervalMs * 2] },
      )
      .toBe('ready');

    if (!resolvedFileId) {
      const { row } = await this.readStatusAndStage(fileName, fileId);
      resolvedFileId = await this.uploadPage.readFileIdFromRow(row);
    }
    return resolvedFileId;
  }

  /**
   * Wait until upload stage is Completed, refreshing while stage still contains "processing".
   */
  async pollUntilStageCompleted(
    fileName: string,
    options: UploadGridPollOptions = {},
    fileId?: string,
  ): Promise<string> {
    const maxAttempts = options.maxAttempts ?? 15;
    const intervalMs = options.intervalMs ?? 2_000;
    const completedPattern = /completed/i;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.uploadPage.ensureOnUploadPage();
      try {
        const { row, stage } = await this.readStatusAndStage(fileName, fileId);
        if (completedPattern.test(stage)) {
          return this.uploadPage.readFileIdFromRow(row);
        }
        if (!/processing/i.test(stage) && attempt === maxAttempts) {
          throw new Error(
            `Upload "${fileName}" stage "${stage}" did not reach Completed after ${maxAttempts} attempts`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Stale AG Grid row after Complete Review refresh — re-resolve next attempt.
        if (!/not attached|not stable|detached/i.test(message) || attempt === maxAttempts) {
          throw error;
        }
      }
      await this.uploadPage.waitMs(intervalMs);
      await this.uploadPage.refreshRecentlyUploadedGrid();
    }

    const { row, stage } = await this.readStatusAndStage(fileName, fileId);
    if (!completedPattern.test(stage)) {
      throw new Error(`Upload "${fileName}" stage "${stage}" is not Completed`);
    }
    return this.uploadPage.readFileIdFromRow(row);
  }

  async expectRecentlyUploadedInProgress(
    file: PreparedStatementFile,
    uploadedByTag: string,
  ): Promise<RecentlyUploadedRow> {
    const row = await this.uploadPage.findStoredRowByFileName(file.fileName, T * 2);
    const uploadedCell = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.uploaded);
    const rowText = await row.innerText();
    const uploadedByMatch =
      uploadedCell.toLowerCase().includes(uploadedByTag.toLowerCase()) ||
      rowText.toLowerCase().includes(uploadedByTag.toLowerCase());
    this.logAssertion(
      'uploadedByTag',
      uploadedCell || rowText,
      uploadedByTag,
      uploadedByMatch,
    );
    expect(
      uploadedByMatch,
      `Uploaded column should contain login tag "${uploadedByTag}"`,
    ).toBeTruthy();

    const statusPattern = STATEMENT_UPLOAD.statusAfterUpload;
    const status = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.status);
    this.logAssertion('status', status, statusPattern, statusPattern.test(status));
    await expect
      .poll(async () => this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.status), {
        timeout: T * 2,
        intervals: [1_000, 2_000],
      })
      .toMatch(statusPattern);

    const stage = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);
    const stagePattern = STATEMENT_UPLOAD.stageAfterUpload;
    this.logAssertion('stage', stage, stagePattern, stagePattern.test(stage));
    expect.soft(stage).toMatch(stagePattern);

    const fileNameCol = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.fileName);
    const fileNameMatch =
      fileNameCol.includes(file.fileName) || rowText.includes(file.fileName);
    this.logAssertion('fileName', fileNameCol || rowText, file.fileName, fileNameMatch);
    expect(fileNameMatch).toBeTruthy();

    const fileId = await this.uploadPage.readFileIdFromRow(row);
    debugLogFileIdCaptured(fileId, 'recently-uploaded-in-progress');
    return { row, fileId, fileName: file.fileName, carrierName: file.carrierName };
  }

  async expectCaptureByUploader(
    file: PreparedStatementFile,
    uploadedByTag: string,
  ): Promise<RecentlyUploadedRow> {
    const row = await this.uploadPage.findStoredRowByFileName(file.fileName, T * 2);
    const uploadedCell = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.uploaded);
    const rowText = await row.innerText();
    const uploadedByMatch =
      uploadedCell.toLowerCase().includes(uploadedByTag.toLowerCase()) ||
      rowText.toLowerCase().includes(uploadedByTag.toLowerCase());
    this.logAssertion(
      'uploadedByTag',
      uploadedCell || rowText,
      uploadedByTag,
      uploadedByMatch,
    );
    expect(
      uploadedByMatch,
      `Uploaded column should contain login tag "${uploadedByTag}"`,
    ).toBeTruthy();

    const fileNameCol = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.fileName);
    const fileNameMatch =
      fileNameCol.includes(file.fileName) || rowText.includes(file.fileName);
    this.logAssertion('fileName', fileNameCol || rowText, file.fileName, fileNameMatch);
    expect(
      fileNameMatch,
      `File Name column should contain "${file.fileName}"`,
    ).toBeTruthy();

    const fileId = await this.uploadPage.readFileIdFromRow(row);
    debugLogFileIdCaptured(fileId, 'capture-by-uploader');
    return { row, fileId, fileName: file.fileName, carrierName: file.carrierName };
  }

  async expectStoredRowReviewState(fileName: string, fileId?: string): Promise<void> {
    const row = await this.uploadPage.resolveStoredUploadRow({ fileId, fileName });
    const statusPattern = new RegExp(STATEMENT_UPLOAD.statusAfterRefresh, 'i');
    await expect
      .poll(async () => this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.status), {
        timeout: T * 3,
        intervals: [1_500, 2_500, 4_000],
      })
      .toMatch(statusPattern);

    const status = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.status);
    this.logAssertion('statusAfterRefresh', status, statusPattern, statusPattern.test(status));

    const stage = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);
    const stagePattern = new RegExp(STATEMENT_UPLOAD.stageAfterRefresh, 'i');
    this.logAssertion('stageAfterRefresh', stage, stagePattern, stagePattern.test(stage));
    expect(stage).toMatch(stagePattern);
  }

  async expectStoredUploadStage(
    fileName: string,
    stage: string,
    fileId?: string,
  ): Promise<string> {
    await this.uploadPage.ensureOnUploadPage();
    let row = await this.uploadPage.resolveStoredUploadRow({ fileId, fileName });

    const stagePattern = new RegExp(escapeRegex(stage), 'i');
    await expect
      .poll(
        async () => {
          await this.uploadPage.refreshRecentlyUploadedGrid();
          row = await this.uploadPage.resolveStoredUploadRow({
            fileId,
            fileName,
            timeout: 30_000,
          });
          return this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);
        },
        { timeout: T * 3, intervals: [1_500, 2_500, 4_000] },
      )
      .toMatch(stagePattern);

    const stageText = await this.uploadPage.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);
    this.logAssertion('uploadStage', stageText, stagePattern, stagePattern.test(stageText));

    return this.uploadPage.readFileIdFromRow(row);
  }

  async expectStoredUploadStatusAndStage(
    fileName: string,
    status: string,
    stage: string,
    fileId?: string,
  ): Promise<string> {
    const statusPattern = new RegExp(escapeRegex(status), 'i');
    const stagePattern = new RegExp(escapeRegex(stage), 'i');
    const transitionalPattern = /extract|processing|^uploaded$/i;

    await this.uploadPage.ensureOnUploadPage();

    let resolvedRow: Awaited<ReturnType<StatementUploadPage['resolveStoredUploadRow']>> | undefined;

    await expect
      .poll(
        async () => {
          await this.uploadPage.refreshRecentlyUploadedGrid();
          const { row, status: statusText, stage: stageText } = await this.readStatusAndStage(
            fileName,
            fileId,
          );
          resolvedRow = row;

          const statusMatch = statusPattern.test(statusText);
          const stageMatch = stagePattern.test(stageText);
          if (statusMatch && stageMatch) {
            this.logAssertion('uploadStatus', statusText, statusPattern, true);
            this.logAssertion('uploadStage', stageText, stagePattern, true);
            return 'ready';
          }

          const stillTransitional =
            !statusText.trim() ||
            transitionalPattern.test(statusText) ||
            transitionalPattern.test(stageText);
          if (!stillTransitional) {
            this.logAssertion('uploadStatus', statusText, statusPattern, statusMatch);
            this.logAssertion('uploadStage', stageText, stagePattern, stageMatch);
          }
          return `waiting:${statusText}:${stageText}`;
        },
        { timeout: T * 3, intervals: [1_500, 2_500, 4_000] },
      )
      .toBe('ready');

    if (!resolvedRow) {
      resolvedRow = await this.uploadPage.resolveStoredUploadRow({ fileId, fileName });
    }
    return this.uploadPage.readFileIdFromRow(resolvedRow);
  }
}
