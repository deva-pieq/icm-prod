import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

/**
 * Commission Management / Commission Setup landing (`/commissions`).
 * Used for agency-owner sidebar parity where Statement Setup nav is absent.
 */
export class CommissionManagementPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    pageRoot: () => this.page.getByTestId('commission-component'),
    heading: () =>
      this.page
        .getByRole('heading', { name: /^Commission Management$/i })
        .or(this.page.getByRole('heading', { name: /^Commission Structure$/i })),
    addCarrierButton: () => this.page.getByTestId('add-carrier-button'),
    tree: () => this.page.getByTestId('tree'),
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.openCommissionSetup();
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionManagement, {
      timeout: smokeStepTimeoutMs,
    });
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
  }

  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionManagement, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.heading().first()).toBeVisible({ timeout: smokeStepTimeoutMs });
    if (await this.loc.pageRoot().isVisible().catch(() => false)) {
      await expect(this.loc.pageRoot()).toBeVisible({ timeout: smokeStepTimeoutMs });
    }
    if (await this.loc.addCarrierButton().first().isVisible().catch(() => false)) {
      await expect(this.loc.addCarrierButton().first()).toBeVisible({ timeout: smokeStepTimeoutMs });
    }
  }
}
