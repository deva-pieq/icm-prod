import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class NeedsAttentionPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () => this.page.getByRole('heading', { name: /needs attention/i }),
    headingReconciliation: () =>
      this.page.getByRole('heading', { name: /commission reconciliation/i }),
    tabNavigation: () => this.page.getByTestId('tab-navigation'),
    exceptionGrid: () => this.page.getByTestId('exception-queue-table'),
    searchInput: () => this.page.getByTestId('data-grid-search-input'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  private inStatementsArea(): boolean {
    return /commission-processing\/(needs-attention|reconciliation)/i.test(this.page.url());
  }

  async open() {
    if (!this.inStatementsArea()) {
      await this.sidebar.waitForSidebar();
      await this.sidebar.clickStatementsSubNav(/needs attention/i, { lightweight: true });
    } else {
      await this.sidebar.clickStatementsSubNav(/needs attention/i, { lightweight: true });
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionNeedsAttention, {
      timeout: smokeStepTimeoutMs,
    });
    // Heading can paint while exception-records + AG Grid overlay still spin.
    // ensurePageReady → waitForAppSettled blocks ~90s on that overlay (T035 flake).
    await expect(this.loc.heading()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: Needs Attention heading + tabs + exception grid + search. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionNeedsAttention, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.heading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.tabNavigation()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.exceptionGrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async searchExceptionQueue(query: string): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: smokeStepTimeoutMs });
    await search.fill(query);
    await this.page.waitForTimeout(1_500);
  }

  /** Assert exception queue shows at least `minRows` data rows (or footer count). */
  async expectExceptionRowCountAtLeast(minRows: number): Promise<number> {
    await expect(this.loc.exceptionGrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
    const footer = this.page
      .getByTestId('data-grid-record-count-footer')
      .or(this.page.getByText(/showing all (\d+) records/i))
      .first();
    let count = 0;
    if (await footer.isVisible().catch(() => false)) {
      const text = (await footer.innerText()).replace(/\s+/g, ' ');
      count = Number.parseInt(text.match(/(\d+)/)?.[1] ?? '0', 10);
    }
    if (count <= 0) {
      count = await this.loc
        .exceptionGrid()
        .locator('.ag-center-cols-container [role="row"]')
        .count();
    }
    expect(count, `Needs Attention exception rows`).toBeGreaterThanOrEqual(minRows);
    return count;
  }

  async expectStoredFileVisibleInQueue(fileName: string): Promise<void> {
    await this.searchExceptionQueue(fileName);
    const match = this.loc.exceptionGrid().getByText(fileName, { exact: false }).first();
    await expect(match, `Needs Attention queue should list "${fileName}"`).toBeVisible({
      timeout: smokeStepTimeoutMs,
    });
  }
}
