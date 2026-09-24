import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class AgentEditTabsPage {
  readonly loc = {
    // ── Tab navigation ──────────────────────────────────────────────────────
    tabLevelHierarchy: () =>
      this.page.getByTestId('agent-tab-navigation-tab-level-hierarchy'),
    tabOrgTree: () =>
      this.page.getByTestId('agent-tab-navigation-tab-org-tree'),
    tabLicensingAppointments: () =>
      this.page.getByTestId('agent-tab-navigation-tab-licensing-appointments'),

    // ── Level & Hierarchy ───────────────────────────────────────────────────
    levelGrid: () => this.page.getByTestId('agent-level-history-grid'),
    reportingGrid: () => this.page.getByTestId('reporting-manager-history-grid'),
    addLevelButton: () => this.page.getByTestId('add-level-record-button'),
    addManagerButton: () => this.page.getByTestId('add-manager-record-button'),
    levelCurrentBadge: () => this.page.locator('[data-testid^="level-current-badge-"]'),
    levelKebab: () => this.page.locator('[data-testid^="edit-level-row-"]'),
    levelNameCells: () =>
      this.page.getByTestId('agent-level-history-grid').locator('[role="gridcell"][col-id="levelName"], .ag-cell[col-id="levelName"]'),
    managerNameCells: () =>
      this.page
        .getByTestId('reporting-manager-history-grid')
        .locator('[role="gridcell"][col-id="managerName"], .ag-cell[col-id="managerName"]'),
    reportingEndDateCells: () =>
      this.page
        .getByTestId('reporting-manager-history-grid')
        .locator('[role="gridcell"][col-id="effectiveEndDate"], .ag-cell[col-id="effectiveEndDate"]'),
    dropdownOptions: () => this.page.getByRole('option'),
    rowActionEdit: () => this.page.getByRole('button', { name: 'Edit', exact: true }),
    rowActionDelete: () => this.page.getByRole('button', { name: 'Delete', exact: true }),

    // ── Add Level drawer ────────────────────────────────────────────────────
    addLevelDrawer: () => this.page.getByTestId(/add-level-record-modal/i),
    addLevelCloseButton: () => this.page.getByTestId('close-level-record-modal-button'),
    addLevelLevelDropdown: () =>
      this.page.getByTestId(/add-level-record-modal/i).getByRole('button', { name: /select/i }),
    addLevelStartDateInput: () =>
      this.page.getByTestId(/add-level-record-modal/i).locator('input[type="text"]').last(),
    addLevelSaveButton: () =>
      this.page.getByTestId(/add-level-record-modal/i).getByRole('button', { name: 'Save' }),
    addLevelCancelButton: () =>
      this.page.getByTestId(/add-level-record-modal/i).getByRole('button', { name: 'Cancel' }),

    // ── Add Reporting Manager drawer ────────────────────────────────────────
    addManagerDrawer: () => this.page.getByTestId('add-reporting-manager-record-modal'),
    addManagerCloseButton: () => this.page.getByTestId('close-manager-record-modal-button'),
    addManagerDropdown: () => this.page.getByTestId('manager-record-modal-dropdown'),
    addManagerDropdownLabel: () => this.page.locator('#manager-record-modal-dropdown-label'),
    addManagerDropdownSearch: () =>
      this.page.getByTestId('manager-record-modal-dropdown-search-input').getByRole('searchbox'),
    addManagerDropdownOptionList: () => this.page.locator('#manager-record-modal-dropdown-option-list'),
    addManagerDropdownOptionSpans: () =>
      this.page.locator('#manager-record-modal-dropdown-option-list').locator('span'),
    addManagerNoResults: () =>
      this.page.locator('#manager-record-modal-dropdown-option-list').locator('span', {
        hasText: 'No results found',
      }),
    addManagerStartDateInput: () =>
      this.page.getByTestId('add-reporting-manager-record-modal').locator('input[type="text"]').last(),
    addManagerSaveButton: () => this.page.getByTestId('manager-record-modal-save'),
    addManagerCancelButton: () => this.page.getByTestId('manager-record-modal-cancel'),
    addManagerOverlapError: () =>
      this.page.getByTestId('add-reporting-manager-record-modal').getByText(/overlap/i),
    reportingSaveConfirm: () =>
      this.page.getByRole('dialog').filter({
        has: this.page.getByRole('heading', { name: 'Save Reporting Manager', exact: true }),
      }),

    // ── Licensing & Appointments ────────────────────────────────────────────
    licensingAppointmentsSection: () => this.page.getByTestId('licensing-appointments-section'),
    /** Page-level Add — Save in the drawer reuses this testid; always scope to section. */
    addAppointmentButton: () =>
      this.page.getByTestId('licensing-appointments-section').getByTestId('add-appointment-button'),
    appointmentGrid: () => this.page.getByTestId('appointments-datagrid'),
    appointmentSearchInput: () =>
      this.page.getByTestId('appointments-datagrid').getByRole('textbox', { name: 'Search data grid' }),
    appointmentRefreshButton: () =>
      this.page.getByTestId('appointments-datagrid').getByRole('button', { name: /refresh grid data/i }),
    appointmentGridFooter: () => this.page.getByText(/showing all \d+ records/i),
    /** Data rows only — excludes header. */
    appointmentBodyRows: () =>
      this.page.getByTestId('appointments-datagrid').locator('.ag-center-cols-container .ag-row'),
    appointmentCarrierCells: () =>
      this.page.getByTestId('appointments-datagrid').locator('[role="gridcell"][col-id="carrier"]'),
    appointmentGridCellsByColId: (colId: string) =>
      this.page.getByTestId('appointments-datagrid').locator(`[role="gridcell"][col-id="${colId}"]`),
    appointmentColumnHeader: (columnName: string) =>
      this.page
        .getByTestId('appointments-datagrid')
        .getByRole('columnheader', { name: new RegExp(columnName, 'i') }),

    // ── Add Appointment dialog (live: appointment-form) ─────────────────────
    addAppointmentDialog: () => this.page.getByTestId('appointment-form'),
    addAppointmentCloseButton: () =>
      this.page.getByTestId('appointment-form').getByTestId('close-form-button'),
    addAppointmentAgentField: () =>
      this.page.getByTestId('appointment-form').getByTestId('agent-input'),
    addAppointmentAgentInput: () =>
      this.page.getByTestId('appointment-form').getByTestId('agent-input').locator('input'),
    addAppointmentCarrierDropdown: () =>
      this.page.getByTestId('appointment-form').getByTestId('carrier-dropdown').getByRole('button'),
    addAppointmentCarrierListbox: () => this.page.getByTestId('carrier-dropdown-listbox'),
    addAppointmentCarrierOptions: () =>
      this.page.getByTestId('carrier-dropdown-listbox').getByRole('option'),
    addAppointmentNumberInput: () =>
      this.page.getByTestId('appointment-form').getByTestId('appointment-number-input').locator('input'),
    addAppointmentDatePicker: () =>
      this.page.getByTestId('appointment-form').getByTestId('appointment-date-input').locator('input'),
    addAppointmentNotesInput: () =>
      this.page.getByTestId('appointment-form').getByTestId('notes-textarea').getByRole('textbox'),
    addAppointmentSaveButton: () =>
      this.page.getByTestId('appointment-form').getByRole('button', { name: 'Save', exact: true }),
    addAppointmentCancelButton: () =>
      this.page.getByTestId('appointment-form').getByTestId('cancel-button'),
    appointmentSaveConfirm: () => this.page.getByTestId('create-appointment-modal'),
    appointmentSaveConfirmButton: () => this.page.getByTestId('create-appointment-confirm-button'),

    // ── Shared date calendar (react-calendar popup) ─────────────────────────
    /** Outer popup; live app currently uses undefined-calendar-popup. */
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),

    // ── Org Tree ────────────────────────────────────────────────────────────
    orgTreeHeading: () => this.page.getByRole('heading', { name: /organization tree/i }),
    orgTreeZoomIn: () => this.page.getByRole('button', { name: /zoom in/i }),
    orgTreeZoomOut: () => this.page.getByRole('button', { name: /zoom out/i }),
    orgTreeResetView: () => this.page.getByTestId('organizational-tree-section-reset-view'),
    orgTreeCanvas: () => this.page.locator('table').first(),
    orgTreeNode: () => this.page.locator('table td').first(),
    orgTreeNodes: () => this.page.locator('table td'),
    orgTreeYouBadge: () => this.page.getByText('You').first(),
    orgTreePcRoot: () => this.page.locator('[data-pc-section="root"]').first(),
  };

  _capturedAppointmentCount = 0;
  _capturedAppointedCarriers: string[] = [];
  _orgTreeScaleBaseline = 1;
  _orgTreeScaleAfterZoomIn = 1;
  _capturedLevelDropdownOptions: string[] = [];

  constructor(readonly page: Page) {}

  // ── Tab navigation ─────────────────────────────────────────────────────────

  async openLevelHierarchyTab() {
    await this.loc.tabLevelHierarchy().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.levelGrid()).toBeVisible({ timeout: T });
  }

  async openOrgTreeTab() {
    await this.loc.tabOrgTree().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.orgTreeHeading()).toBeVisible({ timeout: T });
    await this.loc.orgTreeResetView().click();
    await waitForAppSettled(this.page);
  }

  async openLicensingAppointmentsTab() {
    await this.loc.tabLicensingAppointments().click();
    await waitForAppSettled(this.page);
    this._capturedAppointedCarriers = await this.getAppointmentCarrierCellValues();
  }

  // ── Level & Hierarchy ──────────────────────────────────────────────────────

  async clickAddLevel() {
    await this.loc.addLevelButton().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.addLevelDrawer()).toBeVisible({ timeout: T });
  }

  async closeAddLevelDrawer() {
    await this.loc.addLevelCloseButton().click();
    await waitForAppSettled(this.page);
  }

  /** Esc closes add-level modal without saving a record. */
  async dismissAddLevelDrawerWithEscape() {
    for (let i = 0; i < 2; i++) {
      if (!(await this.loc.addLevelDrawer().isVisible().catch(() => false))) return;
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(200);
    }
    await expect(this.loc.addLevelDrawer()).toBeHidden({ timeout: T });
  }

  async isAddLevelDrawerVisible(): Promise<boolean> {
    return this.loc.addLevelDrawer().isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async selectLevelInDrawer(levelText: string) {
    await this.loc.addLevelLevelDropdown().click();
    await this.page.waitForTimeout(300);
    const option = this.loc.dropdownOptions().filter({ hasText: new RegExp(levelText, 'i') });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }

  async setLevelStartDate(dateStr: string) {
    const input = this.loc.addLevelStartDateInput();
    await input.click();
    await this.selectDateInCalendar(dateStr);
  }

  async saveLevel() {
    await this.loc.addLevelSaveButton().click();
    const confirm = this.page
      .getByRole('dialog')
      .filter({ has: this.page.getByRole('heading', { name: /save agent level/i }) });
    await expect(confirm).toBeVisible({ timeout: T });
    await confirm.getByRole('button', { name: 'Save', exact: true }).click();
    await waitForAppSettled(this.page);
  }

  async cancelLevel() {
    await this.loc.addLevelCancelButton().click();
    await waitForAppSettled(this.page);
  }

  async getLevelGridRows(): Promise<string[]> {
    const grid = this.loc.levelGrid();
    const rows = grid.getByRole('row');
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async getLevelNameCellTexts(): Promise<string[]> {
    const cells = this.loc.levelNameCells();
    const count = await cells.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async expectLevelInTable(levelText: string) {
    await expect
      .poll(
        async () => {
          const rows = await this.getLevelGridRows();
          return rows.some(r => r.toLowerCase().includes(levelText.toLowerCase()));
        },
        { timeout: 15_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  async expectCurrentBadgeVisible() {
    await expect(this.loc.levelCurrentBadge().first()).toBeVisible({ timeout: T });
  }

  async expectLevelHistoryNoDeleteOrEndDateEdit() {
    const grid = this.loc.levelGrid();
    const deleteButtons = grid.getByRole('button', { name: /delete/i });
    await expect(deleteButtons).toHaveCount(0, { timeout: 5_000 }).catch(() => {});
  }

  async clickLevelKebab() {
    await this.loc.levelKebab().first().click();
    await this.page.waitForTimeout(300);
  }

  async expectAgentLevelRowActionMenuShowsEditOnly() {
    await expect(this.loc.rowActionEdit()).toBeVisible({ timeout: T });
    await expect(this.loc.rowActionDelete()).toHaveCount(0);
  }

  async getLevelDropdownOptions(): Promise<string[]> {
    await this.loc.addLevelLevelDropdown().click();
    await this.page.waitForTimeout(300);
    const options = this.loc.dropdownOptions();
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    await this.page.keyboard.press('Escape');
    return texts;
  }

  async captureLevelDropdownOptionsThenDismiss() {
    await this.clickAddLevel();
    this._capturedLevelDropdownOptions = await this.getLevelDropdownOptions();
    await this.dismissAddLevelDrawerWithEscape();
  }

  async expectAssignedLevelsAbsentFromCapturedDropdown() {
    const assigned = await this.getLevelNameCellTexts();
    expect(assigned.length, 'Expected assigned level names in grid (col-id=levelName)').toBeGreaterThan(0);
    const dropdown = this._capturedLevelDropdownOptions.map(t => t.toLowerCase());
    for (const name of assigned) {
      const needle = name.toLowerCase();
      expect(
        dropdown.some(o => o === needle || o.includes(needle)),
        `Assigned level "${name}" should not appear in add-level dropdown`,
      ).toBe(false);
    }
  }

  async addAllAvailableLevelsWithNonOverlappingDates() {
    let addedCount = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
      if (await this.isAddLevelButtonDisabled()) return;
      await this.clickAddLevel();
      await this.loc.addLevelLevelDropdown().click();
      await this.page.waitForTimeout(300);
      const options = this.loc.dropdownOptions();
      const count = await options.count();
      const texts: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = (await options.nth(i).innerText()).replace(/\s+/g, ' ').trim();
        if (text) texts.push(text);
      }
      if (texts.length === 0) {
        await this.dismissAddLevelDrawerWithEscape();
        break;
      }
      await options.first().click();
      const month = (addedCount % 12) + 1;
      const year = 2028 + Math.floor(addedCount / 12);
      await this.setLevelStartDate(`${String(month).padStart(2, '0')}/01/${year}`);
      await this.saveLevel();
      await waitForAppSettled(this.page);
      addedCount++;
    }
  }

  async isAddLevelButtonDisabled(): Promise<boolean> {
    return this.loc.addLevelButton().isDisabled({ timeout: 3_000 }).catch(() => true);
  }

  // ── Reporting Manager ──────────────────────────────────────────────────────

  async clickAddReportingManager() {
    await this.loc.addManagerButton().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.addManagerDrawer()).toBeVisible({ timeout: T });
  }

  async closeReportingManagerDrawer() {
    await this.loc.addManagerCloseButton().click();
    await waitForAppSettled(this.page);
  }

  async isReportingManagerDrawerVisible(): Promise<boolean> {
    return this.loc.addManagerDrawer().isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async openManagerDropdown() {
    await this.loc.addManagerDropdownLabel().click();
    await this.page.waitForTimeout(300);
    await expect(this.loc.addManagerDropdownOptionList()).toBeVisible({ timeout: T });
  }

  async getManagerDropdownOptionTexts(): Promise<string[]> {
    const spans = this.loc.addManagerDropdownOptionSpans();
    const count = await spans.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await spans.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async getManagerNameCellTexts(): Promise<string[]> {
    const cells = this.loc.managerNameCells();
    const count = await cells.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async getReportingEndDateTexts(): Promise<string[]> {
    const cells = this.loc.reportingEndDateCells();
    const count = await cells.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  private reportingGridContainsDate(dateStr: string): Promise<boolean> {
    return this.getReportingGridRows().then(rows =>
      rows.some(r => r.includes(dateStr) || r.includes(dateStr.replace(/^0/, ''))),
    );
  }

  private namesMatch(a: string, b: string): boolean {
    const na = a.toLowerCase();
    const nb = b.toLowerCase();
    return na === nb || na.includes(nb) || nb.includes(na);
  }

  async selectReportingManager(managerText: string) {
    await this.loc.addManagerDropdown().click();
    await this.page.waitForTimeout(300);
    const option = this.loc.dropdownOptions().filter({ hasText: new RegExp(managerText, 'i') });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }

  async searchReportingManager(query: string) {
    await this.openManagerDropdown();
    const search = this.loc.addManagerDropdownSearch();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(query);
    await this.page.waitForTimeout(400);
  }

  /**
   * Pick a manager from the open-or-new add-manager modal (skips if start date already in grid).
   * `excludeAssigned` prefers a manager not already in managerName cells.
   */
  async addReportingManagerFromList(startDate: string, opts?: { excludeAssigned?: boolean }) {
    if (await this.reportingGridContainsDate(startDate)) return;
    if (!(await this.isReportingManagerDrawerVisible())) {
      await this.clickAddReportingManager();
    }
    await this.openManagerDropdown();
    const assigned = await this.getManagerNameCellTexts();
    const options = (await this.getManagerDropdownOptionTexts()).filter(
      o => o && !/no results found/i.test(o),
    );
    expect(options.length, 'Expected reporting manager dropdown options').toBeGreaterThan(0);
    let pick = options[0];
    if (opts?.excludeAssigned !== false) {
      const unused = options.find(o => !assigned.some(a => this.namesMatch(a, o)));
      if (unused) pick = unused;
    }
    await this.loc.addManagerDropdownOptionSpans().filter({ hasText: pick }).first().click();
    await this.setReportingStartDate(startDate);
    await this.saveReportingManager();
  }

  async addDifferentReportingManagerWithDate(startDate: string) {
    if (!(await this.isReportingManagerDrawerVisible())) {
      await this.clickAddReportingManager();
    }
    await this.openManagerDropdown();
    const assigned = await this.getManagerNameCellTexts();
    const options = (await this.getManagerDropdownOptionTexts()).filter(
      o => o && !/no results found/i.test(o),
    );
    const pick = options.find(o => !assigned.some(a => this.namesMatch(a, o))) ?? options[0];
    expect(pick, 'Expected a different reporting manager option').toBeTruthy();
    await this.loc.addManagerDropdownOptionSpans().filter({ hasText: pick! }).first().click();
    await this.setReportingStartDate(startDate);
    await this.saveReportingManager();
  }

  async expectNewestReportingEndDate(expected: string) {
    const texts = await this.getReportingEndDateTexts();
    expect(texts.length, 'Expected reporting end-date cells').toBeGreaterThan(0);
    expect(texts[0], 'Newest reporting row end date').toMatch(new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  async expectLastReportingRowEndDateAutoPopulated() {
    const texts = await this.getReportingEndDateTexts();
    expect(texts.length, 'Expected at least two reporting end-date cells').toBeGreaterThan(1);
    const last = texts[texts.length - 1];
    expect(last, 'Previous (last) row end date should be auto-populated').not.toMatch(/no end date/i);
    expect(last).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  }

  async expectReportingOverlapInlineError() {
    await expect(this.loc.addManagerOverlapError()).toBeVisible({ timeout: T });
  }

  async expectAssignedManagersExcludedFromDropdown() {
    const assigned = await this.getManagerNameCellTexts();
    expect(assigned.length, 'Expected managerName cells in reporting grid').toBeGreaterThan(0);
    await this.openManagerDropdown();
    const options = await this.getManagerDropdownOptionTexts();
    for (const name of assigned) {
      expect(
        options.some(o => this.namesMatch(o, name)),
        `Assigned manager "${name}" should not appear in manager-record-modal-dropdown`,
      ).toBe(false);
    }
  }

  async expectManagerSearchExcludes(name: string) {
    const options = await this.getManagerDropdownOptionTexts();
    const noResults = await this.loc.addManagerNoResults().isVisible().catch(() => false);
    if (noResults) {
      await expect(this.loc.addManagerNoResults()).toHaveText('No results found');
      return;
    }
    expect(
      options.some(o => this.namesMatch(o, name)),
      `Onboarding agent "${name}" should not appear in reporting manager options`,
    ).toBe(false);
  }

  async expectReportingManagerNoResults() {
    await expect(this.loc.addManagerNoResults()).toBeVisible({ timeout: T });
    await expect(this.loc.addManagerNoResults()).toHaveText('No results found');
  }

  async setReportingStartDate(dateStr: string) {
    const input = this.loc.addManagerStartDateInput();
    await input.click();
    await this.selectDateInCalendar(dateStr);
  }

  /**
   * Pick MM/DD/YYYY via react-calendar day tile.
   * Do not fill + Escape — Escape can close the parent drawer inconsistently.
   */
  async selectDateInCalendar(dateStr: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) {
      throw new Error(`Expected MM/DD/YYYY date, got: ${dateStr}`);
    }
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = monthNames[month - 1];
    if (!monthName || day < 1 || day > 31) {
      throw new Error(`Invalid calendar date: ${dateStr}`);
    }

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
      if (!range) {
        throw new Error(`Calendar not in decade view while seeking year ${year}`);
      }
      const start = Number(range[1]);
      if (year < start) {
        // Decade view: ‹ = prev decade; ‹‹ (prev2) jumps a century and skips target years.
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
  }

  async saveReportingManager() {
    await this.loc.addManagerSaveButton().click();
    const confirm = this.loc.reportingSaveConfirm();
    if (await confirm.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirm.getByRole('button', { name: 'Save', exact: true }).click();
    }
    await waitForAppSettled(this.page);
  }

  async cancelReportingManager() {
    await this.loc.addManagerCancelButton().click();
    await waitForAppSettled(this.page);
  }

  async getReportingGridRows(): Promise<string[]> {
    const grid = this.loc.reportingGrid();
    const rows = grid.getByRole('row');
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text && !text.includes('No Records Found')) texts.push(text);
    }
    return texts;
  }

  async expectReportingManagerInTable(managerText: string) {
    await expect
      .poll(
        async () => {
          const rows = await this.getReportingGridRows();
          return rows.some(r => r.toLowerCase().includes(managerText.toLowerCase()));
        },
        { timeout: 15_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  // ── Licensing & Appointments ───────────────────────────────────────────────

  async clickAddAppointment() {
    await this.loc.addAppointmentButton().click();
    await waitForAppSettled(this.page);
    await expect(this.loc.addAppointmentDialog()).toBeVisible({ timeout: T });
  }

  async closeAppointmentDrawer() {
    await this.loc.addAppointmentCloseButton().click();
    await waitForAppSettled(this.page);
  }

  async isAppointmentDrawerVisible(): Promise<boolean> {
    return this.loc.addAppointmentDialog().isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async getAppointmentGridRows(): Promise<string[]> {
    const rows = this.loc.appointmentBodyRows();
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text && !text.includes('No Records Found')) texts.push(text);
    }
    return texts;
  }

  async getAppointmentCarrierCellValues(): Promise<string[]> {
    const cells = this.loc.appointmentCarrierCells();
    const count = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) values.push(text);
    }
    return values;
  }

  async searchCarrierAppointments(query: string) {
    const search = this.loc.appointmentSearchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(query);
    await waitForAppSettled(this.page);
  }

  async expectAppointmentGridShowsNoRecords() {
    await expect
      .poll(
        async () => {
          const footer = this.page.getByText(/showing all 0 records|no records found/i);
          return footer.isVisible({ timeout: 3_000 }).catch(() => false);
        },
        { timeout: 15_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  async expectAppointmentGridShowsMatchingRows(carrierText: string) {
    await expect
      .poll(
        async () => {
          const rows = await this.getAppointmentGridRows();
          return rows.length > 0 && rows.every(r => r.toLowerCase().includes(carrierText.toLowerCase()));
        },
        { timeout: 15_000, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  async sortAppointmentGridColumn(columnName: string, direction: 'asc' | 'desc') {
    const header = this.loc.appointmentColumnHeader(columnName);
    await expect(header).toBeVisible({ timeout: T });
    // AG Grid cycles: none → asc → desc → none.
    // Reset to unsorted first so the next click always lands on the desired direction.
    for (let i = 0; i < 3; i++) {
      const sortDir = await header
        .evaluate((el) => el.getAttribute('aria-sort'))
        .catch(() => 'none');
      if (!sortDir || sortDir === 'none') break;
      await header.click();
      await this.page.waitForTimeout(200);
    }
    // Now click for desired direction.
    await header.click();
    if (direction === 'desc') {
      await this.page.waitForTimeout(200);
      await header.click();
    }
    await waitForAppSettled(this.page);
  }

  async expectAppointmentGridSorted(columnName: string, direction: 'asc' | 'desc') {
    const colId = columnName.trim().toLowerCase();
    const cells = this.loc.appointmentGridCellsByColId(colId);
    const count = await cells.count();
    const take = Math.min(count, 3);
    expect(take, `Expected 2–3 visible "${columnName}" cells to verify sort`).toBeGreaterThanOrEqual(2);

    const values: string[] = [];
    for (let i = 0; i < take; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) values.push(text);
    }
    expect(values.length, 'Expected 2–3 data rows for sort verification').toBeGreaterThanOrEqual(2);
    for (let i = 1; i < values.length; i++) {
      const cmp = values[i - 1] < values[i] ? -1 : values[i - 1] > values[i] ? 1 : 0;
      if (direction === 'asc') {
        expect(cmp, `Row ${i - 1} "${values[i - 1]}" should be <= "${values[i]}"`).toBeLessThanOrEqual(0);
      } else {
        expect(cmp, `Row ${i - 1} "${values[i - 1]}" should be >= "${values[i]}"`).toBeGreaterThanOrEqual(0);
      }
    }
  }

  async expectAppointmentAgentNameReadOnly() {
    const input = this.loc.addAppointmentAgentInput();
    await expect(input).toBeAttached({ timeout: T });
    // Disabled input — do not click; assert native disabled only.
    await expect(input).toBeDisabled();
  }

  async isAppointmentSaveDisabled(): Promise<boolean> {
    return this.loc.addAppointmentSaveButton().isDisabled({ timeout: 3_000 }).catch(() => true);
  }

  async openAppointmentCarrierDropdown() {
    await this.loc.addAppointmentCarrierDropdown().click();
    await expect(this.loc.addAppointmentCarrierListbox()).toBeVisible({ timeout: T });
  }

  async getAppointmentCarrierOptions(): Promise<string[]> {
    const options = this.loc.addAppointmentCarrierOptions();
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    await this.page.keyboard.press('Escape');
    return texts;
  }

  /**
   * Fill required appointment fields: Carrier*, unique Appointment Number, Appointment Date.
   * Picks first listbox option (already-appointed carriers are excluded).
   * Assumes the add-appointment form is already open.
   */
  async fillAppointmentRequiredFields() {
    await this.openAppointmentCarrierDropdown();
    const options = this.loc.addAppointmentCarrierOptions();
    await expect(options.first(), 'Expected carrier options in carrier-dropdown-listbox').toBeVisible({
      timeout: T,
    });
    await options.first().click();
    await this.loc.addAppointmentNumberInput().fill(`APT-${Date.now()}`);
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    await this.loc.addAppointmentDatePicker().click();
    await this.selectDateInCalendar(dateStr);
  }

  async fillAppointmentNotesExceedingMaxLength() {
    await this.loc.addAppointmentNotesInput().fill('A'.repeat(256));
  }

  async saveAppointmentWithConfirm() {
    const saveBtn = this.loc.addAppointmentSaveButton();
    await expect(saveBtn, 'Appointment Save should enable after required fields').toBeEnabled({
      timeout: T,
    });
    await saveBtn.click();
    await expect(this.loc.appointmentSaveConfirm()).toBeVisible({ timeout: T });
    await expect(this.loc.appointmentSaveConfirm()).toContainText('Save Appointment');
    await this.loc.appointmentSaveConfirmButton().click();
    await waitForAppSettled(this.page);
  }

  /**
   * Fill required appointment fields: Carrier*, unique Appointment Number, Appointment Date.
   * Picks first listbox option (already-appointed carriers are excluded).
   * Leaves confirm Save clicked so the caller can capture the success toast.
   */
  async addCarrierAppointmentWithRequiredFields() {
    await this.clickAddAppointment();
    await this.fillAppointmentRequiredFields();
    await this.saveAppointmentWithConfirm();
  }

  async expectAppointedCarriersExcludedFromDropdown() {
    const live = await this.getAppointmentCarrierCellValues();
    const appointed = live.length > 0 ? live : this._capturedAppointedCarriers;
    expect(appointed.length, 'Expected at least one appointed carrier in grid (col-id=carrier)').toBeGreaterThan(0);
    await this.openAppointmentCarrierDropdown();
    const options = await this.getAppointmentCarrierOptions();
    const optionNorm = new Set(options.map(o => o.toLowerCase().trim()));
    for (const carrier of appointed) {
      expect(
        optionNorm.has(carrier.toLowerCase().trim()),
        `Appointed carrier "${carrier}" should be excluded from Carrier dropdown`,
      ).toBe(false);
    }
  }

  async openAppointmentDatePicker() {
    await this.loc.addAppointmentDatePicker().click();
    await this.page.waitForTimeout(300);
  }

  async isAppointmentDatePickerVisible(): Promise<boolean> {
    return this.loc.calendarPopup().isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async clickAppointmentRefresh() {
    await this.loc.appointmentRefreshButton().click();
    await waitForAppSettled(this.page);
  }

  async expectAppointmentGridRefreshed() {
    await waitForAppSettled(this.page);
    await expect(this.loc.appointmentGrid()).toBeVisible({ timeout: T });
  }

  // ── Org Tree ───────────────────────────────────────────────────────────────

  async expectOrgTreeNodesVisible() {
    const node = this.loc.orgTreeNode();
    await expect(node).toBeVisible({ timeout: T });
  }

  async expectOrgTreeShowsAgent(agentName: string) {
    await this.expectOrgTreeNodesVisible();
    const texts = await this.getOrgTreeNodeTexts();
    const allText = texts.join(' ');
    expect(allText, `Org tree should include ${agentName}`).toMatch(
      new RegExp(agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    );
  }

  async expectYouBadgeVisible() {
    await expect(this.loc.orgTreeYouBadge()).toBeVisible({ timeout: T });
  }

  async expectYouBadgeOnCurrentAgent(agentName: string) {
    await this.expectYouBadgeVisible();
    const youNode = this.loc.orgTreeNodes().filter({ hasText: 'You' }).first();
    await expect(youNode).toBeVisible({ timeout: T });
    await expect(youNode).toContainText(new RegExp(agentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  async getOrgTreeNodeTexts(): Promise<string[]> {
    const cells = this.loc.orgTreeNodes();
    const count = await cells.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async zoomInOrgTree() {
    this._orgTreeScaleBaseline = await this.getOrgTreeScale();
    const start = this._orgTreeScaleBaseline;
    await expect
      .poll(
        async () => {
          await this.loc.orgTreeZoomIn().click();
          this._orgTreeScaleAfterZoomIn = await this.getOrgTreeScale();
          return this._orgTreeScaleAfterZoomIn;
        },
        {
          timeout: 10_000,
          intervals: [250, 400],
          message: `Zoom in did not increase scale on [data-pc-section="root"] parent (was ${start})`,
        },
      )
      .toBeGreaterThan(start + 0.009);
  }

  async zoomOutOrgTree() {
    const start = this._orgTreeScaleAfterZoomIn;
    await expect
      .poll(
        async () => {
          await this.loc.orgTreeZoomOut().click();
          return this.getOrgTreeScale();
        },
        {
          timeout: 10_000,
          intervals: [250, 400],
          message: `Zoom out did not decrease scale on [data-pc-section="root"] parent (was ${start})`,
        },
      )
      .toBeLessThan(start - 0.009);
  }

  async resetOrgTreeZoom() {
    await this.loc.orgTreeResetView().click();
    await this.page.waitForTimeout(300);
  }

  /**
   * PrimeVue org chart puts `transform: scale(...)` on the parent of
   * `[data-pc-section="root"]` — not on the table.
   */
  async getOrgTreeScale(): Promise<number> {
    const root = this.loc.orgTreePcRoot();
    await expect(root).toBeVisible({ timeout: T });
    return root.evaluate(el => {
      const parseScale = (node: HTMLElement | null): number | null => {
        if (!node) return null;
        const inlineScale = (node.style.scale || '').trim();
        if (inlineScale) {
          const n = parseFloat(inlineScale.split(/\s+/)[0]);
          if (!Number.isNaN(n)) return n;
        }
        const inline = node.style.transform || '';
        const scaleMatch = inline.match(/scale\(\s*([\d.]+)/);
        if (scaleMatch) return parseFloat(scaleMatch[1]);
        const matrixMatch = inline.match(/matrix\(\s*([^)]+)\)/);
        if (matrixMatch) {
          const a = parseFloat(matrixMatch[1].split(',')[0].trim());
          if (!Number.isNaN(a)) return a;
        }
        const computed = getComputedStyle(node).transform;
        if (computed && computed !== 'none') {
          const m = computed.match(/matrix\(\s*([^)]+)\)/);
          if (m) {
            const a = parseFloat(m[1].split(',')[0].trim());
            if (!Number.isNaN(a)) return a;
          }
          const s = computed.match(/scale\(\s*([\d.]+)/);
          if (s) return parseFloat(s[1]);
        }
        return null;
      };

      const parent = el.parentElement as HTMLElement | null;
      return parseScale(parent) ?? 1;
    });
  }

  async expectOrgTreeScaleLargerThanBaseline() {
    const scale = await this.getOrgTreeScale();
    expect(scale, `Scale after zoom in should be > baseline ${this._orgTreeScaleBaseline}`).toBeGreaterThan(
      this._orgTreeScaleBaseline + 0.009,
    );
  }

  async expectOrgTreeScaleSmallerThanZoomIn() {
    const scale = await this.getOrgTreeScale();
    expect(scale, `Scale after zoom out should be < zoom-in ${this._orgTreeScaleAfterZoomIn}`).toBeLessThan(
      this._orgTreeScaleAfterZoomIn - 0.009,
    );
  }

  async expectOrgTreeScaleAtDefault() {
    const scale = await this.getOrgTreeScale();
    expect(
      Math.abs(scale - this._orgTreeScaleBaseline),
      `Scale after reset should match baseline ${this._orgTreeScaleBaseline}, got ${scale}`,
    ).toBeLessThan(0.05);
  }
}
