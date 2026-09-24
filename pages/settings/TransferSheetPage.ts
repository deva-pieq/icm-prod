import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { TRANSFER_SHEET } from '../../test-data/transfer-agent/transferSheet';
import { captureToast, ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs, smokeStaticWaitMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;
const STATIC_WAIT = smokeStaticWaitMs;

/** Fallback agents when Unique(Agent+Product) blocks preferred combo. */
const TRANSFER_SHEET_FALLBACK_AGENTS = [
  'Paul Miller',
  'Jason Hoffmann',
  'Test Transfer Agent',
] as const;

export type TransferSheetRow = {
  agentName: string;
  product: string;
  status: string;
  effectiveDate?: string;
};

export class TransferSheetPage {
  preparedFile: null = null;
  storedRow: TransferSheetRow | null = null;
  /** Set by addUniqueTransferSheetRecord — not overwritten by grid assertions. */
  lastAddedRow: TransferSheetRow | null = null;
  /** Toast text captured at Add/Save click (before settle dismisses it). */
  lastToastText = '';
  /** Active↔Inactive round-trip for first/same-record edit (T003). */
  statusRoundTrip: { original: string; flipped: string } | null = null;
  /** T005: agent proven (or made) to have ≥2 products in Rule List. */
  sameAgentMultiProduct: { agentName: string; products: string[] } | null = null;

  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    headingTransferSheet: () =>
      this.page
        .getByTestId('transfer-sheet-title')
        .or(this.page.getByRole('heading', { name: /transfer sheet/i })),
    headingAddTransferRecord: () =>
      this.page
        .getByTestId('add-transfer-record-title')
        .or(this.page.getByRole('heading', { name: /add transfer record/i })),
    headingEditTransferRecord: () =>
      this.page
        .getByTestId('add-transfer-record-title')
        .or(this.page.getByRole('heading', { name: /edit transfer record/i })),
    datagrid: () => this.page.getByTestId('transfer-sheet-datagrid'),
    policyListDatagrid: () => this.page.getByTestId('policy-list-datagrid'),
    tabs: () => this.page.getByTestId('transfer-sheet-tabs'),
    ruleListTab: () => this.page.getByTestId('transfer-sheet-tabs-tab-transfer-sheet'),
    policyListTab: () => this.page.getByTestId('transfer-sheet-tabs-tab-policy-list'),
    addButton: () =>
      this.page
        .getByTestId('transfer-sheet-add-button')
        .or(this.page.getByRole('button', { name: /^add$/i })),
    backButton: () =>
      this.page
        .getByTestId('add-transfer-record-back-button')
        .or(this.page.getByTestId('back-button'))
        .or(this.page.getByRole('button', { name: /^back$/i })),
    cancelButton: () =>
      this.page
        .getByTestId('add-transfer-cancel-button')
        .or(this.page.getByRole('button', { name: /^cancel$/i })),
    agentSearch: () =>
      this.page
        .getByTestId('add-transfer-agent-as-per-statement')
        .getByRole('button')
        .or(this.page.getByTestId('transfer-sheet-agent-search').getByRole('button'))
        .or(this.page.getByRole('button', { name: /select agent/i })),
    productDropdown: () =>
      this.page
        .getByTestId('add-transfer-product')
        .getByRole('button')
        .or(this.page.getByTestId('transfer-sheet-product-dropdown').getByRole('button'))
        .or(this.page.getByRole('button', { name: /select product/i })),
    effectiveDate: () =>
      this.page
        .getByTestId('add-transfer-effective-date')
        .locator('input')
        .first()
        .or(this.page.getByTestId('transfer-sheet-effective-date').locator('input').first())
        .or(this.page.getByPlaceholder(/mm\/dd\/yyyy/i).first()),
    statusDropdown: () =>
      this.page
        .getByTestId('add-transfer-status')
        .getByRole('button')
        .first()
        .or(this.page.getByTestId('transfer-sheet-status-dropdown').getByRole('button').first()),
    statusOption: (status: string) =>
      this.page.getByTestId(`add-transfer-status-option-${status.toLowerCase()}`),
    agentDropdownSearch: () =>
      this.page.getByRole('searchbox', { name: 'Search Agent as per Statement' }),
    addTransferButton: () =>
      this.page
        .getByTestId('add-transfer-submit-button')
        .or(this.page.getByTestId('transfer-sheet-add-transfer-button'))
        .or(this.page.getByRole('button', { name: /^add transfer$/i }))
        .or(this.page.getByRole('button', { name: /^save$/i })),
    editMenuItem: () =>
      this.page.getByRole('menuitem', { name: /^edit$/i }).or(this.page.getByText(/^Edit$/i)),
    grid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    gridRows: () =>
      this.loc
        .grid()
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') }),
    /** Live: data-testid="undefined-toast-toast-{ts}-{id}" — match stable substring. */
    toast: () =>
      this.page
        .locator('[data-testid*="toast-toast"]')
        .or(this.page.locator('[data-sonner-toast], [role="alert"], [role="status"]'))
        .filter({ hasText: /.+/i }),
    formErrorText: () =>
      this.page.getByText(/please enter a valid effective date|already exists for this carrier agent/i),
    duplicateRuleError: () =>
      this.page.getByText(/A transfer sheet already exists for this carrier agent and product/i),
    /** Effective-date react-calendar popup (manual input disabled in app). */
    calendarPopup: () => this.page.locator('[data-testid$="-calendar-popup"]'),
    gridRefresh: () =>
      this.page
        .getByTestId('data-grid-refresh-button')
        .or(this.page.getByRole('button', { name: /refresh grid data/i })),
    gridSearch: () => this.page.getByRole('textbox', { name: 'Search data grid' }),
  };

  constructor(private readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  async openTransferSheetPage() {
    await this.sidebar.waitForSidebar();
    if (/transfer-sheet\/(add|edit)/i.test(this.page.url())) {
      await this.returnToTransferSheetList();
    }
    if (!AppUrlPatterns.settingsTransferSheet.test(this.page.url())) {
      await this.sidebar.openSettings();
      await this.sidebar.clickSettingsSubNav(/^Transfer Sheet$/i);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsTransferSheet, { timeout: T });
    await ensurePageReady(this.page, this.loc.headingTransferSheet(), { timeout: T });
    await this.ensureRuleListTabSelected();
  }

  /** Rule List tab — data-testid transfer-sheet-tabs-tab-transfer-sheet */
  private async ensureRuleListTabSelected() {
    const tab = this.loc.ruleListTab();
    await expect(tab).toBeVisible({ timeout: T });
    await tab.click();
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /** Smoke-only: Transfer Sheet title + add + tabs + grid. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.settingsTransferSheet, { timeout: T });
    await expect(this.loc.headingTransferSheet()).toBeVisible({ timeout: T });
    await expect(this.loc.addButton()).toBeVisible({ timeout: T });
    await expect(this.loc.tabs()).toBeVisible({ timeout: T });
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
  }

  private dateThreeYearsBack(): string {
    const year = new Date().getFullYear() - 3;
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  private async getColumnIndex(columnName: string): Promise<number> {
    return this.loc.grid().evaluate((grid, name) => {
      const target = name.toLowerCase();
      const headerRow =
        grid.querySelector('[role="row"]:has([role="columnheader"])') ??
        Array.from(grid.querySelectorAll('[role="row"]')).find(row =>
          row.querySelector('[role="columnheader"], th'),
        );
      if (!headerRow) return -1;
      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
        if (label === target || label.includes(target)) return i;
      }
      return -1;
    }, columnName);
  }

  private async cellText(row: Locator, columnName: string): Promise<string> {
    const colIndex = await this.getColumnIndex(columnName);
    if (colIndex < 0) return '';
    const cells = row.locator('[role="gridcell"], td');
    const count = await cells.count();
    if (colIndex >= count) return '';
    return (await cells.nth(colIndex).innerText()).replace(/\s+/g, ' ').trim();
  }

  /** New rows are not guaranteed at top of Rule List — refresh then filter by agent. */
  private async refreshRuleListGrid() {
    const refresh = this.loc.gridRefresh();
    if (!(await refresh.isVisible().catch(() => false))) return;
    await refresh.click();
    await this.page.waitForTimeout(STATIC_WAIT);
    await waitForAppSettled(this.page, T);
  }

  private async searchRuleListByAgent(agentName: string) {
    const search = this.loc.gridSearch();
    if (!(await search.isVisible().catch(() => false))) return;
    await search.click({ timeout: 3_000 }).catch(() => undefined);
    await search.fill('');
    await search.fill(agentName);
    await this.page.waitForTimeout(1_200);
    await waitForAppSettled(this.page, T);
  }

  private async clearRuleListSearch() {
    const search = this.loc.gridSearch();
    if (!(await search.isVisible().catch(() => false))) return;
    await search.click({ timeout: 3_000 }).catch(() => undefined);
    await search.fill('');
    await this.page.waitForTimeout(800);
    await waitForAppSettled(this.page, T);
  }

  /** Agent cell is two-line (display name + code); prefer code for dropdown search. */
  private parseAgentNameFromCell(agentRaw: string): string {
    const lines = agentRaw
      .split(/\r?\n/)
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(l => l.length > 0);
    return (
      lines.find(l => !l.includes('|') && !l.includes(' - ')) ??
      lines.find(l => l.includes('|'))?.split('|')[0].trim() ??
      lines[0] ??
      ''
    );
  }

  private async collectVisibleAgentProductRows(): Promise<
    Array<{ agentName: string; product: string }>
  > {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const agentColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.agent);
    const productColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.product);
    expect(agentColIndex, 'Agent as per Statement column').toBeGreaterThanOrEqual(0);
    expect(productColIndex, 'Product column').toBeGreaterThanOrEqual(0);

    const rows = this.loc.gridRows();
    const count = await rows.count();
    const out: Array<{ agentName: string; product: string }> = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('[role="gridcell"], td');
      const agentRaw = (await cells.nth(agentColIndex).innerText()).trim();
      const product = (await cells.nth(productColIndex).innerText()).replace(/\s+/g, ' ').trim();
      const agentName = this.parseAgentNameFromCell(agentRaw);
      if (agentName && product) out.push({ agentName, product });
    }
    return out;
  }

  /** Scan currently visible Rule List rows, scrolling vertically so virtualized rows render. */
  private async findRowAmongVisible(
    agentName: string,
    product: string,
    status?: string,
  ): Promise<Locator | null> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    await this.resetRuleListScroll();
    const viewportSelector = '.ag-body-viewport';
    for (let page = 0; page < 40; page++) {
      const matched = await this.matchRowsAmongVisible(agentName, product, status);
      if (matched) return matched;
      const scrolled = await this.scrollRuleListByPage(viewportSelector);
      // Scrolling reached the bottom (no more virtual rows to render) → give up.
      if (!scrolled) break;
      await this.page.waitForTimeout(250);
    }
    return null;
  }

  /**
   * Reset vertical scroll to top so the scan starts at the first virtual window.
   * This runs at the start of every scan (and inside expect.poll iterations), so it must
   * NOT block on a full app settle — scrolling the AG viewport re-renders rows
   * synchronously. A short render wait + grid-visible guard is enough.
   */
  private async resetRuleListScroll(): Promise<void> {
    await this.page.evaluate(() => {
      const viewport = document.querySelector<HTMLElement>('.ag-body-viewport');
      if (!viewport) return;
      viewport.scrollTop = 0;
      viewport.dispatchEvent(new Event('scroll'));
    });
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    // Wait for virtual rows to re-render after jumping to the top.
    await expect
      .poll(async () => (await this.loc.gridRows().count()) > 0, {
        timeout: T,
        intervals: [100, 200, 400],
      })
      .toBe(true);
  }

  /** Scroll one viewport-height down; returns false when already at the bottom. */
  private async scrollRuleListByPage(selector: string): Promise<boolean> {
    return this.page.evaluate((vpSel) => {
      const viewport = document.querySelector<HTMLElement>(vpSel);
      if (!viewport) return false;
      const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      if (viewport.scrollTop >= maxScroll) return false;
      viewport.scrollTop = Math.min(viewport.scrollTop + viewport.clientHeight * 0.8, maxScroll);
      viewport.dispatchEvent(new Event('scroll'));
      return true;
    }, selector);
  }

  private async matchRowsAmongVisible(
    agentName: string,
    product: string,
    status?: string,
  ): Promise<Locator | null> {
    const rows = this.loc.gridRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = (await row.innerText()).replace(/\s+/g, ' ');
      const agentCol = await this.cellText(row, TRANSFER_SHEET.gridColumns.agent);
      const productCol = await this.cellText(row, TRANSFER_SHEET.gridColumns.product);
      const statusCol = await this.cellText(row, TRANSFER_SHEET.gridColumns.status);
      const agentMatch =
        rowText.toLowerCase().includes(agentName.toLowerCase()) ||
        agentCol.toLowerCase().includes(agentName.toLowerCase());
      const productMatch =
        rowText.toLowerCase().includes(product.toLowerCase()) ||
        productCol.toLowerCase().includes(product.toLowerCase());
      const statusMatch = status
        ? statusCol.toLowerCase().includes(status.toLowerCase()) ||
          rowText.toLowerCase().includes(status.toLowerCase())
        : true;
      if (agentMatch && productMatch && statusMatch) return row;
    }
    return null;
  }

  private async findRow(agentName: string, product: string, status?: string): Promise<Locator | null> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    await this.refreshRuleListGrid();
    await this.searchRuleListByAgent(agentName);
    return this.findRowAmongVisible(agentName, product, status);
  }

  private async selectDropdownOption(dropdown: Locator, optionLabel: string) {
    await dropdown.click();
    const exact = this.page.getByRole('option', { name: optionLabel, exact: true });
    const byRegex = this.page
      .getByRole('option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`) });
    const option = (await exact.count()) > 0 ? exact.first() : byRegex.first();
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  /** Open product listbox and select option at 0-based index. Returns label text. */
  private async selectProductByIndex(index: number): Promise<string> {
    const dropdown = this.loc.productDropdown();
    await dropdown.click();
    const options = this.page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: T });
    const count = await options.count();
    if (index < 0 || index >= count) {
      throw new Error(`Product index ${index} out of range (0..${count - 1})`);
    }
    const option = options.nth(index);
    const label = (await option.innerText()).replace(/\s+/g, ' ').trim();
    await option.click();
    await waitForAppSettled(this.page, T);
    return label;
  }

  private async countProductOptions(): Promise<number> {
    const dropdown = this.loc.productDropdown();
    await dropdown.click();
    const options = this.page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: T });
    const count = await options.count();
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(200);
    return count;
  }

  private async selectStatusOption(status: string) {
    await this.loc.statusDropdown().click();
    const option = this.loc.statusOption(status);
    await expect(option).toBeVisible({ timeout: T });
    await option.click();
    await waitForAppSettled(this.page, T);
  }

  private async openAddTransferFormIfNeeded() {
    if (await this.loc.headingAddTransferRecord().isVisible().catch(() => false)) {
      return;
    }
    await this.loc.addButton().click();
    await expect(this.loc.headingAddTransferRecord()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /** Dirty add/edit: Back/Cancel opens Cancel Changes — confirm leave. */
  private async confirmUnsavedChangesIfPresent(): Promise<void> {
    const modal = this.page.getByTestId('unsaved-changes-modal');
    const heading = this.page.getByRole('heading', { name: 'Cancel Changes' });
    const modalLocator = modal.or(heading).first();
    if (!(await modalLocator.isVisible({ timeout: 2_000 }).catch(() => false))) return;
    const dialog =
      (await this.page.getByRole('dialog').count()) > 0
        ? this.page.getByRole('dialog').last()
        : modal;
    const confirm = dialog
      .getByTestId('unsaved-changes-confirm')
      .or(dialog.getByRole('button', { name: /^cancel$/i }))
      .first();
    await expect(confirm).toBeVisible({ timeout: 10_000 });
    await confirm.click();
    await modalLocator.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    await waitForAppSettled(this.page, T);
  }

  private async returnToTransferSheetList() {
    if (await this.loc.headingTransferSheet().isVisible().catch(() => false)) {
      return;
    }
    await this.confirmUnsavedChangesIfPresent();
    if (await this.loc.headingTransferSheet().isVisible().catch(() => false)) {
      return;
    }
    const back = this.loc.backButton();
    if (await back.first().isVisible().catch(() => false)) {
      await back.first().click();
      await waitForAppSettled(this.page, T);
      await this.confirmUnsavedChangesIfPresent();
    }
    await expect(this.loc.headingTransferSheet()).toBeVisible({ timeout: T });
  }

  /**
   * Pick MM/DD/YYYY via react-calendar. App no longer accepts manual date typing.
   */
  private async setEffectiveDate(dateValue: string) {
    const dateField = this.loc.effectiveDate();
    await expect(dateField).toBeVisible({ timeout: T });
    await dateField.click();
    await this.selectDateInCalendar(dateValue);
    await waitForAppSettled(this.page, T);
  }

  private async selectDateInCalendar(dateStr: string) {
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

  private async dismissAddOrEditForm() {
    // Prefer form Cancel testid — role /^cancel$/i also matches Cancel Changes confirm.
    const cancel = this.page
      .getByTestId('add-transfer-cancel-button')
      .or(this.page.getByRole('main').getByRole('button', { name: /^cancel$/i }))
      .first();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await waitForAppSettled(this.page, T);
      await this.confirmUnsavedChangesIfPresent();
    }
    await this.returnToTransferSheetList();
  }

  private async isDuplicateRuleErrorVisible(): Promise<boolean> {
    if (await this.loc.duplicateRuleError().isVisible().catch(() => false)) return true;
    const toastDup = this.loc
      .toast()
      .filter({ hasText: /already exists for this carrier agent and product/i });
    return toastDup.first().isVisible().catch(() => false);
  }

  /** After Save: 'duplicate' | 'success' | 'unknown' */
  private async waitForAddSaveOutcome(): Promise<'duplicate' | 'success'> {
    let outcome: 'duplicate' | 'success' | null = null;
    await expect
      .poll(
        async () => {
          if (await this.isDuplicateRuleErrorVisible()) {
            outcome = 'duplicate';
            return true;
          }
          const onList = await this.loc.headingTransferSheet().isVisible().catch(() => false);
          if (onList) {
            outcome = 'success';
            return true;
          }
          const toast = this.loc.toast().filter({ hasText: /success|created|added/i });
          if (await toast.first().isVisible().catch(() => false)) {
            outcome = 'success';
            return true;
          }
          return false;
        },
        { timeout: T, intervals: [300, 500, 1_000, 2_000] },
      )
      .toBe(true);
    if (!outcome) throw new Error('Add Transfer save produced neither success nor duplicate error');
    return outcome;
  }

  private uniquePreferredFirst(preferred: string, fallbacks: readonly string[]): string[] {
    const out: string[] = [];
    for (const value of [preferred, ...fallbacks]) {
      if (!out.some(v => v.toLowerCase() === value.toLowerCase())) out.push(value);
    }
    return out;
  }

  private async selectAgent(agentName: string) {
    const trigger = this.loc.agentSearch().first();
    await trigger.click();
    await this.page.waitForTimeout(STATIC_WAIT);
    const search = this.loc.agentDropdownSearch();
    await expect(search).toBeVisible({ timeout: T });
    // Grid shows "Name | Level"; dropdown search matches name token better.
    const searchToken = agentName.includes('|')
      ? agentName.split('|')[0].trim()
      : agentName;
    await search.fill(searchToken);
    await this.page.waitForTimeout(STATIC_WAIT);
    const agentOption = this.page
      .getByRole('option', { name: new RegExp(escapeRegex(searchToken), 'i') })
      .first();
    await expect(agentOption).toBeVisible({ timeout: T });
    await agentOption.click();
    await waitForAppSettled(this.page, T);
  }

  private resolveDateValue(dateValue: string): string {
    if (dateValue === '3 years back') {
      return this.dateThreeYearsBack();
    }
    return dateValue;
  }

  private async fillAddFormFields(
    agentName: string,
    product: string,
    status: string,
    dateValue: string,
  ) {
    await this.openAddTransferFormIfNeeded();
    await this.selectAgent(agentName);
    await this.selectDropdownOption(this.loc.productDropdown(), product);
    await this.setEffectiveDate(dateValue);
    const statusButton = this.loc.statusDropdown();
    const statusText = (await statusButton.innerText().catch(() => '')).trim();
    if (statusText && !statusText.toLowerCase().includes(status.toLowerCase())) {
      await this.selectStatusOption(status);
    }
  }

  private async clickAddTransfer() {
    const addBtn = this.loc.addTransferButton();
    await expect(addBtn).toBeVisible({ timeout: T });
    await addBtn.click({ timeout: T });
    await this.page.waitForTimeout(STATIC_WAIT);
    await waitForAppSettled(this.page, T);
  }

  private async submitAddFormExpectingSuccess(
    agentName: string,
    product: string,
    status: string,
    dateValue: string,
  ) {
    await this.fillAddFormFields(agentName, product, status, dateValue);
    await this.clickAddTransfer();
    await expect
      .poll(
        async () => {
          const onList = await this.loc.headingTransferSheet().isVisible().catch(() => false);
          if (onList) return true;
          const toast = this.loc.toast().filter({ hasText: /success|created|added/i });
          return toast.first().isVisible().catch(() => false);
        },
        { timeout: T, intervals: [500, 1_000, 2_000, 5_000] },
      )
      .toBe(true);
    await this.returnToTransferSheetList();
  }

  /**
   * Records cannot be deleted — Unique(Agent+Product).
   * If row exists with wrong status, edit it. If missing, add. On duplicate, edit existing.
   */
  async ensureTransferRecordExists(agentName: string, product: string, status: string) {
    await this.openTransferSheetPage();
    const existingAny = await this.findRow(agentName, product);
    if (existingAny) {
      const statusCol = await this.cellText(existingAny, TRANSFER_SHEET.gridColumns.status);
      if (!statusCol.toLowerCase().includes(status.toLowerCase())) {
        await this.openEditForRecord(agentName, product);
        await this.changeStatusOnForm(status);
        await this.clickSaveOnEditForm();
        await this.expectGridContainsRecord(agentName, product, status);
        return;
      }
      this.storedRow = { agentName, product, status };
      return;
    }

    const dateValue = this.dateThreeYearsBack();
    await this.openAddTransferFormIfNeeded();
    await this.fillAddFormFields(agentName, product, status, dateValue);
    await this.clickAddTransfer();

    if (await this.isDuplicateRuleErrorVisible()) {
      await this.dismissAddOrEditForm();
      await this.openEditForRecord(agentName, product);
      await this.changeStatusOnForm(status);
      await this.clickSaveOnEditForm();
      await this.expectGridContainsRecord(agentName, product, status);
      return;
    }

    await expect
      .poll(
        async () => {
          const onList = await this.loc.headingTransferSheet().isVisible().catch(() => false);
          if (onList) return true;
          const toast = this.loc.toast().filter({ hasText: /success|created|added/i });
          return toast.first().isVisible().catch(() => false);
        },
        { timeout: T, intervals: [500, 1_000, 2_000, 5_000] },
      )
      .toBe(true);
    await this.returnToTransferSheetList();
    await this.expectGridContainsRecord(agentName, product, status);
  }

  async addTransferSheetRecord(
    agentName: string,
    product: string,
    status: string,
    dateValue: string,
  ) {
    const resolvedDate = this.resolveDateValue(dateValue);
    await this.submitAddFormExpectingSuccess(agentName, product, status, resolvedDate);
    this.storedRow = { agentName, product, status, effectiveDate: resolvedDate };
  }

  /**
   * Add a new Unique(Agent+Product) row.
   * Select product at dropdown position 0 → Save. On
   * "A transfer sheet already exists for this carrier agent and product",
   * stay on form, pick next product index, Save again. Then try next agent unless lockAgent.
   * preferredProduct is kept for Gherkin compatibility (selection is by dropdown index).
   */
  async addUniqueTransferSheetRecord(
    preferredAgent: string,
    _preferredProduct: string,
    status: string,
    dateValue: string,
    options?: { lockAgent?: boolean },
  ) {
    const resolvedDate = this.resolveDateValue(dateValue);
    const agents = options?.lockAgent
      ? [preferredAgent]
      : this.uniquePreferredFirst(preferredAgent, TRANSFER_SHEET_FALLBACK_AGENTS);

    for (const agentName of agents) {
      await this.openTransferSheetPage();
      await this.openAddTransferFormIfNeeded();
      await this.selectAgent(agentName);
      await this.setEffectiveDate(resolvedDate);
      const statusButton = this.loc.statusDropdown();
      const statusText = (await statusButton.innerText().catch(() => '')).trim();
      if (statusText && !statusText.toLowerCase().includes(status.toLowerCase())) {
        await this.selectStatusOption(status);
      }

      const productCount = await this.countProductOptions();
      if (productCount < 1) {
        await this.dismissAddOrEditForm();
        continue;
      }

      for (let productIndex = 0; productIndex < productCount; productIndex++) {
        const product = await this.selectProductByIndex(productIndex);
        await this.clickAddTransfer();

        const outcome = await this.waitForAddSaveOutcome();
        if (outcome === 'duplicate') {
          // Form stays open — try next product in the list.
          continue;
        }

        await this.returnToTransferSheetList();
        this.storedRow = { agentName, product, status, effectiveDate: resolvedDate };
        this.lastAddedRow = this.storedRow;
        await this.expectGridContainsRecord(agentName, product, status);
        return;
      }

      await this.dismissAddOrEditForm();
    }

    throw new Error(
      `Could not add unique Transfer Sheet record. Tried agents=[${agents.join(', ')}] with all product dropdown positions`,
    );
  }

  async expectGridContainsRecord(agentName: string, product: string, status: string) {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    await this.refreshRuleListGrid();
    await this.searchRuleListByAgent(agentName);
    await expect
      .poll(async () => (await this.findRowAmongVisible(agentName, product, status)) !== null, {
        timeout: T,
        intervals: [1_000, 2_000],
      })
      .toBe(true);
    this.storedRow = { agentName, product, status };
  }

  async expectNewlyAddedRecordInGrid() {
    const row = this.lastAddedRow ?? this.storedRow;
    if (!row) throw new Error('No newly added Transfer Sheet record stored');
    await this.openTransferSheetPage();
    await this.expectGridContainsRecord(row.agentName, row.product, row.status);
  }

  async expectNewlyAddedUsesAgentAndOtherProduct(agentName: string, excludedProduct: string) {
    const row = this.lastAddedRow ?? this.storedRow;
    if (!row) throw new Error('No newly added Transfer Sheet record stored');
    expect(row.agentName.toLowerCase()).toBe(agentName.toLowerCase());
    expect(row.product.toLowerCase()).not.toBe(excludedProduct.toLowerCase());
  }

  /**
   * T005: If any agent already appears with ≥2 products in Rule List → done.
   * Else capture a once-only agent and add same agent + different product (T001 product-index retry).
   */
  async ensureSameAgentHasDifferentProducts(
    status = 'Active',
    dateValue = '3 years back',
  ) {
    this.sameAgentMultiProduct = null;
    await this.openTransferSheetPage();
    await this.refreshRuleListGrid();
    await this.clearRuleListSearch();

    const visible = await this.collectVisibleAgentProductRows();
    const byAgent = new Map<string, { displayName: string; products: string[] }>();
    for (const row of visible) {
      const key = row.agentName.toLowerCase();
      const entry = byAgent.get(key);
      if (entry) {
        entry.products.push(row.product);
      } else {
        byAgent.set(key, { displayName: row.agentName, products: [row.product] });
      }
    }

    for (const entry of byAgent.values()) {
      const uniqueProducts = [...new Set(entry.products.map(p => p.toLowerCase()))];
      if (uniqueProducts.length >= 2) {
        const products = [...new Set(entry.products)];
        this.sameAgentMultiProduct = { agentName: entry.displayName, products };
        this.storedRow = {
          agentName: entry.displayName,
          product: products[0],
          status,
        };
        this.lastAddedRow = {
          agentName: entry.displayName,
          product: products[1],
          status,
        };
        return;
      }
    }

    let agentName: string;
    let existingProduct: string;
    if (visible.length === 0) {
      await this.addUniqueTransferSheetRecord(
        TRANSFER_SHEET_FALLBACK_AGENTS[0],
        '',
        status,
        dateValue,
      );
      const seeded = this.lastAddedRow;
      if (!seeded) throw new Error('Failed to seed first Transfer Sheet row for T005');
      agentName = seeded.agentName;
      existingProduct = seeded.product;
    } else {
      agentName = visible[0].agentName;
      existingProduct = visible[0].product;
    }

    await this.addUniqueTransferSheetRecord(agentName, existingProduct, status, dateValue, {
      lockAgent: true,
    });
    const added = this.lastAddedRow;
    if (!added) throw new Error('Failed to add second-product Transfer Sheet row for T005');
    expect(
      added.product.toLowerCase(),
      `Expected different product for agent ${agentName}`,
    ).not.toBe(existingProduct.toLowerCase());
    this.sameAgentMultiProduct = {
      agentName,
      products: [existingProduct, added.product],
    };
  }

  async expectAgentHasAtLeastTwoDifferentProducts() {
    const proof = this.sameAgentMultiProduct;
    if (!proof?.agentName) {
      throw new Error('No same-agent multi-product proof — run ensure step first');
    }
    await this.openTransferSheetPage();
    await this.refreshRuleListGrid();
    await this.searchRuleListByAgent(proof.agentName);
    const rows = await this.collectVisibleAgentProductRows();
    const forAgent = rows.filter(
      r => r.agentName.toLowerCase() === proof.agentName.toLowerCase(),
    );
    const products = new Set(forAgent.map(r => r.product.toLowerCase()));
    expect(
      products.size,
      `Agent "${proof.agentName}" should appear with at least two different products`,
    ).toBeGreaterThanOrEqual(2);
  }

  // --- Transfer Sheet regression (Rule List / Policy List) -------------------

  async openAddTransferForm() {
    await this.openTransferSheetPage();
    await this.openAddTransferFormIfNeeded();
    await expect(this.loc.headingAddTransferRecord()).toBeVisible({ timeout: T });
  }

  async expectAddSubmitDisabled() {
    await expect(this.loc.addTransferButton()).toBeDisabled({ timeout: T });
  }

  async expectAddFormOpen() {
    await expect(this.page).toHaveURL(/transfer-sheet\/(add|edit)/i, { timeout: T });
    const onAdd = await this.loc.headingAddTransferRecord().isVisible().catch(() => false);
    const onEdit = await this.loc.headingEditTransferRecord().isVisible().catch(() => false);
    expect(onAdd || onEdit, 'Add/Edit Transfer form should remain open').toBe(true);
  }

  async fillMandatoryFields(
    agentName: string,
    product: string,
    status: string,
    dateValue: string,
  ) {
    const resolvedDate = this.resolveDateValue(dateValue);
    await this.fillAddFormFields(agentName, product, status, resolvedDate);
    this.storedRow = { agentName, product, status, effectiveDate: resolvedDate };
  }

  async clickAddTransferSubmit() {
    const addBtn = this.loc.addTransferButton();
    await expect(addBtn).toBeVisible({ timeout: T });
    await expect(addBtn).toBeEnabled({ timeout: T });
    // Dismiss any open listbox so click hits submit, not overlay.
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(200);

    // Toast appears immediately on click — capture before settle/dismiss.
    await addBtn.click({ timeout: T });
    this.lastToastText = await captureToast(this.page, this.loc.toast(), T);
  }

  /**
   * Read first Rule List row agent + product for duplicate-negative cases.
   * Agent cell is two-line (display name + code); prefer code for dropdown search.
   */
  async captureFirstRuleListRecord() {
    await this.openTransferSheetPage();
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const first = this.loc.gridRows().first();
    await expect(first, 'Rule List should have at least one row').toBeVisible({ timeout: T });

    const agentColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.agent);
    const productColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.product);
    const dateColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.effectiveDate);
    const statusColIndex = await this.getColumnIndex(TRANSFER_SHEET.gridColumns.status);
    expect(agentColIndex, 'Agent as per Statement column').toBeGreaterThanOrEqual(0);
    expect(productColIndex, 'Product column').toBeGreaterThanOrEqual(0);

    const cells = first.locator('[role="gridcell"], td');
    const agentRaw = (await cells.nth(agentColIndex).innerText()).trim();
    const product = (await cells.nth(productColIndex).innerText()).replace(/\s+/g, ' ').trim();
    const agentName = this.parseAgentNameFromCell(agentRaw);
    const effectiveDate =
      dateColIndex >= 0
        ? (await cells.nth(dateColIndex).innerText()).replace(/\s+/g, ' ').trim()
        : undefined;
    const statusRaw =
      statusColIndex >= 0
        ? (await cells.nth(statusColIndex).innerText()).replace(/\s+/g, ' ').trim()
        : '';
    const status = /^inactive$/i.test(statusRaw) ? 'Inactive' : 'Active';

    expect(agentName, 'First-row agent name').toBeTruthy();
    expect(product, 'First-row product').toBeTruthy();
    this.storedRow = { agentName, product, status, effectiveDate };
  }

  /** Open edit for first Rule List row (captures agent/product/status). */
  async openEditForFirstRuleListRecord() {
    this.statusRoundTrip = null;
    await this.captureFirstRuleListRecord();
    const first = this.loc.gridRows().first();
    await expect(first, 'Rule List should have at least one row').toBeVisible({ timeout: T });
    await first.click();
    await expect(this.loc.headingEditTransferRecord()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  /** Re-open edit for the agent+product captured earlier in the scenario. */
  async openEditForSameStoredRecord() {
    const row = this.storedRow;
    if (!row?.agentName || !row.product) {
      throw new Error('No stored Transfer Sheet record — open first-row edit before same-record edit');
    }
    await this.openEditForRecord(row.agentName, row.product);
  }

  /**
   * Flip status Active↔Inactive from current stored/grid status, then Save.
   * First call records original + flipped; second call restores original.
   */
  async flipStatusAndSave() {
    const current = (this.storedRow?.status || '').trim();
    const normalized = /^inactive$/i.test(current) ? 'Inactive' : 'Active';
    const flipped = normalized === 'Active' ? 'Inactive' : 'Active';
    if (!this.statusRoundTrip) {
      this.statusRoundTrip = { original: normalized, flipped };
    }
    await this.changeStatusOnForm(flipped);
    await this.clickSaveOnEditForm();
  }

  async expectEditedRecordStatus(which: 'flipped' | 'original') {
    const row = this.storedRow;
    const trip = this.statusRoundTrip;
    if (!row?.agentName || !row.product) {
      throw new Error('No stored Transfer Sheet record for status assertion');
    }
    if (!trip) {
      throw new Error('No status round-trip state — flip and save first');
    }
    const expected = which === 'flipped' ? trip.flipped : trip.original;
    await this.openTransferSheetPage();
    await this.expectGridContainsRecord(row.agentName, row.product, expected);
    this.storedRow = { ...row, status: expected };
  }

  async fillMandatoryFieldsFromCapturedRecord(status: string, dateValue: string) {
    const row = this.storedRow;
    if (!row?.agentName || !row.product) {
      throw new Error('No captured Rule List record — call captureFirstRuleListRecord first');
    }
    // Reuse captured effective date when present so Unique(Agent+Product) hits same row.
    const resolvedDate = row.effectiveDate || dateValue;
    await this.fillMandatoryFields(row.agentName, row.product, status, resolvedDate);
  }

  /**
   * Open edit: prefer direct row click; fallback to Actions kebab → Edit.
   */
  async openEditForRecord(agentName: string, product: string) {
    await this.openTransferSheetPage();
    const row = await this.findRow(agentName, product);
    expect(row, `No Transfer Sheet row for ${agentName} / ${product}`).toBeTruthy();

    await row!.click();
    const openedByRow = await this.loc
      .headingEditTransferRecord()
      .waitFor({ state: 'visible', timeout: T })
      .then(() => true)
      .catch(() => false);

    if (!openedByRow) {
      await this.openTransferSheetPage();
      const retryRow = await this.findRow(agentName, product);
      expect(retryRow, `No Transfer Sheet row for ${agentName} / ${product} after row-click miss`).toBeTruthy();
      const actions = retryRow!
        .locator('[data-testid^="transfer-sheet-actions-"]')
        .or(retryRow!.getByTestId('data-grid-cell-ellipsis'));
      await actions.first().click();
      await expect(this.loc.editMenuItem().first()).toBeVisible({ timeout: T });
      await this.loc.editMenuItem().first().click();
    }

    await expect(this.loc.headingEditTransferRecord()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
    this.storedRow = { agentName, product, status: this.storedRow?.status ?? '' };
  }

  async changeStatusOnForm(status: string) {
    await this.selectStatusOption(status);
    if (this.storedRow) this.storedRow.status = status;
  }

  async clickSaveOnEditForm() {
    const save = this.loc.addTransferButton();
    await expect(save).toBeVisible({ timeout: T });
    await save.click({ timeout: T });
    this.lastToastText = await captureToast(this.page, this.loc.toast(), T);
    await expect
      .poll(
        async () => {
          const onList = await this.loc.headingTransferSheet().isVisible().catch(() => false);
          if (onList) return true;
          return /success|saved|updated/i.test(this.lastToastText);
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBe(true);
    await this.returnToTransferSheetList();
  }

  async expectDuplicateRuleError() {
    const pattern = /already exists/i;
    if (this.lastToastText && pattern.test(this.lastToastText)) {
      expect(this.lastToastText).toMatch(/transfer sheet.*already exists|already exists.*carrier agent/i);
      return;
    }
    await expect(
      this.loc
        .duplicateRuleError()
        .or(this.page.getByText(/already exists/i))
        .or(this.loc.toast().filter({ hasText: pattern })),
    ).toBeVisible({ timeout: T });
  }

  async expectInvalidEffectiveDateMessage(message: string) {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible({ timeout: T });
  }

  async expectSerialNumbersAscending() {
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
    const values: number[] = [];
    const rows = this.loc.gridRows();
    const count = await rows.count();
    expect(count, 'Rule List should have rows').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await this.cellText(rows.nth(i), 'S.No');
      const n = Number.parseInt(text.replace(/\D/g, ''), 10);
      if (Number.isFinite(n)) values.push(n);
    }
    expect(values.length, 'Expected S.No values on Rule List').toBeGreaterThan(0);
    for (let i = 0; i < values.length - 1; i++) {
      expect(values[i], `S.No out of order at index ${i}`).toBeLessThan(values[i + 1]);
    }
  }

  async openPolicyListTab() {
    await this.openTransferSheetPage();
    await this.loc.policyListTab().click();
    await expect(this.loc.policyListDatagrid()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async expectPolicyListGridVisible() {
    await expect(this.loc.policyListDatagrid()).toBeVisible({ timeout: T });
  }

  async expectPolicyListColumns() {
    const headers = await this.loc
      .policyListDatagrid()
      .locator('[role="columnheader"], .ag-header-cell-text, th')
      .allTextContents();
    const joined = headers.map(h => h.replace(/\s+/g, ' ').trim().toLowerCase()).join(' | ');
    expect(joined).toMatch(/carrier agent/);
    expect(joined).toMatch(/writing agent/);
  }

  async expectPolicyListHasAgentPair() {
    const rows = this.loc
      .policyListDatagrid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    expect(count, 'Transfer Policy List should have data rows').toBeGreaterThan(0);
    const firstText = (await rows.first().innerText()).replace(/\s+/g, ' ').trim();
    expect(firstText.length).toBeGreaterThan(0);
    expect(firstText).toMatch(/\S+/);
  }

  async expectPolicyListRowForAgents(carrierAgent: string, writingAgent: string) {
    const rows = this.loc
      .policyListDatagrid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    await expect
      .poll(
        async () => {
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ');
            if (
              text.toLowerCase().includes(carrierAgent.toLowerCase()) &&
              text.toLowerCase().includes(writingAgent.toLowerCase())
            ) {
              return true;
            }
          }
          return false;
        },
        { timeout: T, intervals: [1_000, 2_000] },
      )
      .toBe(true);
  }

  async expectAllPolicyListStatusesActive() {
    const rows = this.loc
      .policyListDatagrid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const status = await this.cellTextInGrid(this.loc.policyListDatagrid(), rows.nth(i), 'Status');
      expect(status.toLowerCase(), `Row ${i} status`).toContain('active');
      expect(status.toLowerCase()).not.toContain('inactive');
    }
  }

  async expectNoFutureEffectiveDatesOnPolicyList() {
    const rows = this.loc
      .policyListDatagrid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ');
      const match = text.match(/Effective:\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (!match) continue;
      const [mm, dd, yyyy] = match[1].split('/').map(Number);
      const effective = new Date(yyyy, mm - 1, dd);
      expect(
        effective.getTime(),
        `Row ${i} future effective ${match[1]}`,
      ).toBeLessThanOrEqual(today.getTime());
    }
  }

  private async cellTextInGrid(
    grid: Locator,
    row: Locator,
    columnName: string,
  ): Promise<string> {
    const colIndex = await grid.evaluate((el, name) => {
      const target = name.toLowerCase();
      const headerRow =
        el.querySelector('[role="row"]:has([role="columnheader"])') ??
        Array.from(el.querySelectorAll('[role="row"]')).find(r =>
          r.querySelector('[role="columnheader"], th'),
        );
      if (!headerRow) return -1;
      const headers = headerRow.querySelectorAll('[role="columnheader"], th');
      for (let i = 0; i < headers.length; i++) {
        const label = headers[i].textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
        if (label === target || label.includes(target)) return i;
      }
      return -1;
    }, columnName);
    if (colIndex < 0) return '';
    const cells = row.locator('[role="gridcell"], td');
    const count = await cells.count();
    if (colIndex >= count) return '';
    return (await cells.nth(colIndex).innerText()).replace(/\s+/g, ' ').trim();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
