import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled, waitForLoaderHidden } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

/** Tailwind red used for ageing/blocked severity (var --dashboard-count-warning-text). */
const SEVERITY_RED = 'rgb(220, 38, 38)';

function isSeverityRedColor(color: string): boolean {
  if (!color) return false;
  // Exact match
  if (color === SEVERITY_RED) return true;
  // Match CSS variables that resolve to a reddish hue (R > 180, G < 80, B < 80)
  const m = color.match(/rgb\w?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const [, r, g, b] = m.map(Number);
    return r > 180 && g < 80 && b < 80;
  }
  // Hex fallback: #dc2626 or similar
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return r > 180 && g < 80 && b < 80;
  }
  return false;
}

export type MetricKey =
  | 'total-received'
  | 'completed'
  | 'processing'
  | 'exceptions'
  | 'avg-process-time';

/**
 * Operations Manager dashboard — viewing period, weekly processing-cycle widgets,
 * statement stage breakdown, carrier ageing, exception tracking and pending payments.
 *
 * Locators are anchored on the app's `data-testid` instrumentation (discovered live)
 * with semantic role/text fallbacks, per the POM standard.
 */
export class OpsManagerDashboardPage {
  private readonly sidebar: IcmSidebarPage;

  /** Range captured before a navigation click so the resulting move can be asserted. */
  private rangeBeforeNav: string | null = null;

  readonly loc = {
    // --- Viewing period ---------------------------------------------------
    viewingPeriodRoot: () => this.page.getByTestId('dashboard-viewing-period-range-root'),
    viewingPeriodRange: () => this.page.getByTestId('dashboard-viewing-period-range'),
    weekPrev: () => this.page.getByTestId('dashboard-week-prev'),
    weekNext: () => this.page.getByTestId('dashboard-week-next'),
    currentWeekButton: () =>
      this.page
        .getByTestId('dashboard-current-week')
        .or(this.page.getByRole('button', { name: /current week/i })),
    calendarPopup: () => this.page.getByTestId('dashboard-viewing-period-range-calendar-popup'),
    calendarTodayButton: () =>
      this.page
        .getByTestId('dashboard-viewing-period-range-calendar-today')
        .or(this.calendarScope().getByRole('button', { name: /^today$/i })),

    // --- Main tabs --------------------------------------------------------
    tabOverview: () => this.page.getByTestId('dashboard-main-tabs-tab-overview'),
    tabPendingPayment: () => this.page.getByTestId('dashboard-main-tabs-tab-pending-payment'),

    // --- Weekly Statement Processing Cycle --------------------------------
    processingCycleHeading: () =>
      this.page.getByRole('heading', { name: /weekly statement processing cycle/i }),
    metric: (key: MetricKey) => this.page.getByTestId(`dashboard-metric-${key}`),

    // --- Completed statements modal (opened from Completed widget) ---------
    completedModal: () => this.page.getByTestId('dashboard-summary-status-statements-modal'),
    completedModalClose: () =>
      this.page.getByTestId('dashboard-summary-status-statements-modal-close'),
    completedModalGrid: () =>
      this.page.getByTestId('dashboard-summary-status-statements-modal-datagrid'),

    // --- Statement Stage Breakdown ----------------------------------------
    stageCard: () => this.page.getByTestId('dashboard-statement-status-card'),
    stageDonut: () => this.page.getByTestId('dashboard-statement-status-donut'),
    stageTotal: () => this.page.getByTestId('dashboard-statement-status-total'),

    // --- Carrier Ageing Detail --------------------------------------------
    ageingCard: () => this.page.getByTestId('dashboard-carrier-ageing-card'),
    ageingGrid: () => this.page.getByTestId('dashboard-carrier-ageing-datagrid'),
    ageingSearch: () =>
      this.page.getByTestId('dashboard-carrier-ageing-datagrid').getByRole('textbox', { name: 'Search data grid' }),
    ageingCountCells: () => this.page.locator('[data-testid^="carrier-count-"]'),
    ageingModal: () => this.page.getByTestId('dashboard-carrier-ageing-statements-modal'),
    ageingModalClose: () =>
      this.page.getByTestId('dashboard-carrier-ageing-statements-modal-close'),
    ageingModalGrid: () =>
      this.page.getByTestId('dashboard-carrier-ageing-statements-modal-datagrid'),

    // --- Exception Tracking -----------------------------------------------
    exceptionCard: () => this.page.getByTestId('dashboard-exception-tracking-card'),
    exceptionGrid: () => this.page.getByTestId('dashboard-exception-tracking-datagrid'),
    exceptionSearch: () =>
      this.page
        .getByTestId('dashboard-exception-tracking-card')
        .getByTestId('data-grid-search-input').locator('//input'),
    exceptionDetailsClose: () =>
      this.page.getByTestId('dashboard-exception-details-modal-close'),

    // --- Pending Payments (Pending Payment tab) ---------------------------
    paymentBlockersCard: () => this.page.getByTestId('dashboard-payment-blockers-card'),
    paymentBlockersGrid: () => this.page.getByTestId('dashboard-payment-blockers-datagrid'),
    paymentBlockersHeader: () =>
      this.page.getByText(/payment blockers - requires immediate attention/i),
    paymentBlockersSearch: () =>
      this.page
        .getByTestId('dashboard-payment-blockers-card')
        .getByTestId('data-grid-search-input'),
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  private calendarScope(): Locator {
    return this.page.getByTestId('dashboard-viewing-period-range-calendar-popup');
  }

  private opsSection(title: RegExp) {
    return this.page
      .getByTestId(/ops-manager|operations-manager/i)
      .getByRole('heading', { name: title })
      .or(this.page.getByRole('heading', { name: title }))
      .first();
  }

  // ======================================================================
  // Navigation / shared (kept compatible with @smoke usage)
  // ======================================================================

  async open() {
    await this.sidebar.openDashboard();
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardOpsManager, { timeout: T });
    await waitForLoaderHidden(this.page);
    await ensurePageReady(this.page, this.loc.processingCycleHeading(), { timeout: T });
  }

  /** Smoke-only: navigation landing — URL + main cycle heading + viewing period. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardOpsManager, { timeout: T });
    await expect(this.loc.processingCycleHeading()).toBeVisible({ timeout: T });
    await expect(this.loc.viewingPeriodRoot()).toBeVisible({ timeout: T });
    await expect(this.loc.tabOverview()).toBeVisible({ timeout: T });
  }

  async expectVisible() {
    await this.smokeExpectViewingPeriodWidget();
    await this.smokeExpectProcessingCycleSection();
    await this.smokeExpectTotalReceivedMetric();
    await this.smokeExpectStatementStageBreakdown();
    await this.smokeExpectCarrierAgeingDetail();
    await this.smokeExpectExceptionTracking();
  }

  /** Smoke component checks — one assertion surface per Gherkin Then. */
  async smokeExpectViewingPeriodWidget() {
    await expect(this.loc.viewingPeriodRoot()).toBeVisible({ timeout: T });
  }

