import { expect, type Locator, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { debugLogFileIdCaptured } from '../../utils/debugSteps';
import { waitForAppSettled, waitForToastDismissed } from '../../utils/pageLoader';
import { GridPage } from '../shared/GridPage';
import { CommissionDetailsAssertions } from './CommissionDetailsAssertions';
import { escapeRegex } from '../../utils/escapeRegex';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export type CommissionSplitHierarchyLine = {
  agency: string;
  salesLeader: string;
  agent: string;
  level: string;
  product: string;
};

export type CommissionReportRow = {
  agentName: string;
  commissionAmount: number;
};

export type CommissionReportCapture = {
  grossCommission: number;
  rows: CommissionReportRow[];
  lastRowCommissionAmount: number;
  totalCommissionAmount: number;
};

export type ReconciliationCommissionCapture = {
  grossCompensation: number;
  agentCommission: number;
  agentLevel: string;
};

export type ReconciliationCaptureResult =
  | { ok: true; data: ReconciliationCommissionCapture }
  | { ok: false; reason: string };

function parseMoney(value: string): number {
  const n = Number.parseFloat(value.replace(/[$,]/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function normalizeAgentLevelLabel(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  const lvlMatch = trimmed.match(/\bLVL\s*(\d+)\b/i);
  if (lvlMatch) {
    const roman = ['', 'I', 'II', 'III', 'IV', 'V'][Number.parseInt(lvlMatch[1], 10)] ?? lvlMatch[1];
    return `Level ${roman}`;
  }
  const levelMatch = trimmed.match(/\bLevel\s+(I{1,3}|IV|V|\d+)\b/i);
  if (levelMatch) {
    return `Level ${levelMatch[1].toUpperCase()}`;
  }
  return trimmed;
}

function parsePercent(text: string, label: string): string {
  const pattern = new RegExp(`${label}\\s*:?\\s*([\\d.]+%?)`, 'i');
  return text.match(pattern)?.[1]?.trim() ?? '';
}

function parseSplitCardText(text: string): CommissionSplitHierarchyLine {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const level =
    normalized.match(/Level\s*:?\s*(LVL\s*\d+|Level\s*[IVXLC]+|\d+)/i)?.[1]?.trim() ?? '';
  const product =
    normalized.match(/Product\s*:?\s*([^|\n]+?)(?:\s{2,}|$)/i)?.[1]?.trim() ??
    normalized.match(/Matched Policy Details.*?Product\s*:?\s*([^|\n]+)/i)?.[1]?.trim() ??
    '';

  return {
    agency: parsePercent(normalized, 'Agency'),
    salesLeader: parsePercent(normalized, 'Sales\\s*Leader'),
    agent: parsePercent(normalized, 'Agent'),
    level,
    product,
  };
}

export class CommissionDetailsPage extends GridPage {
  readonly assertions: CommissionDetailsAssertions;

  readonly loc = {
    heading: (name = 'Commission Details') =>
      this.page.getByRole('heading', { name, exact: true }),
    splitCard: () =>
      this.page
        .getByTestId('commission-split-card')
        .or(this.page.locator('[data-testid*="split-card"], [class*="split-card"]')),
    pageSubtitle: () =>
      this.page
        .getByRole('heading', { name: 'Commission Details' })
        .locator('xpath=following-sibling::p[1]'),
    reconcileWarningIcon: () =>
      this.page
        .locator("//div[@col-id='warning']")
        .locator('.lucide.lucide-triangle-alert'),
    transferringAgentSelect: () =>
      this.page
        .getByTestId('transfer-agent-select')
        .or(this.page.getByTestId('transferring-agent-select'))
        .or(this.page.getByRole('combobox', { name: /transferring agent/i }))
        .or(this.page.getByLabel(/transferring agent/i)),
    rationaleTextbox: () =>
      this.page
        .getByTestId('transfer-rationale')
        .or(this.page.getByRole('textbox', { name: /rationale/i })),
    reconcileButton: () =>
      this.page
        .getByTestId('reconcile-button')
        .or(this.page.getByRole('button', { name: /^reconcile$/i })),
    toast: () =>
      this.page
        .getByRole('status')
        .or(this.page.locator('[data-sonner-toast], [role="alert"], [class*="toast"]'))
        .filter({ hasText: /.+/i }),
    commissionSplitHierarchyTab: () =>
      this.page
        .getByRole('tab', { name: /commission split hierarchy/i })
        .or(this.page.getByRole('button', { name: /commission split hierarchy/i })),
    matchedPolicyDetailsToggle: () =>
      this.page.getByRole('button', { name: /matched policy details/i }),
    splitCards: () =>
      this.page
        .getByTestId('commission-split-card')
        .or(this.page.locator('[data-testid*="split-card"], [class*="split-card"]')),
    commissionSplitHierarchyTable: () =>
      this.page.locator(
        'xpath=//table[.//tr[./th[contains(translate(normalize-space(.), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "agency")] or ./td[contains(translate(normalize-space(.), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "agency")]]]',
      ),
    commissionSplitHierarchyGrid: () =>
      this.page
        .getByRole('button', { name: /commission split hierarchy/i })
        .locator('xpath=following::*[@role="tabpanel"][1]//div[@role="grid"]')
        .first(),
    commissionDetailsActionsButton: (rowIndex = 0) =>
      this.grid()
        .getByRole('row')
        .filter({ hasNot: this.page.getByRole('columnheader') })
        .filter({ hasText: /POLICY|Agent Level|Level\s+(I{1,3}|IV|V)/i })
        .nth(rowIndex)
        .locator('[data-testid^="commission-details-actions-"]')
        .first(),
    viewCommissionSplitMenuItem: () =>
      this.page.getByRole('button', { name: /view commission split/i }),
    commissionReportModal: () => this.page.getByTestId('commission-report-modal'),
    commissionReportCloseButton: () =>
      this.page
        .getByTestId('commission-report-modal')
        .getByRole('button', { name: /close|cancel|done|x/i })
        .first(),
  };

  constructor(page: Page) {
    super(page);
    this.assertions = new CommissionDetailsAssertions(this);
  }

  async openFromRow(row: Locator, fileId?: string): Promise<void> {
    await this.openRowLink(row, '/commission-processing/', fileId);
    await this.expectOnDetailsPage();
    debugLogFileIdCaptured(this.getFileIdFromUrl(), 'details-url');
  }

  async openFromRowOnUrl(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.expectOnDetailsPage();
  }

  async expectOnDetailsPage(): Promise<void> {
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionDetails, { timeout: T });
    await expect(
      this.page.getByRole('heading', { name: /^Commission\s+(?:Details|Reconciliation)$/i }),
    ).toBeVisible({ timeout: T });
  }

  getFileIdFromUrl(): string {
    const urlId = this.page
      .url()
      .match(/\/commission-(?:details|reconciliation)\/([^/?#]+)/i)?.[1];
    return urlId ? decodeURIComponent(urlId) : '';
  }

  async getSplitCardText(): Promise<string> {
    const splitCard = this.loc.splitCard();
    await expect(splitCard).toBeVisible({ timeout: T });
    return (await splitCard.innerText()).replace(/\s+/g, ' ').trim();
  }

  async parseAgentCommissionAmount(): Promise<string> {
    const cardText = await this.getSplitCardText();
    const match = cardText.match(/Agent\s*\$\s*([\d,]+\.?\d*)/i);
    if (!match?.[1]) {
      throw new Error(`Could not parse Agent $ from split card: ${cardText.slice(0, 200)}`);
    }
    return match[1].replace(/,/g, '');
  }

  async hoverReconcileWarningOnGrid(index = 0): Promise<string> {
    const icon = this.loc.reconcileWarningIcon().nth(index);
    await expect(icon).toBeVisible({ timeout: T });
    await icon.hover();
    await this.page.waitForTimeout(500);
    const tooltip = this.page
      .getByRole('tooltip')
      .or(this.page.locator('[data-radix-popper-content-wrapper], [role="tooltip"]'))
      .first();
    await expect(tooltip).toBeVisible({ timeout: T });
    return (await tooltip.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Assert reconcile/warning icon presence on the details grid row for a transaction type
   * (NB / RN / RC). RC also matches rows labeled Chargeback.
   *
   * Warning cells often live in the pinned-left container; transaction type is in
   * center cols. Match by row-id across both so icons are not missed.
   */
  async expectWarningIconForTransactionType(
    transactionType: string,
    expectPresent: boolean,
  ): Promise<void> {
    await this.expectOnDetailsPage();
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: T });
    const typePattern = new RegExp(`^\\s*${escapeRegex(transactionType)}\\s*$`, 'i');
    const isRc = /^RC$/i.test(transactionType);

    await expect
      .poll(
        async () => {
          const rows = grid.locator('.ag-center-cols-container [role="row"][row-id]');
          const count = await rows.count();
          for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const typeText = (
              await row
                .locator('.ag-cell[col-id="transactionType"]')
                .innerText()
                .catch(() => '')
            )
              .replace(/\s+/g, ' ')
              .trim();
            const rowText = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ');
            const matchesType =
              typePattern.test(typeText) ||
              (isRc && (/\bRC\b/i.test(typeText) || /\bchargeback\b/i.test(rowText)));
            if (!matchesType) continue;

            const rowId = await row.getAttribute('row-id');
            if (!rowId) return 'absent';

            // Icons live in pinned-left col-id="warning"; type cell is center.
            // Scope by row-id so RN/RC icons do not falsely mark NB as present.
            const hasWarning =
              (await grid
                .locator(`[role="row"][row-id="${rowId}"]`)
                .locator(`[col-id="warning"] .lucide.lucide-triangle-alert`)
                .count()) > 0;
            return hasWarning ? 'present' : 'absent';
          }
          return 'missing-row';
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBe(expectPresent ? 'present' : 'absent');
  }

  private async clickWarningRecord(index: number): Promise<void> {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: T });
    const icons = this.loc.reconcileWarningIcon();
    const count = await icons.count();
    expect(count).toBeGreaterThan(index);
    const rowId = await icons
      .nth(index)
      .evaluate((el) => el.closest('[role="row"]')?.getAttribute('row-id'));
    const row = grid.locator(`.ag-center-cols-container [role="row"][row-id="${rowId}"]`);
    await expect(row).toBeVisible({ timeout: T });
    await row.click();
    await waitForAppSettled(this.page, T);
  }

  async clickRecordWithPolicyTransfer(): Promise<void> {
    await this.clickWarningRecord(0);
  }

  async clickNextRecordWithStatus(_status: string): Promise<void> {
    const count = await this.loc.reconcileWarningIcon().count();
    await this.clickWarningRecord(count > 1 ? 1 : 0);
  }

  async reconcileNextRecord(status: string, agentName: string): Promise<void> {
    await this.clickNextRecordWithStatus(status);
    const select = this.loc.transferringAgentSelect();
    const grid = this.grid();
    await expect
      .poll(
        async () => {
          const onForm = await select.isVisible().catch(() => false);
          const onGrid = await grid.isVisible().catch(() => false);
          return onForm ? 'form' : onGrid ? 'grid' : 'transition';
        },
        { timeout: 20_000, intervals: [500, 1_000] },
      )
      .not.toBe('transition');
    const formVisible = await select.isVisible().catch(() => false);
    if (formVisible) {
      await this.selectTransferringAgent(agentName);
      await this.enterRationale('Testing...');
      await this.clickReconcile();
    }
    await expect(grid).toBeVisible({ timeout: T });
  }

  async selectTransferringAgent(name: string): Promise<void> {
    const select = this.loc.transferringAgentSelect();
    await expect(select).toBeVisible({ timeout: T });
    const trigger = select.locator('button').first();
    await expect(trigger).toBeVisible({ timeout: T });
    await expect(trigger).toBeEnabled({ timeout: T });

    const listbox = this.page
      .getByTestId('transfer-agent-select-listbox')
      .or(this.page.locator('[data-testid*="select-listbox"], [role="listbox"]').first());
    const option = listbox
      .getByRole('option', { name: new RegExp(escapeRegex(name), 'i') })
      .or(listbox.getByText(name, { exact: false }))
      .or(this.page.getByRole('option', { name: new RegExp(escapeRegex(name), 'i') }))
      .first();

    for (let attempt = 0; attempt < 3; attempt++) {
      const isOpen = await listbox.isVisible().catch(() => false);
      if (!isOpen) {
        await trigger.click();
        await this.page.waitForTimeout(400);
      }
      try {
        await expect(option).toBeVisible({ timeout: 10_000 });
        await option.click();
        await waitForAppSettled(this.page, T);
        return;
      } catch {
        await this.page.keyboard.press('Escape').catch(() => undefined);
      }
    }
    throw new Error(
      `Could not select transferring agent "${name}" — dropdown never showed a matching option`,
    );
  }

  /** Open Policy Transfer agent dropdown and assert an agent label is listed (does not select). */
  async expectTransferringAgentListed(name: string): Promise<void> {
    const select = this.loc.transferringAgentSelect();
    await expect(select).toBeVisible({ timeout: T });
    const trigger = select.locator('button').first();
    await expect(trigger).toBeEnabled({ timeout: T });
    const listbox = this.page
      .getByTestId('transfer-agent-select-listbox')
      .or(this.page.locator('[data-testid*="select-listbox"], [role="listbox"]').first());
    if (!(await listbox.isVisible().catch(() => false))) {
      await trigger.click();
      await this.page.waitForTimeout(400);
    }
    const option = listbox
      .getByRole('option', { name: new RegExp(escapeRegex(name), 'i') })
      .or(listbox.getByText(name, { exact: false }))
      .or(this.page.getByRole('option', { name: new RegExp(escapeRegex(name), 'i') }))
      .first();
    await expect(option).toBeVisible({ timeout: T });
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }

  async enterRationale(text: string): Promise<void> {
    await this.loc.rationaleTextbox().fill(text);
  }

  async clickReconcile(): Promise<void> {
    await this.loc.reconcileButton().click();
    await waitForToastDismissed(this.page, this.loc.toast());
    await waitForAppSettled(this.page, T);
  }

  async getPageSubtitleText(): Promise<string> {
    const subtitle = this.loc.pageSubtitle();
    if (await subtitle.isVisible().catch(() => false)) {
      return (await subtitle.innerText()).replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  async clickFirstGridRecord(): Promise<void> {
    await this.openGridRecordAt(0);
  }

  async openGridRecordAt(index: number): Promise<boolean> {
    await this.scrollGridToRow(index);
    await this.scrollRowIntoViewViaDom(index);
    const row = this.agRowByDataIndex(index);
    await expect(row, `Commission details row ${index + 1} not visible after scroll`).toBeVisible({
      timeout: 30_000,
    });
    await row.click({ force: true });
    const lock = this.page.getByTestId('review-lock-modal-acquire');
    if (await lock.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await lock.click();
    }
    await waitForAppSettled(this.page, 15_000).catch(() => {});
    await this.page.waitForTimeout(500);
    return true;
  }

  async readGridRowText(rowIndex: number, totalRows?: number): Promise<string> {
    try {
      if (totalRows !== undefined && rowIndex >= totalRows - 6) {
        await this.scrollGridFromBottom(rowIndex, totalRows);
      } else {
        await this.scrollGridToRow(rowIndex);
      }
    } catch {
      await this.scrollRowIntoViewViaDom(rowIndex).catch(() => {});
    }

    const row = this.agRowByDataIndex(rowIndex);
    if (!(await row.isVisible().catch(() => false))) return '';
    return (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  }

  isNonCommissionGridRow(rowText: string): boolean {
    if (!rowText) return false;
    if (/\bchargeback\b/i.test(rowText)) return true;
    if (/earning\s*type\s*:?\s*chargeback/i.test(rowText)) return true;
    if (/COMMISSION\s*\$0(?:\.00)?\b/i.test(rowText)) return true;
    return false;
  }

  async isCommissionDetailsListVisible(): Promise<boolean> {
    const footer = this.page.getByTestId('data-grid-record-count-footer');
    return footer.isVisible().catch(() => false);
  }

  commissionDetailsDataRows() {
    return this.grid()
      .getByRole('row')
      .filter({ hasNot: this.page.getByRole('columnheader') })
      .filter({
        hasText: /POLICY|Agent Level|Level\s+(I{1,3}|IV|V)|Commission|Chargeback|Earning/i,
      });
  }

  private async dataRowHasContent(row: Locator): Promise<boolean> {
    const text = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    return (
      text.length > 10 &&
      /POLICY|Agent Level|Level\s+(I{1,3}|IV|V)|Commission|Chargeback|Earning/i.test(text)
    );
  }

  async getCommissionDetailsRowCount(): Promise<number> {
    const footer = this.page.getByTestId('data-grid-record-count-footer');
    await expect(footer).toBeVisible({ timeout: T });
    const text = await footer.innerText();
    const match = text.match(/showing all (\d+) records/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private agRowByDataIndex(dataIndex: number): Locator {
    return this.grid()
      .locator(`.ag-center-cols-container .ag-row[row-index="${dataIndex}"]`)
      .first();
  }

  private async agRowIsRendered(dataIndex: number): Promise<boolean> {
    const row = this.agRowByDataIndex(dataIndex);
    if ((await row.count()) === 0) return false;
    if (!(await row.isVisible().catch(() => false))) return false;
    const text = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (text.length < 5) return false;
    const cells = await row.locator('[role="gridcell"], .ag-cell').count();
    if (cells === 0) return false;
    const nonEmptyCells = await row.evaluate((rowEl) => {
      const cells = rowEl.querySelectorAll('[role="gridcell"], .ag-cell');
      return [...cells].some(
        (c) =>
          c.getAttribute('col-id') !== 'warning' &&
          c.getAttribute('col-id') !== '__reconcile_warning__' &&
          (c.textContent ?? '').trim().length > 0,
      );
    });
    return nonEmptyCells;
  }

  private async centerAgRowInViewport(dataIndex: number): Promise<void> {
    const row = this.agRowByDataIndex(dataIndex);
    await row.scrollIntoViewIfNeeded();
    await row.evaluate((el) => {
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    });
    await this.page.waitForTimeout(150);
  }

  async getDataRowLocator(dataIndex: number): Promise<Locator> {
    await this.scrollGridToRow(dataIndex);
    const row = this.agRowByDataIndex(dataIndex);
    await expect(
      row,
      `Data row ${dataIndex + 1} is not rendered — scroll the grid first`,
    ).toBeVisible({ timeout: T });
    await this.centerAgRowInViewport(dataIndex);
    return row;
  }

  async captureEarningTypeFromGridRow(rowIndex: number): Promise<string> {
    const row = await this.getDataRowLocator(rowIndex);
    await expect(row).toBeVisible({ timeout: T });
    const text = (await row.innerText()).replace(/\s+/g, ' ').trim();

    const explicit = text.match(/Earning\s*Type\s*:?\s*([A-Za-z ]+)/i)?.[1]?.trim();
    if (explicit) return explicit;

    const colMatch = text.match(/\b(Commission|Bonus|Override|Chargeback)\b/i);
    return colMatch?.[1] ?? 'Commission';
  }

  async captureAgentCommissionAmountFromGridRow(rowIndex: number): Promise<{
    agentCommission: number;
    rowText: string;
  }> {
    const row = await this.getDataRowLocator(rowIndex);
    await expect(row).toBeVisible({ timeout: T });
    const text = (await row.innerText()).replace(/\s+/g, ' ').trim();

    const commissionMatch =
      text.match(/COMMISSION\s*\$([\d,]+\.?\d*)/i) ??
      text.match(/\$\s*([\d,]+\.?\d*)\s*$/);
    const agentCommission = commissionMatch
      ? Number.parseFloat(commissionMatch[1].replace(/,/g, ''))
      : 0;

    return { agentCommission, rowText: text };
  }

  async captureAgentCommissionFromGridRow(rowIndex: number): Promise<{
    agentLevel: string;
    agentCommission: number;
    rowText: string;
  }> {
    const { agentCommission, rowText } = await this.captureAgentCommissionAmountFromGridRow(rowIndex);

    const levelMatch =
      rowText.match(/\b(LVL\s*\d+)\b/i) ??
      rowText.match(/\bLevel\s+(I{1,3}|IV|V|\d+)\b/i) ??
      rowText.match(/\bAgent Level\s+(I{1,3}|IV|V|\d+)\b/i);
    if (!levelMatch?.[0]) {
      throw new Error(
        `Could not capture agent level from commission details row ${rowIndex + 1}: ${rowText.slice(0, 200)}`,
      );
    }

    return {
      agentLevel: normalizeAgentLevelLabel(levelMatch[0]),
      agentCommission,
      rowText,
    };
  }

  async commissionReportHasNoRecords(): Promise<boolean> {
    const modal = this.loc.commissionReportModal();
    if (!(await modal.isVisible().catch(() => false))) return false;
    const text = (await modal.innerText()).replace(/\s+/g, ' ').trim();
    return /no records in this report/i.test(text);
  }

  async captureProductNameFromMatchedPolicyDetails(): Promise<string> {
    await this.expandMatchedPolicyDetails();

    const bodyText = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');

    const product =
      bodyText.match(
        /Matched Policy Details.*?Product\s(.+?)\sIssue Date/i,
      )?.[1]?.trim() ??
      bodyText.match(/Product\s(.+?)\sIssue Date/i)?.[1]?.trim() ??
      '';

    if (!product) {
      throw new Error('Could not capture product name from Matched Policy Details');
    }
    return product;
  }

  async openViewCommissionSplitFromKebab(rowIndex = 0, expectedCommission?: number): Promise<void> {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: T });
    await this.scrollGridToRow(rowIndex);
    await this.scrollCommissionDetailsGridToActionsColumn();
    await this.scrollGridToRow(rowIndex);

    const row = await this.getDataRowLocator(rowIndex);
    await expect(row).toBeVisible({ timeout: T });
    await row.scrollIntoViewIfNeeded();
    if (expectedCommission !== undefined) {
      const rowText = (await row.innerText()).replace(/\s+/g, ' ');
      const commissionMatch =
        rowText.match(/COMMISSION\s*\$([\d,]+\.?\d*)/i) ??
        rowText.match(/\$\s*([\d,]+\.?\d*)\s*$/);
      const rowCommission = commissionMatch
        ? Number.parseFloat(commissionMatch[1].replace(/,/g, ''))
        : 0;
      expect(
        Math.abs(rowCommission - expectedCommission),
        `Kebab target row ${rowIndex + 1} shows COMMISSION $${rowCommission.toFixed(2)}, expected $${expectedCommission.toFixed(2)}`,
      ).toBeLessThanOrEqual(0.02);
    }
    await row.hover();

    const actionsButton = row.locator('[data-testid^="commission-details-actions-"]').first();
    await expect(actionsButton).toBeVisible({ timeout: T });
    await actionsButton.click({ force: true });
    const menuItem = this.loc.viewCommissionSplitMenuItem();
    await expect(menuItem).toBeVisible({ timeout: T });
    await menuItem.click();
    await expect(this.loc.commissionReportModal()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async captureAgentLevelFromGridRow(rowIndex: number): Promise<string> {
    const { agentLevel } = await this.captureAgentCommissionFromGridRow(rowIndex);
    return agentLevel;
  }

  async captureAgentLevelFromRecord(): Promise<string> {
    const fromNameColumn = await this.captureAgentLevelFromReconciliationNameColumn().catch(() => '');
    if (fromNameColumn) return fromNameColumn;

    const subtitle = await this.getPageSubtitleText();
    const policyText = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const source = `${subtitle} ${policyText}`;
    const match =
      source.match(/\b(LVL\s*\d+)\b/i) ??
      source.match(/Agent Name\s+Agent Level\s+(I{1,3}|IV|V|\d+)/i) ??
      source.match(/\bAgent Level\s+(I{1,3}|IV|V|\d+)\b/i) ??
      source.match(/\bLevel\s+(I{1,3}|IV|V|\d+)\b/i);
    if (!match?.[0]) {
      throw new Error('Could not capture agent level from reconciliation record view');
    }
    return normalizeAgentLevelLabel(match[0]);
  }

  /**
   * After opening a commission details line item, the reconciliation grid/table shows
   * agent level (e.g. LVL3) as a sub-label in the Name column.
   */
  async captureAgentLevelFromReconciliationNameColumn(): Promise<string> {
    await waitForAppSettled(this.page, T);

    const rawLevel = await this.page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

      const extractLevel = (nameCell: string) => nameCell.match(/\b(LVL\s*\d+)\b/i)?.[1] ?? '';

      const findLevelInTableLike = (root: Element): string => {
        const headerCells = Array.from(
          root.querySelectorAll('[role="columnheader"], thead th, tr th'),
        ).map((cell) => normalize(cell.textContent ?? '').toLowerCase());
        const nameIdx = headerCells.findIndex((header) => header === 'name');
        if (nameIdx < 0) return '';

        const dataRows = Array.from(root.querySelectorAll('[role="row"], tbody tr, tr')).filter(
          (row) => !row.querySelector('[role="columnheader"], th'),
        );

        for (const row of dataRows) {
          const cells = Array.from(row.querySelectorAll('[role="gridcell"], td')).map((cell) =>
            normalize(cell.textContent ?? ''),
          );
          const role = cells.find((cell) => /^(agency|sales leader|agent)$/i.test(cell)) ?? '';
          const nameCell = cells[nameIdx] ?? cells.find((cell) => /\bLVL\s*\d+\b/i.test(cell)) ?? '';
          const level = extractLevel(nameCell);
          if (!level) continue;
          if (/^agent$/i.test(role)) return level;
        }

        for (const row of dataRows) {
          const cells = Array.from(row.querySelectorAll('[role="gridcell"], td')).map((cell) =>
            normalize(cell.textContent ?? ''),
          );
          const nameCell = cells[nameIdx] ?? '';
          const level = extractLevel(nameCell);
          if (level) return level;
        }

        return '';
      };

      for (const grid of document.querySelectorAll('[role="grid"]')) {
        const level = findLevelInTableLike(grid);
        if (level) return level;
      }

      for (const table of document.querySelectorAll('table')) {
        const level = findLevelInTableLike(table);
        if (level) return level;
      }

      const reconHeading = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, button, [role="tab"]'),
      ).find((el) => /commission reconciliation/i.test(el.textContent ?? ''));
      if (reconHeading) {
        const section =
          reconHeading.closest('section, article, [data-testid*="reconciliation"]') ??
          reconHeading.parentElement;
        const match = (section?.textContent ?? '').match(/\b(LVL\s*\d+)\b/i);
        if (match?.[1]) return match[1];
      }

      return '';
    });

    if (!rawLevel) {
      throw new Error('Could not capture agent level from reconciliation Name column');
    }
    return normalizeAgentLevelLabel(rawLevel);
  }

  /**
   * On the Commission Reconciliation line-item view, read the transaction table:
   * - Agent commission = Amount $ on the Agent | COMMISSION row
   * - Gross compensation = sum of positive COMMISSION-type amounts (Agency + Sales Leader + Agent)
   */
  async tryCaptureReconciliationCommissionTruth(): Promise<ReconciliationCaptureResult> {
    await waitForAppSettled(this.page, 10_000).catch(() => {});

    await this.page.evaluate(() => {
      for (const viewport of document.querySelectorAll(
        '.ag-center-cols-viewport, .ag-body-viewport, .reconciliation-scroll',
      )) {
        if (!(viewport instanceof HTMLElement)) continue;
        if (viewport.scrollHeight <= viewport.clientHeight) continue;
        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        for (let top = 0; top <= maxScroll + 1; top += Math.max(40, viewport.clientHeight / 2)) {
          viewport.scrollTop = Math.min(maxScroll, top);
          viewport.dispatchEvent(new Event('scroll'));
        }
      }
    });
    await this.page.waitForTimeout(300);

    const result = await this.page.evaluate(() => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const parseMoney = (value: string) => {
        const isNegative = /\(.*\)/.test(value) || /-\s*\$/.test(value);
        const match = value.replace(/[(),]/g, '').match(/\$?\s*([\d.]+)/);
        const amount = match ? Number.parseFloat(match[1]) : 0;
        return isNegative ? -Math.abs(amount) : amount;
      };

      const findReconciliationRoot = (): Element => document.body;

      type ParsedRow = { role: string; commissionType: string; amount: number; name: string };
      const rowKey = (row: ParsedRow) =>
        `${row.role}|${row.commissionType}|${row.amount}|${row.name}`;

      const parseRowCells = (
        headerCells: string[],
        cells: string[],
      ): ParsedRow | null => {
        const roleIdx = headerCells.findIndex((header) => header === 'role');
        const typeIdx = headerCells.findIndex(
          (header) =>
            header.includes('commission type') ||
            header.includes('earning type') ||
            header === 'type',
        );
        const amountIdx = headerCells.findIndex((header) => header.includes('amount'));
        const nameIdx = headerCells.findIndex((header) => header === 'name');
        if (roleIdx < 0 || typeIdx < 0 || amountIdx < 0) return null;
        if (cells.length <= Math.max(roleIdx, typeIdx, amountIdx)) return null;

        const role = cells[roleIdx] ?? '';
        const commissionType = cells[typeIdx] ?? '';
        const amountText = cells[amountIdx] ?? '';
        const name = nameIdx >= 0 ? cells[nameIdx] ?? '' : '';
        if (/^total/i.test(role) || cells.some((cell) => /^total:?$/i.test(cell))) return null;

        return {
          role,
          commissionType,
          amount: parseMoney(amountText),
          name,
        };
      };

      const collectRowsFromTable = (table: Element, collected: Map<string, ParsedRow>) => {
        const headerCells = Array.from(table.querySelectorAll('thead th, tr th')).map((cell) =>
          normalize(cell.textContent ?? '').toLowerCase(),
        );
        const dataRows = Array.from(table.querySelectorAll('tbody tr, tr')).filter(
          (row) => !row.querySelector('th'),
        );
        for (const row of dataRows) {
          const cells = Array.from(row.querySelectorAll('td, [role="gridcell"]')).map((cell) =>
            normalize(cell.textContent ?? ''),
          );
          const parsed = parseRowCells(headerCells, cells);
          if (parsed) collected.set(rowKey(parsed), parsed);
        }
      };

      const collectRowsFromGrid = (grid: Element, collected: Map<string, ParsedRow>) => {
        const headerCells = Array.from(grid.querySelectorAll('[role="columnheader"]')).map((cell) =>
          normalize(cell.textContent ?? '').toLowerCase(),
        );
        const dataRows = Array.from(grid.querySelectorAll('[role="row"]')).filter(
          (row) => !row.querySelector('[role="columnheader"]'),
        );
        for (const row of dataRows) {
          const cells = Array.from(row.querySelectorAll('[role="gridcell"]')).map((cell) =>
            normalize(cell.textContent ?? ''),
          );
          const parsed = parseRowCells(headerCells, cells);
          if (parsed) collected.set(rowKey(parsed), parsed);
        }
      };

      const collectAllTransactionRows = (root: Element): ParsedRow[] => {
        const collected = new Map<string, ParsedRow>();

        const scrollCollect = (viewport: HTMLElement) => {
          const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
          const step = Math.max(40, Math.floor(viewport.clientHeight / 2));
          for (let scrollTop = 0; scrollTop <= maxScroll + 1; scrollTop += step) {
            viewport.scrollTop = Math.min(maxScroll, scrollTop);
            viewport.dispatchEvent(new Event('scroll'));
            for (const table of document.querySelectorAll('table')) {
              collectRowsFromTable(table, collected);
            }
            for (const grid of document.querySelectorAll('[role="grid"]')) {
              const label = (grid.getAttribute('aria-label') ?? '').toLowerCase();
              if (label === 'data grid') continue;
              collectRowsFromGrid(grid, collected);
            }
          }
        };

        for (const viewport of document.querySelectorAll(
          '.ag-center-cols-viewport, .ag-body-viewport, .reconciliation-scroll',
        )) {
          if (viewport instanceof HTMLElement && viewport.scrollHeight > viewport.clientHeight) {
            scrollCollect(viewport);
          }
        }

        for (const table of document.querySelectorAll('table')) {
          collectRowsFromTable(table, collected);
        }
        for (const grid of document.querySelectorAll('[role="grid"]')) {
          const label = (grid.getAttribute('aria-label') ?? '').toLowerCase();
          if (label === 'data grid') continue;
          collectRowsFromGrid(grid, collected);
        }

        return [...collected.values()];
      };

      const summarize = (rows: ParsedRow[]) => {
        let agentCommission = 0;
        let agentLevel = '';
        let grossCompensation = 0;
        let sawChargeback = false;
        let sawCommissionType = false;

        for (const row of rows) {
          if (/chargeback/i.test(row.commissionType)) sawChargeback = true;
          if (/^commission$/i.test(row.commissionType)) sawCommissionType = true;
          if (/^commission$/i.test(row.commissionType) && row.amount > 0) {
            grossCompensation += row.amount;
          }
          if (/^agent$/i.test(row.role) && /^commission$/i.test(row.commissionType) && row.amount > 0) {
            agentCommission = row.amount;
            agentLevel =
              row.name.match(/\b(LVL\s*\d+)\b/i)?.[1] ??
              row.name.match(/\bLevel\s+(I{1,3}|IV|V)\b/i)?.[0] ??
              '';
          }
        }

        return { agentCommission, agentLevel, grossCompensation, sawChargeback, sawCommissionType };
      };

      const parseFromText = (text: string) => {
        const normalized = normalize(text);
        if (/chargeback/i.test(normalized) && !/agent[\s\S]{0,80}commission[\s\S]{0,40}\$\s*[\d.]+/i.test(normalized)) {
          return { kind: 'chargeback' as const };
        }

        const agentBlock =
          normalized.match(
            /Agent[\s\S]{0,120}?COMMISSION[\s\S]{0,40}?\$\s*([\d,]+\.?\d*)/i,
          ) ??
          normalized.match(/Agent[\s\S]{0,80}?\$\s*([\d,]+\.?\d*)[\s\S]{0,40}?COMMISSION/i);
        const agentCommission = agentBlock
          ? Number.parseFloat(agentBlock[1].replace(/,/g, ''))
          : 0;

        const grossMatches = [
          ...normalized.matchAll(
            /(?:Agency|Sales Leader|Agent)[\s\S]{0,80}?COMMISSION[\s\S]{0,40}?\$\s*([\d,]+\.?\d*)/gi,
          ),
        ];
        let grossCompensation = 0;
        for (const match of grossMatches) {
          const amount = Number.parseFloat(match[1].replace(/,/g, ''));
          if (amount > 0) grossCompensation += amount;
        }

        const levelMatch =
          normalized.match(/\b(LVL\s*\d+)\b/i) ??
          normalized.match(/\bLevel\s+(I{1,3}|IV|V)\b/i);
        const agentLevel = levelMatch?.[0] ?? '';

        if (agentCommission > 0) {
          return {
            kind: 'success' as const,
            grossCompensation: grossCompensation || agentCommission,
            agentCommission,
            agentLevel,
          };
        }
        if (/chargeback/i.test(normalized)) return { kind: 'chargeback' as const };
        return { kind: 'missing' as const };
      };

      const root = findReconciliationRoot();
      const rows = collectAllTransactionRows(root);
      const summary = summarize(rows);
      if (summary.agentCommission > 0) {
        return {
          kind: 'success' as const,
          grossCompensation: summary.grossCompensation,
          agentCommission: summary.agentCommission,
          agentLevel: summary.agentLevel,
        };
      }
      if (summary.sawChargeback && !summary.sawCommissionType) {
        return { kind: 'chargeback' as const };
      }

      return parseFromText(document.body.textContent ?? '');
    });

    if (result.kind === 'success') {
      return {
        ok: true,
        data: {
          grossCompensation: result.grossCompensation,
          agentCommission: result.agentCommission,
          agentLevel: result.agentLevel ? normalizeAgentLevelLabel(result.agentLevel) : '',
        },
      };
    }
    if (result.kind === 'chargeback') {
      return { ok: false, reason: 'chargeback row — no agent commission to validate' };
    }
    return {
      ok: false,
      reason: 'Could not capture Agent COMMISSION amount from reconciliation transaction table',
    };
  }

  async captureReconciliationCommissionTruth(): Promise<ReconciliationCommissionCapture> {
    const result = await this.tryCaptureReconciliationCommissionTruth();
    if (!result.ok) {
      throw new Error(result.reason);
    }
    return result.data;
  }

  private async syncGridViewportScrollTop(scrollTop: number): Promise<void> {
    await this.grid().evaluate((gridEl, top) => {
      for (const selector of ['.ag-center-cols-viewport', '.ag-body-viewport']) {
        const viewport = gridEl.querySelector(selector) as HTMLElement | null;
        if (!viewport) continue;
        const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        viewport.scrollTop = Math.min(maxScroll, Math.max(0, top));
        viewport.dispatchEvent(new Event('scroll'));
      }
    }, scrollTop);
  }

  private async scrollRowIntoViewViaDom(rowIndex: number): Promise<boolean> {
    return this.grid().evaluate((gridEl, idx) => {
      const hasData = (row: Element) =>
        [...row.querySelectorAll('[role="gridcell"], .ag-cell')].some(
          (cell) =>
            cell.getAttribute('col-id') !== 'warning' &&
            cell.getAttribute('col-id') !== '__reconcile_warning__' &&
            (cell.textContent ?? '').trim().length > 0,
        );

      const target =
        gridEl.querySelector(`.ag-center-cols-container .ag-row[row-index="${idx}"]`) ??
        gridEl.querySelector(`.ag-row[row-index="${idx}"]`);

      if (!target || !hasData(target)) return false;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
      return true;
    }, rowIndex);
  }

  async scrollGridFromBottom(rowIndex: number, totalRows: number): Promise<void> {
    const viewport = this.grid().locator('.ag-center-cols-viewport').first();
    const rowHeight = await viewport.evaluate((el) => {
      const row = el.querySelector('.ag-row') as HTMLElement | null;
      return row?.offsetHeight || 52;
    });

    await viewport.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll'));
    });
    await this.page.waitForTimeout(300);

    const scrollTop = await viewport.evaluate(
      (el, { idx, total, height }) => {
        const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
        const rowsFromBottom = Math.max(0, total - 1 - idx);
        return Math.max(0, maxScroll - rowsFromBottom * height - height / 2);
      },
      { idx: rowIndex, total: totalRows, height: rowHeight },
    );

    await this.syncGridViewportScrollTop(scrollTop);
    await this.page.waitForTimeout(250);
    await this.scrollRowIntoViewViaDom(rowIndex);
  }

  private async scrollGridToRowViaKeyboard(rowIndex: number, totalRows: number): Promise<void> {
    const grid = this.grid();
    const firstRow = grid.locator('.ag-center-cols-container .ag-row[row-index="0"]').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click({ force: true });
    } else {
      await grid.click({ position: { x: 40, y: 80 }, force: true });
    }
    await this.page.waitForTimeout(150);

    if (rowIndex >= totalRows / 2) {
      await this.page.keyboard.press('End');
      await this.page.waitForTimeout(400);
      for (let step = 0; step < totalRows - 1 - rowIndex; step++) {
        await this.page.keyboard.press('ArrowUp');
        await this.page.waitForTimeout(80);
      }
    } else {
      await this.page.keyboard.press('Home');
      await this.page.waitForTimeout(200);
      for (let step = 0; step < rowIndex; step++) {
        await this.page.keyboard.press('ArrowDown');
        await this.page.waitForTimeout(80);
      }
    }
    await this.page.waitForTimeout(250);
    await this.scrollRowIntoViewViaDom(rowIndex);
  }

  async scrollGridToRow(rowIndex: number): Promise<void> {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: T });

    if (await this.agRowIsRendered(rowIndex)) {
      await this.scrollRowIntoViewViaDom(rowIndex);
      await this.centerAgRowInViewport(rowIndex);
      return;
    }

    const viewport = grid.locator('.ag-center-cols-viewport').first();
    const totalRows = await this.getCommissionDetailsRowCount();
    const isTailRow = rowIndex >= Math.max(0, totalRows - 6);
    const pollTimeout = isTailRow ? 45_000 : 25_000;

    if (isTailRow) {
      await this.scrollGridFromBottom(rowIndex, totalRows);
      if (await this.agRowIsRendered(rowIndex)) {
        await this.centerAgRowInViewport(rowIndex);
        return;
      }
    }

    await expect
      .poll(
        async () => {
          const scrollStrategies = [
            async () => {
              await viewport.evaluate((el, { idx, tail }) => {
                const gridRoot = el.closest('.ag-root-wrapper');
                const candidates = [
                  (gridRoot as { gridOptions?: { api?: { ensureIndexVisible: (i: number, pos?: string) => void } } } | null)
                    ?.gridOptions?.api,
                  (gridRoot as { __agComponent?: { gridApi?: { ensureIndexVisible: (i: number, pos?: string) => void } } } | null)
                    ?.__agComponent?.gridApi,
                ];
                for (const api of candidates) {
                  if (api?.ensureIndexVisible) {
                    api.ensureIndexVisible(idx, tail ? 'bottom' : 'middle');
                    return;
                  }
                }
              }, { idx: rowIndex, tail: isTailRow });
            },
            async () => {
              if (isTailRow) {
                await this.scrollGridFromBottom(rowIndex, totalRows);
                return;
              }
              await viewport.evaluate((el, { idx }) => {
                const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
                let low = 0;
                let high = maxScroll;
                const rowHeight =
                  (el.querySelector('.ag-row') as HTMLElement | null)?.offsetHeight || 52;

                for (let attempt = 0; attempt < 24; attempt++) {
                  const scrollTop =
                    attempt === 0
                      ? Math.min(maxScroll, Math.max(0, idx * rowHeight - el.clientHeight / 2))
                      : Math.floor((low + high) / 2);
                  el.scrollTop = scrollTop;
                  el.dispatchEvent(new Event('scroll'));

                  const targetRow = el.querySelector(`.ag-row[row-index="${idx}"]`);
                  const targetHasText =
                    targetRow &&
                    [...targetRow.querySelectorAll('[role="gridcell"], .ag-cell')].some(
                      (c) => (c.textContent ?? '').trim().length > 0,
                    );
                  if (targetHasText) return;

                  const visibleRows = [...el.querySelectorAll('.ag-row[row-index]')];
                  if (visibleRows.length === 0) continue;

                  const indices = visibleRows
                    .map((row) => Number.parseInt(row.getAttribute('row-index') ?? '-1', 10))
                    .filter((value) => value >= 0);
                  if (indices.length === 0) continue;

                  const minIdx = Math.min(...indices);
                  const maxIdx = Math.max(...indices);
                  if (maxIdx < idx) low = Math.min(maxScroll, scrollTop + 1);
                  else if (minIdx > idx) high = Math.max(0, scrollTop - 1);
                  else break;
                }
              }, { idx: rowIndex });
              await this.syncGridViewportScrollTop(
                await viewport.evaluate((el) => el.scrollTop),
              );
            },
            async () => {
              await viewport.evaluate(
                (el, { idx }) => {
                  const rowHeight =
                    (el.querySelector('.ag-row') as HTMLElement | null)?.offsetHeight || 52;
                  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
                  el.scrollTop = Math.min(
                    maxScroll,
                    Math.max(0, idx * rowHeight - el.clientHeight / 3),
                  );
                  el.dispatchEvent(new Event('scroll'));
                },
                { idx: rowIndex },
              );
              await this.syncGridViewportScrollTop(
                await viewport.evaluate((el) => el.scrollTop),
              );
            },
            async () => {
              await viewport.evaluate(
                (el, { idx, total }) => {
                  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
                  const ratio = total > 1 ? idx / (total - 1) : 0;
                  el.scrollTop = Math.min(maxScroll, Math.max(0, ratio * maxScroll));
                  el.dispatchEvent(new Event('scroll'));
                },
                { idx: rowIndex, total: totalRows },
              );
              await this.syncGridViewportScrollTop(
                await viewport.evaluate((el) => el.scrollTop),
              );
            },
            async () => {
              await viewport.evaluate(
                (el, { idx }) => {
                  const rowHeight =
                    (el.querySelector('.ag-row') as HTMLElement | null)?.offsetHeight || 52;
                  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
                  let scrollTop = Math.min(
                    maxScroll,
                    Math.max(0, idx * rowHeight - el.clientHeight / 2),
                  );
                  for (let step = 0; step < 60; step++) {
                    el.scrollTop = scrollTop;
                    el.dispatchEvent(new Event('scroll'));
                    const row = el.querySelector(`.ag-row[row-index="${idx}"]`);
                    const hasText =
                      row &&
                      [...row.querySelectorAll('[role="gridcell"], .ag-cell')].some(
                        (c) => (c.textContent ?? '').trim().length > 0,
                      );
                    if (hasText) return;
                    scrollTop = Math.min(maxScroll, scrollTop + rowHeight * 2);
                    if (scrollTop >= maxScroll) break;
                  }
                },
                { idx: rowIndex },
              );
              await this.syncGridViewportScrollTop(
                await viewport.evaluate((el) => el.scrollTop),
              );
            },
          ];

          for (const strategy of scrollStrategies) {
            await strategy();
            await this.page.waitForTimeout(250);
            await this.scrollRowIntoViewViaDom(rowIndex);
            if (await this.agRowIsRendered(rowIndex)) return true;
          }

          await viewport.hover().catch(() => {});
          await this.page.mouse.wheel(0, isTailRow ? 900 : rowIndex > totalRows / 2 ? 600 : 300);
          await this.page.waitForTimeout(250);
          await this.scrollRowIntoViewViaDom(rowIndex);
          if (await this.agRowIsRendered(rowIndex)) return true;

          if (isTailRow) {
            await this.scrollGridToRowViaKeyboard(rowIndex, totalRows);
            return this.agRowIsRendered(rowIndex);
          }

          return false;
        },
        { timeout: pollTimeout, intervals: [200, 400, 800, 1_200] },
      )
      .toBeTruthy();

    await this.scrollRowIntoViewViaDom(rowIndex);
    await this.centerAgRowInViewport(rowIndex);
  }

  private async scrollCommissionDetailsGridToActionsColumn(): Promise<void> {
    const grid = this.grid();
    await grid.evaluate((gridEl) => {
      const viewport = gridEl.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (viewport) {
        viewport.scrollLeft = viewport.scrollWidth;
      }
      const pinnedRight = gridEl.querySelector(
        '.ag-pinned-right-cols-viewport',
      ) as HTMLElement | null;
      if (pinnedRight) {
        pinnedRight.scrollLeft = pinnedRight.scrollWidth;
      }
    });
    await this.page.waitForTimeout(300);
  }

  async captureLastRowCommissionAmount(): Promise<CommissionReportCapture> {
    const modal = this.loc.commissionReportModal();
    await expect(modal).toBeVisible({ timeout: T });
    const capture = await modal.evaluate((modalEl) => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const text = normalize(modalEl.textContent ?? '');
      const grossMatch = text.match(/Gross Commission:\s*\$([\d,]+\.?\d*)/i);
      const grossCommission = grossMatch ? Number.parseFloat(grossMatch[1].replace(/,/g, '')) : 0;

      const rows: { agentName: string; commissionAmount: number }[] = [];
      const tableRows = Array.from(modalEl.querySelectorAll('tr')).filter((row) =>
        /\$[\d,]+\.?\d*/.test(row.textContent ?? ''),
      );

      for (const row of tableRows) {
        const cells = Array.from(row.querySelectorAll('td, th')).map((cell) =>
          normalize(cell.textContent ?? ''),
        );
        const amountCell = cells.find((cell) => /^\$[\d,]+\.?\d*$/.test(cell));
        if (!amountCell) continue;
        if (/total commission amount/i.test(cells.join(' '))) continue;

        const amount = Number.parseFloat(amountCell.replace(/[$,]/g, ''));
        const nameCell =
          cells.find((cell) => cell && !/^\d+$/.test(cell) && !/^\$/.test(cell)) ?? '';
        if (!Number.isFinite(amount) || !nameCell) continue;
        rows.push({ agentName: nameCell, commissionAmount: amount });
      }

      const totalMatch = text.match(/Total Commission amount\s*\$([\d,]+\.?\d*)/i);
      const totalCommissionAmount = totalMatch
        ? Number.parseFloat(totalMatch[1].replace(/,/g, ''))
        : 0;
      const lastRowCommissionAmount =
        rows.length > 0 ? rows[rows.length - 1].commissionAmount : totalCommissionAmount;

      return {
        grossCommission,
        rows,
        lastRowCommissionAmount,
        totalCommissionAmount,
      };
    });

    return capture;
  }

  async closeCommissionReportModal(): Promise<void> {
    const modal = this.loc.commissionReportModal();
    if (!(await modal.isVisible().catch(() => false))) return;

    const closeButton = this.loc.commissionReportCloseButton();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await expect(modal).toBeHidden({ timeout: T });
  }

  async openCommissionSplitHierarchy(): Promise<void> {
    const toggle = this.loc.commissionSplitHierarchyTab().first();
    await expect(toggle).toBeVisible({ timeout: T });
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await toggle.click();
      await waitForAppSettled(this.page, T);
    }
    await expect(this.loc.commissionSplitHierarchyGrid()).toBeVisible({ timeout: T });
  }

  async expandMatchedPolicyDetails(cardIndex = 0): Promise<void> {
    const toggle = this.loc.matchedPolicyDetailsToggle().nth(cardIndex);
    if (!(await toggle.isVisible().catch(() => false))) return;
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await toggle.click();
      await waitForAppSettled(this.page, T);
    }
  }

  /**
   * Reads reconciliation split-up % from the Commission Split Hierarchy AG Grid.
   * Columns: Order | Role | Name | Split % | Amount $
   * One CSV policy → one line with Agency / Sales Leader / Agent split-up % for that LVL.
   */
  async captureSplitHierarchyLines(): Promise<CommissionSplitHierarchyLine[]> {
    const grid = this.loc.commissionSplitHierarchyGrid();

    // Headed / UI mode may render the grid shell before data rows — poll for role rows.
    await expect
      .poll(
        async () => {
          if (!(await grid.isVisible().catch(() => false))) return 0;
          const fromGrid = await this.captureSplitHierarchyFromGrid(grid);
          return fromGrid.length;
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBeGreaterThan(0);

    const fromGrid = await this.captureSplitHierarchyFromGrid(grid);
    if (fromGrid.length > 0) return fromGrid;

    const table = this.loc.commissionSplitHierarchyTable();
    if (await table.isVisible().catch(() => false)) {
      return this.captureSplitHierarchyFromTable(table);
    }

    throw new Error('No commission split hierarchy grid or table found');
  }

  private async captureSplitHierarchyFromGrid(
    grid: Locator,
  ): Promise<CommissionSplitHierarchyLine[]> {
    await expect(grid).toBeVisible({ timeout: T });

    const roleRows = await grid.evaluate((gridEl) => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const rows = Array.from(gridEl.querySelectorAll('[role="row"]')).filter((row) => {
        if (row.querySelector('[role="columnheader"]')) return false;
        return row.querySelectorAll('[role="gridcell"]').length >= 4;
      });

      return rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll('[role="gridcell"]')).map((cell) =>
            normalize(cell.textContent ?? ''),
          );
          if (cells.some((value) => /^total:?$/i.test(value))) return null;
          const role = cells[1] ?? '';
          const name = cells[2] ?? '';
          const splitPercent = cells[3] ?? '';
          if (!role || !splitPercent) return null;
          return { role, name, splitPercent };
        })
        .filter((row): row is { role: string; name: string; splitPercent: string } => row !== null);
    });

    if (roleRows.length === 0) return [];

    const normalizeSplitPercent = (value: string) => {
      const trimmed = value.replace(/\s+/g, ' ').trim();
      const match = trimmed.match(/([\d.]+%)/);
      if (match) return match[1];
      if (!trimmed) return '';
      return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
    };

    const extractLevel = (name: string) => {
      const lvl = name.match(/LVL\s*\d+/i)?.[0]?.replace(/\s+/g, '');
      if (lvl) return lvl.toUpperCase();
      const roman = name.match(/Level\s+(I{1,3}|IV|V)/i)?.[0];
      return roman?.replace(/\s+/g, ' ') ?? '';
    };

    const line: CommissionSplitHierarchyLine = {
      level: '',
      agency: '',
      salesLeader: '',
      agent: '',
      product: '',
    };

    for (const { role, name, splitPercent } of roleRows) {
      if (!line.level) line.level = extractLevel(name);
      const percent = normalizeSplitPercent(splitPercent);
      if (/^agency$/i.test(role)) line.agency = percent;
      else if (/sales\s*leader/i.test(role)) line.salesLeader = percent;
      else if (/^agent$/i.test(role)) line.agent = percent;
    }

    if (!line.level) {
      throw new Error('Could not determine agent level from commission split hierarchy grid');
    }
    if (!line.agency && !line.salesLeader && !line.agent) {
      throw new Error('No role split percentages found in commission split hierarchy grid');
    }

    return [line];
  }

  private async captureSplitHierarchyFromTable(table: Locator): Promise<CommissionSplitHierarchyLine[]> {
    await expect(table).toBeVisible({ timeout: T });

    const lines = await table.evaluate((tableEl) => {
      const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
      const normalizeSplitPercent = (value: string) => {
        const trimmed = normalize(value);
        if (!trimmed) return '';
        const match = trimmed.match(/([\d.]+%?)/);
        if (!match) return trimmed;
        return match[1].endsWith('%') ? match[1] : `${match[1]}%`;
      };
      const parsed: CommissionSplitHierarchyLine[] = [];
      let columnIndex: Record<string, number> = {};

      const indexFor = (headers: string[], ...labels: string[]) =>
        headers.findIndex((header) => labels.some((label) => header.includes(label)));

      for (const row of Array.from(tableEl.querySelectorAll('tr'))) {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const values = cells.map((cell) => normalize(cell.textContent ?? ''));
        const headers = values.map((value) => value.toLowerCase());

        if (headers.some((header) => header.includes('agency'))) {
          columnIndex = {
            level: indexFor(headers, 'level', 'agent level'),
            agency: indexFor(headers, 'agency'),
            salesLeader: indexFor(headers, 'sales leader', 'salesleader'),
            agent: headers.findIndex(
              (header, idx) =>
                idx !== indexFor(headers, 'level', 'agent level') &&
                (header === 'agent' || /\bagent\b/.test(header)),
            ),
            product: indexFor(headers, 'product'),
          };
          continue;
        }

        if (!values.some(Boolean) || columnIndex.agency === undefined || columnIndex.agency < 0) {
          continue;
        }

        const valueAt = (key: string) => {
          const idx = columnIndex[key];
          return idx !== undefined && idx >= 0 ? values[idx] ?? '' : '';
        };

        parsed.push({
          level: valueAt('level'),
          agency: normalizeSplitPercent(valueAt('agency')),
          salesLeader: normalizeSplitPercent(valueAt('salesLeader')),
          agent: normalizeSplitPercent(valueAt('agent')),
          product: valueAt('product'),
        });
      }

      return parsed;
    });

    if (lines.length === 0) {
      throw new Error('No commission split hierarchy rows found in table');
    }

    return lines;
  }

  async getPaymentStatusesFromGrid(): Promise<string[]> {
    await expect(this.grid()).toBeVisible({ timeout: T });
    await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (viewport) viewport.scrollLeft = 2000;
    });
    await this.page.waitForTimeout(3000);
    return this.page.evaluate(() => {
      const cells = document.querySelectorAll('.ag-cell[col-id="paymentStatus"]');
      return Array.from(cells)
        .map((cell) => (cell.textContent || '').trim())
        .filter(Boolean);
    });
  }
}
