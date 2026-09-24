import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class CommissionTemplatesPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () =>
      this.page
        .getByTestId('commission-templates-title')
        .or(this.page.getByRole('heading', { name: 'Commission Templates', exact: true })),
    typeDropdown: () => this.page.getByTestId('commission-template-type-dropdown'),
    dynamicTable: () => this.page.getByTestId('dynamic-table'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.openSettings();
    await this.sidebar.clickSettingsSubNav(/^Commission Templates$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsCommissionTemplates);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: Commission Templates title + type dropdown + split table. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsCommissionTemplates, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.heading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.typeDropdown()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.dynamicTable()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
}
