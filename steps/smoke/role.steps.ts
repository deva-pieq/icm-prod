import { ProfilePage } from '../../pages/auth/ProfilePage';
import { normalizeSmokeRoleKey, SMOKE_ROLES, type SmokeRoleKey } from '../../test-data/smoke/smokeRoles';
import { smokeCredentialsForRole } from '../../utils/loadEnv';
import { attachSmokeScreenshot } from '../../utils/smokeCapture';
import { Given, Then, When, test } from '../fixtures';

function requireRole(roleRaw: string): SmokeRoleKey {
  const key = normalizeSmokeRoleKey(roleRaw);
  if (!key) {
    throw new Error(`Unknown smoke role "${roleRaw}". Use: operations manager, agent, agency owner`);
  }
  const spec = SMOKE_ROLES[key];
  const creds = smokeCredentialsForRole(spec.envEmailKey);
  test.skip(
    !creds,
    `Add ${spec.envEmailKey} and E2E_PASSWORD to projects/icm-automation-deva/.env — see .env.example`,
  );
  return key;
}

async function capture(page: import('@playwright/test').Page, label: string) {
  await attachSmokeScreenshot(page, test.info(), label);
}

Given('I am logged into PieQ ICM as {string}', async ({ loginPage }, roleRaw: string) => {
  const roleKey = requireRole(roleRaw);
  await loginPage.ensureLoggedInAsRole(roleKey);
});

Then('my profile role should be {string}', async ({ page }, expectedRole: string) => {
  await new ProfilePage(page).expectRoleLabel(expectedRole);
});

// --- Agency owner dashboard -------------------------------------------------

When('I smoke open agency owner dashboard', async ({ agencyOwnerDashboardPage, page }) => {
  await agencyOwnerDashboardPage.open();
  await capture(page, 'agency-owner-dashboard');
});

Then('the agency owner dashboard header is visible on smoke', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.smokeExpectHeader();
});

Then('the filters sidebar is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectFiltersSidebar();
});

Then('the viewing period header is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectViewingPeriodHeader();
});

Then('the Key Metrics region is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectKeyMetricsRegion();
});

Then('the Gross Commission metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('gross-commission');
});

Then('the Agent Payouts metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('agent-payouts');
});

Then('the Sub-agent Payouts metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('sub-agent-payouts');
});

Then('the Sales Leader Override metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('sales-leader-override');
});

Then('the Net to Agency metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('net-to-agency');
});

Then('the Chargebacks metric is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectMetricCard('chargebacks');
});

Then('the Revenue by Product Type section is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectSectionHeading('Revenue by Product Type');
});

Then('the Commission Distribution by Role section is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectSectionHeading('Commission Distribution by Role');
});

Then('the Top Performers by Revenue section is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectSectionHeading('Top Performers by Revenue');
});

Then('the 12-Month Revenue Trend section is visible on agency dashboard smoke', async ({
  agencyOwnerDashboardPage,
}) => {
  await agencyOwnerDashboardPage.smokeExpectSectionHeading(/12-Month Revenue Trend/i);
});

When('I set dashboard time filter to {string}', async ({ agencyOwnerDashboardPage }, label: string) => {
  if (!/^this month$/i.test(label.trim())) {
    throw new Error(`Unsupported dashboard time filter "${label}"`);
  }
  await agencyOwnerDashboardPage.setTimeFilterThisMonth();
});

Then(
  'dashboard shows date range from start of this month through today',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectDateRangeTitleThisMonthThroughToday();
  },
);

// --- Agency owner sidebar modules (Commission Setup; other modules reuse smoke steps) ---

When('I smoke navigate commission setup as agency owner', async ({
  commissionManagementPage,
  page,
}) => {
  await commissionManagementPage.open();
  await capture(page, 'owner-commission-setup');
});

Then('the commission setup page header is visible on owner smoke', async ({
  commissionManagementPage,
}) => {
  await commissionManagementPage.smokeExpectHeader();
});

// --- Operations manager dashboard ------------------------------------------

When('I smoke open operations manager dashboard', async ({ opsManagerDashboardPage, page }) => {
  await opsManagerDashboardPage.open();
  await capture(page, 'ops-manager-dashboard');
});

