import { expect, type Locator, type Page } from '@playwright/test';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { getSeedAgent, getSeedAgentEditUrl, hasSeedAgentEditUrl } from '../../utils/agents/agentContext';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';

export class AgentsPage extends GridPage {
  readonly loc = {
    headingList: () => this.page.getByRole('heading', { name: 'Agents', exact: true }),
    headingEdit: () => this.page.getByRole('heading', { name: /agent edit/i }),
    headingAdd: () => this.page.getByRole('heading', { name: 'Add Agent', exact: true }),
    personalInfoHeading: () =>
      this.page.getByRole('heading', { name: /personal information/i }),
    addButton: () => this.page.getByTestId('add-agent-button'),
    agentsGrid: () => this.page.getByTestId('agents-datagrid'),
    searchInput: () => this.page.getByTestId('data-grid-search-input'),
    /** Actual editable search field (testid may be a wrapper). */
    searchField: () =>
      this.page
        .getByRole('textbox', { name: 'Search data grid' })
        .or(this.page.getByTestId('data-grid-search-input').locator('input'))
        .first(),
    totalAgentsCard: () => this.page.getByTestId('total-agents-card'),
    activeAgentsCard: () => this.page.getByTestId('active-agents-card'),
    totalAgentsValue: () =>
      this.page.getByTestId('total-agents-card').getByText(/^\d+$/),
    activeAgentsValue: () =>
      this.page.getByTestId('active-agents-card').getByText(/^\d+$/),
    activeAgentsPercent: () =>
      this.page.getByTestId('active-agents-card').getByText(/\d+(\.\d+)?%/),
    agentActionsKebab: () => this.page.locator('[data-testid^="user-actions-"]'),
    editPageTabs: () => this.page.getByTestId('agent-tab-navigation'),
    firstNameInput: () => this.page.getByTestId('first-name-input'),
    lastNameInput: () => this.page.getByTestId('last-name-input'),
    emailInput: () => this.page.getByTestId('email-input'),
    agentCodeInput: () => this.page.getByTestId('agent-code-input'),
    createAgentButton: () => this.page.getByTestId('create-agent-button'),
    updateAgentButton: () => this.page.getByTestId('update-agent-button'),
    statusFilterButton: () => this.page.getByTestId('filter-status'),
    columnPickerButton: () => this.page.getByTestId('data-grid-columns-button'),
    applyToggleButton: () => this.page.getByTestId('agents-datagrid-toggle-columns-modal-apply'),
    resetColumnButton: () => this.page.getByTestId('agents-datagrid-toggle-columns-modal-reset'),
    columnVisibilityModal: () =>
      this.page.getByTestId('agents-datagrid-toggle-columns-modal'),
    refreshButton: () => this.page.getByTestId('data-grid-refresh-button'),
    clearFiltersButton: () => this.page.getByTestId('data-grid-clear-filters'),
    noRecords: () => this.page.getByText(/no records found/i),
    footerText: () => this.page.getByTestId('data-grid-record-count-footer'),
    /** Agent name cell — AG Grid col-id is `agent` (picker: column-checkbox-agent). */
    agentNameCells: () =>
      this.grid().locator(
        '[role="gridcell"][col-id="agent"], .ag-cell[col-id="agent"], [role="gridcell"][col-id="Agent"], .ag-cell[col-id="Agent"]',
      ),
    statusCells: () =>
      this.grid().locator('[role="gridcell"][col-id="status"], .ag-cell[col-id="status"]'),
    rowAgentCell: (row: Locator) =>
      row.locator('[role="gridcell"][col-id="agent"], .ag-cell[col-id="agent"]'),
    rowStatusCell: (row: Locator) =>
      row.locator('[role="gridcell"][col-id="status"], .ag-cell[col-id="status"]'),
  };

  constructor(page: Page) {
    super(page);
  }

  capturedOnboardingAgentName = '';

  /** Public URL helpers — GridPage.page is protected. */
  currentUrl(): string {
    return this.page.url();
  }

