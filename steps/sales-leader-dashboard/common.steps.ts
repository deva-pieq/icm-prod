import { LoginPage } from '../../pages/auth/LoginPage';
import { ProfilePage } from '../../pages/auth/ProfilePage';
import {
  agency3OpsCredentials,
  loadProjectEnv,
  salesLeaderCredentials,
} from '../../utils/loadEnv';
import { smokeScenarioTimeoutMs } from '../../utils/smokeTimeouts';
import { clearSalesLeaderDashboardContext } from '../../utils/sales-leader-dashboard/salesLeaderDashboardContext';
import { clearAgentDashboardFixtureContext } from '../../utils/dashboard/agentDashboardFixtureContext';
import { deleteGeneratedFiles } from '../../utils/generatedFileCleanup';
import {
  Before,
  BeforeAll,
  AfterAll,
  Given,
  When,
  test,
  createSharedPage,
  closeSharedContext,
  loginWithRetry,
} from '../fixtures';

loadProjectEnv();

function requireSalesLeaderCredentials() {
  return salesLeaderCredentials();
}

Before({ tags: '@sales-leader-dashboard' }, () => {
  // Dual-role login + statement upload/review regularly exceeds default smoke budget.
  test.setTimeout(Math.max(smokeScenarioTimeoutMs, 1_800_000));
  clearSalesLeaderDashboardContext();
  clearAgentDashboardFixtureContext();
});

BeforeAll({ tags: '@sales-leader-dashboard' }, async ({ browser }) => {
  const { email, password } = requireSalesLeaderCredentials();
  await loginWithRetry(browser, async (page) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  });
});

AfterAll({ tags: '@sales-leader-dashboard' }, async () => {
  await closeSharedContext();
  deleteGeneratedFiles();
});

Given('I am logged into PieQ ICM for sales leader dashboard regression', async ({ loginPage }) => {
  const { email, password } = requireSalesLeaderCredentials();
  if (!(await loginPage.isLoggedIn())) {
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  } else {
    await loginPage.ensureSession();
  }
});

When(
  'I switch to Agency 3 Ops Manager login in sales leader dashboard regression',
  async ({ loginPage, page }) => {
    const { email, password } = agency3OpsCredentials();
    if (await loginPage.isLoggedIn()) {
      await new ProfilePage(page).signOut();
    }
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  },
);

When(
  'I switch to Sales Leader login in sales leader dashboard regression',
  async ({ loginPage, page }) => {
    const { email, password } = requireSalesLeaderCredentials();
    if (await loginPage.isLoggedIn()) {
      await new ProfilePage(page).signOut();
    }
    await loginPage.goto();
    await loginPage.loginWithEmailPasswordToApp(email, password);
  },
);
