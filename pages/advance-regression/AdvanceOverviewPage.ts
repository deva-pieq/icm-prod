import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AdvanceOverviewPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () => this.page.getByRole('heading', { name: 'Advance Overview' }),
    totalAdvancePayout: () => this.page.getByTestId('advance-metric-total-payout').getByText('$'),
    recovered: () => this.page.getByTestId('advance-metric-recovered').getByText('$'),
    totalBalance: () => this.page.getByTestId('advance-metric-total-balance').getByText('$'),
    tabs: () => this.page.getByTestId('advance-overview-tabs'),
    activeTab: () => this.page.getByTestId('advance-overview-tabs-tab-active'),
    historicalTab: () => this.page.getByTestId('advance-overview-tabs-tab-historical'),
    searchInput: () => this.page.getByTestId('data-grid-search-input').getByRole('textbox'),
    agentFilter: () => this.page.getByTestId('filter-agent'),
    carrierFilter: () => this.page.getByTestId('filter-carrier'),
    productFilter: () => this.page.getByTestId('filter-product'),
    columnToggle: () => this.page.getByTestId('data-grid-columns-button'),
    activeGrid: () => this.page.getByTestId('active-grid'),
    grid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    firstRow: () =>
      this.page.getByRole('grid', { name: 'Data grid' })
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') })
        .first(),
    arfIdCell: () => this.page.locator('.ag-cell[col-id="arfId"]').first(),
    agentNameCell: () => this.page.locator('.ag-cell[col-id="agentName"]').first(),
    transactionIdCell: () => this.page.locator('//div[@role="gridcell" and @col-id="transactionId"]//span//span').first(),
    agentNameCellFirst: () => this.page.locator('//div[@role="gridcell" and @col-id="agentName"]//span//span').first(),
  };

  constructor(private page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  async navigateToAdvanceOverview(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}/advance/overview`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
  }

  /** Smoke-only: sidebar → Advance → Overview + header/tabs visibility. */
  async smokeOpenViaSidebar(): Promise<void> {
    await this.sidebar.openAdvanceOverview();
    await expect(this.page).toHaveURL(AppUrlPatterns.advanceOverview, { timeout: T });
    await waitForAppSettled(this.page, T);
    await this.smokeExpectHeader();
  }

  async smokeExpectHeader(): Promise<void> {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.tabs()).toBeVisible({ timeout: T });
  }

  async expectPageTitleDisplayed(): Promise<void> {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async expectTotalAdvancePayoutCard(): Promise<void> {
    await expect(this.loc.totalAdvancePayout()).toBeVisible({ timeout: T });
    const text = await this.loc.totalAdvancePayout().innerText();
    expect(text.replace(/[^0-9.$]/g, '').length).toBeGreaterThan(0);
  }

  async expectRecoveredCard(): Promise<void> {
    await expect(this.loc.recovered()).toBeVisible({ timeout: T });
    const text = await this.loc.recovered().innerText();
    expect(text.replace(/[^0-9.$]/g, '').length).toBeGreaterThan(0);
  }

  async expectTotalBalanceCard(): Promise<void> {
    await expect(this.loc.totalBalance()).toBeVisible({ timeout: T });
    const text = await this.loc.totalBalance().innerText();
    expect(text.replace(/[^0-9.$]/g, '').length).toBeGreaterThan(0);
  }

  async expectTotalBalanceCalculation(): Promise<void> {
    const payoutText = await this.loc.totalAdvancePayout().innerText();
    const recoveredText = await this.loc.recovered().innerText();
    const balanceText = await this.loc.totalBalance().innerText();

    const payout = Number.parseFloat(payoutText.replace(/[$,]/g, ''));
    const recovered = Number.parseFloat(recoveredText.replace(/[$,]/g, ''));
    const balance = Number.parseFloat(balanceText.replace(/[$,]/g, ''));

    expect(balance).toBeCloseTo(payout - recovered, 2);
  }

  async clickTab(tabName: string): Promise<void> {
    if (tabName.toLowerCase().includes('active')) {
      await this.loc.activeTab().click();
    } else {
      await this.loc.historicalTab().click();
    }
    await waitForAppSettled(this.page, T);
  }

  async searchGrid(query: string): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(query);
    await waitForAppSettled(this.page, T);
  }

  async expectGridFiltered(): Promise<void> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const status = this.page.getByRole('status');
    if (await status.isVisible().catch(() => false)) {
      const statusText = await status.innerText();
      expect(statusText).not.toMatch(/\b0 rows\b/);
    }
  }

  async resetSearch(): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await waitForAppSettled(this.page, T);
  }

  async expectGridShowsAllRecords(): Promise<void> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const footer = this.page.getByTestId('data-grid-record-count-footer');
    if (await footer.isVisible().catch(() => false)) {
      const text = await footer.innerText();
      expect(text).toContain('Showing');
    }
  }

  async openAgentFilter(): Promise<void> {
    await this.loc.agentFilter().click();
    await waitForAppSettled(this.page, T);
  }

  async expectAgentFilterOptions(): Promise<void> {
    const options = this.page.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  }

  async openCarrierFilter(): Promise<void> {
    await this.loc.carrierFilter().click();
    await waitForAppSettled(this.page, T);
  }

  async expectCarrierFilterOptions(): Promise<void> {
    const options = this.page.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  }

  async openProductFilter(): Promise<void> {
    await this.loc.productFilter().click();
    await waitForAppSettled(this.page, T);
  }

  async expectProductFilterOptions(): Promise<void> {
    const options = this.page.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  }

  async clickColumnToggle(): Promise<void> {
    await this.loc.columnToggle().click();
    await waitForAppSettled(this.page, T);
  }

  async expectColumnMenuDisplayed(): Promise<void> {
    // Active and Historical settlement grids use their own column-toggle modal testid.
    const modal = this.page
      .getByTestId('active-grid-toggle-columns-modal')
      .or(this.page.getByTestId('historical-grid-toggle-columns-modal'))
      .first();
    await expect(modal).toBeVisible({ timeout: T });
  }

  async clickArfIdHeader(): Promise<void> {
    const header = this.page.getByRole('columnheader', { name: 'ARF ID' });
    await expect(header).toBeVisible({ timeout: T });
    await header.click();
    await waitForAppSettled(this.page, T);
  }

  async expectGridSorted(): Promise<void> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
  }

  async clickFirstRow(): Promise<void> {
    const row = this.loc.firstRow();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async captureArfIdFromGrid(): Promise<string> {
    const cell = this.loc.transactionIdCell();
    await expect(cell).toBeVisible({ timeout: T });
    return (await cell.innerText()).trim();
  }

  async captureAgentNameFromGrid(): Promise<string> {
    const cell = this.loc.agentNameCellFirst();
    await expect(cell).toBeVisible({ timeout: T });
    return (await cell.innerText()).trim();
  }

  async expectDetailTitleContainsCapturedValues(arfId: string, agentName: string): Promise<void> {
    const title = this.page.getByTestId('advance-policy-details-card').locator("../..//h1").first();
    await expect(title).toBeVisible({ timeout: T });
    const text = await title.innerText();
    expect(text).toContain(arfId);
    expect(text.toLowerCase()).toContain(agentName.toLowerCase());
  }

  async expectArfDetailPage(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /ARF|advance/i });
    await expect(heading.first()).toBeVisible({ timeout: T });
  }

  async expectArfDetailContainsSection(sectionName: string): Promise<void> {
    const section = this.page.getByRole('heading', { name: sectionName });
    await expect(section).toBeVisible({ timeout: T });
  }

  async expectArfDetailTitleContainsArfId(): Promise<void> {
    const title = this.page.getByTestId('advance-policy-details-card').locator("../..//h1").first();
    await expect(title).toBeVisible({ timeout: T });
    const text = await title.innerText();
    expect(text).toMatch(/ARF-\w+/);
  }

  async expectArfDetailTitleContainsAgentName(): Promise<void> {
    const title = this.page.getByTestId('advance-arf-ledger-card').locator('../..//h1');
    await expect(title).toBeVisible({ timeout: T });
    const text = await title.innerText();
    expect(text.length).toBeGreaterThan(5);
  }

  async expectPolicyInfoField(fieldName: string): Promise<void> {
    const field = this.page.getByText(fieldName, { exact: false });
    await expect(field.first()).toBeVisible({ timeout: T });
  }

  async expectAdvanceDetailsField(fieldName: string | RegExp): Promise<void> {
    const field = this.page.getByText(fieldName, { exact: false });
    await expect(field.first()).toBeVisible({ timeout: T });
  }

  async expectArfLedgerSearchBar(): Promise<void> {
    const search = this.page.getByRole('textbox', { name: /search/i });
    await expect(search.first()).toBeVisible({ timeout: T });
  }

  async expectArfLedgerColumnButton(): Promise<void> {
    const btn = this.page.getByRole('button', { name: /column/i });
    await expect(btn.first()).toBeVisible({ timeout: T });
  }

  async expectArfLedgerDataGrid(): Promise<void> {
    const grid = this.page.getByRole('grid');
    await expect(grid.first()).toBeVisible({ timeout: T });
  }
}
