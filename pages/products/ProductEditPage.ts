import { expect, type Locator } from '@playwright/test';
import {
  ALTERNATE_LOB,
  DEFAULT_LOB,
  DEFAULT_STATUS,
  INACTIVE_STATUS,
} from '../../test-data/products/products';
import { getSeedProduct, getLastSavedProduct, getSeedProductEditUrl } from '../../utils/products/productContext';
import { AppUrlPatterns } from '../appPaths';
import { waitForAppSettled } from '../../utils/pageLoader';
import { waitForButtonState } from '../../utils/buttonState';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { ProductManagementPage } from './ProductManagementPage';

const T = smokeStepTimeoutMs;

/** Edit-product flows — reuses form helpers from ProductManagementPage without changing add-product behavior. */
export class ProductEditPage extends ProductManagementPage {
  readonly editLoc = {
    pageRoot: () =>
      this.page
        .getByTestId('edit-product-page')
        .or(this.page.getByTestId('add-product-page')),
    renewalToggle: () =>
      this.page.getByRole('switch', { name: /Apply Latest Commission/i }),
    carrierProductNameField: () =>
      this.regLoc
        .aliasInput()
        .or(this.regLoc.aliasesList().getByRole('textbox').first()),
  };

  async openEditByFirstGridRow() {
    await this.openGridRecordAt(0);
    await this.expectOnEditProductPage();
  }

  async openEditViaKebabMenu() {
    await this.openEditFromGrid();
    await this.expectOnEditProductPage();
  }

  async openEditForSeedProduct() {
    const { productCode } = getSeedProduct();
    await this.openEditForProductCode(productCode);
  }

  async gotoSeedProductEdit() {
    await this.page.goto(getSeedProductEditUrl());
    await this.expectOnEditProductPage();
  }

  async openEditForLastSavedProduct() {
    const { productCode } = getLastSavedProduct();
    await this.openEditForProductCode(productCode);
  }

  async openEditForProductCode(productCode: string) {
    await this.searchGrid(productCode);
    const row = await this.findRowByText(productCode);
    expect(row, `Product code "${productCode}" not found in grid`).not.toBeNull();
    await row!.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await waitForAppSettled(this.page, T);
    await this.expectOnEditProductPage();
  }

