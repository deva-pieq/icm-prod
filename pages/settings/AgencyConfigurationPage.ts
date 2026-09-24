import { expect, type Page } from '@playwright/test';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class AgencyConfigurationPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () => this.page.getByRole('heading', { name: 'Agency Configurations' }),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.openAgencySettings();
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: Agency Configurations heading. */
  async smokeExpectHeader() {
    await expect(this.loc.heading()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
}
