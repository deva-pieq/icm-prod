import { expect, type Page } from '@playwright/test';
import { AppPaths, AppUrlPatterns } from '../appPaths';
import { StatementUploadPage } from '../statement-processing/StatementUploadPage';
import { AgentsPage } from '../agents/AgentsPage';
import { AgentEditTabsPage } from '../agents/AgentEditTabsPage';
import { MmpSettingsPage } from './MmpSettingsPage';
import { LedgerPage } from '../agent-insights/LedgerPage';
import { ProfilePage } from '../auth/ProfilePage';
import { LoginPage } from '../auth/LoginPage';
import { ProductsPage } from '../products/ProductsPage';
import { CommissionStructurePage } from '../products/CommissionStructurePage';
import { CommissionRulePage } from '../products/CommissionRulePage';
import { waitForAppSettled } from '../../utils/pageLoader';
import { smokeStepTimeoutMs } from '../../utils/smokeTimeouts';
import { MMP } from '../../test-data/mmp/validateMmp';
import {
  createAndActivateAgent as createAndActivateAgentFlow,
  createAgentOnly as createAgentOnlyFlow,
  activateAgentOnPage,
  waitForActivationEmail,
} from '../../utils/agent-activation/agentActivation';
import { prepareMmpFile1, prepareMmpFile2, prepareMmpRenewalFile } from '../../utils/mmp/mmpExcelPrep';
import { agency3OpsCredentials } from '../../utils/loadEnv';
import {
  getMmpActivationUrl,
  getMmpAgent,
  getMmpContributionAmount,
  getMmpFileId1,
  getMmpFileId2,
  getMmpPreparedFile1,
  getMmpPreparedFile2,
  isMmpAgentSetupComplete,
  markMmpAgentSetupComplete,
  setMmpActivationUrl,
  setMmpAgent,
  setMmpContributionAmount,
  setMmpFileId1,
  setMmpFileId2,
  setMmpPreparedFile1,
  setMmpPreparedFile2,
} from '../../utils/mmp/mmpContext';

const T = smokeStepTimeoutMs;

export class MmpFlowPage extends StatementUploadPage {
  readonly agentsPage: AgentsPage;
  readonly agentEditTabsPage: AgentEditTabsPage;
  readonly mmpSettingsPage: MmpSettingsPage;
  readonly ledgerPage: LedgerPage;
  private lastTooltipText = '';
  private ledgerApiEntries: Array<{ transactionType?: string; amount?: number; credit?: boolean }> = [];

  constructor(page: Page) {
    super(page);
    this.agentsPage = new AgentsPage(page);
    this.agentEditTabsPage = new AgentEditTabsPage(page);
    this.mmpSettingsPage = new MmpSettingsPage(page);
    this.ledgerPage = new LedgerPage(page);
  }

  // ── Agent create / level / MMP settings ───────────────────────────────────

  /**
   * One shared agent for all @validate-mmp scenarios.
   * First call: create → activate → LVL1 → MMP Commission+Bonus.
   * Later calls: no-op (reuse context).
   */
  async ensureSharedAgentReady(): Promise<void> {
    if (isMmpAgentSetupComplete()) {
      const agent = getMmpAgent();
      console.log(
        `[mmp] Reusing shared agent: ${agent.displayName} id=${agent.agentId} email=${agent.email}`,
      );
      return;
    }
    await this.createAndActivateAgent();
    await this.openCreatedAgentEdit();
    await this.addLevel1WithStartDate();
    await this.configureMmpOnSettings();
    markMmpAgentSetupComplete();
    console.log('[mmp] Shared agent ready (LVL1 + MMP enabled)');
  }

  /** Composite: create → logout → gmail activate → logout → login ops. */
  async createAndActivateAgent(): Promise<void> {
    const agent = await createAndActivateAgentFlow(this.page);
    setMmpAgent(agent);
    console.log(
      `[mmp] Agent created+activated: ${agent.displayName} id=${agent.agentId} email=${agent.email}`,
    );
  }

