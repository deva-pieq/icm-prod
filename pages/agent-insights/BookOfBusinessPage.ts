import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled, waitForLoaderHidden } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

const T = smokeStepTimeoutMs;

export class BookOfBusinessPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () =>
      this.page.locator('main').getByRole('heading', { name: 'Book of Business', level: 1 }),
    searchInput: () => this.page.getByTestId('data-grid-search-input'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  private async gotoAndWait(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await waitForLoaderHidden(this.page, T);
    await waitForAppSettled(this.page, T);
  }

  private async isReady(): Promise<boolean> {
    return (
      AppUrlPatterns.bookOfBusiness.test(this.page.url()) &&
      (await this.loc.heading().isVisible().catch(() => false))
    );
  }

  /**
   * Prefer direct URL navigation after agent login — Agent Insights sub-nav expand is flaky.
   * If the shell is half-loaded, reload once and wait for loaders to clear.
   */
  async open() {
    if (await this.isReady()) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await waitForAppSettled(this.page, T);
      if (await this.isReady()) {
        await expect(this.page).toHaveURL(AppUrlPatterns.bookOfBusiness, { timeout: T });
        await expect(this.loc.heading()).toBeVisible({ timeout: T });
        return;
      }
    }

    await this.gotoAndWait('/book-of-business');
    if (!(await this.isReady())) {
      await this.sidebar.openBookOfBusiness();
      await waitForAppSettled(this.page, T);
    }

    await expect(this.page).toHaveURL(AppUrlPatterns.bookOfBusiness, { timeout: T });
    await ensurePageReady(this.page, this.loc.heading(), { timeout: T });
  }

  /** Smoke-only: Book of Business heading + grid (+ search when present). */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.bookOfBusiness, { timeout: T });
    await this.smokeExpectHeading();
    await this.smokeExpectGrid();
    if (await this.loc.searchInput().isVisible().catch(() => false)) {
      await expect(this.loc.searchInput()).toBeVisible();
    }
  }

  async smokeExpectHeading() {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async smokeExpectGrid() {
    await expect(this.grid()).toBeVisible({ timeout: T });
  }
}
