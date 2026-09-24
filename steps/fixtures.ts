import type { Browser, BrowserContext, Page } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/auth/LoginPage';
import { UserManagementPage } from '../pages/user-management/UserManagementPage';
import { TransferSheetPage } from '../pages/settings/TransferSheetPage';
import { TransferStatementPage } from '../pages/statement-processing/TransferStatementPage';
import { TransferPaymentPage } from '../pages/payment-processing/TransferPaymentPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { ProductManagementPage } from '../pages/products/ProductManagementPage';
import { ProductEditPage } from '../pages/products/ProductEditPage';
import { CommissionRulePage } from '../pages/products/CommissionRulePage';
import { CommissionStructurePage } from '../pages/products/CommissionStructurePage';
import { HappyFlowStatementPage } from '../pages/commission/HappyFlowStatementPage';
import { CarriersPage } from '../pages/carriers/CarriersPage';
import { CarrierMasterPage } from '../pages/carriers/CarrierMasterPage';
import { AgentsPage } from '../pages/agents/AgentsPage';
import { AgentFormPage } from '../pages/agents/AgentFormPage';
import { AgentEditTabsPage } from '../pages/agents/AgentEditTabsPage';
import { PoliciesPage } from '../pages/policies/PoliciesPage';
import { StatementSetupPage } from '../pages/commission/StatementSetupPage';
import { CommissionManagementPage } from '../pages/commission/CommissionManagementPage';
import { StatementHistoryPage } from '../pages/statement-processing/StatementHistoryPage';
import { NeedsAttentionPage } from '../pages/statement-processing/NeedsAttentionPage';
import { StatementReviewPage } from '../pages/statement-processing/StatementReviewPage';
import { CommissionDetailsPage } from '../pages/statement-processing/CommissionDetailsPage';
import { CommissionTruthValidationPage } from '../pages/statement-processing/CommissionTruthValidationPage';
import { CommissionReportValidationPage } from '../pages/statement-processing/CommissionReportValidationPage';
import { StatementUploadPage } from '../pages/statement-processing/StatementUploadPage';
import { PayablesPage } from '../pages/payment-processing/PayablesPage';
import { ApprovalPage } from '../pages/payment-processing/ApprovalPage';
import { EditBatchPage } from '../pages/payment-processing/EditBatchPage';
import { DisbursementPage } from '../pages/payment-processing/DisbursementPage';
import { PromptsPage } from '../pages/settings/PromptsPage';
import { CommissionTemplatesPage } from '../pages/settings/CommissionTemplatesPage';
import { AgencyConfigurationPage } from '../pages/settings/AgencyConfigurationPage';
import { AgencySettingsPage } from '../pages/agency-settings/AgencySettingsPage';
import { ProcessingCutOffPage } from '../pages/processing-cut-off/ProcessingCutOffPage';
import { DataImportPage } from '../pages/data-import/DataImportPage';
import { AgencyOwnerDashboardPage } from '../pages/dashboard/AgencyOwnerDashboardPage';
import { OpsManagerDashboardPage } from '../pages/dashboard/OpsManagerDashboardPage';
import { BookOfBusinessPage } from '../pages/agent-insights/BookOfBusinessPage';
import { LedgerPage } from '../pages/agent-insights/LedgerPage';
import { AgentDashboardPage } from '../pages/agent-insights/AgentDashboardPage';
import { AdvanceOnlyPage } from '../pages/advance-only/AdvanceOnlyPage';
import { AdvanceAdjustmentPage } from '../pages/advance-adjustment/AdvanceAdjustmentPage';
import { AdvanceRecoveryPage } from '../pages/advance-recovery/AdvanceRecoveryPage';
import { AdvanceSetupPage } from '../pages/advance-regression/AdvanceSetupPage';
import { AdvanceOverviewPage } from '../pages/advance-regression/AdvanceOverviewPage';
import { AgentAdvanceEligibilityPage } from '../pages/advance-regression/AgentAdvanceEligibilityPage';
import { PolicyCancellationAgencyAdvancePage } from '../pages/policy-cancellation-agency-advance/PolicyCancellationAgencyAdvancePage';
import { PolicyCancellationCarrierAdvancePage } from '../pages/policy-cancellation-carrier-advance/PolicyCancellationCarrierAdvancePage';
import { PolicyCancellationAgencyCreditPage } from '../pages/policy-cancellation-agency-credit/PolicyCancellationAgencyCreditPage';
import { PaymentModulePage } from '../pages/payment-module/PaymentModulePage';
import { ChargebackPage } from '../pages/chargeback/ChargebackPage';
import { MmpFlowPage } from '../pages/mmp/MmpFlowPage';
import { MmpSettingsPage } from '../pages/mmp/MmpSettingsPage';
import { PolicyMasterPage } from '../pages/policy-master/PolicyMasterPage';
import { MiscellaneousChargesPage } from '../pages/miscellaneous-charges/MiscellaneousChargesPage';