  /** Ops: create agent only; fetch gmail activation link into context. */
  async createAgentOnly(): Promise<void> {
    const agent = await createAgentOnlyFlow(this.page);
    setMmpAgent(agent);
    console.log(`[mmp] Agent created: ${agent.displayName} id=${agent.agentId} email=${agent.email}`);
    console.log('[mmp] Waiting for activation email...');
    const url = await waitForActivationEmail(agent.email);
    setMmpActivationUrl(url);
  }

  async logout(): Promise<void> {
    await new ProfilePage(this.page).signOut();
  }

  /** After ops logout: open gmail link, set password, land as active agent. */
  async activateCreatedAgentViaGmail(): Promise<void> {
    const agent = getMmpAgent();
    const url = getMmpActivationUrl();
    await activateAgentOnPage(this.page, url, agent.email, MMP.agentPassword);
  }

  async loginAsOpsManager(): Promise<void> {
    const { email, password } = agency3OpsCredentials();
    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  }

  async openCreatedAgentEdit(): Promise<void> {
    const agent = getMmpAgent();
    await this.agentsPage.openList();
    await this.agentsPage.searchGrid(agent.agentId);
    await this.agentsPage.openEditByMatchingRow(agent.displayName);
  }

  async addLevel1WithStartDate(dateStr: string = MMP.levelEffectiveStartDate): Promise<void> {
    await this.agentEditTabsPage.openLevelHierarchyTab();
    await this.agentEditTabsPage.clickAddLevel();
    await this.agentEditTabsPage.selectLevelInDrawer(MMP.levelName);
    // Calendar widget only — app rejects manual date fill.
    await this.agentEditTabsPage.setLevelStartDate(dateStr);
    await this.agentEditTabsPage.saveLevel();
    await this.agentEditTabsPage.expectLevelInTable(MMP.levelName);
  }

  async configureMmpOnSettings(): Promise<void> {
    setMmpContributionAmount(MMP.contributionAmount);
    await this.mmpSettingsPage.configureMmpProgram({
      amount: MMP.contributionAmount,
      percentage: MMP.contributionPercentage,
      earningTypes: MMP.earningTypes,
    });
  }

  // ── Excel prep ────────────────────────────────────────────────────────────

  async prepareFile1(): Promise<void> {
    const agent = getMmpAgent();
    const file = await prepareMmpFile1({
      agentId: agent.npn || agent.agentId,
      firstName: agent.firstName,
      lastName: agent.lastName,
    });
    setMmpPreparedFile1(file);
    console.log(
      `[mmp] File1 prepared: ${file.fileName} product="${file.productName}" uid=${file.customerUid} agent=${agent.firstName} ${agent.lastName} npn=${agent.npn || agent.agentId}`,
    );
    console.log(
      `[mmp] HUMAN CONFIG — product="${file.productName}" opsEmail=${MMP.opsEmail} (set Bonus $${MMP.bonusAmount} on this product; Commission $${MMP.file1.grossCompensation} + Bonus $${MMP.bonusAmount} = $${MMP.contributionAmount})`,
    );
  }

  async prepareFile2(): Promise<void> {
    const agent = getMmpAgent();
    const file = await prepareMmpFile2({
      agentId: agent.npn || agent.agentId,
      firstName: agent.firstName,
      lastName: agent.lastName,
    });
    setMmpPreparedFile2(file);
    console.log(
      `[mmp] File2 prepared: ${file.fileName} rows=${file.recordCount} product="${file.productName}" agent=${agent.firstName} ${agent.lastName} npn=${agent.npn || agent.agentId}`,
    );
  }

  reportProductAndOpsEmail(): void {
    const file = getMmpPreparedFile1();
    console.log('════════════════════════════════════════════════════════');
    console.log(`[mmp] Product name: ${file.productName}`);
    console.log(`[mmp] Ops manager email: ${MMP.opsEmail}`);
    console.log('════════════════════════════════════════════════════════');
  }