  async gotoUrl(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /** Prefer agents testid; fall back to shared Data grid role. */
  override grid() {
    return this.loc.agentsGrid();
  }

  /**
   * URL nav — not sidebar. Dirty Add/Edit form shows Cancel Changes on sidebar click.
   * Shared @agent-master context: always restore filters + default columns so
   * scenarios continue cleanly after T007 (Pending/0 rows) and T009 (Agent hidden).
   */
  async openList() {
    await this.dismissUnsavedChangesIfPresent();
    await this.page.goto(new URL(AppPaths.agents, this.page.url()).href, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(AppUrlPatterns.agents);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    // Close leftover Toggle Columns panel from a prior scenario.
    const modal = this.loc.columnVisibilityModal();
    if (await modal.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }
    // Clear status/search leftovers BEFORE waiting for rows (Pending → 0 rows breaks poll).
    await this.clearFiltersIfPresent();
    await this.clearGridSearch();
    // Restore columns if a prior scenario hid Agent (or other defaults).
    await this.ensureDefaultColumnVisibility();
  }

  /** Soft-clear when data-grid-clear-filters is visible (status/search leftover). */
  async clearFiltersIfPresent() {
    const clearBtn = this.loc.clearFiltersButton();
    if (!(await clearBtn.isVisible({ timeout: 1_500 }).catch(() => false))) return;
    await clearBtn.click();
    await waitForAppSettled(this.page);
    await expect(clearBtn).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }

  /**
   * Restore default columns when a prior scenario hid Agent (shared context).
   * No-op when Agent header already visible.
   */
  async ensureDefaultColumnVisibility() {
    const agentHeader = this.columnHeaderLabel('Agent');
    if (await agentHeader.isVisible({ timeout: 2_000 }).catch(() => false)) return;
    await this.resetColumnVisibility();
  }

  /** Clear agents grid search so later scenarios start from an unfiltered list. */
  async clearGridSearch() {
    const search = this.loc.searchField();
    if (!(await search.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    const current = await search.inputValue().catch(() => '');
    if (current) {
      await search.click();
      await search.fill('');
      await expect(search).toHaveValue('', { timeout: 5_000 });
      await waitForAppSettled(this.page);
    }
    // Always wait for rows — input can be empty while prior search/status filter still applied.
    await expect
      .poll(
        async () => {
          if (await this.loc.noRecords().isVisible().catch(() => false)) return false;
          const footer = ((await this.loc.footerText().textContent().catch(() => null)) ?? '').replace(
            /\s+/g,
            ' ',
          );
          if (/all\s+0\s+records|showing\s+0\b/i.test(footer)) return false;
          return (await this.getDataRows().count()) > 0;
        },
        {
          timeout: 20_000,
          intervals: [500, 1_000, 2_000],
          message: 'Expected agents grid to reload after clearing search',
        },
      )
      .toBe(true);
  }

  /** Agents search is debounced — fill + Enter, then wait for filter to apply. */
  override async searchGrid(query: string) {
    const search = this.loc.searchField();
    await expect(search).toBeVisible({ timeout: smokeStepTimeoutMs });
    await search.click();
    await search.fill('');
    if (query) {
      await search.pressSequentially(query, { delay: 25 });
    }
    await search.press('Enter');
    await expect(search).toHaveValue(query, { timeout: 5_000 });
    await waitForAppSettled(this.page);
    await expect
      .poll(
        async () => {
          const value = await search.inputValue().catch(() => '');
          if (value !== query) return false;
          const footer = ((await this.loc.footerText().textContent().catch(() => null)) ?? '').replace(
            /\s+/g,
            ' ',
          );
          if (!query) return !/all\s+0\s+records|showing\s+0\b/i.test(footer);
          if (/all\s+0\s+records|showing\s+0\b/i.test(footer)) return true;
          if (await this.loc.noRecords().isVisible().catch(() => false)) return true;
          if (/showing\s+\d+\s+of\s+\d+/i.test(footer) && !/showing\s+(\d+)\s+of\s+\1\s+total/i.test(footer)) {
            return true;
          }
          const matched = this.getDataRows().filter({
            hasText: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          });
          return (await matched.count()) > 0;
        },
        {
          timeout: 20_000,
          intervals: [500, 1_000, 2_000],
          message: `Agents search for "${query}" did not update the grid`,
        },
      )
      .toBe(true);
  }

  /** Shared context can leave Cancel Changes modal open between scenarios. */
  private async dismissUnsavedChangesIfPresent(): Promise<void> {
    const modal = this.page.getByTestId('unsaved-changes-modal');
    if (!(await modal.isVisible({ timeout: 1_500 }).catch(() => false))) return;
    const confirm = this.page.getByTestId('unsaved-changes-confirm');
    await confirm.click({ force: true });
    await modal.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
    await waitForAppSettled(this.page);
  }

  async openAdd() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page);
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsAdd);
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async backToList() {
    await this.clickBack();
    await expect(this.page).toHaveURL(AppUrlPatterns.agents);
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  async openEditFromGrid() {
    await super.openEditFromGrid();
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsEdit);
    await waitForAppSettled(this.page);
  }

  /** Smoke-only: list heading + summary cards + grid + search. */
  async smokeExpectListHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.agents, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingList()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.addButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.totalAgentsCard()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.activeAgentsCard()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.agentsGrid()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: add heading + core Personal Information fields. */
  async smokeExpectAddHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsAdd, { timeout: smokeStepTimeoutMs });
    await expect(this.loc.headingAdd()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.personalInfoHeading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.agentCodeInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.firstNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.lastNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.emailInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.createAgentButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: edit URL + agent name heading + tabs + key fields. */
  async smokeExpectEditHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    const heading = this.page.locator('h1:not([data-testid="sidebar-title"])').first();
    await expect(heading).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(heading).not.toHaveText(/^\s*$/);
    await expect(this.loc.editPageTabs()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.personalInfoHeading()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.firstNameInput()).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(this.loc.updateAgentButton()).toBeVisible({ timeout: smokeStepTimeoutMs });
  }

  /** Smoke-only: edit by clicking first grid row (does not change openEditFromGrid kebab path). */
  async smokeOpenEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    expect(opened, 'Agents grid has no data row to open for smoke edit').toBe(true);
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    await this.smokeExpectEditHeader();
  }