type Fixtures = {
  loginPage: LoginPage;
  userManagementPage: UserManagementPage;
  statementUploadPage: TransferStatementPage;
  transferSheetPage: TransferSheetPage;
  transferStatementPage: TransferStatementPage;
  transferPaymentPage: TransferPaymentPage;
  happyFlowProductPage: ProductsPage;
  happyFlowCommissionRulePage: CommissionRulePage;
  commissionRulePage: CommissionRulePage;
  commissionStructurePage: CommissionStructurePage;
  happyFlowStatementPage: HappyFlowStatementPage;
  carriersPage: CarriersPage;
  carrierMasterPage: CarrierMasterPage;
  agentsPage: AgentsPage;
  agentFormPage: AgentFormPage;
  agentEditTabsPage: AgentEditTabsPage;
  productsPage: ProductsPage;
  productManagementPage: ProductManagementPage;
  productEditPage: ProductEditPage;
  policiesPage: PoliciesPage;
  statementSetupPage: StatementSetupPage;
  commissionManagementPage: CommissionManagementPage;
  statementHistoryPage: StatementHistoryPage;
  needsAttentionPage: NeedsAttentionPage;
  statementReviewPage: StatementReviewPage;
  commissionDetailsPage: CommissionDetailsPage;
  commissionTruthValidationPage: CommissionTruthValidationPage;
  commissionReportValidationPage: CommissionReportValidationPage;
  baseStatementUploadPage: StatementUploadPage;
  payablesPage: PayablesPage;
  approvalPage: ApprovalPage;
  editBatchPage: EditBatchPage;
  disbursementPage: DisbursementPage;
  promptsPage: PromptsPage;
  commissionTemplatesPage: CommissionTemplatesPage;
  agencyConfigPage: AgencyConfigurationPage;
  agencySettingsPage: AgencySettingsPage;
  processingCutOffPage: ProcessingCutOffPage;
  dataImportPage: DataImportPage;
  agencyOwnerDashboardPage: AgencyOwnerDashboardPage;
  opsManagerDashboardPage: OpsManagerDashboardPage;
  bookOfBusinessPage: BookOfBusinessPage;
  ledgerPage: LedgerPage;
  agentDashboardPage: AgentDashboardPage;
  advanceOnlyPage: AdvanceOnlyPage;
  advanceAdjustmentPage: AdvanceAdjustmentPage;
  advanceRecoveryPage: AdvanceRecoveryPage;
  advanceSetupRegressionPage: AdvanceSetupPage;
  advanceOverviewRegressionPage: AdvanceOverviewPage;
  agentAdvanceEligibilityPage: AgentAdvanceEligibilityPage;
  policyCancellationAgencyAdvancePage: PolicyCancellationAgencyAdvancePage;
  policyCancellationCarrierAdvancePage: PolicyCancellationCarrierAdvancePage;
  policyCancellationAgencyCreditPage: PolicyCancellationAgencyCreditPage;
  paymentModulePage: PaymentModulePage;
  chargebackPage: ChargebackPage;
  mmpFlowPage: MmpFlowPage;
  mmpSettingsPage: MmpSettingsPage;
  policyMasterPage: PolicyMasterPage;
  miscellaneousChargesPage: MiscellaneousChargesPage;
};

let _sharedPage: Page | null = null;
let _sharedContext: BrowserContext | null = null;

export async function createSharedPage(
  browser: Browser,
  options?: Parameters<Browser['newContext']>[0],
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  _sharedContext = context;
  _sharedPage = page;
  return { context, page };
}