  /**
   * Configure the product's Bonus earning type with $200 and 100% to agent.
   * This must be called after prepareFile1() so the product name is known.
   * Navigates to Products page, finds the product, opens commission structure,
   * ensures a Bonus rule draft exists, configures it, and publishes.
   */
  async configureProductBonusEarningType(): Promise<void> {
    const productName = MMP.productGridName;
    const productCode = MMP.productGridCode;
    const bonusAmount = MMP.bonusAmount;

    console.log(
      `[mmp] Configuring product "${productName}" (${productCode}) with Bonus $${bonusAmount} (100% to agent)`,
    );

    const productsPage = new ProductsPage(this.page);
    const commissionStructurePage = new CommissionStructurePage(this.page);
    const commissionRulePage = new CommissionRulePage(this.page);

    await productsPage.openList();
    // Search by unique product CODE: a name-only search for "Aetna-Test-Product"
    // also matches "Aetna-Test-Product II" (Code: AetnaTestProductIII), and the
    // wrong product (first alphabetical match) has no published Bonus → the flow
    // would create a conflicting draft and fail at publish (MCP-verified).
    await productsPage.searchGrid(productCode);

    const productRow = productsPage
      .getDataRows()
      .filter({ hasText: new RegExp(productCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first();
    await expect
      .poll(async () => productRow.isVisible().catch(() => false), {
        timeout: T,
        intervals: [500, 1000, 2000],
      })
      .toBe(true);

    await productRow.click();
    await waitForAppSettled(this.page, T);
    await expect(this.page).toHaveURL(AppUrlPatterns.productsEdit, { timeout: T });

    await productsPage.openCommissionStructure();
    await commissionStructurePage.expectOnCommissionStructurePage();

    // If a published Bonus rule already exists (e.g. BONUS V1 $200, 100% Agent,
    // no end date), a NEW overlapping draft would keep `publish-rule-bottom-button`
    // permanently disabled. Skip create/publish — the requirement is already met.
    if (await commissionStructurePage.hasPublishedForType('Bonus')) {
      console.log(
        `[mmp] Product "${productName}" already has a published Bonus rule — skipping create/publish (test requirement already satisfied)`,
      );
      return;
    }

    if (!(await commissionStructurePage.hasDraftForType('Bonus'))) {
      await commissionStructurePage.clickAddRule();
      await commissionStructurePage.selectCommissionRuleTypeInDialog('Bonus');
      await commissionStructurePage.confirmAddCommissionRuleDialog();
    } else {
      await commissionStructurePage.openDraftForType('Bonus');
    }

    // Configure the Bonus rule (confirmAddRuleDialog lands on edit page for new drafts)
    await commissionRulePage.expectOnEditCommissionRulePageForType('Bonus');

    // Set rule name and effective start date (mandatory for save draft)
    await commissionRulePage.setCommissionRuleNameToValidUniqueValue();
    await commissionRulePage.setCommissionRuleEffectiveStartDate('01/01/2021');

    // Configure policy period slabs - set Regular period value to bonusAmount
    await commissionRulePage.configureRegularPolicyPeriod('12', String(bonusAmount));

    // Set commission splits: 100% to Agent, 0% to Agency and Sales Leader
    await commissionRulePage.setCommissionSplitManually('0', '0');

    // Save draft
    await commissionRulePage.saveTheDraft();
    await commissionRulePage.expectCommissionRuleDraftSavedSuccessfully();

    // Publish the rule
    await commissionRulePage.publishRule();
    await commissionRulePage.expectCommissionRulePublishedSuccessfully();

    console.log(`[mmp] Product "${productName}" Bonus earning type configured and published`);
  }

  // ── Statement upload / review ─────────────────────────────────────────────

  async openUpload(): Promise<void> {
    const baseUrl = new URL(this.page.url()).origin;
    await this.page.goto(`${baseUrl}${AppPaths.commissionUpload}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(AppUrlPatterns.commissionUpload, { timeout: T });
    await expect(this.loc.headingUpload()).toBeVisible({ timeout: T });
    await waitForAppSettled(this.page, T);
  }

  async uploadFile1(): Promise<void> {
    const file = getMmpPreparedFile1();
    await this.uploadFromPrepared({
      absolutePath: file.absolutePath,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });
  }

  async uploadFile2(): Promise<void> {
    const file = getMmpPreparedFile2();
    await this.uploadFromPrepared({
      absolutePath: file.absolutePath,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });
  }

  async selectMmpStatementType(): Promise<void> {
    await this.selectStatementType(MMP.statementType);
  }

  async submitUpload(): Promise<void> {
    await this.clickUploadStatement();
  }

  async pollExtractAndCaptureFileId(which: 1 | 2): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = await this.assertions.pollPastExtractProcessing(file.fileName, {
      maxAttempts: MMP.uploadPoll.maxAttempts,
      intervalMs: MMP.uploadPoll.intervalMs,
    });
    if (which === 1) setMmpFileId1(fileId);
    else setMmpFileId2(fileId);

    const row = await this.resolveStoredUploadRow({
      fileId,
      fileName: file.fileName,
    });
    this.setStoredRow({
      row,
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });
  }

  async expectWaitingReview(which: 1 | 2): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = which === 1 ? getMmpFileId1() : getMmpFileId2();
    await this.assertions.expectStoredUploadStatusAndStage(
      file.fileName,
      MMP.expectedAfterExtract.status,
      MMP.expectedAfterExtract.stage,
      fileId,
    );
  }

  async openReview(which: 1 | 2): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = which === 1 ? getMmpFileId1() : getMmpFileId2();
    const row = await this.resolveStoredUploadRow({ fileId, fileName: file.fileName });
    this.setStoredRow({
      row,
      fileId,
      fileName: file.fileName,
      carrierName: file.carrierName,
    });
    await this.openReviewForStoredUpload();
  }

  async hoverNewPolicyWarning(): Promise<void> {
    this.lastTooltipText = await this.review.hoverWarningIcon();
  }

  async expectNewPolicyTooltip(): Promise<void> {
    expect(
      this.lastTooltipText.toLowerCase(),
      `Tooltip should contain "New Policy" but was: "${this.lastTooltipText}"`,
    ).toContain(MMP.warningTooltip.newPolicy.toLowerCase());
  }

  async completeReview(): Promise<void> {
    await this.review.completeReviewAndConfirm();
  }

  async expectUploadStage(which: 1 | 2, stage: string): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = which === 1 ? getMmpFileId1() : getMmpFileId2();
    await this.assertions.expectStoredUploadStage(file.fileName, stage, fileId);
  }

  /**
   * After Complete Review on multi-NB file2, stage may be Completed or Needs Attention.
   * If Needs Attention, open the record so ops can process; then poll until Completed.
   */
  async processUntilCompleted(which: 1 | 2): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = which === 1 ? getMmpFileId1() : getMmpFileId2();

    await this.openUpload();
    await this.refreshRecentlyUploadedGrid();

    const row = await this.resolveStoredUploadRow({ fileId, fileName: file.fileName });
    const stageText = await this.readCellText(row, MMP.gridColumns.stage);
    const statusText = await this.readCellText(row, MMP.gridColumns.status);
    console.log(`[mmp] File${which} post-review stage=${stageText} status=${statusText}`);

    if (/needs attention/i.test(stageText)) {
      const naRow = await this.resolveStoredUploadRow({ fileId, fileName: file.fileName });
      await this.details.openFromRow(naRow, fileId);
      await waitForAppSettled(this.page, T);

      // Soft: MMP table may appear on reconcile/details — do not fail if absent
      const mmpHeading = this.page.getByText(/marketing match|mmp/i).first();
      if (await mmpHeading.isVisible({ timeout: 5_000 }).catch(() => false)) {
        console.log('[mmp] MMP section visible on details/reconcile page');
      }

      // Attempt Complete / Reconcile CTAs if present
      const completeBtn = this.page
        .getByRole('button', { name: /complete|reconcile|approve|submit/i })
        .first();
      if (await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await completeBtn.click();
        await waitForAppSettled(this.page, T);
        const confirm = this.page
          .getByRole('dialog')
          .getByRole('button', { name: /^ok$|^confirm$|^save$|^reconcile$/i })
          .first();
        if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await confirm.click();
          await waitForAppSettled(this.page, T);
        }
      }

      await this.openUpload();
    }

    await this.assertions.expectStoredUploadStage(
      file.fileName,
      MMP.completedStage,
      fileId,
    );
  }

  // ── Agent ledger ──────────────────────────────────────────────────────────

  async logoutAndLoginAsAgent(): Promise<void> {
    const agent = getMmpAgent();
    await new ProfilePage(this.page).signOut();
    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(agent.email, MMP.agentPassword);
  }

  async openAgentLedger(): Promise<void> {
    // Capture the ledger API payload (MMP amounts are NOT rendered in the grid DOM —
    // earnings/advanceAdj show "-" for MMP rows; the API entries are authoritative).
    const ledgerResponse = this.page
      .waitForResponse(
        (r) => r.url().includes('/api/v1/ledger') && r.request().method() === 'GET',
        { timeout: T },
      )
      .catch(() => null);
    await this.ledgerPage.open();
    const response = await ledgerResponse;
    if (!response) {
      console.warn('[mmp] Ledger API response was not captured during openAgentLedger()');
      this.ledgerApiEntries = [];
      return;
    }
    try {
      const json = (await response.json()) as {
        data?: { entries?: Array<{ transactionType?: string; amount?: number; credit?: boolean }> };
      };
      this.ledgerApiEntries = json?.data?.entries ?? [];
      console.log(
        `[mmp] Ledger API captured: ${this.ledgerApiEntries.length} entries, MMP sum $${this
          .sumMmpLedgerApiAmounts()
          .toFixed(2)}`,
      );
    } catch (err) {
      console.warn(`[mmp] Failed to parse ledger API response: ${(err as Error).message}`);
      this.ledgerApiEntries = [];
    }
  }

  /** Ledger Type column only — ignore policy UIDs like ATENA-MMP-TEST-A037. */
  private async pollForMmpLedgerRows(): Promise<void> {
    const grid = this.page.getByRole('grid', { name: /data grid/i }).first();
    await expect(grid).toBeVisible({ timeout: T });
    await expect
      .poll(async () => (await this.countMmpLedgerRows()) > 0, {
        timeout: T * 3,
        intervals: [1000, 2000, 3000],
      })
      .toBe(true);
  }

  /**
   * Scroll the AG Grid vertical viewport and collect every rendered row's
   * type cell + full text, deduped by row identity. AG Grid virtualizes rows,
   * so pre-scroll, only ~11 rows of 39+ are in the DOM and MMP rows (below the
   * fold) are missed entirely.
   */
  private async collectLedgerRows(): Promise<Array<{ rowId: string; type: string; text: string }>> {
    return this.page.evaluate(() => {
      const rows = new Map<string, { type: string; text: string }>();

      const collect = () => {
        for (const row of document.querySelectorAll(
          '.ag-center-cols-container .ag-row, [role="row"]:not([aria-rowindex="1"])',
        )) {
          const rowId =
            (row as HTMLElement).getAttribute('row-id') ??
            (row as HTMLElement).getAttribute('aria-rowindex') ??
            (row.textContent ?? '').replace(/\s+/g, ' ').trim();
          const typeCell =
            row.querySelector('[col-id="type"], [col-id="transactionType"]') ??
            row.querySelector('[role="gridcell"]');
          const type = (typeCell?.textContent ?? '').replace(/\s+/g, ' ').trim();
          const text = (row.textContent ?? '').replace(/\s+/g, ' ').trim();
          rows.set(rowId, { type, text });
        }
      };

      for (const viewport of document.querySelectorAll(
        '.ag-center-cols-viewport, .ag-body-viewport',
      )) {
        if (!(viewport instanceof HTMLElement)) continue;
        const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        const step = Math.max(40, Math.floor(viewport.clientHeight / 2));
        for (let scrollTop = 0; scrollTop <= maxScroll + 1; scrollTop += step) {
          viewport.scrollTop = Math.min(maxScroll, scrollTop);
          viewport.dispatchEvent(new Event('scroll'));
          collect();
        }
      }
      collect();

      return [...rows.entries()].map(([rowId, { type, text }]) => ({ rowId, type, text }));
    });
  }

  private async countMmpLedgerRows(): Promise<number> {
    const rows = await this.collectLedgerRows();
    return rows.filter((r) => /^mmp$|^marketing\s*match$/i.test(r.type)).length;
  }

  /** Sum of `amount` over ledger API entries whose transactionType is MMP. */
  private sumMmpLedgerApiAmounts(): number {
    return this.ledgerApiEntries
      .filter((e) => /^mmp$|^marketing\s*match$/i.test(String(e.transactionType ?? '').trim()))
      .reduce((sum, e) => sum + Math.abs(Number(e.amount) || 0), 0);
  }

  /**
   * Sum the MMP amounts across the agent's full ledger.
   * MMP amounts are NOT rendered in the grid DOM (earnings/advanceAdj show "-"
   * for MMP rows) — the sum is computed from the ledger API payload captured in
   * openAgentLedger() (data.entries, transactionType==="MMP", sum of amount).
   */
  async expectMmpLedgerSumEqualsMax(): Promise<void> {
    const expected = getMmpContributionAmount();
    await expect(this.ledgerPage.loc.heading()).toBeVisible({ timeout: T });
    await this.pollForMmpLedgerRows();

    const entries = this.ledgerApiEntries;
    expect(
      entries.length,
      'Expected ledger API entries to be captured in openAgentLedger()',
    ).toBeGreaterThan(0);
    const sum = this.sumMmpLedgerApiAmounts();

    expect(
      Math.round(sum * 100) / 100,
      `MMP ledger sum should equal configured max $${expected} (got $${sum} across ${
        this.ledgerApiEntries.filter((e) =>
          /^mmp$|^marketing\s*match$/i.test(String(e.transactionType ?? '').trim()),
        ).length
      } MMP entries)`,
    ).toBe(expected);
  }

  async expectMmpLedgerRowsPresent(): Promise<void> {
    await expect(this.ledgerPage.loc.heading()).toBeVisible({ timeout: T });
    await this.pollForMmpLedgerRows();
  }

  async expectLedgerTypesPresent(types: string[]): Promise<void> {
    await expect(this.ledgerPage.loc.heading()).toBeVisible({ timeout: T });
    const grid = this.page.getByRole('grid', { name: /data grid/i }).first();
    await expect(grid).toBeVisible({ timeout: T });
    const rows = await this.collectLedgerRows();
    const text = rows.map((r) => r.text).join(' ');
    expect(
      rows.length,
      'Expected at least one ledger row to be collected (AG Grid virtualization)',
    ).toBeGreaterThan(0);
    for (const type of types) {
      expect(text, `Ledger should contain type "${type}"`).toMatch(new RegExp(type, 'i'));
    }
  }

  async openCommissionDetails(which: 1 | 2): Promise<void> {
    const file = which === 1 ? getMmpPreparedFile1() : getMmpPreparedFile2();
    const fileId = which === 1 ? getMmpFileId1() : getMmpFileId2();
    await this.openUpload();
    const row = await this.resolveStoredUploadRow({ fileId, fileName: file.fileName });
    await this.details.openFromRow(row, fileId);
    await waitForAppSettled(this.page, T);
  }

  async expectMmpTableVisible(): Promise<void> {
    const mmp = this.page
      .getByRole('heading', { name: /marketing match|mmp/i })
      .or(this.page.getByText(/marketing match program|mmp/i))
      .or(this.page.locator('[data-testid*="mmp"], [data-testid*="marketing-match"]'))
      .first();
    await expect(mmp).toBeVisible({ timeout: T });
  }

  async prepareRenewalFile(): Promise<void> {
    const agent = getMmpAgent();
    const seed = getMmpPreparedFile1();
    const file = await prepareMmpRenewalFile(
      {
        agentId: agent.npn || agent.agentId,
        firstName: agent.firstName,
        lastName: agent.lastName,
      },
      seed.customerUid,
    );
    setMmpPreparedFile2(file);
    console.log(
      `[mmp] Renewal prepared: ${file.fileName} uid=${file.customerUid} agent=${agent.firstName} ${agent.lastName} npn=${agent.npn || agent.agentId}`,
    );
  }
}
