import { expect, type Locator, type Page } from '@playwright/test';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';
import type { HappyFlowProductData } from '../../test-data/happy-flow/happyFlow001';

const T = smokeStepTimeoutMs;

export class ProductsPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    headingList: () => this.page.getByRole('heading', { name: 'Products', exact: true }),
    headingAdd: () => this.page.getByRole('heading', { name: 'Add Product', exact: true }),
    addButton: () =>
      this.page
        .getByTestId('add-new-product')
        .or(this.page.getByTestId('add-product-button'))
        .or(this.page.getByRole('button', { name: /add product|create product/i })),
    productsTable: () =>
      this.page.getByTestId('products-table').or(this.page.getByRole('grid', { name: 'Data grid' })),
    createPageRoot: () => this.page.getByTestId('add-product-page'),
    editPageRoot: () => this.page.getByTestId('edit-product-page'),
    productActionsKebab: () => this.page.locator('[data-testid^="product-actions-"]'),
    saveButton: () => this.page.getByRole('button', { name: /^save$/i }),
    saveChangesConfirm: () =>
      this.page
        .getByRole('dialog')
        .getByRole('button', { name: /^save$/i })
        .or(this.page.getByRole('button', { name: /^save changes$/i })),
    commissionStructureLink: () =>
      this.page
        .getByTestId('edit-product-tabs-tab-commission-structure')
        .or(this.page.getByRole('button', { name: /commission structure/i }))
        .or(this.page.getByRole('link', { name: /commission structure/i })),
    sectionCommissionStructure: () =>
      this.page.getByRole('heading', { name: /commission structure/i }).first(),
    productNameInput: () => this.page.getByTestId('product-name-input').getByRole('textbox'),
    productCodeInput: () => this.page.getByTestId('product-code-input').getByRole('textbox'),
    effectiveDateInput: () =>
      this.page
        .getByTestId('effective-date-input')
        .getByRole('textbox')
        .or(this.page.getByTestId('effective-date-input').locator('input')),
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),
    carrierProductNameInput: () => this.page.getByPlaceholder(/enter carrier product name/i),
    statusChip: (label: string) =>
      this.page.getByText(label, { exact: true }).or(this.page.locator(`[class*="chip"]:has-text("${label}")`)),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async openProductsPage() {
    await this.openList();
  }

  async clickAddProduct() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
  }

  async expectOnProductsDashboard() {
    await expect(this.loc.headingList()).toBeVisible();
  }

  async openList() {
    await this.sidebar.openProducts();
    await this.expectOnProductsList();
  }

  async openListViaUrl() {
    await this.page.goto(new URL(AppPaths.products, this.page.url()).href, {
      waitUntil: 'domcontentloaded',
    });
    await this.expectOnProductsList();
  }

  private async expectOnProductsList() {
    await expect(this.page).toHaveURL(AppUrlPatterns.products, { timeout: T });
    await waitForAppSettled(this.page, T);
    await expect(this.loc.headingList()).toBeVisible({ timeout: T });
  }

  async openCreate() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.productsCreate);
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: T });
  }

  async backToList() {
    await this.clickBack();
    await expect(this.page).toHaveURL(AppUrlPatterns.products);
    await expect(this.loc.headingList()).toBeVisible({ timeout: T });
  }

  async openEditFromGrid() {
    await super.openEditFromGrid();
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit);
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: list URL + Products heading + grid visibility. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.products, { timeout: T });
    await expect(this.loc.headingList()).toBeVisible({ timeout: T });
    await expect(this.loc.productsTable()).toBeVisible({ timeout: T });
  }

  /** Smoke-only: create URL + Add Product heading + form root. */
  async smokeExpectCreateHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.productsCreate, { timeout: T });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: T });
    await expect(this.loc.createPageRoot()).toBeVisible({ timeout: T });
  }

  /** Smoke-only: edit URL + edit-product-page root + non-empty page heading. */
  async smokeExpectEditHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit, { timeout: T });
    await expect(this.loc.editPageRoot()).toBeVisible({ timeout: T });
    const heading = this.page.locator('h1:not([data-testid="sidebar-title"])').first();
    await expect(heading).toBeVisible({ timeout: T });
    await expect(heading).not.toHaveText(/^\s*$/);
  }

  /** Smoke-only: open edit by clicking the first grid data row (not kebab). */
  async smokeOpenEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    expect(opened, 'Products grid has no data row to open for smoke edit').toBe(true);
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit, { timeout: T });
    await waitForAppSettled(this.page, T);
    await this.smokeExpectEditHeader();
  }

  /** Smoke-only: open edit via first row action kebab → Edit. */
  async smokeOpenEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.productActionsKebab().first();
    if (await kebab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      expect(opened, 'Products grid has no data row to open for smoke edit').toBe(true);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit, { timeout: T });
    await waitForAppSettled(this.page, T);
    await this.smokeExpectEditHeader();
  }

  async openCommissionStructure() {
    const link = this.loc.commissionStructureLink();
    await expect(link.first()).toBeVisible({ timeout: T });
    await link.first().click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.productCommissionStructure);
    await expect(this.loc.sectionCommissionStructure()).toBeVisible({ timeout: T });
  }

  async saveProduct() {
    await expect(this.loc.saveButton()).toBeEnabled();
    await this.loc.saveButton().click();
    const confirm = this.loc.saveChangesConfirm();
    if (await confirm.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirm.first().click();
    }
    await this.page.waitForURL(
      new RegExp(`${AppUrlPatterns.productsEdit.source}|${AppUrlPatterns.products.source}`),
    );
    await waitForAppSettled(this.page);
  }

  async openProductFromGridByName(productName: string) {
    if (!AppUrlPatterns.products.test(this.page.url())) {
      await this.openList();
    }
    const row = await this.findRowByText(productName);
    expect(row, `Product "${productName}" not found in grid`).not.toBeNull();
    await row!.click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit);
  }

  async fillMandateFields(data: HappyFlowProductData) {
    await this.selectDropdownByLabel(data.carrierName, 'carrier-dropdown');
    await this.selectDropdownByLabel(data.lineOfBusiness, 'line-of-business-dropdown');
    await this.selectDropdownByLabel(data.productType, 'product-type-dropdown');
    await this.fillInput(this.loc.productNameInput(), data.productName);
    await this.fillInput(this.loc.productCodeInput(), data.productCode);
    await this.addCarrierProductName(data.carrierProductName);
    await this.setEffectiveDate(data.effectiveDate);
  }

  /** MM/DD/YYYY via react-calendar popup — the app does not accept manual date typing (readonly input). */
  protected async setEffectiveDate(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        await expect(this.loc.effectiveDateInput()).toBeVisible({ timeout: T });
        await this.loc.effectiveDateInput().click();
        await this.selectDateInCalendar(value);
        return;
      }
    }
    await this.fillInput(this.loc.effectiveDateInput(), value, true);
  }

  /** Pick MM/DD/YYYY via react-calendar. Same pattern as ProductManagementPage date fills. */
  protected async selectDateInCalendar(dateStr: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) throw new Error(`Expected MM/DD/YYYY date, got: ${dateStr}`);
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) throw new Error(`Invalid calendar date: ${dateStr}`);

    const popup = this.loc.calendarPopup();
    await expect(popup).toBeVisible({ timeout: T });

    const navLabel = popup.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }

    let yearClicked = false;
    for (let i = 0; i < 24; i++) {
      const yearTile = popup
        .locator('button.react-calendar__tile')
        .filter({ hasText: new RegExp(`^${year}$`) });
      if ((await yearTile.count()) > 0 && (await yearTile.first().isVisible().catch(() => false))) {
        await yearTile.first().click();
        yearClicked = true;
        break;
      }
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      const range = labelText.match(/(\d{4})\s*[–-]\s*(\d{4})/);
      if (!range) throw new Error(`Calendar not in decade view while seeking year ${year}`);
      const start = Number(range[1]);
      if (year < start) {
        await popup.locator('.react-calendar__navigation__prev-button').click();
      } else {
        await popup.locator('.react-calendar__navigation__next-button').click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) throw new Error(`Could not find year ${year} in calendar`);
    await this.page.waitForTimeout(150);

    await popup.getByRole('button', { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);

    const dayBtn = popup
      .locator(
        'button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)',
      )
      .filter({ hasText: new RegExp(`^${day}$`) });
    await expect(dayBtn, `Day ${day} should be unique in calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
    await waitForAppSettled(this.page, T);
  }

  async expectDocumentLoaded() {
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(
      new RegExp(`${AppUrlPatterns.productsEdit.source}|${AppUrlPatterns.products.source}`),
    );
  }

  async expectEditPageTitleContains(productName: string) {
    const title = this.page.getByRole('heading').filter({ hasText: new RegExp(escapeRegex(productName), 'i') });
    await expect(title.first()).toBeVisible();
  }

  async expectStatusChip(status: string) {
    await expect(this.loc.statusChip(status).first()).toBeVisible();
  }

  private async selectDropdownByLabel(optionLabel: string, testId: string) {
    const field = this.page.getByTestId(testId).getByRole('button').or(this.page.getByTestId(testId));
    const trigger = field.first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    const option = this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`^${escapeRegex(optionLabel)}$`, 'i') })
      .first();
    await expect(option).toBeVisible();
    await option.click();
    await waitForAppSettled(this.page);
  }

  private async fillInput(input: Locator, value: string, tabAfter = false) {
    await expect(input).toBeVisible();
    await input.fill(value);
    if (tabAfter) {
      await this.page.keyboard.press('Tab');
    }
    await waitForAppSettled(this.page);
  }

  private async addCarrierProductName(name: string) {
    await this.fillInput(this.loc.carrierProductNameInput(), name);
    const addBtn = this.page
      .locator('div')
      .filter({ has: this.page.getByText(/carrier product name/i) })
      .getByRole('button', { name: /^add$/i })
      .first();
    if (await addBtn.isEnabled().catch(() => false)) {
      await addBtn.click();
      await waitForAppSettled(this.page);
    }
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