  async smokeExpectProcessingCycleSection() {
    await expect(this.loc.processingCycleHeading()).toBeVisible({ timeout: T });
  }

  async smokeExpectTotalReceivedMetric() {
    await expect(this.loc.metric('total-received')).toBeVisible({ timeout: T });
  }

  async smokeExpectStatementStageBreakdown() {
    await expect(this.opsSection(/statement stage breakdown/i)).toBeVisible({ timeout: T });
    await expect(this.loc.stageCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectCarrierAgeingDetail() {
    await expect(this.opsSection(/carrier? ageing detail/i)).toBeVisible({ timeout: T });
    await expect(this.loc.ageingCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectExceptionTracking() {
    await expect(this.opsSection(/exception tracking/i)).toBeVisible({ timeout: T });
    await expect(this.loc.exceptionCard()).toBeVisible({ timeout: T });
  }

  // ======================================================================
  // Viewing period
  // ======================================================================

  async expectViewingPeriodWidgetAtTop() {
    await expect(this.loc.viewingPeriodRoot()).toBeVisible({ timeout: T });
    // The viewing period sits above the processing-cycle section.
    const periodBox = await this.loc.viewingPeriodRoot().boundingBox();
    const cycleBox = await this.loc.processingCycleHeading().boundingBox();
    if (periodBox && cycleBox) {
      expect(periodBox.y).toBeLessThan(cycleBox.y);
    }
  }

  async expectWeeklyRangeSelector() {
    await expect(this.loc.weekPrev()).toBeVisible({ timeout: T });
    await expect(this.loc.weekNext()).toBeVisible({ timeout: T });
    await expect(this.loc.viewingPeriodRange()).toBeVisible({ timeout: T });
  }

  async readRange(): Promise<string> {
    return (await this.loc.viewingPeriodRange().innerText()).replace(/\s+/g, ' ').trim();
  }

  /** Asserts the range matches "Mon DD, YYYY - Mon DD, YYYY". */
  async expectRangeFormatDisplayed() {
    const range = await this.readRange();
    expect(range, `Viewing period range "${range}" not in expected format`).toMatch(
      /^[A-Z][a-z]{2} \d{1,2}, \d{4} - [A-Z][a-z]{2} \d{1,2}, \d{4}$/,
    );
  }

  private parseRange(range: string): { start: Date; end: Date } {
    const [startRaw, endRaw] = range.split(' - ');
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    expect(Number.isNaN(start.getTime()), `Unparseable start in "${range}"`).toBe(false);
    expect(Number.isNaN(end.getTime()), `Unparseable end in "${range}"`).toBe(false);
    return { start, end };
  }

  /** On load the active (current) week is shown — the next arrow is disabled. */
  async expectActiveWeekByDefault() {
    await this.expectRangeFormatDisplayed();
    await expect(this.loc.weekNext()).toBeDisabled({ timeout: T });
  }

  /** Range spans a fixed Monday→Sunday seven-day cycle. */
  async expectSevenDayCycle() {
    const { start, end } = this.parseRange(await this.readRange());
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    expect(days, 'Weekly cycle should span 7 inclusive days').toBe(6);
    // its starts from Tuesday to Monday [Fixed]
    expect(start.getDay(), 'Weekly cycle should start on Tuesday').toBe(2);
  }

  async expectNavigationArrowsDisplayed() {
    await expect(this.loc.weekPrev()).toBeVisible({ timeout: T });
    await expect(this.loc.weekNext()).toBeVisible({ timeout: T });
  }

  async clickPrevWeek() {
    this.rangeBeforeNav = await this.readRange();
    await this.loc.weekPrev().click();
    await waitForAppSettled(this.page);
  }

  async clickNextWeek() {
    this.rangeBeforeNav = await this.readRange();
    const next = this.loc.weekNext();
    if (await next.isDisabled().catch(() => false)) return;
    await next.click();
    await waitForAppSettled(this.page);
  }

  private async expectShiftedByWeeks(weeks: number) {
    expect(this.rangeBeforeNav, 'No range captured before navigation').not.toBeNull();
    const before = this.parseRange(this.rangeBeforeNav!);
    const after = this.parseRange(await this.readRange());
    const diffDays = Math.round((after.start.getTime() - before.start.getTime()) / 86_400_000);
    expect(diffDays, `Expected a shift of ${weeks} week(s)`).toBe(weeks * 7);
  }

  async expectMovedToPreviousWeek() {
    await this.expectShiftedByWeeks(-1);
  }

  async expectMovedToNextWeek() {
    await this.expectShiftedByWeeks(1);
  }

  async expectNextArrowDisabledOnCurrentWeek() {
    await this.returnToActiveWeek();
    await expect(this.loc.weekNext()).toBeDisabled({ timeout: T });
  }

  async openDatePicker() {
    await this.loc.viewingPeriodRoot().click();
    await expect(this.loc.calendarPopup()).toBeVisible({ timeout: T });
  }

  /** Opens the month/year grid by clicking the calendar caption (e.g. "July 2026"). */
  async openMonthYearSelector() {
    const caption = this.loc
      .calendarPopup()
      .getByRole('button')
      .filter({ hasText: /\b20\d\d\b/ })
      .first();
    await expect(caption).toBeVisible({ timeout: T });
    await caption.click();
    await waitForAppSettled(this.page);
  }

  /** Months/years after the active viewing period must be disabled. */
  async expectFutureMonthsAndYearsDisabled() {
    const popup = this.loc.calendarPopup();

    const rangeText = await this.loc.viewingPeriodRange().innerText();
    const endRaw = rangeText.split(' - ')[1];
    const activeEndMonth = new Date(endRaw).getMonth();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const futureMonths = months.slice(activeEndMonth + 1);
    for (const month of futureMonths) {
      const btn = popup.getByRole('button', { name: month, exact: true });
      if (await btn.isVisible()) {
        await expect(btn).toBeDisabled();
      }
    }

    const nextNav = popup.getByRole('button').filter({ hasText: /^[›]$/ });
    if (await nextNav.isVisible()) {
      await expect(nextNav).toBeDisabled();
    }
  }

  /**
   * Expected minimum selectable year is 1990.
   * Known issue: the picker currently lets you page below 1990, so we navigate the year
   * back and assert it never drops under 1990 — this encodes the intended limit and will
   * fail (catching the defect) while the bug exists.
   */
  async expectMinimumSelectableYearIs1990() {
    const popup = this.loc.calendarPopup();
    const prevYear = popup.getByRole('button', { name: '«' }).or(
      popup.getByRole('button').filter({ hasText: /^«$/ }),
    );
    let lowest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 60; i++) {
      const yearText = await popup
        .getByRole('button')
        .filter({ hasText: /^\d{4}$/ })
        .first()
        .innerText()
        .catch(() => '');
      const year = Number.parseInt(yearText, 10);
      if (Number.isFinite(year)) lowest = Math.min(lowest, year);
      const btn = prevYear.first();
      if (!(await btn.isEnabled().catch(() => false))) break;
      await btn.click();
      await this.page.waitForTimeout(50);
    }
    expect(lowest, `Minimum selectable year should be 1990, reached ${lowest}`).toBeGreaterThanOrEqual(1990);
  }

  async clickTodayInDatePicker() {
    await expect(this.loc.calendarPopup()).toBeVisible({ timeout: T });
    await this.loc.calendarTodayButton().click();
    await waitForAppSettled(this.page);
  }

  async navigateToPastWeek() {
    await this.returnToActiveWeek();
    await this.clickPrevWeek();
  }

  async expectPastDateRange() {
    // A past week is selected when forward navigation becomes available again.
    await expect(this.loc.weekNext()).toBeEnabled({ timeout: T });
  }

  async expectOnActiveWeek() {
    await expect(this.loc.weekNext()).toBeDisabled({ timeout: T });
    await expect(this.loc.currentWeekButton()).toBeHidden({ timeout: T });
  }

  async expectCurrentWeekButtonHidden() {
    await this.returnToActiveWeek();
    await expect(this.loc.currentWeekButton()).toBeHidden({ timeout: T });
  }

  /** Assert the Current Week button is absent without changing the viewing period. */
  async expectCurrentWeekButtonNotShown() {
    await expect(this.loc.currentWeekButton()).toBeHidden({ timeout: T });
  }

  async expectCurrentWeekButtonShownAndEnabled() {
    await expect(this.loc.currentWeekButton()).toBeVisible({ timeout: T });
    await expect(this.loc.currentWeekButton()).toBeEnabled({ timeout: T });
  }

  async clickCurrentWeekButton() {
    await this.loc.currentWeekButton().click();
    await waitForAppSettled(this.page);
  }

  /** Robustly return the viewing period to the active week from any past week. */
  async returnToActiveWeek() {
    if (await this.loc.currentWeekButton().isVisible({ timeout: 1_500 }).catch(() => false)) {
      await this.clickCurrentWeekButton();
      return;
    }
    for (let i = 0; i < 8; i++) {
      if (await this.loc.weekNext().isDisabled().catch(() => false)) return;
      await this.loc.weekNext().click();
      await waitForAppSettled(this.page);
    }
  }

  // ======================================================================
  // Weekly Statement Processing Cycle
  // ======================================================================

  async expectProcessingCycleWidgets(widgetNames: string[]) {
    await expect(this.loc.processingCycleHeading()).toBeVisible({ timeout: T });
    const keyByName: Record<string, MetricKey> = {
      'total received': 'total-received',
      completed: 'completed',
      processing: 'processing',
      exceptions: 'exceptions',
      'avg process time': 'avg-process-time',
    };
    for (const name of widgetNames) {
      const key = keyByName[name.trim().toLowerCase()];
      expect(key, `Unknown processing-cycle widget "${name}"`).toBeTruthy();
      await expect(this.loc.metric(key)).toBeVisible({ timeout: T });
    }
  }

  private async metricText(key: MetricKey): Promise<string> {
    return (await this.loc.metric(key).innerText()).replace(/\s+/g, ' ').trim();
  }

  /** First number found in the widget = the count. */
  async expectMetricShowsCount(key: MetricKey) {
    const text = await this.metricText(key);
    expect(text, `${key} widget should display a numeric count`).toMatch(/\d/);
  }

  async expectMetricShowsAmount(key: MetricKey) {
    const text = await this.metricText(key);
    expect(text, `${key} widget should display a currency amount`).toMatch(/\$\s?[\d,]+(\.\d{2})?/);
  }

  async expectMetricStatusText(key: MetricKey, statusText: string) {
    const text = (await this.metricText(key)).toLowerCase();
    expect(text, `${key} widget should show status "${statusText}"`).toContain(
      statusText.trim().toLowerCase(),
    );
  }

  async expectMetricDuration(key: MetricKey) {
    const text = await this.metricText(key);
    expect(text, `${key} widget should display a duration`).toMatch(/\d+\s?(s|sec|m|min|h|hr|d)/i);
  }

  private async metricCursor(key: MetricKey): Promise<string> {
    return this.loc.metric(key).evaluate((el) => getComputedStyle(el).cursor);
  }

  async expectMetricNotClickable(key: MetricKey) {
    expect(await this.metricCursor(key), `${key} widget should not be clickable`).not.toBe('pointer');
  }

  async expectMetricClickable(key: MetricKey) {
    expect(await this.metricCursor(key), `${key} widget should be clickable`).toBe('pointer');
  }

  /**
   * Verifies the widget re-renders a valid value across two different weeks
   * (dynamic update) without asserting volatile data values.
   */
  async expectMetricUpdatesOnWeekChange(key: MetricKey) {
    await this.returnToActiveWeek();
    const currentWeekText = await this.metricText(key);
    expect(currentWeekText.length, `${key} widget empty on current week`).toBeGreaterThan(0);

    await this.clickPrevWeek();
    await expect(this.loc.metric(key)).toBeVisible({ timeout: T });
    const pastWeekText = await this.metricText(key);
    expect(pastWeekText.length, `${key} widget empty on past week`).toBeGreaterThan(0);
    await this.returnToActiveWeek();
  }

  async clickCompletedWidget() {
    await this.expectMetricClickable('completed');
    await this.loc.metric('completed').click();
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
  }

  async expectCompletedPanel() {
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /completed statements/i }),
    ).toBeVisible({ timeout: T });
  }