Then('the operations manager dashboard header is visible on smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectHeader();
});

Then('the Viewing Period widget is visible on ops manager dashboard smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectViewingPeriodWidget();
});

Then(
  'the Weekly Statement Processing Cycle section is visible on ops manager dashboard smoke',
  async ({ opsManagerDashboardPage }) => {
    await opsManagerDashboardPage.smokeExpectProcessingCycleSection();
  },
);

Then('the Total Received metric is visible on ops manager dashboard smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectTotalReceivedMetric();
});

Then('the Statement Stage Breakdown section is visible on ops manager dashboard smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectStatementStageBreakdown();
});

Then('the Carrier Ageing Detail section is visible on ops manager dashboard smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectCarrierAgeingDetail();
});

Then('the Exception Tracking section is visible on ops manager dashboard smoke', async ({
  opsManagerDashboardPage,
}) => {
  await opsManagerDashboardPage.smokeExpectExceptionTracking();
});

// --- Agent dashboard -------------------------------------------------------

When('I smoke open agent dashboard', async ({ agentDashboardPage, page }) => {
  await agentDashboardPage.open();
  await capture(page, 'agent-dashboard');
});

Then('the agent dashboard header is visible on smoke', async ({ agentDashboardPage }) => {
  await agentDashboardPage.smokeExpectHeader();
});

Then('the filters sidebar is visible on agent dashboard smoke', async ({ agentDashboardPage }) => {
  await agentDashboardPage.smokeExpectFiltersSidebar();
});

Then('the viewing period header is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectViewingPeriodHeader();
});

Then('the Performance Overview section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectPerformanceOverview();
});

Then('the Total Gross Commission metric is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectTotalGrossCommissionMetric();
});

Then('the Commission by Role section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectCommissionByRole();
});

Then('the Product Type Performance section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectProductTypePerformance();
});

Then('the Persistency Report section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectPersistencyReport();
});

Then('the Summary by LOB and Carrier section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectSummaryByLobCarrier();
});

Then('the Cross-Sell Metrics section is visible on agent dashboard smoke', async ({
  agentDashboardPage,
}) => {
  await agentDashboardPage.smokeExpectCrossSellMetrics();
});

// --- Agent Book of Business / Ledger ---------------------------------------

When('I smoke navigate all agent accessible pages', async ({ bookOfBusinessPage, page }) => {
  await bookOfBusinessPage.open();
  await capture(page, 'agent-pages');
});

When('I smoke navigate agent book of business', async ({ bookOfBusinessPage, page }) => {
  await bookOfBusinessPage.open();
  await capture(page, 'agent-book-of-business');
});

Then('the agent book of business page header is visible on smoke', async ({ bookOfBusinessPage }) => {
  await bookOfBusinessPage.smokeExpectHeader();
});

Then('the Book of Business heading is visible on agent book of business smoke', async ({
  bookOfBusinessPage,
}) => {
  await bookOfBusinessPage.smokeExpectHeading();
});

Then('the Book of Business data grid is visible on agent book of business smoke', async ({
  bookOfBusinessPage,
}) => {
  await bookOfBusinessPage.smokeExpectGrid();
});

When('I smoke navigate agent ledger', async ({ ledgerPage, page }) => {
  await ledgerPage.open();
  await capture(page, 'agent-ledger');
});

Then('the agent ledger page header is visible on smoke', async ({ ledgerPage }) => {
  await ledgerPage.smokeExpectHeader();
});

Then('the Ledger heading is visible on agent ledger smoke', async ({ ledgerPage }) => {
  await ledgerPage.smokeExpectHeading();
});

Then('the Ledger data grid is visible on agent ledger smoke', async ({ ledgerPage }) => {
  await ledgerPage.smokeExpectGrid();
});

When('I sign out from PieQ ICM', async ({ page }) => {
  await new ProfilePage(page).signOut();
});

Then('I am logged out of PieQ ICM', async ({ loginPage }) => {
  await loginPage.goto();
  const loggedIn = await loginPage.isLoggedIn();
  test.expect(loggedIn).toBe(false);
});