export async function closeSharedContext(): Promise<void> {
  if (_sharedContext) {
    await _sharedContext.close().catch(() => { });
    _sharedContext = null;
    _sharedPage = null;
  }
}

/**
 * Create a shared page + login with automatic retry.
 * If login (or any post-login setup) fails, the context is closed and a fresh
 * attempt starts.  This prevents a single flaky login from skipping an entire
 * module's worth of scenarios.
 *
 * @param browser  Playwright browser instance (from BeforeAll)
 * @param loginFn  Receives a fresh Page; perform goto + login + any setup here
 * @param options  retries (default 2), baseURL (default process.env.BASE_URL)
 */
export async function loginWithRetry(
  browser: Browser,
  loginFn: (page: Page) => Promise<void>,
  options?: { retries?: number; baseURL?: string },
): Promise<void> {
  const { retries = 2, baseURL = process.env.BASE_URL } = options ?? {};
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { page } = await createSharedPage(browser, { baseURL });
      await loginFn(page);
      return;
    } catch (e) {
      console.log(
        `[loginRetry] Attempt ${attempt}/${retries} failed: ${(e as Error).message}`,
      );
      await closeSharedContext();
      if (attempt === retries) throw e;
    }
  }
}

function isHeadedRun(): boolean {
  return process.argv.includes('--headed');
}

