import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { GridPage } from '../shared/GridPage';
import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
import type { PreparedStatementFile } from '../../utils/excelStatementPrep';
import { prepareStatementUploadFile } from '../../utils/excelStatementPrep';
import {
  setLastStatementUpload,
  type StatementUploadContext,
} from '../../utils/statementUploadContext';
import { StatementReviewPage } from './StatementReviewPage';
import { CommissionDetailsPage } from './CommissionDetailsPage';
import { StatementUploadAssertions } from './StatementUploadAssertions';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { escapeRegex } from '../../utils/escapeRegex';

const T = smokeStepTimeoutMs;

export type RecentlyUploadedRow = {
  row: Locator;
  fileId: string;
  fileName: string;
  carrierName: string;
};

export class StatementUploadPage extends GridPage {
  private preparedFile: PreparedStatementFile | null = null;
  private storedRow: RecentlyUploadedRow | null = null;
  private readonly sidebar: IcmSidebarPage;
  readonly review: StatementReviewPage;
  readonly details: CommissionDetailsPage;
  readonly assertions: StatementUploadAssertions;

  readonly loc = {
    headingUpload: () =>
      this.page.getByRole('heading', { name: 'Upload Commission Statement', exact: true }),
    fileUpload: () => this.page.getByTestId('commission-statement-file-upload'),
    fileInput: () =>
      this.loc
        .fileUpload()
        .locator('input[type="file"]')
        .or(this.page.locator('div.w-full').locator('..').locator('input[type="file"]').first()),
    removeFile: (index = 0) =>
      this.page.getByTestId(`commission-statement-file-upload-remove-file-${index}`),
    uploadProcessBtn: () =>
      this.page
        .getByTestId('upload-process-btn')
        .or(this.page.getByRole('button', { name: /^upload statement$/i })),
    statementTypeDropdown: () =>
      this.page.getByTestId('statement-type-dropdown').getByRole('button').first(),
    statementTypeOption: (label: string) =>
      this.page
        .getByTestId(/statement-type-dropdown-option.*/)
        .filter({ hasText: label })
        .or(this.page.getByRole('option', { name: label, exact: true })),
    carrierInput: () =>
      this.page.getByTestId('carrier-input').getByRole('textbox', { name: 'Auto-detect' }),
    productTypeInput: () =>
      this.page.getByTestId('product-type-input').getByRole('textbox', { name: 'Auto-detect' }),
    gridRefresh: () =>
      this.page
        .getByTestId('data-grid-refresh-button')
        .or(this.page.getByRole('button', { name: /refresh grid data/i })),
    recentStatementsHeading: () => this.page.getByRole('heading', { name: /recently uploaded statements/i }),
    recentStatementsGrid: () => this.page.getByRole('grid', { name: /data grid/i }).first(),
    uploadedColumnHeader: () =>
      this.loc.recentStatementsGrid().getByRole('columnheader', { name: /uploaded/i }),
    recentStatementsRefreshBtn: () => this.page.getByRole('button', { name: /no refresh|refresh/i }),
    recentStatementsExportBtn: () => this.page.getByRole('button', { name: /export grid data to excel/i }),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
    this.review = new StatementReviewPage(page);
    this.details = new CommissionDetailsPage(page);
    this.assertions = new StatementUploadAssertions(this);
  }

  async prepareRenewalUploadFile(): Promise<PreparedStatementFile> {
    this.preparedFile = await prepareStatementUploadFile();
    return this.preparedFile;
  }

  getPreparedFile(): PreparedStatementFile {
    if (!this.preparedFile) {
      throw new Error('Call prepareRenewalUploadFile() before upload steps');
    }
    return this.preparedFile;
  }

  /** V20260915.01: review grid shows new-policy marker as "NB" in the
   *  Transaction Type column (warning-icon "New Policy" tooltip was removed). */
  async assertEveryTransactionType(type: string): Promise<void> {
    await this.review.assertions.expectEveryTransactionType(type);
  }

