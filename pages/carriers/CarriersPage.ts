import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class CarriersPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    headingList: () => this.page.getByRole('heading', { name: 'Carriers', exact: true }),
    headingAdd: () => this.page.getByRole('heading', { name: 'Add carrier', exact: true }),
    addButton: () => this.page.getByTestId('add-carrier-button'),
    saveButton: () => this.page.getByTestId('save-button'),
    cancelButton: () => this.page.getByTestId('cancel-button'),
    carrierNameInput: () => this.page.getByTestId('carrier-name-input'),
    carrierCodeInput: () => this.page.getByTestId('carrier-code-input'),
    carrierTypeDropdown: () => this.page.getByTestId('carrier-type-dropdown'),
    statusDropdown: () => this.page.getByTestId('status-dropdown'),
    notesTextarea: () => this.page.getByTestId('additional-notes-textarea'),
    firstNameInput: () => this.page.getByTestId('first-name-input'),
    lastNameInput: () => this.page.getByTestId('last-name-input'),
    emailInput: () => this.page.getByTestId('email-input'),
    phoneInput: () => this.page.getByTestId('phone-number-input'),
    addressInput: () => this.page.getByTestId('address-input'),
    cityInput: () => this.page.getByTestId('city-input'),
    stateDropdown: () => this.page.getByTestId('state-dropdown'),
    zipInput: () => this.page.getByTestId('zip-code-input'),
    appointmentDateInput: () => this.page.getByTestId('appointment-date-input'),
    lastReviewDateInput: () => this.page.getByTestId('last-review-date-input'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async openList() {
    await this.sidebar.openCarriers();
    await expect(this.page).toHaveURL(AppUrlPatterns.carriers);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  async openCreate() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersCreate);
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async backToList() {
    await this.clickBack();
    await expect(this.page).toHaveURL(AppUrlPatterns.carriers);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openEditFromGrid() {
    const grid = this.grid();
    await expect(grid).toBeVisible();
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersEdit);
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: list heading visibility. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.carriers, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: create heading visibility. */
  async smokeExpectCreateHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersCreate, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /**
   * Smoke-only: open edit via row action kebab when present.
   * Carriers list currently has no Actions column / kebab in the live UI — fall back to row click.
   */
  async smokeOpenEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.page
      .locator(
        '[data-testid^="carrier-actions-"], [data-testid*="carrier"][data-testid*="actions"], [data-testid="actions-hover-wrapper"]',
      )
      .first();
    if (await kebab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
      await expect(this.page).toHaveURL(AppUrlPatterns.carriersEdit, {
        timeout: smokeStepTimeoutMs,
      });
      await waitForAppSettled(this.page);
      return;
    }
    // No kebab in DOM — same landing as row-click edit path.
    await this.openEditFromGrid();
  }
}
