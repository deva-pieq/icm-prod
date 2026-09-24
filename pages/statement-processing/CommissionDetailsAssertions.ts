import { expect } from '@playwright/test';
import { escapeRegex } from '../../utils/escapeRegex';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import type { CommissionDetailsPage } from './CommissionDetailsPage';

const T = smokeStepTimeoutMs;

export class CommissionDetailsAssertions {
  constructor(private readonly detailsPage: CommissionDetailsPage) {}

  async expectSplitCardContains(...fragments: string[]): Promise<void> {
    const splitCard = this.detailsPage.loc.splitCard();
    for (const fragment of fragments) {
      await expect(splitCard).toContainText(fragment, { timeout: T });
    }
  }

  async expectPageSubtitleContainsFileCarrierDate(
    fileName: string,
    carrier: string,
    carrierFallback?: string,
  ): Promise<void> {
    const text = await this.detailsPage.getPageSubtitleText();
    expect.soft(text).toBeTruthy();
    expect
      .soft(text)
      .toMatch(new RegExp(escapeRegex(fileName.replace(/\.(xlsx|csv)$/i, '')), 'i'));
    const carrierPattern = new RegExp(
      `${escapeRegex(carrier)}|${escapeRegex(carrierFallback ?? carrier)}`,
      'i',
    );
    expect(text).toMatch(carrierPattern);
    expect(text).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/);
  }

  async expectReconcileWarningTooltipContains(text: string): Promise<void> {
    const icons = this.detailsPage.loc.reconcileWarningIcon();
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 2); i++) {
      const tooltipText = await this.detailsPage.hoverReconcileWarningOnGrid(i);
      expect(tooltipText.toLowerCase()).toContain(text.toLowerCase());
    }
  }

  async expectNBInRecords(): Promise<void> {
    await expect(this.detailsPage.grid()).toBeVisible({ timeout: T });
    await expect(this.detailsPage.grid().getByText(/\bNB\b/i).first()).toBeVisible({ timeout: T });
  }

  async expectStatusUnmatched(): Promise<void> {
    await expect(this.detailsPage.grid()).toBeVisible({ timeout: T });
    const warnings = await this.detailsPage.loc.reconcileWarningIcon().count();
    expect(warnings).toBeGreaterThan(0);
    const nbRecords = await this.detailsPage.grid().getByText(/\bNB\b/i).count();
    expect(warnings).toBe(nbRecords);
  }

  async expectAllRecordsPaymentStatus(status: string): Promise<void> {
    await expect(this.detailsPage.grid()).toBeVisible({ timeout: T });
    const expectedCount = await this.detailsPage.getRecordCountFromFooter();
    expect(expectedCount).toBeGreaterThan(0);

    const paymentStatuses = await this.detailsPage.getPaymentStatusesFromGrid();
    expect.soft(paymentStatuses.length).toBe(expectedCount);
    paymentStatuses.forEach((paymentStatus, index) => {
      expect
        .soft(paymentStatus, `Record ${index + 1} should be "${status}"`)
        .toBe(status);
    });
  }

  async expectAllRecordsReconciled(transactionType = 'NB'): Promise<void> {
    await expect(this.detailsPage.grid()).toBeVisible({ timeout: T });
    const expectedCount = await this.detailsPage.getRecordCountFromFooter();
    expect(expectedCount).toBeGreaterThan(0);
    const pattern = new RegExp(escapeRegex(transactionType), 'i');
    await expect
      .poll(
        async () => {
          const warnings = await this.detailsPage.loc.reconcileWarningIcon().count();
          const rows = await this.detailsPage
            .grid()
            .locator('.ag-center-cols-container [role="row"][row-id]')
            .evaluateAll((els) =>
              els.map((el) => {
                const cell = el.querySelector('.ag-cell[col-id="transactionType"]');
                return (cell?.textContent || '').replace(/\s+/g, ' ').trim();
              }),
            );
          return {
            warnings,
            rowCount: rows.length,
            allReconciled: rows.length >= expectedCount && rows.every((r) => pattern.test(r)),
          };
        },
        { timeout: T, intervals: [500, 1_000] },
      )
      .toEqual({ warnings: 0, rowCount: expectedCount, allReconciled: true });
  }

  async expectSuccessNotificationContaining(text: string): Promise<void> {
    const toast = this.detailsPage.loc
      .toast()
      .filter({ hasText: new RegExp(escapeRegex(text), 'i') })
      .first();
    await expect(toast).toBeVisible({ timeout: T });
  }
}
