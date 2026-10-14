import {
  Before,
  BeforeAll,
  AfterAll,
  Given,
  When,
  Then,
  test,
  closeSharedContext,
  loginWithRetry,
} from '../fixtures';
import { LoginPage } from '../../pages/auth/LoginPage';
import { IcmSidebarPage } from '../../pages/sidebar/IcmSidebarPage';
import { loadProjectEnv, smokeCredentialsForRole } from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { deleteGeneratedFiles } from '../../utils/generatedFileCleanup';

loadProjectEnv();

/**
 * Adhoc ICM sweep - agency owner.
 *
 * Read-only, recurring health sweep. Reuses the existing page objects and the
 * shared-page login helper so it stays fast and non-flaky:
 *   - one login per run (BeforeAll + loginWithRetry)
 *   - state-based assertions only (URL + page-object smoke checks, no sleeps)
 *   - nothing is created, edited, approved, paid or uploaded
 */

function requireAgencyOwner() {
  const creds = smokeCredentialsForRole('E2E_EMAIL_OWNER');
  test.skip(
    !creds,
    'Add E2E_EMAIL_OWNER and E2E_PASSWORD to .env for the adhoc agency-owner sweep',
  );
  return creds!;
}

Before({ tags: '@adhoc' }, () => {
  test.setTimeout(smokeScenarioTimeoutMs);
});

BeforeAll({ tags: '@adhoc' }, async ({ browser }) => {
  const { email, password } = requireAgencyOwner();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@adhoc' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM as agency owner in adhoc sweep', async ({ loginPage }) => {
  const { email, password } = requireAgencyOwner();
  if (await loginPage.isLoggedIn()) {
    await loginPage.ensureSession();
    return;
  }
  await loginPage.ensureLoggedInAs(email, password, 'Agency Owner');
});

Then('the agency owner dashboard is displayed in adhoc sweep', async ({ agencyOwnerDashboardPage }) => {
  await agencyOwnerDashboardPage.open();
  await agencyOwnerDashboardPage.smokeExpectHeader();
});

Then(
  'the dashboard key metrics and widgets are displayed in adhoc sweep',
  async ({ agencyOwnerDashboardPage }) => {
    await agencyOwnerDashboardPage.expectWidgetsDisplayed([
      'Key Metrics',
      'Revenue by Product Type',
      'Commission Distribution by Role',
    ]);
  },
);

Then('the main navigation is visible in adhoc sweep', async ({ page }) => {
  const sidebar = new IcmSidebarPage(page);
  await sidebar.waitForSidebar();
});

When('I open statement history in adhoc sweep', async ({ statementHistoryPage }) => {
  await statementHistoryPage.open();
});

Then('the statement history page is displayed in adhoc sweep', async ({ statementHistoryPage }) => {
  await statementHistoryPage.smokeExpectHistoryHeader();
});

When('I open payables in adhoc sweep', async ({ payablesPage }) => {
  await payablesPage.open();
});

Then('the payables grid is displayed in adhoc sweep', async ({ payablesPage }) => {
  await payablesPage.smokeExpectHeader();
});

When('I open advance overview in adhoc sweep', async ({ advanceOverviewRegressionPage }) => {
  await advanceOverviewRegressionPage.navigateToAdvanceOverview();
});

Then('the advance overview page is displayed in adhoc sweep', async ({ advanceOverviewRegressionPage }) => {
  await advanceOverviewRegressionPage.smokeExpectHeader();
});

When('I open commissions in adhoc sweep', async ({ commissionManagementPage }) => {
  await commissionManagementPage.open();
});

Then('the commissions module is displayed in adhoc sweep', async ({ commissionManagementPage }) => {
  await commissionManagementPage.smokeExpectHeader();
});

When('I open agency configuration in adhoc sweep', async ({ agencyConfigPage }) => {
  await agencyConfigPage.open();
});

Then('the agency configuration page is displayed in adhoc sweep', async ({ agencyConfigPage }) => {
  await agencyConfigPage.smokeExpectHeader();
});

When('I open products list in adhoc sweep', async ({ productsPage }) => {
  await productsPage.openList();
});

Then('the products list is displayed in adhoc sweep', async ({ productsPage }) => {
  await productsPage.smokeExpectListHeader();
});

When('I open agents list in adhoc sweep', async ({ agentsPage }) => {
  await agentsPage.openList();
});

Then('the agents list is displayed in adhoc sweep', async ({ agentsPage }) => {
  await agentsPage.smokeExpectListHeader();
});
