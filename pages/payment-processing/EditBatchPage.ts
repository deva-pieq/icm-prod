import { expect, type Page } from '@playwright/test';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { parseAmount, parseAmountNumber } from '../../utils/payment-module/parseAmount';
import {
  setAddedPayableRowTestId,
  takeAddedPayableRowTestId,
} from '../../utils/edit-transaction/editTransactionContext';

const T = smokeStepTimeoutMs;

/**
 * Edit Batch / Edit Transaction page opened from Approval via
 * `payout-batch-edit-transaction-button` → `/payable-line-items/edit/{batchId}`.
 */
export class EditBatchPage {
  readonly loc = {
    pageRoot: () => this.page.getByTestId('payable-line-items-page'),
    datagrid: () => this.page.getByTestId('payable-line-items-datagrid'),
    heading: () => this.page.getByRole('heading', { name: /Edit Batch/i }),
    summary: () => this.page.getByTestId('edit-batch-summary-container'),
    netSettlement: () => this.page.getByTestId('process-summary-net-settlement'),
    agentsTxns: () => this.page.getByTestId('process-summary-agents-txns'),
    saveBatchButton: () => this.page.getByTestId('save-batch-button'),
    cancelButton: () => this.page.getByTestId('cancel-edit-batch-button'),
    backButton: () => this.page.getByTestId('edit-batch-back-button'),
    headerSelectAll: () => this.page.getByTestId('header-select-all-checkbox'),
    rowCheckboxes: () => this.page.locator('[data-testid^="row-checkbox-"]'),
  };

  constructor(readonly page: Page) {}