  async expectOnEditProductPage() {
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit, { timeout: T });
    await expect(this.editLoc.pageRoot()).toBeVisible({ timeout: T });
  }

  async expectCarrierAndProductTypeNotEditable() {
    await this.expectDropdownNotEditable('carrier-dropdown');
    await this.expectDropdownNotEditable('product-type-dropdown');
  }

  private async expectDropdownNotEditable(testId: string) {
    const trigger = this.dropdownTrigger(testId).locator('//button').first();
    await expect(trigger).toBeDisabled({ timeout: T });
  }

  async selectDifferentLineOfBusiness(): Promise<string> {
    const current = await this.readDropdownLabel('line-of-business-dropdown');
    const target =
      current.toLowerCase().includes(ALTERNATE_LOB.toLowerCase()) ? DEFAULT_LOB : ALTERNATE_LOB;
    await this.selectDropdownOption('line-of-business-dropdown', target);
    return target;
  }

  async toggleStatusBetweenActiveAndInactive(): Promise<string> {
    const current = await this.readDropdownLabel('status-dropdown');
    const target = current.toLowerCase().includes('inactive') ? DEFAULT_STATUS : INACTIVE_STATUS;
    await this.selectDropdownOption('status-dropdown', target);
    return target;
  }

  async enableRenewalCommissionToggle() {
    const toggle = this.editLoc.renewalToggle();
    await expect(toggle).toBeVisible({ timeout: T });
    if (!(await toggle.isChecked())) {
      await toggle.click();
      await waitForAppSettled(this.page);
    }
  }

  async setCarrierProductNameOnEdit(value: string) {
    if(value==="   ") {
      await this.clickAddCarrierProductNameWhenEnabled(true);
      return;
    }
    const field = this.editLoc.carrierProductNameField();
    if (await this.regLoc.aliasesList().isVisible().catch(() => false)) {
      const listed = this.regLoc.aliasesList().getByRole('textbox').first();
      if (await listed.isVisible().catch(() => false)) {
        await this.fillTextboxOnEdit(listed, value);
        return;
      }
    }
    await this.addCarrierProductNameEntry(value);
  }

  async clearEffectiveDate() {
    await this.clearDateInput('effective-date-input');
  }

  async clearExpiryDate() {
    await this.clearDateInput('expiry-date-input');
  }

  private async clearDateInput(dateTestId: string) {
    const wrapper = this.page.getByTestId(dateTestId);
    const input = wrapper.locator('input');
    await expect(input).toBeVisible({ timeout: T });
    await input.click();
    const popup = this.page.getByTestId(`${dateTestId}-calendar-popup`);
    await expect(popup).toBeVisible({ timeout: T });
    const clearBtn = this.page.getByTestId(`${dateTestId}-calendar-clear`);
    await expect(clearBtn).toBeVisible({ timeout: T });
    await clearBtn.click();
    await waitForAppSettled(this.page);
  }

  private async fillTextboxOnEdit(input: Locator, value: string) {
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(value);
    await input.blur();
    await waitForAppSettled(this.page);
  }

  async toggleStateInCoverage() {
    const trigger = this.regLoc.stateCoverageDropdown();
    await expect(trigger).toBeVisible({ timeout: T });
    await trigger.click();
    await waitForAppSettled(this.page);
    const option = this.page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: T });
    const label = (await option.innerText()).replace(/\s+/g, ' ').trim();
    await option.click();
    await waitForAppSettled(this.page);
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);

    await trigger.click();
    await waitForAppSettled(this.page);
    const deselect = this.page
      .getByRole('option', { name: new RegExp(`^${escapeRegex(label)}$`, 'i') })
      .first();
    if (await deselect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deselect.click();
    }
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
  }

  async expectRemainsOnEditProductPage() {
    await this.expectOnEditProductPage();
  }

  async expectEditValidationBlocksSave() {
    const save = this.regLoc.saveButton();
    if (await waitForButtonState(save, true, 5_000)) {
      await this.clickSaveProduct();
      await this.expectRemainsOnEditProductPage();
      return;
    }
    await expect(save).toBeDisabled({ timeout: T });
    await this.expectRemainsOnEditProductPage();
  }

  async expectEditedProductSavedOnDashboard(productCode: string) {
    await this.expectProductSavedOnDashboard(productCode);
  }

  async expectCarrierProductNameSlidingNotification() {
    const toast = this.regLoc
      .slidingNotification()
      .filter({ hasText: /225|max|length|characters|too long/i })
      .first();
    await expect(toast).toBeVisible({ timeout: T });
  }

  async expectDuplicateProductNameErrorOnEdit() {
    await this.expectRemainsOnEditProductPage();
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
    await expect(
      this.page.getByText(/duplicate|already exists|already in use|unique|exist|product name/i).first(),
    ).toBeVisible({ timeout: T });
  }

  async expectDuplicateProductCodeErrorOnEdit() {
    await this.expectRemainsOnEditProductPage();
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
    await expect(
      this.page.getByText(/duplicate|already exists|already in use|unique|exist/i).first(),
    ).toBeVisible({ timeout: T });
  }

  async expectDuplicateCarrierProductNameErrorOnEdit() {
    await this.expectRemainsOnEditProductPage();
    const inline = this.regLoc.duplicateAliasError();
    if (await inline.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(inline).toBeVisible();
      return;
    }
    const toast = this.regLoc
      .slidingNotification()
      .filter({ hasText: /duplicate|already exists|already in use|carrier product name/i })
      .first()
      .or(this.page.getByTestId('product-aliases-backend-error'));
    await expect(toast).toBeVisible({ timeout: T });
  }

  async expectOverMaxLengthBlocksSaveOnEdit(field: string) {
    if (field.toLowerCase() === 'carrier product name') {
      await this.clickSaveProduct();
      await this.expectCarrierProductNameSlidingNotification();
      return;
    }
    await this.expectEditValidationBlocksSave();
  }

  async expectDateValidationOnEditSave() {
    await this.expectSaveButtonEnabled();
    await this.clickSaveProduct();
    await this.expectRemainsOnEditProductPage();
    const dateError = this.page
      .getByTestId(/date-error|expiry-date-error|effective-date-error/i)
      .or(this.page.getByText(/expiry|effective|date.*before|invalid.*date/i))
      .first();
    await expect(dateError).toBeVisible({ timeout: T });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
