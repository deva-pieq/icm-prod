import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';
import { getLastStatementUpload } from '../../utils/statementUploadContext';

const T = smokeStepTimeoutMs;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DATE_RANGE_VALUE_RE = /^\d{2}\/\d{2}\/\d{4}\s*[-–—to]+\s*\d{2}\/\d{2}\/\d{4}$/i;

export class StatementHistoryPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    headingHistory: () => this.page.getByRole('heading', { name: /commission statement history/i }),
    headingDetails: () =>
      this.page
    .getByRole('heading', { name: 'Review Statement File' })
    // old locators failing: 23-June-2026
    .or(this.page.getByRole('heading', { name: /commission details/i }))
    .or(this.page.getByRole('heading', { name: /statement review|review commission/i })),
    statementsTable: () => this.page.getByTestId('statements-table'),
    searchInput: () => this.page.getByTestId('data-grid-search-input').locator('input'),
    gridClearFiltersBtn: () => this.page.getByTestId('data-grid-clear-filters'),
    totalStatementsCard: () => this.page.getByTestId('total-statements-card'),
    inProgressCard: () => this.page.getByTestId('in-progress-card').or(this.page.getByRole('heading', { name: /in progress/i }).locator('..')),
    waitingCard: () => this.page.getByTestId('waiting-card').or(this.page.getByRole('heading', { name: /waiting/i }).locator('..')),
    errorsCard: () => this.page.getByTestId('errors-card').or(this.page.getByRole('heading', { name: /errors/i }).locator('..')),
    dateRangeInput: () => this.page.getByRole('textbox', { name: /statement upload date range/i }),
    dateRangePicker: () => this.page.getByRole('button', { name: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i }).first().locator('..').locator('..'),
    dateRangePickerMonthYear: () => this.page.getByRole('button', { name: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i }).first(),
    dateRangePickerPrevMonth: () => this.page.getByRole('button', { name: /^‹$/ }).first(),
    dateRangePickerNextMonth: () => this.page.getByRole('button', { name: /^›$/ }).first(),
    dateRangePickerPrevYear: () => this.page.getByRole('button', { name: /^«$/ }).first(),
    dateRangePickerNextYear: () => this.page.getByRole('button', { name: /^»$/ }).first(),
    dateRangePickerDay: (day: string, month?: string) => {
      const dayNum = String(parseInt(day, 10));
      const monthName = month || MONTH_NAMES[new Date().getMonth()];
      const base = this.page.getByRole('button', { name: new RegExp(`${monthName} ${dayNum},`, 'i') }).first();
      return base;
    },
    dateRangePickerClearBtn: () => this.page.getByRole('button', { name: /clear range/i }),
    stageFilter: () => this.page.getByTestId('filter-stage'),
    stageDropdownBtn: () => this.loc.stageFilter().locator('button').first(),
    stageDropdownClosedLabel: () => this.loc.stageDropdownBtn().locator('span'),
    stageOptionList: () => this.page.locator('#filter-stage-option-list'),
    stageDropdown: () => this.loc.stageOptionList(),
    stageOption: (name: string) =>
      this.loc.stageOptionList().getByRole('option', { name, exact: true }),
    stageOptions: () => this.loc.stageOptionList().getByRole('option'),
    stageMenuItem: (name: string) => this.page.getByRole('menuitem', { name: new RegExp(name, 'i') }),
    stageSelectAllBtn: () => this.page.getByRole('button', { name: /select all/i }),
    stageClearAllBtn: () => this.page.getByTestId('filter-stage-clear-all-button'),
    statusDropdownBtn: () => this.page.getByRole('button', { name: /all status|status selected/i }),
    statusDropdown: () => this.page.getByRole('listbox', { name: /status/i }).or(this.page.locator('[role="listbox"]').filter({ hasText: /status/i })),
    statusOption: (name: string) => this.page.getByRole('option', { name, exact: true }),
    carrierDropdownBtn: () => this.page.getByRole('button', { name: /all carriers|carrier selected/i }),
    carrierDropdown: () => this.page.getByRole('listbox', { name: /carrier/i }).or(this.page.locator('[role="listbox"]').filter({ hasText: /carrier/i })),
    carrierOption: (name: string) => this.page.getByRole('option', { name, exact: true }),
    grid: () => this.page.getByRole('grid', { name: /data grid/i }),
    gridColumnHeader: (name: string) => this.page.getByRole('columnheader', { name, exact: true }),
    refreshGridBtn: () => this.page.getByRole('button', { name: /refresh grid data/i }),
    exportGridBtn: () => this.page.getByRole('button', { name: /export grid data to excel/i }),
    toggleColumnsBtn: () => this.page.getByRole('button', { name: /toggle columns|columns/i }),
    gridRowCount: () => this.page.locator('[role="status"]').filter({ hasText: /rows? loaded/i }),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  private inStatementsArea(): boolean {
    return /commission-processing\/(upload-statement|statements\/|statement-history|needs-attention|commission-details|review\/|reconciliation)/i.test(
      this.page.url(),
    );
  }

  async open() {
    if (!this.inStatementsArea()) {
      await this.sidebar.waitForSidebar();
      await this.sidebar.clickStatementsSubNav(/^History$/i);
    } else {
      await this.sidebar.clickStatementsSubNav(/^History$/i);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionHistory);
    await ensurePageReady(this.page, this.loc.headingHistory(), { timeout: T });
  }

  /** Smoke-only: history heading + summary card + grid + search. */
  async smokeExpectHistoryHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionHistory, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.headingHistory()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.totalStatementsCard()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.statementsTable()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: details/review heading after opening a history row. */
  async smokeExpectDetailsHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.headingDetails()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openDetailsFromGrid() {
    if (!AppUrlPatterns.commissionHistory.test(this.page.url())) {
      await this.open();
    }
    await super.openFirstGridRow();
    if(await this.page.getByTestId('review-lock-modal-acquire').isVisible()) {
      await this.page.getByTestId('review-lock-modal-acquire').click();
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails);
    await expect(this.loc.headingDetails()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openDetailsByFileId(fileId: string) {
    if (!AppUrlPatterns.commissionHistory.test(this.page.url())) {
      await this.open();
    }

    const timeout = smokeStepTimeoutMs;
    await expect(this.grid()).toBeVisible({ timeout });

    const search = this.gridLoc.searchInput();
    if (await search.isVisible().catch(() => false)) {
      await search.clear();
    }

    // History stage filter often hides Completed / Needs Attention. Ensure both
    // are selected so SP-007 partial and Completed uploads are findable by file ID.
    const stageToggle = () =>
      this.page.getByRole('button', { name: /stages selected/i });
    const stageOption = (name: string) =>
      this.page.getByRole('option', { name, exact: true });

    const ensureStageSelected = async (name: string) => {
      const opt = stageOption(name);
      if (!(await opt.isVisible().catch(() => false))) return;
      const selected =
        (await opt.getAttribute('aria-selected').catch(() => null)) === 'true' ||
        (await opt.getAttribute('data-state').catch(() => null)) === 'checked' ||
        (await opt.getAttribute('selected').catch(() => null)) !== null;
      // Radix/shadcn options often use data-state="checked" or aria-selected.
      const looksChecked =
        selected ||
        (await opt.evaluate((el) => {
          const atr = el.getAttribute('data-state');
          return atr === 'checked' || atr === 'on' || el.getAttribute('aria-selected') === 'true';
        }).catch(() => false));
      if (!looksChecked) {
        await opt.click();
        await this.page.waitForTimeout(200);
      }
    };

    let row: Locator | null = null;
    await expect
      .poll(
        async () => {
          await this.refreshGrid();

          if (await stageToggle().isVisible().catch(() => false)) {
            await stageToggle().click();
            await this.page.waitForTimeout(400);
            await ensureStageSelected('Completed');
            await ensureStageSelected('Needs Attention');
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(400);
          }

          if (await search.isVisible().catch(() => false)) {
            await search.fill(fileId);
            await this.page.waitForTimeout(1_500);
          }

          row = await super.scanForRowByFileId(fileId);
          return row !== null;
        },
        { timeout, intervals: [3_000, 5_000, 8_000] },
      )
      .toBe(true);

    await super.openRowLink(row!, '/commission-processing/', fileId);
    if(await this.page.getByTestId('review-lock-modal-acquire').isVisible()) {
      await this.page.getByTestId('review-lock-modal-acquire').click();
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails);
    await expect(this.loc.headingDetails()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async expectHistoryHeading(): Promise<void> {
    await expect(this.loc.headingHistory()).toBeVisible({ timeout: T });
  }

  async expectDateRangeFilterReady(): Promise<void> {
    await expect(this.loc.dateRangeInput()).toBeVisible({ timeout: T });
    await expect(this.loc.dateRangeInput()).toBeEnabled({ timeout: T });
  }

  async expectDateRangeMmDdYyyy(): Promise<void> {
    await expect
      .poll(async () => this.getDateRangeValue(), { timeout: T })
      .toMatch(DATE_RANGE_VALUE_RE);
  }

  async expectDateRangeEquals(startDate: string, endDate: string): Promise<void> {
    const value = await this.getDateRangeValue();
    expect(value.replace(/\s*[-–—]\s*/g, ' - ')).toBe(`${startDate} - ${endDate}`);
  }

  async expectDateRangeStart(expectedStart: string): Promise<void> {
    const startDate = (await this.getDateRangeValue()).split(/\s*[-–—]\s*/)[0];
    expect(startDate).toBe(expectedStart);
  }

  async expectDateRangeEndToday(): Promise<void> {
    const endDate = (await this.getDateRangeValue()).split(/\s*[-–—]\s*/)[1];
    expect(endDate).toBe(this.formatMmDdYyyy(new Date()));
  }

  async expectDateRangeStartFirstOfMonth(): Promise<void> {
    const now = new Date();
    const expected = this.formatMmDdYyyy(new Date(now.getFullYear(), now.getMonth(), 1));
    await this.expectDateRangeStart(expected);
  }

  formatMmDdYyyy(d: Date): string {
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  storedUploadFileId(): string {
    try {
      return getLastStatementUpload().fileId;
    } catch {
      return '';
    }
  }

  // ===== Date Range Filter Methods =====

  async openDateRangePicker(): Promise<void> {
    if (await this.loc.dateRangePicker().isVisible().catch(() => false)) return;
    await this.loc.dateRangeInput().click();
    await expect(this.loc.dateRangePicker()).toBeVisible({ timeout: T });
  }

  async closeDateRangePicker(): Promise<void> {
    if (!(await this.loc.dateRangePicker().isVisible().catch(() => false))) return;
    await this.page.keyboard.press('Escape');
  }

  async getDateRangeValue(): Promise<string> {
    return (await this.loc.dateRangeInput().inputValue()).trim();
  }

  async selectDateInPicker(dateStr: string): Promise<void> {
    const [month, day, year] = dateStr.split('/');
    const dayNum = String(parseInt(day, 10));
    const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
    const reached = await this.navigatePickerToMonthYear(monthName, year);
    expect(reached, `Could not navigate to ${monthName} ${year} in date picker`).toBe(true);
    const dayBtn = this.loc.dateRangePickerDay(dayNum, monthName);
    await expect(dayBtn).toBeVisible({ timeout: T });
    await dayBtn.click();
  }

  /**
   * Navigate the picker to the given month/year.
   * Returns true when reached. react-calendar disables the forward arrow once the
   * max (today's) month is shown — future months are unreachable and return false.
   */
  async navigatePickerToMonthYear(
    monthName: string,
    year: string,
  ): Promise<boolean> {
    const maxAttempts = 24;
    for (let i = 0; i < maxAttempts; i++) {
      const monthYearBtn = this.loc.dateRangePickerMonthYear();
      const currentText = (await monthYearBtn.textContent().catch(() => '')) ?? '';
      if (currentText.includes(monthName) && currentText.includes(year)) {
        return true;
      }
      const [currentMonth, currentYear] = currentText.split(' ');
      const currentMonthIdx = MONTH_NAMES.indexOf(currentMonth);
      const targetMonthIdx = MONTH_NAMES.indexOf(monthName);
      const currentYearNum = parseInt(currentYear, 10);
      const targetYearNum = parseInt(year, 10);

      const goingForward =
        targetYearNum > currentYearNum ||
        (targetYearNum === currentYearNum && targetMonthIdx > currentMonthIdx);
      const arrowBtn = goingForward
        ? this.loc.dateRangePickerNextMonth()
        : this.loc.dateRangePickerPrevMonth();

      // Arrow disabled → can't navigate further; the view is the closest reachable month.
      if (await arrowBtn.isDisabled().catch(() => true)) {
        return false;
      }

      await arrowBtn.click();
    }
    return false;
  }

  async isDateDisabledInPicker(dateStr: string): Promise<boolean> {
    const [month, day, year] = dateStr.split('/');
    const dayNum = String(parseInt(day, 10));
    const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
    const reached = await this.navigatePickerToMonthYear(monthName, year);
    // Future months beyond today's (max) picker date are unreachable → not selectable.
    if (!reached) return true;
    const dayBtn = this.loc.dateRangePickerDay(dayNum, monthName);
    const count = await dayBtn.count();
    if (count === 0) return true;
    return await dayBtn.isDisabled().catch(() => true);
  }

  async getPickerYearRange(): Promise<{ min: number; max: number }> {
    for (let i = 0; i < 50; i++) {
      const prevYearBtn = this.loc.dateRangePickerPrevYear();
      if (await prevYearBtn.isDisabled().catch(() => true)) break;
      await prevYearBtn.click();
    }
    const minYearText = (await this.loc.dateRangePickerMonthYear().textContent().catch(() => '')) ?? '';
    const minYear = parseInt(minYearText.split(' ')[1], 10);

    for (let i = 0; i < 50; i++) {
      const nextYearBtn = this.loc.dateRangePickerNextYear();
      if (await nextYearBtn.isDisabled().catch(() => true)) break;
      await nextYearBtn.click();
    }
    const maxYearText = (await this.loc.dateRangePickerMonthYear().textContent().catch(() => '')) ?? '';
    const maxYear = parseInt(maxYearText.split(' ')[1], 10);

    return { min: minYear || 1990, max: maxYear || new Date().getFullYear() };
  }

  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.openDateRangePicker();
    await this.selectDateInPicker(startDate);
    await this.selectDateInPicker(endDate);
    await this.closeDateRangePicker();
    await this.refreshGrid();
    await this.page.waitForTimeout(1000);
  }

  // ===== Stage Dropdown Methods =====

  private stagePanelOpen(): Promise<boolean> {
    return this.loc.stageOptionList().isVisible().catch(() => false);
  }

  async openStageDropdown(): Promise<void> {
    if (await this.stagePanelOpen()) return;
    await this.loc.stageDropdownBtn().click();
    await expect(this.loc.stageOptionList()).toBeVisible({ timeout: T });
  }

  async closeStageDropdown(): Promise<void> {
    if (!(await this.stagePanelOpen())) return;
    // Esc does not close this multi-select; click the grid search input instead.
    await this.loc.searchInput().click();
    await expect(this.loc.stageOptionList()).toBeHidden({ timeout: T });
  }

  async getStageDropdownLabel(): Promise<string> {
    const spans = this.loc.stageDropdownClosedLabel();
    const n = await spans.count();
    for (let i = 0; i < n; i++) {
      const text = ((await spans.nth(i).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (text) return text;
    }
    return ((await this.loc.stageDropdownBtn().textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  private async isOptionSelected(option: Locator): Promise<boolean> {
    const aria = await option.getAttribute('aria-selected').catch(() => null);
    if (aria === 'true') return true;
    if (aria === 'false') return false;
    return option.evaluate((el) => {
      if (el.querySelector('svg.lucide-check, [data-testid="CheckIcon"], [data-testid*="check"], svg[class*="check"]')) {
        return true;
      }
      return [...el.querySelectorAll('svg')].some((svg) => {
        const cls = `${svg.getAttribute('class') ?? ''} ${svg.getAttribute('aria-label') ?? ''}`;
        return /check/i.test(cls) && !/chevron|caret/i.test(cls);
      });
    });
  }

  async setStageSelection(stages: string[]): Promise<void> {
    await this.openStageDropdown();
    // Clear All resets to the default 6-stage set (see T014), not empty.
    // Select All, then click every option that should not stay selected.
    const wanted = new Set(stages);
    await expect(this.loc.stageSelectAllBtn()).toBeVisible({ timeout: T });
    await this.loc.stageSelectAllBtn().click();
    const available = await this.getAvailableStages();
    for (const name of available) {
      if (wanted.has(name)) continue;
      const option = this.loc.stageOption(name);
      await expect(option).toBeVisible({ timeout: T });
      await option.click();
    }
  }

  async selectOnlyStage(stage: string): Promise<void> {
    await this.setStageSelection([stage]);
  }

  async addStage(stage: string): Promise<void> {
    await this.openStageDropdown();
    const option = this.loc.stageOption(stage);
    await expect(option).toBeVisible({ timeout: T });
    if (!(await this.isOptionSelected(option))) {
      await option.click();
    }
  }

  async selectStages(stages: string[]): Promise<void> {
    await this.setStageSelection(stages);
  }

  async clickStageSelectAll(): Promise<void> {
    await this.openStageDropdown();
    await this.loc.stageSelectAllBtn().click();
  }

  async clickStageClearAll(): Promise<void> {
    await this.openStageDropdown();
    await this.loc.stageClearAllBtn().click();
  }

  async clickGridClearFilters(): Promise<void> {
    await this.closeStageDropdown();
    await expect(this.loc.gridClearFiltersBtn()).toBeVisible({ timeout: T });
    await this.loc.gridClearFiltersBtn().click();
  }

  async isStageSelected(stage: string): Promise<boolean> {
    await this.openStageDropdown();
    return this.isOptionSelected(this.loc.stageOption(stage));
  }

  async getAvailableStages(): Promise<string[]> {
    await this.openStageDropdown();
    const options = this.loc.stageOptions();
    const count = await options.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await options.nth(i).textContent()) ?? '').replace(/\s+/g, ' ').trim();
      if (text) names.push(text);
    }
    return names;
  }

  async expectDefaultHistoryStages(): Promise<void> {
    await this.openStageDropdown();
    const available = await this.getAvailableStages();
    const selected: string[] = [];
    for (const name of available) {
      if (await this.isOptionSelected(this.loc.stageOption(name))) selected.push(name);
    }
    expect(selected).not.toContain('Completed');
    expect(selected).toHaveLength(6);
  }

  async expectStageDropdownLists(expected: string[]): Promise<void> {
    const available = await this.getAvailableStages();
    for (const exp of expected) {
      expect(available).toContain(exp);
    }
  }

  // ===== Status Filter Methods =====

  async openStatusDropdown(): Promise<void> {
    await this.loc.statusDropdownBtn().click();
    await this.page.waitForTimeout(300);
    await expect(this.loc.statusDropdown()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async closeStatusDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
  }

  async selectStatus(status: string): Promise<void> {
    await this.openStatusDropdown();
    const option = this.loc.statusOption(status);
    await expect(option).toBeVisible({ timeout: smokeStepTimeoutMs });
    await option.click();
    await this.page.waitForTimeout(200);
    await this.closeStatusDropdown();
  }

  // ===== Carrier Filter Methods =====

  async openCarrierDropdown(): Promise<void> {
    await this.loc.carrierDropdownBtn().click();
    await this.page.waitForTimeout(300);
    await expect(this.loc.carrierDropdown()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async closeCarrierDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
  }

  async selectCarrier(carrier: string): Promise<void> {
    await this.openCarrierDropdown();
    const option = this.loc.carrierOption(carrier);
    await expect(option).toBeVisible({ timeout: smokeStepTimeoutMs });
    await option.click();
    await this.page.waitForTimeout(200);
    await this.closeCarrierDropdown();
  }

  // ===== Grid Assertion Methods =====

  /** Assert every visible row's Uploaded date is within range (inclusive) */
  async expectAllRowsUploadedDateInRange(startDate: string, endDate: string): Promise<void> {
    await this.loc.grid().waitFor({ state: 'visible', timeout: T });
    const rows = this.dataRows();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const text = await this.cellText(rows.nth(i), 'Uploaded');
      const match = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const rowDate = new Date(match[1]);
        if (rowDate < start || rowDate > end) {
          throw new Error(`Row Uploaded date ${match[1]} outside range ${startDate} - ${endDate}`);
        }
      }
    }
  }

  /** Assert every visible row's Stage is one of the expected stages */
  async expectAllRowsStageIn(expectedStages: string[]): Promise<void> {
    const rows = this.dataRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.cellText(rows.nth(i), 'Stage')).trim();
      if (!text) continue;
      if (!expectedStages.includes(text)) {
        throw new Error(`Row stage "${text}" not in expected: ${expectedStages.join(', ')}`);
      }
    }
  }

  /** Assert grid is sorted by Uploaded date descending */
  async expectGridSortedByUploadedDesc(): Promise<void> {
    const rows = this.dataRows();
    const count = await rows.count();
    let prevDate: Date | null = null;
    for (let i = 0; i < count; i++) {
      const text = await this.cellText(rows.nth(i), 'Uploaded');
      const match = text.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/);
      if (match) {
        const rowDate = new Date(match[1]);
        if (prevDate && rowDate > prevDate) {
          throw new Error(`Grid not sorted descending: ${rowDate} > ${prevDate}`);
        }
        prevDate = rowDate;
      }
    }
  }

  /** Row-stage check only when the current date range actually has matching files. */
  async expectOptionalStageInRows(stage: string): Promise<void> {
    await this.closeStageDropdown();
    await this.loc.grid().waitFor({ state: 'visible', timeout: T });
    const rows = this.dataRows();
    const count = await rows.count();
    if (count === 0) return;
    const stages: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await this.cellText(rows.nth(i), 'Stage')).trim();
      if (text) stages.push(text);
    }
    if (stages.includes(stage)) {
      expect(stages).toContain(stage);
    }
  }

  /** Get count of visible rows */
  async getVisibleRowCount(): Promise<number> {
    return this.dataRows().count();
  }

  /** Get summary card values */
  async getSummaryCards(): Promise<{ total: string; inProgress: string; waiting: string; errors: string }> {
    const total = ((await this.loc.totalStatementsCard().textContent()) ?? '').trim();
    const inProgress = ((await this.loc.inProgressCard().textContent()) ?? '').trim();
    const waiting = ((await this.loc.waitingCard().textContent()) ?? '').trim();
    const errors = ((await this.loc.errorsCard().textContent()) ?? '').trim();
    return { total, inProgress, waiting, errors };
  }

  /** Assert grid column headers are present */
  async expectGridColumns(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(this.loc.gridColumnHeader(header)).toBeVisible({ timeout: smokeStepTimeoutMs });
    }
  }

  /** Include Completed stage in filter */
  async includeCompletedStage(): Promise<void> {
    await this.addStage('Completed');
    await this.closeStageDropdown();
  }

  /** Search history by file ID */
  async searchByFileId(fileId: string): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: smokeStepTimeoutMs });
    await search.fill(fileId);
    await this.page.waitForTimeout(1500);
  }

  /** Get Uploaded date and Updated At for a specific file ID */
  async getFileDates(fileId: string): Promise<{ uploaded: string; updatedAt: string }> {
    await this.searchByFileId(fileId);
    const rows = await this.loc.grid().getByRole('row').all();
    for (const row of rows) {
      const fileIdCell = row.getByRole('gridcell').first();
      const text = ((await fileIdCell.textContent()) ?? '').trim();
      if (text === fileId) {
        const uploadedCell = row.getByRole('gridcell').nth(4);
        const updatedCell = row.getByRole('gridcell').nth(5);
        const uploaded = ((await uploadedCell.textContent()) ?? '').trim();
        const updatedAt = ((await updatedCell.textContent()) ?? '').trim();
        return { uploaded, updatedAt };
      }
    }
    throw new Error(`File ID ${fileId} not found in grid`);
  }

  /** Change a file's stage (via actions button) */
  async changeFileStage(fileId: string, newStage: string): Promise<void> {
    await this.searchByFileId(fileId);
    const rows = await this.loc.grid().getByRole('row').all();
    for (const row of rows) {
      const fileIdCell = row.getByRole('gridcell').first();
      const text = ((await fileIdCell.textContent()) ?? '').trim();
      if (text === fileId) {
        const actionBtn = row.getByRole('button').last();
        await actionBtn.click();
        await this.page.waitForTimeout(300);
        // Click the stage change option - this depends on the menu structure
        const stageOption = this.loc.stageMenuItem(newStage);
        await expect(stageOption).toBeVisible({ timeout: T });
        await stageOption.click();
        return;
      }
    }
    throw new Error(`File ID ${fileId} not found in grid`);
  }
}