  async expectPageReady(): Promise<void> {
    await expect(this.page).toHaveURL(/\/payment-processing\/payable-line-items\/edit\//i, {
      timeout: T,
    });
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
    await expect(this.loc.saveBatchButton()).toBeVisible({ timeout: T });
  }

  async captureNetSettlementAmount(): Promise<string> {
    const el = this.loc.netSettlement();
    await expect(el).toBeVisible({ timeout: T });
    const raw = (await el.innerText()).replace(/\s+/g, ' ').trim();
    const match = raw.match(/\$?[\d,]+(?:\.\d{2})?/);
    const amount = match ? parseAmount(match[0]) : parseAmount(raw);
    expect(amount.length, `Edit Batch Net Settlement empty ("${raw}")`).toBeGreaterThan(0);
    return amount;
  }

  async captureAgentsTransactionsSummary(): Promise<string> {
    const el = this.loc.agentsTxns();
    await expect(el).toBeVisible({ timeout: T });
    return (await el.innerText()).replace(/\s+/g, ' ').trim();
  }

  /** Count checked row checkboxes currently in the DOM. */
  async checkedRowCount(): Promise<number> {
    return this.page.evaluate(() => {
      const boxes = [...document.querySelectorAll('[data-testid^="row-checkbox-"]')];
      let checked = 0;
      for (const el of boxes) {
        const input = (el.matches('input') ? el : el.querySelector('input')) as HTMLInputElement | null;
        const aria = el.getAttribute('aria-checked') || input?.getAttribute('aria-checked');
        if (aria === 'true' || input?.checked) checked++;
      }
      return checked;
    });
  }

  /**
   * Click the first payable row checkbox whose checked state matches
   * `targetChecked`, scanning the WHOLE virtualized grid (the top window shows
   * only the current batch's checked rows; add-candidate payables render only
   * after scrolling — MCP-verified 5920-row grid). Optionally skips one row
   * testid (add-then-remove must target DIFFERENT rows).
   */
  private async clickFirstPayableCheckbox(
    targetChecked: boolean,
    opts: { skipTestId?: string } = {},
  ): Promise<{ clicked: boolean; testid: string }> {
    const viewport = this.page.locator('.ag-body-viewport').first();
    if (await viewport.isVisible().catch(() => false)) {
      await viewport.evaluate((el) => { el.scrollTop = 0; });
    }
    const firstCheckboxId = () =>
      this.page.evaluate(
        () => document.querySelector('[data-testid^="row-checkbox-"]')?.getAttribute('data-testid') ?? '',
      );

    for (let pass = 0; pass < 12; pass++) {
      const result = await this.page.evaluate(
        (args) => {
          const { targetChecked, skipTestId } = args as {
            targetChecked: boolean;
            skipTestId: string;
          };
          const boxes = [...document.querySelectorAll('[data-testid^="row-checkbox-"]')];
          for (const el of boxes) {
            const testid = el.getAttribute('data-testid') ?? '';
            if (skipTestId && testid === skipTestId) continue;
            const input = (el.matches('input') ? el : el.querySelector('input')) as HTMLInputElement | null;
            const aria = el.getAttribute('aria-checked') || input?.getAttribute('aria-checked');
            const isChecked = aria === 'true' || Boolean(input?.checked);
            if (isChecked !== targetChecked) continue;
            const id = input?.id;
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`) as HTMLElement | null;
              label?.click();
              return { clicked: true, testid };
            }
            (el as HTMLElement).click();
            return { clicked: true, testid };
          }
          return { clicked: false, testid: '' };
        },
        { targetChecked, skipTestId: opts.skipTestId ?? '' },
      );
      if (result.clicked) return result;

      const beforeId = await firstCheckboxId();
      const advanced = await viewport
        .evaluate((el) => {
          const span = el.scrollHeight / 11;
          const next = Math.min(el.scrollTop + span, el.scrollHeight);
          if (next === el.scrollTop) return false;
          el.scrollTop = next;
          return true;
        })
        .catch(() => false);
      if (!advanced) break;
      // Condition-based: wait until the virtualized window rendered different rows.
      await expect
        .poll(firstCheckboxId, { timeout: 5_000, intervals: [100, 250, 500] })
        .not.toBe(beforeId)
        .catch(() => undefined);
    }
    return { clicked: false, testid: '' };
  }

  /**
   * Add one currently-unchecked payable line item to the batch selection.
   * Records the added row's testid in module context so the subsequent
   * removeOnePayableLineItem() never un-checks the SAME row (app dirty-set
   * semantics: add+remove of the same row empties the set → Save Batch stuck
   * disabled → T007 flake). Scrolls the virtualized grid so far-down
   * add-candidates are found (MCP-verified: top window only shows batch rows).
   */
  async addOnePayableLineItem(): Promise<void> {
    await this.expectPageReady();
    const before = await this.checkedRowCount();
    const result = await this.clickFirstPayableCheckbox(false);
    expect(result.clicked, 'Expected an unchecked payable row to add').toBe(true);
    if (result.testid) setAddedPayableRowTestId(result.testid);
    await waitForAppSettled(this.page, T);
    await expect
      .poll(async () => this.checkedRowCount(), { timeout: T })
      .toBeGreaterThan(before);
  }

  /**
   * Remove one currently-checked payable line item from the batch selection.
   * Skips the row recorded by addOnePayableLineItem() (if any) so add+remove
   * never target the same row — keeps the dirty row SET non-empty and Save
   * Batch enabled. Fails fast with a clear message when no distinct checked
   * row exists instead of flaking the Save-enabled assert later.
   */
  async removeOnePayableLineItem(): Promise<void> {
    await this.expectPageReady();
    const addedTestId = takeAddedPayableRowTestId();
    const before = await this.checkedRowCount();
    expect(before, 'Need at least one selected payable to remove').toBeGreaterThan(0);
    const result = await this.clickFirstPayableCheckbox(true, { skipTestId: addedTestId });
    if (!result.clicked) {
      throw new Error(
        addedTestId
          ? 'No checked payable row other than the just-added row — add+remove of the same row would empty the dirty set and disable Save Batch'
          : 'Expected a checked payable row to remove',
      );
    }
    await waitForAppSettled(this.page, T);
    await expect.poll(async () => this.checkedRowCount(), { timeout: T }).toBeLessThan(before);
  }

  /** Uncheck all selected payables (Save Batch becomes disabled; Net Settlement → $0). */
  async uncheckAllPayableLineItems(): Promise<void> {
    await this.expectPageReady();
    const header = this.loc.headerSelectAll();
    if (await header.isVisible().catch(() => false)) {
      // Select-all then clear-all via header (covers virtualized rows).
      // sr-only checkbox — React events are on the label, not the hidden input.
      await this.page.evaluate(() => {
        const input = document.querySelector(
          '[data-testid="header-select-all-checkbox"]',
        ) as HTMLInputElement | null;
        const id = input?.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`) as HTMLElement | null;
          label?.click();
        } else {
          input?.click();
        }
      });
      await waitForAppSettled(this.page, T);
      await this.page.evaluate(() => {
        const input = document.querySelector(
          '[data-testid="header-select-all-checkbox"]',
        ) as HTMLInputElement | null;
        const id = input?.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`) as HTMLElement | null;
          label?.click();
        } else {
          input?.click();
        }
      });
      await waitForAppSettled(this.page, T);
    }
    // Fallback: uncheck any still-checked rendered boxes while scrolling.
    const viewport = this.page.locator('.ag-body-viewport').first();
    for (let pass = 0; pass < 30; pass++) {
      await this.page.evaluate(() => {
        const boxes = [...document.querySelectorAll('[data-testid^="row-checkbox-"]')];
        for (const el of boxes) {
          const input = (
            el.matches('input') ? el : el.querySelector('input')
          ) as HTMLInputElement | null;
          const aria = el.getAttribute('aria-checked') || input?.getAttribute('aria-checked');
          const isChecked = aria === 'true' || Boolean(input?.checked);
          if (!isChecked) continue;
          const id = input?.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`) as HTMLElement | null;
            label?.click();
          } else {
            (el as HTMLElement).click();
          }
        }
      });
      if (await viewport.isVisible().catch(() => false)) {
        await viewport.evaluate((el) => {
          el.scrollTop = Math.min(el.scrollTop + 500, el.scrollHeight);
        });
      }
      await waitForAppSettled(this.page, 10_000);
      const agents = (await this.captureAgentsTransactionsSummary()).replace(/\s+/g, ' ');
      if (/Agents\s*0/i.test(agents)) break;
    }
    await this.expectCannotRemoveAllValidation();
  }

  async saveBatch(): Promise<void> {
    const btn = this.loc.saveBatchButton();
    await expect(btn).toBeVisible({ timeout: T });
    await expect(btn).toBeEnabled({ timeout: T });
    await btn.click();
    await waitForAppSettled(this.page, T);
  }

  async expectSaveBatchDisabled(): Promise<void> {
    await expect(this.loc.saveBatchButton()).toBeVisible({ timeout: T });
    await expect(this.loc.saveBatchButton()).toBeDisabled({ timeout: T });
  }

  async expectCannotRemoveAllValidation(): Promise<void> {
    await this.expectSaveBatchDisabled();
    const agents = await this.captureAgentsTransactionsSummary();
    expect(agents, 'Agents/Txns should be zero when all payables unchecked').toMatch(
      /Agents\s*0/i,
    );
    const netRaw = (await this.loc.netSettlement().innerText()).replace(/\s+/g, ' ').trim();
    const netMatch = netRaw.match(/[\d,]+(?:\.\d+)?/);
    expect(netMatch, `Expected a numeric Net Settlement in "${netRaw}"`).toBeTruthy();
    expect(parseAmountNumber(netMatch![0])).toBeCloseTo(0, 2);
  }

  async expectAtLeastOnePayableSelected(): Promise<void> {
    await expect.poll(async () => this.checkedRowCount(), { timeout: T }).toBeGreaterThan(0);
  }

  async backToApproval(): Promise<void> {
    const back = this.loc.backButton();
    await expect(back).toBeVisible({ timeout: T });
    await back.click();
    await waitForAppSettled(this.page, T);
  }

  async expectNetSettlementIncreased(previous: string): Promise<void> {
    const current = await this.captureNetSettlementAmount();
    expect(parseAmountNumber(current)).toBeGreaterThan(parseAmountNumber(previous));
  }

  async expectNetSettlementDecreased(previous: string): Promise<void> {
    const current = await this.captureNetSettlementAmount();
    expect(parseAmountNumber(current)).toBeLessThan(parseAmountNumber(previous));
  }
}
