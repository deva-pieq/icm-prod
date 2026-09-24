import { expect, type Page } from '@playwright/test';
import { AppUrlPatterns } from '../appPaths';
import { StatementUploadPage } from './StatementUploadPage';
import {
  PolicyCommissionReportPage,
  type PolicyAgentCommissionCapture,
  type PolicyAllRolesCommissionCapture,
} from '../policies/PolicyCommissionReportPage';
import { CommissionReportReviewCapture } from './CommissionReportReviewCapture';
import { COMMISSION_REPORT } from '../../test-data/commission-report/validateCommissionReport';
import {
  addCommissionReportLineItem,
  clearCommissionReportLineItems,
  getActiveCommissionReportLineItems,
  getCommissionReportLineItems,
  getCommissionReportPreparedFile,
  getCommissionReportUploadState,
  setCommissionReportUploadState,
  type CommissionReportLineItem,
} from '../../utils/commission-report/commissionReportContext';
import {
  addCommissionReportAllLineItem,
  clearCommissionReportAllLineItems,
  getActiveCommissionReportAllLineItems,
  getCommissionReportAllLineItems,
  type CommissionHierarchyRole,
  type CommissionReportAllLineItem,
} from '../../utils/commission-report/commissionReportAllContext';
import { toCommissionReportPreparedFile } from '../../utils/commission-report/toCommissionReportPreparedFile';
import {
  appendCommissionReportLine,
  finalizeCommissionReportCsv,
  rewriteCommissionReportCsv,
  writeCommissionReportCsvSkeleton,
} from '../../utils/commission-report/commissionReportCsvWriter';
import {
  appendCommissionReportAllLine,
  finalizeCommissionReportAllCsv,
  rewriteCommissionReportAllCsv,
  writeCommissionReportAllCsvSkeleton,
} from '../../utils/commission-report/commissionReportAllCsvWriter';
import {
  calendarMonthsBetween,
  resolveCommissionPeriodTab,
} from '../../utils/commission-report/monthDiff';
import { debugLogFileIdCaptured } from '../../utils/debugSteps';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';

const T = smokeStepTimeoutMs;
const LOG_PREFIX = '[validate-commission-report]';
const LOG_PREFIX_ALL = '[validate-commission-report-all]';

export class CommissionReportValidationPage extends StatementUploadPage {
  readonly policies: PolicyCommissionReportPage;
  readonly reviewCapture: CommissionReportReviewCapture;

  constructor(page: Page) {
    super(page);
    this.policies = new PolicyCommissionReportPage(page);
    this.reviewCapture = new CommissionReportReviewCapture(page);
  }

  prepareFromContext(): void {
    this.setPreparedFile(toCommissionReportPreparedFile());
  }

  async uploadPreparedCommissionReportFile(): Promise<void> {
    await this.uploadFromPrepared(toCommissionReportPreparedFile());
  }

  /** @deprecated Prefer uploadPreparedCommissionReportFile */
  async uploadPreparedCommissionReportCsv(): Promise<void> {
    await this.uploadPreparedCommissionReportFile();
  }

  async selectPreparedStatementType(): Promise<void> {
    const { statementType } = getCommissionReportPreparedFile();
    await this.selectStatementType(statementType);
  }

  async expectUploadedFileInGrid(): Promise<void> {
    const file = this.getPreparedFile();
    const row = await this.findStoredRowByFileName(file.fileName, T * 2);
    await expect(row).toBeVisible({ timeout: T });
    const fileNameCell = await this.readCellText(row, COMMISSION_REPORT.gridColumns.fileName);
    expect(fileNameCell).toContain(file.fileName);
  }

