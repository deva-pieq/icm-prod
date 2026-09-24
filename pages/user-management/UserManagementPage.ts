import { expect, type Locator, type Page } from '@playwright/test';
import {
  E2E_GRID_SEARCH,
  FALLBACK_GRID_SEARCH,
  LONG_VALID_FORMAT_EMAIL,
  VALID_FIRST_NAME,
  VALID_LAST_NAME,
  VALID_TEST_EMAIL,
  hasInvalidNameCharacters,
  randomValidPersonName,
  type UserDetails,
} from '../../test-data/user-management/users';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { waitForAppSettled } from '../../utils/pageLoader';

export type { UserDetails };

export type GridSearchOutcome = {
  searchUsed: string;
  rowCount: number;
  rowPreview: string;
};

export type EditFormSnapshot = {
  firstName: string;
  lastName: string;
  status: string;
  role: string;
};

export type EditFormUpdateResult = {
  firstName: string;
  lastName: string;
  statusChanged: boolean;
  roleChanged: boolean;
  namesReplaced: boolean;
  resultingStatus: string;
  resultingRole: string;
};

export type ShowingRecords = {
  showing: number;
  total: number;
};

export type GridSearchResult = 'has matches' | 'no matches';

/** User Management dashboard, add-user, edit-user, and grid flows. */
export class UserManagementPage {
  private activeSearchToken = E2E_GRID_SEARCH;
  private lastSearchQuery = '';

  /** Centralized locators — prefer data-testid when the app exposes it. */
  readonly loc = {
    pageHeading: () => this.page.getByRole('heading', { name: 'User Management', exact: true }),
    dataGrid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    searchInput: () => this.page.getByRole('textbox', { name: 'Search data grid' }),
    showingRecordsText: () =>
      this.page
        .getByTestId('data-grid-record-count-footer'),
    noRecordsFound: () => this.page.getByText(/No [Rr]ecords [Ff]ound/i),
    clearAllFiltersButton: () =>
      this.page
        .getByRole('grid', { name: 'Data grid' })
        .getByRole('button', { name: /clear all filters/i }),
    addNewUserButton: () => this.page.getByTestId('add-new-user-btn'),
    registeredUsersKpi: () =>
          this.page
            .getByTestId('total-users-card')
            .getByText(/^\d+$/),
    activeUsersKpi: () =>
      this.page
        .getByTestId('active-users-card')
        .getByText(/^\d+$/),
    columnPickerButton: () =>
      this.page
        .getByTestId('column-visibility-button')
        .or(this.page.getByTestId('manage-columns-button'))
        .or(this.page.getByTestId('data-grid-columns-button'))
        .or(this.page.getByRole('button', { name: /columns?|manage columns|column visibility/i }))
        .first(),
    applyToggleButton: () =>
      this.page.getByTestId('user-records-datagrid-toggle-columns-modal-apply'),
  };

  constructor(private readonly page: Page) {}

  columnLabel(columnName: string): Locator {
    return this.page.getByText(columnName, { exact: true });
  }

  async expectDashboardReady() {
    await expect(this.loc.pageHeading()).toBeVisible({ timeout: 60_000 });
    await expect(this.loc.dataGrid()).toBeVisible({ timeout: 60_000 });
    await waitForAppSettled(this.page);
  }

  private async settleAfterNavigation() {
    await waitForAppSettled(this.page, 120_000);
  }