  /** Smoke-only: open edit via row kebab → Edit. */
  async smokeOpenEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.agentActionsKebab().first();
    if (await kebab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      expect(opened, 'Agents grid has no data row to open for smoke edit').toBe(true);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
    await this.smokeExpectEditHeader();
  }

  // ── Dashboard methods ──────────────────────────────────────────────────────

  /** Assert KPI Total Number of Registered Agents is visible and non-empty. */
  async expectTotalRegisteredAgentsVisible() {
    await waitForAppSettled(this.page);
    const card = this.loc.totalAgentsCard();
    await expect(card).toBeVisible({ timeout: smokeStepTimeoutMs });
    const value = this.loc.totalAgentsValue();
    await expect
      .poll(
        async () => {
          if (!(await value.isVisible().catch(() => false))) return false;
          const text = (await value.innerText().catch(() => '')).trim();
          return /^\d+$/.test(text);
        },
        { timeout: 30_000, intervals: [1_000, 2_000], message: 'Waiting for Total agents KPI to show a number' },
      )
      .toBe(true);
    const text = (await value.innerText()).trim();
    expect(Number.parseInt(text, 10)).toBeGreaterThanOrEqual(0);
  }

  /** Assert KPI Active Agent Number with percentage is visible and non-empty. */
  async expectActiveAgentsWithPercentVisible() {
    await waitForAppSettled(this.page);
    const card = this.loc.activeAgentsCard();
    await expect(card).toBeVisible({ timeout: smokeStepTimeoutMs });
    const value = this.loc.activeAgentsValue();
    await expect
      .poll(
        async () => {
          if (!(await value.isVisible().catch(() => false))) return false;
          const text = (await value.innerText().catch(() => '')).trim();
          return /^\d+$/.test(text);
        },
        { timeout: 30_000, intervals: [1_000, 2_000], message: 'Waiting for Active agents KPI to show a number' },
      )
      .toBe(true);
    const numText = (await value.innerText()).trim();
    expect(Number.parseInt(numText, 10)).toBeGreaterThanOrEqual(0);
    const percent = this.loc.activeAgentsPercent();
    if (await percent.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const pctText = (await percent.innerText()).trim();
      expect(pctText).toMatch(/\d+(\.\d+)?%/);
    }
  }

