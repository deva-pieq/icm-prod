import { expect, type Locator, type Page } from '@playwright/test';
import {
  buildValidProduct,
  type MandatoryFieldKey,
  type ProductFormData,
} from '../../test-data/products/products';
import { AppUrlPatterns } from '../appPaths';
import { waitForAppSettled } from '../../utils/pageLoader';
import { waitForButtonState } from '../../utils/buttonState';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { ProductsPage } from './ProductsPage';

const T = smokeStepTimeoutMs;

/** Regression-only product flows — does not modify shared ProductsPage behavior. */
export class ProductManagementPage extends ProductsPage {
  readonly regLoc = {
    pageRoot: () => this.page.getByTestId('add-product-page'),
    addButton: () =>
      this.page
        .getByTestId('add-new-product')
        .or(this.page.getByTestId('add-product-button'))
        .or(this.page.getByRole('button', { name: /add product|create product/i })),
    saveButton: () => this.page.getByTestId('save-button'),
    productNameInput: () => this.page.getByTestId('product-name-input').getByRole('textbox'),
    productCodeInput: () => this.page.getByTestId('product-code-input').getByRole('textbox'),
    descriptionTextarea: () => this.page.getByTestId('description-textarea').getByRole('textbox'),
    effectiveDateInput: () =>
      this.page
        .getByTestId('effective-date-input')
        .getByRole('textbox')
        .or(this.page.getByTestId('effective-date-input').locator('input')),
    expiryDateInput: () =>
      this.page
        .getByTestId('expiry-date-input')
        .getByRole('textbox')
        .or(this.page.getByTestId('expiry-date-input').locator('input')),
    aliasInput: () => this.page.getByTestId('product-name-alias-input').getByRole('textbox'),
    addAliasButton: () => this.page.getByTestId('add-alias-button'),
    duplicateAliasError: () => this.page.getByTestId('duplicate-alias-error'),
    aliasesList: () => this.page.getByTestId('product-aliases-list'),
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),
    stateCoverageDropdown: () => this.page.getByTestId('state-coverage-dropdown'),
    slidingNotification: () =>
      this.page
        .locator('[data-sonner-toast], [role="alert"], [class*="toast"], [class*="notification"]')
        .filter({ hasText: /.+/ })
        .or(this.page.getByTestId(/product-form-error-toast/)),
  };

  constructor(page: Page) {
    super(page);
  }

  async gotoDashboard() {
    await this.openListViaUrl();
    await this.expectDashboardReady();
  }

  async expectDashboardReady() {
    await expect(this.loc.headingList()).toBeVisible({ timeout: T });
    await expect(this.regLoc.addButton().first()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async openAddProductForm() {
    await this.regLoc.addButton().first().click();
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.productsCreate, { timeout: T });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: T });
    await expect(this.regLoc.pageRoot()).toBeVisible({ timeout: T });
  }

  async expectOnAddProductForm() {
    await expect(this.page).toHaveURL(AppUrlPatterns.productsCreate, { timeout: T });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: T });
  }

  async expectOnProductsDashboard() {
    await expect(this.page).toHaveURL(AppUrlPatterns.products, { timeout: T });
    await expect(this.loc.headingList()).toBeVisible({ timeout: T });
  }

  protected dropdownTrigger(testId: string): Locator {
    return this.page.getByTestId(testId).getByRole('button').or(this.page.getByTestId(testId)).first();
  }

  async readDropdownLabel(testId: string): Promise<string> {
    const text = await this.page.getByTestId(testId).innerText();
    return text.replace(/\s+/g, ' ').trim();
  }

  async selectDropdownOption(testId: string, optionLabel: string) {
    const trigger = this.dropdownTrigger(testId);
    await expect(trigger).toBeVisible({ timeout: T });
    await trigger.click();
    const option = this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`^${escapeRegex(optionLabel)}$`, 'i') })
      .first();
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page);
  }

  async rapidlyCycleDropdownAndSelectFinal(testId: string, finalLabel: string) {
    const trigger = this.dropdownTrigger(testId);
    await trigger.click();
    const options = this.page.getByRole('listbox').getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: T });
    const count = await options.count();
    const labels: string[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      labels.push((await options.nth(i).innerText()).replace(/\s+/g, ' ').trim());
    }
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);

    for (const label of labels) {
      if (label) await this.selectDropdownOption(testId, label);
    }
    await this.selectDropdownOption(testId, finalLabel);
    await this.expectDropdownShows(testId, finalLabel);
  }

  async expectDropdownShows(testId: string, expectedLabel: string) {
    const trigger = this.dropdownTrigger(testId);
    await expect(trigger).toContainText(new RegExp(escapeRegex(expectedLabel), 'i'), { timeout: T });
  }

  private async fillTextbox(input: Locator, value: string, tabAfter = false) {
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(value);
    if (tabAfter) await input.blur();
    await waitForAppSettled(this.page);
  }

  async fillMandatoryFields(data: ProductFormData, skip?: MandatoryFieldKey) {
    if (skip !== 'carrier') await this.selectDropdownOption('carrier-dropdown', data.carrierName);
    if (skip !== 'line of business') {
      await this.selectDropdownOption('line-of-business-dropdown', data.lineOfBusiness);
    }
    if (skip !== 'product type') await this.selectDropdownOption('product-type-dropdown', data.productType);
    if (skip !== 'product name') await this.fillTextbox(this.regLoc.productNameInput(), data.productName);
    if (skip !== 'product code') await this.fillTextbox(this.regLoc.productCodeInput(), data.productCode);
    await this.selectDropdownOption('status-dropdown', data.status);
  }

  async fillAllMandatoryWithDefaults(overrides?: Partial<ProductFormData>) {
    const data = buildValidProduct(overrides);
    await this.fillMandatoryFields(data);
    return data;
  }

  async setProductName(value: string) {
    await this.fillTextbox(this.regLoc.productNameInput(), value, true);
  }

  async setProductCode(value: string) {
    await this.fillTextbox(this.regLoc.productCodeInput(), value, true);
  }

  async setDescription(value: string) {
    await this.fillTextbox(this.regLoc.descriptionTextarea(), value, true);
  }

  async setEffectiveDate(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        await expect(this.regLoc.effectiveDateInput()).toBeVisible({ timeout: T });
        await this.regLoc.effectiveDateInput().click();
        await this.selectDateInCalendar(value);
        return;
      }
    }
    await this.fillTextbox(this.regLoc.effectiveDateInput(), value, true);
  }

  async setExpiryDate(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        await expect(this.regLoc.expiryDateInput()).toBeVisible({ timeout: T });
        await this.regLoc.expiryDateInput().click();
        await this.selectDateInCalendar(value);
        return;
      }
    }
    await this.fillTextbox(this.regLoc.expiryDateInput(), value, true);
  }

  async enterCarrierProductName(name: string) {
    await this.fillTextbox(this.regLoc.aliasInput(), name);
  }

  async clickAddCarrierProductNameWhenEnabled(isWhiteSpaceOnly: boolean = false) {
    const button = this.regLoc.addAliasButton();
    if (isWhiteSpaceOnly) {
      await expect(button).toBeDisabled({ timeout: T });
      return;
    }
    await expect(button).toBeEnabled({ timeout: T });
    await button.click();
    await waitForAppSettled(this.page);
  }

  async addCarrierProductNameEntry(name: string) {
    await this.enterCarrierProductName(name);
    await this.clickAddCarrierProductNameWhenEnabled();
  }

  async expectDuplicateProductNameError() {
    await this.expectRemainsOnAddProductForm();
    const inline = this.page.getByTestId('product-name-error');
    if (await inline.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(inline).toBeVisible();
      return;
    }
    const toast = this.regLoc
      .slidingNotification()
      .filter({ hasText: /duplicate|already exists|already in use|unique|exist|product name/i })
      .first();
    if (await toast.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(toast).toBeVisible();
      return;
    }
    const text = this.page.getByText(/duplicate|already exists|already in use|unique|exist|product name/i).first();
    if (await text.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(text).toBeVisible();
    }
  }

  async expectSaveButtonEnabled() {
    await expect(this.regLoc.saveButton()).toBeEnabled({ timeout: T });
  }

  async expectSaveButtonDisabled() {
    await expect(this.regLoc.saveButton()).toBeDisabled({ timeout: T });
  }

  async clickSaveProduct() {
    await this.regLoc.saveButton().click();
    const confirm = this.loc.saveChangesConfirm();
    if (await confirm.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirm.first().click();
    }
    await waitForAppSettled(this.page, T);
  }

  async clickSaveProductQuickly(times: number) {
    const save = this.regLoc.saveButton();
    await expect(save).toBeEnabled({ timeout: T });
    for (let i = 0; i < times; i++) {
      await save.click({ force: true });
    }
    const confirm = this.loc.saveChangesConfirm();
    if (await confirm.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirm.first().click();
    }
    await waitForAppSettled(this.page, T);
  }

  async saveValidProduct(data?: ProductFormData): Promise<ProductFormData> {
    const payload = data ?? buildValidProduct();
    await this.fillMandatoryFields(payload);
    await this.expectSaveButtonEnabled();
    await this.clickSaveProduct();
    return payload;
  }

  async createSeedProductOnDashboard(): Promise<ProductFormData> {
    await this.gotoDashboard();
    await this.openAddProductForm();
    return this.saveValidProduct(buildValidProduct());
  }

  async expectProductSavedOnDashboard(productCode: string) {
    await expect(this.page).toHaveURL(AppUrlPatterns.products, { timeout: 60_000 });
    await this.expectDashboardReady();
    await this.searchGrid(productCode);
    const row = await this.findRowByText(productCode);
    expect(row, `Product code "${productCode}" not found in grid`).not.toBeNull();
  }

  async countGridRowsMatching(query: string): Promise<number> {
    await this.searchGrid(query);
    const rows = this.dataRows();
    const count = await rows.count();
    let matching = 0;
    const pattern = new RegExp(escapeRegex(query), 'i');
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      if (pattern.test(text)) matching++;
    }
    return matching;
  }

  async expectExactlyOneGridRowForCode(productCode: string) {
    await expect
      .poll(async () => this.countGridRowsMatching(productCode), { timeout: 30_000, intervals: [500, 1000, 2000] })
      .toBe(1);
  }

  async expectRemainsOnAddProductForm() {
    await this.expectOnAddProductForm();
  }

  async expectValidationBlocksSave() {
    const save = this.regLoc.saveButton();
    if (await waitForButtonState(save, true, 5_000)) {
      await this.clickSaveProduct();
      await this.expectRemainsOnAddProductForm();
      return;
    }
    await expect(save).toBeDisabled({ timeout: T });
    await this.expectRemainsOnAddProductForm();
  }

  async expectProductNameValidationError() {
    await this.expectRemainsOnAddProductForm();
    const inline = this.page.getByTestId('product-name-error');
    if (await inline.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(inline).toBeVisible();
      return;
    }
    await expect(
      this.page.getByText(/max|length|characters|too long|must not exceed|225/i).first(),
    ).toBeVisible({ timeout: T });
  }

  async expectProductNameValidationBlocksSave() {
    const save = this.regLoc.saveButton();
    const enabled = await waitForButtonState(save, true, 5_000);
    if (enabled) {
      await this.clickSaveProduct();
      await this.expectProductNameValidationError();
      return;
    }
    await expect(save).toBeDisabled({ timeout: T });
  }

  async expectMandatoryFieldBlocksSave(_field: MandatoryFieldKey) {
    await this.expectValidationBlocksSave();
  }

  async expectDuplicateProductCodeError() {
    const inline = this.page.getByTestId('product-code-error');
    if (await inline.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(inline).toBeVisible();
      return;
    }
    const toast = this.regLoc
      .slidingNotification()
      .filter({ hasText: /duplicate|already exists|already in use|unique|exist/i })
      .first();
    if (await toast.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(toast).toBeVisible();
      return;
    }
    await this.expectRemainsOnAddProductForm();
    await expect(
      this.page.getByText(/duplicate|already exists|already in use|unique|exist/i).first(),
    ).toBeVisible({ timeout: T });
  }

  async expectDuplicateAliasError() {
    await expect(this.regLoc.duplicateAliasError()).toBeVisible({ timeout: T });
  }

  async expectCarrierAliasListed(name: string) {
    await expect(this.regLoc.aliasesList()).toContainText(name, { timeout: T });
  }

  async expectAddAliasButtonDisabled() {
    await expect(this.regLoc.addAliasButton()).toBeDisabled({ timeout: T });
  }

  async expectDateValidationOnSave() {
    await this.expectSaveButtonEnabled();
    await this.clickSaveProduct();
    await this.expectRemainsOnAddProductForm();
    const dateError = this.page
      .getByTestId(/date-error|expiry-date-error|effective-date-error/i)
      .or(this.page.getByText(/expiry|effective|date.*before|invalid.*date/i))
      .first();
    await expect(dateError).toBeVisible({ timeout: T });
  }

  async expectInvalidDataBlocksSave() {
    await this.expectValidationBlocksSave();
  }

  async selectStatesFromCoverage(states: string[]) {
    const trigger = this.regLoc.stateCoverageDropdown();
    await expect(trigger).toBeVisible({ timeout: T });
    await trigger.click();
    await waitForAppSettled(this.page);
    for (const state of states) {
      const option = this.page
        .getByRole('option', { name: new RegExp(`^${escapeRegex(state)}$`, 'i') })
        .or(this.page.getByRole('checkbox', { name: new RegExp(`^${escapeRegex(state)}$`, 'i') }))
        .first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      }
    }
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
