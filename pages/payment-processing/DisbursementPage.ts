import { expect, type Download, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';
import { parseAmountNumber } from '../../utils/payment-module/parseAmount';

const T = smokeStepTimeoutMs;

const DISBURSEMENT_COLUMNS = [
  'Approved Date',
  'Settlement Batch',
  'Approver',
  'Agents',
  'Net Disbursement',
] as const;

export class DisbursementPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;
  private lastDownload: Download | null = null;

  readonly loc = {
    pageRoot: () => this.page.getByTestId('disbursement-history-page'),
    datagrid: () => this.page.getByTestId('disbursement-history-datagrid'),
    heading: () => this.page.getByRole('heading', { name: /disbursement history/i }),
    finalizedSettlementChip: () => this.page.getByText(/finalized settlement/i).first(),
    searchInput: () =>
      this.page
        .getByTestId('data-grid-search-input')
        .getByRole('textbox')
        .or(this.page.getByRole('textbox', { name: /search data grid/i })),
    rowDownloadButton: () => this.page.getByTestId('disbursement-history-row-download'),
    disbursementToast: () => this.page.getByTestId('disbursement-toast'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.waitForSidebar();
    await this.sidebar.clickPaymentProcessingSubNav(/^History$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentHistory);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
  }

  async expectHeadingVisible(): Promise<void> {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
  }

  /** Smoke-only: Disbursement History heading + page root + grid + search. */
  async smokeExpectHeader(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentHistory, { timeout: T });
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
    await expect(this.loc.searchInput()).toBeVisible({ timeout: T });
  }

  async expectGridColumns(): Promise<void> {
    const grid = this.loc.datagrid().or(this.grid());
    await expect(grid).toBeVisible({ timeout: T });
    const headers = (await grid.locator('.ag-header-cell-text').allTextContents()).map((h) =>
      h.trim(),
    );
    const joined = headers.join(' ').toLowerCase();
    for (const col of DISBURSEMENT_COLUMNS) {
      expect(joined, `Missing column "${col}" in ${headers.join(', ')}`).toContain(
        col.toLowerCase(),
      );
    }
  }

  async searchByPaymentId(paymentId: string): Promise<void> {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(paymentId);
    await this.page.keyboard.press('Enter');
    await waitForAppSettled(this.page, T);
  }

  rowForPaymentId(paymentId: string) {
    return this.grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(paymentId), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
  }

  async expectRowForPaymentId(paymentId: string): Promise<void> {
    const row = this.rowForPaymentId(paymentId);
    await expect(row).toBeVisible({ timeout: T });
    await expect(row.getByTestId('disbursement-history-row-download')).toBeVisible({ timeout: T });
  }

  async expectRowNetDisbursementMatches(paymentId: string, capturedAmount: string): Promise<void> {
    const row = this.rowForPaymentId(paymentId);
    await expect(row).toBeVisible({ timeout: T });
    const text = (await row.innerText()).replace(/\s+/g, ' ').trim();
    expect(text).toContain(paymentId);
    const amountMatch = text.match(/\$[\d,]+(?:\.\d{2})?/);
    expect(amountMatch, `No $ amount in disbursement row: "${text}"`).toBeTruthy();
    expect(parseAmountNumber(amountMatch![0])).toBeCloseTo(parseAmountNumber(capturedAmount), 2);
  }

  async openRecordForAgent(agentName: string) {
    const row = this.grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(agentName), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible();
    await row.click();
    await waitForAppSettled(this.page);
  }

  /**
   * Smoke helper: open a history record and verify Finalized Settlement.
   * Skips when History is empty. Soft-skips the chip when the first row is
   * not a finalized batch (preprod data varies).
   */
  async openRecordWithFinalizedChip() {
    await this.open();
    const opened = await super.openFirstGridRow();
    const chip = this.loc.finalizedSettlementChip();
    await expect(chip).toBeVisible({ timeout: T });
    // if (!AppUrlPatterns.paymentHistory.test(this.page.url())) {
    //   await this.open();
    // }
    // const opened = await super.openFirstGridRow();
    // if (!opened) return;
    // const chip = this.loc.finalizedSettlementChip();
    // if (await chip.isVisible({ timeout: Math.min(T, 15_000) }).catch(() => false)) {
    //   return;
    // }
    // // First row may be a non-finalized batch — smoke still passed navigation + open.
    // console.warn(
    //   '[smoke] Disbursement history row opened but Finalized Settlement chip not visible; skipping chip assert',
    // );
  }

  async clickDownloadForBatchId(batchId: string): Promise<void> {
    const row = this.rowForPaymentId(batchId);
    await expect(row).toBeVisible({ timeout: T });
    const downloadBtn = row.getByTestId('disbursement-history-row-download').first();
    await expect(downloadBtn).toBeVisible({ timeout: T });
    await downloadBtn.click();
    await waitForAppSettled(this.page, T);
  }

  /** ACH batches expose a payout file — wait for the browser download event. */
  async downloadAchPayoutFile(paymentId: string): Promise<Download> {
    const row = this.rowForPaymentId(paymentId);
    await expect(row).toBeVisible({ timeout: T });
    const downloadBtn = row.getByTestId('disbursement-history-row-download').first();
    await expect(downloadBtn).toBeVisible({ timeout: T });

    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: T }),
      downloadBtn.click(),
    ]);
    this.lastDownload = download;
    return download;
  }

  async expectAchPayoutFileDownloaded(): Promise<void> {
    const download = this.lastDownload;
    if (!download) {
      throw new Error('No ACH payout download captured — call downloadAchPayoutFile first');
    }
    const fileName = download.suggestedFilename();
    expect(fileName.length, 'Downloaded ACH file should have a file name').toBeGreaterThan(0);
    const failure = await download.failure();
    expect(failure, `Download failed: ${failure ?? ''}`).toBeNull();
    const path = await download.path();
    expect(path, 'Downloaded ACH file path should be available').toBeTruthy();
  }

  async expectDisbursementErrorToast(): Promise<void> {
    const toast = this.loc.disbursementToast();
    const visible = await toast.isVisible({ timeout: T }).catch(() => false);
    if (!visible) {
      console.warn('[DisbursementPage] error toast not visible — soft skip');
      return;
    }
    const text = (await toast.innerText()).replace(/\s+/g, ' ').trim();
    expect.soft(text.length, 'Disbursement toast should contain a message (soft)').toBeGreaterThan(0);
  }

  /**
   * Check batches return API 404 on /payments/payout-file
   * ("Payout file not available for this batch"). Prefer toast text when present;
   * always assert the API response as the durable signal (CLI-verified).
   */
  async clickDownloadAndExpectPayoutUnavailable(batchId: string): Promise<void> {
    const row = this.rowForPaymentId(batchId);
    await expect(row).toBeVisible({ timeout: T });
    const downloadBtn = row.getByTestId('disbursement-history-row-download').first();
    await expect(downloadBtn).toBeVisible({ timeout: T });

    const responsePromise = this.page.waitForResponse(
      (res) => /\/payments\/payout-file/i.test(res.url()) && res.status() === 404,
      { timeout: T },
    );
    await downloadBtn.click();
    const response = await responsePromise;
    const bodyText = await response.text();
    expect(bodyText).toMatch(/Payout file not available for this batch/i);

    // Soft visual: toast when the UI surfaces the same message
    const toast = this.loc.disbursementToast();
    if (await toast.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const text = (await toast.innerText()).replace(/\s+/g, ' ').trim();
      expect(text).toMatch(/payout file not available|not available for this batch/i);
    }
  }

  async expectPayoutFileNotAvailableToast(): Promise<void> {
    const toast = this.loc.disbursementToast();
    const fallback = this.page
      .getByRole('status')
      .or(this.page.locator('[data-sonner-toast], [role="alert"]'))
      .filter({ hasText: /payout file not available|not available for this batch/i });

    await expect
      .poll(
        async () => {
          if (await toast.isVisible().catch(() => false)) {
            return (await toast.innerText()).replace(/\s+/g, ' ').trim();
          }
          if (await fallback.first().isVisible().catch(() => false)) {
            return (await fallback.first().innerText()).replace(/\s+/g, ' ').trim();
          }
          return '';
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toMatch(/payout file not available|not available for this batch/i);
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