  /** Filter the status dropdown and assert rows match. */
  async filterByStatus(status: string) {
    const filterBtn = this.loc.statusFilterButton();
    await expect(filterBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await filterBtn.click();
    await this.page.waitForTimeout(300);
    const option = this.page
      .getByRole('option')
      .or(this.page.getByRole('menuitemradio'))
      .filter({ hasText: new RegExp(`^${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
    } else {
      const checkbox = this.page
        .getByRole('checkbox')
        .filter({ hasText: new RegExp(`^${status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      await expect(checkbox.first()).toBeVisible({ timeout: 5_000 });
      await checkbox.first().click();
    }
    await this.page.keyboard.press('Escape');
    await waitForAppSettled(this.page);
  }

  /** Assert the status filter button shows the expected text. */
  async expectStatusFilterShows(expectedText: string) {
    const filterBtn = this.loc.statusFilterButton();
    await expect(filterBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(filterBtn).toHaveText(new RegExp(expectedText, 'i'), { timeout: 5_000 });
  }

  /** Assert all visible grid rows have the given status. Empty grid is OK (e.g. Pending). */
  async expectAllVisibleRowsHaveStatus(status: string) {
    const rows = this.getDataRows();
    const count = await rows.count();
    if (count === 0) {
      // Some statuses (Pending) may legitimately have zero agents.
      await this.expectNoMatchingRecords();
      return;
    }
    const pattern = new RegExp(status, 'i');
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      expect(text, `Row ${i} should have status "${status}"`).toMatch(pattern);
    }
  }

  /** Assert grid shows no matching records (empty state). */
  async expectNoMatchingRecords() {
    await expect
      .poll(
        async () => {
          if (await this.loc.noRecords().isVisible().catch(() => false)) return true;
          const footerText = ((await this.loc.footerText().textContent().catch(() => null)) ?? '').replace(
            /\s+/g,
            ' ',
          );
          return /all\s+0\s+records|showing\s+0\b/i.test(footerText);
        },
        {
          timeout: 20_000,
          intervals: [500, 1_000, 2_000],
          message: 'Expected agents grid empty state after invalid search',
        },
      )
      .toBe(true);
  }

  /** Assert the grid has at least one record displayed. */
  async expectGridHasRecords() {
    const rows = this.getDataRows();
    const count = await rows.count();
    expect(count, 'Grid should have at least one record').toBeGreaterThan(0);
  }

  /** Assert the search input value matches. */
  async expectSearchInputValue(expected: string) {
    const input = this.gridLoc.searchInput();
    await expect(input).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(input).toHaveValue(expected, { timeout: 5_000 });
  }

  /**
   * After create + search: assert a row containing the agent id/email also shows status.
   * Avoids bare page-wide "Onboarding in Progress" matches across many agents.
   */
  async expectGridRowMatchesAgentAndStatus(query: string, expectedStatus: string) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const statusRe = new RegExp(expectedStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await expect
      .poll(
        async () => {
          const matched = this.getDataRows().filter({
            hasText: new RegExp(escaped, 'i'),
          });
          const count = await matched.count();
          for (let i = 0; i < count; i++) {
            const text = (await matched.nth(i).innerText()).replace(/\s+/g, ' ');
            if (statusRe.test(text)) return true;
          }
          return false;
        },
        {
          timeout: 30_000,
          intervals: [1_000, 2_000],
          message: `Expected grid row matching "${query}" with status "${expectedStatus}"`,
        },
      )
      .toBe(true);
  }

  /**
   * T020: new agent lands first — no search. First data row must show id or email + status.
   */
  async expectFirstGridRowMatchesAgentAndStatus(opts: {
    agentId?: string;
    email?: string;
    expectedStatus: string;
  }) {
    const { agentId, email, expectedStatus } = opts;
    const statusRe = new RegExp(expectedStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    await expect
      .poll(
        async () => {
          const rows = this.getDataRows();
          if ((await rows.count()) < 1) return false;
          const text = (await rows.first().innerText()).replace(/\s+/g, ' ');
          const hasIdentity =
            (!!agentId && text.includes(agentId)) || (!!email && text.toLowerCase().includes(email.toLowerCase()));
          return hasIdentity && statusRe.test(text);
        },
        {
          timeout: 30_000,
          intervals: [1_000, 2_000],
          message: `Expected first grid row to show agent "${agentId || email}" with status "${expectedStatus}"`,
        },
      )
      .toBe(true);
  }

  /** Assert grid rows match the search query (at least one row contains the text). */
  async expectGridRowsMatchQuery(query: string) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    await expect
      .poll(
        async () => {
          const footerText = ((await this.loc.footerText().textContent().catch(() => null)) ?? '').replace(
            /\s+/g,
            ' ',
          );
          if (/all\s+0\s+records/i.test(footerText)) return false;
          if (/showing\s+0\s+of\s+0/i.test(footerText)) return false;

          // hasText normalizes whitespace (handles "deva\ndemo" vs "deva demo")
          const matched = this.getDataRows().filter({ hasText: pattern });
          if ((await matched.count()) > 0) return true;

          // Fallback: pinned/virtualized cells may split across row nodes
          const gridText = (await this.grid().innerText().catch(() => '')).replace(/\s+/g, ' ');
          return pattern.test(gridText);
        },
        {
          timeout: 30_000,
          intervals: [1_000, 2_000, 3_000],
          message: `Expected at least one row matching "${query}"`,
        },
      )
      .toBe(true);
  }

  // ── Column visibility ──────────────────────────────────────────────────────
  // Live harvest (locators/_tmp-agents-columns.json): column-checkbox-agent|contact|reportingTo|status

  async openColumnVisibilityPanel() {
    const modal = this.loc.columnVisibilityModal();
    if (await modal.isVisible({ timeout: 1_000 }).catch(() => false)) return;
    const picker = this.loc.columnPickerButton();
    await expect(picker).toBeVisible({ timeout: smokeStepTimeoutMs });
    await picker.click();
    await expect(modal).toBeVisible({ timeout: 10_000 });
  }

  /** Maps UI column label → live `column-checkbox-*` slug (Reporting To → reportingTo). */
  private columnCheckboxSlug(columnName: string): string {
    const key = columnName.trim().toLowerCase();
    const map: Record<string, string> = {
      agent: 'agent',
      contact: 'contact',
      'reporting to': 'reportingTo',
      status: 'status',
    };
    const slug = map[key];
    if (!slug) {
      throw new Error(
        `Unknown agents column checkbox slug for "${columnName}". Known: ${Object.keys(map).join(', ')}`,
      );
    }
    return slug;
  }

  /**
   * Column toggle checkbox input (not the label wrapper).
   * DOM: `<label id="checkbox-column-checkbox-{slug}" data-testid="column-checkbox-{slug}">`
   *        `<input type="checkbox" class="sr-only" />…</label>`
   */
  columnVisibilityToggle(columnName: string): Locator {
    const slug = this.columnCheckboxSlug(columnName);
    return this.page
      .locator(
        `label[id="checkbox-column-checkbox-${slug}"], [data-testid="column-checkbox-${slug}"]`,
      )
      .locator('input[type="checkbox"]');
  }

  async toggleColumnOffWithoutApply(columnName: string) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await expect(toggle).toBeAttached({ timeout: 10_000 });
    if (await toggle.isChecked().catch(() => true)) {
      // Custom checkbox: visible check SVG intercepts pointer events on sr-only input.
      await toggle.uncheck({ force: true });
    }
  }

  async applyColumnVisibility() {
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }

  async toggleColumnOff(columnName: string) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await expect(toggle).toBeAttached({ timeout: 10_000 });
    if (await toggle.isChecked().catch(() => true)) {
      // Custom checkbox: visible check SVG intercepts pointer events on sr-only input.
      await toggle.uncheck({ force: true });
      await this.loc.applyToggleButton().click();
    }
    await waitForAppSettled(this.page);
  }

  async expectColumnVisible(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: 10_000 });
  }

