import { expect } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { escapeRegex } from '../../utils/escapeRegex';
import { STATEMENT_PROCESSING } from '../../test-data/statement-processing/validateStatementProcessing';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import type { StatementReviewPage } from './StatementReviewPage';

const T = smokeStepTimeoutMs;

export class StatementReviewAssertions {
  constructor(private readonly reviewPage: StatementReviewPage) {}

  async expectUrlContainsFileId(fileId: string): Promise<void> {
    await expect(this.reviewPage.page).toHaveURL(AppUrlPatterns.commissionReview, { timeout: T });
    expect(fileId).toBeTruthy();
    expect(this.reviewPage.page.url()).toContain(fileId);
  }

  async expectSubtitleWithFileAndCarrier(fileName: string, carrierName: string): Promise<void> {
    await this.reviewPage.expectOnReviewPage();
    const titlePattern = new RegExp(
      `${escapeRegex(fileName)}\\s*\\|\\s*${escapeRegex(carrierName)}`,
      'i',
    );
    const subtitle = this.reviewPage.page
      .getByText(titlePattern)
      .or(this.reviewPage.page.getByText(new RegExp(escapeRegex(fileName), 'i')))
      .first();
    await expect(subtitle).toBeVisible({ timeout: T });
  }

  async expectSubtitleWithFileAndStatementType(
    fileName: string,
    statementType: string,
  ): Promise<void> {
    const baseName = fileName.replace(/\.(csv|xlsx)$/i, '');
    const subtitlePattern = new RegExp(
      `${escapeRegex(fileName)}\\s*\\|\\s*${escapeRegex(statementType)}|${escapeRegex(baseName)}\\s*\\|\\s*${escapeRegex(statementType)}`,
      'i',
    );
    const subtitle = this.reviewPage.page.getByText(subtitlePattern).first();
    await expect(subtitle).toBeVisible({ timeout: T });
    const text = (await subtitle.innerText()).replace(/\s+/g, ' ');
    expect(text).toMatch(new RegExp(escapeRegex(fileName), 'i'));
    expect(text).toMatch(new RegExp(escapeRegex(statementType), 'i'));
  }

  async expectTooltipContains(tooltipText: string, ...fragments: string[]): Promise<void> {
    expect(tooltipText, 'Hover the warning icon before asserting tooltip text').toBeTruthy();
    for (const fragment of fragments) {
      expect(tooltipText.toLowerCase()).toContain(fragment.toLowerCase());
    }
  }

  async expectEveryTransactionType(type: string): Promise<void> {
    const grid = this.reviewPage.page.getByRole('grid', { name: 'Data grid' });
    await expect(grid).toBeVisible({ timeout: T });

    const expectedCount = await this.expectRecordCountGreaterThan(0);

    const pattern = new RegExp(`^\\s*${escapeRegex(type)}\\s*$`, 'i');
    const txnCells = grid.locator('[role="gridcell"]').filter({ hasText: pattern });
    await expect(txnCells).toHaveCount(expectedCount, { timeout: T });
  }

  async expectRecordCount(expected: number): Promise<number> {
    // Review grid often paints skeleton + "Showing all 0 records" before rows hydrate.
    await expect
      .poll(async () => this.readFooterRecordCount(), {
        timeout: T,
        intervals: [500, 1_000, 2_000],
      })
      .toBe(expected);
    return expected;
  }

  async expectRecordCountGreaterThan(min: number): Promise<number> {
    await expect
      .poll(async () => this.readFooterRecordCount(), {
        timeout: T,
        intervals: [500, 1_000, 2_000],
      })
      .toBeGreaterThan(min);
    return this.readFooterRecordCount();
  }

