import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class StatementSetupPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    pageRoot: () => this.page.getByTestId('commission-statement-setup-page'),
    headingList: () =>
      this.page
        .getByTestId('commission-statement-setup-title')
        .or(this.page.getByTestId('commission-statement-setup'))
        .or(this.page.getByTestId(/commission-statement-setup-title/i)),
    headingCreate: () => this.page.getByRole('heading', { name: 'Create New Setup', exact: true }),
    createSetupButton: () => this.page.getByTestId('create-setup-button-top'),
    allSetupsTab: () => this.page.getByTestId('commission-statement-setup-tabs-tab-all-setups'),
    createSetupTab: () => this.page.getByTestId('commission-statement-setup-tabs-tab-create-setup'),
    setupsGrid: () => this.page.getByTestId('setups-datagrid'),
    searchInput: () => this.page.getByTestId('data-grid-search-input'),
    commissionStructureLink: () =>
      this.page
        .getByRole('button', { name: /commission structure/i })
        .or(this.page.getByRole('link', { name: /commission structure/i })),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async openList() {
    await this.sidebar.openCommissionStatementSetup();
    await expect(this.page).toHaveURL(AppUrlPatterns.statementSetup);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  async openCreate() {
    await this.loc.createSetupButton().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.headingCreate()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async backToList() {
    // back icon is not available here
    // await this.clickBack();
    // so click all setup tabs
    await this.loc.allSetupsTab().click()
    await waitForAppSettled(this.page)
    await expect(this.page).toHaveURL(AppUrlPatterns.statementSetup);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openEditFromGrid() {
    await super.openEditFromGrid();
    await expect(this.page).toHaveURL(AppUrlPatterns.statementSetupEdit);
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: list page shell — title, create CTA, tabs, grid, search. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.statementSetup, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.createSetupButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.allSetupsTab()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.setupsGrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: create setup heading (+ create tab when present). */
  async smokeExpectCreateHeader() {
    await expect(this.loc.headingCreate()).toBeVisible({ timeout: smokeStepTimeoutMs });
    if (await this.loc.createSetupTab().isVisible().catch(() => false)) {
      await expect(this.loc.createSetupTab()).toBeVisible();
    }
  }

  /** Smoke-only: edit URL reached from grid. */
  async smokeExpectEditHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.statementSetupEdit, {
      timeout: smokeStepTimeoutMs,
    });
  }
}
