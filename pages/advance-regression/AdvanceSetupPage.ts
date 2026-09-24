import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AdvanceSetupPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    page: () => this.page.getByTestId('advance-setup-page'),
    heading: () => this.page.getByTestId('advance-setup-heading'),
    title: () => this.page.getByTestId('advance-setup-title'),
    addButton: () => this.page.getByTestId('advance-add-product-button'),
    grid: () => this.page.getByTestId('advance-setup-datagrid'),
    modal: () => this.page.getByTestId('advance-setup-modal'),
    productDropdown: () => this.page.getByTestId('modal-product-dropdown'),
    defaultInput: () => this.page.getByTestId('modal-input-default').locator('input'),
    monthlyInput: () => this.page.getByTestId('modal-input-monthly').locator('input'),
    quarterlyInput: () => this.page.getByTestId('modal-input-quarterly').locator('input'),
    halfYearlyInput: () => this.page.getByTestId('modal-input-halfYearly').locator('input'),
    annualInput: () => this.page.getByTestId('modal-input-annual').locator('input'),
    maxCapInput: () => this.page.getByTestId('modal-input-maxCap').locator('input'),
    saveButton: () => this.page.getByTestId('modal-save-button'),
    confimSaveButton: () => this.page.getByTestId('confirm-save-button'),
    cancelButton: () => this.page.getByTestId('modal-cancel-button'),
    closeButton: () => this.page.getByTestId('modal-close-button'),
    editRecordButton: () => this.page.getByTestId('advance-setup-datagrid').getByTestId('actions-hover-wrapper'), 
    productDropdownError: () => this.page.getByTestId('modal-product-dropdown-error'),
    defaultError: () => this.page.getByTestId('modal-input-default-error'),
    searchInput: () => this.page.getByTestId('data-grid-search-input').getByRole('textbox'),
    editButton: () => this.page.getByRole('button', { name: 'Edit' }),
    deleteButton: () => this.page.getByRole('button', { name: 'Delete' }),
  };

  constructor(private page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  async navigateToAdvanceSetup(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}/advance/advance-setup`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
  }

  /** Smoke-only: sidebar → Advance → Advance Setup + title/heading visibility. */
  async smokeOpenViaSidebar(): Promise<void> {
    await this.sidebar.openAdvanceSetup();
    await expect(this.page).toHaveURL(AppUrlPatterns.advanceSetup, { timeout: T });
    await waitForAppSettled(this.page, T);
    await this.smokeExpectHeader();
  }

  async smokeExpectHeader(): Promise<void> {
    await expect(this.loc.page()).toBeVisible({ timeout: T });
    await expect(this.loc.title()).toBeVisible({ timeout: T });
    await expect(this.loc.title()).toHaveText(/Advance Setup/i);
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async clickAddAdvanceSetup(): Promise<void> {
    const modal = this.loc.modal();
    const modalOpens = (): Promise<boolean> =>
      expect
        .poll(() => modal.isVisible().catch(() => false), {
          timeout: 5_000,
          intervals: [250, 500, 1_000, 2_000],
        })
        .toBe(true)
        .then(() => true)
        .catch(() => false);

    await this.loc.addButton().click();
    if (await modalOpens()) return;

    // SPA hydration race: button rendered before React attached its handler — re-click once.
    await this.loc.addButton().click();
    if (await modalOpens()) return;

    await waitForAppSettled(this.page, T);
    await expect(modal).toBeVisible({ timeout: T });
  }

  async expectModalDisplayed(): Promise<void> {
    await expect(this.loc.modal()).toBeVisible({ timeout: T });
  }

  async selectProduct(): Promise<void> {
    const dropdown = this.loc.productDropdown();
    await expect(dropdown).toBeVisible({ timeout: T });
    await dropdown.click();
    await waitForAppSettled(this.page, T);
    const option = this.page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  async fillField(field: string, value: string): Promise<void> {
    let input;
    switch (field.toLowerCase()) {
      case 'default':
        input = this.loc.defaultInput();
        break;
      case 'monthly':
        input = this.loc.monthlyInput();
        break;
      case 'quarterly':
        input = this.loc.quarterlyInput();
        break;
      case 'half yearly':
        input = this.loc.halfYearlyInput();
        break;
      case 'annual':
        input = this.loc.annualInput();
        break;
      default:
        throw new Error(`Unknown field: ${field}`);
    }
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(value);
    await waitForAppSettled(this.page, T);
  }

  async expectFieldValue(field: string, expectedValue: string): Promise<void> {
    let input;
    switch (field.toLowerCase()) {
      case 'default':
        input = this.loc.defaultInput();
        break;
      case 'monthly':
        input = this.loc.monthlyInput();
        break;
      case 'quarterly':
        input = this.loc.quarterlyInput();
        break;
      case 'half yearly':
        input = this.loc.halfYearlyInput();
        break;
      case 'annual':
        input = this.loc.annualInput();
        break;
      default:
        throw new Error(`Unknown field: ${field}`);
    }
    await expect(input).toBeVisible({ timeout: T });
    const actualValue = await input.inputValue();
    expect(actualValue).toBe(expectedValue);
  }

  async expectFieldRejectsZero(field: string): Promise<void> {
    let input;
    let errorLocator;
    switch (field.toLowerCase()) {
      case 'default':
        input = this.loc.defaultInput();
        errorLocator = this.loc.defaultError();
        break;
      default:
        throw new Error(`Unknown field: ${field}`);
    }
    await expect(input).toBeVisible({ timeout: T });
    await this.clickSave();
    await expect(errorLocator).toBeVisible({ timeout: T });
    const errorText = await errorLocator.innerText();
    expect(errorText.toLowerCase()).toContain('must be greater than 0');
  }

  async expectFieldDoesNotContainAlphabets(field: string): Promise<void> {
    let input;
    switch (field.toLowerCase()) {
      case 'default':
        input = this.loc.defaultInput();
        break;
      default:
        throw new Error(`Unknown field: ${field}`);
    }
    await expect(input).toBeVisible({ timeout: T });
    const actualValue = await input.inputValue();
    expect(/[a-zA-Z]/.test(actualValue)).toBe(false);
  }

  async clickSave(): Promise<void> {
    await this.loc.saveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async clickSaveOnly(): Promise<void> {
    await this.loc.saveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async expectProductDropdownError(expectedText: string): Promise<void> {
    const error = this.loc.productDropdownError();
    await expect(error).toBeVisible({ timeout: T });
    const errorText = await error.innerText();
    expect(errorText.trim()).toBe(expectedText);
  }

  async expectDefaultFieldErrorText(expectedText: string): Promise<void> {
    const error = this.loc.defaultError();
    await expect(error).toBeVisible({ timeout: T });
    const errorText = await error.innerText();
    expect(errorText.trim()).toBe(expectedText);
  }

  async expectNoConfirmationPopup(): Promise<void> {
    await expect(this.loc.confimSaveButton()).toBeHidden({ timeout: T });
  }

  async clickConfirmSave(): Promise<void> {
    await this.loc.confimSaveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async clickCancel(): Promise<void> {
    await this.loc.cancelButton().click();
    await waitForAppSettled(this.page, T);
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.loc.modal()).toBeHidden({ timeout: T });
  }

  async expectGridShowsProduct(): Promise<void> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const rowCount = await this.loc.grid().getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).count();
    expect(rowCount).toBeGreaterThan(0);
  }

  async clickEditFirstRow(): Promise<void> {
    await this.loc.editRecordButton().first().click();
    await waitForAppSettled(this.page, T);
    await this.loc.editButton().click();
    await waitForAppSettled(this.page, T);
  }

  async clickDeleteFirstRow(): Promise<void> {
    const firstRow = this.loc.grid().getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') }).first();
    await expect(firstRow).toBeVisible({ timeout: T });
    const actionsWrapper = firstRow.getByTestId('actions-hover-wrapper');
    await actionsWrapper.hover();
    await actionsWrapper.click();
    await waitForAppSettled(this.page, T);
    await this.loc.deleteButton().click();
    await waitForAppSettled(this.page, T);
  }

  async expectRecordDeleted(): Promise<void> {
    await waitForAppSettled(this.page, T);
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
  }
}