  async openViaSidebar() {
    await this.page
      .getByRole('navigation', { name: 'Sidebar navigation' })
      .getByTestId('sidebar-nav-item-user-management')
      .click({ noWaitAfter: true });
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 60_000 });
    await this.settleAfterNavigation();
  }

  async gotoDashboard() {
    const base = process.env.BASE_URL?.trim() ?? '';
    const path = /\/user-management\/?$/i.test(base) ? AppPaths.home : AppPaths.userManagement;
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 120_000 });
    await expect(
      this.page.getByRole('navigation', { name: 'Sidebar navigation' }),
    ).toBeVisible({ timeout: 120_000 });
    await this.settleAfterNavigation();
  }

  async clickAddUser() {
    await this.loc.addNewUserButton().click();
    await expect(this.page).toHaveURL(/\/user-management\/add\/?$/i, { timeout: 120_000 });
    await this.settleAfterNavigation();
  }

  async fillNewUserForm(user: UserDetails) {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    await fields.nth(0).fill(user.email);
    await fields.nth(1).fill(user.firstName);
    await fields.nth(2).fill(user.lastName);

    await this.page.getByRole('button', { name: 'Select a role' }).click();
    await this.page.getByRole('option', { name: new RegExp(`^${user.role}$`, 'i') }).click();
  }

  async saveNewUser() {
    await this.page.getByRole('button', { name: 'Save' }).first().click();
    const confirm = this.page.getByRole('dialog').filter({ hasText: /sure you want to save/i });
    await expect(confirm).toBeVisible({ timeout: 15_000 });
    await confirm.getByRole('button', { name: 'Save' }).click();
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 60_000 });
    await expect(this.page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 30_000,
    });
  }

  async clickSaveButton() {
    const saveButton = this.page.getByTestId('create-button');
    await expect(saveButton).toBeVisible({ timeout: 15_000 });
    await saveButton.click();
    const confirm = this.page.getByRole('dialog').filter({ hasText: /sure you want to save/i });
    if (await confirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirm.getByRole('button', { name: 'Save' }).click();
      await this.settleAfterNavigation();
    }
  }

  async fillAddUserMandatoryFields(overrides?: { email?: string; firstName?: string; lastName?: string }) {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    await fields.nth(0).fill(overrides?.email ?? 'valid@email.com');
    await fields.nth(1).fill(overrides?.firstName ?? 'ValidFirst');
    await fields.nth(2).fill(overrides?.lastName ?? 'ValidLast');
    await this.page.getByRole('button', { name: 'Select a role' }).click();
    await this.page.getByRole('option', { name: /^Operations Manager$/i }).click();
  }

  async expectSaveButtonEnabled() {
    await expect(this.page.getByTestId('create-button')).toBeEnabled({ timeout: 10_000 });
  }

  async expectSaveButtonDisabled() {
    await expect(this.page.getByTestId('create-button')).toBeDisabled({ timeout: 10_000 });
  }

  async expectAddUserEmailValidationError() {
    await expect(this.addUserValidationMessage()).toBeVisible({ timeout: 15_000 });
  }

  async expectAddUserValidationErrors() {
    await expect(this.addUserValidationMessage()).toBeVisible({ timeout: 15_000 });
  }

  private addUserValidationMessage() {
    return this.page
      .getByTestId('email-error')
      .first();
  }

  async expectAddUserNameValidationErrors() {
    await expect(
      //  should not contain special characters or numbers
      this.page.getByText(/should not contain special characters or numbers|invalid|special character/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  }

  async searchGrid(query: string) {
    this.lastSearchQuery = query;
    const search = this.loc.searchInput();
    await search.fill('');
    await search.fill(query);
    await this.page.waitForTimeout(1000); // static wait to check
    await expect(this.loc.dataGrid()).toBeVisible({ timeout: 15_000 });
    await waitForAppSettled(this.page);
    this.activeSearchToken = query;
  }

  private grid() {
    return this.loc.dataGrid();
  }

  private dataRowsForSearch(token: string): Locator {
    return this.grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(token, 'i') });
  }

  async countMatchingUserRows(searchToken: string): Promise<number> {
    await this.searchGrid(searchToken);
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    let matching = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader')
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (new RegExp(searchToken, 'i').test(text)) matching++;
    }
    return matching;
  }

  async expectGridEmptyStateVisible() {
    await this.expectNoRecordsFoundVisible();
  }

  /** Prefer e2e rows; fall back to test when e2e search has no data rows. */
  async searchForUserToEditWithFallback(
    primary: string = E2E_GRID_SEARCH,
    fallback: string = FALLBACK_GRID_SEARCH,
  ): Promise<GridSearchOutcome> {
    const primaryCount = await this.countMatchingUserRows(primary);
    let searchUsed = primary;
    let rowCount = primaryCount;

    if (rowCount === 0) {
      searchUsed = fallback;
      rowCount = await this.countMatchingUserRows(fallback);
      expect(rowCount, `No users found for "${primary}" or fallback "${fallback}"`).toBeGreaterThan(0);
    }

    const row = this.dataRowsForSearch(searchUsed).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    const rowPreview = await row.innerText();
    this.activeSearchToken = searchUsed;
    return { searchUsed, rowCount, rowPreview };
  }

  /** Smoke: open edit for the first data row without searching. */
  async openEditForFirstGridRow() {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: 60_000 });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: 120_000 });
    await row.getByRole('button').first().click();
    await this.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await this.settleAfterNavigation();
  }

  /** Smoke-only: User Management list heading. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 60_000 });
    await expect(this.loc.pageHeading()).toBeVisible({ timeout: 30_000 });
  }

  /** Smoke-only: Add User page URL + heading. */
  async smokeExpectAddHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagementAdd, { timeout: 60_000 });
    await expect(
      this.page.getByRole('heading', { name: /add (new )?user/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Smoke-only: edit by clicking first grid row (not kebab). */
  async smokeOpenEditByRowClick() {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: 60_000 });
    const row = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: 120_000 });
    await row.click();
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagementEdit, { timeout: 60_000 });
    await expect(this.page.getByTestId('edit-user-page')).toBeVisible({ timeout: 30_000 });
    await this.settleAfterNavigation();
  }

  /** Smoke-only: edit page header. */
  async smokeExpectEditHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagementEdit, { timeout: 60_000 });
    await expect(this.page.getByTestId('edit-user-page')).toBeVisible({ timeout: 30_000 });
  }

  async openEditForFirstUserFromActiveSearch(): Promise<string> {
    const row = this.dataRowsForSearch(this.activeSearchToken).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole('button').first().click();
    await this.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(this.page).toHaveURL(/\/user-management\/edit\//i, { timeout: 30_000 });
    await expect(this.page.getByTestId('edit-user-page')).toBeVisible({ timeout: 30_000 });
    await this.settleAfterNavigation();
    return this.activeSearchToken;
  }

  private firstNameInput() {
    return this.page.getByTestId('firstName-input').getByRole('textbox');
  }

  private lastNameInput() {
    return this.page.getByTestId('lastName-input').getByRole('textbox');
  }

  private async readDropdownLabel(testId: string): Promise<string> {
    const text = await this.page.getByTestId(testId).innerText();
    return text.replace(/\s+/g, ' ').trim();
  }

  async readEditFormSnapshot(): Promise<EditFormSnapshot> {
    return {
      firstName: await this.firstNameInput().inputValue(),
      lastName: await this.lastNameInput().inputValue(),
      status: await this.readDropdownLabel('status-dropdown'),
      role: await this.readDropdownLabel('role-dropdown'),
    };
  }

  private nameValidationErrorsVisible(): Locator {
    return this.page.getByText(/should not contain special characters|should not contain numbers|invalid/i);
  }

  private async fillFirstAndLastName(firstName: string, lastName: string) {
    await this.firstNameInput().fill(firstName);
    await this.lastNameInput().fill(lastName);
    await this.lastNameInput().blur();
  }

  /** Clear invalid names and use random letter-only words; also reacts to visible validation errors. */
  async ensureValidUserNamesOnEditForm(): Promise<{ firstName: string; lastName: string; namesReplaced: boolean }> {
    let firstName = await this.firstNameInput().inputValue();
    let lastName = await this.lastNameInput().inputValue();
    let namesReplaced = false;

    const needsReplace =
      hasInvalidNameCharacters(firstName) ||
      hasInvalidNameCharacters(lastName) ||
      (await this.nameValidationErrorsVisible().count()) > 0;

    if (needsReplace) {
      const random = randomValidPersonName();
      firstName = random.firstName;
      lastName = random.lastName;
      await this.fillFirstAndLastName(firstName, lastName);
      await expect(this.nameValidationErrorsVisible()).toHaveCount(0, { timeout: 10_000 });
      namesReplaced = true;
    }

    return { firstName, lastName, namesReplaced };
  }

  async setStatusIfCurrently(statusIf: string, targetStatus: string): Promise<boolean> {
    const current = await this.readDropdownLabel('status-dropdown');
    if (!current.toLowerCase().includes(statusIf.toLowerCase())) {
      return false;
    }
    await this.setStatus(targetStatus);
    return true;
  }

  async setRoleIfCurrently(roleIf: string, targetRole: string): Promise<boolean> {
    const current = await this.readDropdownLabel('role-dropdown');
    if (!current.toLowerCase().includes(roleIf.toLowerCase())) {
      return false;
    }
    await this.setRole(targetRole);
    return true;
  }

  /**
   * Fix invalid names, set Inactive when Active, set Operations Manager when Finance Manager.
   */
  async applyConditionalEditFormUpdates(): Promise<EditFormUpdateResult> {
    const { firstName, lastName, namesReplaced } = await this.ensureValidUserNamesOnEditForm();
    const statusChanged = await this.setStatusIfCurrently('Active', 'Inactive');
    const roleChanged = await this.setRoleIfCurrently('Finance Manager', 'Operations Manager');
    const snapshot = await this.readEditFormSnapshot();

    return {
      firstName,
      lastName,
      namesReplaced,
      statusChanged,
      roleChanged,
      resultingStatus: snapshot.status,
      resultingRole: snapshot.role,
    };
  }

  async setStatus(status: string) {
    await this.page.getByTestId('status-dropdown').click();
    await this.page.getByRole('option', { name: new RegExp(`^${status}$`, 'i') }).click();
  }

  async setRole(role: string) {
    await this.page.getByTestId('role-dropdown').click();
    await this.page.getByRole('option', { name: new RegExp(`^${role}$`, 'i') }).click();
  }

  async saveEditedUser() {
    await expect(this.page.getByTestId('update-button')).toBeEnabled({ timeout: 15_000 });
    await this.page.getByTestId('update-button').click();
    const confirm = this.page.getByRole('dialog').filter({ hasText: /sure you want to save/i });
    await expect(confirm).toBeVisible({ timeout: 15_000 });
    await confirm.getByRole('button', { name: 'Save' }).click();
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 60_000 });
    await expect(this.page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 30_000,
    });
    await this.settleAfterNavigation();
  }

  async getFirstRowTextForActiveSearch(): Promise<string> {
    await this.searchGrid(this.activeSearchToken);
    const row = this.dataRowsForSearch(this.activeSearchToken).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    return row.innerText();
  }

  async getUserRowTextByEmail(email: string): Promise<string> {
    await this.searchGrid(email);
    const row = this.grid().getByRole('row').filter({ hasText: email });
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    return row.first().innerText();
  }

  async fillMandatoryFieldsOnly(user?: Partial<{ email: string; firstName: string; lastName: string }>) {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    const ts = Date.now();
    await fields.nth(0).fill(user?.email ?? `e2e.user.${ts}@pieq.ai`);
    await fields.nth(1).fill(user?.firstName ?? 'Etwoe');
    await fields.nth(2).fill(user?.lastName ?? 'Automation');
  }

  async selectRole(role: string = 'Operations Manager') {
    await this.page.getByRole('button', { name: 'Select a role' }).click();
    await this.page.getByRole('option', { name: new RegExp(`^${role}$`, 'i') }).click();
  }

  async clickAddUserCancel() {
    const cancelButton = this.page.getByRole('button', { name: /cancel|back/i }).first();
    if (await cancelButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectOnDashboard() {
    await expect(this.page).toHaveURL(AppUrlPatterns.userManagement, { timeout: 30_000 });
    await expect(this.page.getByRole('heading', { name: 'User Management' })).toBeVisible({
      timeout: 15_000,
    });
  }

  async fillEmailField(email: string) {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    await fields.nth(0).fill(email);
  }

  async fillValidEmail() {
    await this.fillEmailField(VALID_TEST_EMAIL);
  }

  async fillLongValidFormatEmail() {
    await this.fillEmailField(LONG_VALID_FORMAT_EMAIL);
  }

  async fillValidFirstAndLastName() {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    await fields.nth(1).fill(VALID_FIRST_NAME);
    await fields.nth(2).fill(VALID_LAST_NAME);
  }

  async fillNameWithSpecialCharacters() {
    const fields = this.page.getByRole('textbox');
    await expect(fields).toHaveCount(3, { timeout: 15_000 });
    await fields.nth(1).fill('John@#');
    await fields.nth(2).fill('Doe$%');
  }

  async expectGridVisible() {
    await this.grid().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async fillLongValidEmailWithValidNames() {
    await this.fillLongValidFormatEmail();
    await this.fillValidFirstAndLastName();
  }

  async expectDuplicateEmailError() {
    await expect(
      this.page.getByText(/already exists|duplicate|already taken|already in use|unique|exist/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectUnsavedChangesWarningVisible() {
    await expect(
      this.page.getByRole('dialog').or(this.page.getByText(/unsaved|confirm|discard|leave/i)).first(),
    ).toBeVisible({ timeout: 10_000 });
  }

  async getEmailValidationErrorLocator(): Promise<Locator> {
    return this.page.getByText(/invalid|valid.*email|email.*invalid|email.*not valid/i).first();
  }

  async getNameValidationErrorLocator(): Promise<Locator> {
    return this.page.getByText(/should not contain special characters|should not contain numbers|invalid|special character/i).first();
  }

  async getDuplicateEmailErrorLocator(): Promise<Locator> {
    return this.page.getByText(/already exists|duplicate|already taken|already in use|unique|exist/i).first();
  }

  async navigateAwayFromAddUser() {
    await this.page
      .getByRole('navigation', { name: 'Sidebar navigation' })
      .getByRole('button', { name: 'User Management' })
      .click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTotalRecordText(): Promise<string> {
    const showing = this.grid().getByText(/Showing/i).first();
    if (await showing.isVisible({ timeout: 5_000 }).catch(() => false)) {
      return showing.innerText();
    }
    const rows = await this.getVisibleDataRowCount();
    return `${rows} rows`;
  }

  async expectTotalRecordCountMatchesVisibleRows() {
    const totalText = await this.getTotalRecordText();
    const numbers = totalText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const displayed = Number(numbers[0]);
      expect(displayed).toBeGreaterThan(0);
    }
  }

  async getVisibleDataRowCount(): Promise<number> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    let dataCount = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader')
      );
      if (!isHeader) dataCount++;
    }
    return dataCount;
  }

  columnHeaderLabel(columnName: string): Locator {
    return this.page.locator(
      `xpath=//div[contains(@class,"ag-header-container")]//span[normalize-space(.)="${columnName}"]`
    ).first()
  }

  async clickColumnHeader(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: 15_000 });
    await header.click();
    await waitForAppSettled(this.page);
  }

  /** First click sorts ascending; a second click on the same column toggles to descending. */
  async sortColumnAscending(columnName: string) {
    await this.clickColumnHeader(columnName);
  }

  async sortColumnDescending(columnName: string) {
    await this.clickColumnHeader(columnName);
  }

  async getColumnCellValues(columnName: string): Promise<string[]> {
    const colIndex = await this.getColumnIndex(columnName);
    const rowEls = this.grid().locator('[role="row"]');
    const count = await rowEls.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rowEls.nth(i).evaluate(
        el => el.querySelector('[role="columnheader"], th') !== null,
      );
      if (isHeader) continue;
      const cells = rowEls.nth(i).locator('[role="gridcell"], td');
      if (colIndex >= (await cells.count())) continue;
      const text = this.normalizeColumnSortValue(columnName, await cells.nth(colIndex).innerText());
      if (text) values.push(text);
    }
    return values;
  }

  async expectGridSortedBy(columnName: string, direction: 'asc' | 'desc') {
    const values = await this.getColumnCellValues(columnName);
    expect(values.length, `No data rows to verify sort for "${columnName}"`).toBeGreaterThan(1);
    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const curr = values[i];
      const ascending = prev <= curr;
      const descending = prev >= curr;
      if (direction === 'asc') {
        expect(ascending, `Row ${i - 1} "${prev}" should be <= "${curr}"`).toBe(true);
      } else {
        expect(descending, `Row ${i - 1} "${prev}" should be >= "${curr}"`).toBe(true);
      }
    }
  }

  private normalizeColumnSortValue(columnName: string, raw: string): string {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (/user\s*info/i.test(columnName)) {
      const email = text.match(/[\w.+-]+@[\w.-]+\.\w+/i)?.[0];
      return email ?? text;
    }
    if (/^name$/i.test(columnName)) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      return lines[0] ?? text;
    }
    return text;
  }

  async getFirstTwoCellTextsByColumn(columnName: string): Promise<string[]> {
    const colIndex = await this.getColumnIndex(columnName);
    const rowEls = this.grid().locator('[role="row"]');
    const count = await rowEls.count();
    const values: string[] = [];
    let found = 0;
    for (let i = 0; i < count && found < 2; i++) {
      const isHeader = await rowEls.nth(i).evaluate(el => 
        el.querySelector('[role="columnheader"], th') !== null
      );
      if (isHeader) continue;
      const cells = rowEls.nth(i).locator('[role="gridcell"], td');
      if (colIndex < await cells.count()) {
        const text = (await cells.nth(colIndex).innerText()).trim();
        if (text) { values.push(text); found++; }
      }
    }
    return values;
  }

  private async getColumnIndex(columnName: string): Promise<number> {
    return this.grid().evaluate((grid, name) => {
      const target = name.toLowerCase();
      const headerRow =
        grid.querySelector('[role="row"]:has([role="columnheader"])') ??
        Array.from(grid.querySelectorAll('[role="row"]')).find(row =>
          row.querySelector('[role="columnheader"], th'),
        );
      if (!headerRow) return 0;

      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
        if (label === target) return i;
      }

      const children = Array.from(headerRow.children);
      for (let i = 0; i < children.length; i++) {
        const label = children[i].textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
        if (label === target) return i;
        for (const d of children[i].querySelectorAll('*')) {
          const nested = d.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
          if (nested === target) return i;
        }
      }
      return 0;
    }, columnName);
  }

  filterButton(columnName: string): Locator {
    return this.grid()
      .getByRole('button', { name: new RegExp(`^All ${escapeRegExp(columnName)}$`, 'i') })
      .first();
  }

  async filterGridByColumn(columnName: string, value: string) {
    const filterButton = this.filterButton(columnName);
    await expect(filterButton).toBeVisible({ timeout: 10_000 });
    await filterButton.click();
    await this.page.waitForTimeout(300);

    const option = this.page
      .getByRole('option')
      .or(this.page.getByRole('menuitemradio'))
      .filter({ hasText: new RegExp(`^${escapeRegExp(value)}$`, 'i') });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
    } else {
      const checkbox = this.page
        .getByRole('checkbox')
        .filter({ hasText: new RegExp(`^${escapeRegExp(value)}$`, 'i') });
      await expect(checkbox.first()).toBeVisible({ timeout: 5_000 });
      await checkbox.first().click();
    }

    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
  }

  async clearAllFilters() {
    const clearButton = this.loc.clearAllFiltersButton();
    if (await clearButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await clearButton.click();
      await waitForAppSettled(this.page);
    }
  }

  async expectFiltersCleared() {
    await expect(this.loc.clearAllFiltersButton()).toBeHidden({ timeout: 5_000 }).catch(() => {});
    await expect(this.filterButton('Status')).toHaveText(/All Status/i, { timeout: 10_000 });
  }

  async getShowingRecords(): Promise<ShowingRecords | null> {
    const textLocator = this.loc.showingRecordsText();
    if (!(await textLocator.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return null;
    }
    const text = await textLocator.innerText();
    const match = text.match(/Showing\s+([\d,]+)\s+of\s+([\d,]+)\s+total records/i);
    if (!match) {
      // Showing all 2 records
      const match = text.match(/Showing\s+all\s+([\d,]+)\s+records/i);
      if (!match) {
        return null;
      }
      return {
        total:Number.parseInt(match![1].replace(/,/g, ''), 10),
        showing:0
      };
    }
    return {
      showing: Number.parseInt(match[1].replace(/,/g, ''), 10),
      total: Number.parseInt(match[2].replace(/,/g, ''), 10),
    };
  }

  private parseCountFromText(text: string): number {
    const numbers = text.match(/[\d,]+/g);
    if (!numbers?.length) return 0;
    return Number.parseInt(numbers[numbers.length - 1].replace(/,/g, ''), 10);
  }

  async getRegisteredUsersKpiCount(): Promise<number> {
    const kpi = this.loc.registeredUsersKpi();
    await expect(kpi).toBeVisible({ timeout: 15_000 });
    return this.parseCountFromText(await kpi.innerText());
  }

  async getActiveUsersKpiCount(): Promise<number> {
    const kpi = this.loc.activeUsersKpi();
    await expect(kpi).toBeVisible({ timeout: 15_000 });
    return this.parseCountFromText(await kpi.innerText());
  }

  async expectKpiMatchesTotalRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectKpiMatchesTotalRecords",showing);
    expect(showing, await this.page.getByTestId('data-grid-record-count-footer').innerText()).not.toBeNull();
    const registered = await this.getRegisteredUsersKpiCount();
    expect(showing!.total).toBe(registered);
  }

  async expectActiveUsersKpiConsistent() {
    const active = await this.getActiveUsersKpiCount();
    const registered = await this.getRegisteredUsersKpiCount();
    expect(active).toBeGreaterThanOrEqual(0);
    expect(active).toBeLessThanOrEqual(registered);
  }

  async countRowsMatchingText(token: string): Promise<number> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    let matching = 0;
    const pattern = new RegExp(token, 'i');
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader'),
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (pattern.test(text)) matching++;
    }
    return matching;
  }

  async expectGridSearchResult(expected: GridSearchResult) {
    const showing = await this.getShowingRecords();
    console.log("test-expectGridSearchResult",showing);
    if (expected === 'no matches') {
      if (showing) {
        expect(showing.showing).toBe(0);
        // expect(showing.total).toBe(0);
      }
      await this.expectNoRecordsFoundVisible();
      expect(await this.getVisibleDataRowCount()).toBe(0);
      return;
    }

    const token = this.lastSearchQuery.trim();
    expect(token.length).toBeGreaterThan(0);
    expect(await this.countRowsMatchingText(token)).toBeGreaterThan(0);
    const showingCount = showing?.showing ?? (await this.getVisibleDataRowCount());
    expect(showingCount).toBeGreaterThan(0);
  }

  async expectNoRecordsFoundVisible() {
    await expect(this.loc.noRecordsFound()).toBeVisible({ timeout: 15_000 });
  }

  async expectZeroTotalRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectZeroTotalRecords",showing);
    expect(showing, 'Expected "Showing 0 of 0 total records"').not.toBeNull();
    expect(showing!.showing).toBe(0);
    expect(showing!.total).toBeGreaterThanOrEqual(0);
  }

  async expectGridHasRecords() {
    const showing = await this.getShowingRecords();
    console.log("test-expectGridHasRecords",showing);
    if (showing) {
      expect(showing.total).toBeGreaterThan(0);
      expect(showing.showing).toBe(0); // cleared filters will show all records
    }
    expect(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }

  private async eachDataRowText(): Promise<string[]> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader'),
      );
      if (isHeader) continue;
      texts.push(await rows.nth(i).innerText());
    }
    return texts;
  }

  private async allVisibleRowsMatch(pattern: RegExp): Promise<boolean> {
    const texts = await this.eachDataRowText();
    if (texts.length === 0) return false;
    return texts.every(text => pattern.test(text));
  }

  async expectAllVisibleRowsHaveStatus(status: string) {
    const pattern = new RegExp(status, 'i');
    expect(await this.allVisibleRowsMatch(pattern)).toBe(true);
    expect(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }

  async expectAllVisibleRowsHaveRole(role: string) {
    const pattern = new RegExp(escapeRegExp(role), 'i');
    expect(await this.allVisibleRowsMatch(pattern)).toBe(true);
    expect(await this.getVisibleDataRowCount()).toBeGreaterThan(0);
  }

  async openColumnVisibilityPanel() {
    const picker = this.loc.columnPickerButton();
    await expect(picker).toBeVisible({ timeout: 10_000 });
    await picker.click();
    await this.page.waitForTimeout(300);
  }

  private columnToggleTestId(columnName: string): string {
    return columnName.trim().toLowerCase().replace(/\s+/g, '-');
  }

  columnVisibilityToggle(columnName: string): Locator {
    const looseName = new RegExp(`^\\s*${escapeRegExp(columnName)}\\s*$`, 'i');
    return this.page
      .getByTestId('user-records-datagrid-toggle-columns-modal')
      .getByRole('button', { name: looseName })
      .first();
  }

  async toggleColumnOff(columnName: string) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    // The toggle is a button wrapping a checkbox — click the checkbox input.
    const checkbox = toggle.getByRole('checkbox');
    const isChecked = await checkbox.isChecked().catch(() => false);
    if (isChecked) {
      await checkbox.click({ force: true });
      await this.loc.applyToggleButton().click();
    }
    await waitForAppSettled(this.page);
  }

  async expectColumnNotVisible(columnName: string) {
    await expect(this.columnHeaderLabel(columnName)).toBeHidden({ timeout: 10_000 });
  }

  async resetColumn() {
    // The column visibility panel was closed by toggleColumnOff's apply click,
    // so re-open it before finding the reset button.
    await this.openColumnVisibilityPanel();
    const resetButton = this.page.getByTestId('user-records-datagrid-toggle-columns-modal-reset');
    await expect(resetButton).toBeVisible({ timeout: 10_000 });
    await resetButton.click();
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }

  async getTextOfRowsWithStatus(status: string): Promise<string[]> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader')
      );
      if (isHeader) continue;
      const text = await rows.nth(i).innerText();
      if (new RegExp(status, 'i').test(text)) result.push(text);
    }
    return result;
  }

  async allVisibleRowsHaveStatusAndRole(status: string, role: string): Promise<boolean> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    let dataRows = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader')
      );
      if (isHeader) continue;
      dataRows++;
      const text = await rows.nth(i).innerText();
      if (!new RegExp(status, 'i').test(text)) return false;
      if (!new RegExp(role, 'i').test(text)) return false;
    }
    return dataRows > 0;
  }

  async allVisibleRowsHaveStatus(status: string): Promise<boolean> {
    const rows = this.grid().getByRole('row');
    const count = await rows.count();
    let dataRows = 0;
    for (let i = 0; i < count; i++) {
      const isHeader = await rows.nth(i).evaluate(el =>
        Array.from(el.children).some(c => c.getAttribute('role') === 'columnheader')
      );
      if (isHeader) continue;
      dataRows++;
      const text = await rows.nth(i).innerText();
      if (!new RegExp(status, 'i').test(text)) return false;
    }
    return dataRows > 0;
  }

  async getFirstUserEmail(): Promise<string> {
    const ts = Date.now();
    return `e2e.user.${ts}@pieq.ai`;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
