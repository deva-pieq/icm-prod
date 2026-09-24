import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { GridPage } from '../shared/GridPage';
import { PayablesAssertions } from './PayablesAssertions';
import { escapeRegex } from '../../utils/escapeRegex';
import { parseAmount, parseAmountNumber } from '../../utils/payment-module/parseAmount';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class PayablesPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;
  readonly assertions: PayablesAssertions;
  /** Checkbox input ids checked by recent payment-module steps (for reliable uncheck). */
  private lastCheckedCheckboxIds: string[] = [];

  readonly loc = {
    headingPayables: () => this.page.getByRole('heading', { name: /pending payments/i }),
    headingProcessSummary: () => this.page.getByRole('heading', { name: /process summary/i }),
    createPaymentButton: () =>
      this.page
        .getByTestId('create-payment-button')
        .or(this.page.getByRole('button', { name: /create payment/i })),
    confirmPaymentBatchButton: () => this.page.getByTestId('create-payment-modal-save'),
    batchIdDisplay: () => this.page.getByText(/\bPAY-[A-Z0-9-]+\b/i).first(),
    selectAllCheckbox: () =>
      this.page
        .locator('#checkbox-header-select-all-checkbox')
        .or(this.page.getByTestId('header-select-all-checkbox'))
        .or(this.page.getByTestId('select-all-checkbox'))
        .or(this.page.getByRole('checkbox', { name: /select all/i })),
    rowCheckboxes: () =>
      this.page.locator('input[id*="checkbox-row"], input[data-testid^="row-checkbox-"]'),
    searchInput: () =>
      this.page
        .getByTestId('data-grid-search-input')
        .getByRole('textbox')
        .or(this.page.getByTestId('payables-search-filename'))
        .or(this.page.getByTestId('payables-search-file-id'))
        .or(this.page.getByRole('textbox', { name: /search data grid|file name|filename|search|customer/i })),
    pageRoot: () => this.page.getByTestId('payable-line-items-page'),
    datagrid: () => this.page.getByTestId('payable-line-items-datagrid'),
    processSummaryContainer: () => this.page.getByTestId('process-summary-container'),
    netSettlementValue: () =>
      this.page.locator("//span[text()='Net Settlement']//following-sibling::span").first(),
    agentsSummaryValue: () =>
      this.page.locator("//span[text()='Agents']//following-sibling::span").first(),
    /** Amount column cells (AG Grid center). Prefer gridcell text — nested span, not div. */
    amountCellDollarValues: () =>
      this.page.locator('div[role="gridcell"][col-id="amount"]').filter({ hasText: '$' }),
    /** Row checkbox for a given AG Grid row-index (pinned-left; not in the amount row DOM). */
    rowCheckboxByIndex: (rowIndex: number) =>
      this.page
        .locator(`.ag-pinned-left-cols-container [role="row"][row-index="${rowIndex}"]`)
        .locator('input[type="checkbox"]')
        .first(),
    belowThresholdHint: () =>
      this.page.getByText(/Remove agents below \$25\.00 to proceed/i),
    rightSidebar: () =>
      this.page
        .getByTestId('payables-right-sidebar')
        .or(this.page.getByTestId('process-summary-container'))
        .or(this.page.locator('aside, [data-testid*="sidebar"]').filter({ hasText: /process summary/i })),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
    this.assertions = new PayablesAssertions(this);
  }

  async open() {
    await this.sidebar.waitForSidebar();
    if (!AppUrlPatterns.paymentPayables.test(this.page.url())) {
      await this.sidebar.clickPaymentProcessingSubNav(/^Payables$/i);
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentPayables);
    await ensurePageReady(this.page, this.loc.headingPayables(), { timeout: 120_000 });
  }

  /** Smoke-only: Pending Payments heading + page root + grid + search. */
  async smokeExpectHeader() {
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentPayables, { timeout: T });
    await expect(this.loc.headingPayables()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: T });
  }

  async searchByValue(value: string) {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible();
    await search.fill(value);
    await this.page.keyboard.press('Enter');
    await waitForAppSettled(this.page);
    // Wait until the new filter is applied — checkbox count alone can pass on stale
    // ACH rows while the CHK search is still settling (mixed-batch Agents=1 race).
    await expect
      .poll(async () => this.isPayablesSearchSettled(value), { timeout: T })
      .toBe(true);
  }

  /**
   * True when status shows the query and visible rows match that query
   * (Customer UID may be off-screen — prefer PaymentModule-ACH/CHK file markers).
   */
  private async isPayablesSearchSettled(value: string): Promise<boolean> {
    const status = (
      await this.page
        .getByRole('status')
        .innerText()
        .catch(() => '')
    ).replace(/\s+/g, ' ');
    if (!status.includes(value)) return false;
    if ((await this.loc.rowCheckboxes().count()) < 1) return false;

    const grid = (
      await this.page
        .locator('.ag-center-cols-container')
        .innerText()
        .catch(() => '')
    ).replace(/\s+/g, ' ');
    if (grid.includes(value)) return true;
    if (/PAY-TEST-ACH/i.test(value)) return /PaymentModule-ACH/i.test(grid);
    if (/PAY-TEST-CHK/i.test(value)) return /PaymentModule-CHK/i.test(grid);
    return grid.length > 0;
  }

  async clearPayablesSearch(): Promise<void> {
    const search = this.loc.searchInput();
    if (!(await search.isVisible().catch(() => false))) return;
    await search.fill('');
    await this.page.keyboard.press('Enter');
    await waitForAppSettled(this.page, T);
  }

  /**
   * Select payables for Agent Level I (ACH UID) + Agent Level II (CHK UID).
   * Agent filter is single-select; selection persists across filter/search changes.
   */
  async selectAchAndChkPayablesByCustomerUid(
    achCustomerUid: string,
    chkCustomerUid: string,
  ): Promise<void> {
    await this.resetAgentsFilterToAll();
    await this.clearPayablesSearch();

    await this.selectAgentFilterOption('Agent Level I');
    await this.searchByValue(achCustomerUid);
    await this.selectAllRecords();
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });

    await this.selectAgentFilterOption('Agent Level II');
    await this.searchByValue(chkCustomerUid);
    await this.selectAllRecords();
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });

    await this.resetAgentsFilterToAll();
    await this.clearPayablesSearch();

    await expect
      .poll(
        async () => {
          const agentsRaw = (await this.loc.agentsSummaryValue().innerText())
            .replace(/\s+/g, ' ')
            .trim();
          return Number.parseInt(agentsRaw, 10);
        },
        {
          timeout: T,
          message: 'Expected Agent Level I + Agent Level II (Agents >= 2) after mixed select',
        },
      )
      .toBeGreaterThanOrEqual(2);
  }

  async resetAgentsFilterToAll(): Promise<void> {
    const filter = this.page.getByTestId('filter-agents');
    if (!(await filter.isVisible().catch(() => false))) return;
    const label = (await filter.innerText()).replace(/\s+/g, ' ').trim();
    if (/^All Agents$/i.test(label)) return;
    await filter.locator('button').first().click();
    const allOpt = this.page.getByTestId('filter-agents-option-all');
    await expect(allOpt).toBeVisible({ timeout: T });
    await allOpt.click();
    await waitForAppSettled(this.page, T);
  }

  async selectAgentFilterOption(agentName: string): Promise<void> {
    const filter = this.page.getByTestId('filter-agents');
    await expect(filter).toBeVisible({ timeout: T });
    await filter.locator('button').first().click();
    const opt = this.page.getByTestId(`filter-agents-option-${agentName}`);
    await expect(opt).toBeVisible({ timeout: T });
    await opt.click();
    await waitForAppSettled(this.page, T);
  }

  /**
   * Check every *rendered* row checkbox after a grid filter/search.
   *
   * Do NOT use the header select-all control — it selects the entire payables
   * dataset (hundreds of rows), ignoring the Customer UID filter.
   */
  async selectAllRecords() {
    await expect
      .poll(async () => this.loc.rowCheckboxes().count(), { timeout: T })
      .toBeGreaterThan(0);

    // Bulk-click via DOM — avoids stale nth() locators under AG Grid virtualization.
    const ids = await this.page.evaluate(() => {
      const clicked: string[] = [];
      const inputs = [
        ...document.querySelectorAll('input[id*="checkbox-row"]'),
      ] as HTMLInputElement[];
      for (const input of inputs) {
        clicked.push(input.id);
        if (input.checked) continue;
        const label = document.querySelector(
          `label[for="${input.id}"]`,
        ) as HTMLElement | null;
        label?.click();
      }
      return clicked;
    });
    this.lastCheckedCheckboxIds = ids.filter(Boolean);
    await waitForAppSettled(this.page, T);
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });
  }

  async clickCreatePayment() {
    const button = this.loc.createPaymentButton();
    await expect(button).toBeVisible();
    if (!(await button.isEnabled())) {
      await this.ensureCreatePaymentEnabled();
    }
    await expect(button).toBeEnabled();
    await button.click();
    await waitForAppSettled(this.page);
  }

  async confirmPaymentBatch() {
    const confirm = this.loc.confirmPaymentBatchButton();
    await expect(confirm).toBeVisible();
    await confirm.click();
    await waitForAppSettled(this.page);
  }

  async captureBatchId(): Promise<string> {
    const batch = this.loc.batchIdDisplay();
    await expect(batch).toBeVisible();
    const text = (await batch.innerText()).trim();
    const match = text.match(/\b(PAY-[A-Z0-9-]+)\b/i);
    if (!match?.[1]) {
      throw new Error(`Batch id not found in display text: "${text}"`);
    }
    const id = match[1];
    return id;
  }

  async assertProcessSummary(expectedEarning: string) {
    const sidebar = this.loc.rightSidebar();
    await expect(sidebar).toBeVisible();
    await expect(this.loc.headingProcessSummary()).toBeVisible();
    const earning = expectedEarning.replace(/,/g, '');
    await expect(sidebar).toContainText(new RegExp(escapeRegex(earning), 'i'));
  }

  /**
   * Check the first payable row that can proceed (Amount >= $25) so Create Payment
   * is not blocked by the below-threshold agent rule. Falls back to row 0.
   */
  async checkFirstRowCheckbox(): Promise<void> {
    this.lastCheckedCheckboxIds = [];
    const amountValues = this.loc.amountCellDollarValues();
    const amountCount = await amountValues.count();
    for (let i = 0; i < amountCount; i++) {
      const amountEl = amountValues.nth(i);
      const raw = (await amountEl.innerText()).replace(/\s+/g, ' ').trim();
      const value = parseAmountNumber(raw);
      if (value < 25) continue;

      const row = amountEl.locator('xpath=ancestor::div[@role="row"][1]');
      const rowIndexAttr = await row.getAttribute('row-index');
      const index =
        rowIndexAttr != null && rowIndexAttr !== ''
          ? Number.parseInt(rowIndexAttr, 10)
          : i;
      if (!Number.isFinite(index) || index < 0) continue;

      const checkbox = this.loc.rowCheckboxByIndex(index);
      await expect(checkbox).toBeAttached({ timeout: T });
      const id = await checkbox.getAttribute('id');
      if (id) this.lastCheckedCheckboxIds = [id];
      await this.setRowCheckbox(checkbox, true);
      await waitForAppSettled(this.page, T);
      console.log(
        `[payables] Checked first eligible row index=${index} amount=${raw} (>= $25) checkedDom=${await this.checkedRowCheckboxCount()}`,
      );
      return;
    }

    const boxes = this.loc.rowCheckboxes();
    await expect(boxes.first()).toBeAttached({ timeout: T });
    const id = await boxes.first().getAttribute('id');
    if (id) this.lastCheckedCheckboxIds = [id];
    await this.setRowCheckbox(boxes.first(), true);
    await waitForAppSettled(this.page, T);
  }

  async checkRowCheckboxesByIndexes(indexes: number[]): Promise<void> {
    this.lastCheckedCheckboxIds = [];
    expect(indexes.length, 'Provide at least one checkbox index').toBeGreaterThan(0);

    for (const index of indexes) {
      const checkbox = this.loc.rowCheckboxByIndex(index);
      await expect(checkbox, `Pinned checkbox for row-index=${index}`).toBeAttached({
        timeout: T,
      });
      const id = await checkbox.getAttribute('id');
      if (id) this.lastCheckedCheckboxIds.push(id);
      if (!(await checkbox.isChecked().catch(() => false))) {
        await this.clickSrOnlyCheckbox(checkbox);
        await this.page.waitForTimeout(300);
      }
    }
    await waitForAppSettled(this.page, T);
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });
  }

  /**
   * Clear the current payables selection.
   *
   * Prefer toggling the checkbox ids this test checked. If Process Summary
   * remains (custom checkbox / selection-model won't deselect — common when
   * header select-all previously selected the full dataset), soft-navigate to
   * Payables to reset selection without using header select-all.
   */
  async uncheckAllRowCheckboxes(): Promise<void> {
    const ids = [...this.lastCheckedCheckboxIds];
    this.lastCheckedCheckboxIds = [];

    for (const id of ids) {
      const input = this.page.locator(`[id="${id}"]`);
      if (!(await input.isChecked().catch(() => false))) continue;
      await this.page.locator(`label[for="${id}"]`).click({ force: true });
      await this.page.waitForTimeout(400);
    }
    await waitForAppSettled(this.page, T);

    if (!(await this.loc.processSummaryContainer().isVisible().catch(() => false))) {
      return;
    }

    console.log('[payables] Selection still active after toggle — reopening Payables to clear');
    await this.page.goto('/payment-processing/payable-line-items', {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
    await expect(this.loc.headingPayables()).toBeVisible({ timeout: T });
    await expect(this.loc.processSummaryContainer()).toBeHidden({ timeout: T });
  }

  private async checkedRowCheckboxCount(): Promise<number> {
    return this.loc.rowCheckboxes().and(this.page.locator(':checked')).count();
  }

  /**
   * Custom payables checkboxes use `sr-only` inputs; Playwright check/uncheck
   * clicks the hidden input but React often ignores it. Prefer the associated
   * label / wrapper, then a bubbled DOM click via evaluate.
   */
  private async clickSrOnlyCheckbox(input: Locator): Promise<void> {
    const id = await input.getAttribute('id');
    if (id) {
      const label = this.page.locator(`label[for="${id}"]`);
      if ((await label.count()) > 0) {
        try {
          await label.first().scrollIntoViewIfNeeded().catch(() => undefined);
          await label.first().click({ force: true, timeout: 5_000 });
          return;
        } catch {
          // Label present but not actionable (virtualized / overlay) — evaluate below.
        }
      }
      await this.page.evaluate((checkboxId) => {
        const el = document.querySelector(
          `label[for="${checkboxId}"]`,
        ) as HTMLElement | null;
        el?.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
        );
      }, id);
      return;
    }

    const wrapper = input.locator('xpath=ancestor::label[1]');
    if ((await wrapper.count()) > 0) {
      await wrapper.scrollIntoViewIfNeeded().catch(() => undefined);
      await wrapper.click({ force: true });
      return;
    }

    await input.evaluate((el: HTMLInputElement) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
  }

  private async setRowCheckbox(input: Locator, checked: boolean): Promise<void> {
    await input.scrollIntoViewIfNeeded().catch(() => undefined);
    const isChecked = await input.isChecked().catch(() => false);
    if (isChecked === checked) return;
    await this.clickSrOnlyCheckbox(input);
    // Soft poll — some selection-model updates leave isChecked stale briefly.
    await this.page.waitForTimeout(400);
  }

  async expectProcessSummaryVisible(): Promise<void> {
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });
    await expect(this.loc.headingProcessSummary()).toBeVisible({ timeout: T });
  }

  async expectProcessSummaryHidden(): Promise<void> {
    await expect(this.loc.processSummaryContainer()).toBeHidden({ timeout: T });
  }

  async expectCreatePaymentVisibleAndEnabled(): Promise<void> {
    // Business rule: "Remove agents below $25.00 to proceed" visible ⇒ button disabled.
    await expect(
      this.loc.belowThresholdHint(),
      'Create Payment stays disabled while below-$25 agents remain in Process Summary',
    ).toBeHidden({ timeout: T });
    const button = this.loc.createPaymentButton();
    await expect(button).toBeVisible({ timeout: T });
    await expect(button).toBeEnabled({ timeout: T });
  }

  async expectCreatePaymentVisibleAndDisabled(): Promise<void> {
    const button = this.loc.createPaymentButton();
    await expect(button).toBeVisible({ timeout: T });
    await expect(button).toBeDisabled({ timeout: T });
  }

  async expectRemoveAgentsBelowThresholdMessage(): Promise<void> {
    await this.expectProcessSummaryVisible();
    await expect(this.loc.belowThresholdHint()).toBeVisible({ timeout: T });
  }

  /**
   * Select the first payable row whose Amount is strictly below `maxExclusive`
   * (commission-split rows like $7.89 / $15.78). Validates the $25 rule:
   * Process Summary shows the remove-agents hint and Create Payment disables.
   *
   * Checkbox lives in the pinned-left row (same row-index), not the amount cell DOM.
   * Any prior selection must be cleared first — leftover ≥$25 rows keep Net Settlement
   * above the threshold and hide the hint (seen when T003 selection bled into T004).
   */
  async checkRowWithAmountLessThan(maxExclusive: number): Promise<void> {
    await this.clearSelectionPreservingSearch();

    const amountValues = this.loc.amountCellDollarValues();
    await expect
      .poll(async () => amountValues.count(), { timeout: T })
      .toBeGreaterThan(0);

    let matchedIndex = -1;
    let matchedAmount = '';
    let matchedValue = Number.NaN;
    const count = await amountValues.count();
    for (let i = 0; i < count; i++) {
      const amountEl = amountValues.nth(i);
      const raw = (await amountEl.innerText()).replace(/\s+/g, ' ').trim();
      const value = parseAmountNumber(raw);
      if (value >= maxExclusive) continue;

      const row = amountEl.locator('xpath=ancestor::div[@role="row"][1]');
      const rowIndexAttr = await row.getAttribute('row-index');
      const index =
        rowIndexAttr != null && rowIndexAttr !== ''
          ? Number.parseInt(rowIndexAttr, 10)
          : i;
      if (!Number.isFinite(index) || index < 0) continue;

      matchedIndex = index;
      matchedAmount = raw;
      matchedValue = value;
      break;
    }

    expect(
      matchedIndex,
      `No payable row found with Amount < $${maxExclusive}`,
    ).toBeGreaterThanOrEqual(0);
    expect(
      matchedValue,
      `Selected amount ${matchedAmount} must be < $${maxExclusive}`,
    ).toBeLessThan(maxExclusive);

    const checkbox = this.loc.rowCheckboxByIndex(matchedIndex);
    await expect(checkbox, `Pinned checkbox for row-index=${matchedIndex}`).toBeAttached({
      timeout: T,
    });
    const id = await checkbox.getAttribute('id');
    this.lastCheckedCheckboxIds = id ? [id] : [];
    await this.setRowCheckbox(checkbox, true);
    await waitForAppSettled(this.page, T);

    // Confirm Process Summary reflects only the below-threshold selection.
    await this.expectProcessSummaryVisible();
    await expect(
      this.loc.belowThresholdHint(),
      `Expected below-$${maxExclusive} threshold hint after selecting ${matchedAmount}`,
    ).toBeVisible({ timeout: T });

    console.log(
      `[payables] Selected row index=${matchedIndex} amount=${matchedAmount} (< $${maxExclusive}) — threshold hint visible`,
    );
  }

  /**
   * Drop any current selection while keeping the grid search filter.
   * Soft-reopens Payables + re-applies search when checkbox toggles won't clear.
   */
  private async clearSelectionPreservingSearch(): Promise<void> {
    const searchValue = await this.loc.searchInput().inputValue().catch(() => '');

    for (const id of this.lastCheckedCheckboxIds) {
      const input = this.page.locator(`[id="${id}"]`);
      if (await input.isChecked().catch(() => false)) {
        await this.page.evaluate((checkboxId) => {
          document
            .querySelector(`label[for="${checkboxId}"]`)
            ?.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
            );
        }, id);
        await this.page.waitForTimeout(300);
      }
    }
    this.lastCheckedCheckboxIds = [];

    // Toggle off any remaining visible ticks.
    for (let pass = 0; pass < 20; pass++) {
      const checked = this.loc.rowCheckboxes().and(this.page.locator(':checked'));
      if ((await checked.count()) === 0) break;
      const id = await checked.first().getAttribute('id');
      if (!id) break;
      await this.page.evaluate((checkboxId) => {
        document
          .querySelector(`label[for="${checkboxId}"]`)
          ?.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
          );
      }, id);
      await this.page.waitForTimeout(300);
      if (await this.page.locator(`[id="${id}"]`).isChecked().catch(() => false)) break;
    }
    await waitForAppSettled(this.page, T);

    const summaryVisible = await this.loc
      .processSummaryContainer()
      .isVisible()
      .catch(() => false);
    if (!summaryVisible && (await this.checkedRowCheckboxCount()) === 0) return;

    console.log(
      '[payables] clearSelectionPreservingSearch — reopening Payables and re-applying search',
    );
    await this.page.goto('/payment-processing/payable-line-items', {
      waitUntil: 'domcontentloaded',
    });
    await waitForAppSettled(this.page, T);
    await expect(this.loc.headingPayables()).toBeVisible({ timeout: T });
    if (searchValue.trim()) {
      await this.searchByValue(searchValue.trim());
    }
  }

  /**
   * When Process Summary shows "Remove agents below $25.00 to proceed",
   * click Remove agent until Create Payment is enabled (or hint clears).
   */
  async removeAgentsBelowThresholdIfRequired(): Promise<void> {
    const hint = this.loc.belowThresholdHint();
    if (!(await hint.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    const createPaymentButton = this.loc.createPaymentButton();
    if (await createPaymentButton.isEnabled().catch(() => false)) return;

    const removeButtons = this.page.getByRole('button', { name: /remove agent/i });
    for (let i = 0; i < 50; i++) {
      if ((await removeButtons.count()) === 0) break;
      await removeButtons.first().click();
      await waitForAppSettled(this.page, T);
      if (await createPaymentButton.isEnabled().catch(() => false)) break;
      if (!(await hint.isVisible().catch(() => false))) break;
    }
  }

  /**
   * Ensure selection meets the $25 threshold so Create Payment can enable.
   * Remove below-threshold agents from the *current* (filtered) selection first —
   * never use header select-all (that pulls in the entire payables dataset).
   */
  async ensureCreatePaymentEnabled(): Promise<void> {
    const button = this.loc.createPaymentButton();
    await expect(this.loc.processSummaryContainer()).toBeVisible({ timeout: T });
    if (await button.isEnabled().catch(() => false)) return;

    await this.removeAgentsBelowThresholdIfRequired();
    if (await button.isEnabled().catch(() => false)) return;

    await this.selectAllRecords();
    await this.removeAgentsBelowThresholdIfRequired();
    await expect(button).toBeEnabled({ timeout: T });
    await expect(this.loc.belowThresholdHint()).toBeHidden({ timeout: T });
  }

  async captureNetSettlementAmount(): Promise<string> {
    await this.expectProcessSummaryVisible();
    const el = this.loc.netSettlementValue();
    await expect(el).toBeVisible({ timeout: T });
    const raw = (await el.innerText()).replace(/\s+/g, ' ').trim();
    const amount = parseAmount(raw);
    expect(amount.length, `Net Settlement text was empty ("${raw}")`).toBeGreaterThan(0);
    return amount;
  }

  async expectPendingPaymentsHeading(): Promise<void> {
    await expect(this.loc.headingPayables()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
  }

  async expectPayablesGridColumns(): Promise<void> {
    const grid = this.loc.datagrid().or(this.grid());
    await expect(grid).toBeVisible({ timeout: T });
    const headers = (await grid.locator('.ag-header-cell-text').allTextContents()).map((h) =>
      h.trim().toLowerCase(),
    );
    const joined = headers.join(' ');
    for (const col of ['uploaded date', 'txn id', 'paid to agent', 'amount']) {
      expect(joined, `Missing payables column "${col}"`).toContain(col);
    }
  }

  async expectProcessSummaryMetrics(): Promise<void> {
    await this.expectProcessSummaryVisible();
    const agents = this.loc.agentsSummaryValue();
    const net = this.loc.netSettlementValue();
    await expect(agents).toBeVisible({ timeout: T });
    await expect(net).toBeVisible({ timeout: T });
    const agentsText = (await agents.innerText()).replace(/\s+/g, ' ').trim();
    const netText = (await net.innerText()).replace(/\s+/g, ' ').trim();
    expect(Number.parseInt(agentsText, 10), `Agents metric invalid: "${agentsText}"`).toBeGreaterThan(
      0,
    );
    expect(parseAmount(netText).length, `Net Settlement empty: "${netText}"`).toBeGreaterThan(0);
    expect(netText).toMatch(/\$/);
  }
}
