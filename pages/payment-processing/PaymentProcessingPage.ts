import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { waitForAppSettled, waitForToastDismissed } from '../../utils/pageLoader';
import { smokeStaticWaitMs, smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;
const STATIC_WAIT = smokeStaticWaitMs;

export class PaymentProcessingPage {
  protected readonly sidebar: IcmSidebarPage;
  protected capturedBatchId = '';

  readonly loc = {
    headingProcessSummary: () => this.page.getByRole('heading', { name: /process summary/i }),
    createPaymentButton: () =>
      this.page
        .getByTestId('create-payment-button')
        .or(this.page.getByRole('button', { name: /create payment/i })),
    confirmPaymentBatchButton: () => this.page.getByTestId('create-payment-modal-save'),
    batchIdDisplay: () => this.page.getByText(/\bPAY-[A-Z0-9-]+\b/i).first(),
    authorizePaymentButton: () => this.page.getByRole('button', { name: /authorize payment/i }),
    authorizePaymentConfirm: () => this.page.getByTestId('authorize-payment-confirm'),
    headingDisbursementHistory: () => this.page.getByRole('heading', { name: /disbursement history/i }),
    finalizedSettlementChip: () => this.page.getByText(/finalized settlement/i).first(),
    selectAllCheckbox: () =>
      this.page
        .getByTestId('header-select-all-checkbox')
        .or(this.page.getByTestId('select-all-checkbox'))
        .or(this.page.getByRole('checkbox', { name: /select all/i })),
    searchInput: () =>
      this.page
        .getByTestId('payables-search-filename')
        .or(this.page.getByTestId('payables-search-file-id'))
        .or(this.page.getByPlaceholder(/search.*file name|file name|filename/i))
        .or(this.page.getByRole('textbox', { name: /file name|filename|search/i })),
    rightSidebar: () =>
      this.page
        .getByTestId('payables-right-sidebar')
        .or(this.page.getByTestId('process-summary-container'))
        .or(this.page.locator('aside, [data-testid*="sidebar"]').filter({ hasText: /process summary/i })),
    grid: () => this.page.getByRole('grid', { name: 'Data grid' }),
    toast: () =>
      this.page
        .getByRole('status')
        .or(this.page.locator('[data-sonner-toast], [role="alert"], [class*="toast"]'))
        .filter({ hasText: /.+/i }),
  };

  constructor(protected readonly page: Page) {
    this.sidebar = new IcmSidebarPage(page);
  }

  async openPayables() {
    await this.sidebar.waitForSidebar();
    if (!AppUrlPatterns.paymentPayables.test(this.page.url())) {
      const payables = this.page.getByTestId('sidebar-nav-title-payable-line-items');
      if (await payables.isVisible().catch(() => false)) {
        await payables.click({ noWaitAfter: true });
      } else {
        await this.page.goto('/payment-processing/payable-line-items', {
          waitUntil: 'domcontentloaded',
          timeout: T,
        });
      }
    }
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentPayables, { timeout: T });
    await waitForAppSettled(this.page, T * 2);
  }

  async searchByValue(value: string) {
    const search = this.loc.searchInput();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill(value);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(STATIC_WAIT);
    await waitForAppSettled(this.page, T);
  }

  async searchByFileName(fileName: string) {
    await this.searchByValue(fileName);
  }

  async searchByFileId(fileId: string) {
    await this.searchByValue(fileId);
  }

  async selectAllRecords() {
    const selectAll = this.loc.selectAllCheckbox();
    if (await selectAll.isVisible().catch(() => false)) {
      await selectAll.click();
    } else {
      const rows = this.loc
        .grid()
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') });
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const rowCheckbox = rows.nth(i).getByRole('checkbox').first();
        if (await rowCheckbox.isVisible().catch(() => false)) {
          await rowCheckbox.check({ force: true });
        }
      }
    }
    await waitForAppSettled(this.page, T);
  }

  async assertProcessSummary(expectedEarning: string) {
    const sidebar = this.loc.rightSidebar();
    await expect(sidebar).toBeVisible({ timeout: T });
    await expect(this.loc.headingProcessSummary()).toBeVisible({ timeout: T });
    const earning = expectedEarning.replace(/,/g, '');
    await expect(sidebar).toContainText(new RegExp(escapeRegex(earning), 'i'), { timeout: T });
  }

  async assertCreatePaymentEnabled() {
    await expect(this.loc.createPaymentButton()).toBeEnabled({ timeout: T });
  }

  async clickCreatePayment() {
    const createPaymentButton = this.loc.createPaymentButton();
    await expect(createPaymentButton).toBeVisible({ timeout: T });
    if (!(await createPaymentButton.isEnabled())) {
      await this.selectAllRecords();
    }
    await expect(createPaymentButton).toBeEnabled({ timeout: T });
    await createPaymentButton.click();
    await waitForAppSettled(this.page, T);
  }

  async confirmPaymentBatch() {
    const confirm = this.loc.confirmPaymentBatchButton();
    await expect(confirm).toBeVisible({ timeout: T });
    await confirm.click();
    await waitForAppSettled(this.page, T);
  }

  async expectPayablesConsumed() {
    await expect(this.page.getByText('No Records Found')).toBeVisible({ timeout: T });
  }

  async openApproval() {
    await this.sidebar.waitForSidebar();
    await this.sidebar.clickPaymentProcessingSubNav(/^Approval$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentApproval, { timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async openFirstRecordContaining(text: string) {
    const row = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(text), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async captureBatchId(): Promise<string> {
    const batch = this.loc.batchIdDisplay();
    await expect(batch).toBeVisible({ timeout: T });
    const text = (await batch.innerText()).trim();
    const match = text.match(/\b(PAY-[A-Z0-9-]+)\b/i);
    if (!match?.[1]) {
      throw new Error(`Batch id not found in display text: "${text}"`);
    }
    this.capturedBatchId = match[1];
    return this.capturedBatchId;
  }

  async clickAuthorizePayment() {
    const authorize = this.loc.authorizePaymentButton();
    await expect(authorize).toBeVisible({ timeout: T });
    await expect(authorize).toBeEnabled({ timeout: T });
    await authorize.click();
    await waitForAppSettled(this.page, T);
  }

  async confirmAuthorization() {
    const confirm = this.loc.authorizePaymentConfirm();
    try {
      await expect(confirm).toBeVisible({ timeout: T });
      await confirm.click();
      await waitForToastDismissed(this.page, this.loc.toast());
    } catch {
      // Confirmation dialog already dismissed by the app — nothing to confirm.
    }
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentApproval, { timeout: T });
  }

  async openHistory() {
    await this.sidebar.waitForSidebar();
    await this.sidebar.clickPaymentProcessingSubNav(/^History$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentHistory, { timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async assertDisbursementHistoryTitle() {
    await expect(this.loc.headingDisbursementHistory()).toBeVisible({ timeout: T });
  }

  async openRecordForAgent(agentName: string) {
    const row = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(agentName), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async openRecordByBatchId() {
    if (!this.capturedBatchId) {
      throw new Error('No captured batch id. Capture the batch id from the approval details page first.');
    }
    const row = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(this.capturedBatchId), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .first();
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async assertFinalizedSettlementChipVisible() {
    await expect(this.loc.finalizedSettlementChip()).toBeVisible({ timeout: T });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
