import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled, waitForLoaderHidden } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

const T = smokeStepTimeoutMs;

export class LedgerPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () =>
      this.page
        .locator('main')
        .getByRole('heading', { name: /^ledger$/i })
        .or(this.page.locator('main').getByText(/^ledger$/i))
        .first(),
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
      AppUrlPatterns.ledger.test(this.page.url()) &&
      (await this.loc.heading().isVisible().catch(() => false))
    );
  }

  /** Same strategy as Book of Business — avoid flaky Agent Insights expand after role login. */
  async open() {
    if (await this.isReady()) {
      // Already on route: force a clean shell load (half-loaded agent insights is common).
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await waitForAppSettled(this.page, T);
      if (await this.isReady()) {
        await expect(this.page).toHaveURL(AppUrlPatterns.ledger, { timeout: T });
        await expect(this.loc.heading()).toBeVisible({ timeout: T });
        return;
      }
    }

    await this.gotoAndWait('/ledger');
    if (!(await this.isReady())) {
      await this.sidebar.openLedger();
      await waitForAppSettled(this.page, T);
    }

    await expect(this.page).toHaveURL(AppUrlPatterns.ledger, { timeout: T });
    await ensurePageReady(this.page, this.loc.heading(), { timeout: T });
  }

  /** Smoke-only: Ledger heading + grid. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.ledger, { timeout: T });
    await this.smokeExpectHeading();
    await this.smokeExpectGrid();
  }

  async smokeExpectHeading() {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async smokeExpectGrid() {
    await expect(this.grid()).toBeVisible({ timeout: T });
  }
}