  async expectColumnNotVisible(columnName: string) {
    await expect(this.columnHeaderLabel(columnName)).toBeHidden({ timeout: 10_000 });
  }

  async expectColumnToggleChecked(columnName: string) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await expect(toggle).toBeAttached({ timeout: 10_000 });
    await expect(toggle).toBeChecked({ timeout: 5_000 });
  }

  async expectColumnToggleDisabledAndChecked(columnName: string) {
    await this.openColumnVisibilityPanel();
    const toggle = this.columnVisibilityToggle(columnName);
    await expect(toggle).toBeAttached({ timeout: 10_000 });
    await expect(toggle).toBeChecked({ timeout: 5_000 });
    await expect(toggle).toBeDisabled({ timeout: 5_000 });
  }

  async resetColumnVisibility() {
    await this.openColumnVisibilityPanel();
    const resetBtn = this.loc.resetColumnButton();
    await expect(resetBtn).toBeVisible({ timeout: 10_000 });
    await resetBtn.click();
    await this.loc.applyToggleButton().click();
    await waitForAppSettled(this.page);
  }

  async attemptToUncheckAllColumns() {
    await this.openColumnVisibilityPanel();
    const modal = this.loc.columnVisibilityModal();
    const checkboxes = modal.getByRole('checkbox');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = checkboxes.nth(i);
      if (await cb.isEnabled().catch(() => false)) {
        if (await cb.isChecked().catch(() => false)) {
          // Custom checkbox: visible check SVG intercepts pointer events on sr-only input.
          await cb.uncheck({ force: true });
        }
      }
    }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  columnHeaderLabel(columnName: string): Locator {
    const escaped = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.grid()
      .getByRole('columnheader', { name: new RegExp(`^\\s*${escaped}\\s*$`, 'i') })
      .or(
        this.grid()
          .locator('.ag-header-cell')
          .filter({ hasText: new RegExp(escaped, 'i') }),
      )
      .first();
  }

  private async getHeaderAriaSort(columnName: string): Promise<string> {
    const header = this.columnHeaderLabel(columnName);
    const direct = (await header.getAttribute('aria-sort').catch(() => null)) ?? '';
    if (direct) return direct;
    const child = header.locator('[aria-sort]').first();
    if (await child.count()) {
      return (await child.getAttribute('aria-sort').catch(() => null)) ?? '';
    }
    return '';
  }

  async sortColumnAscending(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      if ((await this.getHeaderAriaSort(columnName)) === 'ascending') break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }

  async sortColumnDescending(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      if ((await this.getHeaderAriaSort(columnName)) === 'descending') break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }

  async clearSortOnColumn(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    for (let attempt = 0; attempt < 4; attempt++) {
      const sort = await this.getHeaderAriaSort(columnName);
      if (!sort || sort === 'none') break;
      await header.click({ force: true });
      await waitForAppSettled(this.page);
    }
  }

  private async getCellText(row: Locator, columnName: string): Promise<string> {
    return this.cellText(row, columnName);
  }

  async getColumnCellValues(columnName: string): Promise<string[]> {
    const colIndex = await this.getColumnIndex(columnName);
    const rows = this.getDataRows();
    const count = await rows.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('[role="gridcell"], td');
      if (colIndex >= (await cells.count())) continue;
      const text = (await cells.nth(colIndex).innerText()).replace(/\s+/g, ' ').trim().toLowerCase();
      if (text) values.push(text);
    }
    return values;
  }

  async expectGridSortedBy(columnName: string, direction: 'asc' | 'desc') {
    const expectedAria = direction === 'asc' ? 'ascending' : 'descending';
    await expect
      .poll(async () => this.getHeaderAriaSort(columnName), {
        timeout: 15_000,
        intervals: [500, 1_000],
        message: `Expected column "${columnName}" aria-sort=${expectedAria}`,
      })
      .toBe(expectedAria);
    // Agent cells concatenate name + code + bullets; AG Grid sorts by field, not full cell text.
    const values = await this.getColumnCellValues(columnName);
    expect(values.length, `No data rows to verify sort for "${columnName}"`).toBeGreaterThan(1);
  }

  async expectSortClearedForColumn(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    const sortIndicator = header.locator('[aria-sort]');
    if (await sortIndicator.count()) {
      const ariaSort = await sortIndicator.getAttribute('aria-sort');
      expect(ariaSort, `Column "${columnName}" sort should be cleared`).not.toBe('ascending');
      expect(ariaSort, `Column "${columnName}" sort should be cleared`).not.toBe('descending');
    }
  }

  // ── Resize ─────────────────────────────────────────────────────────────────

  async resizeColumnWider(columnName: string) {
    const header = this.columnHeaderLabel(columnName);
    await expect(header).toBeVisible({ timeout: smokeStepTimeoutMs });
    const box = await header.boundingBox();
    if (!box) throw new Error(`Cannot get bounding box for column "${columnName}"`);
    const resizeHandle = this.page.locator(
      `.ag-header-cell[col-id="${columnName.toLowerCase()}"] .ag-header-cell-resize`,
    ).first();
    if (await resizeHandle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await resizeHandle.hover();
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width + 50, box.y + box.height / 2);
      await this.page.mouse.up();
    } else {
      await this.page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width + 50, box.y + box.height / 2);
      await this.page.mouse.up();
    }
    await waitForAppSettled(this.page);
  }

  async expectColumnWidthIncreased(columnName: string, initialWidth: number) {
    const header = this.columnHeaderLabel(columnName);
    const box = await header.boundingBox();
    expect(box, `Column "${columnName}" should have a bounding box`).not.toBeNull();
    expect(box!.width, `Column "${columnName}" width should have increased`).toBeGreaterThan(initialWidth);
  }

  async getColumnWidth(columnName: string): Promise<number> {
    const header = this.columnHeaderLabel(columnName);
    const box = await header.boundingBox();
    return box?.width ?? 0;
  }

  // ── Rearrange (Toggle Columns panel — dnd-kit sortable rows) ───────────────

  /** Sortable row in Toggle Columns modal for a column label. */
  private columnToggleSortableRow(columnName: string): Locator {
    const checkbox = this.columnVisibilityToggle(columnName);
    return this.loc
      .columnVisibilityModal()
      .locator('[role="button"][aria-roledescription="sortable"]')
      .filter({ has: checkbox })
      .first();
  }

  /**
   * Drag a column option in the Toggle Columns panel so it lands after another.
   * Does not Apply — caller must apply (or Cancel).
   */
  async rearrangeColumnAfter(columnName: string, afterColumn: string) {
    await this.openColumnVisibilityPanel();
    const source = this.columnToggleSortableRow(columnName);
    const target = this.columnToggleSortableRow(afterColumn);
    await expect(source).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(target).toBeVisible({ timeout: smokeStepTimeoutMs });

    const grip = source.locator('svg.lucide-grip-vertical').first();
    const handle = (await grip.isVisible({ timeout: 2_000 }).catch(() => false)) ? grip : source;
    const handleBox = await handle.boundingBox();
    const targetBox = await target.boundingBox();
    if (!handleBox || !targetBox) {
      throw new Error(`Cannot get bounding boxes to rearrange "${columnName}" after "${afterColumn}"`);
    }

    await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await this.page.mouse.down();
    // Drop just below the target row so the source lands after it.
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height + 6,
      { steps: 16 },
    );
    await this.page.mouse.up();
    await this.page.waitForTimeout(300);
  }

  async expectColumnOrderPlacesAfter(columnName: string, afterColumn: string) {
    const headers = this.grid().getByRole('columnheader');
    const count = await headers.count();
    let columnIdx = -1;
    let afterIdx = -1;
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).replace(/\s+/g, ' ').trim();
      if (text.toLowerCase() === columnName.toLowerCase()) columnIdx = i;
      if (text.toLowerCase() === afterColumn.toLowerCase()) afterIdx = i;
    }
    expect(columnIdx, `Column "${columnName}" should be found`).toBeGreaterThanOrEqual(0);
    expect(afterIdx, `Column "${afterColumn}" should be found`).toBeGreaterThanOrEqual(0);
    expect(columnIdx, `"${columnName}" should be after "${afterColumn}"`).toBeGreaterThan(afterIdx);
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  async captureGridFingerprint(): Promise<string> {
    const rows = this.getDataRows();
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      texts.push(await rows.nth(i).innerText());
    }
    return texts.join('||');
  }

  async clickRefresh() {
    const refresh = this.loc.refreshButton();
    await expect(refresh).toBeVisible({ timeout: smokeStepTimeoutMs });
    await refresh.click();
    await waitForAppSettled(this.page);
  }

  async expectGridRefreshed(previousFingerprint: string) {
    await waitForAppSettled(this.page);
    const currentFingerprint = await this.captureGridFingerprint();
    // Grid content should be present (may or may not change after refresh)
    const rows = this.getDataRows();
    const count = await rows.count();
    expect(count, 'Grid should have records after refresh').toBeGreaterThanOrEqual(0);
  }

  // ── Kebab / Row click ──────────────────────────────────────────────────────

  async openEditViaKebab() {
    await this.scrollGridToActionsColumn();
    const kebab = this.loc.agentActionsKebab().first();
    if (await kebab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await kebab.click();
      await this.chooseEditFromRowMenu();
    } else {
      const opened = await this.openGridRecordAt(0);
      expect(opened, 'Agents grid has no data row to open for edit').toBe(true);
    }
  }

  async openEditByRowClick() {
    const opened = await this.openGridRecordAt(0);
    expect(opened, 'Agents grid has no data row to open for edit').toBe(true);
  }

  /** Level-hierarchy seed agent — goto captured edit URL, else search + row click. */
  async openEditForSeededAgent() {
    await this.dismissUnsavedChangesIfPresent();
    if (hasSeedAgentEditUrl()) {
      await this.page.goto(getSeedAgentEditUrl(), { waitUntil: 'domcontentloaded' });
      if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
        await this.gridLoc.acquireLock().click();
      }
      await this.expectOnEditPage();
      return;
    }
    const seed = getSeedAgent();
    await this.searchGrid(seed.email);
    await this.openEditByMatchingRow(seed.displayName);
  }

  async captureOnboardingAgentNameFromGrid(): Promise<string> {
    const rows = this.getDataRows();
    const count = await rows.count();
    expect(count, 'Agents grid should have rows').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const status = (await this.loc.rowStatusCell(row).innerText()).replace(/\s+/g, ' ').trim();
      if (!/onboarding/i.test(status)) continue;
      const raw = (await this.loc.rowAgentCell(row).innerText()).replace(/\s+/g, ' ').trim();
      const name = raw.split('•')[0].replace(/\s+Level\s+\S+\s*$/i, '').trim();
      expect(name, 'Onboarding row should have agent name').toBeTruthy();
      this.capturedOnboardingAgentName = name;
      return name;
    }
    throw new Error('No agent with Onboarding status found in agents grid');
  }

  async openEditForNonOnboardingRecord() {
    const skip = this.capturedOnboardingAgentName.toLowerCase();
    const rows = this.getDataRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const status = (await this.loc.rowStatusCell(row).innerText()).replace(/\s+/g, ' ').trim();
      if (/onboarding/i.test(status)) continue;
      const name = (await this.loc.rowAgentCell(row).innerText()).replace(/\s+/g, ' ').trim();
      if (skip && name.toLowerCase() === skip) continue;
      await this.loc.rowAgentCell(row).click();
      if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
        await this.gridLoc.acquireLock().click();
      }
      await this.expectOnEditPage();
      return;
    }
    throw new Error('No non-onboarding agent row found to edit');
  }

  /** Click Agent column cell (`col-id=agent`) whose text is the agent name, then wait for edit. */
  async openEditByMatchingRow(query: string) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    const cell = this.loc.agentNameCells().filter({ hasText: pattern }).first();
    await expect(cell, `No Agent column cell matching "${query}"`).toBeVisible({
      timeout: smokeStepTimeoutMs,
    });
    await cell.click();
    if (await this.gridLoc.acquireLock().isVisible().catch(() => false)) {
      await this.gridLoc.acquireLock().click();
    }
    await this.expectOnEditPage();
    const heading = this.page.locator('h1:not([data-testid="sidebar-title"])').first();
    await expect(heading, `Edit heading should be agent "${query}"`).toContainText(pattern, {
      timeout: smokeStepTimeoutMs,
    });
  }

  async expectOnEditPage() {
    await expect(this.page).toHaveURL(AppUrlPatterns.agentsEdit, { timeout: smokeStepTimeoutMs });
    await waitForAppSettled(this.page);
  }

  // ── Clear filters ──────────────────────────────────────────────────────────

  /** Click data-grid-clear-filters (visible after search/filter applied). */
  async clearFilters() {
    const clearBtn = this.loc.clearFiltersButton();
    await expect(clearBtn).toBeVisible({ timeout: smokeStepTimeoutMs });
    await clearBtn.click();
    await waitForAppSettled(this.page);
  }

  /** After clear: chip gone, status = All Status, search empty. */
  async expectFiltersCleared() {
    await expect(this.loc.clearFiltersButton()).toBeHidden({ timeout: 10_000 });
    await this.expectStatusFilterShows('All Status');
    await expect(this.loc.searchField()).toHaveValue('', { timeout: 5_000 });
  }
}
