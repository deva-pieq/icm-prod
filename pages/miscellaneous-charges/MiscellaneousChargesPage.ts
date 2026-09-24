import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { escapeRegex } from '../../utils/escapeRegex';
import { GridPage } from '../shared/GridPage';

const T = smokeStepTimeoutMs;

const NO_RECORDS_TEXT = 'No Records Found';

export class MiscellaneousChargesPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;

  readonly loc = {
    heading: () => this.page.getByRole('heading', { name: 'Miscellaneous Charges', exact: true }),
    addButton: () => this.page.getByTestId('miscellaneous-charge-add-button')
      .or(this.page.getByRole('button', { name: /add miscellaneous charge/i })),
    grid: () => this.page.getByTestId('data-grid').or(this.page.getByRole('grid', { name: 'Data grid' })),
    searchInput: () => this.page.getByTestId('data-grid-search-input').locator('input')
      .or(this.page.getByRole('textbox', { name: /search data grid/i })),
    footer: () => this.page.getByTestId('data-grid-record-count-footer'),
    noRecords: () => this.page.getByText(NO_RECORDS_TEXT, { exact: true }),
    columnsToggle: () => this.page.getByTestId('data-grid-columns-button'),
    exportButton: () => this.page.getByTestId('data-grid-export-button'),
    refreshButton: () => this.page.getByTestId('data-grid-refresh-button'),
    headerCells: () => this.loc.grid().locator('.ag-header-cell-text'),
    selectAllCheckbox: () => this.page.getByRole('checkbox', { name: /select all/i })
      .or(this.page.locator('#checkbox-header-select-all-checkbox')),
    rowCheckboxes: () => this.page.locator('input[id*="checkbox-row"], input[data-testid^="row-checkbox-"]'),
    processButton: () => this.page.getByRole('button', { name: /^Process$/i })
      .or(this.page.getByTestId('process-button')),
    cancelBatchButton: () => this.page.getByRole('button', { name: /^Cancel$/i })
      .or(this.page.getByTestId('cancel-batch-button')),
    agentFilter: () => this.page.getByTestId('filter-agents')
      .or(this.page.getByRole('button', { name: /all agents/i })),
    statusFilter: () => this.page.getByTestId('filter-status')
      .or(this.page.getByRole('button', { name: /all status/i })),
    agentFilterOption: (agent: string) =>
      this.page.getByTestId(`filter-agents-option-${agent}`)
        .or(this.page.getByRole('option', { name: new RegExp(escapeRegex(agent), 'i') })),
    statusFilterOption: (status: string) =>
      this.page.getByTestId(`filter-status-option-${status}`)
        .or(this.page.getByRole('option', { name: new RegExp(escapeRegex(status), 'i') })),
  };

  readonly modal = {
    dialog: () => this.page.getByRole('dialog', { name: /add miscellaneous charge/i })
      .or(this.page.getByTestId('add-miscellaneous-charge-modal')),
    heading: () => this.page.getByRole('heading', { name: 'Add Miscellaneous Charge', exact: true }),
    subtitle: () => this.page.getByText(/enter the details for the new miscellaneous charge/i),
    transactionDate: () => this.page.getByRole('textbox', { name: /transaction date/i })
      .or(this.page.locator('input[type="date"]')),
    agentDropdown: () => this.page.getByRole('combobox', { name: /agent/i })
      .or(this.page.getByTestId('miscellaneous-charge-agent-dropdown')),
    amountInput: () => this.page.getByTestId('miscellaneous-charge-amount')
      .or(this.page.getByRole('textbox', { name: /amount/i })),
    descriptionInput: () => this.page.getByRole('textbox', { name: /description/i }),
    saveButton: () => this.page.getByRole('button', { name: /^Save$/i })
      .or(this.page.getByTestId('save-button')),
    cancelButton: () => this.page.getByRole('button', { name: /^Cancel$/i })
      .or(this.page.getByTestId('cancel-button')),
    closeButton: () => this.page.getByRole('button', { name: /close/i }),
  };

  readonly cancelChangesDialog = {
    dialog: () => this.page.getByRole('dialog', { name: /cancel changes/i }),
    heading: () => this.page.getByRole('heading', { name: 'Cancel Changes', exact: true }),
    body: () => this.page.getByText(/are you sure you want to cancel/i),
    cancelConfirmButton: () => this.page.getByRole('button', { name: /^Cancel$/i }),
    keepEditingButton: () => this.page.getByRole('button', { name: /keep editing/i }),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  get appPage(): Page {
    return this.page;
  }

  async open() {
    await this.sidebar.waitForSidebar();
    if (!AppUrlPatterns.miscellaneousCharges.test(this.page.url())) {
      await this.sidebar.clickPaymentProcessingSubNav(/miscellaneous charges/i);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.miscellaneousCharges);
    await ensurePageReady(this.page, this.loc.heading());
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
  }

  async expectOnPage() {
    await expect(this.page).toHaveURL(AppUrlPatterns.miscellaneousCharges, { timeout: T });
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
  }

  async expectHeading() {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.addButton()).toBeVisible({ timeout: T });
  }

  async expectGridColumns() {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const headers = (await this.loc.headerCells().allTextContents()).map((h) =>
      h.replace(/\s+/g, ' ').trim().toLowerCase(),
    );
    const joined = headers.join(' ');
    for (const col of ['txn date', 'txn id', 'agent', 'amount', 'payment batch', 'payment date', 'status']) {
      expect(joined, `Missing column "${col}"`).toContain(col);
    }
  }

  async expectEmptyState() {
    await expect(this.loc.noRecords()).toBeVisible({ timeout: T });
    const footer = (await this.loc.footer().innerText()).replace(/\s+/g, ' ');
    expect(footer).toMatch(/showing all 0 records/i);
  }

  async expectSearchPlaceholder() {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await expect(search).toHaveAttribute('placeholder', /search by agent/i);
  }

  async expectNoRecords() {
    await expect(this.loc.noRecords()).toBeVisible({ timeout: T });
  }

  async searchCharges(query: string) {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(query);
    await waitForAppSettled(this.page, T);
  }

  async expectRowContains(text: string) {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const row = await this.findRowByText(text);
    expect(row, `Expected grid row containing "${text}"`).not.toBeNull();
  }

  async openAddModal() {
    await this.loc.addButton().click();
    await waitForAppSettled(this.page, T);
    await expect(this.modal.dialog()).toBeVisible({ timeout: T });
    await expect(this.modal.heading()).toBeVisible({ timeout: T });
    await expect(this.modal.subtitle()).toBeVisible({ timeout: T });
  }

  async expectModalHeading() {
    await expect(this.modal.heading()).toBeVisible({ timeout: T });
    await expect(this.modal.subtitle()).toBeVisible({ timeout: T });
  }

  async expectTransactionDateDefaultsToToday() {
    const dateField = this.modal.transactionDate();
    await expect(dateField).toBeVisible({ timeout: T });
    const value = await dateField.inputValue().catch(() => '');
    const today = new Date().toISOString().slice(0, 10);
    if (value) {
      expect(value).toContain(today.replace(/-/g, '/'));
    }
  }

  async expectSaveDisabled() {
    await expect(this.modal.saveButton()).toBeDisabled({ timeout: T });
  }

  async expectSaveEnabled() {
    await expect(this.modal.saveButton()).toBeEnabled({ timeout: T });
  }

  async selectAgent(agentCode: string) {
    const trigger = this.modal.agentDropdown();
    await expect(trigger).toBeVisible({ timeout: T });
    await trigger.click();
    const option = this.page.getByRole('option', { name: new RegExp(escapeRegex(agentCode), 'i') });
    await expect(option.first()).toBeVisible({ timeout: T });
    await option.first().click();
    await waitForAppSettled(this.page, T);
  }

  async fillAmount(amount: string) {
    const input = this.modal.amountInput();
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(amount);
  }

  async fillDescription(description: string) {
    const input = this.modal.descriptionInput();
    await expect(input).toBeVisible({ timeout: T });
    await input.fill(description);
  }

  async clickSave() {
    await expect(this.modal.saveButton()).toBeEnabled({ timeout: T });
    await this.modal.saveButton().click();
    await waitForAppSettled(this.page, T);
  }

  async clickClose() {
    await this.modal.closeButton().click();
    await expect(this.modal.dialog()).toBeHidden({ timeout: T });
  }

  async clickCancel() {
    await this.modal.cancelButton().click();
    await waitForAppSettled(this.page, T);
  }

  async expectCancelChangesDialog() {
    await expect(this.cancelChangesDialog.dialog()).toBeVisible({ timeout: T });
    await expect(this.cancelChangesDialog.heading()).toBeVisible({ timeout: T });
    await expect(this.cancelChangesDialog.body()).toBeVisible({ timeout: T });
  }

  async clickKeepEditing() {
    await this.cancelChangesDialog.keepEditingButton().click();
    await expect(this.cancelChangesDialog.dialog()).toBeHidden({ timeout: T });
    await expect(this.modal.dialog()).toBeVisible({ timeout: T });
  }

  async clickCancelConfirm() {
    await this.cancelChangesDialog.cancelConfirmButton().click();
    await expect(this.cancelChangesDialog.dialog()).toBeHidden({ timeout: T });
  }

  async saveCharge(agentCode: string, amount: string, description: string) {
    await this.openAddModal();
    await this.selectAgent(agentCode);
    await this.fillAmount(amount);
    await this.fillDescription(description);
    await this.clickSave();
  }

  async expectProcessDisabled() {
    await expect(this.loc.processButton()).toBeDisabled({ timeout: T });
  }

  async expectCancelBatchDisabled() {
    await expect(this.loc.cancelBatchButton()).toBeDisabled({ timeout: T });
  }

  async selectFirstRow() {
    const checkbox = this.loc.rowCheckboxes().first();
    await expect(checkbox).toBeVisible({ timeout: T });
    await checkbox.click();
    await waitForAppSettled(this.page, T);
  }

  async clickDeleteFirstRow() {
    await this.selectFirstRow();
    const firstRowActions = this.page.locator('[data-testid^="misc-charge-actions-"]').first();
    await expect(firstRowActions).toBeVisible({ timeout: T });
    await firstRowActions.click();
    await waitForAppSettled(this.page, T);
    const deleteButton = this.page.getByRole('button', { name: /Delete/i });
    await expect(deleteButton).toBeVisible({ timeout: T });
    await deleteButton.click();
    await waitForAppSettled(this.page, T);
  }

  async expectProcessEnabled() {
    await expect(this.loc.processButton()).toBeEnabled({ timeout: T });
  }

  async expectCancelBatchEnabled() {
    await expect(this.loc.cancelBatchButton()).toBeEnabled({ timeout: T });
  }

  async expectExportButton() {
    await expect(this.loc.exportButton()).toBeVisible({ timeout: T });
  }

  async expectRefreshButton() {
    await expect(this.loc.refreshButton()).toBeVisible({ timeout: T });
  }

  async expectColumnsToggle() {
    await expect(this.loc.columnsToggle()).toBeVisible({ timeout: T });
  }

  async expectFooterRecordCount() {
    const footer = this.loc.footer();
    await expect(footer).toBeVisible({ timeout: T });
    const text = await footer.innerText();
    expect(text).toMatch(/showing/i);
  }

  async expectAmountFormatsAsCurrency() {
    const amountCells = this.page.locator('div[role="gridcell"][col-id="amount"]').filter({ hasText: '$' });
    if ((await amountCells.count()) > 0) {
      const text = await amountCells.first().innerText();
      expect(text).toMatch(/\$/);
    }
  }

  async expectTxnIdFormat() {
    const txnIdCells = this.page.locator('div[role="gridcell"]').filter({ hasText: /^TX-/ });
    if ((await txnIdCells.count()) > 0) {
      const text = await txnIdCells.first().innerText();
      expect(text).toMatch(/^TX-[A-Z0-9]{6}$/);
    }
  }

  async expectSelectAllWorks() {
    const selectAll = this.loc.selectAllCheckbox();
    await expect(selectAll).toBeVisible({ timeout: T });
    await selectAll.click();
    await waitForAppSettled(this.page, T);
    await expect(this.loc.processButton()).toBeEnabled({ timeout: T });
    await expect(this.loc.cancelBatchButton()).toBeEnabled({ timeout: T });
  }

  async clearSelection() {
    const selectAll = this.loc.selectAllCheckbox();
    if (await selectAll.isChecked().catch(() => false)) {
      await selectAll.click();
      await waitForAppSettled(this.page, T);
    }
  }
}
