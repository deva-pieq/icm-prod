import { expect, type Locator, type Page } from '@playwright/test';
import {
  buildValidCarrier,
  CARRIER_STATUS_OPTIONS,
  CARRIER_TYPE_OPTIONS,
  CSV_LIST_COLUMNS,
  DUPLICATE_CODE_ERROR,
  EMAIL_ERROR,
  LIST_COLUMNS,
  LIST_STATUS_FILTER_OPTIONS,
  NAME_LETTERS_SPACES_ERROR,
  NAME_MAX_LENGTH_ERROR,
  NO_RECORDS_TEXT,
  SORT_SAMPLE_ROWS,
  NOTES_OVER_MAX_ERROR,
  REVIEW_AFTER_APPOINTMENT_ERROR,
  type CarrierFormData,
} from '../../test-data/carriers/carriers';
import { AppUrlPatterns } from '../appPaths';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { escapeRegex } from '../../utils/escapeRegex';
import { CarriersPage } from './CarriersPage';

const T = smokeStepTimeoutMs;

/** Regression locators — uniqueness proven via Playwright MCP (count === 1 on widget). */
export class CarrierMasterPage extends CarriersPage {
  readonly regLoc = {
    listHeading: () => this.page.getByRole('heading', { name: 'Carriers', exact: true }),
    addHeading: () => this.page.getByRole('heading', { name: 'Add carrier', exact: true }),
    addButton: () => this.page.getByTestId('add-carrier-button'),
    grid: () => this.page.getByTestId('carrier-datagrid'),
    searchInput: () => this.page.getByTestId('data-grid-search-input').locator('input'),
    statusFilter: () => this.page.getByTestId('filter-status'),
    statusFilterListbox: () => this.page.getByTestId('filter-status-listbox'),
    statusFilterOption: (status: string) =>
      this.page.getByTestId(
        status.toLowerCase() === 'all' || /^all status$/i.test(status)
          ? 'filter-status-option-all'
          : `filter-status-option-${status}`,
      ),
    headerCells: () => this.regLoc.grid().locator('.ag-header-cell-text'),
    footer: () => this.page.getByTestId('data-grid-record-count-footer'),
    noRecords: () => this.page.getByText(NO_RECORDS_TEXT, { exact: true }),
    carrierNameField: () => this.page.getByTestId('carrier-name-input').locator('input'),
    carrierCodeField: () => this.page.getByTestId('carrier-code-input').locator('input'),
    notesField: () => this.page.getByTestId('additional-notes-textarea').locator('textarea'),
    emailField: () => this.page.getByTestId('email-input').locator('input'),
    phoneField: () => this.page.getByTestId('phone-number-input').locator('input'),
    appointmentDateField: () => this.page.getByTestId('appointment-date-input').locator('input'),
    lastReviewDateField: () => this.page.getByTestId('last-review-date-input').locator('input'),
    firstNameField: () => this.page.getByTestId('first-name-input').locator('input'),
    lastNameField: () => this.page.getByTestId('last-name-input').locator('input'),
    addressField: () => this.page.getByTestId('address-input').locator('input'),
    cityField: () => this.page.getByTestId('city-input').locator('input'),
    zipField: () => this.page.getByTestId('zip-code-input').locator('input'),
    carrierTypeDropdown: () => this.page.getByTestId('carrier-type-dropdown'),
    carrierTypeTrigger: () => this.page.getByTestId('carrier-type-dropdown').getByRole('button').first(),
    statusDropdown: () => this.page.getByTestId('status-dropdown'),
    statusTrigger: () => this.page.getByTestId('status-dropdown').getByRole('button').first(),
    stateDropdown: () => this.page.getByTestId('state-dropdown'),
    typeOption: (label: string) => this.page.getByTestId(`carrier-type-dropdown-option-${label}`),
    formStatusOption: (label: string) => this.page.getByTestId(`status-dropdown-option-${label}`),
    listbox: () => this.page.getByRole('listbox'),
    option: (label: string) =>
      this.page.getByRole('listbox').getByRole('option', { name: new RegExp(`^${escapeRegex(label)}$`, 'i') }),
    saveButton: () => this.page.getByTestId('save-button'),
    cancelButton: () => this.page.getByTestId('cancel-button'),
    backButton: () => this.page.getByTestId('back-button'),
    confirmSaveModal: () => this.page.getByTestId('confirm-save-modal'),
    confirmSaveButton: () => this.page.getByTestId('confirm-save-button'),
    confirmUpdateModal: () => this.page.getByTestId('confirm-update-modal'),
    confirmUpdateButton: () => this.page.getByTestId('confirm-update-button'),
    cancelConfirmButton: () => this.page.getByTestId('cancel-confirm'),
    modalCloseButton: () => this.page.getByTestId('modal-close-button'),
    emailError: () => this.page.getByTestId('email-error'),
    carrierNameError: () => this.page.getByTestId('carrier-name-error'),
    carrierCodeError: () => this.page.getByTestId('carrier-code-error'),
    appointmentDateError: () => this.page.getByTestId('appointment-date-error'),
    lastReviewDateError: () => this.page.getByTestId('last-review-date-error'),
    notesError: () => this.page.getByText(NOTES_OVER_MAX_ERROR),
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),
    carrierActions: () => this.page.locator('[data-testid^="carrier-actions-"]'),
    editAction: () => this.page.getByRole('button', { name: 'Edit', exact: true }),
    statusCell: () => this.page.locator('[data-testid^="carrier-status-"]'),
  };

  constructor(page: Page) {
    super(page);
  }

  async openList() {
    await super.openList();
    await ensurePageReady(this.page, this.regLoc.listHeading());
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    await this.searchGrid('');
    await this.filterByStatus('All Status');
  }

  async openAddForm() {
    await this.regLoc.addButton().click();
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersCreate, { timeout: T });
    await expect(this.regLoc.addHeading()).toBeVisible({ timeout: T });
  }

  async expectOnList() {
    await expect(this.page).toHaveURL(AppUrlPatterns.carriers, { timeout: T });
    await expect(this.regLoc.listHeading()).toBeVisible({ timeout: T });
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    const footer = (await this.regLoc.footer().innerText()).replace(/\s+/g, ' ');
    expect(footer, 'List footer should show record counts').toMatch(/showing(\s+all)?\s+\d+/i);
  }

  async expectOnAddForm() {
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersCreate, { timeout: T });
    await expect(this.regLoc.addHeading()).toBeVisible({ timeout: T });
    await expect(this.regLoc.carrierNameField()).toBeVisible({ timeout: T });
    await expect(this.regLoc.saveButton()).toBeVisible({ timeout: T });
  }

  async expectOnEditForm() {
    await expect(this.page).toHaveURL(AppUrlPatterns.carriersEdit, { timeout: T });
    await expect(this.regLoc.carrierNameField()).toBeVisible({ timeout: T });
  }

  private async fillField(field: Locator, value: string) {
    await expect(field).toBeVisible({ timeout: T });
    await field.fill(value);
  }

  async selectCarrierType(label: string) {
    await this.regLoc.carrierTypeTrigger().click();
    const option = this.regLoc.typeOption(label).or(this.regLoc.option(label));
    await expect(option.first()).toBeVisible({ timeout: T });
    await option.first().click();
    await waitForAppSettled(this.page);
  }

  async selectFormStatus(label: string) {
    await this.regLoc.statusTrigger().click();
    const option = this.regLoc.formStatusOption(label).or(this.regLoc.option(label));
    await expect(option.first()).toBeVisible({ timeout: T });
    await option.first().click();
    await waitForAppSettled(this.page);
  }

  async fillMandatoryFields(data: CarrierFormData) {
    await this.fillField(this.regLoc.carrierNameField(), data.carrierName);
    await this.fillField(this.regLoc.carrierCodeField(), data.carrierCode);
    await this.selectCarrierType(data.carrierType);
    await this.selectFormStatus(data.status);
    await this.setAppointmentDate(data.appointmentDate);
    await this.setLastReviewDate(data.lastReviewDate);
    if (data.notes) await this.fillField(this.regLoc.notesField(), data.notes);
    if (data.email) await this.fillField(this.regLoc.emailField(), data.email);
    if (data.phone) await this.fillField(this.regLoc.phoneField(), data.phone);
  }

  async fillUniqueMandatory(overrides?: Partial<CarrierFormData>): Promise<CarrierFormData> {
    const data = buildValidCarrier(overrides);
    await this.fillMandatoryFields(data);
    return data;
  }

  async setCarrierName(value: string) {
    await this.fillField(this.regLoc.carrierNameField(), value);
  }

  async setCarrierCode(value: string) {
    await this.fillField(this.regLoc.carrierCodeField(), value);
  }

  async setNotes(value: string) {
    await this.fillField(this.regLoc.notesField(), value);
  }

  async setEmail(value: string) {
    await this.fillField(this.regLoc.emailField(), value);
  }

  async setPhone(value: string) {
    await this.fillField(this.regLoc.phoneField(), value);
  }

  async setAppointmentDate(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      const year = Number(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        await expect(this.regLoc.appointmentDateField()).toBeVisible({ timeout: T });
        await this.regLoc.appointmentDateField().click();
        await this.selectDateInCalendar(value);
        return;
      }
    }
    await this.fillField(this.regLoc.appointmentDateField(), value);
  }

  async setLastReviewDate(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);
      const year = Number(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        await expect(this.regLoc.lastReviewDateField()).toBeVisible({ timeout: T });
        await this.regLoc.lastReviewDateField().click();
        await this.selectDateInCalendar(value);
        return;
      }
    }
    await this.fillField(this.regLoc.lastReviewDateField(), value);
  }

  /** Pick MM/DD/YYYY via react-calendar. App no longer accepts manual date typing. */
  private async selectDateInCalendar(dateStr: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) {
      throw new Error(`Expected MM/DD/YYYY date, got: ${dateStr}`);
    }
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) {
      throw new Error(`Invalid calendar date: ${dateStr}`);
    }

    const popup = this.regLoc.calendarPopup();
    await expect(popup).toBeVisible({ timeout: T });

    // Navigate to decade view
    const navLabel = popup.locator('.react-calendar__navigation__label');
    for (let i = 0; i < 2; i++) {
      const labelText = (await navLabel.innerText()).replace(/\s+/g, ' ').trim();
      if (/\d{4}\s*[–-]\s*\d{4}/.test(labelText)) break;
      await navLabel.click();
      await this.page.waitForTimeout(150);
    }

    // Select year from decade view
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
      if (!range) {
        throw new Error(`Calendar not in decade view while seeking year ${year}`);
      }
      const start = Number(range[1]);
      if (year < start) {
        await popup.locator('.react-calendar__navigation__prev-button').click();
      } else {
        await popup.locator('.react-calendar__navigation__next-button').click();
      }
      await this.page.waitForTimeout(150);
    }
    if (!yearClicked) {
      throw new Error(`Could not find year ${year} in calendar`);
    }
    await this.page.waitForTimeout(150);

    // Select month
    await popup.getByRole('button', { name: `${monthName} ${year}`, exact: true }).click();
    await this.page.waitForTimeout(150);

    // Select day
    const dayBtn = popup
      .locator(
        'button.react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)',
      )
      .filter({ hasText: new RegExp(`^${day}$`) });
    await expect(dayBtn, `Day ${day} should be unique in calendar month`).toHaveCount(1);
    await dayBtn.click();
    await this.page.waitForTimeout(200);
  }

  async fillMaxLengthFields(data: CarrierFormData) {
    await this.fillMandatoryFields({
      ...data,
      carrierName: data.carrierName,
      notes: data.notes,
    });
    await this.fillField(this.regLoc.firstNameField(), 'Firstname');
    await this.fillField(this.regLoc.lastNameField(), 'Lastname');
    await this.fillField(this.regLoc.addressField(), 'A'.repeat(80));
    await this.fillField(this.regLoc.cityField(), 'Cityname');
    await this.fillField(this.regLoc.zipField(), '12345');
    await this.fillField(this.regLoc.phoneField(), '5551234567');
  }

  async expectSaveDisabled() {
    await expect(this.regLoc.saveButton()).toBeDisabled({ timeout: T });
  }

  async expectSaveEnabled() {
    await expect(this.regLoc.saveButton()).toBeEnabled({ timeout: T });
  }

  async clickSave() {
    await this.regLoc.saveButton().click();
  }

  async confirmCreateSave() {
    await expect(this.regLoc.confirmSaveModal()).toBeVisible({ timeout: T });
    await expect(this.regLoc.confirmSaveModal()).toContainText(/Create Carrier/i);
    await this.regLoc.confirmSaveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async confirmUpdateSave() {
    await expect(this.regLoc.confirmUpdateModal()).toBeVisible({ timeout: T });
    await expect(this.regLoc.confirmUpdateModal()).toContainText(/Save Changes/i);
    await this.regLoc.confirmUpdateButton().click();
    await waitForAppSettled(this.page, T);
  }

  async saveNewCarrier() {
    await this.expectSaveEnabled();
    await this.clickSave();
    await this.confirmCreateSave();
  }

  async saveEditedCarrier() {
    await this.expectSaveEnabled();
    await this.clickSave();
    await this.confirmUpdateSave();
  }

  async clickSaveRapidly(times: number) {
    await this.expectSaveEnabled();
    for (let i = 0; i < times; i++) {
      await this.regLoc.saveButton().click({ force: true });
    }
    if (await this.regLoc.confirmSaveButton().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.regLoc.confirmSaveButton().click();
    }
    await waitForAppSettled(this.page, T);
  }

  async clickCancel() {
    await this.regLoc.cancelButton().click();
    await waitForAppSettled(this.page, T);
  }

  async reloadForm() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await waitForAppSettled(this.page, T);
  }

  async openCarrierTypeDropdown() {
    await this.regLoc.carrierTypeTrigger().click();
    await expect(this.regLoc.listbox()).toBeVisible({ timeout: T });
  }

  async openFormStatusDropdown() {
    await this.regLoc.statusTrigger().click();
    await expect(this.regLoc.listbox()).toBeVisible({ timeout: T });
  }

  async expectCarrierTypeOptions() {
    const labels = (await this.regLoc.listbox().getByRole('option').allTextContents()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    );
    // Dropdown is extensible and rendered uppercase — the app may add new Carrier
    // Types over time. Assert more than two options present plus every known core
    // type (case-insensitive subset), never an exact list match.
    const lower = labels.map((l) => l.toLowerCase());
    expect(labels.length, 'Carrier Type dropdown must list more than 2 options').toBeGreaterThan(2);
    expect(labels.every((l) => l.length > 0), 'No empty Carrier Type options').toBe(true);
    for (const known of CARRIER_TYPE_OPTIONS) {
      expect(lower, `Carrier Type options missing "${known}"`).toContain(known.toLowerCase());
    }
    await this.closeDropdown();
  }

  async expectFormStatusOptions() {
    const labels = (await this.regLoc.listbox().getByRole('option').allTextContents()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    );
    expect(labels, 'Status options').toEqual([...CARRIER_STATUS_OPTIONS]);
    const trigger = (await this.regLoc.statusDropdown().innerText()).replace(/\s+/g, ' ').trim();
    expect(trigger, 'Status default is unset placeholder').toMatch(/Status/i);
    await this.closeDropdown();
  }

  async closeDropdown() {
    await this.page.keyboard.press('Escape');
  }

  async searchCarriers(query: string) {
    await this.searchGrid(query);
  }

  async expectRowContains(text: string) {
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    const row = await this.findRowByText(text);
    expect(row, `Expected grid row containing "${text}"`).not.toBeNull();
    const body = (await row!.innerText()).replace(/\s+/g, ' ').trim();
    expect(body).toMatch(new RegExp(escapeRegex(text), 'i'));
  }

  async expectRowHasStatus(identifier: string, status: string) {
    await this.searchCarriers(identifier);
    await this.expectRowContains(identifier);
    const statusText = (await this.regLoc.statusCell().first().innerText()).replace(/\s+/g, ' ').trim();
    expect(statusText, `Status for "${identifier}"`).toMatch(new RegExp(`^${escapeRegex(status)}$`, 'i'));
  }

  async expectExactlyOneRowMatching(query: string) {
    await this.searchCarriers(query);
    await expect
      .poll(async () => this.dataRows().count(), { timeout: T })
      .toBe(1);
    await this.expectRowContains(query);
  }

  async expectNoRecords(query?: string) {
    if (query !== undefined) await this.searchCarriers(query);
    await expect(this.regLoc.noRecords()).toBeVisible({ timeout: T });
    const footer = (await this.regLoc.footer().innerText()).replace(/\s+/g, ' ');
    expect(footer).toMatch(/showing\s+0\s+of/i);
  }

  async expectListColumns() {
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    await this.scrollGridToStart();
    const leftHeaders = await this.headerLabels();
    await this.scrollGridToActionsColumn();
    const rightHeaders = await this.headerLabels();
    const headers = [...new Set([...leftHeaders, ...rightHeaders])];
    for (const col of CSV_LIST_COLUMNS) {
      expect(headers, `Missing column "${col}". Live headers: ${headers.join(', ')}`).toContain(col);
    }
    for (const col of LIST_COLUMNS) {
      expect(headers, `Unexpected missing live column "${col}"`).toContain(col);
    }
  }

  private async headerLabels(): Promise<string[]> {
    return (await this.regLoc.headerCells().allTextContents()).map((h) => h.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async expectActionsColumnAfterHorizontalScroll() {
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    await this.scrollGridToStart();
    const before = await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      return {
        scrollLeft: viewport?.scrollLeft ?? 0,
        scrollWidth: viewport?.scrollWidth ?? 0,
        clientWidth: viewport?.clientWidth ?? 0,
      };
    });
    await this.scrollGridToActionsColumn();
    const after = await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      return {
        scrollLeft: viewport?.scrollLeft ?? 0,
        scrollWidth: viewport?.scrollWidth ?? 0,
        clientWidth: viewport?.clientWidth ?? 0,
      };
    });
    if (after.scrollWidth > after.clientWidth + 1) {
      expect(after.scrollLeft, 'Grid should scroll horizontally toward Actions').toBeGreaterThan(before.scrollLeft);
    }
    const headers = (await this.regLoc.headerCells().allTextContents()).map((h) => h.replace(/\s+/g, ' ').trim());
    expect(headers, `Actions header missing after scroll. Live: ${headers.join(', ')}`).toContain('Actions');
    const actionsHeader = this.regLoc.headerCells().filter({ hasText: /^Actions$/i });
    await expect(actionsHeader.first()).toBeVisible({ timeout: T });
    const actions = this.regLoc.carrierActions();
    await expect(actions.first()).toBeVisible({ timeout: T });
    expect(await actions.count(), 'At least one row Actions control after scroll').toBeGreaterThan(0);
  }

  async filterByStatus(status: string) {
    await this.regLoc.statusFilter().click();
    await expect(this.regLoc.statusFilterListbox()).toBeVisible({ timeout: T });
    await this.regLoc.statusFilterOption(status).click();
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
  }

  async expectStatusFilterOptions() {
    await this.regLoc.statusFilter().click();
    await expect(this.regLoc.statusFilterListbox()).toBeVisible({ timeout: T });
    const labels = (await this.regLoc.statusFilterListbox().getByRole('option').allTextContents()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    );
    expect(labels).toEqual([...LIST_STATUS_FILTER_OPTIONS]);
    await this.page.keyboard.press('Escape');
  }

  async expectAllVisibleRowsHaveStatus(status: string) {
    await expect(this.regLoc.grid()).toBeVisible({ timeout: T });
    const cells = this.regLoc.statusCell();
    const count = await cells.count();
    expect(count, `Expected at least one "${status}" row`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      expect(text, `Row ${i} status`).toMatch(new RegExp(`^${escapeRegex(status)}$`, 'i'));
    }
  }

  async sortColumn(columnName: string) {
    const header = this.regLoc.headerCells().filter({ hasText: new RegExp(`^${escapeRegex(columnName)}$`, 'i') });
    await expect(header.first()).toBeVisible({ timeout: T });
    await header.first().click();
    await waitForAppSettled(this.page);
  }

  async expectColumnSorted(columnName: string, direction: 'asc' | 'desc') {
    const values = (await this.getColumnValues(columnName)).slice(0, SORT_SAMPLE_ROWS);
    expect(
      values.length,
      `Need ${SORT_SAMPLE_ROWS} "${columnName}" cells to assert sort`,
    ).toBe(SORT_SAMPLE_ROWS);
    for (let i = 1; i < values.length; i++) {
      const cmp = values[i - 1].localeCompare(values[i], undefined, { sensitivity: 'base' });
      if (direction === 'asc') {
        expect(cmp, `"${values[i - 1]}" should be <= "${values[i]}"`).toBeLessThanOrEqual(0);
      } else {
        expect(cmp, `"${values[i - 1]}" should be >= "${values[i]}"`).toBeGreaterThanOrEqual(0);
      }
    }
  }

  private async getColumnValues(columnName: string): Promise<string[]> {
    const colIndex = await this.getColumnIndex(columnName);
    const rows = this.dataRows();
    const count = await rows.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('[role="gridcell"]');
      if (colIndex >= (await cells.count())) continue;
      const text = (await cells.nth(colIndex).innerText()).replace(/\s+/g, ' ').trim();
      if (text) values.push(text);
    }
    return values;
  }

  async openEditFor(identifier: string) {
    await this.searchCarriers(identifier);
    await this.expectRowContains(identifier);
    await this.scrollGridToActionsColumn();
    const kebab = this.regLoc.carrierActions().first();
    await expect(kebab).toHaveCount(1);
    await kebab.click();
    await expect(this.regLoc.editAction()).toHaveCount(1);
    await this.regLoc.editAction().click();
    await waitForAppSettled(this.page, T);
    await this.expectOnEditForm();
  }

  async expectEmailError() {
    await expect(this.regLoc.emailError()).toHaveText(EMAIL_ERROR, { timeout: T });
    await this.expectOnAddForm();
  }

  async expectDuplicateCodeError() {
    await expect(this.regLoc.carrierCodeError()).toHaveText(DUPLICATE_CODE_ERROR, { timeout: T });
    await this.expectOnAddForm();
  }

  async expectNameMaxLengthError() {
    await expect(this.regLoc.carrierNameError()).toHaveText(NAME_MAX_LENGTH_ERROR, { timeout: T });
    await this.expectOnAddForm();
  }

  async expectNameCharsetError() {
    await expect(this.regLoc.confirmSaveModal()).toBeHidden();
    await expect(this.regLoc.carrierNameError()).toHaveText(NAME_LETTERS_SPACES_ERROR, { timeout: T });
    await this.expectOnAddForm();
  }

  async expectReviewAfterAppointmentError() {
    await expect(this.regLoc.lastReviewDateError()).toHaveText(REVIEW_AFTER_APPOINTMENT_ERROR, { timeout: T });
    await this.expectOnAddForm();
  }

  async expectNotesOverMaxError() {
    await expect(this.regLoc.confirmSaveModal()).toBeHidden();
    await expect(this.regLoc.notesError()).toBeVisible({ timeout: T });
    await expect(this.regLoc.notesError()).toHaveText(NOTES_OVER_MAX_ERROR);
    await this.expectOnAddForm();
  }

  async expectPhoneRejectsAlpha() {
    const value = await this.regLoc.phoneField().inputValue();
    expect(value, 'Phone should strip alphabetic input').not.toMatch(/[a-z]/i);
  }

  async expectFormFieldsEmpty() {
    await expect(this.regLoc.carrierNameField()).toHaveValue('');
    await expect(this.regLoc.carrierCodeField()).toHaveValue('');
  }

  async expectNameValue(name: string) {
    await expect(this.regLoc.carrierNameField()).toHaveValue(name);
  }

  async expectNotesValue(notes: string) {
    await expect(this.regLoc.notesField()).toHaveValue(notes);
  }
}