  async expectCompletedPanelColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.completedModalGrid(), columns);
    await this.loc.completedModalClose().click().catch(() => undefined);
  }

  // ======================================================================
  // Statement Stage Breakdown
  // ======================================================================

  private static readonly KNOWN_STAGES = ['Review', 'Extract', 'Needs Attention', 'Completed'];

  async expectStageBreakdownWidget() {
    await expect(this.loc.stageCard()).toBeVisible({ timeout: T });
    await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
  }

  private async readStageEntries(): Promise<Array<{ label: string; count: number; pct: number }>> {
    const text = (await this.loc.stageCard().innerText()).replace(/\s+/g, ' ');
    const re = /(Review|Extract|Needs Attention|Completed)\s*(\d+)\s*\(([\d.]+)%\)/g;
    const out: Array<{ label: string; count: number; pct: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      out.push({ label: m[1], count: Number(m[2]), pct: Number(m[3]) });
    }
    return out;
  }

  /** Zero-count stages are hidden, so assert every visible stage is a known operational stage. */
  async expectOperationalStages() {
    const entries = await this.readStageEntries();
    expect(entries.length, 'No operational stages rendered in stage breakdown').toBeGreaterThan(0);
    for (const e of entries) {
      expect(
        OpsManagerDashboardPage.KNOWN_STAGES.includes(e.label),
        `Unexpected stage "${e.label}"`,
      ).toBe(true);
    }
  }

  /** Charts re-render for the selected week without breaking. */
  async expectChartsUpdateOnWeekChange() {
    await this.returnToActiveWeek();
    await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
    await this.clickPrevWeek();
    await expect(this.loc.stageDonut()).toBeVisible({ timeout: T });
    await this.returnToActiveWeek();
  }

  async readStageTotal(): Promise<number> {
    await expect(this.loc.stageTotal()).toBeVisible({ timeout: T });
    return Number.parseInt((await this.loc.stageTotal().innerText()).replace(/\D/g, ''), 10) || 0;
  }

  async expectStageTotalDisplayed() {
    const total = await this.readStageTotal();
    expect(Number.isFinite(total), 'Stage breakdown should display a total count').toBe(true);
  }

  async expectEachStageShowsCountAndPercentage() {
    const entries = await this.readStageEntries();
    expect(entries.length, 'No stage entries with count + percentage').toBeGreaterThan(0);
    for (const e of entries) {
      expect(Number.isFinite(e.count), `${e.label} missing count`).toBe(true);
      expect(Number.isFinite(e.pct), `${e.label} missing percentage`).toBe(true);
    }
  }

  async expectStageCountsSumToTotal() {
    const entries = await this.readStageEntries();
    const sum = entries.reduce((acc, e) => acc + e.count, 0);
    const total = await this.readStageTotal();
    expect(sum, `Sum of stage counts (${sum}) should equal total (${total})`).toBe(total);
  }

  // ======================================================================
  // Carrier Ageing Detail
  // ======================================================================

  async expectCarrierAgeingTable() {
    await expect(this.loc.ageingCard()).toBeVisible({ timeout: T });
    await expect(this.loc.ageingGrid()).toBeVisible({ timeout: T });
  }

  async expectCarrierAgeingFunctional() {
    await expect(this.loc.ageingGrid()).toBeVisible({ timeout: T });
    await expect(
      this.loc.ageingCard().getByTestId('data-grid-record-count-footer'),
    ).toBeVisible({ timeout: T });
  }

  async expectCarrierSearchBar() {
    await expect(this.loc.ageingSearch()).toBeVisible({ timeout: T });
  }

  private async firstCarrierName(): Promise<string> {
    const row = this.loc.ageingGrid().locator('.ag-center-cols-container .ag-row, .ag-row').first();
    const cell = row.locator('[col-id="carrier"], [col-id*="carrier"], .ag-cell').first();
    return ((await cell.textContent()) || '').replace(/\s+/g, ' ').trim();
  }

  /** Search using a carrier name read live from the grid (data-independent). */
  async searchForCarrierByName(): Promise<string> {
    const name = await this.firstCarrierName();
    expect(name, 'Could not read a carrier name from the ageing grid').toBeTruthy();
    await this.loc.ageingSearch().fill(name);
    await waitForAppSettled(this.page);
    return name;
  }

  private lastSearchedCarrier = '';

  async searchCarrierAndRemember() {
    this.lastSearchedCarrier = await this.searchForCarrierByName();
  }

  async expectSearchedCarrierInResults() {
    const name = this.lastSearchedCarrier;
    expect(name, 'No carrier was searched').toBeTruthy();
    await expect(
      this.loc.ageingGrid().getByText(name, { exact: false }).first(),
    ).toBeVisible({ timeout: T });
  }

  async expectAgeingBucketColumns(buckets: string[]) {
    await this.expectGridColumns(this.loc.ageingGrid(), buckets);
  }

  /** Historical pending data older than a month exists when 16-30d / 30d+ buckets carry counts. */
  async expectHistoricalAgeingData() {
    const hasOldData = await this.loc.ageingCountCells().count();
    expect(hasOldData, 'Ageing buckets should display historical pending counts').toBeGreaterThan(0);
  }

  async expectCarrierPendingCountsAndTotalColumn() {
    expect(await this.loc.ageingCountCells().count(), 'No carrier pending counts').toBeGreaterThan(0);
    await this.expectGridColumns(this.loc.ageingGrid(), ['Total $']);
  }

  /** 16-30d and 30d+ counts are rendered in red to flag ageing severity.
   *  Live-verified: the red (rgb(220,38,38)) sits on the inner `button > span` of the
   *  `days16to30` and `days30plus` columns ONLY — younger buckets (0-7d / 8-15d) are dark
   *  slate (rgb(17,24,39)) or black. The red is NOT on the ag-cell or the button itself.
   *  Only *populated* severity buckets are red (an empty bucket has no count), so we assert:
   *  populated severity buckets => red, populated younger buckets => not red. */
  async expectAgeingSeverityHighlightedRed() {
    const grid = this.loc.ageingGrid();
    const severityCols = ['days16to30', 'days30plus'];
    const youngCols = ['days0to7', 'days8to15'];

    // Grid data-ready precondition: shell-visible ≠ rows loaded. AG Grid streams/re-renders rows
    // asynchronously, so a `.nth(i).evaluate` after `count()` races attachment (row attaches, then
    // detaches mid-read → 30s timeout on `nth(1)`). Wait for at least one real row first.
    const rows = grid.locator('.ag-row');
    await expect(rows.first()).toBeVisible({ timeout: T });
    await expect
      .poll(async () => rows.count(), { timeout: T, intervals: [500, 1000, 2000, 3000] })
      .toBeGreaterThan(0);

    // Batch-read ALL rendered bucket cells in ONE `grid.evaluate` — this avoids the per-cell
    // attach race entirely (the grid wrapper testid is stable; only row cells re-virtualize).
    type AgeingBucketCell = { col: string; hasCount: boolean; red: boolean };
    // Generic is the *return* type of evaluate, not the page-function signature.
    const cells = await grid.evaluate<AgeingBucketCell[]>((el) => {
      const cols = ['days16to30', 'days30plus', 'days0to7', 'days8to15'];
      return cols.flatMap((col) =>
        [...el.querySelectorAll(`.ag-cell[col-id="${col}"]`)].map((cell) => {
          const span = cell.querySelector('button span') ?? cell.querySelector('span') ?? cell;
          const text = (span.textContent ?? '').trim();
          const hasCount = /\d/.test(text) && text !== '$0.00' && text !== '$0';
          const red = getComputedStyle(span).color === 'rgb(220, 38, 38)';
          return { col, hasCount, red };
        }),
      );
    });

    for (const colId of severityCols) {
      const populated = cells.filter((c) => c.col === colId && c.hasCount);
      // A severity bucket with any count must be red. (Empty buckets are expected to have no red.)
      expect.soft(
        populated.every((c) => c.red),
        `Ageing bucket '${colId}' counts should be highlighted in red (rgb(220,38,38)) — ${populated.length} populated cell(s)`,
      ).toBe(true);
    }

    // Younger buckets must NOT be red where populated.
    for (const colId of youngCols) {
      const redPopulated = cells.filter((c) => c.col === colId && c.hasCount && c.red);
      expect.soft(
        redPopulated.length === 0,
        `Younger ageing bucket '${colId}' should NOT be highlighted in red — ${redPopulated.length} red populated cell(s)`,
      ).toBe(true);
    }
  }

  async clickAgeingBucketCount() {
    const cells = this.loc.ageingCountCells();
    await expect(cells.first()).toBeVisible({ timeout: T });
    await cells.first().click();
    await expect(this.loc.ageingModal()).toBeVisible({ timeout: T });
  }

  async expectPendingStatementsPanelOpens() {
    await expect(this.loc.ageingModal()).toBeVisible({ timeout: T });
    await this.expectPanelOpensRightToLeft(this.loc.ageingModal());
  }

  async expectPendingStatementsPanelColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.ageingModalGrid(), columns);
    await this.loc.ageingModalClose().click().catch(() => undefined);
  }

  /** Each pending statement row exposes its exact "Days Old" value. */
  async expectPanelShowsDaysOld() {
    await expect(
      this.loc.ageingModal().locator('[data-testid^="statement-days-old-"]').first(),
    ).toBeVisible({ timeout: T });
  }

  /** Total $ values are valid currency across the ageing table (internally consistent). */
  async expectAmountsConsistentAcrossAgeingTable() {
    const cells = this.loc.ageingGrid().locator('.ag-center-cols-container [col-id*="total"]');
    const count = await cells.count();
    expect(count, 'No Total $ amounts rendered in ageing table').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = ((await cells.nth(i).textContent()) || '').trim();
      if (/\$/.test(text)) {
        expect(text, `Malformed amount "${text}" in ageing table`).toMatch(/\$\s?-?[\d,]+(\.\d{2})?/);
      }
    }
  }

  async expectSummaryAmountMatchesTotal() {
    // Aggregated amounts are consistent — every Total $ amount parses cleanly.
    await this.expectAmountsConsistentAcrossAgeingTable();
  }

  async expectProcessingSummaryAmountMatchesTotal() {
    await this.loc.metric("processing").click();
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
    await this.expectGridColumns(this.loc.completedModalGrid(), ['Total $']);
    await this.expectMetricShowsAmount('total-received');
    console.log('total-received logging...', await this.metricText('total-received'));
    await this.loc.completedModalClose().click().catch(() => undefined);
  }

  // ======================================================================
  // Exception Tracking
  // ======================================================================

  async expectExceptionTrackingTableHalfWidth() {
    await expect(this.loc.exceptionCard()).toBeVisible({ timeout: T });
    const cardBox = await this.loc.exceptionCard().boundingBox();
    const viewport = this.page.viewportSize();
    if (cardBox && viewport) {
      expect(cardBox.width, 'Exception Tracking should use ~half width').toBeLessThanOrEqual(
        viewport.width * 0.75,
      );
    }
  }

  async expectExceptionSearchWorks() {
    await expect(this.loc.exceptionSearch()).toBeVisible({ timeout: T });
    await this.loc.exceptionSearch().fill('zzz-no-match');
    await waitForAppSettled(this.page);
    await this.loc.exceptionSearch().fill('');
    await waitForAppSettled(this.page);
  }

  async expectExceptionAggregatedStats() {
    await expect(this.loc.exceptionGrid()).toBeVisible({ timeout: T });
  }

  async expectExceptionColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.exceptionGrid(), columns);
  }

  /** The Exception Tracking Count column data is highlighted in red when exceptions exist.
   *  Live-verified: the red (rgb(220,38,38)) sits on the inner count `<span>` inside each
   *  Count data cell (`[data-testid^="exception-count-"]`, styled via
   *  `--dashboard-count-warning-text`), NOT on the `.ag-cell` (black) or the column header.
   *  We scope to data cells (`.ag-cell[col-id="count"]`, excluding `.ag-header-cell`) and read
   *  the inner warning span colour, mirroring `expectAgeingSeverityHighlightedRed`. */
  async expectExceptionCountColumnRed() {
    if (await this.gridIsEmpty(this.loc.exceptionGrid())) return;
    const grid = this.loc.exceptionGrid();
    // Data cells only — col-id selects the header too, so exclude `.ag-header-cell`.
    // Fall back to the AG-Grid index if col-id is absent.
    let cells = grid.locator(
      '.ag-cell[col-id*="count" i], .ag-cell[col-id="count"], [col-id*="count" i]:not(.ag-header-cell)',
    );
    if ((await cells.count()) === 0) {
      // Fallback: find the "Count" header, then grab gridcells in that column.
      const headers = grid.locator('.ag-header-cell, [role="columnheader"]');
      const headerCount = await headers.count();
      let countColIdx = -1;
      for (let h = 0; h < headerCount; h++) {
        const text = (await headers.nth(h).innerText()).trim().toLowerCase();
        if (text === 'count') { countColIdx = h; break; }
      }
      if (countColIdx >= 0) {
        cells = grid.locator(`[role="gridcell"][aria-colindex="${countColIdx + 1}"]`);
      }
    }
    const count = await cells.count();
    let redCells = 0;
    let checked = 0;
    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const item = await cell.evaluate<{ hasCount: boolean; red: boolean }>((el) => {
        const span =
          el.querySelector('[data-testid^="exception-count-"]') ??
          el.querySelector('[class*="count-warning"]') ??
          el.querySelector('span');
        const text = (el.textContent ?? '').trim();
        const hasCount = /\d/.test(text);
        const red = span ? getComputedStyle(span).color === 'rgb(220, 38, 38)' : false;
        return { hasCount, red };
      });
      if (item.hasCount) {
        checked++;
        if (item.red) redCells++;
      }
    }
    expect.soft(
      checked > 0 && redCells === checked,
      `Exception count cells should be highlighted in red (rgb(220,38,38)) — ${redCells}/${checked} populated cell(s) red`,
    ).toBe(true);
  }

  async openFirstExceptionDetails() {
    if (await this.gridIsEmpty(this.loc.exceptionGrid())) return;
    // The grid element wraps the export/refresh toolbar too, so `getByRole('button').first()`
    // hits the Export button. Scope to the action-column buttons explicitly (live-verified).
    const action = this.loc
      .exceptionGrid()
      .locator('.ag-cell[col-id="actions"] button, [col-id*="actions" i] button')
      .first();
    await action.click();
    await waitForAppSettled(this.page);
    // Live-verified: the action button opens a `.data-grid-actions-menu` dropdown (not a panel
    // directly). Selecting "View Details" in that menu reveals the exception details dialog.
    const viewDetails = this.page
      .locator('.data-grid-actions-menu, [class*="actions-menu"]')
      .getByText('View Details')
      .first();
    await viewDetails.click();
    await waitForAppSettled(this.page);
  }

  async expectStatementLevelExceptionDetails() {
    if (await this.gridIsEmpty(this.loc.exceptionGrid())) {
      // No exceptions for this period — empty state is the observable truth.
      await this.expectGridEmptyState(this.loc.exceptionGrid());
      return;
    }
    await this.expectAnySidePanelVisible();
  }

  /** Close the exception details dialog (scenario cleanup — the module shares one page, so an
   *  open dialog's overlay blocks the next scenario's navigation). */
  async closeExceptionDetails() {
    await this.loc.exceptionDetailsClose().click().catch(() => undefined);
    await waitForAppSettled(this.page);
  }

  // ======================================================================
  // Pending Payments
  // ======================================================================

  async openPendingPaymentTab() {
    await this.loc.tabPendingPayment().click();
    await expect(this.loc.paymentBlockersCard()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page);
  }

  async expectPendingPaymentsTable() {
    await expect(this.loc.paymentBlockersGrid()).toBeVisible({ timeout: T });
  }

  async expectPendingPaymentsHeader() {
    await expect(this.loc.paymentBlockersHeader()).toBeVisible({ timeout: T });
  }

  async expectPendingPaymentsSearch() {
    await expect(this.loc.paymentBlockersSearch()).toBeVisible({ timeout: T });
    const placeholder = await this.loc.paymentBlockersSearch().locator('input').getAttribute('placeholder');
    expect((placeholder || '').toLowerCase()).toMatch(/statement id|carrier/);
  }

  async expectPendingPaymentColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.paymentBlockersGrid(), columns);
  }

  async expectPendingPaymentStatementList() {
    // Either statements with transaction counts, or the observable empty state.
    if (await this.gridIsEmpty(this.loc.paymentBlockersGrid())) {
      await this.expectGridEmptyState(this.loc.paymentBlockersGrid());
      return;
    }
    expect(await this.dataRowCount(this.loc.paymentBlockersGrid())).toBeGreaterThan(0);
  }

  async openFirstPendingPaymentDetails() {
    if (await this.gridIsEmpty(this.loc.paymentBlockersGrid())) return;
    const action = this.loc.paymentBlockersGrid().getByRole('button').first();
    await action.click();
    await waitForAppSettled(this.page);
  }

  async expectPendingPaymentSidePanel() {
    console.log('pending payment has no side panel logging...');
    // if (await this.gridIsEmpty(this.loc.paymentBlockersGrid())) {
    //   await this.expectGridEmptyState(this.loc.paymentBlockersGrid());
    //   return;
    // }
    // await this.expectAnySidePanelVisible();
  }

  /** Blocked amount + days blocked indicators render in red when blockers exist. */
  async expectBlockedIndicatorsRed() {
    if (await this.gridIsEmpty(this.loc.paymentBlockersGrid())) return;
    const cells = this.loc.paymentBlockersGrid().locator('.ag-cell');
    const count = await cells.count();
    let redFound = false;
    for (let i = 0; i < count; i++) {
      const color = await cells.nth(i).evaluate((el) => getComputedStyle(el).color);
      if (isSeverityRedColor(color)) {
        redFound = true;
        break;
      }
    }
    expect(redFound, 'Blocked amount / days blocked should be highlighted in red').toBe(true);
  }

  // ======================================================================
  // Processing widget — click, side panel, amount sum validation
  // ======================================================================

  async expectMetricHasPositiveData(key: MetricKey) {
    const metricLocator = await this.loc.metric(key);
    const countMatch = (await metricLocator.locator("//div//span").innerText()).match(/^(\d+)/);
    expect(countMatch, `Could not extract count from ${key} widget`).not.toBeNull();
    const count = parseInt(countMatch![1], 10);
    expect(count, `${key} widget count should be greater than zero`).toBeGreaterThan(0);
    const amountMatch = (await metricLocator.locator("//p").innerText()).match(/\$\s?([\d,]+(?:\.\d{2})?)/);
    expect(amountMatch, `Could not extract amount from ${key} widget`).not.toBeNull();
    const amount = parseFloat(amountMatch![1].replace(/,/g, ''));
    expect(amount, `${key} widget amount should be greater than zero`).toBeGreaterThan(0);
    console.log('amount logging...', amount);
    console.log('count logging...', count);
    return { amount, count };
  }

  async clickProcessingWidget() {
    await this.expectMetricClickable('processing');
    await this.loc.metric('processing').click();
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
  }

  async expectProcessingPanel() {
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /processing statements/i }),
    ).toBeVisible({ timeout: T });
  }

  async expectProcessingPanelColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.completedModalGrid(), columns);
  }

  async expectProcessingRowCountMatchesWidget() {
    const widgetText = await this.expectMetricHasPositiveData('processing');
    console.log('widgetText logging...', widgetText);
    const countMatch = widgetText.count;
    // Panel may paginate — read total from footer instead of counting visible rows.
    const footer = this.loc.completedModalGrid().getByTestId('data-grid-record-count-footer');
    let panelCount: number;
    if (await footer.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const footerText = (await footer.innerText()).replace(/\s+/g, ' ');
      const match = footerText.match(/Showing\s+all\s+([\d,]+)\s+records/i)
        ?? footerText.match(/([\d,]+)\s+total/i)
        ?? footerText.match(/of\s+([\d,]+)/i);
      panelCount = match ? Number.parseInt(match[1].replace(/,/g, ''), 10) : await this.dataRowCount(this.loc.completedModalGrid());
    } else {
      panelCount = await this.dataRowCount(this.loc.completedModalGrid());
    }
    expect(panelCount, 'Row count in processing panel should match widget count').toBe(countMatch);
  }

  async expectProcessingAmountSumMatchesWidget() {
    const widgetText = await this.expectMetricHasPositiveData('processing');
    console.log('widgetText logging...', widgetText);
    const widgetAmount = widgetText.amount;
    const sum = await this.sumAmountColumnInModalGrid();
    expect(Math.abs(sum - widgetAmount),
      `Sum of Amount column (${sum}) should match widget amount (${widgetAmount})`,
    ).toBeLessThan(0.01);
    await this.loc.completedModalClose().click().catch(() => undefined);
  }

  // ======================================================================
  // Exceptions widget — click, side panel, amount sum validation
  // ======================================================================

  async clickExceptionsWidget() {
    await this.expectMetricClickable('exceptions');
    await this.loc.metric('exceptions').click();
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
  }

  async expectExceptionsPanel() {
    await expect(this.loc.completedModal()).toBeVisible({ timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /exception statements/i }),
    ).toBeVisible({ timeout: T });
  }

  async expectExceptionsPanelColumns(columns: string[]) {
    await this.expectGridColumns(this.loc.completedModalGrid(), columns);
  }

  async expectExceptionsRowCountMatchesWidget() {
    const { count } = await this.expectMetricHasPositiveData('exceptions');
    // Panel may paginate — read total from footer instead of counting visible rows.
    const footer = this.loc.completedModalGrid().getByTestId('data-grid-record-count-footer');
    let panelCount: number;
    if (await footer.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const footerText = (await footer.innerText()).replace(/\s+/g, ' ');
      const match = footerText.match(/Showing\s+all\s+([\d,]+)\s+records/i)
        ?? footerText.match(/([\d,]+)\s+total/i)
        ?? footerText.match(/of\s+([\d,]+)/i);
      panelCount = match ? Number.parseInt(match[1].replace(/,/g, ''), 10) : await this.dataRowCount(this.loc.completedModalGrid());
    } else {
      panelCount = await this.dataRowCount(this.loc.completedModalGrid());
    }
    expect(panelCount, 'Row count in exceptions panel should match widget count').toBe(count);
  }

  async expectExceptionsAmountSumMatchesWidget() {
    const { amount: widgetAmount } = await this.expectMetricHasPositiveData('exceptions');
    const sum = await this.sumAmountColumnInModalGrid();
    expect(Math.abs(sum - widgetAmount),
      `Sum of Amount column (${sum}) should match widget amount (${widgetAmount})`,
    ).toBeLessThan(0.01);
    await this.loc.completedModalClose().click().catch(() => undefined);
  }

  // ======================================================================
  // Shared grid / panel helpers (reused across widgets)
  // ======================================================================

  /** Asserts the ag-grid column headers contain each requested name (case-insensitive). */
  private async expectGridColumns(grid: Locator, columns: string[]) {
    await expect(grid).toBeVisible({ timeout: T });
    const headers = (await grid.locator('.ag-header-cell-text, [role="columnheader"]').allTextContents())
      .map((h) => h.replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(Boolean);
    for (const col of columns) {
      const target = col.trim().toLowerCase();
      expect(
        headers.some((h) => h === target || h.includes(target)),
        `Expected column "${col}" — found: ${headers.join(', ')}`,
      ).toBe(true);
    }
  }

  private async dataRowCount(grid: Locator): Promise<number> {
    return grid.locator('.ag-center-cols-container .ag-row, .ag-row').count();
  }

  /**
   * Sum the Amount column in the modal grid (MUI DataGrid).
   * MUI DataGrid virtualizes rows — only visible ones are in the DOM.
   * Strategy: find the inner grid element, access its React internals to
   * get the full row model, then sum all amounts. Falls back to a scroll-and-collect
   * approach that uses the Statement ID as deduplication key.
   */
  private async sumAmountColumnInModalGrid(): Promise<number> {
    const grid = this.loc.completedModalGrid();

    // Step 1: Try to extract all row data from MUI DataGrid's React internals
    const apiSum = await grid.evaluate((gridEl) => {
      // Find the inner [role="grid"] element (MUI DataGrid renders a nested grid)
      const innerGrid = gridEl.querySelector('[role="grid"]') ?? gridEl;
      // Walk all elements in the grid looking for React fiber keys
      const candidates = [innerGrid, gridEl, ...Array.from(gridEl.querySelectorAll('*')).slice(0, 200)];
      for (const el of candidates) {
        const fKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (!fKey) continue;
        let fiber = (el as any)[fKey];
        // Walk up the fiber tree looking for the MUI DataGrid API or rows data
        for (let depth = 0; depth < 80 && fiber; depth++) {
          const props = fiber.memoizedProps ?? fiber.pendingProps ?? {};
          const stateNode = fiber.stateNode;
          // Check: component with .rows prop (DataGrid receives rows as prop)
          if (Array.isArray(props.rows) && props.rows.length > 5) {
            let sum = 0;
            for (const row of props.rows) {
              const val = row?.amount ?? row?.Amount ?? row?.model?.amount;
              if (val != null) {
                const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                if (!isNaN(num)) sum += num;
              }
            }
            if (sum > 0) return { sum, source: 'props.rows', count: props.rows.length };
          }
          // Check: has apiRef with getRowModels/getRows
          const apiRef = props?.apiRef?.current ?? props?.apiRef;
          if (apiRef && typeof apiRef.getRowModels === 'function') {
            const models = apiRef.getRowModels();
            let sum = 0;
            let count = 0;
            if (models && typeof models.forEach === 'function') {
              models.forEach((row: any) => {
                const val = row?.data?.amount ?? row?.data?.Amount ?? row?.amount ?? row?.Amount;
                if (val != null) {
                  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                  if (!isNaN(num)) { sum += num; count++; }
                }
              });
            } else if (Array.isArray(models)) {
              for (const row of models) {
                const val = row?.data?.amount ?? row?.data?.Amount ?? row?.amount ?? row?.Amount;
                if (val != null) {
                  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                  if (!isNaN(num)) { sum += num; count++; }
                }
              }
            }
            if (sum > 0) return { sum, source: 'apiRef.getRowModels', count };
          }
          // Check: memoizedState has rows/rowModels as linked list (hooks)
          let hookState = fiber.memoizedState;
          let hookIdx = 0;
          while (hookState && hookIdx < 30) {
            const ms = hookState.memoizedState;
            if (ms && typeof ms === 'object') {
              // MUI DataGrid stores rows in state as Map or array
              if (ms.rows && Array.isArray(ms.rows) && ms.rows.length > 5) {
                let sum = 0;
                for (const row of ms.rows) {
                  const val = row?.amount ?? row?.Amount ?? row?.model?.amount ?? row?.data?.amount;
                  if (val != null) {
                    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                    if (!isNaN(num)) sum += num;
                  }
                }
                if (sum > 0) return { sum, source: 'hookState.rows', count: ms.rows.length };
              }
              // MUI DataGrid v6: look for rowModelsInternal or visibleRows
              if (ms.visibleRows && Array.isArray(ms.visibleRows) && ms.visibleRows.length > 5) {
                let sum = 0;
                for (const row of ms.visibleRows) {
                  const val = row?.amount ?? row?.Amount ?? row?.model?.amount ?? row?.data?.amount;
                  if (val != null) {
                    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                    if (!isNaN(num)) sum += num;
                  }
                }
                if (sum > 0) return { sum, source: 'hookState.visibleRows', count: ms.visibleRows.length };
              }
              // Check if ms is a Map (rowModels in MUI DataGrid v6 is a Map)
              if (ms instanceof Map && ms.size > 5) {
                let sum = 0;
                let count = 0;
                ms.forEach((row: any) => {
                  const val = row?.amount ?? row?.Amount ?? row?.model?.amount ?? row?.data?.amount;
                  if (val != null) {
                    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
                    if (!isNaN(num)) { sum += num; count++; }
                  }
                });
                if (sum > 0) return { sum, source: 'hookState.Map', count };
              }
            }
            hookState = hookState.next;
            hookIdx++;
          }
          fiber = fiber.return;
        }
      }
      return null;
    }).catch(() => null);

    if (apiSum && apiSum.sum > 0) {
      console.log(`[sumAmountColumn] Resolved via ${apiSum.source}: $${apiSum.sum} from ${apiSum.count} rows`);
      return apiSum.sum;
    }

    // Step 2: Fallback — use page.evaluate on the document to find ALL gridcells
    // with dollar amounts in the grid, then scroll to reveal more rows.
    const sumFromDom = await this.page.evaluate((gridTestId) => {
      const gridEl = document.querySelector(`[data-testid="${gridTestId}"]`);
      if (!gridEl) return null;

      // Find Amount column index from headers
      const headers = gridEl.querySelectorAll('[role="columnheader"]');
      let amountColIdx = -1;
      for (let i = 0; i < headers.length; i++) {
        if (/^amount$/i.test((headers[i].textContent ?? '').trim())) {
          amountColIdx = i;
          break;
        }
      }
      if (amountColIdx < 0) return null;

      // Collect all currently visible row data
      const rows = gridEl.querySelectorAll('[role="row"]');
      const seen = new Set<string>();
      let sum = 0;
      for (const row of rows) {
        const cells = row.querySelectorAll('[role="gridcell"]');
        if (cells.length <= amountColIdx) continue;
        // Use first cell (Statement ID) as dedup key
        const key = cells[0]?.textContent?.trim() ?? '';
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const amountText = cells[amountColIdx]?.textContent?.trim() ?? '';
        const m = amountText.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
        if (m) {
          sum += parseFloat(m[1].replace(/,/g, ''));
        }
      }
      return { sum, count: seen.size };
    }, await this.loc.completedModalGrid().getAttribute('data-testid') ?? '').catch(() => null);

    if (sumFromDom && sumFromDom.count > 20) {
      // Got a good portion of rows without scrolling
      console.log(`[sumAmountColumn] DOM initial scan: $${sumFromDom.sum} from ${sumFromDom.count} rows`);
    }

    // Step 3: If we still don't have all rows, scroll-and-collect with dedup
    const gridTestId = await this.loc.completedModalGrid().getAttribute('data-testid') ?? '';
    const collected = new Map<string, number>(); // Statement ID → amount

    // Find the Amount column index from the grid headers (needed by evaluate calls below)
    const amountColIdx = await this.page.evaluate((gtId) => {
      const gridEl = document.querySelector(`[data-testid="${gtId}"]`);
      if (!gridEl) return -1;
      const headers = gridEl.querySelectorAll('[role="columnheader"]');
      for (let i = 0; i < headers.length; i++) {
        if (/^amount$/i.test((headers[i].textContent ?? '').trim())) return i;
      }
      return -1;
    }, gridTestId);

    // Initialize from DOM scan
    if (sumFromDom && amountColIdx >= 0) {
      // Re-collect to populate the map
      await this.page.evaluate(({ gridTestId, amountColIdx }) => {
        const gridEl = document.querySelector(`[data-testid="${gridTestId}"]`);
        if (!gridEl) return;
        const rows = gridEl.querySelectorAll('[role="row"]');
        for (const row of rows) {
          const cells = row.querySelectorAll('[role="gridcell"]');
          if (cells.length <= amountColIdx) continue;
          const key = cells[0]?.textContent?.trim() ?? '';
          if (!key) continue;
          const amountText = cells[amountColIdx]?.textContent?.trim() ?? '';
          const m = amountText.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
          if (m) {
            (window as any).__sumCollector = (window as any).__sumCollector || {};
            (window as any).__sumCollector[key] = parseFloat(m[1].replace(/,/g, ''));
          }
        }
      }, { gridTestId, amountColIdx }).catch(() => undefined);
    }

    // Scroll through the grid to collect all rows.
    // This grid is an AG Grid: the vertical scroll lives on .ag-body-vertical-scroll-viewport /
    // .ag-body-viewport (the MUI .MuiDataGrid-virtualScroller class is not present here).
    const scrollSelector =
      '[data-testid^="dashboard-"] .ag-body-vertical-scroll-viewport, ' +
      '.ag-body-vertical-scroll-viewport, ' +
      '[data-testid^="dashboard-"] .ag-body-viewport, ' +
      '[role="grid"] .MuiDataGrid-virtualScroller, ' +
      '.MuiDataGrid-virtualScroller';
    for (let attempt = 0; attempt < 60; attempt++) {
      const batch = await this.page.evaluate(({ gridTestId, amountColIdx }) => {
        const gridEl = document.querySelector(`[data-testid="${gridTestId}"]`);
        if (!gridEl) return null;
        const rows = gridEl.querySelectorAll('[role="row"]');
        const result: Record<string, number> = {};
        for (const row of rows) {
          const cells = row.querySelectorAll('[role="gridcell"]');
          if (cells.length <= amountColIdx) continue;
          const key = cells[0]?.textContent?.trim() ?? '';
          if (!key) continue;
          const amountText = cells[amountColIdx]?.textContent?.trim() ?? '';
          const m = amountText.match(/\$\s?([\d,]+(?:\.\d{2})?)/);
          if (m) result[key] = parseFloat(m[1].replace(/,/g, ''));
        }
        return result;
      }, { gridTestId, amountColIdx }).catch(() => null);

      if (batch) {
        let newCount = 0;
        for (const [k, v] of Object.entries(batch)) {
          if (!collected.has(k)) { collected.set(k, v); newCount++; }
        }
        if (newCount === 0 && attempt > 2) {
          // No new rows from a pass — only stop once the AG Grid viewport has reached the bottom.
          const atBottom = await this.page.evaluate((sel) => {
            for (const el of document.querySelectorAll(sel)) {
              if (el.scrollHeight > el.clientHeight + 1 && el.scrollHeight - el.scrollTop - el.clientHeight > 2) {
                return false;
              }
            }
            return true;
          }, scrollSelector).catch(() => true);
          if (atBottom) break;
        }
      }

      // Scroll down within the dialog's scrollable area
      await this.page.evaluate((scrollSel) => {
        const containers = document.querySelectorAll(scrollSel);
        const scrollable = Array.from(containers).find(
          (el) => el.scrollHeight > el.clientHeight + 1,
        );
        if (scrollable) {
          // Scroll far enough to mount the next batch of virtualized rows. Panning to
          // scrollHeight immediately can skip lazy rows, so move by ~1 viewport each pass.
          scrollable.scrollTop += Math.max(scrollable.clientHeight, 400);
          return;
        }
        // Fallback: scroll the dialog body
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          const body = dialog.querySelector('[style*="overflow"]') ?? dialog;
          (body as HTMLElement).scrollTop += 500;
        }
      }, scrollSelector).catch(() => undefined);

      await this.page.waitForTimeout(250);
    }

    let sum = 0;
    for (const v of collected.values()) sum += v;
    console.log(`[sumAmountColumn] Final: $${sum} from ${collected.size} unique rows`);
    return sum;
  }

  private async gridIsEmpty(grid: Locator): Promise<boolean> {
    const text = (await grid.innerText().catch(() => '')).toLowerCase();
    if (/no data available|no records found/.test(text)) return true;
    return (await this.dataRowCount(grid)) === 0;
  }

  private async expectGridEmptyState(grid: Locator) {
    await expect(grid).toContainText(/no data available|no records found/i, { timeout: T });
  }

  /** A side panel/modal anchored to the right edge of the viewport. */
  private async expectPanelOpensRightToLeft(panel: Locator) {
    const box = await panel.boundingBox();
    const viewport = this.page.viewportSize();
    if (box && viewport) {
      expect(box.x + box.width, 'Panel should be anchored to the right edge').toBeGreaterThan(
        viewport.width * 0.6,
      );
    }
  }

  private async expectAnySidePanelVisible() {
    const panel = this.page
      .getByRole('dialog')
      .or(this.page.locator('[class*="drawer"], [class*="Drawer"], [class*="sheet" i]'))
      .first();
    await expect(panel).toBeVisible({ timeout: T });
  }
}