function idleSecondsBeforeBrowserClose(): number {
  const raw = process.env.BROWSER_IDLE_BEFORE_CLOSE_SEC?.trim();
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const test = base.extend<Fixtures>({
  context: [
    async ({ browser }, use, testInfo) => {
      if (_sharedContext) {
        await use(_sharedContext);
      } else {
        const ctx = await browser.newContext(testInfo.project.use);
        await use(ctx);
        await ctx.close();
      }
    },
    { scope: 'test' },
  ],

  page: [
    async ({ context }, use) => {
      if (_sharedPage) {
        await use(_sharedPage);
      } else {
        const p = await context.newPage();
        await use(p);
        await p.close();
      }
    },
    { scope: 'test' },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  userManagementPage: async ({ page }, use) => {
    await use(new UserManagementPage(page));
  },
  statementUploadPage: async ({ page }, use) => {
    await use(new TransferStatementPage(page));
  },
  transferSheetPage: async ({ page }, use) => {
    await use(new TransferSheetPage(page));
  },
  transferStatementPage: async ({ statementUploadPage }, use) => {
    await use(statementUploadPage);
  },
  transferPaymentPage: async ({ page }, use) => {
    await use(new TransferPaymentPage(page));
  },
  happyFlowProductPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  happyFlowCommissionRulePage: async ({ page }, use) => {
    await use(new CommissionRulePage(page));
  },
  commissionRulePage: async ({ page }, use) => {
    await use(new CommissionRulePage(page));
  },
  commissionStructurePage: async ({ page }, use) => {
    await use(new CommissionStructurePage(page));
  },
  happyFlowStatementPage: async ({ page }, use) => {
    await use(new HappyFlowStatementPage(page));
  },
  carriersPage: async ({ page }, use) => {
    await use(new CarriersPage(page));
  },
  carrierMasterPage: async ({ page }, use) => {
    await use(new CarrierMasterPage(page));
  },
  agentsPage: async ({ page }, use) => {
    await use(new AgentsPage(page));
  },
  agentFormPage: async ({ page }, use) => {
    await use(new AgentFormPage(page));
  },
  agentEditTabsPage: async ({ page }, use) => {
    await use(new AgentEditTabsPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  productManagementPage: async ({ page }, use) => {
    await use(new ProductManagementPage(page));
  },
  productEditPage: async ({ page }, use) => {
    await use(new ProductEditPage(page));
  },
  policiesPage: async ({ page }, use) => {
    await use(new PoliciesPage(page));
  },
  statementSetupPage: async ({ page }, use) => {
    await use(new StatementSetupPage(page));
  },
  commissionManagementPage: async ({ page }, use) => {
    await use(new CommissionManagementPage(page));
  },
  statementHistoryPage: async ({ page }, use) => {
    await use(new StatementHistoryPage(page));
  },
  needsAttentionPage: async ({ page }, use) => {
    await use(new NeedsAttentionPage(page));
  },
  statementReviewPage: async ({ page }, use) => {
    await use(new StatementReviewPage(page));
  },
  commissionDetailsPage: async ({ page }, use) => {
    await use(new CommissionDetailsPage(page));
  },
  commissionTruthValidationPage: async ({ page }, use) => {
    await use(new CommissionTruthValidationPage(page));
  },
  commissionReportValidationPage: async ({ page }, use) => {
    await use(new CommissionReportValidationPage(page));
  },
  baseStatementUploadPage: async ({ page }, use) => {
    await use(new StatementUploadPage(page));
  },
  payablesPage: async ({ page }, use) => {
    await use(new PayablesPage(page));
  },
  approvalPage: async ({ page }, use) => {
    await use(new ApprovalPage(page));
  },
  editBatchPage: async ({ page }, use) => {
    await use(new EditBatchPage(page));
  },
  disbursementPage: async ({ page }, use) => {
    await use(new DisbursementPage(page));
  },
  promptsPage: async ({ page }, use) => {
    await use(new PromptsPage(page));
  },
  commissionTemplatesPage: async ({ page }, use) => {
    await use(new CommissionTemplatesPage(page));
  },
  agencyConfigPage: async ({ page }, use) => {
    await use(new AgencyConfigurationPage(page));
  },
  agencySettingsPage: async ({ page }, use) => {
    await use(new AgencySettingsPage(page));
  },
  processingCutOffPage: async ({ page }, use) => {
    await use(new ProcessingCutOffPage(page));
  },
  dataImportPage: async ({ page }, use) => {
    await use(new DataImportPage(page));
  },
  agencyOwnerDashboardPage: async ({ page }, use) => {
    await use(new AgencyOwnerDashboardPage(page));
  },
  opsManagerDashboardPage: async ({ page }, use) => {
    await use(new OpsManagerDashboardPage(page));
  },
  bookOfBusinessPage: async ({ page }, use) => {
    await use(new BookOfBusinessPage(page));
  },
  ledgerPage: async ({ page }, use) => {
    await use(new LedgerPage(page));
  },
  agentDashboardPage: async ({ page }, use) => {
    await use(new AgentDashboardPage(page));
  },
  advanceOnlyPage: async ({ page }, use) => {
    await use(new AdvanceOnlyPage(page));
  },
  advanceAdjustmentPage: async ({ page }, use) => {
    await use(new AdvanceAdjustmentPage(page));
  },
  advanceRecoveryPage: async ({ page }, use) => {
    await use(new AdvanceRecoveryPage(page));
  },
  advanceSetupRegressionPage: async ({ page }, use) => {
    await use(new AdvanceSetupPage(page));
  },
  advanceOverviewRegressionPage: async ({ page }, use) => {
    await use(new AdvanceOverviewPage(page));
  },
  agentAdvanceEligibilityPage: async ({ page }, use) => {
    await use(new AgentAdvanceEligibilityPage(page));
  },
  policyCancellationAgencyAdvancePage: async ({ page }, use) => {
    await use(new PolicyCancellationAgencyAdvancePage(page));
  },
  policyCancellationCarrierAdvancePage: async ({ page }, use) => {
    await use(new PolicyCancellationCarrierAdvancePage(page));
  },
  policyCancellationAgencyCreditPage: async ({ page }, use) => {
    await use(new PolicyCancellationAgencyCreditPage(page));
  },
  paymentModulePage: async ({ page }, use) => {
    await use(new PaymentModulePage(page));
  },
  chargebackPage: async ({ page }, use) => {
    await use(new ChargebackPage(page));
  },
  mmpFlowPage: async ({ page }, use) => {
    await use(new MmpFlowPage(page));
  },
  mmpSettingsPage: async ({ page }, use) => {
    await use(new MmpSettingsPage(page));
  },
  policyMasterPage: async ({ page }, use) => {
    await use(new PolicyMasterPage(page));
  },
  miscellaneousChargesPage: async ({ page }, use) => {
    await use(new MiscellaneousChargesPage(page));
  },
}).extend({
  browser: async ({ browser }, use) => {
    await use(browser);
    const sec = isHeadedRun() ? idleSecondsBeforeBrowserClose() : 0;
    if (sec > 0) {
      await new Promise((r) => setTimeout(r, sec * 1000));
    }
  },
});

export const { Given, When, Then, Before, After, BeforeAll, AfterAll } = createBdd(test);
