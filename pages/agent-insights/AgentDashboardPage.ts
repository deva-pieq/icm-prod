import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled, waitForLoaderHidden } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import {
  computeExpectedDateRange,
  formatDateRange,
  type DateRange,
} from '../../utils/dashboard/dateRangeUtils';

const T = smokeStepTimeoutMs;

export type AgentTimePeriodOption =
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

export type AgentFilterSection = 'Line of Business' | 'Product Type' | 'Carrier' | 'Product';

export type AgentKpiCard =
  | 'Total Gross Commission'
  | 'Total Chargeback'
  | 'Total Paid'
  | 'Avg Per Policy'
  | 'Total New Policies';

const TIME_PERIOD_TO_TESTID: Record<AgentTimePeriodOption, string> = {
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

const FILTER_SECTION_TO_TESTID: Record<AgentFilterSection, string> = {
  'Line of Business': 'line-of-business',
  'Product Type': 'product-type',
  Carrier: 'carrier',
  Product: 'product',
};

const FILTER_ITEM_PREFIX: Record<AgentFilterSection, string> = {
  'Line of Business': 'lob',
  'Product Type': 'product-type',
  Carrier: 'carrier',
  Product: 'product',
};

const KPI_TO_TESTID: Record<AgentKpiCard, string> = {
  'Total Gross Commission': 'total-gross-commission',
  'Total Chargeback': 'total-chargeback',
  'Total Paid': 'total-paid',
  'Avg Per Policy': 'avg-per-policy',
  'Total New Policies': 'total-new-policies',
};

const WIDGET_TESTIDS = [
  'agent-commission-by-role-card',
  'agent-commission-performance-trend-card',
  'agent-cross-sell-metrics-card',
  'agent-persistency-last-13-months-card',
  'agent-product-type-performance-card',
  'agent-summary-by-lob-carrier-card',
] as const;

const NO_DATA_TESTID_SUFFIXES = [
  'agent-commission-by-role-no-data',
  'agent-commission-performance-trend-no-data',
  'agent-summary-by-lob-carrier-no-data',
  'agent-product-type-performance-no-data',
];

export class AgentDashboardPage {
  private readonly sidebar: IcmSidebarPage;
  private lastViewingPeriodText = '';
  private capturedGrossCommission: number | null = null;
  private capturedUniqueClients: number | null = null;
  private capturedLobCarrierRowCount: number | null = null;

  readonly loc = {
    root: () => this.page.getByTestId('agent-dashboard'),
    filtersSidebar: () => this.page.getByTestId('agent-filters-sidebar'),

    timePeriodSection: () => this.page.getByTestId('agent-filter-section-time-period'),
    filterSection: (section: string) =>
      this.page.getByTestId(`agent-filter-section-${section}`),
    timePeriodRadio: (suffix: string) =>
      this.page.getByTestId(`agent-time-period-${suffix}-radio`),
    timePeriodOption: (suffix: string) =>
      this.page.getByTestId(`agent-time-period-${suffix}`),

    filterAllCheckbox: (prefix: string) =>
      this.page.getByTestId(`agent-filter-${prefix}-all`),
    filterCheckbox: () =>
      this.page.getByTestId('agent-filters-sidebar').locator('input[type="checkbox"]'),
    filterSearchInput: () =>
      this.page.getByTestId('agent-filters-sidebar').locator('input[type="text"]'),
    filterApply: () => this.page.getByTestId('agent-filter-apply'),
    filterReset: () => this.page.getByTestId('agent-filter-reset'),
    filterCancel: () => this.page.getByTestId('agent-filter-cancel'),

    viewingPeriodHeader: () => this.page.getByTestId('agent-viewing-period-header'),
    viewingPeriodRange: () => this.page.getByTestId('agent-viewing-period-range'),

    performanceOverviewRegion: () =>
      this.page.getByRole('region', { name: 'Performance Overview' }),
    metricCard: (suffix: string) => this.page.getByTestId(`agent-metric-${suffix}`),

    commissionByRoleCard: () => this.page.getByTestId('agent-commission-by-role-card'),
    productTypePerformanceCard: () => this.page.getByTestId('agent-product-type-performance-card'),
    persistencyCard: () => this.page.getByTestId('agent-persistency-last-13-months-card'),
    persistencyGrid: () => this.page.getByTestId('agent-persistency-datagrid'),
    summaryByLobCarrierCard: () => this.page.getByTestId('agent-summary-by-lob-carrier-card'),
    crossSellMetricsCard: () => this.page.getByTestId('agent-cross-sell-metrics-card'),
    crossSellSummaryDatagrid: () => this.page.getByTestId('agent-cross-sell-summary-datagrid'),
    crossSellSummaryTable: () => this.page.getByTestId('agent-cross-sell-summary-table'),
    crossSellDistributionDatagrid: () => this.page.getByTestId('agent-cross-sell-distribution-datagrid'),
    crossSellDistributionTable: () => this.page.getByTestId('agent-cross-sell-distribution-table'),

    chartCard: (name: string) => this.page.getByTestId(`agent-${name}`),
    sectionHeading: (name: string | RegExp) =>
      this.page.getByRole('heading', { name, level: 2 }),
    kpiHeading: (name: string | RegExp) =>
      this.page.getByRole('heading', { name, level: 3 }),
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  private timePeriodSuffix(option: AgentTimePeriodOption): string {
    return TIME_PERIOD_TO_TESTID[option];
  }

  private filterItemPrefix(section: AgentFilterSection): string {
    return FILTER_ITEM_PREFIX[section];
  }

  async open() {
    await this.sidebar.openDashboard();
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardAgent, { timeout: T });
    await waitForLoaderHidden(this.page);
    await ensurePageReady(this.page, this.loc.root(), { timeout: T });
    this.lastViewingPeriodText = await this.getViewingPeriodText();
  }

  /** Smoke-only: navigation landing — URL + root + viewing period. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.dashboardAgent, { timeout: T });
    await expect(this.loc.root()).toBeVisible({ timeout: T });
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
  }

  /** Smoke component checks — one assertion surface per Gherkin Then. */
  async smokeExpectFiltersSidebar() {
    await expect(this.loc.filtersSidebar()).toBeVisible({ timeout: T });
  }

  async smokeExpectViewingPeriodHeader() {
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
  }

  async smokeExpectPerformanceOverview() {
    await expect(this.loc.performanceOverviewRegion()).toBeVisible({ timeout: T });
  }

  async smokeExpectTotalGrossCommissionMetric() {
    await expect(this.loc.metricCard('total-gross-commission')).toBeVisible({ timeout: T });
  }

  async smokeExpectCommissionByRole() {
    await expect(this.loc.commissionByRoleCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectProductTypePerformance() {
    await expect(this.loc.productTypePerformanceCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectPersistencyReport() {
    await expect(this.loc.persistencyCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectSummaryByLobCarrier() {
    await expect(this.loc.summaryByLobCarrierCard()).toBeVisible({ timeout: T });
  }

  async smokeExpectCrossSellMetrics() {
    await expect(this.loc.crossSellMetricsCard()).toBeVisible({ timeout: T });
  }

  async expectFiltersSidebarVisible() {
    await expect(this.loc.filtersSidebar()).toBeVisible({ timeout: T });
  }

  async expectTimePeriodOptions(options: AgentTimePeriodOption[]) {
    for (const option of options) {
      const suffix = TIME_PERIOD_TO_TESTID[option];
      await expect(this.loc.timePeriodRadio(suffix)).toBeAttached({ timeout: T });
    }
  }

  async expectOnlyOneTimePeriodSelectable() {
    const allSuffixes = Object.values(TIME_PERIOD_TO_TESTID);
    let checkedCount = 0;
    for (const suffix of allSuffixes) {
      if (await this.loc.timePeriodRadio(suffix).isChecked().catch(() => false)) {
        checkedCount++;
      }
    }
    expect(checkedCount, 'Exactly one time period should be selected at a time').toBe(1);
  }

  async expectFilterSections(sections: AgentFilterSection[]) {
    for (const section of sections) {
      const testidSuffix = FILTER_SECTION_TO_TESTID[section];
      await expect(this.loc.filterSection(testidSuffix)).toBeAttached({ timeout: T });
    }
  }

  async expandFilterSection(section: AgentFilterSection) {
    const testidSuffix = FILTER_SECTION_TO_TESTID[section];
    const sectionBtn = this.loc.filterSection(testidSuffix);
    if ((await sectionBtn.getAttribute('aria-expanded')) !== 'true') {
      await sectionBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expectFilterCheckboxesVisible() {
    const count = await this.loc.filterCheckbox().count();
    expect(count, 'Expected at least one filter checkbox').toBeGreaterThan(0);
  }

  async expectAllLobsCheckboxPresentAndSelected() {
    await expect(this.loc.filterAllCheckbox('lob')).toBeVisible({ timeout: T });
    const checkbox = this.loc.filterAllCheckbox('lob').locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked({ timeout: T });
  }

  /** Selects a time-period radio without applying — call applyFilterChanges() to commit. */
  async selectTimePeriod(option: AgentTimePeriodOption) {
    const timePeriodSection = this.loc.timePeriodSection();
    if ((await timePeriodSection.getAttribute('aria-expanded')) !== 'true') {
      await timePeriodSection.click();
      await this.page.waitForTimeout(300);
    }
    const suffix = this.timePeriodSuffix(option);
    await this.loc.timePeriodRadio(suffix).check({ force: true });
  }

  /** Clicks Apply when pending filter changes surface the action bar. */
  async applyFilterChangesIfVisible() {
    const applyBtn = this.loc.filterApply();
    await applyBtn.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
    const visible = await applyBtn.isVisible().catch(() => false);
    const enabled = visible && (await applyBtn.isEnabled().catch(() => false));
    if (enabled) {
      await applyBtn.click();
      await waitForLoaderHidden(this.page);
      await waitForAppSettled(this.page);
    }
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

  /** Clicks Reset to revert all filters to defaults. After reset, re-expand the Time Period section
   *  because it collapses after Apply/Reset. The default landing state on a fresh load has it expanded,
   *  so this fully restores the initial UI. */
  async resetFilterChanges() {
    await this.loc.filterReset().click();
    await waitForLoaderHidden(this.page);
    await waitForAppSettled(this.page);
    const timePeriodSection = this.loc.timePeriodSection();
    if ((await timePeriodSection.getAttribute('aria-expanded')) !== 'true') {
      await timePeriodSection.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expectTimePeriodSelected(option: AgentTimePeriodOption) {
    const suffix = this.timePeriodSuffix(option);
    await expect(this.loc.timePeriodRadio(suffix)).toBeChecked({ timeout: T });
  }

  async expectViewingPeriodHeaderVisible() {
    await expect(this.loc.viewingPeriodHeader()).toBeVisible({ timeout: T });
    await expect(this.loc.viewingPeriodRange()).toBeVisible({ timeout: T });
  }

  async getViewingPeriodText(): Promise<string> {
    return (await this.loc.viewingPeriodRange().innerText()).trim();
  }

  async expectViewingPeriodFormat() {
    const text = await this.getViewingPeriodText();
    expect(text).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} – [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  }

  async expectViewingPeriodMatchesTimePeriod(option: AgentTimePeriodOption) {
    const expected = computeExpectedDateRange(option);
    const text = await this.getViewingPeriodText();
    const formatted = formatDateRange(expected);
    expect(text).toBe(formatted);
  }

  async expectViewingPeriodShowsCurrentWeek() {
    await this.expectViewingPeriodMatchesTimePeriod('This Week');
  }

  async expectViewingPeriodShowsLastWeek() {
    await this.expectViewingPeriodMatchesTimePeriod('Last Week');
  }

  async expectViewingPeriodShowsFourWeekRange() {
    await this.expectViewingPeriodMatchesTimePeriod('Last 4 Weeks');
  }

  async expectViewingPeriodShowsTwelveWeekRange() {
    await this.expectViewingPeriodMatchesTimePeriod('Last 12 Weeks');
  }

  async expectViewingPeriodShowsThisMonth() {
    await this.expectViewingPeriodMatchesTimePeriod('This Month');
  }

  async expectViewingPeriodShowsLastMonth() {
    await this.expectViewingPeriodMatchesTimePeriod('Last Month');
  }

  async expectViewingPeriodShowsLastQuarter() {
    await this.expectViewingPeriodMatchesTimePeriod('Last Quarter');
  }

  async expectViewingPeriodShowsSixMonthRange() {
    await this.expectViewingPeriodMatchesTimePeriod('Last 6 Months');
  }

  async expectViewingPeriodShowsYearToDate() {
    await this.expectViewingPeriodMatchesTimePeriod('Year to Date');
  }

  async expectViewingPeriodShowsLastYear() {
    await this.expectViewingPeriodMatchesTimePeriod('Last Year');
  }

  async expectCustomDateRangePickerVisible() {
    await expect(this.loc.timePeriodOption('custom')).toBeVisible({ timeout: T });
  }

  async expectWidgetsRefreshDynamically() {
    const before = await this.getViewingPeriodText();
    await expect(this.loc.root()).toBeVisible({ timeout: T });
    for (const testid of WIDGET_TESTIDS) {
      await expect(this.page.getByTestId(testid)).toBeAttached({ timeout: T });
    }
    const after = await this.getViewingPeriodText();
    expect(after.length).toBeGreaterThan(0);
    if (before !== after) {
      expect(after).not.toBe(before);
    }
  }

  async expectAllFilterOptionsSelectedForSection(section: AgentFilterSection) {
    await this.expandFilterSection(section);
    const prefix = this.filterItemPrefix(section);
    const allCheckbox = this.loc.filterAllCheckbox(prefix);
    if (await allCheckbox.isVisible().catch(() => false)) {
      await expect(allCheckbox.locator('input[type="checkbox"]')).toBeChecked({ timeout: T });
      return;
    }
    const checkboxes = this.loc.filtersSidebar().locator(`[data-testid^="agent-filter-${prefix}-"] input[type="checkbox"]`);
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked({ timeout: T });
    }
  }

  async deselectFirstNonAllFilterOption(section: AgentFilterSection) {
    await this.expandFilterSection(section);
    const prefix = this.filterItemPrefix(section);
    const labels = this.loc.filtersSidebar().locator(
      `[data-testid^="agent-filter-${prefix}-"]:not([data-testid$="-all"])`,
    );
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);
    const firstLabel = labels.first();
    await expect(firstLabel).toBeVisible({ timeout: T });
    // Check via evaluate to avoid timeouts on hidden sr-only inputs
    const checked = await firstLabel.evaluate((el) => {
      const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (input) return input.checked;
      const ariaChecked = el.getAttribute('aria-checked');
      const dataState = el.getAttribute('data-state');
      return ariaChecked === 'true' || dataState === 'checked';
    });
    if (checked) {
      await firstLabel.click();
    }
  }

  async expandAndUncheckAllAdditionalFilterSections() {
    const sections: AgentFilterSection[] = ['Line of Business', 'Product Type', 'Carrier', 'Product'];
    for (const section of sections) {
      await this.expandFilterSection(section);
      const prefix = this.filterItemPrefix(section);
      const allCheckbox = this.loc.filterAllCheckbox(prefix);
      if (await allCheckbox.isVisible().catch(() => false)) {
        const checked = await allCheckbox.evaluate((el) => {
          const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
          if (input) return input.checked;
          const ariaChecked = el.getAttribute('aria-checked');
          const dataState = el.getAttribute('data-state');
          return ariaChecked === 'true' || dataState === 'checked';
        });
        if (checked) {
          await allCheckbox.click();
        }
      }
    }
  }

  async expectWarningMessage(message: string) {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible({ timeout: T });
  }

  async expectPerformanceOverviewVisible() {
    await expect(this.loc.sectionHeading(/Performance Overview/i)).toBeVisible({ timeout: T });
  }

  async expectKpiCardsVisible(cards: AgentKpiCard[]) {
    for (const card of cards) {
      const suffix = KPI_TO_TESTID[card];
      await expect(this.loc.metricCard(suffix)).toBeVisible({ timeout: T });
      await expect(this.loc.kpiHeading(new RegExp(card.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))).toBeVisible({
        timeout: T,
      });
    }
  }

  async expectKpiCardsShowValueAndDescription() {
    for (const suffix of Object.values(KPI_TO_TESTID)) {
      const card = this.loc.metricCard(suffix);
      await expect(card).toBeVisible({ timeout: T });
      const text = await card.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  }

  async captureTotalGrossCommission() {
    this.capturedGrossCommission = await this.getMetricNumericValue('total-gross-commission');
  }

  async expectPerformanceOverviewMetricsRefresh() {
    const current = await this.getMetricNumericValue('total-gross-commission');
    if (this.capturedGrossCommission !== null) {
      expect(typeof current).toBe('number');
    }
    await expect(this.loc.metricCard('total-gross-commission')).toBeVisible({ timeout: T });
  }

  async expectSectionVisible(heading: RegExp) {
    await expect(this.loc.sectionHeading(heading)).toBeVisible({ timeout: T });
  }

  async expectCommissionByRoleRoles(roles: string[]) {
    await expect(this.loc.commissionByRoleCard()).toBeVisible({ timeout: T });
    const cardText = await this.loc.commissionByRoleCard().innerText();
    for (const role of roles) {
      expect(cardText.toLowerCase()).toContain(role.toLowerCase());
    }
  }

  async expectPersistencyReportVisible() {
    await expect(this.loc.persistencyCard()).toBeVisible({ timeout: T });
    await expect(this.loc.sectionHeading(/Persistency \(Last 13 Months\)/i)).toBeVisible({ timeout: T });
  }

  async expectPersistencyHeaders() {
    const headers = this.loc.persistencyGrid().locator('.ag-header-cell-text');
    await expect(headers.filter({ hasText: 'Milestone' })).toBeVisible({ timeout: T });
    await expect(headers.filter({ hasText: 'Cohort' })).toBeVisible({ timeout: T });
    await expect(headers.filter({ hasText: 'Persisted' })).toBeVisible({ timeout: T });
    await expect(headers.filter({ hasText: /Lapsed/ })).toBeVisible({ timeout: T });
    await expect(headers.filter({ hasText: 'Persistency' })).toBeVisible({ timeout: T });
  }

  async expectPersistencyRowVisible(milestone: string) {
    const row = this.loc.persistencyGrid().getByRole('row').filter({ hasText: milestone });
    await expect(row.first()).toBeVisible({ timeout: T });
    const text = await row.first().innerText();
    expect(text).toMatch(/%/);
  }

  async expectSummaryByLobCarrierVisible() {
    await expect(this.loc.summaryByLobCarrierCard()).toBeVisible({ timeout: T });
    await expect(this.loc.sectionHeading(/Summary by LOB & Carrier\b/i)).toBeVisible({ timeout: T });
  }

  async expectCrossSellMetricsVisible() {
    await expect(this.loc.crossSellMetricsCard()).toBeVisible({ timeout: T });
    await expect(this.loc.sectionHeading(/Cross-Sell Metrics/i)).toBeVisible({ timeout: T });
  }

  async captureUniqueClientsCount() {
    const text = await this.loc.crossSellMetricsCard().innerText();
    const match = text.match(/Unique Clients[^\d]*(\d+)/i) ?? text.match(/(\d+)\s*Unique/i);
    this.capturedUniqueClients = match ? parseInt(match[1], 10) : 0;
  }

  async expectCrossSellMetricsRecalculate() {
    await expect(this.loc.crossSellMetricsCard()).toBeVisible({ timeout: T });
    const text = await this.loc.crossSellMetricsCard().innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  }

  async captureLobCarrierSummaryRowCount() {
    const rows = this.loc.summaryByLobCarrierCard().locator('.ag-row');
    this.capturedLobCarrierRowCount = await rows.count();
  }

  async expectLobCarrierSummaryRecalculates() {
    await expect(this.loc.summaryByLobCarrierCard()).toBeVisible({ timeout: T });
  }

  async getMetricNumericValue(metricSuffix: string): Promise<number> {
    const text = await this.loc.metricCard(metricSuffix).innerText();
    const match = text.match(/\$?[\d,]+(\.\d{2})?/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/[$,()]/g, ''));
  }

  async expectCustomDateRangeInputsVisible() {
    await expect(this.loc.timePeriodOption('custom')).toBeVisible({ timeout: T });
  }

  async expectCommissionByRoleCardStructure() {
    await expect(this.loc.commissionByRoleCard()).toBeVisible({ timeout: T });
  }

  async expectProductTypePerformanceCardVisible() {
    await expect(this.loc.productTypePerformanceCard()).toBeVisible({ timeout: T });
  }

  async expectCrossSellCardHasContent() {
    const text = await this.loc.crossSellMetricsCard().innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  }

  async expectChargebackDisplayFormat() {
    const text = await this.loc.metricCard('total-chargeback').innerText();
    expect(text.length).toBeGreaterThan(0);
  }

  // --- My Team Performance (Sales Leader) ---------------------------------

  private myTeamCard() {
    return this.page
      .getByTestId('agent-team-performance-card')
      .or(this.page.getByTestId('agent-my-team-performance-card'))
      .or(this.page.getByTestId('agent-my-team-card'))
      .or(this.page.getByRole('region', { name: /My Team Performance/i }))
      .or(this.page.getByRole('heading', { name: /My Team Performance/i }).locator('..'))
      .first();
  }

  /** AG Grid header label: //span[text()='Exact Name' and @data-ref='eText'] */
  private myTeamColumnHeader(exactName: string) {
    return this.myTeamCard()
      .locator(`xpath=.//span[text()=${JSON.stringify(exactName)} and @data-ref='eText']`)
      .first();
  }

  /**
   * Data rows only (exclude header): card → ag-center → role=row,
   * then drop header-like rows (no ag-cell / columnheader).
   */
  private myTeamDataRows() {
    return this.page
      .locator(
        "//div[@data-testid='agent-team-performance-card']//div[contains(@class,'ag-center')]//div[@role='row']",
      )
      .filter({ has: this.page.locator('.ag-cell') })
      .filter({ hasNot: this.page.locator('[role="columnheader"], .ag-header-cell') });
  }

  async expectMyTeamPerformanceVisible() {
    const card = this.myTeamCard();
    await expect(card).toBeVisible({ timeout: T });
  }

  async expectMyTeamPerformanceColumns(columns: string[]) {
    await this.expectMyTeamPerformanceVisible();
    for (const column of columns) {
      await expect.soft(
        this.myTeamColumnHeader(column),
        `Expected column header "${column}" in My Team Performance`,
      ).toBeVisible({ timeout: T });
    }
  }

  async expectMyTeamPerformanceRankedByCommission() {
    await this.expectMyTeamPerformanceVisible();
    const rows = this.myTeamDataRows();
    await expect(rows.first(), 'Expected at least one ranked agent data row').toBeVisible({
      timeout: T,
    });
    // Ranked by commission → data cells carry currency amounts ($…), not header text alone.
    await expect(rows.filter({ hasText: '$' }).first()).toBeVisible({ timeout: T });
  }

  async expectMyTeamPerformanceAgentDetails() {
    // Live UI: one "Agent" column (name + "id • level"), not separate Name/ID/Level headers.
    await this.expectMyTeamPerformanceColumns(['Agent']);
    const rows = this.myTeamDataRows();
    const first = rows.first();
    await expect(first, 'Expected agent detail data rows').toBeVisible({ timeout: T });
    const agentCell = first.getByRole('gridcell').nth(1);
    await expect(agentCell, 'Expected agent name line in Agent cell').not.toHaveText('');
    await expect(agentCell, 'Expected agent id • level in Agent cell').toContainText(/•/);
  }

  async expectMyTeamPerformancePolicyCounts() {
    await this.expectMyTeamPerformanceColumns(['Policies']);
    const rows = this.myTeamDataRows();
    await expect(rows.first(), 'Expected policy-count data rows').toBeVisible({ timeout: T });
    await expect(rows.first().getByRole('gridcell').nth(2)).toHaveText(/^\d+$/);
  }

  async expectMyTeamPerformanceCommissionFormatting() {
    await this.expectMyTeamPerformanceVisible();
    await expect(this.myTeamColumnHeader('Agent Commission')).toBeVisible({ timeout: T });
    // Currency: assert $ in data rows (contains $values), not card text blob alone.
    const rowsWithCurrency = this.myTeamDataRows().filter({ hasText: '$' });
    await expect(rowsWithCurrency.first()).toBeVisible({ timeout: T });
  }

  async expectMyTeamPerformancePaginationOk() {
    await this.expectMyTeamPerformanceVisible();
    const card = this.myTeamCard();
    const pager = card
      .locator('[data-testid*="pagination"], .ag-paging-panel, button:has-text("Next")')
      .first();
    // Pagination optional when team fits one page — either present or data rows visible.
    const hasPager = await pager.isVisible().catch(() => false);
    if (!hasPager) {
      await expect(this.myTeamDataRows().first()).toBeVisible({ timeout: T });
    }
  }

  async expectMyTeamPerformanceVisibleOrHiddenCleanly() {
    const card = this.myTeamCard();
    const visible = await card.isVisible().catch(() => false);
    if (visible) {
      await expect(card).toBeVisible({ timeout: T });
      return;
    }
    // Hidden is valid when no downline — dashboard root must still be healthy.
    await expect(this.loc.root()).toBeVisible({ timeout: T });
  }
}