  protected setPreparedFile(file: PreparedStatementFile): void {
    // Recovery/chargeback re-uploads call setPreparedFile without uploadFromPrepared.
    // Drop prior BT-* identity so resolveStoredUploadRow does not latch onto the advance row.
    if (this.preparedFile && this.preparedFile.fileName !== file.fileName) {
      this.storedRow = null;
    }
    this.preparedFile = file;
  }

  getStoredRow(): RecentlyUploadedRow | null {
    return this.storedRow;
  }

  setStoredRow(stored: RecentlyUploadedRow): void {
    this.storedRow = stored;
  }

  async openUploadPage() {
    await this.sidebar.waitForSidebar();
    if (!AppUrlPatterns.commissionUpload.test(this.page.url())) {
      await this.sidebar.clickStatementsSubNavByTestId('sidebar-nav-item-upload-statement', {
        lightweight: true,
      });
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /** Smoke-only: upload heading + statement type + process CTA; file input may be CSS-hidden. */
  async smokeExpectUploadHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await expect(this.loc.statementTypeDropdown()).toBeVisible({ timeout: T });
    await expect(this.loc.uploadProcessBtn()).toBeVisible({ timeout: T });

    const browse = this.page
      .getByTestId('browse-button')
      .or(this.page.getByRole('button', { name: /browse/i }));
    const recentStatements = this.page
      .getByTestId('recent-statements-table')
      .or(this.page.getByRole('heading', { name: /recently uploaded statements/i }));

    // Native `<input type="file">` is often `class="hidden"` — do not require it visible.
    // Prefer Browse CTA when shown; otherwise require Recently Uploaded Statements.
    if (await browse.first().isVisible().catch(() => false)) {
      await expect(browse.first()).toBeVisible({ timeout: T });
      await expect(this.loc.fileUpload()).toBeAttached({ timeout: T });
    } else {
      await expect(this.loc.fileUpload()).toBeAttached({ timeout: T });
      await expect(recentStatements.first()).toBeVisible({ timeout: T });
    }
    await expect(recentStatements.first()).toBeVisible({ timeout: T });
  }

  async ensureOnUploadPage(): Promise<void> {
    if (!AppUrlPatterns.commissionUpload.test(this.page.url())) {
      await this.openUploadPage();
    }
  }

  async expectUploadProcessButtonDisabled() {
    await expect(this.loc.uploadProcessBtn()).toBeDisabled({ timeout: T });
  }

  async expectUploadProcessButtonEnabled() {
    await expect(this.loc.uploadProcessBtn()).toBeEnabled({ timeout: T });
  }

  async uploadFromPrepared(file: PreparedStatementFile) {
    // Mid-scenario re-uploads must not keep the prior BT-* / fileName identity.
    this.storedRow = null;
    this.setPreparedFile(file);
    const remove = this.loc.removeFile(0);
    if (await remove.isVisible().catch(() => false)) {
      await this.removeUploadedFile(0);
    }
    await this.uploadPreparedFile();
  }

  async uploadPreparedFile() {
    const file = this.getPreparedFile();
    const input = this.loc.fileInput();
    await expect(input).toBeAttached({ timeout: T });
    await input.setInputFiles(file.absolutePath);
    await waitForAppSettled(this.page, T);
  }

  async removeUploadedFile(index = 0) {
    await this.loc.removeFile(index).click();
    await waitForAppSettled(this.page, T);
  }

  async selectStatementType(label: string) {
    const dropdown = this.loc.statementTypeDropdown();
    await expect(dropdown).toBeVisible({ timeout: T });
    const current = (await dropdown.innerText()).replace(/\s+/g, ' ').trim();
    if (new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i').test(current)) {
      return;
    }
    await dropdown.click();
    await this.page.waitForTimeout(300);

    // Exact testid / option first, then listbox text (portal menus often lack role=option).
    let option = this.loc.statementTypeOption(label).first();
    if (!(await option.isVisible({ timeout: 3_000 }).catch(() => false))) {
      option = this.page
        .locator('[data-testid*="statement-type"]')
        .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') })
        .or(this.page.getByRole('listbox').getByText(label, { exact: true }))
        .or(this.page.getByText(label, { exact: true }))
        .first();
    }

    if (!(await option.isVisible({ timeout: 5_000 }).catch(() => false))) {
      const available = await this.page
        .locator('[data-testid*="statement-type-dropdown-option"], [role="option"], [role="menuitem"]')
        .allTextContents()
        .catch(() => [] as string[]);
      throw new Error(
        `Statement type "${label}" not found in dropdown. Available: ${available
          .map((t) => t.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .slice(0, 20)
          .join(' | ') || '(none listed)'}`,
      );
    }

    await option.scrollIntoViewIfNeeded().catch(() => undefined);
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  async readUploaderDisplayName(): Promise<string> {
    const profile = this.page.getByTestId('profile-dropdown-button');
    await expect(profile).toBeVisible({ timeout: T });
    const nameLine = profile.locator('p').first();
    return (await nameLine.innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectAutoDetectFieldsDisabled() {
    await expect(this.loc.carrierInput()).toBeDisabled({ timeout: T });
    await expect(this.loc.productTypeInput()).toBeDisabled({ timeout: T });
  }

  async clickUploadStatement() {
    // Ensure type dropdown is closed so it does not intercept the Upload click.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.expectUploadProcessButtonEnabled();
    await this.loc.uploadProcessBtn().click();
    await this.review.expectSuccessToastVisible();
    await this.refreshRecentlyUploadedGrid();
  }

  async refreshRecentlyUploadedGrid() {
    await this.loc.gridRefresh().click();
    await waitForAppSettled(this.page, T);
  }

  async waitMs(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async waitThenRefreshGrid(intervalMs = 2_000): Promise<void> {
    await this.waitMs(intervalMs);
    await this.refreshRecentlyUploadedGrid();
  }

  async findStoredRowByFileName(fileName: string, timeout = T): Promise<Locator> {
    return this.findRowByFileName(fileName, {
      fileNameColumn: STATEMENT_UPLOAD.gridColumns.fileName,
      timeout,
    });
  }

  protected getKnownStoredFileId(): string {
    return this.getStoredRow()?.fileId ?? '';
  }

  /** Prefer stored file ID so parallel runs do not open the wrong grid row. */
  async resolveStoredUploadRow(options?: {
    fileId?: string;
    fileName?: string;
    timeout?: number;
  }): Promise<Locator> {
    const stored = this.getStoredRow();
    const fileName =
      options?.fileName ?? stored?.fileName ?? this.getPreparedFile().fileName;
    const explicitFileId = (options?.fileId ?? '').trim();
    // Never reuse stored BT-* when the caller asked for a different fileName
    // (e.g. recovery/chargeback poll after advance still sits in storedRow).
    const storedMatchesRequestedName =
      !!stored?.fileId &&
      (!options?.fileName || !stored.fileName || stored.fileName === options.fileName);
    const fileId =
      explicitFileId || (storedMatchesRequestedName ? stored!.fileId.trim() : '');
    const timeout = options?.timeout ?? T;

    // Upload grid displays BT-* ids; review/details URLs use UUIDs — skip slow id poll for UUID.
    const isGridFileId = /^BT-/i.test(fileId);
    if (fileId && isGridFileId) {
      const byId = await this.findRowByFileId(fileId, {
        fileIdColumn: STATEMENT_UPLOAD.gridColumns.fileId,
        timeout,
      }).catch(() => null);
      if (byId) return byId;
    }

    return this.findStoredRowByFileName(fileName, timeout);
  }

  async readFileIdFromRow(row: Locator): Promise<string> {
    return this.extractFileIdFromRow(row, STATEMENT_UPLOAD.gridColumns.fileId);
  }

  async captureUploadByUploader(uploadedByEmail: string): Promise<RecentlyUploadedRow> {
    const file = this.getPreparedFile();
    const displayName = await this.readUploaderDisplayName();
    const loginTag =
      displayName || uploadedByEmail.split('@')[0]?.trim() || uploadedByEmail;
    const stored = await this.assertions.expectCaptureByUploader(file, loginTag);
    this.setStoredRow(stored);
    return stored;
  }

  async expectRecentlyUploadedInProgress(uploadedByEmail: string) {
    const file = this.getPreparedFile();
    const displayName = await this.readUploaderDisplayName();
    const loginTag =
      displayName || uploadedByEmail.split('@')[0]?.trim() || uploadedByEmail;
    const stored = await this.assertions.expectRecentlyUploadedInProgress(file, loginTag);
    this.setStoredRow(stored);

    const ctx: StatementUploadContext = {
      fileId: stored.fileId,
      fileName: stored.fileName,
      carrierName: stored.carrierName,
      uploadedByTag: loginTag,
      preparedFilePath: file.absolutePath,
    };
    setLastStatementUpload(ctx);
  }

  async expectStoredRowReviewState() {
    const stored = this.storedRow;
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    await this.assertions.expectStoredRowReviewState(fileName, stored?.fileId);
  }

  async expectStoredUploadStage(stage: string): Promise<string> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    const knownFileId = stored?.fileId;
    const fileId = await this.assertions.expectStoredUploadStage(fileName, stage, knownFileId);
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
    } else {
      this.setStoredRow({
        row,
        fileId,
        fileName,
        carrierName: this.getPreparedFile().carrierName,
      });
    }
    return fileId;
  }

  async expectStoredUploadStatusAndStage(status: string, stage: string): Promise<string> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    const knownFileId = stored?.fileId;
    const fileId = await this.assertions.expectStoredUploadStatusAndStage(
      fileName,
      status,
      stage,
      knownFileId,
    );
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
    } else {
      this.setStoredRow({
        row,
        fileId,
        fileName,
        carrierName: this.getPreparedFile().carrierName,
      });
    }
    return fileId;
  }

  async openReviewForStoredUpload() {
    // Always return via Upload first — callers may be on policy edit / other modules
    // where getByRole('grid', { name: 'Data grid' }) is absent.
    await this.ensureOnUploadPage();
    const stored = this.getStoredRow();
    const file = this.getPreparedFile();
    const row = await this.resolveStoredUploadRow({
      fileId: this.getKnownStoredFileId(),
      fileName: stored?.fileName ?? file.fileName,
    });
    const fileId = await this.review.openFromRow(row, this.getKnownStoredFileId());
    const carrierName = stored?.carrierName ?? file.carrierName;
    // Keep BT-* on stored row for History/grid lookup. Review URL UUID is not searchable there.
    const gridFileId = this.getKnownStoredFileId();
    const keepFileId = /^BT-/i.test(gridFileId) ? gridFileId : fileId || gridFileId;
    if (keepFileId) {
      this.setStoredRow({
        row,
        fileId: keepFileId,
        fileName: stored?.fileName ?? file.fileName,
        carrierName,
      });
    }
  }

  async expectReviewPageForStoredUpload() {
    const file = this.getPreparedFile();
    await this.review.assertions.expectSubtitleWithFileAndCarrier(file.fileName, file.carrierName);
  }

  async submitStatementForReview() {
    await this.review.submitStatementForReview();
  }

  async completeReviewAndConfirm() {
    await this.review.completeReviewAndConfirm();
  }

  async expectSuccessNotifications() {
    await this.review.expectSuccessToastVisible();
  }

  /** Capture BT-* file id from extract poll onto stored row (parallel-run safe). */
  async captureStoredFileId(fileId: string): Promise<void> {
    const file = this.getPreparedFile();
    const stored = this.getStoredRow();
    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: stored?.fileName ?? file.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: stored?.fileName ?? file.fileName,
      carrierName: stored?.carrierName ?? file.carrierName,
    });
  }

  async openCommissionDetailsForStoredUpload(): Promise<void> {
    await this.ensureOnUploadPage();
    const stored = this.getStoredRow();
    const file = this.getPreparedFile();
    const row = await this.resolveStoredUploadRow({
      fileId: this.getKnownStoredFileId(),
      fileName: stored?.fileName ?? file.fileName,
    });
    await this.details.openFromRow(row, this.getKnownStoredFileId());
    const detailsId = this.details.getFileIdFromUrl();
    if (detailsId) {
      this.setStoredRow({
        row,
        fileId: detailsId,
        fileName: stored?.fileName ?? file.fileName,
        carrierName: stored?.carrierName ?? file.carrierName,
      });
    }
    await waitForAppSettled(this.page, T);
  }

  // ===== Recently Uploaded Grid Assertion Methods =====

  async expectUploadHeading(): Promise<void> {
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
  }

  async expectRecentStatementsHeading(): Promise<void> {
    await expect(this.loc.recentStatementsHeading()).toBeVisible({ timeout: T });
  }

  async expectRecentStatementsGrid(): Promise<void> {
    await expect(this.loc.recentStatementsGrid()).toBeVisible({ timeout: T });
  }

  async expectRecentStatementsGridHasUploadedColumn(): Promise<void> {
    await expect(this.loc.uploadedColumnHeader()).toBeVisible({ timeout: T });
  }

  private parseMmDdYyyy(text: string): Date | null {
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return null;
    return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
  }

  async getRecentStatementsUploadedDates(): Promise<string[]> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    await this.scrollGridToStart();
    const rows = await this.dataRows().all();
    const dates: string[] = [];
    for (const row of rows) {
      const text = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.uploaded);
      const match = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) dates.push(match[1]);
    }
    return dates;
  }

  async expectNoCompletedInRecentStatements(): Promise<void> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    await this.scrollUploadGridToStatusColumns();
    const rows = await this.dataRows().all();
    expect(rows.length, 'Expected visible Recently Uploaded rows').toBeGreaterThan(0);
    for (const row of rows) {
      const stage = (await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage)).trim();
      expect(stage, 'Completed stage must not appear on Upload').not.toMatch(/^completed$/i);
    }
  }

  async expectRecentStatementsStages(expectedStages: string[]): Promise<void> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    await this.scrollUploadGridToStatusColumns();
    const allowed = new Set(expectedStages.map((s) => s.trim().toLowerCase()).filter(Boolean));
    allowed.delete('stage');
    const rows = await this.dataRows().all();
    expect(rows.length, 'Expected visible Recently Uploaded rows').toBeGreaterThan(0);
    for (const row of rows) {
      const stage = (await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage)).trim();
      expect(
        allowed.has(stage.toLowerCase()),
        `Row stage "${stage}" not in expected: ${[...allowed].join(', ')}`,
      ).toBe(true);
    }
  }

  /** Most recent Thursday 00:00 through following Wednesday 23:59 (processing cycle). */
  getActiveThursdayWednesdayWindow(): { thursday: Date; wednesday: Date } {
    const now = new Date();
    const daysSinceThursday = (now.getDay() + 3) % 7;
    const thursday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceThursday);
    thursday.setHours(0, 0, 0, 0);
    const wednesday = new Date(thursday);
    wednesday.setDate(thursday.getDate() + 6);
    wednesday.setHours(23, 59, 59, 999);
    return { thursday, wednesday };
  }

  async expectActiveThursdayWednesdayWindow(): Promise<void> {
    const { thursday, wednesday } = this.getActiveThursdayWednesdayWindow();
    expect(thursday.getDay(), 'window start must be Thursday').toBe(4);
    expect(wednesday.getDay(), 'window end must be Wednesday').toBe(3);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    expect(today.getTime()).toBeGreaterThanOrEqual(thursday.getTime());
    expect(today.getTime()).toBeLessThanOrEqual(wednesday.getTime());
  }

  async expectRecentStatementsInActiveWindow(): Promise<void> {
    const { thursday, wednesday } = this.getActiveThursdayWednesdayWindow();
    const dates = await this.getRecentStatementsUploadedDates();
    expect(dates.length, 'Expected visible Uploaded dates').toBeGreaterThan(0);
    for (const dateStr of dates) {
      const rowDate = this.parseMmDdYyyy(dateStr);
      expect(rowDate, `Unparseable Uploaded date "${dateStr}"`).not.toBeNull();
      const t = rowDate!.getTime();
      expect(
        t >= thursday.getTime() && t <= wednesday.getTime(),
        `Uploaded date ${dateStr} outside ${thursday.toLocaleDateString()}–${wednesday.toLocaleDateString()}`,
      ).toBe(true);
    }
  }

  async uploadNewCommissionStatementAndCapture(): Promise<void> {
    await this.prepareRenewalUploadFile();
    await this.uploadPreparedFile();
    await this.selectStatementType(STATEMENT_UPLOAD.statementType);
    await this.clickUploadStatement();
    const file = this.getPreparedFile();
    const fileId = await this.assertions.pollPastExtractProcessing(file.fileName, {
      maxAttempts: 30,
      intervalMs: 2_000,
    });
    await this.captureStoredFileId(fileId);
    const stored = this.getStoredRow();
    if (stored) {
      setLastStatementUpload({
        fileId: stored.fileId,
        fileName: stored.fileName,
        carrierName: stored.carrierName,
        uploadedByTag: '',
        preparedFilePath: file.absolutePath,
      });
    }
  }

  async expectStoredFileLifecycleIdentity(): Promise<void> {
    const stored = this.getStoredRow();
    expect(stored, 'Stored upload row missing').not.toBeNull();

    // The Recent Upload grid may expose a real File ID column (BT-*) whose
    // header is icon-only/hidden, or no File ID column at all (statement-history
    // grid falls back to the unique file-name stem). The row's review link may
    // also yield a UUID. Accept any of the three — each round-trips to the row.
    const baseName = this.getPreparedFile().fileName.replace(/\.[^.]+$/, '');
    const fileId = stored!.fileId ?? '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId);
    expect(fileId, 'File ID / file-name identity missing').toMatch(/\S/);
    expect(
      /^BT-/i.test(fileId) || isUuid || fileId === baseName,
      `File ID "${fileId}" is neither a BT-* id, a UUID, nor the uploaded file name stem "${baseName}"`,
    ).toBe(true);

    const stageSet = STATEMENT_UPLOAD.lifecycleStages.map((s) => s.toLowerCase());
    const statusSet = STATEMENT_UPLOAD.lifecycleStatuses.map((s) => s.toLowerCase());
    let lastStage = '';
    let lastStatus = '';

    // Single-shot reads can hit a transitional/late-bound row right after the
    // extract poll returns. Refresh + retry until stage and status settle on
    // valid lifecycle values (same pattern as the other upload-grid polls).
    await expect
      .poll(
        async () => {
          try {
            await this.refreshRecentlyUploadedGrid();
            const row = await this.resolveStoredUploadRow({
              fileId: stored!.fileId,
              fileName: stored!.fileName,
            });
            const { status, stage } = await this.readUploadRowStatusAndStage(row);
            lastStage = stage;
            lastStatus = status;
            const stageOk = stageSet.includes(stage.toLowerCase());
            const statusOk = statusSet.includes(status.toLowerCase());
            return stageOk && statusOk
              ? 'ready'
              : `waiting:${stage || '(empty)'}:${status || '(empty)'}`;
          } catch (error) {
            return `waiting:lookup:${error instanceof Error ? error.message : 'row lookup failed'}`;
          }
        },
        { timeout: T * 3, intervals: [1_500, 2_500, 4_000] },
      )
      .toBe('ready');

    expect(lastStage, `Empty stage for ${stored!.fileId}`).toMatch(/\S/);
    expect(
      stageSet.includes(lastStage.toLowerCase()),
      `Stage "${lastStage}" is not a lifecycle stage`,
    ).toBe(true);
    expect(
      statusSet.includes(lastStatus.toLowerCase()),
      `Status "${lastStatus}" is not a lifecycle status`,
    ).toBe(true);
  }

  async expectRecentStatementsSortedByUploadedDesc(): Promise<void> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    await this.scrollGridToStart();
    const rows = await this.dataRows().all();
    let prev: Date | null = null;
    for (const row of rows) {
      const text = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.uploaded);
      const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
      if (!match) continue;
      const rowDate = new Date(
        Number(match[3]),
        Number(match[1]) - 1,
        Number(match[2]),
        Number(match[4] ?? 0),
        Number(match[5] ?? 0),
        Number(match[6] ?? 0),
      );
      if (prev && rowDate.getTime() > prev.getTime()) {
        throw new Error(`Recently Uploaded not sorted descending: ${text} after ${prev.toISOString()}`);
      }
      prev = rowDate;
    }
    expect(prev, 'Expected Uploaded date/times to compare').not.toBeNull();
  }

  private recentColumnHeader(columnName: string): Locator {
    return this.loc
      .recentStatementsGrid()
      .getByRole('columnheader', { name: new RegExp(`^${escapeRegex(columnName)}`, 'i') })
      .first();
  }

  /** Clicks the column header until `aria-sort` reaches the target state (max 3 clicks). */
  private async clickRecentHeaderUntilAriaSort(columnName: string, target: string): Promise<void> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    const header = this.recentColumnHeader(columnName);
    await expect(header).toBeVisible({ timeout: T });
    for (let attempts = 0; attempts < 3; attempts++) {
      const current = await header.getAttribute('aria-sort').catch(() => null);
      if (current === target) return;
      await header.click();
      await this.page.waitForTimeout(600);
    }
    await expect.poll(async () => header.getAttribute('aria-sort')).toBe(target);
  }

  /** One click from the default (no-sort) state applies ascending. */
  async sortRecentColumnAscending(columnName: string): Promise<void> {
    await this.clickRecentHeaderUntilAriaSort(columnName, 'ascending');
  }

  /** Two clicks toggle through ascending to descending. */
  async sortRecentColumnDescending(columnName: string): Promise<void> {
    await this.clickRecentHeaderUntilAriaSort(columnName, 'descending');
  }

  async expectRecentColumnAriaSort(columnName: string, expected: 'ascending' | 'descending'): Promise<void> {
    const header = this.recentColumnHeader(columnName);
    await expect.poll(async () => header.getAttribute('aria-sort')).toBe(expected);
  }

  /** Normalizes a cell value into a value that sorts in the same order as AG Grid. */
  private normalizeRecentSortValue(columnLabel: string, raw: string): string | number {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (/uploaded|updated at/i.test(columnLabel)) {
      const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        return new Date(
          Number(match[3]),
          Number(match[1]) - 1,
          Number(match[2]),
          Number(match[4]),
          Number(match[5]),
          Number(match[6]),
        ).getTime();
      }
      return '';
    }
    if (/file name/i.test(columnLabel)) {
      return text.replace(/\s*(Locked by|Created by).*$/i, '').replace(/\.(xlsx|csv)$/i, '');
    }
    return text.toLowerCase();
  }

  /** Reads up to `maxRows` non-empty cell values for a column in current render order. */
  async getRecentColumnValues(columnName: string, maxRows = 20): Promise<Array<string | number>> {
    await this.loc.recentStatementsGrid().waitFor({ state: 'visible', timeout: T });
    await this.scrollGridToStart();
    const rows = await this.dataRows().all();
    const values: Array<string | number> = [];
    for (const row of rows) {
      const raw = await this.readCellText(row, columnName);
      const normalized = this.normalizeRecentSortValue(columnName, raw);
      if (normalized !== '') values.push(normalized);
      if (values.length >= maxRows) break;
    }
    return values;
  }

  /** Verifies the rendered row order for a column matches the clicked sort direction. */
  async expectRecentColumnSorted(columnName: string, direction: 'asc' | 'desc'): Promise<void> {
    const values = await this.getRecentColumnValues(columnName);
    expect(values.length, `Not enough rows to verify "${columnName}" sort`).toBeGreaterThan(1);
    const expected = [...values].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
    });
    if (direction === 'desc') expected.reverse();
    expect(values, `"${columnName}" rows should be sorted ${direction}`).toEqual(expected);
  }
}
