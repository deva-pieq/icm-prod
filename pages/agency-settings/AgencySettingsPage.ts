import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

const T = smokeStepTimeoutMs;

export class AgencySettingsPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc: {
    heading: () => Locator;
    subtitle: () => Locator;
    achSection: () => Locator;
    paymentProcessingSection: () => Locator;
    saveButton: () => Locator;
    cancelButton: () => Locator;
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
    this.loc = {
      heading: () => this.page.getByRole('heading', { name: 'Agency Configurations' }),
      subtitle: () => this.page.getByText('Manage agency settings'),
      achSection: () => this.page.getByTestId('agency-config-section-ach'),
      paymentProcessingSection: () => this.page.getByTestId('agency-config-section-payment-processing'),
      saveButton: () => this.page.getByTestId('agency-config-save-button'),
      cancelButton: () => this.page.getByTestId('agency-config-cancel-button'),
    };
  }

  async open() {
    await this.sidebar.openAgencySettings();
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsAgencySettings);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: T });
  }

  /** Assert heading is visible — side-effect-free read-only check. */
  async expectHeadingVisible() {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }
}
