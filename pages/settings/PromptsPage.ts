import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class PromptsPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () =>
      this.page
        .getByTestId('prompts-library-title')
        .or(this.page.getByRole('heading', { name: /prompts management/i })),
    pageRoot: () => this.page.getByTestId('prompts-library-page'),
    datagrid: () => this.page.getByTestId('prompts-datagrid'),
    createButton: () => this.page.getByTestId('create-carrier-prompt-button'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.openSettings();
    await this.sidebar.clickSettingsSubNav(/^Prompts$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsPrompts);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: Prompts Management title + page + grid + create CTA. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsPrompts, {
      timeout: smokeStepTimeoutMs,
    });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.heading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.createButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.datagrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }
}
