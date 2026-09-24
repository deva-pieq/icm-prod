import { expect, type Locator, type Page } from '@playwright/test';
import { HAPPY_FLOW_PAYMENT } from '../../test-data/happy-flow/happyFlow001';
import { getHappyFlowBatchId, getHappyFlowUploadState } from '../../utils/happy-flow/happyFlowContext';
import { getTransferContext } from '../../utils/transfer-agent/transferSheetContext';
import { PaymentProcessingPage } from './PaymentProcessingPage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export class TransferPaymentPage extends PaymentProcessingPage {
  constructor(page: Page) {
    super(page);
  }

  async searchByFileName(fileName?: string) {
    const targetFileName = fileName ?? resolveStoredFileName();
    await super.searchByFileName(targetFileName);
  }

  async searchByFileId(fileId?: string) {
    const id = fileId ?? resolveStoredFileId();
    await super.searchByFileId(id);
  }

  async clickAllRecordsContainingStoredFileId(): Promise<void> {
    const fileId = resolveStoredFileId();
    await expect(this.loc.grid()).toBeVisible({ timeout: T });

    const rows = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(fileId), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    expect(count, `No payables rows found for file id "${fileId}"`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const checkbox = row.getByRole('checkbox').first();
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.check();
      } else {
        await row.click();
      }
      await waitForAppSettled(this.page, T);
    }
  }

  async clickAllRecordsContainingUploadedFileName(fileName?: string): Promise<void> {
    const targetFileName = fileName ?? resolveStoredFileName();
    await expect(this.loc.grid()).toBeVisible({ timeout: T });

    const rows = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(targetFileName), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    expect(count, `No payables rows found for file name "${targetFileName}"`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const checkbox = row.getByRole('checkbox').first();
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.check();
      } else {
        await row.click();
      }
      await waitForAppSettled(this.page, T);
    }
  }

  async removeAgentsBelowThresholdIfRequired(): Promise<void> {
    const hint = this.page.getByText(new RegExp(escapeRegex(HAPPY_FLOW_PAYMENT.removeAgentsBelow), 'i'));
    if (!(await hint.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    const createPaymentButton = this.loc.createPaymentButton();
    if (await createPaymentButton.isEnabled().catch(() => false)) return;

    const removeButtons = this.page.getByRole('button', { name: 'Remove agent' });

    for (let i = 0; i < 20; i++) {
      if ((await removeButtons.count()) === 0) break;
      await removeButtons.first().click();
      await this.page.waitForTimeout(300);
      await waitForAppSettled(this.page, T);
      if (await createPaymentButton.isEnabled().catch(() => false)) break;
    }
  }

  async openRecordInitiatedTodayBy(name: string): Promise<void> {
    await expect(this.loc.grid()).toBeVisible({ timeout: T });
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();
    const datePatterns = [
      `${month}/${day}/${year}`,
      `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`,
      `${month}/${day}/${String(year).slice(-2)}`,
      today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    ];

    const rows = this.loc
      .grid()
      .getByRole('row')
      .filter({ hasText: new RegExp(escapeRegex(name), 'i') })
      .filter({ hasNot: this.page.getByRole('columnheader') });
    const count = await rows.count();
    expect(count, `No approval rows found for "${name}"`).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = (await row.innerText()).replace(/\s+/g, ' ');
      if (datePatterns.some((d) => text.includes(d))) {
        await row.click();
        await waitForAppSettled(this.page, T);
        return;
      }
    }

    await rows.first().click();
    await waitForAppSettled(this.page, T);
  }

  async expectPageTitleContainsBatchId(batchId?: string): Promise<void> {
    const id = batchId ?? getHappyFlowBatchId();
    const heading = this.page.getByTestId('payout-batch-summary-container').getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: T });
    await expect(heading).toContainText(id, { timeout: T });
  }

  async openRecordForCapturedBatchId(): Promise<void> {
    const id = getHappyFlowBatchId();
    await this.openFirstRecordContaining(id);
  }

}

function resolveStoredFileId(): string {
  try {
    return getTransferContext().fileId;
  } catch {
    return getHappyFlowUploadState().fileId;
  }
}

function resolveStoredFileName(): string {
  const transferName = safeTransferFileName();
  if (transferName) return transferName;
  return getHappyFlowUploadState().fileName;
}

function safeTransferFileName(): string | null {
  try {
    return getTransferContext().fileName;
  } catch {
    return null;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
