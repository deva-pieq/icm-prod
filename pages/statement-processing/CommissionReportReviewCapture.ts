import { expect, type Locator, type Page } from '@playwright/test';
import { COMMISSION_REPORT } from '../../test-data/commission-report/validateCommissionReport';
import { parseMoney } from '../../utils/commission-report/monthDiff';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;

export type ReviewLineCapture = {
  rowIndex: number;
  policyNumber: string;
  totalMembers: number;
  issueDate: string;
  paidToDate: string;
  grossComm: number;
  chargeback: string;
  skipped: boolean;
  skipReason?: string;
};

function isNonEmptyChargeback(value: string): boolean {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return false;
  if (/^[-–—]$/.test(trimmed)) return false;
  if (/^(n\/?a|null|none)$/i.test(trimmed)) return false;
  return true;
}

function extractPolicyNumberFallback(rowText: string): string {
  return (
    rowText.match(/\b[A-Z]{2,}\d[\w-]*\b/i)?.[0] ??
    rowText.match(/\b\d{7,}(?:-\d{2})?\b/)?.[0] ??
    ''
  );
}

/**
 * Commission-report–only review grid capture.
 * Kept separate from StatementReviewPage so @validate-commission-split is unaffected.
 */
export class CommissionReportReviewCapture {
  constructor(private readonly page: Page) {}

  /** Cached scrollLeft where each col-id was last seen mounted. */
  private readonly colScrollLeft = new Map<string, number>();

  private reviewDataRows(): Locator {
    return this.page.locator('.ag-center-cols-container .ag-row');
  }

  /** Horizontal scroll positions — must yield between steps so AG Grid can mount virtualized cols. */
  private async reviewGridHorizontalScrollPositions(): Promise<number[]> {
    return this.page.evaluate(() => {
      const viewport = document.querySelector(
        '.ag-center-cols-viewport, .ag-body-horizontal-scroll-viewport',
      ) as HTMLElement | null;
      if (!viewport) return [0];
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      // Smaller steps so virtualized cols like Gross Comm are not skipped.
      const step = Math.max(100, Math.floor(viewport.clientWidth * 0.35));
      const positions: number[] = [];
      for (let x = 0; x <= max; x += step) positions.push(x);
      if (positions[positions.length - 1] !== max) positions.push(max);
      // Sweep back toward start — some grids only mount on reverse scroll.
      for (let x = max; x >= 0; x -= step) positions.push(Math.max(0, x));
      return positions;
    });
  }

  private async scrollReviewGridToLeft(left: number): Promise<void> {
    await this.page.evaluate((scrollLeft) => {
      const viewports = document.querySelectorAll(
        '.ag-center-cols-viewport, .ag-body-horizontal-scroll-viewport',
      );
      for (const vp of Array.from(viewports)) {
        if (!(vp instanceof HTMLElement)) continue;
        const max = Math.max(0, vp.scrollWidth - vp.clientWidth);
        vp.scrollLeft = Math.min(max, Math.max(0, scrollLeft));
        vp.dispatchEvent(new Event('scroll'));
      }
    }, left);
    await this.page.waitForTimeout(150);
  }

