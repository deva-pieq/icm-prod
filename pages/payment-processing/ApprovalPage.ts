import { createHash } from 'node:crypto';
import { expect, type Download, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { IcmSidebarPage } from '../sidebar/IcmSidebarPage';
import { ensurePageReady, waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { GridPage } from '../shared/GridPage';
import { parseAmount, parseAmountNumber } from '../../utils/payment-module/parseAmount';

const T = smokeStepTimeoutMs;

export class ApprovalPage extends GridPage {
  private readonly sidebar: IcmSidebarPage;
  private lastAchDownload: Download | null = null;
  private lastAchFingerprint: string | null = null;
  private lastAchFileName: string | null = null;

  readonly loc = {
    pageRoot: () => this.page.getByTestId('pending-authorization-page'),
    datagrid: () => this.page.getByTestId('pending-authorization-datagrid'),
    heading: () => this.page.getByRole('heading', { name: /payment batches/i }),
    detailsPage: () => this.page.getByTestId('payout-batch-details-page'),
    authorizePaymentButton: () =>
      this.page
        .getByTestId('payout-batch-authorize-button')
        .or(this.page.getByRole('button', { name: /authorize payment/i })),
    authorizePaymentConfirm: () => this.page.getByTestId('authorize-payment-confirm'),
    paymentMethodTab: (method: string) =>
      this.page.getByTestId(`payout-batch-payment-method-tabs-tab-${method}`),
    /** Live UI labels are `Check (1)` / `ACH (0)` (role=button), not plain tab names. */
    paymentMethodTabByLabel: (method: 'Check' | 'ACH') =>
      this.page.getByRole('button', { name: new RegExp(`^${method}\\s*\\(\\d+\\)`, 'i') }),
    batchTitle: () => this.page.getByTestId('batch-title'),
    netDisbursementValue: () =>
      this.page
        .locator("//span[text()='Net Disbursement']//following-sibling::span")
        .or(
          this.page
            .getByTestId('payout-batch-summary-container')
            .getByText(/Net Disbursement/i)
            .locator('xpath=following-sibling::*[1]'),
        )
        .first(),
    payoutBatchSummary: () => this.page.getByTestId('payout-batch-summary-container'),
    /** Live label: "Generate and Download ACH". */
    generateAndDownloadAchButton: () =>
      this.page
        .getByTestId('payout-batch-generate-download-ach-button')
        .or(this.page.getByRole('button', { name: /Generate and Download ACH/i })),
    /** Live label: "Last Generated: MM/DD/YYYY HH:mm:ss". */
    lastGeneratedAt: () => this.page.getByTestId('payout-batch-last-generated-at'),
    editTransactionButton: () =>
      this.page
        .getByTestId('payout-batch-edit-transaction-button')
        .or(this.page.getByRole('button', { name: /Edit Transaction/i })),
    agentActionsKebab: () => this.page.locator('[data-testid^="payout-batch-agent-actions-"]'),
    removeAgentMenuItem: () => this.page.getByRole('button', { name: /^Remove( Agent)?$/i }),
    removeAgentConfirmModal: () => this.page.getByTestId('remove-agent-confirm-modal'),
    removeAgentConfirmSave: () =>
      this.page.getByTestId('remove-agent-confirm-modal').getByRole('button', {
        name: /^(Ok|OK|Confirm|Yes|Remove)$/i,
      }),
    detailsDatagrid: () => this.page.getByTestId('payout-batch-details-datagrid'),
  };

  constructor(page: Page) {
    super(page);
    this.sidebar = new IcmSidebarPage(page);
  }

  async open() {
    await this.sidebar.waitForSidebar();
    // Detail keeps the pending-authorization URL — sidebar Approval alone will not show the list.
    // batch-title holds PAY-* while a batch is open; leave it before expecting Payment Batches.
    if (await this.loc.batchTitle().isVisible().catch(() => false)) {
      await this.leaveBatchDetail();
    }
    await this.sidebar.clickPaymentProcessingSubNav(/^Approval$/i);
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentApproval);
    await ensurePageReady(this.page, this.loc.heading(), { timeout: smokeStepTimeoutMs });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
  }

  /**
   * Leave open batch detail (batch-title = PAY-*) back to the Payment Batches list.
   * Prefer the icon button beside batch-title — it is often unlabeled (not name "Back").
   */
  async leaveBatchDetail(): Promise<void> {
    const title = this.loc.batchTitle();
    if (!(await title.isVisible().catch(() => false))) return;

    const back = this.page
      .getByTestId('back-button')
      .or(title.locator('xpath=preceding-sibling::button[1]'))
      .or(title.locator('xpath=ancestor::div[1]//button[1]'))
      .or(this.page.getByRole('button', { name: /^back$/i }));

    if (await back.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await back.first().click();
    } else {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    }
    await waitForAppSettled(this.page, T);
    await expect(title).toBeHidden({ timeout: T });
  }

  async expectPaymentBatchesHeading(): Promise<void> {
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
  }

  /** Smoke-only: Payment Batches heading + page root + grid + search. */
  async smokeExpectHeader(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentApproval, { timeout: T });
    await expect(this.loc.heading()).toBeVisible({ timeout: T });
    await expect(this.loc.pageRoot()).toBeVisible({ timeout: T });
    await expect(this.loc.datagrid()).toBeVisible({ timeout: T });
    await expect(this.page.getByTestId('data-grid-search-input')).toBeVisible({ timeout: T });
  }

  /**
   * Smoke helper: open first approval batch and check Authorize is present.
   * Skips the authorize assert when Approval has no pending batches (env-dependent).
   */
  async openRecordAndAuthorize() {
    if (!AppUrlPatterns.paymentApproval.test(this.page.url())) {
      await this.open();
    }
    const opened = await super.openFirstGridRow();
    if (!opened) return;
    await expect(this.loc.authorizePaymentButton()).toBeVisible({ timeout: T });
  }

  async clickAuthorizePayment() {
    const authorize = this.loc.authorizePaymentButton();
    await expect(authorize).toBeVisible({ timeout: smokeStepTimeoutMs });
    await expect(authorize).toBeEnabled({ timeout: smokeStepTimeoutMs });
    await authorize.click();
    await waitForAppSettled(this.page);
  }

  async confirmAuthorization() {
    const confirm = this.loc.authorizePaymentConfirm();
    try {
      await expect(confirm).toBeVisible({ timeout: smokeStepTimeoutMs });
      await confirm.click();
    } catch {
      // Confirmation dialog already dismissed by the app — nothing to confirm.
    }
    await waitForAppSettled(this.page);
  }

  /**
   * Open the approval batch whose Net Disbursement matches `amountText`.
   * Captured amounts are normalized (no `$`/commas), while the grid shows `$1,234.56`
   * — match numerically so formatting cannot miss the row.
   *
   * Optional `paymentMethod` (Check / ACH) skips same-amount batches for the other
   * method (CHK agent 600002 vs ACH 600001 often share identical Net Settlement).
   * Tab labels look like `Check (1)` / `ACH (0)` on the batch detail.
   */
  async openRecordContaining(
    amountText: string,
    options?: { agentId?: string; paymentMethod?: 'Check' | 'ACH' },
  ) {
    const target = parseAmountNumber(amountText);
    const agentNeedle = options?.agentId?.trim();
    const paymentMethod = options?.paymentMethod;

    const collectCandidates = async (): Promise<number[]> => {
      const rows = this.grid()
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') });
      await expect
        .poll(async () => rows.count(), { timeout: T })
        .toBeGreaterThan(0);

      const count = await rows.count();
      const amountMatches: number[] = [];
      const agentMatches: number[] = [];
      for (let i = 0; i < count; i++) {
        const text = (await rows.nth(i).innerText()).replace(/\s+/g, ' ').trim();
        const amounts = text.match(/\$[\d,]+(?:\.\d{2})?/g) ?? [];
        if (!amounts.some((a) => Math.abs(parseAmountNumber(a) - target) < 0.005)) continue;
        amountMatches.push(i);
        if (agentNeedle && text.includes(agentNeedle)) agentMatches.push(i);
      }
      return agentMatches.length > 0 ? agentMatches : amountMatches;
    };

    const candidates = await collectCandidates();
    expect(
      candidates.length,
      `No approval batch row matched Net Settlement/Disbursement ≈ ${target}` +
        (agentNeedle ? ` (agent ${agentNeedle})` : '') +
        ` (from "${amountText}")`,
    ).toBeGreaterThan(0);

    const openCandidate = async (index: number): Promise<void> => {
      const rows = this.grid()
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') });
      await rows.nth(index).click();
      await waitForAppSettled(this.page, T);
      await expect(this.loc.batchTitle()).toBeVisible({ timeout: T });
    };

    if (!paymentMethod) {
      await openCandidate(candidates[0]!);
      return;
    }

    const tried = new Set<number>();
    for (let attempt = 0; attempt < candidates.length; attempt++) {
      const liveCandidates = attempt === 0 ? candidates : await collectCandidates();
      const index = liveCandidates.find((i) => !tried.has(i));
      if (index == null) break;
      tried.add(index);

      await openCandidate(index);
      if (await this.paymentMethodTabRecordCount(paymentMethod) > 0) {
        return;
      }

      // Wrong cycle batch (e.g. ACH when looking for Check) — leave detail via batch-title back.
      await this.leaveBatchDetail();
      await expect(this.loc.heading()).toBeVisible({ timeout: T });
      await waitForAppSettled(this.page, T);
    }

    throw new Error(
      `No approval batch matched amount ≈ ${target} with ${paymentMethod} records` +
        (agentNeedle ? ` for agent ${agentNeedle}` : ''),
    );
  }

  /** Parse `Check (1)` / `ACH (0)` tab label count on the open batch detail. */
  async paymentMethodTabRecordCount(method: 'Check' | 'ACH'): Promise<number> {
    const tabKey = method === 'ACH' ? 'ACH' : 'Check';
    const tab = this.loc
      .paymentMethodTabByLabel(method)
      .or(this.loc.paymentMethodTab(tabKey))
      .or(this.page.getByTestId(`payout-batch-payment-method-tabs-tab-${tabKey}`));
    await expect(tab.first()).toBeVisible({ timeout: T });
    const label = (await tab.first().innerText()).replace(/\s+/g, ' ').trim();
    const countMatch = label.match(/\((\d+)\)/);
    return countMatch ? Number.parseInt(countMatch[1], 10) : 0;
  }

  async captureNetDisbursementAmount(): Promise<string> {
    const el = this.loc.netDisbursementValue();
    await expect(el).toBeVisible({ timeout: T });
    const raw = (await el.innerText()).replace(/\s+/g, ' ').trim();
    const amount = parseAmount(raw);
    expect(amount.length, `Net Disbursement text was empty ("${raw}")`).toBeGreaterThan(0);
    return amount;
  }

  async expectNetDisbursementEquals(capturedNetSettlement: string): Promise<void> {
    const actual = await this.captureNetDisbursementAmount();
    expect(parseAmountNumber(actual)).toBeCloseTo(parseAmountNumber(capturedNetSettlement), 2);
  }

  async selectPaymentMethodTab(method: 'Check' | 'ACH'): Promise<void> {
    // Prefer live button labels (`Check (1)`); fall back to testid (lowercase) if present.
    const tabKey = method.toLowerCase();
    const tab = this.loc
      .paymentMethodTabByLabel(method)
      .or(this.loc.paymentMethodTab(tabKey))
      .or(this.loc.paymentMethodTab(method));
    await expect(tab.first()).toBeVisible({ timeout: T });
    await tab.first().click();
    await waitForAppSettled(this.page, T);
  }

  async selectAllPaymentMethodTab(): Promise<void> {
    const tab = this.page
      .getByTestId('payout-batch-payment-method-tabs-tab-all')
      .or(this.page.getByRole('button', { name: /^All\s*\(\d+\)/i }));
    if (!(await tab.first().isVisible().catch(() => false))) return;
    await tab.first().click();
    await waitForAppSettled(this.page, T);
  }

  async expectPaymentMethodTabHasRecords(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: 'Data grid' }).first();
    await expect(grid).toBeVisible({ timeout: T });
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    await expect.poll(async () => rows.count(), { timeout: T }).toBeGreaterThan(0);
  }

  /**
   * Capture PAY-* from batch title. When `paymentMethod` is set, refuse to capture
   * from a batch whose method tab is empty (prevents CHK storing an ACH payment id).
   */
  async captureBatchIdFromTitle(paymentMethod?: 'Check' | 'ACH'): Promise<string> {
    if (paymentMethod) {
      const count = await this.paymentMethodTabRecordCount(paymentMethod);
      expect(
        count,
        `Refusing to capture payment id: ${paymentMethod} tab has ${count} records on this batch`,
      ).toBeGreaterThan(0);
    }
    const title = this.loc.batchTitle();
    await expect(title).toBeVisible({ timeout: T });
    const text = (await title.innerText()).replace(/\s+/g, ' ').trim();
    const match = text.match(/\b(PAY-[A-Z0-9-]+)\b/i);
    if (!match?.[1]) {
      throw new Error(`Batch id not found in batch title: "${text}"`);
    }
    return match[1];
  }

  async expectGenerateAndDownloadAchVisible(): Promise<void> {
    await expect(this.loc.generateAndDownloadAchButton()).toBeVisible({ timeout: T });
    await expect(this.loc.generateAndDownloadAchButton()).toBeEnabled({ timeout: T });
  }

  async expectGenerateAndDownloadAchHidden(): Promise<void> {
    await expect(this.loc.generateAndDownloadAchButton()).toBeHidden({ timeout: T });
  }

  async expectPaymentMethodTabCount(method: 'Check' | 'ACH', expected: number): Promise<void> {
    const count = await this.paymentMethodTabRecordCount(method);
    expect(count, `${method} tab record count`).toBe(expected);
  }

  /** Click Generate and Download ACH and capture the browser download. */
  async generateAndDownloadAchFile(): Promise<Download> {
    const btn = this.loc.generateAndDownloadAchButton();
    await expect(btn).toBeVisible({ timeout: T });
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: T }),
      btn.click(),
    ]);
    this.lastAchDownload = download;
    this.lastAchFileName = download.suggestedFilename();
    const path = await download.path();
    if (path) {
      const fs = await import('node:fs/promises');
      const buf = await fs.readFile(path);
      this.lastAchFingerprint = createHash('sha256').update(buf).digest('hex');
    } else {
      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      if (stream) {
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      }
      this.lastAchFingerprint = createHash('sha256').update(Buffer.concat(chunks)).digest('hex');
    }
    await waitForAppSettled(this.page, T);
    return download;
  }

  async expectAchFileDownloadedFromApproval(): Promise<void> {
    const download = this.lastAchDownload;
    if (!download) {
      throw new Error('No ACH download captured — call generateAndDownloadAchFile first');
    }
    const fileName = download.suggestedFilename();
    expect(fileName.length, 'Downloaded ACH file should have a file name').toBeGreaterThan(0);
    expect(fileName, 'ACH file name should include PAY- id').toMatch(/PAY-/i);
    const failure = await download.failure();
    expect(failure, `Download failed: ${failure ?? ''}`).toBeNull();
    expect(this.lastAchFingerprint, 'ACH file fingerprint').toBeTruthy();
  }

  getLastAchFingerprint(): string {
    if (!this.lastAchFingerprint) {
      throw new Error('ACH fingerprint not available — download first');
    }
    return this.lastAchFingerprint;
  }

  getLastAchFileName(): string {
    if (!this.lastAchFileName) {
      throw new Error('ACH file name not available — download first');
    }
    return this.lastAchFileName;
  }

  async captureLastGeneratedTimestamp(): Promise<string> {
    const el = this.loc.lastGeneratedAt();
    await expect(el).toBeVisible({ timeout: T });
    const text = (await el.innerText()).replace(/\s+/g, ' ').trim();
    expect(text, 'Last Generated text').toMatch(/Last Generated:/i);
    expect(text, 'Last Generated should include a date/time').toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    return text;
  }

  async expectLastGeneratedTimestampUpdated(previous: string): Promise<void> {
    const el = this.loc.lastGeneratedAt();
    await expect
      .poll(async () => (await el.innerText()).replace(/\s+/g, ' ').trim(), { timeout: T })
      .not.toBe(previous);
    const current = (await el.innerText()).replace(/\s+/g, ' ').trim();
    expect(current).toMatch(/Last Generated:/i);
  }

  async expectLastGeneratedTimestampVisible(): Promise<void> {
    await expect(this.loc.lastGeneratedAt()).toBeVisible({ timeout: T });
    const text = (await this.loc.lastGeneratedAt().innerText()).replace(/\s+/g, ' ').trim();
    expect(text).toMatch(/Last Generated:/i);
  }

  async openEditTransaction(): Promise<void> {
    const btn = this.loc.editTransactionButton();
    await expect(btn).toBeVisible({ timeout: T });
    await btn.click();
    await this.page.waitForURL(/\/payment-processing\/payable-line-items\/edit\//i, {
      timeout: T,
    });
    await waitForAppSettled(this.page, T);
  }

  /** Open kebab on first agent row and click Remove Agent (confirm modal if shown). */
  async removeOneAgentViaKebab(): Promise<void> {
    const kebab = this.loc.agentActionsKebab().first();
    await expect(kebab).toBeVisible({ timeout: T });
    await kebab.click();
    const remove = this.loc.removeAgentMenuItem();
    await expect(remove).toBeVisible({ timeout: T });
    await remove.click();
    await this.confirmRemoveAgentIfNeeded();
    await waitForAppSettled(this.page, T);
  }

  /** Remove every agent currently listed on the open batch detail via kebab. */
  async removeAllAgentsViaKebab(): Promise<void> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const kebabs = this.loc.agentActionsKebab();
      const count = await kebabs.count();
      if (count === 0) break;
      // Scroll actions column into view before clicking (AG Grid pinned column may be off-screen).
      const grid = this.page.locator('.ag-body-viewport').first();
      if (await grid.isVisible().catch(() => false)) {
        await grid.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        await waitForAppSettled(this.page, 500);
      }
      await kebabs.first().click();
      const remove = this.loc.removeAgentMenuItem();
      if (!(await remove.isVisible({ timeout: 5_000 }).catch(() => false))) {
        await this.page.keyboard.press('Escape');
        await waitForAppSettled(this.page, 1_000);
        continue; // skip this agent, try next
      }
      await remove.click();
      await this.confirmRemoveAgentIfNeeded();
      await waitForAppSettled(this.page, T);
    }
  }

  private async confirmRemoveAgentIfNeeded(): Promise<void> {
    const modal = this.loc.removeAgentConfirmModal();
    if (!(await modal.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    const confirm = this.loc.removeAgentConfirmSave();
    await expect(confirm).toBeVisible({ timeout: T });
    await confirm.click();
    await expect(modal).toBeHidden({ timeout: T });
  }

  async expectNoAgentsRemainingOnBatch(): Promise<void> {
    const grid = this.loc.detailsDatagrid().or(this.page.getByRole('grid', { name: 'Data grid' }).first());
    await expect(grid).toBeVisible({ timeout: T });
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    await expect.poll(async () => rows.count(), { timeout: T }).toBe(0);
    const allBtn = this.page.getByRole('button', { name: /^All\s*\(\d+\)/i });
    if (await allBtn.isVisible().catch(() => false)) {
      const label = (await allBtn.innerText()).replace(/\s+/g, ' ').trim();
      const m = label.match(/\((\d+)\)/);
      expect(m ? Number.parseInt(m[1], 10) : -1, `All tab should be (0) after removing agents`).toBe(0);
    }
  }

  /** After removing every agent, the app destroys the batch and returns to the Approval list. */
  async expectRedirectedToApprovalListAfterBatchDestroyed(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.paymentApproval, { timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /payment batches/i }),
    ).toBeVisible({ timeout: T });
  }

  async searchApprovalByBatchId(batchId: string): Promise<void> {
    if (!AppUrlPatterns.paymentApproval.test(this.page.url()) || (await this.loc.batchTitle().isVisible().catch(() => false))) {
      await this.open();
    }
    const search = this.page
      .getByTestId('data-grid-search-input')
      .getByRole('textbox')
      .or(this.page.getByRole('textbox', { name: /search data grid/i }));
    await expect(search.first()).toBeVisible({ timeout: T });
    await search.first().fill(batchId);
    await this.page.keyboard.press('Enter');
    await waitForAppSettled(this.page, T);
  }

  async expectNoApprovalBatchListedForId(batchId: string): Promise<void> {
    const rows = this.grid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({ hasText: batchId });
    await expect.poll(async () => rows.count(), { timeout: T }).toBe(0);
  }

  async agentRowCountOnDetail(): Promise<number> {
    const grid = this.loc
      .detailsDatagrid()
      .or(this.page.getByRole('grid', { name: 'Data grid' }).first());
    const rows = grid
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') });
    return rows.count();
  }
}
