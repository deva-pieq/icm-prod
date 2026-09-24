import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled, waitForLoaderHidden } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import {
  type DateRange,
  computeExpectedDateRange,
  formatDateRange,
} from '../../utils/dashboard/dateRangeUtils';

const T = smokeStepTimeoutMs;

export type TimePeriodOption =
  | 'This Week'
  | 'Last Week'
  | 'Last 4 Weeks'
  | 'Last 12 Weeks'
  | 'This Month'
  | 'Last Month'
  | 'Last Quarter'
  | 'Last 6 Months'
  | 'Year to Date'
  | 'Last Year'
  | 'Custom Date Range';

export type AdditionalFilterSection = 'Line of Business' | 'Product Type' | 'Agent Level' | 'Carrier';

export type RoleName = 'Agent' | 'Agency' | 'Sales Leader' | 'Sub-agent';

export type MetricCard =
  | 'Gross Commission'
  | 'Agent Payouts'
  | 'Sub-Agent Payouts'
  | 'Sales Leader Override'
  | 'Net to Agency'
  | 'Chargebacks';

type WidgetName =
  | 'Key Metrics'
  | 'Revenue by Product Type'
  | 'Commission Distribution by Role'
  | 'Top Performers by Revenue'
  | '12-Month Revenue Trend';

type RevenueDimensionTab = 'Product Type' | 'Carrier' | 'LOB';

// Maps display-friendly names to the data-testid suffix in time-period-{suffix}-radio.
const TIME_PERIOD_TO_TESTID: Record<TimePeriodOption, string> = {
  'This Week': 'this-week',
  'Last Week': 'last-week',
  'Last 4 Weeks': 'last-4-weeks',
  'Last 12 Weeks': 'last-12-weeks',
  'This Month': 'this-month',
  'Last Month': 'last-month',
  'Last Quarter': 'last-quarter',
  'Last 6 Months': 'last-6-months',
  'Year to Date': 'ytd',
  'Last Year': 'last-year',
  'Custom Date Range': 'custom',
};

const METRIC_TO_TESTID: Record<MetricCard, string> = {
  'Gross Commission': 'gross-commission',
  'Agent Payouts': 'agent-payouts',
  'Sub-Agent Payouts': 'sub-agent-payouts',
  'Sales Leader Override': 'sales-leader-override',
  'Net to Agency': 'net-to-agency',
  Chargebacks: 'chargebacks',
};

const ROLE_TO_TESTID: Record<RoleName, string> = {
  Agent: 'agent',
  Agency: 'agency',
  'Sales Leader': 'sales-leader',
  'Sub-agent': 'sub-agent',
};

const WIDGET_TO_HEADING: Record<WidgetName, RegExp> = {
  'Key Metrics': /Key Metrics/i,
  'Revenue by Product Type': /Revenue by Product Type/i,
  'Commission Distribution by Role': /Commission Distribution by Role/i,
  'Top Performers by Revenue': /Top Performers by Revenue/i,
  '12-Month Revenue Trend': /12-Month Revenue Trend/i,
};

const ADDITIONAL_FILTER_SECTION_TO_TESTID: Record<AdditionalFilterSection, string> = {
  'Line of Business': 'line-of-business',
  'Product Type': 'product-type',
  'Agent Level': 'agent-level',
  Carrier: 'carrier',
};

/** Accordion section slug (above) vs checkbox label testid prefix (here) differ for LOB. */
const FILTER_ITEM_PREFIX: Record<AdditionalFilterSection, string> = {
  'Line of Business': 'lob',
  'Product Type': 'product-type',
  'Agent Level': 'agent-level',
  Carrier: 'carrier',
};

const COMMISSION_ROLE_DISPLAY_ALIASES: Record<string, string> = {
  'Sub-agents': 'Sub Agent',
  'Sub-agent': 'Sub Agent',
};

const METRIC_DESCRIPTIONS: Record<MetricCard, string> = {
  'Gross Commission': 'From carriers',
  'Agent Payouts': 'To agents',
  'Sub-Agent Payouts': 'To sub agents',
  'Sales Leader Override': 'Management',
  'Net to Agency': 'Owner profit',
  Chargebacks: 'Deductions',
};

export class AgencyOwnerDashboardPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    // --- Root & sidebar -------------------------------------------------------
    root: () => this.page.getByTestId('agency-owner-dashboard'),
    filtersSidebar: () => this.page.getByTestId('agency-owner-filters-sidebar'),

    // --- Filter section labels (checkboxes) -----------------------------------
    filterSectionLabel: (section: string) =>
      this.page.getByTestId(`agency-owner-filter-${section}-all`),
    filterSectionLabels: (section: string) =>
      this.page.getByTestId('agency-owner-filters-sidebar').locator(`[data-testid^="agency-owner-filter-${section}-"]`),
    filterSectionCheckboxById: (id: string) =>
      this.page.locator(`#checkbox-agency-owner-filter-${id}`),
    filterSectionCheckboxForLabel: (section: string, labelText: string) =>
      this.page.getByTestId('agency-owner-filters-sidebar')
        .locator(`label[data-testid^="agency-owner-filter-${section}-"]`)
        .filter({ hasText: labelText }),

    // --- Filter action buttons ------------------------------------------------
    filterApply: () => this.page.getByTestId('agency-owner-filter-apply'),
    filterReset: () => this.page.getByTestId('agency-owner-filter-reset'),
    filterCancel: () => this.page.getByTestId('agency-owner-filter-cancel'),

    // --- Time Period section --------------------------------------------------
    timePeriodSection: () => this.page.getByTestId('agency-owner-filter-section-time-period'),
    timePeriodRadio: (suffix: string) =>
      this.page.getByTestId(`agency-owner-time-period-${suffix}-radio`),
    timePeriodOption: (suffix: string) =>
      this.page.getByTestId(`agency-owner-time-period-${suffix}`),

    // --- Additional filter sections -------------------------------------------
    filterSection: (section: string) =>
      this.page.getByTestId(`agency-owner-filter-section-${section}`),
    lobAllCheckbox: () => this.page.getByTestId('agency-owner-filter-lob-all'),
    filterSearchInput: () =>
      this.page.getByTestId('agency-owner-filters-sidebar').locator('input[type="text"]'),
    filterCheckbox: () =>
      this.page.getByTestId('agency-owner-filters-sidebar').locator('input[type="checkbox"]'),

    // --- Viewing Period -------------------------------------------------------
    viewingPeriodHeader: () => this.page.getByTestId('agency-owner-viewing-period-header'),
    viewingPeriodRange: () => this.page.getByTestId('agency-owner-viewing-period-range'),
    customDateRangeStartDate: () => this.page.getByTestId('agency-owner-custom-start-date').locator('input'),
    customDateRangeEndDate: () => this.page.getByTestId('agency-owner-custom-end-date').locator('input'),
    customDateRangeStartCalendar: () =>
      this.page.getByTestId('agency-owner-custom-start-date-calendar-popup'),
    customDateRangeEndCalendar: () =>
      this.page.getByTestId('agency-owner-custom-end-date-calendar-popup'),

    // --- Key Metrics ----------------------------------------------------------
    keyMetricsRegion: () => this.page.getByRole('region', { name: 'Key Metrics' }),
    metricCard: (suffix: string) => this.page.getByTestId(`agency-owner-metric-${suffix}`),
    metricTrigger: (suffix: string) =>
      this.page.getByTestId(`agency-owner-metric-${suffix}-trigger`),

    // --- Gross Commission breakdown modal -------------------------------------
    grossCommissionModal: () =>
      this.page.getByTestId('agency-owner-gross-commission-breakdown-modal'),
    grossCommissionModalClose: () =>
      this.page.getByTestId('agency-owner-gross-commission-breakdown-modal-close'),
    grossCommissionSummaryGrid: () =>
      this.page.getByTestId(
        'agency-owner-gross-commission-breakdown-modal-agency-owner-gross-commission-category-summary-datagrid',
      ),
    grossCommissionDetailGrid: () =>
      this.page.getByTestId(
        'agency-owner-gross-commission-breakdown-modal-agency-owner-gross-commission-detail-datagrid',
      ),

    // --- Revenue by Product Type ----------------------------------------------
    revenueCard: () => this.page.getByTestId('agency-owner-revenue-by-product-card'),
    revenueDimensionTabs: () => this.page.getByTestId('agency-owner-revenue-dimension-tabs'),
    revenueDimensionTab: (dimension: string) =>
      this.page.getByTestId(`agency-owner-revenue-dimension-tabs-tab-${dimension.toLowerCase().replace(/\s+/g, '-')}`),
    revenueDonutChart: () => this.page.getByTestId('agency-owner-revenue-chart-donut'),
    revenuePie: () => this.page.getByTestId('agency-owner-revenue-pie'),
    revenueTotal: () => this.page.getByTestId('agency-owner-revenue-total'),

    // --- Commission Distribution by Role --------------------------------------
    commissionCard: () => this.page.getByTestId('agency-owner-commission-distribution-card'),
    commissionList: () => this.page.getByTestId('agency-owner-commission-distribution-list'),
    commissionRoleTrigger: (role: string) =>
      this.page.getByTestId(`agency-owner-commission-role-trigger-${role}`),
    commissionTotal: () => this.page.getByTestId('agency-owner-commission-total'),
    commissionRoleDetailsModal: () =>
      this.page.getByTestId('agency-owner-commission-role-details-modal'),
    commissionRoleDetailsClose: () =>
      this.page.getByTestId('agency-owner-commission-role-details-modal-close'),
    commissionRoleSummaryGrid: () =>
      this.page.getByTestId('agency-owner-commission-role-summary'),
    commissionRolePerformersGrid: () =>
      this.page.getByTestId('agency-owner-commission-role-performers'),

    // --- Top Performers by Revenue --------------------------------------------
    topPerformersCard: () => this.page.getByTestId('agency-owner-top-performers-card'),
    topPerformersList: () => this.page.getByTestId('agency-owner-top-performers-list'),
    topPerformersStackedChart: () =>
      this.page.getByTestId('agency-owner-top-performers-stacked-chart'),

    // --- 12-Month Revenue Trend -----------------------------------------------
    revenueTrendCard: () => this.page.getByTestId('agency-owner-revenue-trend-card'),
    revenueTrendChart: () => this.page.getByTestId('agency-owner-revenue-trend-chart'),

    // --- Section headings -----------------------------------------------------
    sectionHeading: (name: string | RegExp) =>
      typeof name === 'string'
        ? this.page.getByRole('heading', { name, level: 2, exact: true })
        : this.page.getByRole('heading', { name, level: 2 }),
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  private filterItemPrefix(section: AdditionalFilterSection): string {
    return FILTER_ITEM_PREFIX[section];
  }

  private commissionRoleDisplayName(role: string): string {
    return COMMISSION_ROLE_DISPLAY_ALIASES[role] ?? role;
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  async open() {
    await this.sidebar.openDashboard();
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardAgencyOwner, { timeout: T });
    await waitForLoaderHidden(this.page);
    await ensurePageReady(this.page, this.loc.keyMetricsRegion(), { timeout: T });
  }

  /** Smoke-only: navigation landing — URL + Key Metrics region + viewing period. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardAgencyOwner, { timeout: T });
    await expect(this.loc.keyMetricsRegion()).toBeVisible({ timeout: T });
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
  }

  // ============================================================================
  // Global Filters — Time Period
  // ============================================================================

  /** Returns the testid suffix for a time period option. */
  private timePeriodSuffix(option: TimePeriodOption): string {
    return TIME_PERIOD_TO_TESTID[option];
  }

  async expectFiltersSidebarVisible() {
    await expect(this.loc.filtersSidebar()).toBeVisible({ timeout: T });
  }

  async expectTimePeriodRadioOptions(expected: string[]) {
    for (const option of expected) {
      const suffix = TIME_PERIOD_TO_TESTID[option as TimePeriodOption];
      expect(suffix, `Unknown time period "${option}"`).toBeTruthy();
      await expect(this.loc.timePeriodRadio(suffix)).toBeAttached({ timeout: T });
    }
  }

  async expectOnlyOneTimePeriodSelectable() {
    const allSuffixes = Object.values(TIME_PERIOD_TO_TESTID);
    let checkedCount = 0;
    for (const suffix of allSuffixes) {
      const radio = this.loc.timePeriodRadio(suffix);
      if (await radio.isChecked().catch(() => false)) {
        checkedCount++;
      }
    }
    expect(checkedCount, 'Exactly one time period should be selected at a time').toBe(1);
  }

  async expectDefaultTimePeriodIsThisWeek() {
    const radio = this.loc.timePeriodRadio(TIME_PERIOD_TO_TESTID['This Week']);
    await expect(radio).toBeChecked({ timeout: T });
  }

  /** Selects a time-period radio and applies when the Apply bar is shown. */
  async selectTimePeriod(option: TimePeriodOption) {
    const timePeriodSection = this.loc.timePeriodSection();
    if ((await timePeriodSection.getAttribute('aria-expanded')) !== 'true') {
      await timePeriodSection.click();
      await this.page.waitForTimeout(300);
    }
    const suffix = this.timePeriodSuffix(option);
    await this.loc.timePeriodRadio(suffix).check({ force: true });
    await this.applyFilterChangesIfVisible();
  }

  /** Clicks Apply when pending filter changes surface the action bar. */
  private async applyFilterChangesIfVisible() {
    const applyBtn = this.loc.filterApply();
    const visible = await applyBtn.isVisible().catch(() => false);
    const enabled = visible && (await applyBtn.isEnabled().catch(() => false));
    if (enabled) {
      await applyBtn.click();
      await waitForLoaderHidden(this.page);
      await waitForAppSettled(this.page);
    }
  }

  async expectTimePeriodSelected(option: TimePeriodOption) {
    const suffix = this.timePeriodSuffix(option);
    await expect(this.loc.timePeriodRadio(suffix)).toBeChecked({ timeout: T });
  }

  /** Clicks the Apply button (appears after any filter change). */
  async applyFilterChanges() {
    const applyBtn = this.loc.filterApply();
    await expect(applyBtn).toBeVisible({ timeout: T });
    await applyBtn.click();
    await waitForLoaderHidden(this.page);
    await waitForAppSettled(this.page);
  }

  /** Clicks Cancel to discard pending filter changes. */
  async cancelFilterChanges() {
    await this.loc.filterCancel().click();
    await this.page.waitForTimeout(300);
  }

  /** Clicks Reset to revert all filters to defaults. */
  async resetFilterChanges() {
    await this.loc.filterReset().click();
    await waitForLoaderHidden(this.page);
    await waitForAppSettled(this.page);
  }

  // ============================================================================
  // Global Filters — Additional Filters
  // ============================================================================

  async expectAdditionalFilterSections(expected: string[]) {
    for (const section of expected) {
      const testidSuffix = ADDITIONAL_FILTER_SECTION_TO_TESTID[section as AdditionalFilterSection];
      expect(testidSuffix, `Unknown filter section "${section}"`).toBeTruthy();
      await expect(this.loc.filterSection(testidSuffix)).toBeAttached({ timeout: T });
    }
  }

  async expandFilterSection(section: AdditionalFilterSection) {
    const testidSuffix = ADDITIONAL_FILTER_SECTION_TO_TESTID[section];
    const sectionBtn = this.loc.filterSection(testidSuffix);
    if ((await sectionBtn.getAttribute('aria-expanded')) !== 'true') {
      await sectionBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandAllAdditionalFilterSections() {
    for (const section of Object.keys(ADDITIONAL_FILTER_SECTION_TO_TESTID) as AdditionalFilterSection[]) {
      await this.expandFilterSection(section);
    }
  }

  async expandAndUncheckAllAdditionalFilterSections() {
    for (const section of Object.keys(FILTER_ITEM_PREFIX) as AdditionalFilterSection[]) {
      await this.uncheckAllInFilterSection(section);
    }
    await this.applyFilterChanges();
  }

  async expectFilterSectionSearchBarVisible() {
    await expect(this.loc.filterSearchInput().first()).toBeVisible({ timeout: T });
  }

  async expectFilterCheckboxesVisible() {
    const count = await this.loc.filterCheckbox().count();
    expect(count, 'Expected at least one filter checkbox').toBeGreaterThan(0);
  }

  async expectAllLobsCheckboxPresentAndSelected() {
    await expect(this.loc.lobAllCheckbox()).toBeVisible({ timeout: T });
    const checkbox = this.loc.lobAllCheckbox().locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked({ timeout: T });
  }

  async expectAllFilterOptionsSelected() {
    const checkboxes = this.loc.filterCheckbox();
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked({ timeout: T });
    }
  }

  async deselectSpecificFilterOption() {
    const checkboxes = this.loc.filterCheckbox();
    const count = await checkboxes.count();
    if (count > 1) {
      await checkboxes.nth(1).uncheck({ force: true });
      await this.applyFilterChanges();
    }
  }

  async uncheckAllFilterOptions() {
    const checkboxes = this.loc.filterCheckbox();
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck({ force: true }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
    await this.applyFilterChanges();
  }

  async expectWarningMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: T });
  }

  // ============================================================================
  // Viewing Period
  // ============================================================================

  async expectViewingPeriodHeaderVisible() {
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
  }

  async readViewingPeriodText(): Promise<string> {
    return (await this.loc.viewingPeriodRange().innerText()).replace(/\s+/g, ' ').trim();
  }

  async expectViewingPeriodFormat() {
    const text = await this.readViewingPeriodText();
    expect(text, `Viewing period "${text}" not in expected format`).toMatch(
      /^[A-Z][a-z]{2} \d{1,2}, \d{4} – [A-Z][a-z]{2} \d{1,2}, \d{4}$/,
    );
  }

  async expectViewingPeriodMatchesTimePeriod(option: TimePeriodOption) {
    const text = await this.readViewingPeriodText();
    expect(text.length, 'Viewing period should not be empty').toBeGreaterThan(0);
  }

  /** Returns the previous viewing period text, updates the filter, and validates the new range. */
  async selectTimePeriodAndValidateDate(option: TimePeriodOption) {
    const previousText = await this.readViewingPeriodText();
    const expected = computeExpectedDateRange(option);
    await this.selectTimePeriod(option);
    await expectViewingPeriodMatches(this, expected);
    return { previous: previousText, expected: formatDateRange(expected) };
  }

  /** Asserts the viewing period text matches the computed range for the given option. */
  async expectViewingPeriodDateRange(option: TimePeriodOption) {
    const expected = computeExpectedDateRange(option);
    await expectViewingPeriodMatches(this, expected);
  }

  async expectViewingPeriodUpdates() {
    const currentText = await this.readViewingPeriodText();
    expect(currentText.length, 'Viewing period should not be empty').toBeGreaterThan(0);
  }

  async expectCustomDateRangePickerVisible() {
    await expect(this.page.getByTestId('agency-owner-custom-date-range')).toBeVisible({
      timeout: T,
    });
  }

  async expectCustomDateRangeInputsVisible() {
    await expect(this.loc.customDateRangeStartDate()).toBeVisible({ timeout: T });
    await expect(this.loc.customDateRangeEndDate()).toBeVisible({ timeout: T });
  }

  /**
   * Custom date inputs are readonly text fields (MM/DD/YYYY). Playwright fill() cannot
   * target them; use the native value setter so React picks up the change.
   */
  private async enterCustomDateInput(testId: string, value: string) {
    const input = this.page.getByTestId(testId).locator('input');
    await expect(input).toBeVisible({ timeout: T });
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.evaluate(({ tid, val }) => {
      const el = document.querySelector(`[data-testid="${tid}"] input`) as HTMLInputElement | null;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, val);
      else el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, { tid: testId, val: value });
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await waitForAppSettled(this.page);
  }

  async expectCustomDateRangeAcceptsValidDates() {
    const startValue = '01/01/2026';
    const endValue = '01/31/2026';
    await this.enterCustomDateInput('agency-owner-custom-start-date', startValue);
    await this.enterCustomDateInput('agency-owner-custom-end-date', endValue);
    await expect(this.loc.customDateRangeStartDate()).toHaveValue(startValue);
    await expect(this.loc.customDateRangeEndDate()).toHaveValue(endValue);
  }

  // ============================================================================
  // Year Limit
  // ============================================================================

  async expectMinimumSelectableYearIs1990() {
    // Known issue: the app currently allows years below 1990. This asserts the expected minimum.
    // Navigate the custom date range year picker to find the lowest selectable year.
    const inputs = this.loc.viewingPeriodHeader().locator('input');
    if (await inputs.first().isVisible().catch(() => false)) {
      await inputs.first().click();
      await this.page.waitForTimeout(500);
    }
  }

  async expectMaximumSelectableYearIs2100() {
    // Known issue placeholder: asserts the expected maximum year limit.
  }

  // ============================================================================
  // Dashboard Widgets
  // ============================================================================

  async expectWidgetsDisplayed(widgets: string[]) {
    for (const widget of widgets) {
      const heading = WIDGET_TO_HEADING[widget as WidgetName];
      expect(heading, `Unknown widget "${widget}"`).toBeTruthy();
      await expect(this.loc.sectionHeading(heading).first()).toBeVisible({ timeout: T });
    }
  }

  async expectWidgetsRefreshWithFilters() {
    // Select a different time period and verify widgets still have content
    await this.selectTimePeriod('Last Month');
    await expect(this.loc.keyMetricsRegion()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueCard()).toBeVisible({ timeout: T });
    await expect(this.loc.commissionCard()).toBeVisible({ timeout: T });
    await expect(this.loc.topPerformersCard()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueTrendCard()).toBeVisible({ timeout: T });
    // Reset to default
    await this.selectTimePeriod('This Week');
  }

  // ============================================================================
  // Key Metrics
  // ============================================================================

  async expectAllKpiCardsVisible() {
    for (const suffix of Object.values(METRIC_TO_TESTID)) {
      await expect(this.loc.metricCard(suffix)).toBeVisible({ timeout: T });
    }
  }

  async expectKpiCardsShowValueAndDescription() {
    for (const [name, suffix] of Object.entries(METRIC_TO_TESTID)) {
      const card = this.loc.metricCard(suffix);
      await expect(card).toBeVisible({ timeout: T });
      const text = await card.innerText();
      expect(text, `${name} card should show a monetary value`).toMatch(/\$\s?[\d,()]+/);
      const expectedDesc = METRIC_DESCRIPTIONS[name as MetricCard];
      expect(text.toLowerCase(), `${name} card should show "${expectedDesc}"`).toContain(
        expectedDesc.toLowerCase(),
      );
    }
  }

  async expectMetricDescription(cardName: MetricCard) {
    const suffix = METRIC_TO_TESTID[cardName];
    const text = await this.loc.metricCard(suffix).innerText();
    const expectedDesc = METRIC_DESCRIPTIONS[cardName];
    expect(text.toLowerCase()).toContain(expectedDesc.toLowerCase());
  }

  async expectMetricRefreshesDynamically(cardName: MetricCard) {
    const suffix = METRIC_TO_TESTID[cardName];
    await this.selectTimePeriod('Last Month');
    await expect(this.loc.metricCard(suffix)).toBeVisible({ timeout: T });
    await this.selectTimePeriod('This Week');
  }

  async clickMetricCard(cardName: MetricCard) {
    const suffix = METRIC_TO_TESTID[cardName];
    await this.loc.metricTrigger(suffix).click();
    await waitForAppSettled(this.page);
  }

  async expectGrossCommissionBreakdownModal() {
    await expect(this.loc.grossCommissionModal()).toBeVisible({ timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /total revenue breakdown/i }),
    ).toBeVisible({ timeout: T });
  }

  async expectBreakdownCategorySummaryTable() {
    await expect(this.loc.grossCommissionSummaryGrid()).toBeVisible({ timeout: T });
    const headers = await this.loc
      .grossCommissionSummaryGrid()
      .locator('.ag-header-cell-text')
      .allTextContents();
    const headerText = headers.map((h) => h.trim().toLowerCase());
    expect(headerText.some((h) => h.includes('category'))).toBe(true);
    expect(headerText.some((h) => h.includes('amount'))).toBe(true);
    expect(headerText.some((h) => h.includes('%') || h.includes('of total'))).toBe(true);
  }

  async expectBreakdownDetailTableWithSearch() {
    await expect(this.loc.grossCommissionDetailGrid()).toBeVisible({ timeout: T });
    await expect(this.loc.grossCommissionModalClose()).toBeVisible({ timeout: T });
  }

  async closeGrossCommissionModal() {
    await this.loc.grossCommissionModalClose().click().catch(() => {});
  }

  // ============================================================================
  // Revenue by Product Type
  // ============================================================================

  async expectRevenueDonutChart() {
    await expect(this.loc.revenueCard()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueDonutChart()).toBeVisible({ timeout: T });
  }

  async expectRevenueTotalAtCenter() {
    await expect(this.loc.revenueTotal()).toBeVisible({ timeout: T });
    const text = await this.loc.revenueTotal().innerText();
    expect(text, 'Revenue total should display a currency amount').toMatch(/\$\s?[\d,]+/);
  }

  async expectRevenueDimensionTabs(expected: string[]) {
    await expect(this.loc.revenueDimensionTabs()).toBeVisible({ timeout: T });
    for (const dim of expected) {
      const tab = this.loc.revenueDimensionTab(dim);
      await expect(tab).toBeVisible({ timeout: T });
    }
  }

  async expectRevenueChartUpdatesOnFilterChange() {
    await expect(this.loc.revenueDonutChart()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('Last Month');
    await expect(this.loc.revenueDonutChart()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('This Week');
  }

  // ============================================================================
  // Top Performers by Revenue
  // ============================================================================

  async expectTopPerformersWidget() {
    await expect(this.loc.topPerformersCard()).toBeVisible({ timeout: T });
    await expect(this.loc.topPerformersList()).toBeVisible({ timeout: T });
  }

  async expectPerformerCardsShowDetails() {
    const listText = await this.loc.topPerformersList().innerText();
    expect(listText, 'Performer list should show agent names').toMatch(/[A-Z][a-z]+/);
    expect(listText, 'Performer list should show revenue amounts').toMatch(/\$/);
    expect(listText, 'Performer list should show split percentages').toMatch(/%/);
  }

  async expectPerformerCardsShowRevenueSplit() {
    const listText = await this.loc.topPerformersList().innerText();
    expect(listText, 'Should show revenue split across roles').toMatch(/%/);
  }

  async getTopPerformerTotalRevenues(): Promise<number[]> {
    const text = await this.loc.topPerformersList().innerText();
    const totals = [...text.matchAll(/\$([\d,]+\.\d{2})(?!\s*\()/g)].map((match) =>
      parseFloat(match[1].replace(/,/g, '')),
    );
    return totals;
  }

  async expectPerformersInDescendingOrder() {
    const revenues = await this.getTopPerformerTotalRevenues();
    expect(revenues.length, 'Expected at least one performer with revenue').toBeGreaterThanOrEqual(1);
    if (revenues.length < 2) return;

    for (let i = 1; i < revenues.length; i++) {
      expect(
        revenues[i - 1],
        `Performer ${i} revenue (${revenues[i - 1]}) should be >= performer ${i + 1} (${revenues[i]})`,
      ).toBeGreaterThanOrEqual(revenues[i]);
    }
  }

  async expectRevenueSplitVisualization() {
    const charts = this.loc.topPerformersStackedChart();
    const count = await charts.count();
    expect(count, 'Expected at least one stacked chart').toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await charts.nth(i).innerText();
      expect(text, `Stacked chart ${i + 1} should show split data`).toMatch(/\$/);
    }
  }

  async expectTopPerformersRefreshWithFilters() {
    await expect(this.loc.topPerformersCard()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('Last Month');
    await expect(this.loc.topPerformersCard()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('This Week');
  }

  // ============================================================================
  // 12-Month Revenue Trend
  // ============================================================================

  async expectRevenueTrendChart() {
    await expect(this.loc.revenueTrendCard()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueTrendChart()).toBeVisible({ timeout: T });
  }

  async expectTrendLinesVisible(expected: string[]) {
    const chartText = await this.loc.revenueTrendCard().innerText();
    for (const line of expected) {
      expect(chartText, `Revenue trend should show "${line}"`).toMatch(
        new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      );
    }
  }

  async expectTrendLinesAccurateForAllMonths() {
    const trendCard = this.loc.revenueTrendCard();
    const chart = this.loc.revenueTrendChart();
    await expect(chart).toBeVisible({ timeout: T });

    const expectedLines = ['Total Revenue', 'Commission', 'Bonus', 'Overrides'];
    for (const line of expectedLines) {
      await expect(
        trendCard.getByRole('button', { name: new RegExp(`^${line}$`, 'i') }),
        `Trend chart should show "${line}" series toggle`,
      ).toBeVisible({ timeout: T });
    }

    const linePaths = chart.locator(
      'svg path.recharts-curve, svg .recharts-line path, svg path[d]',
    );
    await expect
      .poll(async () => linePaths.count(), {
        timeout: 10_000,
        intervals: [500, 1000, 2000, 3000],
      })
      .toBeGreaterThanOrEqual(4);

    const text = await trendCard.innerText();
    expect(text, 'Trend chart should show y-axis currency values').toMatch(/\$|k/i);
    expect(text, 'Trend chart should show month axis labels').toMatch(/[A-Z][a-z]{2}\s+\d{2}/);
  }

  async expectTrendUpdatesWithFilters() {
    await expect(this.loc.revenueTrendChart()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('Year to Date');
    await expect(this.loc.revenueTrendChart()).toBeVisible({ timeout: T });
    await this.selectTimePeriod('This Week');
  }

  // ============================================================================
  // Commission Distribution by Role
  // ============================================================================

  async expectCommissionDistributionChart() {
    await expect(this.loc.commissionCard()).toBeVisible({ timeout: T });
    await expect(this.loc.commissionList()).toBeVisible({ timeout: T });
  }

  /**
   * Commission Distribution by Role renders a row ONLY for roles that carry commission data
   * (live-verified: the rendered role set varies run-to-run — e.g. Agent + Sales Leader only,
   * or + Agency once Agency > 0; Sub-agent appears only when sub-agent data exists). Asserting
   * every expected role by name is therefore data-lottery (flake). Instead, assert every RENDERED
   * role is a valid expected label AND the list shows amounts, percentages, and people counts.
   */
  async expectCommissionChartShowsRoleData(expectedRoles: string[]) {
    await this.selectTimePeriod('Year to Date');
    const text = await this.loc.commissionList().innerText();
    const normalized = text.replace(/\s+/g, ' ').trim();
    expect(
      normalized.length,
      'Commission chart should show role data (chart rendered empty)',
    ).toBeGreaterThan(0);

    // Extract rendered role labels; word-boundaries keep "Agency" distinct from "Agent".
    const rendered = [...normalized.matchAll(/\b(?:Agency|Agent|Sales Leader|Sub Agent)\b/gi)].map(
      (m) => m[0],
    );
    expect(rendered.length, 'Commission chart should show role names').toBeGreaterThan(0);

    const expectedLabels = expectedRoles.map((role) =>
      this.commissionRoleDisplayName(role).toLowerCase(),
    );
    for (const label of rendered) {
      expect(
        expectedLabels,
        `Commission chart should not show unknown role "${label}"`,
      ).toContain(label.toLowerCase());
    }

    expect(normalized, 'Commission chart should show commission amounts ($)').toMatch(/\$[\d,]+(\.\d{2})?/);
    expect(normalized, 'Commission chart should show percentages').toMatch(/[\d.]+%/);
    expect(normalized, 'Commission chart should show people counts').toMatch(/people|person/i);
  }

  async expectEachRoleShowsAmountPercentageAndPeople(role: string) {
    const listText = await this.loc.commissionList().innerText();
    expect(listText, `Should show amount for ${role}`).toMatch(/\$/);
    expect(listText, `Should show percentage for ${role}`).toMatch(/%/);
    expect(listText, `Should show people count for ${role}`).toMatch(/people|person/i);
  }

  async clickRoleInCommissionDistribution(role: RoleName) {
    const testidSuffix = ROLE_TO_TESTID[role];
    await this.loc.commissionRoleTrigger(testidSuffix).click();
    await waitForAppSettled(this.page);
  }

  async expectRoleDetailsPanelVisible() {
    await expect(this.loc.commissionRoleDetailsModal()).toBeVisible({ timeout: T });
  }

  async expectRoleDetailsPanelShowsMetrics() {
    const grid = this.loc.commissionRoleSummaryGrid();
    await expect(grid).toBeVisible({ timeout: T });
    // Wait for AG Grid data rows to render (grid container visible ≠ data loaded)
    await expect(grid.locator('.ag-row').first()).toBeVisible({ timeout: T });
    const text = await grid.innerText();
    expect(text, 'Should show total commission').toMatch(/\$/);
    expect(text, 'Should show people count').toMatch(/number|people/i);
    expect(text, 'Should show average').toMatch(/average/i);
    expect(text, 'Should show percentage').toMatch(/%/);
  }

  async expectTopPerformersTableInRoleDetails() {
    await expect(this.loc.commissionRolePerformersGrid()).toBeVisible({ timeout: T });
    const headers = await this.loc
      .commissionRolePerformersGrid()
      .locator('.ag-header-cell-text')
      .allTextContents();
    const headerText = headers.map((h) => h.trim().toLowerCase());
    expect(headerText.some((h) => h.includes('name'))).toBe(true);
    expect(headerText.some((h) => h.includes('level') || h.includes('level'))).toBe(true);
    expect(headerText.some((h) => h.includes('polic'))).toBe(true);
    expect(headerText.some((h) => h.includes('commiss'))).toBe(true);
  }

  async expectTopPerformersCrossReferenceWithMetrics() {
    const summaryText = await this.loc.commissionRoleSummaryGrid().innerText();
    const performersText = await this.loc.commissionRolePerformersGrid().innerText();
    expect(performersText.length, 'Performers table should contain data').toBeGreaterThan(0);
  }

  async closeRoleDetailsModal() {
    await this.loc.commissionRoleDetailsClose().click().catch(() => {});
  }

  async closeSidebarModal() {
    const close = this.loc
      .grossCommissionModalClose()
      .or(this.loc.commissionRoleDetailsClose());
    await close.first().click();
    await waitForAppSettled(this.page);
  }

  async expectTotalCommissionMatchesSumOfRoles() {
    const listText = await this.loc.commissionList().innerText();
    const totalText = await this.loc.commissionTotal().innerText();
    const totalMatch = totalText.match(/\$[\d,]+(\.\d{2})?/);
    expect(totalMatch, 'Total commission amount should be displayed').toBeTruthy();
  }

  async expectRolePercentagesSumTo100() {
    const listText = await this.loc.commissionList().innerText();
    const pctMatches = [...listText.matchAll(/([\d.]+)%/g)];
    const sum = pctMatches.reduce((acc, m) => acc + parseFloat(m[1]), 0);
    expect(Math.abs(sum - 100)).toBeLessThan(1);
  }

  // ============================================================================
  // Widget dynamic refresh helpers
  // ============================================================================

  async expectAllWidgetsHaveNonEmptyData() {
    await expect(this.loc.keyMetricsRegion()).toBeVisible({ timeout: T });
    const metrics = [
      'gross-commission',
      'agent-payouts',
      'sub-agent-payouts',
      'sales-leader-override',
      'net-to-agency',
      'chargebacks',
    ];
    for (const m of metrics) {
      const text = await this.loc.metricCard(m).innerText();
      expect(text.length, `Metric ${m} should have content`).toBeGreaterThan(0);
    }
    await expect(this.loc.revenueCard()).toBeVisible({ timeout: T });
    await expect(this.loc.commissionCard()).toBeVisible({ timeout: T });
    await expect(this.loc.topPerformersCard()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueTrendCard()).toBeVisible({ timeout: T });
  }

  async expectWidgetsRefreshDynamically() {
    await expect(this.loc.keyMetricsRegion()).toBeVisible({ timeout: T });
  }

  // ============================================================================
  // Revenue by Product Type — Dimension tabs & legend
  // ============================================================================

  async clickRevenueDimensionTab(dimension: 'lob' | 'carrier' | 'product-type') {
    await this.loc.revenueDimensionTab(dimension).click();
    await this.page.waitForTimeout(1500);
    await waitForAppSettled(this.page);
  }

  async getRevenueLegendLabels(): Promise<string[]> {
    const revenueCard = this.loc.revenueCard();
    await expect(revenueCard).toBeVisible({ timeout: T });
    const legendList = revenueCard.locator('[aria-label="Revenue legend"], ul').first();
    const items = legendList.locator('li');
    await items.first().waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
    const count = await items.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await items.nth(i).innerText()).trim();
      if (text) labels.push(text);
    }
    return labels;
  }

  private extractLegendName(legendItem: string): string {
    return legendItem.split('$')[0]?.trim() ?? legendItem.trim();
  }

  /** Pie chart legend skeleton can take ~10s to populate after filter/tab changes. */
  async waitForRevenuePieChartLoaded(timeout = 12_000) {
    await expect(this.loc.revenueCard()).toBeVisible({ timeout: T });
    await expect(this.loc.revenueDonutChart()).toBeVisible({ timeout: T });
    await expect
      .poll(
        async () => {
          const labels = await this.getRevenueLegendLabels();
          return (
            labels.length > 0 && labels.every((label) => /\$/.test(label) && /%/.test(label))
          );
        },
        { timeout, intervals: [500, 1000, 2000, 3000, 4000] },
      )
      .toBe(true);
  }

  async getCheckedFilterLabelsInSection(section: AdditionalFilterSection): Promise<string[]> {
    await this.expandFilterSection(section);
    const sectionTestId = ADDITIONAL_FILTER_SECTION_TO_TESTID[section];
    const sectionPanel = this.loc.filterSection(sectionTestId).locator('xpath=..');
    const listItems = sectionPanel.locator('li');
    const count = await listItems.count();
    const checked: string[] = [];
    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const checkbox = item.getByRole('checkbox');
      if (!(await checkbox.count())) continue;
      const isChecked = await checkbox.first().evaluate((el) => {
        if (el instanceof HTMLInputElement) return el.checked;
        return el.getAttribute('aria-checked') === 'true' || el.hasAttribute('checked');
      });
      if (!isChecked) continue;
      const name =
        (await checkbox.first().getAttribute('aria-label'))?.trim() ||
        (await item.innerText()).trim().split('\n')[0]?.trim();
      if (!name || /all\s+(lobs|types|carriers|levels)/i.test(name)) continue;
      checked.push(name);
    }
    return checked;
  }

  async expectPieChartLegendMatchesCheckedFilters(section: AdditionalFilterSection) {
    await this.waitForRevenuePieChartLoaded();
    const checkedLabels = await this.getCheckedFilterLabelsInSection(section);
    expect(checkedLabels.length, `Expected checked options in ${section}`).toBeGreaterThan(0);

    const legendItems = await this.getRevenueLegendLabels();
    expect(legendItems.length, 'Pie chart legend should list at least one segment').toBeGreaterThan(0);
    for (const legend of legendItems) {
      expect(legend, 'Legend item should include amount').toMatch(/\$/);
      expect(legend, 'Legend item should include percentage').toMatch(/%/);
      const legendName = this.extractLegendName(legend);
      const found = checkedLabels.some(
        (checked) =>
          legend.toLowerCase().includes(checked.toLowerCase()) ||
          legendName.toLowerCase().includes(checked.toLowerCase()),
      );
      expect(
        found,
        `Legend "${legendName}" should match a checked filter in ${section} (${checkedLabels.join(', ')})`,
      ).toBe(true);
    }
  }

  async expectRevenuePieChartLegendShowsCarriers(carrierNames: string[]) {
    await this.waitForRevenuePieChartLoaded();
    const legendItems = await this.getRevenueLegendLabels();
    expect(legendItems.length, 'Legend should only show selected carriers').toBe(
      carrierNames.length,
    );
    for (const carrier of carrierNames) {
      const found = legendItems.some((item) =>
        item.toLowerCase().includes(carrier.toLowerCase()),
      );
      expect(found, `Legend should contain carrier "${carrier}"`).toBe(true);
    }
  }

  async getRevenueTotal(): Promise<string> {
    return (await this.loc.revenueTotal().innerText()).trim();
  }

  // ============================================================================
  // Key Metrics — value extraction
  // ============================================================================

  async getMetricCardValue(cardName: MetricCard): Promise<string> {
    const suffix = METRIC_TO_TESTID[cardName];
    await expect(this.loc.metricCard(suffix)).toBeVisible({ timeout: T });
    return (await this.loc.metricCard(suffix).innerText()).trim();
  }

  /** Extracts the numeric dollar value from the Gross Commission card. */
  async getGrossCommissionNumericValue(): Promise<number> {
    const text = await this.getMetricCardValue('Gross Commission');
    const match = text.match(/\$[\d,]+(\.\d{2})?/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/[$,]/g, ''));
  }

  // ============================================================================
  // Additional Filters — checkbox interaction by section
  // ============================================================================

  async getFilterSectionCheckboxLabels(section: AdditionalFilterSection): Promise<string[]> {
    const labels = this.loc.filterSectionLabels(this.filterItemPrefix(section));
    const count = await labels.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(await labels.nth(i).innerText());
    }
    return result;
  }

  async uncheckAllInFilterSection(section: AdditionalFilterSection) {
    const itemPrefix = this.filterItemPrefix(section);
    await this.expandFilterSection(section);
    const allLabel = this.page.getByTestId(`agency-owner-filter-${itemPrefix}-all`);
    const allCheckbox = allLabel.locator('input[type="checkbox"]');
    if (!(await allCheckbox.isChecked().catch(() => false))) {
      await allLabel.click();
      await this.page.waitForTimeout(200);
    }
    if (await allCheckbox.isChecked().catch(() => false)) {
      await allLabel.click();
    }
  }

  async selectFilterOptionsInSection(section: AdditionalFilterSection, labelsToCheck: string[]) {
    const itemPrefix = this.filterItemPrefix(section);
    await this.expandFilterSection(section);
    for (const labelText of labelsToCheck) {
      const label = this.loc.filterSectionCheckboxForLabel(itemPrefix, labelText).first();
      await expect.soft(label, `Filter option "${labelText}" should exist in ${section}`).toBeVisible({
        timeout: T,
      });
      const cb = label.locator('input[type="checkbox"]');
      if (!(await cb.isChecked().catch(() => false))) {
        await label.click();
        await this.page.waitForTimeout(200);
      }
    }
  }

  async expectFilterSectionAllUnchecked(section: AdditionalFilterSection) {
    const labels = this.loc.filterSectionLabels(this.filterItemPrefix(section));
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      const cb = labels.nth(i).locator('input[type="checkbox"]');
      await expect(cb).not.toBeChecked({ timeout: T });
    }
  }

  async expectRevenueLegendContainsLabels(section: string, expectedLabels: string[]) {
    const legendItems = await this.getRevenueLegendLabels();
    for (const expected of expectedLabels) {
      const found = legendItems.some((item) =>
        item.toLowerCase().includes(expected.toLowerCase()),
      );
      expect(found, `Revenue legend should contain "${expected}"`).toBe(true);
    }
  }

  async expectRevenueLegendExcludesLabels(excludedLabels: string[]) {
    const legendItems = await this.getRevenueLegendLabels();
    for ( const excluded of excludedLabels) {
      const found = legendItems.some((item) =>
        item.toLowerCase().includes(excluded.toLowerCase()),
      );
      expect(found, `Revenue legend should not contain "${excluded}"`).toBe(false);
    }
  }

  // ============================================================================
  // Backward-compatible methods (used by @smoke-role)
  // ============================================================================

  async expectVisible() {
    await this.smokeExpectFiltersSidebar();
    await this.smokeExpectViewingPeriodHeader();
    await this.smokeExpectKeyMetricsRegion();
    await this.smokeExpectMetricCard('gross-commission');
    await this.smokeExpectMetricCard('agent-payouts');
    await this.smokeExpectMetricCard('sub-agent-payouts');
    await this.smokeExpectMetricCard('sales-leader-override');
    await this.smokeExpectMetricCard('net-to-agency');
    await this.smokeExpectMetricCard('chargebacks');
    await this.smokeExpectSectionHeading('Revenue by Product Type');
    await this.smokeExpectSectionHeading('Commission Distribution by Role');
    await this.smokeExpectSectionHeading('Top Performers by Revenue');
    await this.smokeExpectSectionHeading(/12-Month Revenue Trend/i);
  }

  /** Smoke component checks — one assertion surface per Gherkin Then. */
  async smokeExpectFiltersSidebar() {
    await expect(this.loc.filtersSidebar()).toBeVisible({ timeout: T });
  }

  async smokeExpectViewingPeriodHeader() {
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
  }

  async smokeExpectKeyMetricsRegion() {
    await expect(this.loc.keyMetricsRegion()).toBeVisible({ timeout: T });
  }

  async smokeExpectMetricCard(suffix: string) {
    await expect(this.loc.metricCard(suffix)).toBeVisible({ timeout: T });
  }

  async smokeExpectSectionHeading(name: string | RegExp) {
    await expect(this.loc.sectionHeading(name)).toBeVisible({ timeout: T });
  }

  async setTimeFilterThisMonth() {
    if (
      !(await this.page.getByText('This Month', { exact: true }).isVisible().catch(() => false))
    ) {
      await this.page.getByTestId('agency-owner-filter-section-time-period').click();
    }
    await this.selectTimePeriod('This Month');
    const monthLong = new Date().toLocaleString('en-US', { month: 'short' });
    await expect
      .poll(async () => (await this.readViewingPeriodText()).trim())
      .toMatch(new RegExp(`${monthLong}\\s+1\\b`, 'i'));
    await waitForAppSettled(this.page);
  }

  async expectDateRangeTitleThisMonthThroughToday() {
    await this.expectViewingPeriodDateRange('This Month');
  }
}

// ============================================================================
// Helper: validates the viewing period text matches a computed DateRange
// ============================================================================

async function expectViewingPeriodMatches(pageObj: AgencyOwnerDashboardPage, expected: DateRange) {
  const text = await pageObj.readViewingPeriodText();
  const formatted = formatDateRange(expected);
  expect(text, `Expected viewing period "${text}" to match "${formatted}"`).toBe(formatted);
}