  private collectVisibleHeaderLabels(): Promise<string[]> {
    return this.page.evaluate(() => {
      const labels = new Set<string>();
      for (const el of Array.from(document.querySelectorAll('.ag-header-cell-text'))) {
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t) labels.add(t);
      }
      for (const el of Array.from(document.querySelectorAll('[role="columnheader"]'))) {
        const t = (el.textContent || '').replace(/\s+/g, ' ').trim().replace(/[^\w\s%/$-]/g, '');
        if (t && !/^row no$/i.test(t)) labels.add(t);
      }
      return [...labels];
    });
  }

  private matchHeaderColIdInDom(aliases: string[]): Promise<{ colId: string; score: number } | null> {
    return this.page.evaluate((names: string[]) => {
      const cells = Array.from(document.querySelectorAll('.ag-header-cell'));
      type Hit = { colId: string; score: number };
      const hits: Hit[] = [];
      for (const cell of cells) {
        const label = (
          cell.querySelector('.ag-header-cell-text')?.textContent ||
          cell.textContent ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        if (!label) continue;
        const colId = cell.getAttribute('col-id') || cell.getAttribute('data-col-id');
        if (!colId) continue;
        for (const n of names) {
          if (label === n) hits.push({ colId, score: 100 + n.length });
          else if (label.startsWith(n) || n.startsWith(label)) hits.push({ colId, score: 50 + n.length });
          else if (label.includes(n) && n.length >= 5) hits.push({ colId, score: 20 + n.length });
        }
      }
      hits.sort((a, b) => b.score - a.score);
      return hits[0] ?? null;
    }, aliases);
  }

  /**
   * One horizontal sweep: collect all header labels and resolve every field col-id.
   * Must yield between scroll positions — a single evaluate() sweep never remounts
   * AG Grid virtualized columns, which left grossComm/totalMembers/etc as null.
   */
  private async resolveAllReviewColumns(): Promise<{
    headers: string[];
    colIds: Record<keyof typeof COMMISSION_REPORT.reviewColumnAliases, string | null>;
  }> {
    this.colScrollLeft.clear();
    const fieldKeys = Object.keys(
      COMMISSION_REPORT.reviewColumnAliases,
    ) as (keyof typeof COMMISSION_REPORT.reviewColumnAliases)[];
    const best = new Map<string, { colId: string; score: number; left: number }>();
    const labels = new Set<string>();
    const positions = await this.reviewGridHorizontalScrollPositions();

    for (const left of positions) {
      await this.scrollReviewGridToLeft(left);
      for (const label of await this.collectVisibleHeaderLabels()) labels.add(label);

      for (const fieldKey of fieldKeys) {
        const aliases = [...COMMISSION_REPORT.reviewColumnAliases[fieldKey]];
        const hit = await this.matchHeaderColIdInDom(aliases);
        if (!hit) continue;
        const prev = best.get(fieldKey);
        if (!prev || hit.score > prev.score) {
          best.set(fieldKey, { ...hit, left });
          this.colScrollLeft.set(hit.colId, left);
        }
      }
    }

    await this.scrollReviewGridToLeft(0);

    const colIds = {
      policyNumber: best.get('policyNumber')?.colId ?? null,
      totalMembers: best.get('totalMembers')?.colId ?? null,
      issueDate: best.get('issueDate')?.colId ?? null,
      paidToDate: best.get('paidToDate')?.colId ?? null,
      grossComm: best.get('grossComm')?.colId ?? null,
      chargeback: best.get('chargeback')?.colId ?? null,
    };

    // Gross Comm / Chargeback are often far right — dedicated reverse sweep if missing.
    for (const field of ['grossComm', 'chargeback'] as const) {
      if (colIds[field]) continue;
      const positions = await this.reviewGridHorizontalScrollPositions();
      for (const left of positions.slice().reverse()) {
        await this.scrollReviewGridToLeft(left);
        const hit = await this.matchHeaderColIdInDom([
          ...COMMISSION_REPORT.reviewColumnAliases[field],
        ]);
        if (hit) {
          best.set(field, { ...hit, left });
          this.colScrollLeft.set(hit.colId, left);
          colIds[field] = hit.colId;
          break;
        }
      }
    }

    return { headers: [...labels], colIds };
  }

  private async ensureReviewColumnMounted(colId: string): Promise<void> {
    const cached = this.colScrollLeft.get(colId);
    if (cached !== undefined) {
      await this.scrollReviewGridToLeft(cached);
      const found = await this.page.evaluate((id) => {
        return !!document.querySelector(`.ag-header-cell[col-id="${id}"], .ag-cell[col-id="${id}"]`);
      }, colId);
      if (found) return;
    }

    const positions = await this.reviewGridHorizontalScrollPositions();
    for (const left of positions) {
      await this.scrollReviewGridToLeft(left);
      const found = await this.page.evaluate((id) => {
        return !!document.querySelector(`.ag-header-cell[col-id="${id}"], .ag-cell[col-id="${id}"]`);
      }, colId);
      if (found) {
        this.colScrollLeft.set(colId, left);
        return;
      }
    }
  }

  private async readReviewCellByColId(
    row: Locator,
    colId: string | null,
    rowIndex?: number,
  ): Promise<string> {
    if (!colId) return '';
    await this.ensureReviewColumnMounted(colId);

    const cell = row.locator(`[col-id="${colId}"], [role="gridcell"][col-id="${colId}"]`).first();
    if ((await cell.count()) > 0) {
      const text = (await cell.innerText()).replace(/\s+/g, ' ').trim();
      if (text) return text;
    }

    // Pinned left/right rows share row-index but live outside center container.
    if (rowIndex !== undefined) {
      const fromAnyContainer = await this.page.evaluate(
        ({ id, index }) => {
          const rows = Array.from(document.querySelectorAll(`.ag-row[row-index="${index}"]`));
          for (const r of rows) {
            const el = r.querySelector(`[col-id="${id}"]`) as HTMLElement | null;
            if (!el) continue;
            const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
            if (t) return t;
          }
          return '';
        },
        { id: colId, index: rowIndex },
      );
      if (fromAnyContainer) return fromAnyContainer;
    }

    return '';
  }

  private async isSkipBackgroundRow(row: Locator): Promise<boolean> {
    return row.evaluate((el, hex) => {
      const target = hex.toLowerCase();
      const rgbTarget = 'rgb(239, 68, 68)';
      const walk = (node: Element): boolean => {
        const style = window.getComputedStyle(node);
        const bg = (style.backgroundColor || '').toLowerCase().replace(/\s+/g, ' ');
        if (bg.includes(rgbTarget) || bg.includes('239, 68, 68')) return true;
        const inline = (node.getAttribute('style') || '').toLowerCase();
        if (inline.includes(target) || inline.includes('ef4444')) return true;
        const cls = (node.getAttribute('class') || '').toLowerCase();
        if (cls.includes('ef4444') || cls.includes('destructive') || cls.includes('bg-red')) {
          return true;
        }
        for (const child of Array.from(node.children)) {
          if (walk(child)) return true;
        }
        return false;
      };
      return walk(el);
    }, COMMISSION_REPORT.skipRowBackgroundHex);
  }

  private async scrollReviewGridToRow(index: number): Promise<void> {
    await this.page.evaluate((rowIndex) => {
      const viewport = document.querySelector(
        '.ag-body-viewport, .ag-center-cols-viewport',
      ) as HTMLElement | null;
      if (viewport) {
        viewport.scrollTop = rowIndex * 42;
        viewport.dispatchEvent(new Event('scroll'));
      }
    }, index);
    await this.page.waitForTimeout(150);
  }

  async captureReviewLineItems(): Promise<ReviewLineCapture[]> {
    const grid = this.page
      .getByTestId('review-statement-grid')
      .or(this.page.getByRole('grid', { name: 'Data grid' }))
      .or(this.page.locator('.ag-root-wrapper').first());
    await expect(grid.first()).toBeVisible({ timeout: T });
    // Let AG Grid finish column virtualization before the header sweep.
    await this.page.waitForTimeout(500);

    let { headers, colIds } = await this.resolveAllReviewColumns();
    if (!colIds.grossComm) {
      console.log('[print-captured-data] grossComm missing — retrying column resolve');
      await this.page.waitForTimeout(800);
      ({ headers, colIds } = await this.resolveAllReviewColumns());
    }
    console.log('[print-captured-data] review-headers', JSON.stringify(headers));
    console.log('[print-captured-data] review-col-ids', JSON.stringify(colIds));
    if (!colIds.grossComm) {
      throw new Error(
        `Gross Comm column not resolved after horizontal sweep. Headers seen: ${headers.join(' | ')}`,
      );
    }

    const captures: ReviewLineCapture[] = [];

    const footer = this.page.getByTestId('data-grid-record-count-footer');
    const footerText = (await footer.textContent().catch(() => '')) ?? '';
    const footerCount = Number.parseInt(footerText.match(/(\d+)\s*records?/i)?.[1] ?? '', 10);
    const statusText =
      (await this.page.getByRole('status').first().textContent().catch(() => '')) ?? '';
    const statusCount = Number.parseInt(statusText.match(/(\d+)\s*rows?/i)?.[1] ?? '', 10);
    const total =
      Number.isFinite(footerCount) && footerCount > 0
        ? footerCount
        : Number.isFinite(statusCount) && statusCount > 0
          ? statusCount
          : await this.reviewDataRows().count();

    for (let index = 0; index < total; index++) {
      await this.scrollReviewGridToRow(index);
      await this.scrollReviewGridToLeft(0);

      const row = this.page
        .locator(`.ag-center-cols-container .ag-row[row-index="${index}"]`)
        .first();
      const rowFallback = this.reviewDataRows().nth(index);
      const target = (await row.count()) > 0 ? row : rowFallback;

      if (!(await target.isVisible().catch(() => false))) {
        captures.push({
          rowIndex: index,
          policyNumber: '',
          totalMembers: 0,
          issueDate: '',
          paidToDate: '',
          grossComm: 0,
          chargeback: '',
          skipped: true,
          skipReason: 'row not visible in review grid',
        });
        continue;
      }

      let policyNumber = await this.readReviewCellByColId(target, colIds.policyNumber, index);
      let totalMembers = parseMoney(
        await this.readReviewCellByColId(target, colIds.totalMembers, index),
      );
      let issueDate = await this.readReviewCellByColId(target, colIds.issueDate, index);
      let paidToDate = await this.readReviewCellByColId(target, colIds.paidToDate, index);
      let grossComm = parseMoney(await this.readReviewCellByColId(target, colIds.grossComm, index));
      const chargeback = await this.readReviewCellByColId(target, colIds.chargeback, index);

      if (!policyNumber) {
        const rowText = await this.page.evaluate((rowIndex) => {
          const rows = Array.from(document.querySelectorAll(`.ag-row[row-index="${rowIndex}"]`));
          return rows.map((r) => (r.textContent || '').replace(/\s+/g, ' ').trim()).join(' ');
        }, index);
        policyNumber = extractPolicyNumberFallback(rowText);
      }

      if (!grossComm || !totalMembers || !issueDate || !paidToDate) {
        if (!totalMembers) {
          totalMembers = parseMoney(
            await this.readReviewCellByColId(target, colIds.totalMembers, index),
          );
        }
        if (!issueDate) {
          issueDate = await this.readReviewCellByColId(target, colIds.issueDate, index);
        }
        if (!paidToDate) {
          paidToDate = await this.readReviewCellByColId(target, colIds.paidToDate, index);
        }
        if (!grossComm) {
          grossComm = parseMoney(
            await this.readReviewCellByColId(target, colIds.grossComm, index),
          );
        }
      }

      const redBg = await this.isSkipBackgroundRow(target);

      if (redBg) {
        captures.push({
          rowIndex: index,
          policyNumber,
          totalMembers,
          issueDate,
          paidToDate,
          grossComm,
          chargeback,
          skipped: true,
          skipReason: 'row background #ef4444',
        });
        continue;
      }

      if (!colIds.grossComm) {
        captures.push({
          rowIndex: index,
          policyNumber,
          totalMembers,
          issueDate,
          paidToDate,
          grossComm,
          chargeback,
          skipped: true,
          skipReason: 'gross commission column not resolved',
        });
        continue;
      }

      if (grossComm === 0) {
        captures.push({
          rowIndex: index,
          policyNumber,
          totalMembers,
          issueDate,
          paidToDate,
          grossComm,
          chargeback,
          skipped: true,
          skipReason: 'gross commission is zero',
        });
        continue;
      }

      if (colIds.chargeback && isNonEmptyChargeback(chargeback)) {
        captures.push({
          rowIndex: index,
          policyNumber,
          totalMembers,
          issueDate,
          paidToDate,
          grossComm,
          chargeback,
          skipped: true,
          skipReason: 'chargeback cell is not empty',
        });
        continue;
      }

      captures.push({
        rowIndex: index,
        policyNumber,
        totalMembers,
        issueDate,
        paidToDate,
        grossComm,
        chargeback,
        skipped: false,
      });
    }

    console.log('[print-captured-data] review-lines', JSON.stringify(captures, null, 2));
    return captures;
  }
}