  async captureUploadAfterExtractPoll(uploadedByEmail: string) {
    const file = this.getPreparedFile();
    const prepared = getCommissionReportPreparedFile();
    const displayName = await this.readUploaderDisplayName();
    const loginTag =
      displayName || uploadedByEmail.split('@')[0]?.trim() || uploadedByEmail;

    const row = await this.findStoredRowByFileName(file.fileName, T * 2);
    const uploadedCell = await this.readCellText(row, COMMISSION_REPORT.gridColumns.uploaded);
    const rowText = await row.innerText();
    expect(
      uploadedCell.toLowerCase().includes(loginTag.toLowerCase()) ||
        rowText.toLowerCase().includes(loginTag.toLowerCase()),
    ).toBeTruthy();

    const initialFileId = await this.readFileIdFromRow(row);
    this.setStoredRow({
      row,
      fileId: initialFileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });

    const fileId = await this.assertions.pollUntilUploadReviewReady(
      file.fileName,
      COMMISSION_REPORT.expectedAfterExtract.status,
      COMMISSION_REPORT.expectedAfterExtract.stage,
      {
        maxAttempts: COMMISSION_REPORT.uploadPoll.maxAttempts,
        intervalMs: COMMISSION_REPORT.uploadPoll.intervalMs,
      },
      initialFileId,
    );
    debugLogFileIdCaptured(fileId, 'commission-report-upload');

    const stored = {
      row,
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    };
    this.setStoredRow(stored);
    setCommissionReportUploadState({
      fileId,
      fileName: file.fileName,
      uploadedByTag: loginTag,
      statementType: prepared.statementType,
    });
    return stored;
  }