  async expectGridContainsFragments(...fragments: string[]): Promise<void> {
    const grid = this.reviewGrid();
    await expect(grid).toBeVisible({ timeout: T });
    const needles = fragments.map((f) => f.trim()).filter(Boolean);
    await expect
      .poll(
        async () => {
          const text = (await grid.innerText()).replace(/\s+/g, ' ');
          return needles.every((needle) => text.includes(needle));
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBe(true);
  }

  /**
   * Review header format (harvested): "Total Earned Commission: ${amount}".
   * Label and amount may be sibling nodes — match the combined visible string.
   * Amount = Excel Net compensation (not Gross).
   */
  async expectTotalEarnedCommission(expected: number): Promise<void> {
    const token = expected.toFixed(2);
    const pattern = new RegExp(
      `Total Earned Commission:\\s*\\$?${escapeRegex(token)}`,
      'i',
    );
    await expect
      .poll(
        async () => {
          const hit = this.reviewPage.page.getByText(pattern).first();
          if (await hit.isVisible().catch(() => false)) return true;
          // Wider scope: any ancestor that contains both label + amount.
          const label = this.reviewPage.page.getByText(/Total Earned Commission/i).first();
          if (!(await label.isVisible().catch(() => false))) return false;
          const block = label.locator('xpath=ancestor::*[contains(., "Total Earned Commission")][1]');
          const text = (await block.innerText().catch(() => '')).replace(/\s+/g, ' ');
          const match = text.match(/Total Earned Commission:\s*\$?([\d,]+\.?\d*)/i);
          if (!match?.[1]) return false;
          const parsed = Number.parseFloat(match[1].replace(/,/g, ''));
          return (
            Number.isFinite(parsed) &&
            Math.abs(parsed - expected) <= STATEMENT_PROCESSING.grossCommissionTolerance
          );
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBe(true);
  }

  /** Each type appears at least once (mixed NB/RN files). */
  async expectTransactionTypesPresent(types: string[]): Promise<void> {
    const grid = this.reviewGrid();
    await expect(grid).toBeVisible({ timeout: T });
    await this.expectRecordCountGreaterThan(0);
    for (const type of types) {
      const pattern = new RegExp(`^\\s*${escapeRegex(type)}\\s*$`, 'i');
      const cells = grid.locator('[role="gridcell"]').filter({ hasText: pattern });
      await expect(cells.first(), `Review grid missing transaction type ${type}`).toBeVisible({
        timeout: T,
      });
    }
  }

  private reviewGrid() {
    return this.reviewPage.page
      .getByTestId('review-statement-grid')
      .or(this.reviewPage.page.getByRole('grid', { name: 'Data grid' }))
      .first();
  }

  /**
   * Visible (virtualized) cells for col-id must all contain the bulk-updated value.
   * Money / % values tolerate $ and formatting differences.
   *
   * AG Grid column virtualization: scrollIntoView alone does NOT remount off-screen
   * cols (Gross Comm, Premium, …). Sweep horizontal viewport / ensureColumnVisible.
   */
  async expectVisibleColumnCellsEqual(colId: string, expected: string): Promise<void> {
    const grid = this.reviewGrid();
    await expect(grid).toBeVisible({ timeout: T });

    await this.ensureReviewColumnMounted(colId);

    const cellLocator = () =>
      grid.locator(
        [
          `.ag-center-cols-container [col-id="${colId}"]`,
          `.ag-pinned-left-cols-container [col-id="${colId}"]`,
          `.ag-pinned-right-cols-container [col-id="${colId}"]`,
        ].join(', '),
      );

    await expect
      .poll(
        async () => {
          await this.ensureReviewColumnMounted(colId);
          const cells = cellLocator();
          const count = await cells.count();
          if (count === 0) return false;
          const values = await cells.evaluateAll((els) =>
            els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()),
          );
          return values.every((v) => cellMatchesBulkValue(v, expected));
        },
        { timeout: T, intervals: [500, 1_000, 2_000] },
      )
      .toBe(true);

    const count = await cellLocator().count();
    expect(count, `Expected visible cells for col-id ${colId}`).toBeGreaterThan(0);
  }

  /** Remount a horizontally virtualized AG Grid column in the review grid. */
  private async ensureReviewColumnMounted(colId: string): Promise<void> {
    const page = this.reviewPage.page;
    const grid = this.reviewGrid();

    const cellCount = async () =>
      grid
        .locator(
          [
            `.ag-center-cols-container [col-id="${colId}"]`,
            `.ag-pinned-left-cols-container [col-id="${colId}"]`,
            `.ag-pinned-right-cols-container [col-id="${colId}"]`,
          ].join(', '),
        )
        .count();

    if ((await cellCount()) > 0) return;

    // Prefer AG Grid API when the React wrapper exposes it.
    await page.evaluate((id) => {
      const root =
        document.querySelector('[data-testid="review-statement-grid"]')?.closest('.ag-root-wrapper') ??
        document.querySelector('.ag-root-wrapper');
      const candidates = [
        (root as { gridOptions?: { api?: { ensureColumnVisible?: (c: string) => void } } } | null)
          ?.gridOptions?.api,
        (
          root as {
            __agComponent?: { gridApi?: { ensureColumnVisible?: (c: string) => void }; api?: { ensureColumnVisible?: (c: string) => void } };
          } | null
        )?.__agComponent?.gridApi,
        (
          root as {
            __agComponent?: { api?: { ensureColumnVisible?: (c: string) => void } };
          } | null
        )?.__agComponent?.api,
      ];
      for (const api of candidates) {
        if (api?.ensureColumnVisible) {
          api.ensureColumnVisible(id);
          return;
        }
      }
    }, colId);
    await page.waitForTimeout(150);
    if ((await cellCount()) > 0) return;

    // Yield between scroll positions so virtualized columns remount (see CommissionReportReviewCapture).
    const positions = await page.evaluate(() => {
      const viewport = document.querySelector(
        '.ag-center-cols-viewport, .ag-body-horizontal-scroll-viewport',
      ) as HTMLElement | null;
      if (!viewport) return [0];
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const step = Math.max(80, Math.floor(viewport.clientWidth * 0.3));
      const out: number[] = [];
      for (let x = 0; x <= max; x += step) out.push(x);
      if (out[out.length - 1] !== max) out.push(max);
      for (let x = max; x >= 0; x -= step) out.push(Math.max(0, x));
      return out;
    });

    for (const left of positions) {
      await page.evaluate((scrollLeft) => {
        for (const sel of ['.ag-center-cols-viewport', '.ag-body-horizontal-scroll-viewport']) {
          const vp = document.querySelector(sel) as HTMLElement | null;
          if (!vp) continue;
          const max = Math.max(0, vp.scrollWidth - vp.clientWidth);
          vp.scrollLeft = Math.min(max, Math.max(0, scrollLeft));
          vp.dispatchEvent(new Event('scroll'));
        }
      }, left);
      await page.waitForTimeout(120);
      if ((await cellCount()) > 0) return;
    }
  }

  private async readFooterRecordCount(): Promise<number> {
    const footer = this.reviewPage.page
      .getByTestId('data-grid-record-count-footer')
      .or(this.reviewPage.page.getByText(/showing all (\d+) records/i))
      .first();
    await expect(footer).toBeVisible({ timeout: T });
    const text = (await footer.innerText()).replace(/\s+/g, ' ');
    return Number.parseInt(text.match(/(\d+)/)?.[1] ?? '0', 10);
  }
}

function cellMatchesBulkValue(actual: string, expected: string): boolean {
  const a = actual.replace(/\s+/g, ' ').trim();
  const e = expected.replace(/\s+/g, ' ').trim();
  if (!e) return a === e;
  if (a === e) return true;
  if (a.includes(e)) return true;
  // Money / numeric: strip $ , and compare numbers when both parse
  const numA = Number.parseFloat(a.replace(/[$,%]/g, ''));
  const numE = Number.parseFloat(e.replace(/[$,%]/g, ''));
  if (Number.isFinite(numA) && Number.isFinite(numE) && !/[/-]/.test(a) && !/[/-]/.test(e)) {
    return Math.abs(numA - numE) < 0.011;
  }
  // Dates: compare calendar day across dd/mm/yyyy vs mm/dd/yyyy display
  const dayA = parseLooseDate(a);
  const dayE = parseLooseDate(e);
  if (dayA && dayE) return dayA === dayE;
  return a.toLowerCase() === e.toLowerCase();
}

/** Returns YYYY-MM-DD when parseable; prefers dd/mm when day>12 or expected is already normalized. */
function parseLooseDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return null;
  const a = Number.parseInt(m[1], 10);
  const b = Number.parseInt(m[2], 10);
  const y = m[3];
  if (a > 12) return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`; // d/m
  if (b > 12) return `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`; // m/d
  // Ambiguous: prefer day-first (bulk control / EU) then month-first
  return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
}
