import { expect, type Locator, type Page } from '@playwright/test';
import { STATEMENT_UPLOAD } from '../../test-data/commission-statements/statementUpload';
import { debugLogFileIdClick } from '../../utils/debugSteps';
import { waitForAppSettled } from '../../utils/pageLoader';
import { escapeRegex } from '../../utils/escapeRegex';
import { smokeStaticWaitMs, smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const STATIC_WAIT = smokeStaticWaitMs;
const T = smokeStepTimeoutMs;

export class GridPage {
  readonly gridLoc = {
    dataGrid: (): Locator => this.page.getByRole('grid', { name: 'Data grid' }),
    rowEditMenuButton: (row: Locator): Locator => row.getByRole('button').first(),
    /** Common row-action triggers across ICM grids (kebab / hover actions). */
    rowActionTrigger: (): Locator =>
      this.page.locator(
        [
          '[data-testid^="user-actions-"]',
          '[data-testid^="product-actions-"]',
          '[data-testid^="carrier-actions-"]',
          '[data-testid^="policy-actions-"]',
          '[data-testid*="actions-"]',
          '[data-testid="actions-hover-wrapper"]',
        ].join(', '),
      ),
    editMenuItem: (): Locator => this.page.getByRole('button', { name: 'Edit', exact: true }),
    backButton: (): Locator =>
      this.page
        .getByTestId('back-button')
        .or(this.page.getByRole('button', { name: /^back$/i }))
        .or(this.page.getByRole('link', { name: /^back$/i })),
    acquireLock: (): Locator => this.page.getByTestId('review-lock-modal-acquire'),
    noRecords: (): Locator => this.page.getByText(/no records found/i),
    footerText: (): Locator => this.page.getByTestId('data-grid-record-count-footer'),
    searchInput: (): Locator => this.page.getByRole('textbox', { name: 'Search data grid' }),
  };

  constructor(protected readonly page: Page) { }

  grid() {
    return this.gridLoc.dataGrid();
  }

  async clickBack() {
    const back = this.gridLoc.backButton();
    if (await back.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await back.first().click();
    } else {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await waitForAppSettled(this.page);
  }

  /** Reset AG Grid horizontal scroll so left-side columns remount. */
  async scrollGridToStart(): Promise<void> {
    await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (viewport) {
        viewport.scrollLeft = 0;
        viewport.dispatchEvent(new Event('scroll'));
      }
    });
    await this.page.waitForTimeout(200);
  }

  /** Scroll AG Grid so a right-pinned / off-screen Actions column can render. */
  async scrollGridToActionsColumn(): Promise<void> {
    await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (viewport) {
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.dispatchEvent(new Event('scroll'));
      }
      const pinned = document.querySelector('.ag-pinned-right-cols-viewport') as HTMLElement | null;
      if (pinned) {
        pinned.scrollTop = 0;
      }
    });
    await this.page.waitForTimeout(200);
  }

  async openFirstDataRowActionMenu() {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page);
    await this.scrollGridToActionsColumn();

    const knownAction = this.gridLoc.rowActionTrigger().first();
    if (await knownAction.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await knownAction.click();
      return;
    }

    // Prefer a real data row that already exposes an action control.
    const rowWithButton = this.dataRows()
      .filter({ has: this.page.getByRole('button') })
      .first();
    if (await rowWithButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.gridLoc.rowEditMenuButton(rowWithButton).click();
      return;
    }

    throw new Error(
      'No grid row action control found (kebab / actions button). ' +
        'The list may not expose row actions, or the Actions column is hidden.',
    );
  }

  async chooseEditFromRowMenu() {
    await this.gridLoc.editMenuItem().click();
    await waitForAppSettled(this.page);
  }

  /** @returns false when the grid is empty (no data row to open). */
  async openFirstGridRow(): Promise<boolean> {
    return this.openGridRecordAt(0);
  }

  /**
   * Opens the data row at `index`.
   * @returns false when the grid has zero records (footer / empty overlay).
   * Waits for the footer or empty overlay so a slow load is not mistaken for rows.
   */
  async openGridRecordAt(index: number): Promise<boolean> {
    const grid = this.grid();
    await expect(grid).toBeVisible();
    await waitForAppSettled(this.page);

    const footer = this.gridLoc.footerText();
    const noRecords = this.gridLoc.noRecords();

    // Settle: footer count text, explicit empty overlay, or at least one data row.
    await expect
      .poll(
        async () => {
          if (await noRecords.isVisible().catch(() => false)) return 'empty';
          const text = ((await footer.textContent().catch(() => null)) ?? '').replace(/\s+/g, ' ');
          if (/all\s+0\s+records/i.test(text)) return 'empty';
          if (/showing all\s+[1-9]\d*\s+records/i.test(text)) return 'ready';
          if ((await this.dataRows().count()) > 0) return 'ready';
          return 'pending';
        },
        { timeout: 30_000, intervals: [500, 1_000, 2_000] },
      )
      .not.toBe('pending');

    if (await noRecords.isVisible().catch(() => false)) return false;
    const recordText = ((await footer.textContent().catch(() => null)) ?? '').replace(/\s+/g, ' ');
    if (/all\s+0\s+records/i.test(recordText)) return false;
    if ((await this.dataRows().count()) === 0) return false;

    const row = this.dataRows().nth(index);
    await expect(row).toBeVisible();
    await row.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await waitForAppSettled(this.page);
    return true;
  }

  async openEditFromGrid() {
    await this.openFirstDataRowActionMenu();
    await this.chooseEditFromRowMenu();
  }

  async searchGrid(query: string) {
    const search = this.gridLoc.searchInput();
    await search.fill('');
    await search.fill(query);
    await expect(this.grid()).toBeVisible();
    await waitForAppSettled(this.page);
  }

  protected async getColumnIndex(columnName: string): Promise<number> {
    return this.grid().evaluate((grid, name) => {
      const target = name.toLowerCase();
      const headerRow =
        grid.querySelector('[role="row"]:has([role="columnheader"])') ??
        Array.from(grid.querySelectorAll('[role="row"]')).find(row =>
          row.querySelector('[role="columnheader"], th'),
        );
      if (!headerRow) return -1;
      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
        if (label === target || label.includes(target)) return i;
      }
      return -1;
    }, columnName);
  }

  protected async cellText(row: Locator, columnName: string): Promise<string> {
    let text = '';
    const colIndex = await this.getColumnIndex(columnName);
    if (colIndex >= 0) {
      const cells = row.locator('[role="gridcell"], td');
      const count = await cells.count();
      if (colIndex < count) {
        text = (await cells.nth(colIndex).innerText()).replace(/\s+/g, ' ').trim();
      }
    }
    if (!text) {
      // AG Grid headers can be icon-only/hidden (e.g. File ID) — resolve the
      // cell via its stable col-id attribute, slug-compared case-insensitively
      // (camelCase "fileId" matches columnName "File ID").
      const slug = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');
      text = await row.evaluate((el, s) => {
        const cell = Array.from(el.querySelectorAll('[col-id]')).find(
          (c) =>
            (c.getAttribute('col-id') ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === s,
        );
        return cell ? (cell.textContent ?? '').replace(/\s+/g, ' ').trim() : '';
      }, slug);
    }
    return text;
  }

  protected dataRows(): Locator {
    return this.grid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
  }

  async readCellText(row: Locator, columnName: string): Promise<string> {
    return this.cellText(row, columnName);
  }

  /** AG Grid may virtualize Stage/Status off-screen — scroll right before reading. */
  async scrollUploadGridToStatusColumns(): Promise<void> {
    await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (viewport) {
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.dispatchEvent(new Event('scroll'));
      }
    });
    await this.page.waitForTimeout(300);
  }

  async readUploadRowStatusAndStage(row: Locator): Promise<{ status: string; stage: string }> {
    // AG Grid remounts rows on refresh — retry if the locator detaches mid-scroll/read.
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await row.scrollIntoViewIfNeeded({ timeout: 5_000 });
        await this.scrollUploadGridToStatusColumns();

        let status = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.status);
        let stage = await this.readCellText(row, STATEMENT_UPLOAD.gridColumns.stage);

        if (!status.trim() || !stage.trim()) {
          const rowText = (await row.innerText()).replace(/\s+/g, ' ').trim();
          if (!stage.trim()) {
            stage =
              rowText.match(
                /\b(Uploaded|Review|Completed|Processing|Needs Attention|Extract)\b/i,
              )?.[1] ?? '';
          }
          if (!status.trim()) {
            status = rowText.match(/\b(Waiting)\b/i)?.[1] ?? '';
          }
        }

        return { status: status.trim(), stage: stage.trim() };
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!/not attached|not stable|detached/i.test(message) || attempt === 3) {
          throw error;
        }
        await this.page.waitForTimeout(800);
      }
    }
    throw lastError;
  }

  getDataRows(): Locator {
    return this.dataRows();
  }

  /**
   * Finds the first data row whose text contains `text`.
   *
   * Polls until the row appears instead of doing a single scan: on a fresh
   * grid load the viewport can render stale rows first and only swap in the
   * matching row after the data fetch (~300ms+ — MCP-verified). A single scan
   * in that window misses the row and returns null → flaky "not found".
   * Also tolerates AG Grid row remounts mid-scan (detachment), re-querying on
   * the next poll interval. Null only when the row never appears (timeout).
   */
  protected async findRowByText(
    text: string,
    options?: { timeout?: number },
  ): Promise<Locator | null> {
    const timeout = options?.timeout ?? 60_000;
    const target = text.trim().toLowerCase();
    if (!target) return null;

    await expect(this.grid()).toBeVisible({ timeout });

    let foundIndex = -1;
    try {
      await expect
        .poll(
          async () => {
            const rows = this.dataRows();
            const count = await rows.count();
            for (let i = 0; i < count; i++) {
              const row = rows.nth(i);
              let rowText = '';
              try {
                rowText = (await row.innerText()).replace(/\s+/g, ' ').toLowerCase();
              } catch {
                // AG Grid remounted rows mid-scan — re-query on the next interval.
                return false;
              }
              if (rowText.includes(target)) {
                foundIndex = i;
                return true;
              }
            }
            return false;
          },
          { timeout, intervals: [500, 1_000, 2_000, 3_000] },
        )
        .toBe(true);
    } catch {
      return null;
    }
    return this.dataRows().nth(foundIndex);
  }

  async refreshGrid() {
    const refresh = this.page
      .getByTestId('data-grid-refresh-button')
      .or(this.page.getByRole('button', { name: /refresh grid data/i }));
    await refresh.click();
    await this.page.waitForTimeout(STATIC_WAIT);
    await waitForAppSettled(this.page);
  }

  protected async findRowByFileName(
    fileName: string,
    options?: { fileNameColumn?: string; timeout?: number },
  ): Promise<Locator> {
    const timeout = options?.timeout ?? 60_000;
    const fileNameColumn = options?.fileNameColumn;
    const baseName = fileName.replace(/\.(xlsx|csv)$/i, '');

    await expect(this.grid()).toBeVisible({ timeout });
    await this.refreshGrid().catch(() => undefined);

    const search = this.gridLoc.searchInput();
    const applySearch = async (value: string) => {
      if (!(await search.isVisible().catch(() => false))) return;
      await search.click({ timeout: 3_000 }).catch(() => undefined);
      await search.fill('');
      if (value) await search.fill(value);
      await this.page.waitForTimeout(1_200);
    };

    // Prefer full filename first — some grids tokenize poorly on long base names.
    await applySearch(fileName);
    let usedClearSearch = false;
    let foundIndex = -1;
    let attempts = 0;

    try {
      await expect
        .poll(
          async () => {
            attempts += 1;
            const rows = this.dataRows();
            const count = await rows.count();

            // Search returned empty — clear filter and scan unfiltered rows.
            if (count === 0 && !usedClearSearch && attempts >= 2) {
              await applySearch('');
              usedClearSearch = true;
              await this.refreshGrid().catch(() => undefined);
              return false;
            }

            if (attempts % 4 === 0) {
              await this.refreshGrid().catch(() => undefined);
            }

            for (let i = 0; i < count; i++) {
              const row = rows.nth(i);
              const nameCell = fileNameColumn
                ? await this.cellText(row, fileNameColumn)
                : '';
              const rowText = (await row.innerText()).replace(/\s+/g, ' ');
              if (
                nameCell.includes(fileName) ||
                nameCell.includes(baseName) ||
                rowText.includes(fileName) ||
                rowText.includes(baseName)
              ) {
                foundIndex = i;
                return true;
              }
            }
            return false;
          },
          { timeout, intervals: [1_000, 2_000, 3_000, 5_000] },
        )
        .toBe(true);
    } catch (error) {
      const sample = await this.dataRows()
        .allTextContents()
        .then((rows) =>
          rows
            .slice(0, 5)
            .map((t) => t.replace(/\s+/g, ' ').trim())
            .join(' || '),
        )
        .catch(() => '');
      throw new Error(
        `Row for file "${fileName}" not found in data grid within ${timeout}ms. ` +
          `Sample rows: ${sample || '(none visible)'}`,
      );
    }

    return this.dataRows().nth(foundIndex);
  }

  protected async findRowByFileId(
    fileId: string,
    options?: { fileIdColumn?: string; timeout?: number },
  ): Promise<Locator> {
    const timeout = options?.timeout ?? 60_000;
    const fileIdColumn = options?.fileIdColumn;
    const target = fileId.trim();
    if (!target) throw new Error('Missing file ID');

    await expect(this.grid()).toBeVisible({ timeout });

    const search = this.gridLoc.searchInput();
    if (await search.isVisible().catch(() => false)) {
      await search.clear();
    }

    let foundIndex = -1;
    await expect
      .poll(
        async () => {
          const rows = this.dataRows();
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const idCell = fileIdColumn ? await this.cellText(row, fileIdColumn) : '';
            const rowText = (await row.innerText()).replace(/\s+/g, ' ');
            if (idCell.includes(target) || rowText.includes(target)) {
              foundIndex = i;
              return true;
            }
          }
          return false;
        },
        { timeout, intervals: [1_000, 2_000, 3_000, 5_000] },
      )
      .toBe(true);

    if (await search.isVisible().catch(() => false)) {
      await search.fill(target);
      await this.page.waitForTimeout(1_000);
    }

    return this.dataRows().nth(foundIndex);
  }

  protected async scanForRowByFileId(fileId: string, fileIdColumn?: string): Promise<Locator | null> {
    const target = fileId.trim();
    const rows = this.dataRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idCell = fileIdColumn ? await this.cellText(row, fileIdColumn) : '';
      const rowText = (await row.innerText()).replace(/\s+/g, ' ');
      if (idCell.includes(target) || rowText.includes(target)) {
        const search = this.gridLoc.searchInput();
        if (await search.isVisible().catch(() => false)) {
          await search.fill(target);
          await this.page.waitForTimeout(1_000);
        }
        return rows.nth(i);
      }
    }
    return null;
  }

  protected async extractFileIdFromRow(row: Locator, fileIdColumn?: string): Promise<string> {
    const link = row.locator('a[href*="/commission-processing/review/"]').first();
    if (await link.count()) {
      const href = (await link.getAttribute('href')) ?? '';
      const match = href.match(/\/review\/([^/?#]+)/i);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }

    if (fileIdColumn) {
      const fromColumn = await this.cellText(row, fileIdColumn);
      if (fromColumn) return fromColumn.split(/\s+/)[0] ?? fromColumn;
    }

    const rowText = await row.innerText();
    const uuid =
      rowText.match(
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
      )?.[0] ?? '';
    if (uuid) return uuid;

    const btId = rowText.match(/\b(BT-[A-Z0-9]+)\b/i)?.[1];
    if (btId) return btId;

    const idCol = rowText.match(/\b(file\s*id[:\s]*)?([A-Z0-9_-]{6,})\b/i);
    const parsed = idCol?.[2] ?? '';
    if (!parsed) {
      throw new Error(`Could not parse file ID from grid row: ${rowText.slice(0, 200)}`);
    }
    return parsed;
  }

  async getRecordCountFromFooter(): Promise<number> {
    const footer = this.page.getByText(/showing all (\d+) records/i);
    await expect(footer).toBeVisible();
    return Number.parseInt((await footer.innerText()).match(/(\d+)/)?.[1] ?? '0', 10);
  }

  protected async openRowLink(
    row: Locator,
    hrefFragment = '/commission-processing/',
    fileId?: string,
  ): Promise<void> {
    debugLogFileIdClick(fileId ?? '');
    const link = row.locator(`a[href*="${hrefFragment}"]`).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
    } else {
      await row.click();
    }
    await waitForAppSettled(this.page);
  }

  protected matchColumnValue(
    row: Locator,
    columnName: string,
    expected: string,
  ): Promise<boolean> {
    return this.cellText(row, columnName).then((text) =>
      new RegExp(escapeRegex(expected), 'i').test(text),
    );
  }
}