  async expectUploadStatusAndStage(status: string, stage: string): Promise<void> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    const fileId = await this.assertions.expectStoredUploadStatusAndStage(
      fileName,
      status,
      stage,
      stored?.fileId,
    );
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
      setCommissionReportUploadState({ ...getCommissionReportUploadState(), fileId });
    }
  }

  protected getKnownStoredFileId(): string {
    const fromRow = this.getStoredRow()?.fileId;
    if (fromRow) return fromRow;
    try {
      return getCommissionReportUploadState().fileId;
    } catch {
      return '';
    }
  }

  async openReviewForUploadedFile(): Promise<void> {
    await this.openReviewForStoredUpload();
    const fileId = this.review.getFileIdFromUrl();
    if (fileId) {
      setCommissionReportUploadState({ ...getCommissionReportUploadState(), fileId });
    }
  }

  async expectReviewUrlContainsFileId(): Promise<void> {
    const { fileId } = getCommissionReportUploadState();
    await this.review.assertions.expectUrlContainsFileId(fileId);
  }

  async expectReviewPageHeading(title: string): Promise<void> {
    await this.review.expectHeading(title);
  }

  async completeReviewAndConfirm(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async ensureOnReviewThenComplete(): Promise<void> {
    if (!AppUrlPatterns.commissionReview.test(this.page.url())) {
      await this.openReviewForUploadedFile();
    }
    await this.completeReviewAndConfirm();
  }

  async expectSuccessToast(): Promise<void> {
    await this.review.expectSuccessToastVisible();
  }

  async expectUploadStageCompleted(): Promise<void> {
    const stored = this.getStoredRow();
    const fileName = stored?.fileName ?? this.getPreparedFile().fileName;
    // Give the upload grid time to remount after Complete Review before polling.
    await this.page.waitForTimeout(COMMISSION_REPORT.uploadPoll.completedIntervalMs);
    await this.ensureOnUploadPage();
    await waitForAppSettled(this.page, T);
    const fileId = await this.assertions.pollUntilStageCompleted(
      fileName,
      {
        maxAttempts: COMMISSION_REPORT.uploadPoll.completedMaxAttempts,
        intervalMs: COMMISSION_REPORT.uploadPoll.completedIntervalMs,
      },
      stored?.fileId,
    );
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    if (stored) {
      this.setStoredRow({ ...stored, row, fileId });
    }
    setCommissionReportUploadState({ ...getCommissionReportUploadState(), fileId });
  }

  /**
   * Reuse policy hierarchy captures for duplicate statement lines (same policy + period).
   * Prevents reopening the policy and accidentally reading the wrong period panel on revisit.
   */
  private async resolveAgentCommissionForPolicyPeriod(
    policyNumber: string,
    period: 'M1-12' | 'M13-No Limit',
    cache: Map<string, PolicyAgentCommissionCapture>,
  ): Promise<PolicyAgentCommissionCapture> {
    const key = `${policyNumber}|${period}`;
    const cached = cache.get(key);
    if (cached) {
      console.log(`${LOG_PREFIX} policy-period cache hit key=${key}`);
      return cached;
    }
    await this.policies.searchAndOpenPolicy(policyNumber);
    const capture = await this.policies.captureAgentCommissionForPeriod(period);
    cache.set(key, capture);
    return capture;
  }

  private async resolveAllRolesCommissionForPolicyPeriod(
    policyNumber: string,
    period: 'M1-12' | 'M13-No Limit',
    cache: Map<string, PolicyAllRolesCommissionCapture>,
  ): Promise<PolicyAllRolesCommissionCapture> {
    const key = `${policyNumber}|${period}`;
    const cached = cache.get(key);
    if (cached) {
      console.log(`${LOG_PREFIX_ALL} policy-period cache hit key=${key}`);
      return cached;
    }
    await this.policies.searchAndOpenPolicy(policyNumber);
    const capture = await this.policies.captureAllRoleCommissionsForPeriod(period);
    cache.set(key, capture);
    return capture;
  }

  /**
   * 1) Capture ALL review line items while still on Review (do not leave mid-grid).
   * 2) For each active line, open policy → Agent row % (Split) + $ → append CSV.
   *    commissionFromReport / result stay blank until View Commission Report.
   * 3) Do NOT reopen Review between policies — review data is already in memory.
   *    Complete Review runs in a later step via ensureOnReviewThenComplete.
   */
  async captureReviewAndPolicyCommissionData(): Promise<void> {
    clearCommissionReportLineItems();
    const prepared = getCommissionReportPreparedFile();
    writeCommissionReportCsvSkeleton(prepared.reportSheetPath);

    // Phase 1 — harvest every review row before leaving the page
    const reviewLines = await this.reviewCapture.captureReviewLineItems();
    console.log(
      `${LOG_PREFIX} review lines captured=${reviewLines.length} ` +
        `active=${reviewLines.filter((r) => !r.skipped).length}`,
    );

    // Phase 2 — policy Agent split for each active line (no mid-loop return to review)
    const agentPeriodCache = new Map<string, PolicyAgentCommissionCapture>();
    let lineItem = 0;

    for (const review of reviewLines) {
      if (review.skipped) {
        addCommissionReportLineItem({
          lineItem: review.rowIndex + 1,
          policyNumber: review.policyNumber,
          productName: '',
          grossCommission: review.grossComm,
          totalMembers: review.totalMembers,
          issueDate: review.issueDate,
          paidToDate: review.paidToDate,
          monthDiff: 0,
          commissionAmount: 0,
          agentName: '',
          splitPercentage: 0,
          agentValue: 0,
          valueTimesMembers: 0,
          commissionFromReport: null,
          result: '',
          skipped: true,
          skipReason: review.skipReason,
        });
        continue;
      }

      if (!review.policyNumber) {
        addCommissionReportLineItem({
          lineItem: review.rowIndex + 1,
          policyNumber: review.policyNumber,
          productName: '',
          grossCommission: review.grossComm,
          totalMembers: review.totalMembers,
          issueDate: review.issueDate,
          paidToDate: review.paidToDate,
          monthDiff: 0,
          commissionAmount: 0,
          agentName: '',
          splitPercentage: 0,
          agentValue: 0,
          valueTimesMembers: 0,
          commissionFromReport: null,
          result: '',
          skipped: true,
          skipReason: 'missing policy number',
        });
        continue;
      }

      // Blank / missing Total Members (e.g. Life statements) → treat as 1 in calc.
      const totalMembers = review.totalMembers > 0 ? review.totalMembers : 1;
      const commissionAmount = review.grossComm / totalMembers;

      const issueDate = review.issueDate.trim();
      const paidToDate = review.paidToDate.trim() || issueDate;
      if (!issueDate) {
        addCommissionReportLineItem({
          lineItem: review.rowIndex + 1,
          policyNumber: review.policyNumber,
          productName: '',
          grossCommission: review.grossComm,
          totalMembers,
          issueDate: review.issueDate,
          paidToDate: review.paidToDate,
          monthDiff: 0,
          commissionAmount: 0,
          agentName: '',
          splitPercentage: 0,
          agentValue: 0,
          valueTimesMembers: 0,
          commissionFromReport: null,
          result: '',
          skipped: true,
          skipReason: 'missing issue date',
        });
        continue;
      }

      const monthDiff = calendarMonthsBetween(issueDate, paidToDate);
      const period = resolveCommissionPeriodTab(monthDiff);

      console.log(
        `${LOG_PREFIX} policy=${review.policyNumber} gross=${review.grossComm} members=${totalMembers}` +
          `${review.totalMembers > 0 ? '' : ' (defaulted from blank)'} ` +
          `commAmt=${commissionAmount.toFixed(4)} monthDiff=${monthDiff} period=${period}`,
      );

      const agentCapture = await this.resolveAgentCommissionForPolicyPeriod(
        review.policyNumber,
        period,
        agentPeriodCache,
      );
      // Policy structure $ is tied to whatever commission amount is loaded on the policy
      // (one value per policy). Duplicate statement lines share that policy, so derive
      // expected Agent value from this line's commission × Agent split % instead.
      const agentValue =
        Math.round(commissionAmount * (agentCapture.splitPercentage / 100) * 100) / 100;
      const valueTimesMembers =
        Math.round(agentValue * totalMembers * 100) / 100;

      lineItem += 1;
      const item: CommissionReportLineItem = {
        lineItem,
        policyNumber: review.policyNumber,
        productName: agentCapture.productName,
        grossCommission: review.grossComm,
        totalMembers,
        issueDate,
        paidToDate,
        monthDiff,
        commissionAmount,
        agentName: agentCapture.agentName,
        splitPercentage: agentCapture.splitPercentage,
        agentValue,
        valueTimesMembers,
        // Filled later from View Commission Report after Complete → Completed
        commissionFromReport: null,
        result: '',
        skipped: false,
      };

      console.log('[print-captured-data] line-item', JSON.stringify(item, null, 2));
      addCommissionReportLineItem(item);
      appendCommissionReportLine(prepared.reportSheetPath, item);
    }

    rewriteCommissionReportCsv(prepared.reportSheetPath, getCommissionReportLineItems());

    const active = getActiveCommissionReportLineItems();
    expect(
      active.length,
      'No active review lines captured for commission report validation',
    ).toBeGreaterThan(0);
  }

  async returnToUploadAndOpenCommissionReport(): Promise<void> {
    await this.ensureOnUploadPage();
    await waitForAppSettled(this.page, T);

    const { fileId, fileName } = getCommissionReportUploadState();
    const row = await this.resolveStoredUploadRow({ fileId, fileName });
    await row.scrollIntoViewIfNeeded();
    await row.hover();

    const actions = row
      .locator(
        '[data-testid*="actions"], [data-testid*="kebab"], button[aria-haspopup="menu"], button:has(svg)',
      )
      .last();
    await expect(actions).toBeVisible({ timeout: T });
    await actions.click({ force: true });

    const menuItem = this.page
      .getByRole('menuitem', { name: /view commission report/i })
      .or(this.page.getByRole('button', { name: /view commission report/i }))
      .or(this.page.getByText(/view commission report/i))
      .first();
    await expect(menuItem).toBeVisible({ timeout: T });
    await menuItem.click();
    await waitForAppSettled(this.page, T);

    // Live app navigates to a full statement commission-report page (not a modal).
    await expect(
      this.page.getByText(/File-level commission splits/i).or(
        this.page.getByRole('heading', { name: /\.(csv|xlsx)$/i }),
      ).first(),
    ).toBeVisible({ timeout: T });
    await expect(this.page.getByRole('grid', { name: 'Data grid' })).toBeVisible({ timeout: T });
  }

  /**
   * For each prepared line, search the commission report by policy, find the Agent row,
   * capture Agent Split Amount into commissionFromReport + result.
   */
  async fillCommissionFromReportIntoCsv(): Promise<void> {
    const prepared = getCommissionReportPreparedFile();
    const items = getActiveCommissionReportLineItems();

    await expect(
      this.page.getByText(/File-level commission splits/i).or(
        this.page.getByRole('grid', { name: 'Data grid' }),
      ).first(),
    ).toBeVisible({ timeout: T });

    for (const item of items) {
      const agentSplit = await this.captureRoleSplitAmountForPolicy(
        item.policyNumber,
        item.grossCommission,
        'Agent',
      );
      item.commissionFromReport = agentSplit;
      item.result =
        Math.abs(agentSplit - item.valueTimesMembers) <= COMMISSION_REPORT.commissionTolerance
          ? 'TRUE'
          : 'FALSE';

      console.log(
        `${LOG_PREFIX} policy=${item.policyNumber} gross=${item.grossCommission.toFixed(2)} ` +
          `expected=${item.valueTimesMembers.toFixed(2)} report=${agentSplit.toFixed(2)} result=${item.result}`,
      );
    }

    rewriteCommissionReportCsv(prepared.reportSheetPath, getCommissionReportLineItems());
  }

  /**
   * Search commission report by policy, then pick the given Role row whose Commission Amount
   * matches this line's gross (duplicate policies share a search result set).
   */
  private async captureRoleSplitAmountForPolicy(
    policyNumber: string,
    grossCommission: number,
    role: CommissionHierarchyRole,
  ): Promise<number> {
    const search = this.page
      .getByRole('textbox', { name: /search data grid/i })
      .or(this.page.locator('input[placeholder*="Search by policy" i]'))
      .or(this.page.getByTestId('data-grid-search-input').locator('input'))
      .first();
    await expect(search).toBeVisible({ timeout: T });
    await search.fill('');
    await search.fill(policyNumber);
    await waitForAppSettled(this.page, T);
    await this.page.waitForTimeout(800);

    // Mount right-side columns (Role / Split Amount / Commission Amount) via horizontal sweep.
    await this.page.evaluate(() => {
      const viewport = document.querySelector('.ag-center-cols-viewport') as HTMLElement | null;
      if (!viewport) return;
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      for (const left of [0, max / 2, max]) {
        viewport.scrollLeft = left;
        viewport.dispatchEvent(new Event('scroll'));
      }
      viewport.scrollLeft = max;
      viewport.dispatchEvent(new Event('scroll'));
    });
    await this.page.waitForTimeout(300);

    const rolePattern =
      role === 'Sales Leader'
        ? '^sales\\s*leader$'
        : role === 'Agency'
          ? '^agency$'
          : '^agent$';

    const amount = await this.page.evaluate(
      ({ gross, tolerance, roleRe }) => {
        const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
        const parseAmt = (value: string): number => {
          const n = Number.parseFloat(value.replace(/[$,\s]/g, ''));
          return Number.isFinite(n) ? n : NaN;
        };
        const near = (a: number, b: number) => Math.abs(a - b) <= tolerance;
        const roleMatcher = new RegExp(roleRe, 'i');

        const grids = Array.from(document.querySelectorAll('[role="grid"]')) as HTMLElement[];
        type Candidate = { split: number; commission: number | null; matchedGross: boolean };
        const candidates: Candidate[] = [];

        for (const grid of grids) {
          const headers = Array.from(grid.querySelectorAll('[role="columnheader"]')).map((h) =>
            normalize(h.textContent ?? '').toLowerCase(),
          );
          const roleIdx = headers.findIndex((h) => h === 'role');
          const splitIdx = headers.findIndex(
            (h) => h.includes('split amount') || h === 'split' || h === 'agent split',
          );
          // Prefer specific commission/gross headers over bare "amount".
          const commissionAliases: Array<{ test: (h: string) => boolean; score: number }> = [
            { test: (h) => h.includes('commission amount'), score: 100 },
            { test: (h) => h.includes('gross comm'), score: 90 },
            { test: (h) => h === 'gross commission', score: 90 },
            { test: (h) => h === 'earned commission', score: 80 },
            { test: (h) => h === 'amount', score: 40 },
          ];
          let commissionIdx = -1;
          let bestScore = -1;
          headers.forEach((h, idx) => {
            for (const alias of commissionAliases) {
              if (alias.test(h) && alias.score > bestScore) {
                bestScore = alias.score;
                commissionIdx = idx;
              }
            }
          });
          const rows = Array.from(grid.querySelectorAll('[role="row"]')).filter(
            (row) => !row.querySelector('[role="columnheader"]'),
          ) as HTMLElement[];

          // Hierarchy grids often put Commission Amount on a parent row; role rows inherit
          // the last-seen amount while walking top → bottom.
          let lastCommission: number | null = null;

          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('[role="gridcell"]')).map((c) =>
              normalize(c.textContent || ''),
            );

            if (commissionIdx >= 0 && cells[commissionIdx]) {
              const n = parseAmt(cells[commissionIdx]!);
              if (Number.isFinite(n)) lastCommission = n;
            } else {
              for (const cell of cells) {
                const n = parseAmt(cell);
                if (Number.isFinite(n) && near(n, gross)) {
                  lastCommission = n;
                  break;
                }
              }
            }

            const roleText =
              roleIdx >= 0
                ? cells[roleIdx] ?? ''
                : cells.find((c) => /^(agency|sales\s*leader|agent|sub\s*agent)$/i.test(c)) ?? '';
            if (!roleMatcher.test(roleText)) continue;

            const commission = lastCommission;
            let split = NaN;
            if (splitIdx >= 0 && cells[splitIdx]) {
              split = parseAmt(cells[splitIdx]!);
            }
            if (!Number.isFinite(split)) {
              const moneyCells = cells.map(parseAmt).filter((n) => Number.isFinite(n));
              const filtered =
                commission !== null
                  ? moneyCells.filter((n) => !near(n, commission))
                  : moneyCells;
              split = (filtered.length > 0 ? filtered : moneyCells).at(-1) ?? NaN;
            }
            if (!Number.isFinite(split)) continue;

            candidates.push({
              split,
              commission,
              matchedGross: commission !== null && near(commission, gross),
            });
          }
        }

        const matched = candidates.filter((c) => c.matchedGross);
        if (matched.length >= 1) return matched[0]!.split;
        if (candidates.length === 1) return candidates[0]!.split;
        return { error: 'no-match', gross, roleRe, candidates };
      },
      {
        gross: grossCommission,
        tolerance: COMMISSION_REPORT.commissionTolerance,
        roleRe: rolePattern,
      },
    );

    if (typeof amount === 'number' && Number.isFinite(amount)) {
      console.log(
        `${LOG_PREFIX} report-role-split policy=${policyNumber} role=${role} ` +
          `gross=${grossCommission.toFixed(2)} splitAmount=${amount.toFixed(2)}`,
      );
      return amount;
    }

    throw new Error(
      `Could not capture ${role} Split Amount for policy ${policyNumber} gross=${grossCommission.toFixed(2)} ` +
        `(match Role=${role} + Commission Amount ≈ gross). Detail: ${JSON.stringify(amount)}`,
    );
  }

  async writeAndAssertCommissionReportCsv(): Promise<void> {
    const prepared = getCommissionReportPreparedFile();
    const items = getCommissionReportLineItems();
    finalizeCommissionReportCsv(prepared.reportSheetPath, items);

    const active = getActiveCommissionReportLineItems();
    expect(active.length).toBeGreaterThan(0);
    for (const item of active) {
      expect(
        item.result,
        `Policy ${item.policyNumber}: report=${item.commissionFromReport} expected=${item.valueTimesMembers}`,
      ).toBe('TRUE');
    }

    console.log(`${LOG_PREFIX} report sheet written: ${prepared.reportSheetPath}`);
  }

  /**
   * Same review capture as Agent-only, but policy hierarchy captures Agency + Sales Leader + Agent.
   * Writes commission-report-all-{timestamp}.csv with a Role column (3 rows per line item).
   */
  async captureReviewAndPolicyAllRolesCommissionData(): Promise<void> {
    clearCommissionReportAllLineItems();
    const prepared = getCommissionReportPreparedFile();
    writeCommissionReportAllCsvSkeleton(prepared.reportSheetPath);

    const reviewLines = await this.reviewCapture.captureReviewLineItems();
    console.log(
      `${LOG_PREFIX_ALL} review lines captured=${reviewLines.length} ` +
        `active=${reviewLines.filter((r) => !r.skipped).length}`,
    );

    const allRolesPeriodCache = new Map<string, PolicyAllRolesCommissionCapture>();
    let lineItem = 0;

    for (const review of reviewLines) {
      if (review.skipped) {
        continue;
      }

      if (!review.policyNumber) {
        continue;
      }

      const totalMembers = review.totalMembers > 0 ? review.totalMembers : 1;
      const commissionAmount = review.grossComm / totalMembers;

      const issueDate = review.issueDate.trim();
      const paidToDate = review.paidToDate.trim() || issueDate;
      if (!issueDate) {
        continue;
      }

      const monthDiff = calendarMonthsBetween(issueDate, paidToDate);
      const period = resolveCommissionPeriodTab(monthDiff);

      console.log(
        `${LOG_PREFIX_ALL} policy=${review.policyNumber} gross=${review.grossComm} members=${totalMembers}` +
          `${review.totalMembers > 0 ? '' : ' (defaulted from blank)'} ` +
          `commAmt=${commissionAmount.toFixed(4)} monthDiff=${monthDiff} period=${period}`,
      );

      const allRoles = await this.resolveAllRolesCommissionForPolicyPeriod(
        review.policyNumber,
        period,
        allRolesPeriodCache,
      );

      lineItem += 1;
      for (const roleCapture of allRoles.roles) {
        const value =
          Math.round(commissionAmount * (roleCapture.splitPercentage / 100) * 100) / 100;
        const valueTimesMembers = Math.round(value * totalMembers * 100) / 100;

        const item: CommissionReportAllLineItem = {
          lineItem,
          policyNumber: review.policyNumber,
          productName: allRoles.productName,
          grossCommission: review.grossComm,
          totalMembers,
          issueDate,
          paidToDate,
          monthDiff,
          commissionAmount,
          role: roleCapture.role,
          roleName: roleCapture.roleName,
          splitPercentage: roleCapture.splitPercentage,
          value,
          valueTimesMembers,
          commissionFromReport: null,
          result: '',
          skipped: false,
        };

        console.log('[print-captured-data] all-roles-line-item', JSON.stringify(item, null, 2));
        addCommissionReportAllLineItem(item);
        appendCommissionReportAllLine(prepared.reportSheetPath, item);
      }
    }

    rewriteCommissionReportAllCsv(prepared.reportSheetPath, getCommissionReportAllLineItems());

    const active = getActiveCommissionReportAllLineItems();
    expect(
      active.length,
      'No active review lines captured for commission report all-roles validation',
    ).toBeGreaterThan(0);
  }

  async fillAllRolesCommissionFromReportIntoCsv(): Promise<void> {
    const prepared = getCommissionReportPreparedFile();
    const items = getActiveCommissionReportAllLineItems();

    await expect(
      this.page.getByText(/File-level commission splits/i).or(
        this.page.getByRole('grid', { name: 'Data grid' }),
      ).first(),
    ).toBeVisible({ timeout: T });

    // Group by policy+gross so we only search the report once per statement line.
    const byPolicyGross = new Map<string, CommissionReportAllLineItem[]>();
    for (const item of items) {
      const key = `${item.policyNumber}::${item.grossCommission.toFixed(2)}`;
      const list = byPolicyGross.get(key) ?? [];
      list.push(item);
      byPolicyGross.set(key, list);
    }

    for (const group of byPolicyGross.values()) {
      const first = group[0]!;
      for (const item of group) {
        const roleSplit = await this.captureRoleSplitAmountForPolicy(
          first.policyNumber,
          first.grossCommission,
          item.role,
        );
        item.commissionFromReport = roleSplit;
        item.result =
          Math.abs(roleSplit - item.valueTimesMembers) <= COMMISSION_REPORT.commissionTolerance
            ? 'TRUE'
            : 'FALSE';

        console.log(
          `${LOG_PREFIX_ALL} policy=${item.policyNumber} role=${item.role} ` +
            `gross=${item.grossCommission.toFixed(2)} expected=${item.valueTimesMembers.toFixed(2)} ` +
            `report=${roleSplit.toFixed(2)} result=${item.result}`,
        );
      }
    }

    rewriteCommissionReportAllCsv(prepared.reportSheetPath, getCommissionReportAllLineItems());
  }

  async writeAndAssertCommissionReportAllCsv(): Promise<void> {
    const prepared = getCommissionReportPreparedFile();
    const items = getCommissionReportAllLineItems();
    finalizeCommissionReportAllCsv(prepared.reportSheetPath, items);

    const active = getActiveCommissionReportAllLineItems();
    expect(active.length).toBeGreaterThan(0);
    for (const item of active) {
      expect(
        item.result,
        `Policy ${item.policyNumber} role=${item.role}: report=${item.commissionFromReport} expected=${item.valueTimesMembers}`,
      ).toBe('TRUE');
    }

    console.log(`${LOG_PREFIX_ALL} report sheet written: ${prepared.reportSheetPath}`);
  }
}
